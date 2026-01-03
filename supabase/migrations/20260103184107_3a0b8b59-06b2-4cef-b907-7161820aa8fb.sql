-- =============================================
-- CRITICAL SECURITY FIX: RLS Policy Remediation
-- =============================================

-- 1. Fix user_nmkr_credentials - Remove policy that exposes API keys to all authenticated users
DROP POLICY IF EXISTS "Require authentication for credentials" ON user_nmkr_credentials;

-- 2. Fix profiles - Remove overly permissive policy that exposes all user data
DROP POLICY IF EXISTS "Require authentication for profiles" ON profiles;

-- Add policy for users to always view their own profile
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Add policy for public to view verified creator profiles (needed for product pages)
CREATE POLICY "Public can view verified creator profiles"
ON profiles FOR SELECT
USING (is_verified_creator = true);

-- 3. Fix notifications - Remove overly permissive insert policy
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;

-- Create restrictive policy - users can only create notifications for themselves
-- System/edge functions use service role for backend-generated notifications
CREATE POLICY "Users can insert their own notifications"
ON notifications FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. Create admin_audit_logs table for tracking admin actions
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  action_type text NOT NULL,
  target_table text NOT NULL,
  target_id uuid,
  target_user_id uuid,
  old_values jsonb,
  new_values jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON admin_audit_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert audit logs (for client-side logging)
CREATE POLICY "Admins can insert audit logs"
ON admin_audit_logs FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = admin_user_id);

-- Create index for efficient querying
CREATE INDEX idx_admin_audit_logs_admin_user ON admin_audit_logs(admin_user_id);
CREATE INDEX idx_admin_audit_logs_action ON admin_audit_logs(action_type);
CREATE INDEX idx_admin_audit_logs_created ON admin_audit_logs(created_at DESC);