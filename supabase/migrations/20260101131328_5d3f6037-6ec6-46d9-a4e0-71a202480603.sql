-- Drop broken policies that reference wrong column
DROP POLICY IF EXISTS "Project accessors can upload generation files" ON storage.objects;
DROP POLICY IF EXISTS "Project accessors can view generation files" ON storage.objects;
DROP POLICY IF EXISTS "Project accessors can delete generation files" ON storage.objects;

-- Recreate with correct reference to storage object 'name' (not project p.name)
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