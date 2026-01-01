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
    const NMKR_API_KEY = Deno.env.get("NMKR_API_KEY");
    if (!NMKR_API_KEY) {
      console.error("NMKR_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "NMKR API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    const { action, ...params } = await req.json();
    console.log(`NMKR Proxy: action=${action}, user=${user.id}`);

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
