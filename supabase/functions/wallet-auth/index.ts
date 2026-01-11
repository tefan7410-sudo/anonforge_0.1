import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode as cborDecode } from "https://esm.sh/cbor-x@1.5.9";
import { verify } from "https://esm.sh/@stablelib/ed25519@1.0.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to create JSON response
function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Helper to convert hex to bytes
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// Verify CIP-8/CIP-30 signature locally
// The signature is a COSE_Sign1 structure encoded in CBOR
async function verifyCIP8Signature(
  signatureHex: string,
  keyHex: string,
  expectedPayload: string
): Promise<boolean> {
  try {
    console.log("Starting CIP-8 verification...");
    
    // Parse the COSE_Sign1 structure from the signature
    // COSE_Sign1 = [protected, unprotected, payload, signature]
    const signatureBytes = hexToBytes(signatureHex);
    const coseSign1 = cborDecode(signatureBytes);
    
    if (!Array.isArray(coseSign1) || coseSign1.length < 4) {
      console.error("Invalid COSE_Sign1 structure");
      return false;
    }
    
    const [protectedHeader, _unprotectedHeader, payload, signature] = coseSign1;
    
    // The protected header is CBOR-encoded
    const protectedHeaderDecoded = cborDecode(protectedHeader);
    console.log("Protected header:", protectedHeaderDecoded);
    
    // Get the public key from the key parameter (COSE_Key)
    const keyBytes = hexToBytes(keyHex);
    const coseKey = cborDecode(keyBytes);
    
    // COSE_Key for Ed25519: {1: 1 (OKP), 3: -8 (EdDSA), -1: 6 (Ed25519), -2: x (public key)}
    // The public key is in the -2 parameter
    let publicKeyBytes: Uint8Array;
    if (coseKey instanceof Map) {
      publicKeyBytes = coseKey.get(-2);
    } else if (typeof coseKey === 'object' && coseKey !== null) {
      publicKeyBytes = coseKey[-2] || coseKey['-2'];
    } else {
      console.error("Invalid COSE_Key structure");
      return false;
    }
    
    if (!publicKeyBytes || publicKeyBytes.length !== 32) {
      console.error("Invalid public key in COSE_Key");
      return false;
    }
    
    // Build the Sig_structure for verification
    // Sig_structure = ["Signature1", protected, external_aad, payload]
    const sigStructure = ["Signature1", protectedHeader, new Uint8Array(0), payload];
    const sigStructureBytes = cborEncode(sigStructure);
    
    // Verify the Ed25519 signature
    const isValid = verify(publicKeyBytes, sigStructureBytes, signature);
    
    if (!isValid) {
      console.error("Ed25519 signature verification failed");
      return false;
    }
    
    // Verify the payload matches what we expect
    const payloadString = new TextDecoder().decode(payload);
    if (payloadString !== expectedPayload) {
      console.error("Payload mismatch:", payloadString, "vs", expectedPayload);
      return false;
    }
    
    console.log("CIP-8 signature verified successfully");
    return true;
    
  } catch (error) {
    console.error("CIP-8 verification error:", error);
    return false;
  }
}

// Simple CBOR encoder for Sig_structure
function cborEncode(value: unknown): Uint8Array {
  const encoder = new CborEncoder();
  encoder.encode(value);
  return encoder.getBytes();
}

class CborEncoder {
  private buffer: number[] = [];
  
  encode(value: unknown): void {
    if (value === null || value === undefined) {
      this.buffer.push(0xf6); // null
    } else if (typeof value === 'string') {
      this.encodeString(value);
    } else if (value instanceof Uint8Array) {
      this.encodeBytes(value);
    } else if (Array.isArray(value)) {
      this.encodeArray(value);
    } else if (typeof value === 'number') {
      this.encodeNumber(value);
    } else {
      throw new Error(`Unsupported type: ${typeof value}`);
    }
  }
  
  private encodeNumber(n: number): void {
    if (n >= 0 && n <= 23) {
      this.buffer.push(n);
    } else if (n >= 0 && n <= 255) {
      this.buffer.push(0x18, n);
    } else {
      throw new Error(`Number too large: ${n}`);
    }
  }
  
  private encodeString(s: string): void {
    const bytes = new TextEncoder().encode(s);
    if (bytes.length <= 23) {
      this.buffer.push(0x60 + bytes.length);
    } else if (bytes.length <= 255) {
      this.buffer.push(0x78, bytes.length);
    } else {
      throw new Error(`String too long: ${bytes.length}`);
    }
    this.buffer.push(...bytes);
  }
  
  private encodeBytes(bytes: Uint8Array): void {
    if (bytes.length <= 23) {
      this.buffer.push(0x40 + bytes.length);
    } else if (bytes.length <= 255) {
      this.buffer.push(0x58, bytes.length);
    } else if (bytes.length <= 65535) {
      this.buffer.push(0x59, (bytes.length >> 8) & 0xff, bytes.length & 0xff);
    } else {
      throw new Error(`Bytes too long: ${bytes.length}`);
    }
    this.buffer.push(...bytes);
  }
  
  private encodeArray(arr: unknown[]): void {
    if (arr.length <= 23) {
      this.buffer.push(0x80 + arr.length);
    } else {
      throw new Error(`Array too long: ${arr.length}`);
    }
    for (const item of arr) {
      this.encode(item);
    }
  }
  
  getBytes(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode, signature, key, stakeAddress, paymentAddress, payload } = await req.json();

    console.log(`Wallet auth request: mode=${mode}, stakeAddress=${stakeAddress?.substring(0, 20)}...`);

    // Validate required fields
    if (!signature || !key || !stakeAddress || !payload) {
      return jsonResponse({ error: "Missing required fields" }, 400);
    }

    // Validate stake address format
    if (!stakeAddress.startsWith("stake1")) {
      return jsonResponse({ error: "Invalid stake address format" }, 400);
    }

    // Parse and validate payload
    let parsedPayload;
    try {
      parsedPayload = JSON.parse(payload);
    } catch {
      return jsonResponse({ error: "Invalid payload format" }, 400);
    }

    // Check timestamp (5 minute TTL)
    const timestamp = parsedPayload.timestamp;
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (!timestamp || now - timestamp > fiveMinutes) {
      return jsonResponse({ error: "Signature expired, please try again" }, 400);
    }

    // Verify the signature locally (no external API needed)
    const isValidSignature = await verifyCIP8Signature(
      signature,
      key,
      payload
    );

    if (!isValidSignature) {
      console.log("Signature verification failed for:", stakeAddress);
      return jsonResponse({ error: "Invalid signature" }, 401);
    }

    console.log("Signature verified successfully for:", stakeAddress);

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle "link" mode - link wallet to existing account
    if (mode === "link") {
      // Get the user from the authorization header
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return jsonResponse({ error: "Not authenticated" }, 401);
      }

      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      
      if (userError || !user) {
        return jsonResponse({ error: "Invalid session" }, 401);
      }

      // Check if this stake address is already linked to another account
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("stake_address", stakeAddress)
        .neq("id", user.id)
        .maybeSingle();

      if (existingProfile) {
        return jsonResponse({ error: "stake_address_already_linked" }, 400);
      }

      // Link wallet to user's profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          stake_address: stakeAddress,
          wallet_address: paymentAddress || null,
          wallet_connected_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Profile update error:", updateError);
        return jsonResponse({ error: "Failed to link wallet" }, 500);
      }

      console.log("Wallet linked successfully for user:", user.id);
      return jsonResponse({ success: true, message: "Wallet linked successfully" });
    }

    // Handle login/register mode
    // Look up existing user by stake address
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("stake_address", stakeAddress)
      .maybeSingle();

    if (existingProfile) {
      // User exists - log them in
      console.log("Existing user found:", existingProfile.id);

      // Generate a session for the existing user
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: existingProfile.email,
      });

      if (sessionError || !sessionData) {
        console.error("Session generation error:", sessionError);
        
        // Fallback: Create a custom token approach
        // Use signInWithPassword with a special wallet-auth flow
        const { data: signInData, error: signInError } = await supabase.auth.admin.createUser({
          email: existingProfile.email,
          email_confirm: true,
        });
        
        if (signInError && !signInError.message.includes("already been registered")) {
          return jsonResponse({ error: "Failed to authenticate" }, 500);
        }
      }

      // For existing users, we'll use a temporary password approach
      const { data: userData } = await supabase.auth.admin.getUserById(existingProfile.id);
      
      if (!userData?.user) {
        return jsonResponse({ error: "User not found in auth" }, 404);
      }

      // For a more reliable approach, let's use a different strategy
      // Create a temporary password, sign in, then remove it
      const tempPassword = crypto.randomUUID();
      
      await supabase.auth.admin.updateUserById(existingProfile.id, {
        password: tempPassword,
      });

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: existingProfile.email,
        password: tempPassword,
      });

      // Immediately update to remove password (make wallet-only)
      await supabase.auth.admin.updateUserById(existingProfile.id, {
        password: crypto.randomUUID(), // Set to random so old password doesn't work
      });

      if (authError || !authData.session) {
        console.error("Auth error:", authError);
        return jsonResponse({ error: "Failed to create session" }, 500);
      }

      return jsonResponse({
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        isNewUser: false,
      });
    }

    // New user - create account
    if (mode === "login") {
      // If explicitly logging in but no account exists
      return jsonResponse({ error: "no_account_found" }, 404);
    }

    console.log("Creating new user with wallet:", stakeAddress);

    // Generate a unique email for wallet-based accounts
    const walletEmail = `wallet_${stakeAddress.substring(6, 22)}@wallet.anonforge.com`;
    const tempPassword = crypto.randomUUID();

    // Create new user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: walletEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        wallet_auth: true,
        stake_address: stakeAddress,
      },
    });

    if (createError) {
      console.error("User creation error:", createError);
      return jsonResponse({ error: "Failed to create account" }, 500);
    }

    console.log("New user created:", newUser.user.id);

    // Update profile with wallet info
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        stake_address: stakeAddress,
        wallet_address: paymentAddress || null,
        wallet_connected_at: new Date().toISOString(),
        display_name: `Wallet ${stakeAddress.substring(6, 14)}`,
      })
      .eq("id", newUser.user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
    }

    // Sign in the new user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: walletEmail,
      password: tempPassword,
    });

    // Update password so the temp one can't be reused
    await supabase.auth.admin.updateUserById(newUser.user.id, {
      password: crypto.randomUUID(),
    });

    if (authError || !authData.session) {
      console.error("Auth error:", authError);
      return jsonResponse({ error: "Failed to create session" }, 500);
    }

    return jsonResponse({
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
      isNewUser: true,
    });

  } catch (error: unknown) {
    console.error("Wallet auth error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return jsonResponse({ error: message }, 500);
  }
});
