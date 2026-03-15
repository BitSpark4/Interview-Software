-- ============================================================
-- InterviewIQ — FULL DATABASE MIGRATION
-- Run this ONE file in Supabase Dashboard → SQL Editor → Run
-- Safe to re-run: uses IF NOT EXISTS and CREATE OR REPLACE
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.users (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email               TEXT NOT NULL,
  name                TEXT DEFAULT '',
  plan                TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  interviews_used     INTEGER DEFAULT 0,
  interviews_reset_at TIMESTAMPTZ DEFAULT date_trunc('month', now()),
  streak_count        INTEGER DEFAULT 0,
  last_session_date   DATE,
  total_sessions      INTEGER DEFAULT 0,
  average_score       NUMERIC(4,2) DEFAULT 0,
  resume_url          TEXT,
  resume_text         TEXT,
  target_role         TEXT DEFAULT '',
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role             TEXT NOT NULL,
  interview_type   TEXT NOT NULL CHECK (interview_type IN ('technical', 'behavioral', 'hr', 'mixed')),
  company_focus    TEXT DEFAULT 'general',
  resume_used      BOOLEAN DEFAULT false,
  total_score      NUMERIC(4,2),
  verdict          TEXT CHECK (verdict IN ('Ready', 'Almost Ready', 'Needs Work', NULL)),
  completed        BOOLEAN DEFAULT false,
  question_count   INTEGER DEFAULT 5,
  strengths        JSONB DEFAULT '[]',
  improvements     JSONB DEFAULT '[]',
  top_advice       TEXT DEFAULT '',
  duration_seconds INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now(),
  completed_at     TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  question_num INTEGER NOT NULL,
  sender       TEXT NOT NULL CHECK (sender IN ('ai', 'user')),
  content      TEXT NOT NULL,
  score        INTEGER CHECK (score >= 1 AND score <= 10),
  feedback     JSONB DEFAULT NULL,
  is_question  BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.weak_areas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  area        TEXT NOT NULL,
  avg_score   NUMERIC(4,2) DEFAULT 0,
  occurrences INTEGER DEFAULT 1,
  updated_at  TIMESTAMPTZ DEFAULT now(),
  -- Required for upsert ON CONFLICT (user_id, area)
  CONSTRAINT weak_areas_user_area_unique UNIQUE (user_id, area)
);


-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weak_areas ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first so re-running is safe
DROP POLICY IF EXISTS "users_own_row"       ON public.users;
DROP POLICY IF EXISTS "users_own_sessions"  ON public.sessions;
DROP POLICY IF EXISTS "users_own_messages"  ON public.messages;
DROP POLICY IF EXISTS "users_own_weak_areas" ON public.weak_areas;

CREATE POLICY "users_own_row"
  ON public.users FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_own_sessions"
  ON public.sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_own_messages"
  ON public.messages FOR ALL
  USING (
    session_id IN (
      SELECT id FROM public.sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "users_own_weak_areas"
  ON public.weak_areas FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────
-- TRIGGER: Auto-create users row on signup
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ─────────────────────────────────────────────────────────────
-- TRIGGER: Auto-reset monthly interview count
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.reset_monthly_interviews()
RETURNS TRIGGER AS $$
BEGIN
  IF date_trunc('month', now()) > date_trunc('month', OLD.interviews_reset_at) THEN
    NEW.interviews_used     := 0;
    NEW.interviews_reset_at := date_trunc('month', now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_reset_interviews ON public.users;
CREATE TRIGGER auto_reset_interviews
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.reset_monthly_interviews();


-- ─────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_sessions_user_id    ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON public.sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON public.messages(session_id);
CREATE INDEX IF NOT EXISTS idx_weak_areas_user_id  ON public.weak_areas(user_id);


-- ─────────────────────────────────────────────────────────────
-- VERIFY (shows counts — all should be 0 for a fresh install)
-- ─────────────────────────────────────────────────────────────
SELECT 'users'      AS table_name, COUNT(*) FROM public.users
UNION ALL
SELECT 'sessions',   COUNT(*) FROM public.sessions
UNION ALL
SELECT 'messages',   COUNT(*) FROM public.messages
UNION ALL
SELECT 'weak_areas', COUNT(*) FROM public.weak_areas;
