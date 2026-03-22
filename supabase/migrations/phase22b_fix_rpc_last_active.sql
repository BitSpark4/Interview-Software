-- Fix: update get_all_users_for_admin to return last_active_at + last_login_at
-- Run this in Supabase SQL editor

DROP FUNCTION IF EXISTS get_all_users_for_admin();

CREATE OR REPLACE FUNCTION get_all_users_for_admin()
RETURNS TABLE(
  id UUID,
  email TEXT,
  name TEXT,
  plan TEXT,
  total_sessions INT,
  average_score NUMERIC,
  created_at TIMESTAMPTZ,
  last_session_date DATE,
  last_active_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  is_admin BOOL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  RETURN QUERY
    SELECT
      u.id, u.email, u.name, u.plan,
      u.total_sessions, u.average_score,
      u.created_at, u.last_session_date,
      u.last_active_at, u.last_login_at, u.is_admin
    FROM users u
    ORDER BY u.created_at DESC;
END;
$$;
