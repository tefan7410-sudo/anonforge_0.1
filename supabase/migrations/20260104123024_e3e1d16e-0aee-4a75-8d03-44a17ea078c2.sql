-- Remove existing check constraint
ALTER TABLE public.marketing_requests 
DROP CONSTRAINT IF EXISTS marketing_requests_status_check;

-- Add updated check constraint with 'cancelled' status
ALTER TABLE public.marketing_requests 
ADD CONSTRAINT marketing_requests_status_check 
CHECK (status = ANY (ARRAY[
  'pending'::text, 
  'approved'::text, 
  'rejected'::text, 
  'active'::text, 
  'completed'::text, 
  'paid'::text,
  'cancelled'::text
]));