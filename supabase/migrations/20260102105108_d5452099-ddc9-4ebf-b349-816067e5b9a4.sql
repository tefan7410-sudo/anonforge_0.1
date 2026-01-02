-- Drop the restrictive policy and recreate as permissive
DROP POLICY IF EXISTS "Public can view live product pages" ON public.product_pages;

CREATE POLICY "Public can view live product pages" ON public.product_pages
  FOR SELECT
  TO public
  USING (is_live = true);

-- Allow public to read project info for live collections (needed for JOIN in marketplace query)
CREATE POLICY "Public can view projects with live product pages" ON public.projects
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.product_pages pp 
      WHERE pp.project_id = id AND pp.is_live = true
    )
  );