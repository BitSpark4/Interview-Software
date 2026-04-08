-- Phase 32 Task 4 — Question bank full schema + question_reports table
-- Run manually in Supabase SQL editor

-- ── question_bank table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS question_bank (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector          TEXT NOT NULL,
  sub_sector      TEXT,
  stack_tags      TEXT[]  DEFAULT '{}',
  question_text   TEXT    NOT NULL,
  correct_answer  TEXT,
  key_points      JSONB   DEFAULT '[]',
  tip             TEXT,
  difficulty      TEXT    DEFAULT 'medium',  -- easy | medium | hard
  topic           TEXT,
  times_served    INTEGER DEFAULT 0,
  times_reported  INTEGER DEFAULT 0,
  verified        BOOLEAN DEFAULT false,
  is_active       BOOLEAN DEFAULT true,
  source          TEXT    DEFAULT 'ai_generated',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Add any columns that may be missing if table already exists
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS sub_sector      TEXT;
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS stack_tags      TEXT[]  DEFAULT '{}';
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS correct_answer  TEXT;
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS key_points      JSONB   DEFAULT '[]';
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS tip             TEXT;
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS times_served    INTEGER DEFAULT 0;
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS times_reported  INTEGER DEFAULT 0;
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS verified        BOOLEAN DEFAULT false;
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS source          TEXT    DEFAULT 'ai_generated';
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS is_active       BOOLEAN DEFAULT true;

-- ── Indexes ───────────────────────────────────────────────────────────────────

-- Primary query: sector filter + active filter (most common)
CREATE INDEX IF NOT EXISTS idx_qb_sector_active
  ON question_bank (sector, is_active);

-- GIN index for stack_tags array overlap queries
-- Usage: WHERE stack_tags && ARRAY['React','TypeScript'] AND is_active = true
CREATE INDEX IF NOT EXISTS idx_qb_stack_tags
  ON question_bank USING GIN (stack_tags)
  WHERE is_active = true;

-- Partial index for active + difficulty combo
CREATE INDEX IF NOT EXISTS idx_qb_sector_difficulty
  ON question_bank (sector, difficulty)
  WHERE is_active = true;

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read active questions
CREATE POLICY "authenticated_read_active_questions"
  ON question_bank FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admin users can update questions (mark verified, deactivate bad ones)
CREATE POLICY "admin_update_questions"
  ON question_bank FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Only service role inserts (generation script uses service key, bypasses RLS)

-- ── question_reports table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS question_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id     UUID REFERENCES question_bank(id) ON DELETE SET NULL,
  session_id      UUID,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_reason   TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_question_reports_user
  ON question_reports (user_id);

CREATE INDEX IF NOT EXISTS idx_question_reports_question
  ON question_reports (question_id);

ALTER TABLE question_reports ENABLE ROW LEVEL SECURITY;

-- Users can insert their own reports
CREATE POLICY "users_insert_reports"
  ON question_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admin can read all reports
CREATE POLICY "admin_read_all_reports"
  ON question_reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
