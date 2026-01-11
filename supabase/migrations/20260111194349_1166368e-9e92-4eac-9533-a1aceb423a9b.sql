-- Update process_marketing_payment to prevent double-processing by Blockfrost
-- when payment has already been handled by Anvil (tx_hash already set)
CREATE OR REPLACE FUNCTION public.process_marketing_payment(p_expected_amount_lovelace bigint, p_tx_hash text)
 RETURNS TABLE(payment_id uuid, user_id uuid, marketing_request_id uuid, already_processed boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_payment RECORD;
BEGIN
  -- Find matching pending payment with exact amount
  -- Only process if tx_hash IS NULL (not already handled by Anvil)
  SELECT * INTO v_payment
  FROM pending_marketing_payments p
  WHERE p.expected_amount_lovelace = p_expected_amount_lovelace
    AND p.status = 'pending'
    AND p.tx_hash IS NULL
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
$function$;