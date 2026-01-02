-- Layer Exclusion Rules table
CREATE TABLE public.layer_exclusions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_id uuid NOT NULL REFERENCES public.layers(id) ON DELETE CASCADE,
  excluded_layer_id uuid NOT NULL REFERENCES public.layers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(layer_id, excluded_layer_id),
  CHECK (layer_id != excluded_layer_id)
);

-- Layer Effects table (non-metadata correlated layers)
CREATE TABLE public.layer_effects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_layer_id uuid NOT NULL REFERENCES public.layers(id) ON DELETE CASCADE,
  effect_layer_id uuid NOT NULL REFERENCES public.layers(id) ON DELETE CASCADE,
  render_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(parent_layer_id, effect_layer_id),
  CHECK (parent_layer_id != effect_layer_id)
);

-- Add is_effect_layer column to layers
ALTER TABLE public.layers ADD COLUMN is_effect_layer boolean NOT NULL DEFAULT false;

-- Enable RLS
ALTER TABLE public.layer_exclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.layer_effects ENABLE ROW LEVEL SECURITY;

-- RLS for layer_exclusions: Project accessors can view and manage
CREATE POLICY "Layer exclusions visible to project accessors"
ON public.layer_exclusions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM layers l
    JOIN categories c ON c.id = l.category_id
    JOIN projects p ON p.id = c.project_id
    WHERE l.id = layer_exclusions.layer_id
    AND (has_project_access(p.id, auth.uid()) OR p.is_public = true)
  )
);

CREATE POLICY "Project accessors can manage layer exclusions"
ON public.layer_exclusions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM layers l
    JOIN categories c ON c.id = l.category_id
    WHERE l.id = layer_exclusions.layer_id
    AND has_project_access(c.project_id, auth.uid())
  )
);

-- RLS for layer_effects: Project accessors can view and manage
CREATE POLICY "Layer effects visible to project accessors"
ON public.layer_effects
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM layers l
    JOIN categories c ON c.id = l.category_id
    JOIN projects p ON p.id = c.project_id
    WHERE l.id = layer_effects.parent_layer_id
    AND (has_project_access(p.id, auth.uid()) OR p.is_public = true)
  )
);

CREATE POLICY "Project accessors can manage layer effects"
ON public.layer_effects
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM layers l
    JOIN categories c ON c.id = l.category_id
    WHERE l.id = layer_effects.parent_layer_id
    AND has_project_access(c.project_id, auth.uid())
  )
);