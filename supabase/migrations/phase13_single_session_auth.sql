-- Phase 13: Single Session Authentication columns
-- Run in Supabase SQL editor

ALTER TABLE users
ADD COLUMN IF NOT EXISTS
  active_session_token TEXT DEFAULT '';

ALTER TABLE users
ADD COLUMN IF NOT EXISTS
  last_login_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE users
ADD COLUMN IF NOT EXISTS
  last_login_device TEXT DEFAULT '';
