-- Phase 23: Add last_active_at to users table

ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_users_last_active
  ON users(last_active_at DESC);

-- Backfill existing users:
-- Use last_login_at if available, else created_at as best estimate
UPDATE users
SET last_active_at = COALESCE(last_login_at, created_at)
WHERE last_active_at IS NULL;
