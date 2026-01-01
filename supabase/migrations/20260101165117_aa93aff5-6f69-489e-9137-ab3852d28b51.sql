-- 1. Drop and recreate the trigger for invitation notifications (in case it exists but isn't working)
DROP TRIGGER IF EXISTS on_project_invitation_created ON public.project_invitations;

CREATE TRIGGER on_project_invitation_created
  AFTER INSERT ON public.project_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_project_invitation();

-- 2. Prevent duplicate pending invitations (drop if exists first)
DROP INDEX IF EXISTS unique_pending_invitation;

CREATE UNIQUE INDEX unique_pending_invitation 
  ON public.project_invitations (project_id, email) 
  WHERE status = 'pending';

-- 3. Update Profiles RLS for team visibility
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view profiles of project collaborators" ON public.profiles
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND (
      auth.uid() = id 
      OR 
      EXISTS (
        SELECT 1 FROM public.project_members pm1
        JOIN public.project_members pm2 ON pm1.project_id = pm2.project_id
        WHERE pm1.user_id = auth.uid() AND pm2.user_id = profiles.id
      )
      OR
      EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.project_members pm ON pm.project_id = p.id
        WHERE pm.user_id = auth.uid() AND p.owner_id = profiles.id
      )
      OR
      EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.project_members pm ON pm.project_id = p.id
        WHERE p.owner_id = auth.uid() AND pm.user_id = profiles.id
      )
    )
  );

-- 4. Create function and trigger for pending invitations on user registration
CREATE OR REPLACE FUNCTION public.create_notifications_for_pending_invitations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
  project_name TEXT;
  inviter_name TEXT;
BEGIN
  FOR inv IN 
    SELECT * FROM public.project_invitations 
    WHERE email = NEW.email AND status = 'pending'
  LOOP
    SELECT name INTO project_name FROM public.projects WHERE id = inv.project_id;
    SELECT COALESCE(display_name, email) INTO inviter_name 
    FROM public.profiles WHERE id = inv.invited_by;
    
    INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
    VALUES (
      NEW.id,
      'project_invite',
      'Project Invitation',
      inviter_name || ' invited you to join "' || project_name || '"',
      '/dashboard',
      jsonb_build_object('project_id', inv.project_id, 'invitation_id', inv.id)
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created_check_invitations ON public.profiles;

CREATE TRIGGER on_profile_created_check_invitations
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_notifications_for_pending_invitations();