-- Create hero_backgrounds table for admin-uploaded landing page backgrounds
CREATE TABLE public.hero_backgrounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hero_backgrounds ENABLE ROW LEVEL SECURITY;

-- Anyone can read active backgrounds (for landing page)
CREATE POLICY "Anyone can read active hero backgrounds"
  ON public.hero_backgrounds FOR SELECT
  USING (is_active = true);

-- Admins and owners can view all backgrounds (including inactive)
CREATE POLICY "Admins can view all hero backgrounds"
  ON public.hero_backgrounds FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- Admins and owners can insert hero backgrounds
CREATE POLICY "Admins can insert hero backgrounds"
  ON public.hero_backgrounds FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- Admins and owners can update hero backgrounds
CREATE POLICY "Admins can update hero backgrounds"
  ON public.hero_backgrounds FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- Admins and owners can delete hero backgrounds
CREATE POLICY "Admins can delete hero backgrounds"
  ON public.hero_backgrounds FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_hero_backgrounds_updated_at
  BEFORE UPDATE ON public.hero_backgrounds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();