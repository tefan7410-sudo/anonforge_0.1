-- Add wallet columns to profiles table for Cardano wallet authentication
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stake_address TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS wallet_address TEXT,
ADD COLUMN IF NOT EXISTS wallet_connected_at TIMESTAMPTZ;

-- Index for fast wallet lookups during authentication
CREATE INDEX IF NOT EXISTS idx_profiles_stake_address ON public.profiles(stake_address);