import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export interface ServiceStatus {
  _id: string;
  service_name: string;
  status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage';
  last_check_at: string | null;
  error_message: string | null;
}

export interface StatusIncident {
  _id: string;
  title: string;
  description?: string;
  severity: string;
  is_active: boolean;
  affected_services?: string[];
  resolved_at: string | null;
  _creationTime: number;
}

export interface MaintenanceMode {
  enabled: boolean;
  message: string | null;
  incident_id: string | null;
}

export function useServiceStatus() {
  const services = useQuery(api.status.getServices);

  return {
    data: services as ServiceStatus[] | undefined,
    isLoading: services === undefined,
    error: null,
    refetch: () => {},
  };
}

export function useActiveIncidents() {
  const incidents = useQuery(api.status.getActiveIncidents);

  return {
    data: incidents as StatusIncident[] | undefined,
    isLoading: incidents === undefined,
    error: null,
    refetch: () => {},
  };
}

export function useIncidentHistory(days: number = 7) {
  const incidents = useQuery(api.status.getIncidentHistory, { days });

  return {
    data: incidents as StatusIncident[] | undefined,
    isLoading: incidents === undefined,
    error: null,
  };
}

export function useMaintenanceMode() {
  const maintenance = useQuery(api.status.getMaintenanceMode);

  return {
    data: maintenance as MaintenanceMode | undefined,
    isLoading: maintenance === undefined,
    error: null,
    refetch: () => {},
  };
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
      message: `Major Outage: ${majorOutages.map(s => s.service_name).join(', ')}` 
    };
  }

  if (partialOutages.length > 0) {
    return { 
      status: 'partial_outage', 
      message: `Partial Outage: ${partialOutages.map(s => s.service_name).join(', ')}` 
    };
  }

  if (degraded.length > 0) {
    return { 
      status: 'degraded', 
      message: `Degraded Performance: ${degraded.map(s => s.service_name).join(', ')}` 
    };
  }

  return { status: 'operational', message: 'All Systems Operational' };
}
