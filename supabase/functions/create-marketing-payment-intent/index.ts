import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with user's JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { marketingRequestId } = await req.json();
    if (!marketingRequestId) {
      return new Response(
        JSON.stringify({ error: 'Marketing request ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the marketing request
    const { data: marketingRequest, error: fetchError } = await supabase
      .from('marketing_requests')
      .select('id, user_id, price_ada, status, approved_at, start_date, end_date')
      .eq('id', marketingRequestId)
      .single();

    if (fetchError || !marketingRequest) {
      console.error('Error fetching marketing request:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Marketing request not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user owns this request
    if (marketingRequest.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify request is approved
    if (marketingRequest.status !== 'approved') {
      return new Response(
        JSON.stringify({ error: 'Marketing request is not approved' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if within 24h window
    if (marketingRequest.approved_at) {
      const approvedAt = new Date(marketingRequest.approved_at);
      const now = new Date();
      const hoursSinceApproval = (now.getTime() - approvedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceApproval > 24) {
        return new Response(
          JSON.stringify({ error: 'Payment window has expired (24 hours)' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get receiving address
    const receivingAddress = Deno.env.get('CARDANO_RECEIVING_ADDRESS');
    if (!receivingAddress) {
      console.error('CARDANO_RECEIVING_ADDRESS not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role for DB operations
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for existing pending payment for this marketing request (session persistence)
    const { data: existingPayment } = await adminSupabase
      .from('pending_marketing_payments')
      .select('*')
      .eq('marketing_request_id', marketingRequestId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (existingPayment) {
      // Return existing payment intent instead of creating new one
      console.log(`Returning existing payment intent: ${existingPayment.id}`);
      const existingAmountAda = existingPayment.expected_amount_lovelace / 1_000_000;
      return new Response(
        JSON.stringify({
          paymentId: existingPayment.id,
          address: receivingAddress,
          amountAda: existingAmountAda.toFixed(6),
          amountLovelace: existingPayment.expected_amount_lovelace,
          priceAda: existingPayment.price_ada,
          dustAmount: existingPayment.dust_amount,
          expiresAt: existingPayment.expires_at,
          startDate: marketingRequest.start_date,
          endDate: marketingRequest.end_date,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const priceAda = marketingRequest.price_ada;
    const baseLovelace = priceAda * 1_000_000;

    // Generate random dust amount (1-999999 lovelace = 0.000001-0.999999 ADA)
    const dustAmount = Math.floor(Math.random() * 999999) + 1;
    const totalLovelace = baseLovelace + dustAmount;

    // Check if there's already a pending payment with this exact amount (collision prevention)
    const { data: amountCollision } = await adminSupabase
      .from('pending_marketing_payments')
      .select('id')
      .eq('expected_amount_lovelace', totalLovelace)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (amountCollision) {
      // Very rare collision, regenerate
      const newDust = Math.floor(Math.random() * 999999) + 1;
      const newTotal = baseLovelace + newDust;
      
      const { data: payment, error: insertError } = await adminSupabase
        .from('pending_marketing_payments')
        .insert({
          user_id: user.id,
          marketing_request_id: marketingRequestId,
          price_ada: priceAda,
          expected_amount_lovelace: newTotal,
          dust_amount: newDust,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating payment:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create payment' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const amountAda = newTotal / 1_000_000;

      return new Response(
        JSON.stringify({
          paymentId: payment.id,
          address: receivingAddress,
          amountAda: amountAda.toFixed(6),
          amountLovelace: newTotal,
          priceAda: priceAda,
          dustAmount: newDust,
          expiresAt: payment.expires_at,
          startDate: marketingRequest.start_date,
          endDate: marketingRequest.end_date,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create pending payment record
    const { data: payment, error: insertError } = await adminSupabase
      .from('pending_marketing_payments')
      .insert({
        user_id: user.id,
        marketing_request_id: marketingRequestId,
        price_ada: priceAda,
        expected_amount_lovelace: totalLovelace,
        dust_amount: dustAmount,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating payment:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create payment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const amountAda = totalLovelace / 1_000_000;

    console.log(`Created marketing payment intent: ${payment.id} for ${amountAda} ADA (${totalLovelace} lovelace)`);

    return new Response(
      JSON.stringify({
        paymentId: payment.id,
        address: receivingAddress,
        amountAda: amountAda.toFixed(6),
        amountLovelace: totalLovelace,
        priceAda: priceAda,
        dustAmount: dustAmount,
        expiresAt: payment.expires_at,
        startDate: marketingRequest.start_date,
        endDate: marketingRequest.end_date,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
