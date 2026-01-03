-- Create user_credits table
CREATE TABLE public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  free_credits NUMERIC(10,2) NOT NULL DEFAULT 100,
  purchased_credits NUMERIC(10,2) NOT NULL DEFAULT 0,
  next_reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create credit_transactions table for audit trail
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  transaction_type TEXT NOT NULL,
  generation_type TEXT,
  description TEXT,
  generation_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create credit_purchases table for tracking purchases
CREATE TABLE public.credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  credits_amount INTEGER NOT NULL,
  price_ada INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  nmkr_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_credits
CREATE POLICY "Users can view their own credits"
  ON public.user_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits"
  ON public.user_credits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credits"
  ON public.user_credits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for credit_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON public.credit_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for credit_purchases
CREATE POLICY "Users can view their own purchases"
  ON public.credit_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases"
  ON public.credit_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchases"
  ON public.credit_purchases FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to deduct credits (uses free first, then purchased)
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id UUID,
  p_amount NUMERIC,
  p_generation_type TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_generation_id UUID DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_free NUMERIC;
  v_purchased NUMERIC;
  v_from_free NUMERIC;
  v_from_purchased NUMERIC;
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
  
  -- Log transaction
  INSERT INTO credit_transactions (user_id, amount, transaction_type, generation_type, description, generation_id)
  VALUES (p_user_id, -p_amount, 'usage', p_generation_type, p_description, p_generation_id);
  
  RETURN TRUE;
END;
$$;

-- Function to add purchased credits
CREATE OR REPLACE FUNCTION public.add_purchased_credits(
  p_user_id UUID,
  p_amount NUMERIC,
  p_description TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_credits
  SET 
    purchased_credits = purchased_credits + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  INSERT INTO credit_transactions (user_id, amount, transaction_type, description)
  VALUES (p_user_id, p_amount, 'purchase', p_description);
END;
$$;

-- Function to check and reset credits if due
CREATE OR REPLACE FUNCTION public.check_and_reset_credits(p_user_id UUID)
RETURNS TABLE(
  free_credits NUMERIC,
  purchased_credits NUMERIC,
  next_reset_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record user_credits%ROWTYPE;
BEGIN
  SELECT * INTO v_record FROM user_credits WHERE user_id = p_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    -- Create credits record if doesn't exist
    INSERT INTO user_credits (user_id, free_credits, next_reset_at)
    VALUES (p_user_id, 100, now() + INTERVAL '1 month')
    RETURNING * INTO v_record;
    
    INSERT INTO credit_transactions (user_id, amount, transaction_type, description)
    VALUES (p_user_id, 100, 'monthly_reset', 'Initial free credits');
  ELSIF v_record.next_reset_at <= now() THEN
    UPDATE user_credits
    SET 
      free_credits = 100,
      next_reset_at = user_credits.next_reset_at + INTERVAL '1 month',
      updated_at = now()
    WHERE user_id = p_user_id
    RETURNING * INTO v_record;
    
    INSERT INTO credit_transactions (user_id, amount, transaction_type, description)
    VALUES (p_user_id, 100, 'monthly_reset', 'Monthly free credits reset');
  END IF;
  
  RETURN QUERY SELECT v_record.free_credits, v_record.purchased_credits, v_record.next_reset_at;
END;
$$;

-- Trigger to auto-create credits on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_credits (user_id, free_credits, next_reset_at)
  VALUES (
    NEW.id,
    100,
    NEW.created_at + INTERVAL '1 month'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO credit_transactions (user_id, amount, transaction_type, description)
  VALUES (NEW.id, 100, 'monthly_reset', 'Initial free credits');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_add_credits
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_credits();

-- Migrate existing users: give them 100 credits
INSERT INTO user_credits (user_id, free_credits, next_reset_at)
SELECT id, 100, now() + INTERVAL '1 month'
FROM profiles
WHERE id NOT IN (SELECT user_id FROM user_credits)
ON CONFLICT (user_id) DO NOTHING;