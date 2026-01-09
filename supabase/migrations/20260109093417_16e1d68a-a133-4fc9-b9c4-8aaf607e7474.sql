-- Add twitter_link column to promoter_requests table
ALTER TABLE public.promoter_requests 
ADD COLUMN twitter_link TEXT;