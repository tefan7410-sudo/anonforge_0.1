-- 1. Add admin UPDATE policy for profiles
-- This allows admins and owners to update any profile (needed for verification, user management, etc.)
CREATE POLICY "Admins and owners can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role)
);

-- 2. Fix the creator_verification_requests UPDATE policy
-- Drop the old restrictive policy that only allowed updating pending requests
DROP POLICY IF EXISTS "Users can update their own pending requests" ON public.creator_verification_requests;

-- Create new policy that allows users to update their own requests
-- The WITH CHECK ensures they can only set status to 'pending' (for resubmission)
CREATE POLICY "Users can update their own requests to resubmit"
ON public.creator_verification_requests
FOR UPDATE
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- 3. Fix the affected user who was approved but not marked as verified
UPDATE profiles 
SET is_verified_creator = true 
WHERE id = 'e87718d2-4918-4df3-8d85-1190d42719fe';