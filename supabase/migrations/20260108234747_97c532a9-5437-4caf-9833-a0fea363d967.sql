-- Create art_fund_settings table (single row for wallet config)
CREATE TABLE public.art_fund_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create art_fund_sources table
CREATE TABLE public.art_fund_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  amount_ada numeric NOT NULL DEFAULT 0,
  category text NOT NULL CHECK (category IN ('fees', 'special_sale', 'donation', 'other')),
  source_date date NOT NULL DEFAULT CURRENT_DATE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.art_fund_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.art_fund_sources ENABLE ROW LEVEL SECURITY;

-- Public read access for art_fund_settings
CREATE POLICY "Anyone can view art fund settings"
ON public.art_fund_settings FOR SELECT
USING (true);

-- Admin write access for art_fund_settings
CREATE POLICY "Admins can update art fund settings"
ON public.art_fund_settings FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert art fund settings"
ON public.art_fund_settings FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Public read access for art_fund_sources
CREATE POLICY "Anyone can view art fund sources"
ON public.art_fund_sources FOR SELECT
USING (true);

-- Admin write access for art_fund_sources
CREATE POLICY "Admins can insert art fund sources"
ON public.art_fund_sources FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update art fund sources"
ON public.art_fund_sources FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete art fund sources"
ON public.art_fund_sources FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create updated_at triggers
CREATE TRIGGER update_art_fund_settings_updated_at
BEFORE UPDATE ON public.art_fund_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_art_fund_sources_updated_at
BEFORE UPDATE ON public.art_fund_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings row
INSERT INTO public.art_fund_settings (wallet_address, description)
VALUES ('', 'Supporting indie artists on Cardano. All profits beyond infrastructure and operational costs go directly to this fund.');