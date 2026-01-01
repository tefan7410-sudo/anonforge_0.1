-- Add unique constraint to prevent duplicate memberships
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_members_unique 
ON public.project_members (project_id, user_id);

-- Function to get pending invitations for logged-in user (with project details)
CREATE OR REPLACE FUNCTION public.get_my_pending_invitations()
RETURNS TABLE (
  id uuid,
  project_id uuid,
  role text,
  created_at timestamptz,
  expires_at timestamptz,
  project_name text,
  project_description text,
  inviter_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pi.id,
    pi.project_id,
    pi.role,
    pi.created_at,
    pi.expires_at,
    p.name AS project_name,
    p.description AS project_description,
    COALESCE(prof.display_name, prof.email) AS inviter_name
  FROM public.project_invitations pi
  JOIN public.projects p ON p.id = pi.project_id
  LEFT JOIN public.profiles prof ON prof.id = pi.invited_by
  WHERE pi.email = (auth.jwt() ->> 'email')
    AND pi.status = 'pending'
    AND pi.expires_at > now();
END;
$$;

-- Function to accept an invitation (secure server-side)
CREATE OR REPLACE FUNCTION public.accept_project_invitation(invitation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
  user_email text;
BEGIN
  -- Get the logged-in user's email from JWT
  user_email := auth.jwt() ->> 'email';
  
  IF user_email IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Fetch the invitation
  SELECT * INTO inv
  FROM public.project_invitations
  WHERE id = invitation_id;

  IF inv IS NULL THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  IF inv.status != 'pending' THEN
    RAISE EXCEPTION 'Invitation is no longer pending';
  END IF;

  IF inv.email != user_email THEN
    RAISE EXCEPTION 'This invitation is not for you';
  END IF;

  IF inv.expires_at < now() THEN
    RAISE EXCEPTION 'Invitation has expired';
  END IF;

  -- Insert the user as a project member
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (inv.project_id, auth.uid(), inv.role)
  ON CONFLICT (project_id, user_id) DO NOTHING;

  -- Update invitation status
  UPDATE public.project_invitations
  SET status = 'accepted'
  WHERE id = invitation_id;
END;
$$;

-- Function to decline an invitation (secure server-side)
CREATE OR REPLACE FUNCTION public.decline_project_invitation(invitation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
  user_email text;
BEGIN
  user_email := auth.jwt() ->> 'email';
  
  IF user_email IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO inv
  FROM public.project_invitations
  WHERE id = invitation_id;

  IF inv IS NULL THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  IF inv.email != user_email THEN
    RAISE EXCEPTION 'This invitation is not for you';
  END IF;

  UPDATE public.project_invitations
  SET status = 'declined'
  WHERE id = invitation_id;
END;
$$;

-- Update invitation SELECT policy to use JWT email directly (more secure)
DROP POLICY IF EXISTS "Invitations visible to inviter and invitee" ON public.project_invitations;

CREATE POLICY "Invitations visible to inviter and invitee"
ON public.project_invitations
FOR SELECT
USING (
  (auth.uid() IS NOT NULL) AND (
    invited_by = auth.uid() 
    OR email = (auth.jwt() ->> 'email')
  )
);