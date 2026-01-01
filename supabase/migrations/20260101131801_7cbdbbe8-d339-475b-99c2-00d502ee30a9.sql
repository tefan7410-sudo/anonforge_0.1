-- Drop existing broken policies
DROP POLICY IF EXISTS "Project accessors can upload generation files" ON storage.objects;
DROP POLICY IF EXISTS "Project accessors can view generation files" ON storage.objects;
DROP POLICY IF EXISTS "Project accessors can delete generation files" ON storage.objects;

-- Recreate with explicit storage.objects.name reference to avoid column ambiguity
CREATE POLICY "Project accessors can upload generation files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'generations' AND
  has_project_access(
    ((storage.foldername(storage.objects.name))[1])::uuid,
    auth.uid()
  )
);

CREATE POLICY "Project accessors can view generation files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'generations' AND
  (
    has_project_access(
      ((storage.foldername(storage.objects.name))[1])::uuid,
      auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id::text = (storage.foldername(storage.objects.name))[1]
      AND p.is_public = true
    )
  )
);

CREATE POLICY "Project accessors can delete generation files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'generations' AND
  has_project_access(
    ((storage.foldername(storage.objects.name))[1])::uuid,
    auth.uid()
  )
);