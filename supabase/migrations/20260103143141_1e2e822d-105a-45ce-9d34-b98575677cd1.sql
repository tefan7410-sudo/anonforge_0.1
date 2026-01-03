-- Create marketing_requests table
CREATE TABLE public.marketing_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'completed')),
  duration_days INTEGER DEFAULT 1 CHECK (duration_days >= 1 AND duration_days <= 5),
  price_ada INTEGER NOT NULL,
  message TEXT,
  admin_notes TEXT,
  hero_image_url TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add featured columns to product_pages
ALTER TABLE public.product_pages ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE public.product_pages ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;

-- Enable RLS
ALTER TABLE public.marketing_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketing_requests
CREATE POLICY "Users can view their own marketing requests"
ON public.marketing_requests
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create marketing requests for their projects"
ON public.marketing_requests
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = marketing_requests.project_id
    AND owner_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all marketing requests"
ON public.marketing_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all marketing requests"
ON public.marketing_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete marketing requests"
ON public.marketing_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Public can view active marketing for display purposes
CREATE POLICY "Public can view active marketing"
ON public.marketing_requests
FOR SELECT
USING (status = 'active');

-- Create updated_at trigger
CREATE TRIGGER update_marketing_requests_updated_at
BEFORE UPDATE ON public.marketing_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();