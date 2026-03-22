-- Phase 22b: Admin function to fetch all users (bypasses RLS via SECURITY DEFINER)
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
  -- Only admins can call this
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
