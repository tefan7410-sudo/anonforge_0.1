-- Add founder verification field to product_pages
ALTER TABLE public.product_pages 
ADD COLUMN IF NOT EXISTS founder_verified boolean DEFAULT false;