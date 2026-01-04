-- 1. Create a public view for creator profiles WITHOUT email (excludes PII)
CREATE OR REPLACE VIEW public.public_creator_profiles AS
SELECT 
  id,
  display_name,
  avatar_url,
  twitter_handle,
  is_verified_creator,
  created_at
FROM public.profiles
WHERE is_verified_creator = true;

-- 2. Drop the problematic public policy that exposes emails
DROP POLICY IF EXISTS "Public can view verified creator profiles" ON public.profiles;

-- 3. Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.public_creator_profiles TO anon, authenticated;

-- 4. Create a function to return masked API key (never expose full key to frontend)
CREATE OR REPLACE FUNCTION public.get_masked_api_key(user_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key TEXT;
BEGIN
  -- Only allow users to get their own masked key
  IF user_uuid != auth.uid() THEN
    RETURN NULL;
  END IF;

  SELECT api_key INTO v_key
  FROM user_nmkr_credentials
  WHERE user_id = user_uuid;
  
  IF v_key IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Return masked version: first 4 + ... + last 4 chars
  RETURN LEFT(v_key, 4) || '...' || RIGHT(v_key, 4);
END;
$$;