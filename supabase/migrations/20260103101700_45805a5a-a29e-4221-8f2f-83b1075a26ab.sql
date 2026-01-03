-- Allow admins to view all user_credits
CREATE POLICY "Admins can view all user credits"
  ON user_credits FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update all user_credits  
CREATE POLICY "Admins can update all user credits"
  ON user_credits FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all credit_transactions
CREATE POLICY "Admins can view all credit transactions"
  ON credit_transactions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to insert credit adjustments
CREATE POLICY "Admins can insert credit adjustments"
  ON credit_transactions FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));