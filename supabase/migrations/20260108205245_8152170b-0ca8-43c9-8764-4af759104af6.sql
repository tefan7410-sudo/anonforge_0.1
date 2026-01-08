-- Create service_status table to track the health of each service
CREATE TABLE public.service_status (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  status text NOT NULL DEFAULT 'operational' CHECK (status IN ('operational', 'degraded', 'partial_outage', 'major_outage')),
  last_check_at timestamp with time zone,
  response_time_ms integer,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create status_incidents table for incidents and maintenance announcements
CREATE TABLE public.status_incidents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical', 'maintenance')),
  is_maintenance boolean NOT NULL DEFAULT false,
  maintenance_start timestamp with time zone,
  maintenance_end timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  affected_services text[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  resolved_at timestamp with time zone,
  resolved_by uuid REFERENCES auth.users(id)
);

-- Create site_settings table for global settings like maintenance mode
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on all tables
ALTER TABLE public.service_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_status
CREATE POLICY "Anyone can view service status"
  ON public.service_status FOR SELECT
  USING (true);

CREATE POLICY "Admins can update service status"
  ON public.service_status FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert service status"
  ON public.service_status FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for status_incidents
CREATE POLICY "Anyone can view active incidents"
  ON public.status_incidents FOR SELECT
  USING (true);

CREATE POLICY "Admins can create incidents"
  ON public.status_incidents FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update incidents"
  ON public.status_incidents FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete incidents"
  ON public.status_incidents FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for site_settings
CREATE POLICY "Anyone can view site settings"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can update site settings"
  ON public.site_settings FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert site settings"
  ON public.site_settings FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at on service_status
CREATE TRIGGER update_service_status_updated_at
  BEFORE UPDATE ON public.service_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on site_settings
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default services
INSERT INTO public.service_status (service_name, display_name, status) VALUES
  ('nmkr_api', 'NMKR API', 'operational'),
  ('blockfrost_api', 'Blockfrost API', 'operational'),
  ('database', 'Database', 'operational'),
  ('storage', 'File Storage', 'operational'),
  ('auth', 'Authentication', 'operational');

-- Insert default maintenance_mode setting
INSERT INTO public.site_settings (key, value) VALUES
  ('maintenance_mode', '{"enabled": false, "message": null, "incident_id": null}'::jsonb);