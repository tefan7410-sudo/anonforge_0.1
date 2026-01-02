-- Allow public read access to nmkr_projects for projects with live product pages
CREATE POLICY "Public can view nmkr projects with live product pages"
ON public.nmkr_projects
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM product_pages
    WHERE product_pages.project_id = nmkr_projects.project_id
    AND product_pages.is_live = true
    AND product_pages.is_hidden = false
  )
);