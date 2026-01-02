-- Create a function to check if user has write access (owner or editor role)
CREATE OR REPLACE FUNCTION public.has_project_write_access(project_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.projects WHERE id = project_uuid AND owner_id = user_uuid
  ) OR EXISTS (
    SELECT 1 FROM public.project_members 
    WHERE project_id = project_uuid 
    AND user_id = user_uuid 
    AND role = 'editor'
  );
END;
$$;

-- Update categories policies to restrict viewers
DROP POLICY IF EXISTS "Project accessors can manage categories" ON public.categories;

CREATE POLICY "Project accessors can view categories" 
ON public.categories 
FOR SELECT 
USING (has_project_access(project_id, auth.uid()) OR (EXISTS ( SELECT 1 FROM projects WHERE projects.id = categories.project_id AND projects.is_public = true)));

CREATE POLICY "Project writers can manage categories" 
ON public.categories 
FOR INSERT 
WITH CHECK (has_project_write_access(project_id, auth.uid()));

CREATE POLICY "Project writers can update categories" 
ON public.categories 
FOR UPDATE 
USING (has_project_write_access(project_id, auth.uid()));

CREATE POLICY "Project writers can delete categories" 
ON public.categories 
FOR DELETE 
USING (has_project_write_access(project_id, auth.uid()));

-- Update layers policies to restrict viewers
DROP POLICY IF EXISTS "Project accessors can manage layers" ON public.layers;

CREATE POLICY "Project writers can manage layers" 
ON public.layers 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM categories c
  WHERE c.id = layers.category_id 
  AND has_project_write_access(c.project_id, auth.uid())
));

CREATE POLICY "Project writers can update layers" 
ON public.layers 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM categories c
  WHERE c.id = layers.category_id 
  AND has_project_write_access(c.project_id, auth.uid())
));

CREATE POLICY "Project writers can delete layers" 
ON public.layers 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM categories c
  WHERE c.id = layers.category_id 
  AND has_project_write_access(c.project_id, auth.uid())
));

-- Update generations policies to restrict viewers
DROP POLICY IF EXISTS "Project accessors can manage generations" ON public.generations;

CREATE POLICY "Project writers can manage generations" 
ON public.generations 
FOR INSERT 
WITH CHECK (has_project_write_access(project_id, auth.uid()));

CREATE POLICY "Project writers can update generations" 
ON public.generations 
FOR UPDATE 
USING (has_project_write_access(project_id, auth.uid()));

CREATE POLICY "Project writers can delete generations" 
ON public.generations 
FOR DELETE 
USING (has_project_write_access(project_id, auth.uid()));

-- Update layer_exclusions policies to restrict viewers
DROP POLICY IF EXISTS "Project accessors can manage layer exclusions" ON public.layer_exclusions;

CREATE POLICY "Project writers can manage layer exclusions" 
ON public.layer_exclusions 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM layers l
  JOIN categories c ON c.id = l.category_id
  WHERE l.id = layer_exclusions.layer_id 
  AND has_project_write_access(c.project_id, auth.uid())
));

CREATE POLICY "Project writers can update layer exclusions" 
ON public.layer_exclusions 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM layers l
  JOIN categories c ON c.id = l.category_id
  WHERE l.id = layer_exclusions.layer_id 
  AND has_project_write_access(c.project_id, auth.uid())
));

CREATE POLICY "Project writers can delete layer exclusions" 
ON public.layer_exclusions 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM layers l
  JOIN categories c ON c.id = l.category_id
  WHERE l.id = layer_exclusions.layer_id 
  AND has_project_write_access(c.project_id, auth.uid())
));

-- Update layer_effects policies to restrict viewers
DROP POLICY IF EXISTS "Project accessors can manage layer effects" ON public.layer_effects;

CREATE POLICY "Project writers can manage layer effects" 
ON public.layer_effects 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM layers l
  JOIN categories c ON c.id = l.category_id
  WHERE l.id = layer_effects.parent_layer_id 
  AND has_project_write_access(c.project_id, auth.uid())
));

CREATE POLICY "Project writers can update layer effects" 
ON public.layer_effects 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM layers l
  JOIN categories c ON c.id = l.category_id
  WHERE l.id = layer_effects.parent_layer_id 
  AND has_project_write_access(c.project_id, auth.uid())
));

CREATE POLICY "Project writers can delete layer effects" 
ON public.layer_effects 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM layers l
  JOIN categories c ON c.id = l.category_id
  WHERE l.id = layer_effects.parent_layer_id 
  AND has_project_write_access(c.project_id, auth.uid())
));