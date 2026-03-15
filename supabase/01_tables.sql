-- ============================================================
-- STEP 1: CREATE ALL TABLES
-- Copy-paste this entire file into Supabase SQL Editor → Run
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- TABLE 1: users
-- Extended profile beyond Supabase auth.users
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 TEXT NOT NULL,
  name                  TEXT DEFAULT '',
  plan                  TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  interviews_used       INTEGER DEFAULT 0,
  interviews_reset_at   TIMESTAMPTZ DEFAULT date_trunc('month', now()),
  streak_count          INTEGER DEFAULT 0,
  last_session_date     DATE,
  total_sessions        INTEGER DEFAULT 0,
  average_score         NUMERIC(4,2) DEFAULT 0,
  resume_url            TEXT,
  resume_text           TEXT,
  target_role           TEXT DEFAULT '',
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- TABLE 2: sessions
-- Each interview attempt by a user
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role              TEXT NOT NULL,
  interview_type    TEXT NOT NULL CHECK (interview_type IN ('technical', 'behavioral', 'hr', 'mixed')),
  company_focus     TEXT DEFAULT 'general',
  resume_used       BOOLEAN DEFAULT false,
  total_score       NUMERIC(4,2),
  verdict           TEXT CHECK (verdict IN ('Ready', 'Almost Ready', 'Needs Work', NULL)),
  completed         BOOLEAN DEFAULT false,
  question_count    INTEGER DEFAULT 5,
  strengths         JSONB DEFAULT '[]',
  improvements      JSONB DEFAULT '[]',
  top_advice        TEXT DEFAULT '',
  duration_seconds  INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now(),
  completed_at      TIMESTAMPTZ
);

-- ─────────────────────────────────────────────────────────────
-- TABLE 3: messages
-- Each Q&A exchange inside a session (10 rows per session: 5 Q + 5 A)
-- feedback JSONB structure:
-- {
--   "score": 7,
--   "good": "what was strong",
--   "missing": "what was absent",
--   "ideal": "what a perfect answer covers",
--   "star_breakdown": {
--     "situation": "present | partial | missing | N/A",
--     "task":      "present | partial | missing | N/A",
--     "action":    "present | partial | missing | N/A",
--     "result":    "present | partial | missing | N/A"
--   }
-- }
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  question_num  INTEGER NOT NULL,
  sender        TEXT NOT NULL CHECK (sender IN ('ai', 'user')),
  content       TEXT NOT NULL,
  score         INTEGER CHECK (score >= 1 AND score <= 10),
  feedback      JSONB DEFAULT NULL,
  is_question   BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- TABLE 4: weak_areas
-- Tracked per user across sessions — updated after each interview
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weak_areas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  area        TEXT NOT NULL,
  avg_score   NUMERIC(4,2) DEFAULT 0,
  occurrences INTEGER DEFAULT 1,
  updated_at  TIMESTAMPTZ DEFAULT now()
);
