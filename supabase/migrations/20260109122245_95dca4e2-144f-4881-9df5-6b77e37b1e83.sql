-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;

-- Create new policy that allows both admin and owner roles
CREATE POLICY "Admins and owners can manage all roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner'));