-- Add explicit authentication requirement for profiles table
-- This works with existing policies to ensure unauthenticated users cannot query the table
CREATE POLICY "Require authentication for profiles"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Add explicit authentication requirement for user_nmkr_credentials table
-- Defense-in-depth alongside existing user-specific policies
CREATE POLICY "Require authentication for credentials"
  ON public.user_nmkr_credentials
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Add explicit authentication requirement for activity_logs table
-- Protects ip_hash and activity metadata from unauthenticated access
CREATE POLICY "Require authentication for activity_logs"
  ON public.activity_logs
  FOR SELECT
  USING (auth.uid() IS NOT NULL);