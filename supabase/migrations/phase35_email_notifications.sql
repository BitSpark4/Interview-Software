-- Phase 35: Email Notifications deduplication table
-- Run this migration manually in Supabase SQL editor

CREATE TABLE IF NOT EXISTS email_notifications (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type text NOT NULL,    -- streak_reminder | reengagement | upgrade_nudge | unsubscribed
  sent_at           timestamptz NOT NULL DEFAULT now()
);

-- RLS: users can read their own; service role inserts
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_notifications" ON email_notifications
  FOR SELECT USING (user_id = auth.uid());

-- Indexes for deduplication checks
CREATE INDEX IF NOT EXISTS idx_email_notif_user_type ON email_notifications(user_id, notification_type, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_notif_type_sent ON email_notifications(notification_type, sent_at DESC);
