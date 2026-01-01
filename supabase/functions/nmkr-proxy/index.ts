import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NMKR_API_BASE = "https://studio-api.nmkr.io/v2";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, apiKey: providedApiKey, ...params } = await req.json();
    console.log(`NMKR Proxy: action=${action}, user=${user.id}`);

    // Handle store-api-key action first (doesn't need NMKR API call)
    if (action === "store-api-key") {
      if (!providedApiKey) {
        return new Response(
          JSON.stringify({ error: "Missing apiKey" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // First validate the API key with NMKR
      const validateResponse = await fetch(`${NMKR_API_BASE}/ListProjects/all/1/1`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${providedApiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!validateResponse.ok) {
        console.error("Invalid NMKR API key provided");
        return new Response(
          JSON.stringify({ error: "Invalid NMKR API key", valid: false }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        return new Response(
          JSON.stringify({ error: "Failed to store API key" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, valid: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

      return new Response(
        JSON.stringify({ 
          success: true, 
          hasCredentials: !!credentials,
          isValid: credentials?.is_valid ?? false,
          lastValidated: credentials?.last_validated_at
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle delete-credentials action
    if (action === "delete-credentials") {
      const { error: deleteError } = await supabaseClient
        .from("user_nmkr_credentials")
        .delete()
        .eq("user_id", user.id);

      if (deleteError) {
        console.error("Error deleting credentials:", deleteError);
        return new Response(
          JSON.stringify({ error: "Failed to delete credentials" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
        return new Response(
          JSON.stringify({ error: "NMKR API key not configured. Please add your API key." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      NMKR_API_KEY = credentials.api_key;
    }

    let nmkrResponse: Response;
    let nmkrEndpoint: string;
    let nmkrMethod = "GET";
    let nmkrBody: string | undefined;

    switch (action) {
      case "validate-api-key":
        // Test API key by listing projects
        nmkrEndpoint = "/ListProjects/all/1/1";
        break;

      case "list-projects":
        nmkrEndpoint = "/ListProjects/all/100/1";
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
          return new Response(
            JSON.stringify({ error: "Missing projectUid" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        nmkrEndpoint = `/GetProjectDetails/${params.projectUid}`;
        break;

      case "get-counts":
        if (!params.projectUid) {
          return new Response(
            JSON.stringify({ error: "Missing projectUid" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        nmkrEndpoint = `/GetCounts/${params.projectUid}`;
        break;

      case "upload-nft":
        if (!params.projectUid || !params.tokenName || !params.displayName) {
          return new Response(
            JSON.stringify({ error: "Missing required fields for NFT upload" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
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
          return new Response(
            JSON.stringify({ error: "Missing projectUid" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const state = params.state || "all";
        const count = params.count || 100;
        const page = params.page || 1;
        nmkrEndpoint = `/GetNfts/${params.projectUid}/${state}/${count}/${page}`;
        break;

      case "update-pricelist":
        if (!params.projectUid || params.priceInLovelace === undefined) {
          return new Response(
            JSON.stringify({ error: "Missing projectUid or priceInLovelace" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
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
          return new Response(
            JSON.stringify({ error: "Missing projectUid or nftUid" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        nmkrEndpoint = `/GetPaymentAddressForRandomNftSale/${params.projectUid}/1/${params.customerIpHash || ""}`;
        break;

      case "get-nmkr-pay-link":
        if (!params.projectUid) {
          return new Response(
            JSON.stringify({ error: "Missing projectUid" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        nmkrEndpoint = "/GetNmkrPayLink";
        nmkrMethod = "POST";
        nmkrBody = JSON.stringify({
          projectUid: params.projectUid,
          paymentgatewayParameters: {
            customeripaddress: params.customerIp || "",
          },
        });
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    console.log(`NMKR API call: ${nmkrMethod} ${nmkrEndpoint}`);

    nmkrResponse = await fetch(`${NMKR_API_BASE}${nmkrEndpoint}`, {
      method: nmkrMethod,
      headers: {
        "Authorization": `Bearer ${NMKR_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: nmkrBody,
    });

    const responseText = await nmkrResponse.text();
    console.log(`NMKR response status: ${nmkrResponse.status}`);

    if (!nmkrResponse.ok) {
      console.error(`NMKR API error: ${responseText}`);
      return new Response(
        JSON.stringify({ 
          error: "NMKR API error", 
          details: responseText,
          status: nmkrResponse.status 
        }),
        { status: nmkrResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse response if it's JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("NMKR proxy error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
