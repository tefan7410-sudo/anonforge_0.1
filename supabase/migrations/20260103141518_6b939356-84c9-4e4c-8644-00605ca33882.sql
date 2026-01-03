-- Allow admins to view all pending credit payments for revenue tracking
CREATE POLICY "Admins can view all pending credit payments"
ON pending_credit_payments
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));