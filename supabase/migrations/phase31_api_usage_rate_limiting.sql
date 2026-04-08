-- Phase 31 Task 5 — Per-user API rate limiting
-- Run this manually in the Supabase SQL editor

-- Track daily Claude API call counts per user
CREATE TABLE IF NOT EXISTS api_usage (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  call_count  INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, usage_date)
);

-- Fast lookup: user + date (the only query pattern used)
CREATE INDEX IF NOT EXISTS idx_api_usage_user_date
  ON api_usage (user_id, usage_date);

ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Users can read their own usage (so frontend can show quota)
CREATE POLICY "users_read_own_usage"
  ON api_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert/update (proxy function uses service key)
-- No INSERT/UPDATE policy needed for anon or authenticated roles
-- because the Netlify function uses SUPABASE_SERVICE_KEY which bypasses RLS
