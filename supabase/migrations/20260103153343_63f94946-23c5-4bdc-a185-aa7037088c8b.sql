-- Fix 1: Update the check constraint to include 'paid' status
ALTER TABLE marketing_requests 
DROP CONSTRAINT IF EXISTS marketing_requests_status_check;

ALTER TABLE marketing_requests 
ADD CONSTRAINT marketing_requests_status_check 
CHECK (status = ANY (ARRAY['pending', 'approved', 'rejected', 'active', 'completed', 'paid']));

-- Fix 2: Manually process the payment that was already received
UPDATE pending_marketing_payments
SET status = 'completed',
    tx_hash = '5a7aae322ba2509ae1a0c935c42cc20af98ee0a7ec528d3a2d3ceb8bbef662b2',
    completed_at = NOW()
WHERE expected_amount_lovelace = 50245511
  AND status = 'pending';

-- Update the marketing request to paid status
UPDATE marketing_requests
SET payment_status = 'completed',
    status = 'paid'
WHERE id = 'e658def4-ac54-44c7-b063-4dc90f48c935';