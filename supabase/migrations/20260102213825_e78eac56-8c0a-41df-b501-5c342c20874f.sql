-- Create creator_verification_requests table
CREATE TABLE public.creator_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  twitter_handle TEXT NOT NULL,
  bio TEXT,
  portfolio_links JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Add is_verified_creator to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified_creator BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE public.creator_verification_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for creator_verification_requests
-- Users can view their own requests
CREATE POLICY "Users can view their own verification requests"
ON public.creator_verification_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create their own verification requests"
ON public.creator_verification_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending requests
CREATE POLICY "Users can update their own pending requests"
ON public.creator_verification_requests
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all requests
CREATE POLICY "Admins can view all verification requests"
ON public.creator_verification_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can update all requests
CREATE POLICY "Admins can update all verification requests"
ON public.creator_verification_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_creator_verification_requests_updated_at
BEFORE UPDATE ON public.creator_verification_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();