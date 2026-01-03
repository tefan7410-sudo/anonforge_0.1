-- Add explicit foreign key from user_credits to profiles for proper join
ALTER TABLE user_credits 
ADD CONSTRAINT user_credits_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Update deduct_credits function to only log when credits are depleted (not every usage)
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id uuid, 
  p_amount numeric, 
  p_generation_type text DEFAULT NULL, 
  p_description text DEFAULT NULL, 
  p_generation_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_free NUMERIC;
  v_purchased NUMERIC;
  v_from_free NUMERIC;
  v_from_purchased NUMERIC;
  v_new_total NUMERIC;
BEGIN
  -- Get current credits with lock
  SELECT free_credits, purchased_credits 
  INTO v_free, v_purchased
  FROM user_credits 
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check total available
  IF (v_free + v_purchased) < p_amount THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct from free credits first, then purchased
  v_from_free := LEAST(v_free, p_amount);
  v_from_purchased := p_amount - v_from_free;
  
  UPDATE user_credits
  SET 
    free_credits = free_credits - v_from_free,
    purchased_credits = purchased_credits - v_from_purchased,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Calculate new total after deduction
  v_new_total := (v_free - v_from_free) + (v_purchased - v_from_purchased);
  
  -- Only log if credits just got depleted (reached zero)
  IF v_new_total = 0 THEN
    INSERT INTO credit_transactions (user_id, amount, transaction_type, description)
    VALUES (p_user_id, 0, 'credits_depleted', 'Credits fully depleted');
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Clean up existing usage transaction logs
DELETE FROM credit_transactions WHERE transaction_type = 'usage';