-- Phase 35: Error Monitoring — error_logs table
-- Run this migration manually in Supabase SQL editor

CREATE TABLE IF NOT EXISTS error_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type  text NOT NULL,                          -- claude_error | token_limit | parse_error | timeout | rate_limit
  error_message text NOT NULL,
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  session_id  uuid,
  sector      text,
  context     jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  is_resolved boolean NOT NULL DEFAULT false
);

-- RLS: only admins can read; service role inserts from functions (bypasses RLS)
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_error_logs" ON error_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "admin_update_error_logs" ON error_logs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Indexes for admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_error_logs_type_created  ON error_logs(error_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved      ON error_logs(is_resolved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_created       ON error_logs(created_at DESC);
