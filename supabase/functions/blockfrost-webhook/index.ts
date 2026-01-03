import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, blockfrost-signature',
};

// HMAC-SHA256 implementation for Deno
async function hmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Verify Blockfrost webhook signature
async function verifySignature(
  payload: string,
  signatureHeader: string,
  secret: string
): Promise<boolean> {
  try {
    // Parse header: "t=1648550558,v1=162381a59..."
    const parts = signatureHeader.split(',');
    const timestampPart = parts.find(p => p.startsWith('t='));
    const signaturePart = parts.find(p => p.startsWith('v1='));
    
    if (!timestampPart || !signaturePart) {
      console.error('Invalid signature header format');
      return false;
    }
    
    const timestamp = timestampPart.slice(2);
    const signature = signaturePart.slice(3);
    
    // Check timestamp is within 10 minutes
    const timestampSeconds = parseInt(timestamp, 10);
    const nowSeconds = Math.floor(Date.now() / 1000);
    const timeDiff = nowSeconds - timestampSeconds;
    
    if (timeDiff > 600) {
      console.error(`Signature timestamp too old: ${timeDiff} seconds`);
      return false;
    }
    
    if (timeDiff < -60) {
      console.error(`Signature timestamp in future: ${timeDiff} seconds`);
      return false;
    }
    
    // Compute expected signature: HMAC-SHA256(secret, `${timestamp}.${payload}`)
    const message = `${timestamp}.${payload}`;
    const expectedSignature = await hmacSha256(secret, message);
    
    // Constant-time comparison
    if (signature.length !== expectedSignature.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    
    return result === 0;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get('BLOCKFROST_WEBHOOK_SECRET');
    const receivingAddress = Deno.env.get('CARDANO_RECEIVING_ADDRESS');
    
    if (!webhookSecret || !receivingAddress) {
      console.error('Missing required environment variables');
      return new Response('Server configuration error', { status: 500, headers: corsHeaders });
    }

    // Get raw body for signature verification
    const rawBody = await req.text();
    const signatureHeader = req.headers.get('blockfrost-signature');
    
    if (!signatureHeader) {
      console.error('Missing blockfrost-signature header');
      return new Response('Missing signature', { status: 401, headers: corsHeaders });
    }

    // Verify signature
    const isValid = await verifySignature(rawBody, signatureHeader, webhookSecret);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return new Response('Invalid signature', { status: 401, headers: corsHeaders });
    }

    console.log('Signature verified successfully');

    // Parse the webhook payload
    const payload = JSON.parse(rawBody);
    console.log('Webhook type:', payload.type);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    // We only care about transaction webhooks
    if (payload.type !== 'transaction') {
      console.log('Ignoring non-transaction webhook');
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Initialize Supabase with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Process each transaction in the payload
    const transactions = Array.isArray(payload.payload) ? payload.payload : [payload.payload];
    
    for (const tx of transactions) {
      const txHash = tx.tx?.hash || tx.hash;
      const outputs = tx.tx?.outputs || tx.outputs || [];
      
      console.log(`Processing transaction: ${txHash}`);
      console.log(`Number of outputs: ${outputs.length}`);

      // Find outputs to our receiving address
      for (const output of outputs) {
        if (output.address !== receivingAddress) {
          continue;
        }

        // Get the ADA amount (find lovelace in the amount array)
        const lovelaceAmount = output.amount?.find(
          (a: { unit: string; quantity: string }) => a.unit === 'lovelace'
        );
        
        if (!lovelaceAmount) {
          console.log('No lovelace amount found in output');
          continue;
        }

        const amountLovelace = parseInt(lovelaceAmount.quantity, 10);
        console.log(`Found payment of ${amountLovelace} lovelace to our address`);

        // Try to match with a pending payment
        const { data: result, error } = await supabase.rpc('process_ada_payment', {
          p_expected_amount_lovelace: amountLovelace,
          p_tx_hash: txHash,
        });

        if (error) {
          console.error('Error processing payment:', error);
          continue;
        }

        if (result && result.length > 0) {
          const payment = result[0];
          if (payment.already_processed) {
            console.log(`Payment ${payment.payment_id} already processed (idempotent)`);
          } else {
            console.log(`✅ Payment processed! User ${payment.user_id} received ${payment.credits_amount} credits`);
          }
        } else {
          console.log(`No matching pending payment found for ${amountLovelace} lovelace`);
        }
      }
    }

    return new Response('OK', { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response('Internal server error', { status: 500, headers: corsHeaders });
  }
});
