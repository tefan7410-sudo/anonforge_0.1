-- Add deletion warning tracking column to projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS deletion_warning_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Enable pg_net extension for HTTP requests from cron
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;