-- 1. Drop old RLS policies with wrong names and restrictions
DROP POLICY IF EXISTS "Admins can view all promoter requests" ON ambassador_requests;
DROP POLICY IF EXISTS "Admins can update all promoter requests" ON ambassador_requests;

-- 2. Create new RLS policies that check for BOTH admin and owner roles
CREATE POLICY "Admins and owners can view all ambassador requests"
  ON ambassador_requests FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins and owners can update all ambassador requests"
  ON ambassador_requests FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner'));

-- 3. Drop the old is_promoter helper function (no longer needed)
DROP FUNCTION IF EXISTS public.is_promoter(uuid);

-- 4. Create is_ambassador helper function for consistency
CREATE OR REPLACE FUNCTION public.is_ambassador(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'ambassador'
  )
$$;