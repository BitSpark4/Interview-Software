-- Phase 14: Career Goal History tracking
-- Run in Supabase SQL editor

CREATE TABLE IF NOT EXISTS career_history (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sector           TEXT NOT NULL,
  sector_label     TEXT NOT NULL,
  started_at       TIMESTAMPTZ DEFAULT now(),
  ended_at         TIMESTAMPTZ,
  total_sessions   INTEGER DEFAULT 0,
  average_score    NUMERIC(4,2) DEFAULT 0,
  best_score       NUMERIC(4,2) DEFAULT 0,
  milestone_reached TEXT DEFAULT 'beginner',
  is_current       BOOLEAN DEFAULT false,
  reason_for_change TEXT DEFAULT ''
);

ALTER TABLE career_history
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_career_history"
  ON career_history FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_career_history_user
  ON career_history(user_id);
