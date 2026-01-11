-- Fix product_pages public access policy to respect is_hidden flag
DROP POLICY IF EXISTS "Anyone can view live product pages" ON public.product_pages;

CREATE POLICY "Anyone can view live product pages"
ON public.product_pages
FOR SELECT
USING (is_live = true AND is_hidden = false);