-- Drop the existing check constraint that requires dust_amount > 0
ALTER TABLE public.pending_credit_payments DROP CONSTRAINT IF EXISTS valid_dust_amount;

-- Add a new check constraint that allows dust_amount >= 0 (for Anvil payments which don't need dust)
ALTER TABLE public.pending_credit_payments ADD CONSTRAINT valid_dust_amount CHECK (dust_amount >= 0);