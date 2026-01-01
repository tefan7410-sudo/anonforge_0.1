-- Add terms and marketing consent to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS accepted_terms_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT FALSE;

-- Create generation_comments table
CREATE TABLE public.generation_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.generation_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for generation_comments
CREATE POLICY "Users can view comments on accessible generations" ON public.generation_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.generations g
      JOIN public.projects p ON g.project_id = p.id
      WHERE g.id = generation_comments.generation_id
      AND has_project_access(p.id, auth.uid())
    )
  );

CREATE POLICY "Users can create comments on accessible generations" ON public.generation_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.generations g
      JOIN public.projects p ON g.project_id = p.id
      WHERE g.id = generation_comments.generation_id
      AND has_project_access(p.id, auth.uid())
    )
  );

CREATE POLICY "Users can delete their own comments" ON public.generation_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to auto-create notification on project invitation
CREATE OR REPLACE FUNCTION public.notify_on_project_invitation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitee_id UUID;
  project_name TEXT;
  inviter_name TEXT;
BEGIN
  -- Get the invitee's user ID from their email
  SELECT id INTO invitee_id FROM public.profiles WHERE email = NEW.email;
  
  -- Get project name
  SELECT name INTO project_name FROM public.projects WHERE id = NEW.project_id;
  
  -- Get inviter name
  SELECT COALESCE(display_name, email) INTO inviter_name FROM public.profiles WHERE id = NEW.invited_by;
  
  -- Only create notification if user exists
  IF invitee_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
    VALUES (
      invitee_id,
      'project_invite',
      'Project Invitation',
      inviter_name || ' invited you to join "' || project_name || '"',
      '/dashboard',
      jsonb_build_object('project_id', NEW.project_id, 'invitation_id', NEW.id)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for project invitation notifications
CREATE TRIGGER on_project_invitation_created
  AFTER INSERT ON public.project_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_project_invitation();