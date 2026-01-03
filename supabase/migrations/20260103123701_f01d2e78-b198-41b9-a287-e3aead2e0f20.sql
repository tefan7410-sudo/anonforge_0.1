-- Create operational_costs table for tracking app expenses
CREATE TABLE public.operational_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  amount_ada NUMERIC NOT NULL,
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'yearly', 'one-time')),
  start_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.operational_costs ENABLE ROW LEVEL SECURITY;

-- Only admins can manage operational costs
CREATE POLICY "Admins can view operational costs"
ON public.operational_costs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert operational costs"
ON public.operational_costs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update operational costs"
ON public.operational_costs
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete operational costs"
ON public.operational_costs
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));