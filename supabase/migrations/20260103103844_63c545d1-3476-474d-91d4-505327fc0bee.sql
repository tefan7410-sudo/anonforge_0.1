-- Create trigger to sync twitter_handle to profile when verification is approved
CREATE OR REPLACE FUNCTION public.sync_verified_twitter_to_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When verification is approved, sync twitter_handle to profile
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE public.profiles
    SET twitter_handle = NEW.twitter_handle
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_verification_approved
  AFTER UPDATE ON creator_verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION sync_verified_twitter_to_profile();

-- Backfill twitter_handle for existing verified creators who don't have it set
UPDATE public.profiles p
SET twitter_handle = (
  SELECT cvr.twitter_handle 
  FROM creator_verification_requests cvr 
  WHERE cvr.user_id = p.id 
  AND cvr.status = 'approved'
  LIMIT 1
)
WHERE p.is_verified_creator = true 
AND (p.twitter_handle IS NULL OR p.twitter_handle = '');