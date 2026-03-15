-- ============================================================
-- STEP 2: ENABLE ROW LEVEL SECURITY + POLICIES
-- Copy-paste this entire file into Supabase SQL Editor → Run
-- Run AFTER 01_tables.sql
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Enable RLS on all tables
-- ─────────────────────────────────────────────────────────────
ALTER TABLE users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE weak_areas ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- POLICY: users — can only read/write their own row
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "users_own_row"
  ON users FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────
-- POLICY: sessions — can only access their own sessions
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "users_own_sessions"
  ON sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- POLICY: messages — can only access messages from their sessions
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "users_own_messages"
  ON messages FOR ALL
  USING (
    session_id IN (
      SELECT id FROM sessions WHERE user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- POLICY: weak_areas — can only access their own weak areas
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "users_own_weak_areas"
  ON weak_areas FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
