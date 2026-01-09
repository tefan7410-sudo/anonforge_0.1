
-- =====================================================
-- COMPREHENSIVE FIX: Add owner role to ALL admin-only policies
-- =====================================================

-- 1. admin_audit_logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON admin_audit_logs;
DROP POLICY IF EXISTS "Admins can insert audit logs" ON admin_audit_logs;

CREATE POLICY "Admins and owners can view audit logs"
  ON admin_audit_logs FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins and owners can insert audit logs"
  ON admin_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- 2. art_fund_settings
DROP POLICY IF EXISTS "Admins can insert art fund settings" ON art_fund_settings;
DROP POLICY IF EXISTS "Admins can update art fund settings" ON art_fund_settings;

CREATE POLICY "Admins and owners can insert art fund settings"
  ON art_fund_settings FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins and owners can update art fund settings"
  ON art_fund_settings FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- 3. art_fund_sources
DROP POLICY IF EXISTS "Admins can delete art fund sources" ON art_fund_sources;
DROP POLICY IF EXISTS "Admins can insert art fund sources" ON art_fund_sources;
DROP POLICY IF EXISTS "Admins can update art fund sources" ON art_fund_sources;

CREATE POLICY "Admins and owners can delete art fund sources"
  ON art_fund_sources FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins and owners can insert art fund sources"
  ON art_fund_sources FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins and owners can update art fund sources"
  ON art_fund_sources FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- 4. creator_verification_requests
DROP POLICY IF EXISTS "Admins can view all verification requests" ON creator_verification_requests;
DROP POLICY IF EXISTS "Admins can update verification requests" ON creator_verification_requests;

CREATE POLICY "Admins and owners can view all verification requests"
  ON creator_verification_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins and owners can update verification requests"
  ON creator_verification_requests FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- 5. credit_transactions
DROP POLICY IF EXISTS "Admins can view all transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Admins can insert adjustment transactions" ON credit_transactions;

CREATE POLICY "Admins and owners can view all transactions"
  ON credit_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins and owners can insert adjustment transactions"
  ON credit_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'owner'::app_role)
  );

-- 6. marketing_requests
DROP POLICY IF EXISTS "Admins can view all marketing requests" ON marketing_requests;
DROP POLICY IF EXISTS "Admins can update any marketing request" ON marketing_requests;
DROP POLICY IF EXISTS "Admins can delete marketing requests" ON marketing_requests;

CREATE POLICY "Admins and owners can view all marketing requests"
  ON marketing_requests FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'owner'::app_role)
  );

CREATE POLICY "Admins and owners can update any marketing request"
  ON marketing_requests FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'owner'::app_role)
  );

CREATE POLICY "Admins and owners can delete marketing requests"
  ON marketing_requests FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- 7. operational_costs
DROP POLICY IF EXISTS "Admins can delete operational costs" ON operational_costs;
DROP POLICY IF EXISTS "Admins can insert operational costs" ON operational_costs;
DROP POLICY IF EXISTS "Admins can update operational costs" ON operational_costs;
DROP POLICY IF EXISTS "Admins can view operational costs" ON operational_costs;

CREATE POLICY "Admins and owners can delete operational costs"
  ON operational_costs FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins and owners can insert operational costs"
  ON operational_costs FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins and owners can update operational costs"
  ON operational_costs FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins and owners can view operational costs"
  ON operational_costs FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- 8. pending_credit_payments
DROP POLICY IF EXISTS "Admins can view all pending payments" ON pending_credit_payments;

CREATE POLICY "Admins and owners can view all pending payments"
  ON pending_credit_payments FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'owner'::app_role)
  );

-- 9. pending_marketing_payments
DROP POLICY IF EXISTS "Admins can view all pending marketing payments" ON pending_marketing_payments;

CREATE POLICY "Admins and owners can view all pending marketing payments"
  ON pending_marketing_payments FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'owner'::app_role)
  );

-- 10. service_status
DROP POLICY IF EXISTS "Admins can insert service status" ON service_status;
DROP POLICY IF EXISTS "Admins can update service status" ON service_status;

CREATE POLICY "Admins and owners can insert service status"
  ON service_status FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins and owners can update service status"
  ON service_status FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- 11. site_settings
DROP POLICY IF EXISTS "Admins can insert site settings" ON site_settings;
DROP POLICY IF EXISTS "Admins can update site settings" ON site_settings;

CREATE POLICY "Admins and owners can insert site settings"
  ON site_settings FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins and owners can update site settings"
  ON site_settings FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- 12. status_incidents
DROP POLICY IF EXISTS "Admins can delete status incidents" ON status_incidents;
DROP POLICY IF EXISTS "Admins can insert status incidents" ON status_incidents;
DROP POLICY IF EXISTS "Admins can update status incidents" ON status_incidents;

CREATE POLICY "Admins and owners can delete status incidents"
  ON status_incidents FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins and owners can insert status incidents"
  ON status_incidents FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins and owners can update status incidents"
  ON status_incidents FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- 13. user_credits (already partially done, ensuring completeness)
DROP POLICY IF EXISTS "Admins can view all user credits" ON user_credits;
DROP POLICY IF EXISTS "Admins can update all user credits" ON user_credits;
DROP POLICY IF EXISTS "Admins and owners can view all user credits" ON user_credits;
DROP POLICY IF EXISTS "Admins and owners can update all user credits" ON user_credits;

CREATE POLICY "Admins and owners can view all user credits"
  ON user_credits FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'owner'::app_role)
  );

CREATE POLICY "Admins and owners can update all user credits"
  ON user_credits FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- 14. verified_twitter_handles
DROP POLICY IF EXISTS "Admins can delete verified handles" ON verified_twitter_handles;
DROP POLICY IF EXISTS "Admins can insert verified handles" ON verified_twitter_handles;
DROP POLICY IF EXISTS "Admins can update verified handles" ON verified_twitter_handles;

CREATE POLICY "Admins and owners can delete verified handles"
  ON verified_twitter_handles FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins and owners can insert verified handles"
  ON verified_twitter_handles FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins and owners can update verified handles"
  ON verified_twitter_handles FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));
