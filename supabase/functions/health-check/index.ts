import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ServiceCheck {
  service_name: string;
  status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage';
  response_time_ms: number | null;
  error_message: string | null;
}

async function checkNmkrApi(): Promise<ServiceCheck> {
  const startTime = Date.now();
  try {
    // Simple ping to NMKR API - just check if it responds
    const response = await fetch("https://studio-api.nmkr.io/v2/GetCounts", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok || response.status === 401) {
      // 401 means API is up but needs auth - that's fine for a health check
      return {
        service_name: 'nmkr_api',
        status: responseTime > 5000 ? 'degraded' : 'operational',
        response_time_ms: responseTime,
        error_message: null,
      };
    }
    
    return {
      service_name: 'nmkr_api',
      status: 'partial_outage',
      response_time_ms: responseTime,
      error_message: `HTTP ${response.status}`,
    };
  } catch (error: unknown) {
    return {
      service_name: 'nmkr_api',
      status: 'major_outage',
      response_time_ms: Date.now() - startTime,
      error_message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

async function checkBlockfrostApi(): Promise<ServiceCheck> {
  const startTime = Date.now();
  const blockfrostKey = Deno.env.get("BLOCKFROST_API_KEY");
  
  try {
    const response = await fetch("https://cardano-mainnet.blockfrost.io/api/v0/health", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(blockfrostKey ? { "project_id": blockfrostKey } : {}),
      },
      signal: AbortSignal.timeout(10000),
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      return {
        service_name: 'blockfrost_api',
        status: responseTime > 5000 ? 'degraded' : 'operational',
        response_time_ms: responseTime,
        error_message: null,
      };
    }
    
    return {
      service_name: 'blockfrost_api',
      status: 'partial_outage',
      response_time_ms: responseTime,
      error_message: `HTTP ${response.status}`,
    };
  } catch (error: unknown) {
    return {
      service_name: 'blockfrost_api',
      status: 'major_outage',
      response_time_ms: Date.now() - startTime,
      error_message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

async function checkDatabase(supabase: any): Promise<ServiceCheck> {
  const startTime = Date.now();
  
  try {
    const { error } = await supabase
      .from('service_status')
      .select('id')
      .limit(1);
    
    const responseTime = Date.now() - startTime;
    
    if (!error) {
      return {
        service_name: 'database',
        status: responseTime > 2000 ? 'degraded' : 'operational',
        response_time_ms: responseTime,
        error_message: null,
      };
    }
    
    return {
      service_name: 'database',
      status: 'partial_outage',
      response_time_ms: responseTime,
      error_message: error.message,
    };
  } catch (error: unknown) {
    return {
      service_name: 'database',
      status: 'major_outage',
      response_time_ms: Date.now() - startTime,
      error_message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

async function checkStorage(supabase: any): Promise<ServiceCheck> {
  const startTime = Date.now();
  
  try {
    const { error } = await supabase
      .storage
      .listBuckets();
    
    const responseTime = Date.now() - startTime;
    
    if (!error) {
      return {
        service_name: 'storage',
        status: responseTime > 3000 ? 'degraded' : 'operational',
        response_time_ms: responseTime,
        error_message: null,
      };
    }
    
    return {
      service_name: 'storage',
      status: 'partial_outage',
      response_time_ms: responseTime,
      error_message: error.message,
    };
  } catch (error: unknown) {
    return {
      service_name: 'storage',
      status: 'major_outage',
      response_time_ms: Date.now() - startTime,
      error_message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

async function checkAuth(supabase: any): Promise<ServiceCheck> {
  const startTime = Date.now();
  
  try {
    // Just check if auth endpoint responds
    const { error } = await supabase.auth.getSession();
    
    const responseTime = Date.now() - startTime;
    
    // No session is expected, we just want to verify auth service responds
    if (!error || error.message?.includes('session')) {
      return {
        service_name: 'auth',
        status: responseTime > 2000 ? 'degraded' : 'operational',
        response_time_ms: responseTime,
        error_message: null,
      };
    }
    
    return {
      service_name: 'auth',
      status: 'partial_outage',
      response_time_ms: responseTime,
      error_message: error.message,
    };
  } catch (error: unknown) {
    return {
      service_name: 'auth',
      status: 'major_outage',
      response_time_ms: Date.now() - startTime,
      error_message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Run all health checks in parallel
    const [nmkr, blockfrost, database, storage, auth] = await Promise.all([
      checkNmkrApi(),
      checkBlockfrostApi(),
      checkDatabase(supabase),
      checkStorage(supabase),
      checkAuth(supabase),
    ]);

    const results = [nmkr, blockfrost, database, storage, auth];
    const now = new Date().toISOString();

    // Update all service statuses
    for (const result of results) {
      const { error: updateError } = await supabase
        .from('service_status')
        .update({
          status: result.status,
          last_check_at: now,
          response_time_ms: result.response_time_ms,
          error_message: result.error_message,
        })
        .eq('service_name', result.service_name);

      if (updateError) {
        console.error(`Failed to update ${result.service_name}:`, updateError);
      }

      // If service went down, create an automatic incident
      if (result.status === 'major_outage' || result.status === 'partial_outage') {
        // Check if there's already an active incident for this service
        const { data: existingIncident } = await supabase
          .from('status_incidents')
          .select('id')
          .eq('is_active', true)
          .contains('affected_services', [result.service_name])
          .limit(1)
          .single();

        if (!existingIncident) {
          // Create new incident
          const serviceName = results.find(r => r.service_name === result.service_name);
          await supabase.from('status_incidents').insert({
            title: `${result.service_name === 'nmkr_api' ? 'NMKR API' : 
                    result.service_name === 'blockfrost_api' ? 'Blockfrost API' :
                    result.service_name.charAt(0).toUpperCase() + result.service_name.slice(1)} Issues Detected`,
            message: `Automated health check detected issues with ${result.service_name}: ${result.error_message || 'Service unavailable'}`,
            severity: result.status === 'major_outage' ? 'critical' : 'warning',
            is_maintenance: false,
            affected_services: [result.service_name],
          });
        }
      }
    }

    // Auto-resolve incidents if services recovered
    const { data: activeIncidents } = await supabase
      .from('status_incidents')
      .select('*')
      .eq('is_active', true)
      .eq('is_maintenance', false);

    if (activeIncidents) {
      for (const incident of activeIncidents) {
        const affectedServices = incident.affected_services || [];
        const allRecovered = affectedServices.every((serviceName: string) => {
          const service = results.find(r => r.service_name === serviceName);
          return service?.status === 'operational';
        });

        if (allRecovered && affectedServices.length > 0) {
          await supabase
            .from('status_incidents')
            .update({
              is_active: false,
              resolved_at: now,
            })
            .eq('id', incident.id);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        checked_at: now,
        results: results.map(r => ({
          service: r.service_name,
          status: r.status,
          response_time_ms: r.response_time_ms,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Health check error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
