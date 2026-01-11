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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode, stakeAddress, paymentAddress } = await req.json();

    console.log(`Wallet auth request: mode=${mode}, stakeAddress=${stakeAddress?.substring(0, 20)}...`);

    // Validate required fields
    if (!stakeAddress) {
      return jsonResponse({ error: "Missing stake address" }, 400);
    }

    // Validate stake address format
    if (!stakeAddress.startsWith("stake1")) {
      return jsonResponse({ error: "Invalid stake address format" }, 400);
    }

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
        return jsonResponse({ 
          ok: false, 
          code: "stake_address_already_linked",
          message: "This wallet is already linked to another account"
        }, 200);
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
      // User exists - log them in using OTP-based session
      console.log("Existing user found:", existingProfile.id);

      // Generate a magic link to get the token
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: existingProfile.email,
      });

      if (linkError || !linkData?.properties?.hashed_token) {
        console.error("Link generation error:", linkError);
        return jsonResponse({ error: "Failed to generate session" }, 500);
      }

      // Use verifyOtp with the hashed token to create a session
      const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
        token_hash: linkData.properties.hashed_token,
        type: "email",
      });

      if (sessionError || !sessionData.session) {
        console.error("Session verification error:", sessionError);
        return jsonResponse({ error: "Failed to create session" }, 500);
      }

      console.log("Session created for existing user:", existingProfile.id);

      return jsonResponse({
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
        isNewUser: false,
      });
    }

    // New user - create account
    if (mode === "login") {
      // If explicitly logging in but no account exists
      // Return 200 with structured error so frontend can handle gracefully
      console.log("No account found for stake address:", stakeAddress.substring(0, 20) + "...");
      return jsonResponse({ 
        ok: false, 
        code: "no_account_found",
        attemptedStakeAddress: stakeAddress,
        message: "No account found for this wallet stake address"
      }, 200);
    }

    console.log("Creating new user with wallet:", stakeAddress);

    // Generate a unique email for wallet-based accounts
    const walletEmail = `wallet_${stakeAddress.substring(6, 22)}@wallet.anonforge.com`;

    // Create new user (no password needed for wallet auth)
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: walletEmail,
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

    // Generate a session for the new user using OTP
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: walletEmail,
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error("Link generation error:", linkError);
      return jsonResponse({ error: "Failed to generate session" }, 500);
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: "email",
    });

    if (sessionError || !sessionData.session) {
      console.error("Session verification error:", sessionError);
      return jsonResponse({ error: "Failed to create session" }, 500);
    }

    console.log("Session created for new user:", newUser.user.id);

    return jsonResponse({
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      isNewUser: true,
    });

  } catch (error: unknown) {
    console.error("Wallet auth error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return jsonResponse({ error: message }, 500);
  }
});
