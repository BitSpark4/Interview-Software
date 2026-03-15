-- ============================================================
-- STEP 4: INDEXES FOR PERFORMANCE
-- Copy-paste this entire file into Supabase SQL Editor → Run
-- Run AFTER 03_triggers.sql
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_sessions_user_id     ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at  ON sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_session_id  ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_weak_areas_user_id   ON weak_areas(user_id);
