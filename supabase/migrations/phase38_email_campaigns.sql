-- Phase 38: Email Campaign Manager
-- Tables: email_campaigns, email_campaign_logs, email_sender_config
-- RLS: admin only on all tables

-- ── email_campaigns ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_campaigns (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT        NOT NULL,
  subject          TEXT        NOT NULL,
  body             TEXT        NOT NULL,
  sender_email     TEXT        NOT NULL DEFAULT 'noreply@contact.getinterviewiq.in',
  sender_name      TEXT        NOT NULL DEFAULT 'InterviewIQ',
  target_audience  TEXT        DEFAULT 'all'
    CHECK (target_audience IN ('all','pro','free','inactive_7days','inactive_30days','never_practiced','custom')),
  status           TEXT        DEFAULT 'draft'
    CHECK (status IN ('draft','scheduled','sending','sent','paused')),
  scheduled_at     TIMESTAMPTZ,
  sent_at          TIMESTAMPTZ,
  total_recipients INTEGER     DEFAULT 0,
  total_sent       INTEGER     DEFAULT 0,
  total_failed     INTEGER     DEFAULT 0,
  image_url        TEXT,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ── email_campaign_logs ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_campaign_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  UUID        REFERENCES email_campaigns(id) ON DELETE CASCADE,
  user_id      UUID        REFERENCES users(id) ON DELETE SET NULL,
  email        TEXT        NOT NULL,
  status       TEXT        DEFAULT 'pending'
    CHECK (status IN ('pending','sent','failed','opened')),
  sent_at      TIMESTAMPTZ,
  error_message TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ── email_sender_config ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_sender_config (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_email TEXT        NOT NULL,
  sender_name  TEXT        NOT NULL,
  is_active    BOOLEAN     DEFAULT false,
  is_verified  BOOLEAN     DEFAULT false,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Default verified sender
INSERT INTO email_sender_config (sender_email, sender_name, is_active, is_verified)
VALUES ('noreply@contact.getinterviewiq.in', 'InterviewIQ', true, true)
ON CONFLICT DO NOTHING;

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE email_campaigns      ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaign_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sender_config  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_only_campaigns"
  ON email_campaigns FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "admin_only_logs"
  ON email_campaign_logs FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "admin_only_sender_config"
  ON email_sender_config FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_campaign_logs_campaign ON email_campaign_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_status   ON email_campaign_logs(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_status       ON email_campaigns(status);
