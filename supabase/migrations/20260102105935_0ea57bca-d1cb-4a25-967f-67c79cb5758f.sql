-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Public can view projects with live product pages" ON public.projects;

-- Create a SECURITY DEFINER function to check for live product pages (breaks recursion)
CREATE OR REPLACE FUNCTION public.project_has_live_product_page(project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM product_pages 
    WHERE product_pages.project_id = $1 
    AND product_pages.is_live = true
  );
$$;

-- Recreate the policy using the function
CREATE POLICY "Public can view projects with live product pages" ON public.projects
  FOR SELECT
  TO public
  USING (project_has_live_product_page(id));