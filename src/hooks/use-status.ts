import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ServiceStatus {
  id: string;
  service_name: string;
  display_name: string;
  status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage';
  last_check_at: string | null;
  response_time_ms: number | null;
  error_message: string | null;
}

export interface StatusIncident {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical' | 'maintenance';
  is_maintenance: boolean;
  maintenance_start: string | null;
  maintenance_end: string | null;
  is_active: boolean;
  affected_services: string[];
  created_at: string;
  resolved_at: string | null;
}

export interface MaintenanceMode {
  enabled: boolean;
  message: string | null;
  incident_id: string | null;
}

export function useServiceStatus() {
  return useQuery({
    queryKey: ["service-status"],
    queryFn: async (): Promise<ServiceStatus[]> => {
      const { data, error } = await supabase
        .from("service_status")
        .select("*")
        .order("display_name");

      if (error) throw error;
      return data as ServiceStatus[];
    },
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useActiveIncidents() {
  return useQuery({
    queryKey: ["active-incidents"],
    queryFn: async (): Promise<StatusIncident[]> => {
      const { data, error } = await supabase
        .from("status_incidents")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as StatusIncident[];
    },
    refetchInterval: 60000,
  });
}

export function useIncidentHistory(days: number = 7) {
  return useQuery({
    queryKey: ["incident-history", days],
    queryFn: async (): Promise<StatusIncident[]> => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const { data, error } = await supabase
        .from("status_incidents")
        .select("*")
        .eq("is_active", false)
        .gte("created_at", cutoffDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as StatusIncident[];
    },
  });
}

export function useMaintenanceMode() {
  return useQuery({
    queryKey: ["maintenance-mode"],
    queryFn: async (): Promise<MaintenanceMode> => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "maintenance_mode")
        .single();

      if (error || !data) {
        return { enabled: false, message: null, incident_id: null };
      }
      
      const value = data.value as Record<string, unknown>;
      if (typeof value !== 'object' || value === null) {
        return { enabled: false, message: null, incident_id: null };
      }
      
      return {
        enabled: Boolean(value.enabled),
        message: typeof value.message === 'string' ? value.message : null,
        incident_id: typeof value.incident_id === 'string' ? value.incident_id : null,
      };
    },
    refetchInterval: 30000, // Check more frequently for maintenance mode
  });
}

export function getOverallStatus(services: ServiceStatus[]): {
  status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage';
  message: string;
} {
  if (!services || services.length === 0) {
    return { status: 'operational', message: 'All Systems Operational' };
  }

  const majorOutages = services.filter(s => s.status === 'major_outage');
  const partialOutages = services.filter(s => s.status === 'partial_outage');
  const degraded = services.filter(s => s.status === 'degraded');

  if (majorOutages.length > 0) {
    return { 
      status: 'major_outage', 
      message: `Major Outage: ${majorOutages.map(s => s.display_name).join(', ')}` 
    };
  }

  if (partialOutages.length > 0) {
    return { 
      status: 'partial_outage', 
      message: `Partial Outage: ${partialOutages.map(s => s.display_name).join(', ')}` 
    };
  }

  if (degraded.length > 0) {
    return { 
      status: 'degraded', 
      message: `Degraded Performance: ${degraded.map(s => s.display_name).join(', ')}` 
    };
  }

  return { status: 'operational', message: 'All Systems Operational' };
}
