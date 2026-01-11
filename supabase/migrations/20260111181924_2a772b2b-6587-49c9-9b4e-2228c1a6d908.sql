-- 1. Add INSERT policy for user_roles - allows users to add ambassador role to themselves
-- This is safe because ambassador is a non-privileged role
CREATE POLICY "Users can add ambassador role to themselves"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND 
  role = 'ambassador'::app_role
);

-- 2. Fix the ambassador_requests UPDATE policy
-- Drop the restrictive policy that blocks upserts when status changes
DROP POLICY IF EXISTS "Users can update own pending request" ON public.ambassador_requests;

-- Create new policy that allows users to update their own ambassador request
-- App logic controls status transitions, RLS just ensures ownership
CREATE POLICY "Users can update own ambassador request"
ON public.ambassador_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Fix existing data - add ambassador role for user who was auto-approved but role wasn't added
INSERT INTO user_roles (user_id, role)
VALUES ('e87718d2-4918-4df3-8d85-1190d42719fe', 'ambassador')
ON CONFLICT (user_id, role) DO NOTHING;