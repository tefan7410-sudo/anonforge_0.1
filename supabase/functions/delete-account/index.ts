import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    // Get the authorization header to identify the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Delete account: No authorization header');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a Supabase client with the user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // First, verify the user with their token
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Delete account: Invalid user token', userError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Delete account: Processing deletion for user ${user.id}`);

    // Use service role client for admin operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Delete user's data in order (respecting foreign key constraints)
    // 1. Delete activity logs
    const { error: activityError } = await adminClient
      .from('activity_logs')
      .delete()
      .eq('user_id', user.id);
    
    if (activityError) {
      console.error('Delete account: Failed to delete activity logs', activityError.message);
    }

    // 2. Delete rate limits
    const { error: rateLimitError } = await adminClient
      .from('rate_limits')
      .delete()
      .eq('user_id', user.id);
    
    if (rateLimitError) {
      console.error('Delete account: Failed to delete rate limits', rateLimitError.message);
    }

    // 3. Delete project memberships (where user is a member, not owner)
    const { error: membershipError } = await adminClient
      .from('project_members')
      .delete()
      .eq('user_id', user.id);
    
    if (membershipError) {
      console.error('Delete account: Failed to delete project memberships', membershipError.message);
    }

    // 4. Cancel pending invitations sent by this user
    const { error: inviteSentError } = await adminClient
      .from('project_invitations')
      .delete()
      .eq('invited_by', user.id);
    
    if (inviteSentError) {
      console.error('Delete account: Failed to delete sent invitations', inviteSentError.message);
    }

    // 5. Get user's owned projects to delete their content
    const { data: ownedProjects, error: projectsError } = await adminClient
      .from('projects')
      .select('id')
      .eq('owner_id', user.id);

    if (projectsError) {
      console.error('Delete account: Failed to fetch owned projects', projectsError.message);
    }

    if (ownedProjects && ownedProjects.length > 0) {
      const projectIds = ownedProjects.map(p => p.id);
      
      // Delete related project data
      for (const projectId of projectIds) {
        // Delete generations
        await adminClient.from('generations').delete().eq('project_id', projectId);
        
        // Get categories to delete layers
        const { data: categories } = await adminClient
          .from('categories')
          .select('id')
          .eq('project_id', projectId);
        
        if (categories) {
          for (const category of categories) {
            await adminClient.from('layers').delete().eq('category_id', category.id);
          }
        }
        
        // Delete categories
        await adminClient.from('categories').delete().eq('project_id', projectId);
        
        // Delete project invitations
        await adminClient.from('project_invitations').delete().eq('project_id', projectId);
        
        // Delete project members
        await adminClient.from('project_members').delete().eq('project_id', projectId);
        
        // Delete activity logs for project
        await adminClient.from('activity_logs').delete().eq('project_id', projectId);
      }

      // Delete the projects themselves
      const { error: deleteProjectsError } = await adminClient
        .from('projects')
        .delete()
        .eq('owner_id', user.id);
      
      if (deleteProjectsError) {
        console.error('Delete account: Failed to delete owned projects', deleteProjectsError.message);
      }
    }

    // 6. Delete user's profile
    const { error: profileError } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', user.id);
    
    if (profileError) {
      console.error('Delete account: Failed to delete profile', profileError.message);
    }

    // 7. Delete the user from auth.users using admin API
    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(user.id);
    
    if (deleteUserError) {
      console.error('Delete account: Failed to delete auth user', deleteUserError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to delete user account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Delete account: Successfully deleted user ${user.id}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Delete account: Unexpected error', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
