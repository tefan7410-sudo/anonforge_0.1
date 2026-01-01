-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create nmkr_projects table to link local projects with NMKR Studio projects
CREATE TABLE public.nmkr_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  nmkr_project_uid TEXT NOT NULL,
  nmkr_policy_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  network TEXT NOT NULL DEFAULT 'mainnet',
  price_in_lovelace BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  settings JSONB DEFAULT '{}',
  UNIQUE(project_id)
);

-- Create nmkr_uploads table to track individual NFT uploads
CREATE TABLE public.nmkr_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nmkr_project_id UUID NOT NULL REFERENCES public.nmkr_projects(id) ON DELETE CASCADE,
  generation_id UUID NOT NULL REFERENCES public.generations(id) ON DELETE CASCADE,
  nmkr_nft_uid TEXT,
  token_name TEXT NOT NULL,
  upload_status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(generation_id)
);

-- Enable RLS
ALTER TABLE public.nmkr_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nmkr_uploads ENABLE ROW LEVEL SECURITY;

-- RLS policies for nmkr_projects
CREATE POLICY "NMKR projects visible to project accessors"
ON public.nmkr_projects FOR SELECT
USING (has_project_access(project_id, auth.uid()));

CREATE POLICY "Project owners can manage NMKR projects"
ON public.nmkr_projects FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.projects
  WHERE projects.id = nmkr_projects.project_id
  AND projects.owner_id = auth.uid()
));

-- RLS policies for nmkr_uploads
CREATE POLICY "NMKR uploads visible to project accessors"
ON public.nmkr_uploads FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.nmkr_projects np
  WHERE np.id = nmkr_uploads.nmkr_project_id
  AND has_project_access(np.project_id, auth.uid())
));

CREATE POLICY "Project owners can manage NMKR uploads"
ON public.nmkr_uploads FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.nmkr_projects np
  JOIN public.projects p ON p.id = np.project_id
  WHERE np.id = nmkr_uploads.nmkr_project_id
  AND p.owner_id = auth.uid()
));

-- Add indexes for better performance
CREATE INDEX idx_nmkr_projects_project_id ON public.nmkr_projects(project_id);
CREATE INDEX idx_nmkr_uploads_nmkr_project_id ON public.nmkr_uploads(nmkr_project_id);
CREATE INDEX idx_nmkr_uploads_generation_id ON public.nmkr_uploads(generation_id);
CREATE INDEX idx_nmkr_uploads_status ON public.nmkr_uploads(upload_status);

-- Trigger to update updated_at
CREATE TRIGGER update_nmkr_projects_updated_at
BEFORE UPDATE ON public.nmkr_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nmkr_uploads_updated_at
BEFORE UPDATE ON public.nmkr_uploads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.nmkr_uploads;