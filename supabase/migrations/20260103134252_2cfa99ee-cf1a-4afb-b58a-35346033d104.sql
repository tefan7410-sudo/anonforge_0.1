-- Create pending_credit_payments table for tracking ADA payments
CREATE TABLE public.pending_credit_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tier_id TEXT NOT NULL,
  credits_amount INTEGER NOT NULL,
  price_ada NUMERIC NOT NULL,
  expected_amount_lovelace BIGINT NOT NULL,
  dust_amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 minutes'),
  completed_at TIMESTAMPTZ,
  CONSTRAINT valid_dust_amount CHECK (dust_amount >= 1 AND dust_amount <= 999999),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'expired', 'failed'))
);

-- Create index for efficient lookups by expected amount
CREATE INDEX idx_pending_payments_amount ON public.pending_credit_payments(expected_amount_lovelace) WHERE status = 'pending';

-- Create index for user lookups
CREATE INDEX idx_pending_payments_user ON public.pending_credit_payments(user_id);

-- Enable RLS
ALTER TABLE public.pending_credit_payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own pending payments
CREATE POLICY "Users can view their own pending payments"
ON public.pending_credit_payments
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own pending payments
CREATE POLICY "Users can create their own pending payments"
ON public.pending_credit_payments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending payments (for cancellation)
CREATE POLICY "Users can update their own pending payments"
ON public.pending_credit_payments
FOR UPDATE
USING (auth.uid() = user_id);

-- Create function to find and process payment by exact amount
CREATE OR REPLACE FUNCTION public.process_ada_payment(
  p_expected_amount_lovelace BIGINT,
  p_tx_hash TEXT
)
RETURNS TABLE(
  payment_id UUID,
  user_id UUID,
  credits_amount INTEGER,
  already_processed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment RECORD;
BEGIN
  -- Find matching pending payment with exact amount
  SELECT * INTO v_payment
  FROM pending_credit_payments p
  WHERE p.expected_amount_lovelace = p_expected_amount_lovelace
    AND p.status = 'pending'
    AND p.expires_at > now()
  ORDER BY p.created_at ASC
  LIMIT 1
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Check if already processed (idempotency)
  IF v_payment.tx_hash IS NOT NULL AND v_payment.tx_hash = p_tx_hash THEN
    RETURN QUERY SELECT v_payment.id, v_payment.user_id, v_payment.credits_amount, TRUE;
    RETURN;
  END IF;
  
  -- Update payment status
  UPDATE pending_credit_payments
  SET 
    status = 'completed',
    tx_hash = p_tx_hash,
    completed_at = now()
  WHERE id = v_payment.id;
  
  -- Add credits to user
  PERFORM add_purchased_credits(
    v_payment.user_id,
    v_payment.credits_amount,
    'ADA payment: ' || v_payment.credits_amount || ' credits via tx ' || LEFT(p_tx_hash, 16) || '...'
  );
  
  -- Create notification
  INSERT INTO notifications (user_id, type, title, message, link)
  VALUES (
    v_payment.user_id,
    'payment_complete',
    'Payment Received!',
    'Your payment of ' || v_payment.price_ada || ' ADA has been confirmed. ' || v_payment.credits_amount || ' credits have been added to your account.',
    '/credits'
  );
  
  RETURN QUERY SELECT v_payment.id, v_payment.user_id, v_payment.credits_amount, FALSE;
END;
$$;

-- Create function to expire old pending payments
CREATE OR REPLACE FUNCTION public.expire_pending_payments()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE pending_credit_payments
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < now();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;