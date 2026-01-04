-- Fix the SECURITY DEFINER view issue by recreating with explicit SECURITY INVOKER
DROP VIEW IF EXISTS public.public_creator_profiles;

CREATE VIEW public.public_creator_profiles 
WITH (security_invoker = true)
AS
SELECT 
  id,
  display_name,
  avatar_url,
  twitter_handle,
  is_verified_creator,
  created_at
FROM public.profiles
WHERE is_verified_creator = true;

-- Re-grant permissions
GRANT SELECT ON public.public_creator_profiles TO anon, authenticated;