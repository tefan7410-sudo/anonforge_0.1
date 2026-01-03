import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This edge function activates marketing campaigns on their start date
// and expires pending marketing payments. It should be called daily via cron.
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Activate marketing campaigns that have reached their start date
    const { data: activatedCount, error: activateError } = await supabase.rpc(
      'activate_marketing_on_schedule'
    );

    if (activateError) {
      console.error('Error activating marketing:', activateError);
    } else {
      console.log(`Activated ${activatedCount || 0} marketing campaigns`);
    }

    // 2. Expire pending marketing payments
    const { data: expiredMarketingCount, error: expireMarketingError } = await supabase.rpc(
      'expire_pending_marketing_payments'
    );

    if (expireMarketingError) {
      console.error('Error expiring marketing payments:', expireMarketingError);
    } else {
      console.log(`Expired ${expiredMarketingCount || 0} pending marketing payments`);
    }

    // 3. Expire pending credit payments
    const { data: expiredCreditsCount, error: expireCreditsError } = await supabase.rpc(
      'expire_pending_payments'
    );

    if (expireCreditsError) {
      console.error('Error expiring credit payments:', expireCreditsError);
    } else {
      console.log(`Expired ${expiredCreditsCount || 0} pending credit payments`);
    }

    // 4. Complete marketing campaigns that have ended
    const now = new Date().toISOString();
    const { data: completedRequests, error: completeError } = await supabase
      .from('marketing_requests')
      .update({ status: 'completed' })
      .eq('status', 'active')
      .lt('end_date', now)
      .select('id, project_id');

    if (completeError) {
      console.error('Error completing marketing:', completeError);
    } else if (completedRequests && completedRequests.length > 0) {
      console.log(`Completed ${completedRequests.length} marketing campaigns`);
      
      // Remove featured status from completed projects
      for (const request of completedRequests) {
        await supabase
          .from('product_pages')
          .update({ is_featured: false, featured_until: null })
          .eq('project_id', request.project_id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        activated: activatedCount || 0,
        expiredMarketing: expiredMarketingCount || 0,
        expiredCredits: expiredCreditsCount || 0,
        completed: completedRequests?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in marketing-scheduler:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
