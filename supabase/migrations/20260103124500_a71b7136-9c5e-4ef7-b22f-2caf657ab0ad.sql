-- Rename amount_ada to amount_usd in operational_costs table
ALTER TABLE public.operational_costs 
RENAME COLUMN amount_ada TO amount_usd;