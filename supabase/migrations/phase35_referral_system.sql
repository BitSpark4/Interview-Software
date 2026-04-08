-- Phase 35: Referral System
-- Run this migration manually in Supabase SQL editor

-- Add referral columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS referral_code    text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by      text,
  ADD COLUMN IF NOT EXISTS referral_count   integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS free_months_earned integer NOT NULL DEFAULT 0;

-- Index for looking up referrer by code
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- Referral rewards log
CREATE TABLE IF NOT EXISTS referral_rewards (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_given_at  timestamptz NOT NULL DEFAULT now(),
  months_added     integer NOT NULL DEFAULT 1,
  UNIQUE(referrer_id, referred_user_id)  -- prevent duplicate rewards
);

-- RLS
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- Users can read their own rewards
CREATE POLICY "users_read_own_rewards" ON referral_rewards
  FOR SELECT USING (referrer_id = auth.uid() OR referred_user_id = auth.uid());

-- Service role inserts from functions
-- (no additional policy needed — service role bypasses RLS)

CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON referral_rewards(referrer_id);
