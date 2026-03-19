-- Phase 10 Task 1 — No repeat questions + review columns
-- Run this in Supabase SQL editor

-- Track questions asked per user per sector
CREATE TABLE IF NOT EXISTS asked_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sector TEXT NOT NULL,
  question_hash TEXT NOT NULL,
  question_text TEXT NOT NULL,
  asked_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asked_user_sector
  ON asked_questions(user_id, sector);

ALTER TABLE asked_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_asked"
  ON asked_questions FOR ALL
  USING (auth.uid() = user_id);

-- Add correct_answer and topic columns to messages
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS correct_answer TEXT;

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS topic TEXT DEFAULT '';
