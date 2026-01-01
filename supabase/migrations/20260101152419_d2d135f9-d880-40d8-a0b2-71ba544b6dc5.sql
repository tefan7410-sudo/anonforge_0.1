-- Fix profiles table: Ensure anonymous users cannot access profiles
-- Drop and recreate SELECT policy with explicit auth check
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = id);

-- Fix project_invitations table: Ensure anonymous users cannot access invitations
DROP POLICY IF EXISTS "Invitations visible to inviter and invitee" ON public.project_invitations;

CREATE POLICY "Invitations visible to inviter and invitee"
ON public.project_invitations
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND (
    invited_by = auth.uid() 
    OR email = (SELECT profiles.email FROM profiles WHERE profiles.id = auth.uid())
  )
);

-- Also fix rate_limits table while we're at it (warn level finding)
DROP POLICY IF EXISTS "Users can view their own rate limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Users can manage their own rate limits" ON public.rate_limits;

CREATE POLICY "Users can view their own rate limits"
ON public.rate_limits
FOR SELECT
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can manage their own rate limits"
ON public.rate_limits
FOR ALL
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());