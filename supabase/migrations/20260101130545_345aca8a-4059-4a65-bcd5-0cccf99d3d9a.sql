-- Create storage bucket for generations
INSERT INTO storage.buckets (id, name, public)
VALUES ('generations', 'generations', true);

-- RLS policies for the generations bucket
CREATE POLICY "Project accessors can upload generation files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'generations' AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND has_project_access(p.id, auth.uid())
  )
);

CREATE POLICY "Project accessors can view generation files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'generations' AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND (has_project_access(p.id, auth.uid()) OR p.is_public = true)
  )
);

CREATE POLICY "Project accessors can delete generation files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'generations' AND
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND has_project_access(p.id, auth.uid())
  )
);

-- Update generations table with new columns
ALTER TABLE public.generations 
ADD COLUMN is_favorite BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN generation_type TEXT NOT NULL DEFAULT 'single',
ADD COLUMN batch_size INTEGER;

-- Add check constraint for generation_type
ALTER TABLE public.generations
ADD CONSTRAINT generations_type_check CHECK (generation_type IN ('single', 'batch'));