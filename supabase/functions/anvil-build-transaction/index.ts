import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Credit tiers with TEST pricing (1 ADA for Pro tier)
const CREDIT_TIERS: Record<string, { credits: number; priceAda: number }> = {
  'starter': { credits: 1000, priceAda: 17 },
  'popular': { credits: 2500, priceAda: 33 },
  'pro': { credits: 5000, priceAda: 1 }, // TEST: 1 ADA instead of 53
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
    const { tierId, changeAddress, utxos } = await req.json();

    console.log('Building transaction for:', { tierId, changeAddress, utxosCount: utxos?.length });

    // Validate tier
    const tier = CREDIT_TIERS[tierId];
    if (!tier) {
      return new Response(
        JSON.stringify({ error: 'Invalid tier ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate required fields
    if (!changeAddress || !utxos || !Array.isArray(utxos) || utxos.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing changeAddress or utxos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
    const amountLovelace = tier.priceAda * 1_000_000;

    console.log('Calling Anvil API to build transaction:', {
      receivingAddress,
      amountLovelace,
      changeAddress,
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

    // Create pending payment record with 'building' status
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    
    const { data: paymentRecord, error: insertError } = await supabase
      .from('pending_credit_payments')
      .insert({
        user_id: user.id,
        tier_id: tierId,
        credits_amount: tier.credits,
        price_ada: tier.priceAda,
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

    console.log('Payment record created:', paymentRecord.id);

    return new Response(
      JSON.stringify({
        paymentId: paymentRecord.id,
        unsignedTx: buildData.complete,
        tier: {
          id: tierId,
          credits: tier.credits,
          priceAda: tier.priceAda,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in anvil-build-transaction:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
