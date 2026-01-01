-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  token_prefix TEXT NOT NULL DEFAULT 'Token',
  token_start_number INTEGER NOT NULL DEFAULT 1,
  settings JSONB DEFAULT '{}',
  last_modified TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_members table
CREATE TABLE public.project_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('editor', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Create project_invitations table
CREATE TABLE public.project_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('editor', 'viewer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  UNIQUE(project_id, email)
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create layers table
CREATE TABLE public.layers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  trait_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  rarity_weight NUMERIC NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create generations table
CREATE TABLE public.generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  token_id TEXT NOT NULL,
  metadata JSONB NOT NULL,
  layer_combination TEXT[] NOT NULL,
  image_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, token_id)
);

-- Create activity_logs table
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rate_limits table
CREATE TABLE public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, action_type)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Helper function to check project access
CREATE OR REPLACE FUNCTION public.has_project_access(project_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.projects WHERE id = project_uuid AND owner_id = user_uuid
  ) OR EXISTS (
    SELECT 1 FROM public.project_members WHERE project_id = project_uuid AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view their own projects"
  ON public.projects FOR SELECT
  USING (owner_id = auth.uid() OR public.has_project_access(id, auth.uid()) OR is_public = true);

CREATE POLICY "Users can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their projects"
  ON public.projects FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their projects"
  ON public.projects FOR DELETE
  USING (owner_id = auth.uid());

-- Project members policies
CREATE POLICY "Project members visible to project accessors"
  ON public.project_members FOR SELECT
  USING (public.has_project_access(project_id, auth.uid()));

CREATE POLICY "Owners can manage project members"
  ON public.project_members FOR ALL
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid()));

-- Project invitations policies
CREATE POLICY "Invitations visible to inviter and invitee"
  ON public.project_invitations FOR SELECT
  USING (invited_by = auth.uid() OR email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Owners can create invitations"
  ON public.project_invitations FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid()));

CREATE POLICY "Owners can update invitations"
  ON public.project_invitations FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid()));

CREATE POLICY "Owners can delete invitations"
  ON public.project_invitations FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid()));

-- Categories policies
CREATE POLICY "Categories visible to project accessors"
  ON public.categories FOR SELECT
  USING (public.has_project_access(project_id, auth.uid()) OR EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND is_public = true));

CREATE POLICY "Project accessors can manage categories"
  ON public.categories FOR ALL
  USING (public.has_project_access(project_id, auth.uid()));

-- Layers policies
CREATE POLICY "Layers visible to project accessors"
  ON public.layers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.categories c
      JOIN public.projects p ON p.id = c.project_id
      WHERE c.id = category_id AND (public.has_project_access(p.id, auth.uid()) OR p.is_public = true)
    )
  );

CREATE POLICY "Project accessors can manage layers"
  ON public.layers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.categories c
      WHERE c.id = category_id AND public.has_project_access(c.project_id, auth.uid())
    )
  );

-- Generations policies
CREATE POLICY "Generations visible to project accessors"
  ON public.generations FOR SELECT
  USING (public.has_project_access(project_id, auth.uid()) OR EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND is_public = true));

CREATE POLICY "Project accessors can manage generations"
  ON public.generations FOR ALL
  USING (public.has_project_access(project_id, auth.uid()));

-- Activity logs policies
CREATE POLICY "Activity logs visible to project accessors"
  ON public.activity_logs FOR SELECT
  USING (project_id IS NULL AND user_id = auth.uid() OR public.has_project_access(project_id, auth.uid()));

CREATE POLICY "Users can create activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Rate limits policies
CREATE POLICY "Users can view their own rate limits"
  ON public.rate_limits FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own rate limits"
  ON public.rate_limits FOR ALL
  USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX idx_projects_owner ON public.projects(owner_id);
CREATE INDEX idx_project_members_project ON public.project_members(project_id);
CREATE INDEX idx_project_members_user ON public.project_members(user_id);
CREATE INDEX idx_categories_project ON public.categories(project_id);
CREATE INDEX idx_layers_category ON public.layers(category_id);
CREATE INDEX idx_generations_project ON public.generations(project_id);
CREATE INDEX idx_activity_logs_project ON public.activity_logs(project_id);
CREATE INDEX idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX idx_rate_limits_user ON public.rate_limits(user_id);

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for auto-creating profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update last_modified on projects
CREATE OR REPLACE FUNCTION public.update_project_modified()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.projects SET last_modified = now() WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers for updating project last_modified
CREATE TRIGGER update_project_on_category_change
  AFTER INSERT OR UPDATE OR DELETE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_project_modified();

CREATE TRIGGER update_project_on_generation
  AFTER INSERT ON public.generations
  FOR EACH ROW EXECUTE FUNCTION public.update_project_modified();