import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address } = await req.json();

    if (!address) {
      return new Response(
        JSON.stringify({ error: 'Wallet address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const projectId = Deno.env.get('BLOCKFROST_PROJECT_ID');
    if (!projectId) {
      console.error('BLOCKFROST_PROJECT_ID not configured');
      return new Response(
        JSON.stringify({ error: 'Blockfrost not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching balance for address: ${address.substring(0, 20)}...`);

    const response = await fetch(
      `https://cardano-mainnet.blockfrost.io/api/v0/addresses/${address}`,
      {
        headers: {
          'project_id': projectId,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        // Address not found or empty - return zero balance
        console.log('Address not found or empty, returning zero balance');
        return new Response(
          JSON.stringify({
            balance_ada: 0,
            balance_lovelace: '0',
            last_updated: new Date().toISOString(),
          }),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=60',
            } 
          }
        );
      }
      
      const errorText = await response.text();
      console.error(`Blockfrost API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch wallet balance' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Find ADA balance (lovelace) from the amount array
    const lovelaceAmount = data.amount?.find((a: { unit: string; quantity: string }) => a.unit === 'lovelace');
    const balanceLovelace = lovelaceAmount?.quantity || '0';
    const balanceAda = parseInt(balanceLovelace) / 1_000_000;

    console.log(`Balance fetched: ${balanceAda} ADA`);

    return new Response(
      JSON.stringify({
        balance_ada: balanceAda,
        balance_lovelace: balanceLovelace,
        last_updated: new Date().toISOString(),
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
        } 
      }
    );
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
