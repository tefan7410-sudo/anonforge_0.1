-- Add scheduled_launch_at column for waitlist/scheduling feature
ALTER TABLE public.product_pages 
ADD COLUMN scheduled_launch_at TIMESTAMPTZ DEFAULT NULL;

-- Add comment explaining the logic
COMMENT ON COLUMN public.product_pages.scheduled_launch_at IS 
'When set with is_live=true, collection is "upcoming" until this timestamp passes. NULL means immediately live.';