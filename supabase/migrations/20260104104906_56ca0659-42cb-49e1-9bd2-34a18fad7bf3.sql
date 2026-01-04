-- Add slug column to product_pages for SEO-friendly URLs
ALTER TABLE public.product_pages 
ADD COLUMN slug TEXT UNIQUE;

-- Create index for fast slug lookups
CREATE INDEX idx_product_pages_slug ON public.product_pages(slug);

-- Create function to generate slug from project name
CREATE OR REPLACE FUNCTION public.generate_slug_from_name(name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '[\s]+', '-', 'g'));
END;
$$;