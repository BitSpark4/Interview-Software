-- Phase 9 Research Database — Run this in Supabase SQL editor

-- Table 1: Sector syllabus storage
CREATE TABLE IF NOT EXISTS sector_syllabus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector TEXT NOT NULL,
  exam_name TEXT NOT NULL,
  official_url TEXT NOT NULL,
  syllabus_content TEXT NOT NULL,
  paper_structure TEXT NOT NULL,
  topic_weightage JSONB DEFAULT '{}',
  last_checked DATE DEFAULT CURRENT_DATE,
  last_updated DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table 2: Official source URLs
CREATE TABLE IF NOT EXISTS official_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector TEXT NOT NULL,
  exam_name TEXT NOT NULL,
  source_type TEXT CHECK (source_type IN (
    'official_website',
    'syllabus_pdf',
    'previous_papers',
    'answer_key',
    'notification'
  )),
  url TEXT NOT NULL,
  description TEXT,
  last_verified DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table 3: Update tracking log
CREATE TABLE IF NOT EXISTS update_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_name TEXT NOT NULL,
  check_date DATE DEFAULT CURRENT_DATE,
  what_changed TEXT,
  action_taken TEXT,
  checked_by TEXT DEFAULT 'manual',
  next_check_date DATE DEFAULT (CURRENT_DATE + INTERVAL '14 days')
);

-- Enable RLS on all three tables
ALTER TABLE sector_syllabus ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE update_tracker ENABLE ROW LEVEL SECURITY;

-- Public read policies (anon can read syllabus data)
CREATE POLICY "syllabus_read_all"
  ON sector_syllabus FOR SELECT USING (true);

CREATE POLICY "sources_read_all"
  ON official_sources FOR SELECT USING (true);

-- Indexes for fast sector lookups
CREATE INDEX IF NOT EXISTS idx_syllabus_sector ON sector_syllabus(sector);
CREATE INDEX IF NOT EXISTS idx_sources_sector ON official_sources(sector);
