-- Phase 13A — Career Goal Tracking System
-- Run this in Supabase SQL editor

-- ─────────────────────────────────────────
-- 1. New columns on users table
-- ─────────────────────────────────────────

ALTER TABLE users
ADD COLUMN IF NOT EXISTS primary_sector TEXT DEFAULT '';

ALTER TABLE users
ADD COLUMN IF NOT EXISTS career_goal TEXT DEFAULT '';

ALTER TABLE users
ADD COLUMN IF NOT EXISTS sector_milestones JSONB DEFAULT '{}';

ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_active_sector TEXT DEFAULT '';

-- ─────────────────────────────────────────
-- 2. career_insights table
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS career_insights (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  insight_type  TEXT        NOT NULL CHECK (insight_type IN (
                              'sector_focus_warning',
                              'milestone_achieved',
                              'ready_for_interview',
                              'improvement_tip',
                              'sector_switch_alert'
                            )),
  message       TEXT        NOT NULL,
  sector        TEXT,
  is_read       BOOLEAN     DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- 3. RLS on career_insights
-- ─────────────────────────────────────────

ALTER TABLE career_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_insights" ON career_insights;

CREATE POLICY "users_own_insights"
  ON career_insights FOR ALL
  USING (auth.uid() = user_id);
