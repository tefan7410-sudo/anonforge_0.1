-- Add admin approval columns to product_pages
ALTER TABLE public.product_pages 
ADD COLUMN IF NOT EXISTS admin_approved boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Create verified_twitter_handles table to prevent hijacking
CREATE TABLE IF NOT EXISTS public.verified_twitter_handles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  twitter_handle text NOT NULL,
  user_id uuid NOT NULL,
  verified_at timestamptz NOT NULL DEFAULT now(),
  verified_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(twitter_handle)
);

-- Enable RLS
ALTER TABLE public.verified_twitter_handles ENABLE ROW LEVEL SECURITY;

-- Admins can manage verified handles
CREATE POLICY "Admins can manage verified handles"
ON public.verified_twitter_handles
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Anyone can view verified handles (for validation)
CREATE POLICY "Users can view verified handles"
ON public.verified_twitter_handles
FOR SELECT USING (true);

-- Migrate existing verified twitter handles
INSERT INTO public.verified_twitter_handles (twitter_handle, user_id, verified_by, verified_at)
SELECT 
  pp.founder_twitter,
  p.owner_id,
  p.owner_id,
  pp.updated_at
FROM public.product_pages pp
JOIN public.projects p ON p.id = pp.project_id
WHERE pp.founder_verified = true 
  AND pp.founder_twitter IS NOT NULL 
  AND pp.founder_twitter != ''
ON CONFLICT (twitter_handle) DO NOTHING;