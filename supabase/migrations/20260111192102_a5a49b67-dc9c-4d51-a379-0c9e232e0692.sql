-- Update process_ada_payment to skip payments already handled by Anvil (have tx_hash)
CREATE OR REPLACE FUNCTION public.process_ada_payment(p_expected_amount_lovelace bigint, p_tx_hash text)
 RETURNS TABLE(payment_id uuid, user_id uuid, credits_amount integer, already_processed boolean)
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
  FROM pending_credit_payments p
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
$function$;