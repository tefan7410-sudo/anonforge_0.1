-- Add buy button settings and is_live to product_pages
ALTER TABLE public.product_pages 
ADD COLUMN IF NOT EXISTS buy_button_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS buy_button_text text DEFAULT 'Mint Now',
ADD COLUMN IF NOT EXISTS buy_button_link text,
ADD COLUMN IF NOT EXISTS is_live boolean DEFAULT false;

-- Add twitter_handle to profiles for prefill
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS twitter_handle text;

-- Add public read access for live product pages
CREATE POLICY "Public can view live product pages" ON public.product_pages
  FOR SELECT 
  USING (is_live = true);