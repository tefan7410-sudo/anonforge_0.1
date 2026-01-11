import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body - Anvil flow: unsigned tx + signatures array
    const { paymentId, transaction, signatures } = await req.json();

    console.log('Submitting transaction for payment:', paymentId);
    console.log('Transaction CBOR prefix:', transaction?.substring(0, 10));
    console.log('Signatures count:', signatures?.length);

    // Validate required fields
    if (!paymentId || !transaction) {
      return new Response(
        JSON.stringify({ error: 'Missing paymentId or transaction' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!signatures || !Array.isArray(signatures) || signatures.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing signatures array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get payment record
    const { data: payment, error: fetchError } = await supabase
      .from('pending_credit_payments')
      .select('*')
      .eq('id', paymentId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !payment) {
      console.error('Payment not found:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Payment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check payment status
    if (payment.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: `Invalid payment status: ${payment.status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if expired
    if (new Date(payment.expires_at) < new Date()) {
      await supabase
        .from('pending_credit_payments')
        .update({ status: 'expired' })
        .eq('id', paymentId);
      
      return new Response(
        JSON.stringify({ error: 'Payment has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Anvil API key
    const anvilApiKey = Deno.env.get('ANVIL_API_KEY');
    if (!anvilApiKey) {
      console.error('Missing ANVIL_API_KEY');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Calling Anvil API to submit transaction...');

    // Submit unsigned transaction + signatures to Anvil (documented flow)
    const submitBody = { transaction, signatures };
    console.log('Anvil submit payload keys:', Object.keys(submitBody));
    
    const submitResponse = await fetch(
      'https://prod.api.ada-anvil.app/v2/services/transactions/submit',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': anvilApiKey,
        },
        body: JSON.stringify(submitBody),
      }
    );

    const submitData = await submitResponse.json();

    if (!submitResponse.ok) {
      console.error('Anvil submit error:', submitData);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to submit transaction', 
          details: submitData.message || submitData.error || 'Unknown error'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const txHash = submitData.hash || submitData.txHash || submitData.transactionHash;
    
    console.log('Transaction submitted successfully:', txHash);

    // Update payment record to completed
    const { error: updateError } = await supabase
      .from('pending_credit_payments')
      .update({
        status: 'completed',
        tx_hash: txHash,
        completed_at: new Date().toISOString(),
      })
      .eq('id', paymentId);

    if (updateError) {
      console.error('Failed to update payment record:', updateError);
      // Don't fail - the transaction is already submitted
    }

    // Use admin client for crediting user
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Add credits to user's purchased_credits
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('purchased_credits')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Failed to fetch profile:', profileError);
    } else {
      const newCredits = (profile.purchased_credits || 0) + payment.credits_amount;
      
      const { error: creditError } = await adminSupabase
        .from('profiles')
        .update({ purchased_credits: newCredits })
        .eq('id', user.id);

      if (creditError) {
        console.error('Failed to update credits:', creditError);
      } else {
        console.log('Credits updated successfully:', { 
          userId: user.id, 
          added: payment.credits_amount, 
          total: newCredits 
        });
      }
    }

    // Log credit transaction
    const { error: logError } = await adminSupabase
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        transaction_type: 'purchase',
        amount: payment.credits_amount,
        description: `Purchased ${payment.credits_amount} credits for ${payment.price_ada} ADA`,
      });

    if (logError) {
      console.error('Failed to log credit transaction:', logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        txHash: txHash,
        credits: payment.credits_amount,
        message: `Successfully purchased ${payment.credits_amount} credits!`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in anvil-submit-transaction:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
