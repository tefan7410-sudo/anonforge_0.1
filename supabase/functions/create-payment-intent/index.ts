import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Credit tiers configuration
const CREDIT_TIERS = {
  starter: { credits: 200, priceAda: 17 },
  standard: { credits: 500, priceAda: 38 },
  premium: { credits: 1200, priceAda: 85 },
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization
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
      global: { headers: { Authorization: authHeader } },
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { tierId } = await req.json();
    
    if (!tierId || !CREDIT_TIERS[tierId as keyof typeof CREDIT_TIERS]) {
      return new Response(
        JSON.stringify({ error: 'Invalid tier ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tier = CREDIT_TIERS[tierId as keyof typeof CREDIT_TIERS];
    const receivingAddress = Deno.env.get('CARDANO_RECEIVING_ADDRESS');
    
    if (!receivingAddress) {
      console.error('Missing CARDANO_RECEIVING_ADDRESS');
      return new Response(
        JSON.stringify({ error: 'Payment system not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique dust amount (1-999999 lovelace)
    const dustAmount = Math.floor(Math.random() * 999999) + 1;
    
    // Calculate total amount in lovelace (1 ADA = 1,000,000 lovelace)
    const baseLovelace = tier.priceAda * 1_000_000;
    const totalLovelace = baseLovelace + dustAmount;
    
    // Check for existing pending payment with same dust amount (extremely rare collision)
    const { data: existingPayment } = await supabase
      .from('pending_credit_payments')
      .select('id')
      .eq('expected_amount_lovelace', totalLovelace)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (existingPayment) {
      // Regenerate if collision (extremely rare)
      const newDust = Math.floor(Math.random() * 999999) + 1;
      const newTotal = baseLovelace + newDust;
      
      const { data: payment, error: insertError } = await supabase
        .from('pending_credit_payments')
        .insert({
          user_id: user.id,
          tier_id: tierId,
          credits_amount: tier.credits,
          price_ada: tier.priceAda,
          expected_amount_lovelace: newTotal,
          dust_amount: newDust,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      console.log(`Created payment intent: ${payment.id} for ${newTotal} lovelace (user: ${user.id})`);
      
      return new Response(
        JSON.stringify({
          paymentId: payment.id,
          address: receivingAddress,
          amountLovelace: newTotal,
          amountAda: newTotal / 1_000_000,
          displayAmount: (newTotal / 1_000_000).toFixed(6),
          credits: tier.credits,
          expiresAt: payment.expires_at,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create pending payment record
    const { data: payment, error: insertError } = await supabase
      .from('pending_credit_payments')
      .insert({
        user_id: user.id,
        tier_id: tierId,
        credits_amount: tier.credits,
        price_ada: tier.priceAda,
        expected_amount_lovelace: totalLovelace,
        dust_amount: dustAmount,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    console.log(`Created payment intent: ${payment.id} for ${totalLovelace} lovelace (user: ${user.id})`);

    return new Response(
      JSON.stringify({
        paymentId: payment.id,
        address: receivingAddress,
        amountLovelace: totalLovelace,
        amountAda: totalLovelace / 1_000_000,
        displayAmount: (totalLovelace / 1_000_000).toFixed(6),
        credits: tier.credits,
        expiresAt: payment.expires_at,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create payment intent' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
