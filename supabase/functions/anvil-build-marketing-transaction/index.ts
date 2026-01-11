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

    // Parse request body
    const { marketingRequestId, changeAddress, utxos } = await req.json();

    console.log('Building marketing transaction for:', { marketingRequestId, changeAddress, utxosCount: utxos?.length });

    // Validate required fields
    if (!marketingRequestId || !changeAddress || !utxos || !Array.isArray(utxos) || utxos.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing marketingRequestId, changeAddress or utxos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch marketing request
    const { data: marketingRequest, error: mrError } = await supabase
      .from('marketing_requests')
      .select('*')
      .eq('id', marketingRequestId)
      .single();

    if (mrError || !marketingRequest) {
      console.error('Marketing request not found:', mrError);
      return new Response(
        JSON.stringify({ error: 'Marketing request not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user owns the request
    if (marketingRequest.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - not your request' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify request status is 'approved'
    if (marketingRequest.status !== 'approved') {
      return new Response(
        JSON.stringify({ error: `Invalid request status: ${marketingRequest.status}. Must be approved.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check within 24h payment window
    if (marketingRequest.approved_at) {
      const approvalTime = new Date(marketingRequest.approved_at);
      const deadline = new Date(approvalTime.getTime() + 24 * 60 * 60 * 1000);
      if (new Date() > deadline) {
        return new Response(
          JSON.stringify({ error: 'Payment window expired. Please submit a new request.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get receiving address and API key
    const receivingAddress = Deno.env.get('CARDANO_RECEIVING_ADDRESS');
    const anvilApiKey = Deno.env.get('ANVIL_API_KEY');

    if (!receivingAddress || !anvilApiKey) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate amount in lovelace (1 ADA = 1,000,000 lovelace)
    const priceAda = marketingRequest.price_ada;
    const amountLovelace = priceAda * 1_000_000;

    console.log('Calling Anvil API to build transaction:', {
      receivingAddress,
      amountLovelace,
      changeAddress,
      priceAda,
    });

    // Call Anvil API to build transaction
    const buildResponse = await fetch(
      'https://prod.api.ada-anvil.app/v2/services/transactions/build',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': anvilApiKey,
        },
        body: JSON.stringify({
          changeAddress: changeAddress,
          utxos: utxos,
          outputs: [{
            address: receivingAddress,
            lovelace: amountLovelace,
          }],
        }),
      }
    );

    const buildData = await buildResponse.json();

    if (!buildResponse.ok) {
      console.error('Anvil build error:', buildData);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to build transaction', 
          details: buildData.message || buildData.error || 'Unknown error'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Anvil build response:', { success: true, hasTx: !!buildData.transaction });

    // Use service role to manage pending_marketing_payments
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for existing pending payment
    const { data: existingPayment } = await adminSupabase
      .from('pending_marketing_payments')
      .select('*')
      .eq('marketing_request_id', marketingRequestId)
      .eq('status', 'pending')
      .single();

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    let paymentRecord;

    if (existingPayment) {
      // Update existing payment
      const { data: updated, error: updateError } = await adminSupabase
        .from('pending_marketing_payments')
        .update({
          expires_at: expiresAt.toISOString(),
        })
        .eq('id', existingPayment.id)
        .select()
        .single();

      if (updateError) {
        console.error('Failed to update payment record:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update payment record', details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      paymentRecord = updated;
    } else {
      // Create new pending payment record
      const { data: created, error: insertError } = await adminSupabase
        .from('pending_marketing_payments')
        .insert({
          user_id: user.id,
          marketing_request_id: marketingRequestId,
          price_ada: priceAda,
          expected_amount_lovelace: amountLovelace,
          dust_amount: 0, // No dust needed for Anvil
          status: 'pending',
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('Failed to create payment record:', insertError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to create payment record',
            details: insertError.message,
            code: insertError.code
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      paymentRecord = created;
    }

    console.log('Payment record ready:', paymentRecord.id);

    return new Response(
      JSON.stringify({
        paymentId: paymentRecord.id,
        unsignedTx: buildData.complete,
        priceAda: priceAda,
        startDate: marketingRequest.start_date,
        endDate: marketingRequest.end_date,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in anvil-build-marketing-transaction:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
