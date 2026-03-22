-- Phase 22: Admin User Management
-- Run this in Supabase SQL editor or via migration

-- 1. Function to change a user's plan (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION admin_change_user_plan(
  target_user_id UUID,
  new_plan TEXT
)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET plan = new_plan,
      updated_at = now()
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Admin actions audit log table
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id),
  action_type TEXT NOT NULL,
  target_user_id UUID REFERENCES users(id),
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- 4. Policy: only admins can read/write
CREATE POLICY "admin_only_actions"
  ON admin_actions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );
