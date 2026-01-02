-- Create product_pages table for marketing/branding information
CREATE TABLE public.product_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Branding
  banner_url TEXT,
  logo_url TEXT,
  tagline TEXT,
  
  -- Socials
  twitter_url TEXT,
  discord_url TEXT,
  website_url TEXT,
  
  -- Founder Info
  founder_name TEXT,
  founder_pfp_url TEXT,
  founder_bio TEXT,
  founder_twitter TEXT,
  
  -- Portfolio (JSONB array of past works)
  portfolio JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(project_id)
);

-- Enable RLS
ALTER TABLE public.product_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Product pages visible to project accessors" ON public.product_pages
  FOR SELECT USING (has_project_access(project_id, auth.uid()));

CREATE POLICY "Project owners can manage product pages" ON public.product_pages
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.projects WHERE projects.id = product_pages.project_id AND projects.owner_id = auth.uid()
  ));

-- Trigger for updated_at
CREATE TRIGGER update_product_pages_updated_at
  BEFORE UPDATE ON public.product_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for product page assets
INSERT INTO storage.buckets (id, name, public) VALUES ('product-assets', 'product-assets', true);

-- Storage policies for product-assets bucket
CREATE POLICY "Product assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-assets');

CREATE POLICY "Project owners can upload product assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-assets' 
  AND has_project_access(get_project_id_from_storage_path(name), auth.uid())
);

CREATE POLICY "Project owners can update product assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-assets' 
  AND has_project_access(get_project_id_from_storage_path(name), auth.uid())
);

CREATE POLICY "Project owners can delete product assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-assets' 
  AND has_project_access(get_project_id_from_storage_path(name), auth.uid())
);