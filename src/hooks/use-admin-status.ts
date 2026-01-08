import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateIncidentData {
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical' | 'maintenance';
  is_maintenance: boolean;
  maintenance_start?: string;
  maintenance_end?: string;
  affected_services: string[];
}

interface UpdateServiceStatusData {
  service_name: string;
  status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage';
}

export function useCreateIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateIncidentData) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("status_incidents")
        .insert({
          ...data,
          created_by: user.user?.id,
        });

      if (error) throw error;

      // If it's a maintenance incident, update site settings
      if (data.is_maintenance) {
        const { data: incident } = await supabase
          .from("status_incidents")
          .select("id")
          .eq("title", data.title)
          .eq("is_maintenance", true)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        await supabase
          .from("site_settings")
          .update({
            value: {
              enabled: true,
              message: data.message,
              incident_id: incident?.id || null,
            },
            updated_by: user.user?.id,
          })
          .eq("key", "maintenance_mode");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-incidents"] });
      queryClient.invalidateQueries({ queryKey: ["incident-history"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-mode"] });
      toast.success("Incident created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create incident: ${error.message}`);
    },
  });
}

export function useResolveIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (incidentId: string) => {
      const { data: user } = await supabase.auth.getUser();
      
      // Get the incident first to check if it's maintenance
      const { data: incident } = await supabase
        .from("status_incidents")
        .select("is_maintenance")
        .eq("id", incidentId)
        .single();

      const { error } = await supabase
        .from("status_incidents")
        .update({
          is_active: false,
          resolved_at: new Date().toISOString(),
          resolved_by: user.user?.id,
        })
        .eq("id", incidentId);

      if (error) throw error;

      // If it was a maintenance incident, disable maintenance mode
      if (incident?.is_maintenance) {
        await supabase
          .from("site_settings")
          .update({
            value: {
              enabled: false,
              message: null,
              incident_id: null,
            },
            updated_by: user.user?.id,
          })
          .eq("key", "maintenance_mode");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-incidents"] });
      queryClient.invalidateQueries({ queryKey: ["incident-history"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-mode"] });
      toast.success("Incident resolved");
    },
    onError: (error) => {
      toast.error(`Failed to resolve incident: ${error.message}`);
    },
  });
}

export function useUpdateServiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateServiceStatusData) => {
      const { error } = await supabase
        .from("service_status")
        .update({
          status: data.status,
          last_check_at: new Date().toISOString(),
        })
        .eq("service_name", data.service_name);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-status"] });
      toast.success("Service status updated");
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });
}

export function useToggleMaintenanceMode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ enabled, message }: { enabled: boolean; message?: string }) => {
      const { data: user } = await supabase.auth.getUser();

      if (enabled) {
        // Create a maintenance incident
        const { data: incident, error: incidentError } = await supabase
          .from("status_incidents")
          .insert({
            title: "Scheduled Maintenance",
            message: message || "The site is currently undergoing maintenance. Please check back soon.",
            severity: 'maintenance',
            is_maintenance: true,
            affected_services: [],
            created_by: user.user?.id,
          })
          .select("id")
          .single();

        if (incidentError) throw incidentError;

        const { error } = await supabase
          .from("site_settings")
          .update({
            value: {
              enabled: true,
              message: message || "The site is currently undergoing maintenance.",
              incident_id: incident.id,
            },
            updated_by: user.user?.id,
          })
          .eq("key", "maintenance_mode");

        if (error) throw error;
      } else {
        // Get current incident id and resolve it
        const { data: settings } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "maintenance_mode")
          .single();

        const incidentId = (settings?.value as any)?.incident_id;

        if (incidentId) {
          await supabase
            .from("status_incidents")
            .update({
              is_active: false,
              resolved_at: new Date().toISOString(),
              resolved_by: user.user?.id,
            })
            .eq("id", incidentId);
        }

        const { error } = await supabase
          .from("site_settings")
          .update({
            value: {
              enabled: false,
              message: null,
              incident_id: null,
            },
            updated_by: user.user?.id,
          })
          .eq("key", "maintenance_mode");

        if (error) throw error;
      }
    },
    onSuccess: (_, { enabled }) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-mode"] });
      queryClient.invalidateQueries({ queryKey: ["active-incidents"] });
      queryClient.invalidateQueries({ queryKey: ["incident-history"] });
      toast.success(enabled ? "Maintenance mode enabled" : "Maintenance mode disabled");
    },
    onError: (error) => {
      toast.error(`Failed to toggle maintenance mode: ${error.message}`);
    },
  });
}

export function useDeleteIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (incidentId: string) => {
      const { error } = await supabase
        .from("status_incidents")
        .delete()
        .eq("id", incidentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-incidents"] });
      queryClient.invalidateQueries({ queryKey: ["incident-history"] });
      toast.success("Incident deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete incident: ${error.message}`);
    },
  });
}

export function useTriggerHealthCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/health-check`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to trigger health check");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-status"] });
      toast.success("Health check completed");
    },
    onError: (error) => {
      toast.error(`Health check failed: ${error.message}`);
    },
  });
}
