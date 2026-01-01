import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NMKR_API_BASE = "https://studio-api.nmkr.io/v2";

// Helper to create a JSON response
function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Helper to create an error response that frontend can parse
// For NMKR downstream errors, we return 200 with success: false so the frontend can read the real error
function nmkrErrorResponse(error: string, nmkrStatus?: number, details?: string) {
  return jsonResponse({
    success: false,
    error,
    nmkrStatus,
    details,
  });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization header" }, 401);
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { action, apiKey: providedApiKey, ...params } = await req.json();
    console.log(`NMKR Proxy: action=${action}, user=${user.id}`);

    // Handle store-api-key action first (validates and stores)
    if (action === "store-api-key") {
      if (!providedApiKey) {
        return jsonResponse({ error: "Missing apiKey" }, 400);
      }

      // Validate the API key with NMKR using correct endpoint
      console.log("Validating NMKR API key...");
      const validateResponse = await fetch(`${NMKR_API_BASE}/ListProjects/1/1`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${providedApiKey}`,
          "accept": "text/plain",
        },
      });

      const validateText = await validateResponse.text();
      console.log(`NMKR validation response: status=${validateResponse.status}, body=${validateText.substring(0, 200)}`);

      if (!validateResponse.ok) {
        // Return success: false with details so frontend can show the real error
        return nmkrErrorResponse(
          "Invalid NMKR API key or validation failed",
          validateResponse.status,
          validateText
        );
      }

      // Use service role client to store the API key
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // Upsert the credentials
      const { error: upsertError } = await serviceClient
        .from("user_nmkr_credentials")
        .upsert({
          user_id: user.id,
          api_key: providedApiKey,
          is_valid: true,
          last_validated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (upsertError) {
        console.error("Error storing API key:", upsertError);
        return jsonResponse({ error: "Failed to store API key" }, 500);
      }

      return jsonResponse({ success: true, valid: true });
    }

    // Handle get-credentials action
    if (action === "get-credentials") {
      const { data: credentials, error: credError } = await supabaseClient
        .from("user_nmkr_credentials")
        .select("is_valid, last_validated_at, created_at")
        .eq("user_id", user.id)
        .single();

      if (credError && credError.code !== "PGRST116") {
        console.error("Error fetching credentials:", credError);
      }

      return jsonResponse({ 
        success: true, 
        hasCredentials: !!credentials,
        isValid: credentials?.is_valid ?? false,
        lastValidated: credentials?.last_validated_at
      });
    }

    // Handle delete-credentials action
    if (action === "delete-credentials") {
      const { error: deleteError } = await supabaseClient
        .from("user_nmkr_credentials")
        .delete()
        .eq("user_id", user.id);

      if (deleteError) {
        console.error("Error deleting credentials:", deleteError);
        return jsonResponse({ error: "Failed to delete credentials" }, 500);
      }

      return jsonResponse({ success: true });
    }

    // For all other actions, we need an API key
    let NMKR_API_KEY: string | undefined = providedApiKey;

    // If no API key provided, try to get from user's stored credentials
    if (!NMKR_API_KEY) {
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      const { data: credentials, error: credError } = await serviceClient
        .from("user_nmkr_credentials")
        .select("api_key, is_valid")
        .eq("user_id", user.id)
        .single();

      if (credError || !credentials?.api_key) {
        console.error("No API key found for user:", credError);
        return jsonResponse({ error: "NMKR API key not configured. Please add your API key." }, 400);
      }

      NMKR_API_KEY = credentials.api_key;
    }

    let nmkrEndpoint: string;
    let nmkrMethod = "GET";
    let nmkrBody: string | undefined;

    switch (action) {
      case "validate-api-key":
        // Test API key by listing projects - corrected endpoint
        nmkrEndpoint = "/ListProjects/1/1";
        break;

      case "list-projects":
        // Corrected endpoint - removed 'all'
        nmkrEndpoint = "/ListProjects/100/1";
        break;

      case "create-project":
        nmkrEndpoint = "/CreateProject";
        nmkrMethod = "POST";
        nmkrBody = JSON.stringify({
          projectname: params.projectName,
          description: params.description || "",
          policyexpires: params.policyExpires ?? false,
          addressexpiretime: params.addressExpireTime ?? 20,
          enablefiat: params.enableFiat ?? false,
          enabledecentralpayments: params.enableDecentralPayments ?? true,
          enablecrosssaleonpaymentgateway: false,
          activatealiascreation: false,
        });
        break;

      case "get-project-details":
        if (!params.projectUid) {
          return jsonResponse({ error: "Missing projectUid" }, 400);
        }
        // Corrected endpoint
        nmkrEndpoint = `/ProjectDetails/${params.projectUid}`;
        break;

      case "get-counts":
        if (!params.projectUid) {
          return jsonResponse({ error: "Missing projectUid" }, 400);
        }
        // Corrected endpoint
        nmkrEndpoint = `/Counts/${params.projectUid}`;
        break;

      case "upload-nft":
        if (!params.projectUid || !params.tokenName || !params.displayName) {
          return jsonResponse({ error: "Missing required fields for NFT upload" }, 400);
        }
        nmkrEndpoint = `/UploadNft/${params.projectUid}`;
        nmkrMethod = "POST";
        nmkrBody = JSON.stringify({
          tokenname: params.tokenName,
          displayname: params.displayName,
          description: params.description || "",
          previewImageNft: params.previewImage ? {
            mimetype: params.previewImage.mimetype || "image/png",
            fileFromBase64: params.previewImage.base64,
          } : undefined,
          metadataPlaceholder: params.metadata || [],
        });
        break;

      case "get-nfts":
        if (!params.projectUid) {
          return jsonResponse({ error: "Missing projectUid" }, 400);
        }
        const state = params.state || "all";
        const count = params.count || 100;
        const page = params.page || 1;
        nmkrEndpoint = `/GetNfts/${params.projectUid}/${state}/${count}/${page}`;
        break;

      case "update-pricelist":
        if (!params.projectUid || params.priceInLovelace === undefined) {
          return jsonResponse({ error: "Missing projectUid or priceInLovelace" }, 400);
        }
        nmkrEndpoint = `/UpdatePricelist/${params.projectUid}`;
        nmkrMethod = "PUT";
        nmkrBody = JSON.stringify([{
          priceInLovelace: params.priceInLovelace,
          isActive: true,
        }]);
        break;

      case "get-payment-address":
        if (!params.projectUid || !params.nftUid) {
          return jsonResponse({ error: "Missing projectUid or nftUid" }, 400);
        }
        nmkrEndpoint = `/GetPaymentAddressForRandomNftSale/${params.projectUid}/1/${params.customerIpHash || ""}`;
        break;

      case "get-nmkr-pay-link":
        // Generate NMKR Pay link directly - this is not an API endpoint
        if (!params.projectUid) {
          return jsonResponse({ error: "Missing projectUid" }, 400);
        }
        // Return the generated link directly
        const payLink = `https://pay.nmkr.io/?p=${params.projectUid}&c=1`;
        return jsonResponse({ success: true, data: { paymentLink: payLink } });

      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400);
    }

    console.log(`NMKR API call: ${nmkrMethod} ${nmkrEndpoint}`);

    const nmkrResponse = await fetch(`${NMKR_API_BASE}${nmkrEndpoint}`, {
      method: nmkrMethod,
      headers: {
        "Authorization": `Bearer ${NMKR_API_KEY}`,
        "Content-Type": "application/json",
        "accept": "text/plain",
      },
      body: nmkrBody,
    });

    const responseText = await nmkrResponse.text();
    console.log(`NMKR response: status=${nmkrResponse.status}, body=${responseText.substring(0, 300)}`);

    if (!nmkrResponse.ok) {
      // Return success: false with details so frontend can parse the real error
      // We return HTTP 200 so supabase.functions.invoke doesn't throw the generic error
      return nmkrErrorResponse(
        `NMKR API error (${nmkrResponse.status})`,
        nmkrResponse.status,
        responseText
      );
    }

    // Parse response if it's JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }

    return jsonResponse({ success: true, data });

  } catch (error) {
    console.error("NMKR proxy error:", error);
    return jsonResponse({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});
