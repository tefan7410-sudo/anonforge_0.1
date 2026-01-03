-- Create layer_switches table for storing layer pair swap rules
CREATE TABLE public.layer_switches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  layer_a_id UUID NOT NULL REFERENCES public.layers(id) ON DELETE CASCADE,
  layer_b_id UUID NOT NULL REFERENCES public.layers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Ensure we don't have duplicate pairs (normalized: layer_a_id < layer_b_id)
  CONSTRAINT layer_switches_unique_pair UNIQUE (layer_a_id, layer_b_id),
  -- Prevent self-referencing
  CONSTRAINT layer_switches_no_self_ref CHECK (layer_a_id != layer_b_id)
);

-- Enable Row Level Security
ALTER TABLE public.layer_switches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Layer switches visible to project accessors"
ON public.layer_switches
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM layers l
    JOIN categories c ON c.id = l.category_id
    JOIN projects p ON p.id = c.project_id
    WHERE l.id = layer_switches.layer_a_id
    AND (has_project_access(p.id, auth.uid()) OR p.is_public = true)
  )
);

CREATE POLICY "Project writers can manage layer switches"
ON public.layer_switches
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM layers l
    JOIN categories c ON c.id = l.category_id
    WHERE l.id = layer_switches.layer_a_id
    AND has_project_write_access(c.project_id, auth.uid())
  )
);

CREATE POLICY "Project writers can update layer switches"
ON public.layer_switches
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM layers l
    JOIN categories c ON c.id = l.category_id
    WHERE l.id = layer_switches.layer_a_id
    AND has_project_write_access(c.project_id, auth.uid())
  )
);

CREATE POLICY "Project writers can delete layer switches"
ON public.layer_switches
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM layers l
    JOIN categories c ON c.id = l.category_id
    WHERE l.id = layer_switches.layer_a_id
    AND has_project_write_access(c.project_id, auth.uid())
  )
);

-- Create index for faster lookups
CREATE INDEX idx_layer_switches_layer_a ON public.layer_switches(layer_a_id);
CREATE INDEX idx_layer_switches_layer_b ON public.layer_switches(layer_b_id);