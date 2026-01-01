-- Create helper function in public schema to extract project_id from storage path
-- Path format: {project_id}/{category_name}/{filename}
CREATE OR REPLACE FUNCTION public.get_project_id_from_storage_path(path text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- Extract the first segment (project_id) from the path
  RETURN (split_part(path, '/', 1))::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- Drop existing overly permissive storage policies for layers bucket
DROP POLICY IF EXISTS "Enable read access for all users" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON storage.objects;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON storage.objects;

-- Drop any existing layers-specific policies
DROP POLICY IF EXISTS "Layers public read access" ON storage.objects;
DROP POLICY IF EXISTS "Layers authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Layers authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "Layers authenticated delete" ON storage.objects;
DROP POLICY IF EXISTS "layers_public_read" ON storage.objects;
DROP POLICY IF EXISTS "layers_project_upload" ON storage.objects;
DROP POLICY IF EXISTS "layers_project_update" ON storage.objects;
DROP POLICY IF EXISTS "layers_project_delete" ON storage.objects;

-- Layers bucket policies with project-based access control
-- SELECT: Public read for layers bucket (images need to be viewable in the app)
CREATE POLICY "layers_public_read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'layers');

-- INSERT: Only users with project access can upload to their project folder
CREATE POLICY "layers_project_upload"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'layers' 
  AND public.get_project_id_from_storage_path(name) IS NOT NULL
  AND public.has_project_access(public.get_project_id_from_storage_path(name), auth.uid())
);

-- UPDATE: Only users with project access can update files in their project folder
CREATE POLICY "layers_project_update"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'layers'
  AND public.get_project_id_from_storage_path(name) IS NOT NULL
  AND public.has_project_access(public.get_project_id_from_storage_path(name), auth.uid())
);

-- DELETE: Only users with project access can delete files in their project folder
CREATE POLICY "layers_project_delete"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'layers'
  AND public.get_project_id_from_storage_path(name) IS NOT NULL
  AND public.has_project_access(public.get_project_id_from_storage_path(name), auth.uid())
);