-- Create storage bucket for layer images
INSERT INTO storage.buckets (id, name, public) VALUES ('layers', 'layers', true);

-- Create storage policies for layers bucket
CREATE POLICY "Authenticated users can upload layers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'layers' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can view layers"
ON storage.objects FOR SELECT
USING (bucket_id = 'layers');

CREATE POLICY "Users can update their own layers"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'layers' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own layers"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'layers' 
  AND auth.role() = 'authenticated'
);