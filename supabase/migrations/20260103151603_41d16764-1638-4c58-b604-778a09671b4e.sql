-- Create pending_marketing_payments table for Blockfrost webhook flow
CREATE TABLE public.pending_marketing_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  marketing_request_id UUID NOT NULL REFERENCES marketing_requests(id) ON DELETE CASCADE,
  price_ada NUMERIC NOT NULL,
  expected_amount_lovelace BIGINT NOT NULL,
  dust_amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  tx_hash TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.pending_marketing_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own pending marketing payments"
ON public.pending_marketing_payments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pending marketing payments"
ON public.pending_marketing_payments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending marketing payments"
ON public.pending_marketing_payments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all pending marketing payments"
ON public.pending_marketing_payments FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to process marketing payments (called by blockfrost webhook)
CREATE OR REPLACE FUNCTION public.process_marketing_payment(
  p_expected_amount_lovelace BIGINT,
  p_tx_hash TEXT
)
RETURNS TABLE(payment_id UUID, user_id UUID, marketing_request_id UUID, already_processed BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_payment RECORD;
BEGIN
  -- Find matching pending payment with exact amount
  SELECT * INTO v_payment
  FROM pending_marketing_payments p
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
    RETURN QUERY SELECT v_payment.id, v_payment.user_id, v_payment.marketing_request_id, TRUE;
    RETURN;
  END IF;
  
  -- Update payment status
  UPDATE pending_marketing_payments
  SET 
    status = 'completed',
    tx_hash = p_tx_hash,
    completed_at = now()
  WHERE id = v_payment.id;
  
  -- Update marketing request - set to 'paid' (not 'active' - that happens on start_date)
  UPDATE marketing_requests
  SET 
    payment_status = 'completed',
    status = 'paid'
  WHERE id = v_payment.marketing_request_id;
  
  -- Get marketing request details for notification
  DECLARE
    v_mr RECORD;
  BEGIN
    SELECT * INTO v_mr FROM marketing_requests WHERE id = v_payment.marketing_request_id;
    
    -- Create notification
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      v_payment.user_id,
      'payment_complete',
      'Marketing Payment Received!',
      'Your payment of ' || v_payment.price_ada || ' ADA has been confirmed. Your spotlight will go live on ' || to_char(v_mr.start_date, 'Month DD, YYYY') || ' at 00:01 UTC.',
      '/project/' || v_mr.project_id || '?tab=marketing'
    );
  END;
  
  RETURN QUERY SELECT v_payment.id, v_payment.user_id, v_payment.marketing_request_id, FALSE;
END;
$$;

-- Create function to activate marketing campaigns on schedule
CREATE OR REPLACE FUNCTION public.activate_marketing_on_schedule()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER := 0;
  v_mr RECORD;
BEGIN
  -- Find paid marketing that should now be active (start_date has passed)
  FOR v_mr IN 
    SELECT mr.id, mr.project_id, mr.end_date
    FROM marketing_requests mr
    WHERE mr.status = 'paid'
      AND mr.payment_status = 'completed'
      AND mr.start_date <= NOW()
  LOOP
    -- Activate the marketing request
    UPDATE marketing_requests
    SET status = 'active'
    WHERE id = v_mr.id;
    
    -- Update product_pages to be featured
    UPDATE product_pages
    SET is_featured = true, 
        featured_until = v_mr.end_date
    WHERE project_id = v_mr.project_id;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$;

-- Create function to expire pending marketing payments
CREATE OR REPLACE FUNCTION public.expire_pending_marketing_payments()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE pending_marketing_payments
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < now();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;