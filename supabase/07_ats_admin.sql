-- APP-FLOW_7: ATS score columns + admin flag
-- Run in Supabase SQL Editor

-- Feature 1: ATS score columns on users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS ats_score       INTEGER     DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ats_feedback    JSONB       DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ats_analyzed_at TIMESTAMPTZ DEFAULT NULL;

-- Feature 2: Admin flag
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Set YOUR account as admin (replace with your actual email)
-- UPDATE users SET is_admin = true WHERE email = 'your@email.com';

-- Admin stats function (server-side, SECURITY DEFINER)
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'total_users',         (SELECT COUNT(*) FROM users),
    'pro_users',           (SELECT COUNT(*) FROM users WHERE plan = 'pro'),
    'free_users',          (SELECT COUNT(*) FROM users WHERE plan = 'free'),
    'total_sessions',      (SELECT COUNT(*) FROM sessions),
    'sessions_today',      (SELECT COUNT(*) FROM sessions WHERE created_at >= CURRENT_DATE),
    'new_users_today',     (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE),
    'new_users_this_week', (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'),
    'completed_sessions',  (SELECT COUNT(*) FROM sessions WHERE completed = true),
    'avg_score',           (SELECT ROUND(AVG(total_score)::numeric, 1) FROM sessions WHERE completed = true)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
