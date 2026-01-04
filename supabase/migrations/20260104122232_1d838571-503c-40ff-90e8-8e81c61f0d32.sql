-- Add is_free_promo column to marketing_requests table
ALTER TABLE public.marketing_requests 
ADD COLUMN is_free_promo boolean DEFAULT false;