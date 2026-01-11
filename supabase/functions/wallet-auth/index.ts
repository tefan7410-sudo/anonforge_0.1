import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// Verify CIP-8 signature using Anvil API
async function verifyCIP8Signature(
  stakeAddress: string,
  signature: string,
  key: string,
  payload: string,
  anvilApiKey: string
): Promise<boolean> {
  try {
    // Use Anvil API to verify the CIP-8 signature
    const response = await fetch("https://api.ada-anvil.app/v2/services/verify-signature", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": anvilApiKey,
      },
      body: JSON.stringify({
        address: stakeAddress,
        signature,
        key,
        message: payload,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anvil API error:", response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log("Signature verification result:", result);
    
    return result.valid === true || result.isValid === true;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
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

    // Get Anvil API key
    const anvilApiKey = Deno.env.get("ANVIL_API_KEY");
    if (!anvilApiKey) {
      console.error("ANVIL_API_KEY not configured");
      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    // Verify the signature
    const isValidSignature = await verifyCIP8Signature(
      stakeAddress,
      signature,
      key,
      payload,
      anvilApiKey
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
