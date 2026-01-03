import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const INACTIVITY_WARNING_DAYS = 30;
const INACTIVITY_DELETE_DAYS = 45;

interface Project {
  id: string;
  name: string;
  owner_id: string;
  last_modified: string;
  deletion_warning_sent_at: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const warningThreshold = new Date(now.getTime() - INACTIVITY_WARNING_DAYS * 24 * 60 * 60 * 1000);
    const deleteThreshold = new Date(now.getTime() - INACTIVITY_DELETE_DAYS * 24 * 60 * 60 * 1000);

    console.log(`Running project cleanup at ${now.toISOString()}`);
    console.log(`Warning threshold: ${warningThreshold.toISOString()}`);
    console.log(`Delete threshold: ${deleteThreshold.toISOString()}`);

    // Step 1: Send warning notifications for projects inactive > 30 days
    const { data: projectsToWarn, error: warnError } = await supabase
      .from("projects")
      .select("id, name, owner_id, last_modified, deletion_warning_sent_at")
      .lt("last_modified", warningThreshold.toISOString())
      .is("deletion_warning_sent_at", null);

    if (warnError) {
      console.error("Error fetching projects to warn:", warnError);
      throw warnError;
    }

    console.log(`Found ${projectsToWarn?.length || 0} projects to warn`);

    for (const project of projectsToWarn || []) {
      console.log(`Sending warning notification for project: ${project.name} (${project.id})`);
      
      // Create notification for project owner
      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: project.owner_id,
          type: "project_inactivity_warning",
          title: "Project Inactivity Warning",
          message: `Your project "${project.name}" has been inactive for 30+ days. It will be deleted in 15 days unless you make changes.`,
          link: `/project/${project.id}`,
          metadata: { project_id: project.id, project_name: project.name }
        });

      if (notifError) {
        console.error(`Error creating notification for project ${project.id}:`, notifError);
        continue;
      }

      // Mark warning as sent
      const { error: updateError } = await supabase
        .from("projects")
        .update({ deletion_warning_sent_at: now.toISOString() })
        .eq("id", project.id);

      if (updateError) {
        console.error(`Error updating warning timestamp for project ${project.id}:`, updateError);
      }
    }

    // Step 2: Delete projects inactive > 45 days
    const { data: projectsToDelete, error: deleteError } = await supabase
      .from("projects")
      .select("id, name, owner_id, last_modified")
      .lt("last_modified", deleteThreshold.toISOString());

    if (deleteError) {
      console.error("Error fetching projects to delete:", deleteError);
      throw deleteError;
    }

    console.log(`Found ${projectsToDelete?.length || 0} projects to delete`);

    for (const project of projectsToDelete || []) {
      console.log(`Deleting inactive project: ${project.name} (${project.id})`);

      try {
        // Delete files from layers bucket
        const { data: layerFiles } = await supabase.storage
          .from("layers")
          .list(project.id);

        if (layerFiles && layerFiles.length > 0) {
          const layerPaths = layerFiles.map(f => `${project.id}/${f.name}`);
          await supabase.storage.from("layers").remove(layerPaths);
          console.log(`Deleted ${layerPaths.length} layer files for project ${project.id}`);
        }

        // Delete files from generations bucket
        const { data: genFiles } = await supabase.storage
          .from("generations")
          .list(project.id);

        if (genFiles && genFiles.length > 0) {
          const genPaths = genFiles.map(f => `${project.id}/${f.name}`);
          await supabase.storage.from("generations").remove(genPaths);
          console.log(`Deleted ${genPaths.length} generation files for project ${project.id}`);
        }

        // Delete files from product-assets bucket (if any)
        const { data: assetFiles } = await supabase.storage
          .from("product-assets")
          .list(project.id);

        if (assetFiles && assetFiles.length > 0) {
          const assetPaths = assetFiles.map(f => `${project.id}/${f.name}`);
          await supabase.storage.from("product-assets").remove(assetPaths);
          console.log(`Deleted ${assetPaths.length} product asset files for project ${project.id}`);
        }

        // Send deletion notification before deleting the project
        await supabase
          .from("notifications")
          .insert({
            user_id: project.owner_id,
            type: "project_deleted",
            title: "Project Deleted",
            message: `Your project "${project.name}" was automatically deleted due to 45+ days of inactivity.`,
            link: "/dashboard",
            metadata: { project_name: project.name }
          });

        // Delete the project (cascades to categories, layers, generations, etc.)
        const { error: projectDeleteError } = await supabase
          .from("projects")
          .delete()
          .eq("id", project.id);

        if (projectDeleteError) {
          console.error(`Error deleting project ${project.id}:`, projectDeleteError);
        } else {
          console.log(`Successfully deleted project: ${project.name} (${project.id})`);
        }
      } catch (err) {
        console.error(`Error during cleanup of project ${project.id}:`, err);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        warned: projectsToWarn?.length || 0,
        deleted: projectsToDelete?.length || 0,
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Project cleanup error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
