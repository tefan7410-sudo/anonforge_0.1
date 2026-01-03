-- Add approved_at column to track when admin approved (for 24h payment window)
ALTER TABLE public.marketing_requests 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;