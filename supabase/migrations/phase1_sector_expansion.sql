-- Phase 1 Sector Expansion — Run this in Supabase SQL editor

-- Add sector column to sessions table
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS sector TEXT DEFAULT 'it_tech'
CHECK (sector IN (
  'it_tech',
  'government',
  'banking',
  'engineering',
  'medical',
  'students',
  'business'
));

-- Add exam type column to sessions table
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS exam_type TEXT DEFAULT 'general';

-- Add state column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'maharashtra';

-- Add education level to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS education_level TEXT DEFAULT 'graduate'
CHECK (education_level IN (
  'high_school',
  'diploma',
  'graduate',
  'post_graduate',
  'professional'
));

-- Add target exam to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS target_exam TEXT DEFAULT '';

-- Add onboarding_complete to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;

-- Create question bank table
CREATE TABLE IF NOT EXISTS question_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector TEXT NOT NULL,
  exam_type TEXT NOT NULL,
  topic TEXT NOT NULL,
  question TEXT NOT NULL,
  correct_answer TEXT,
  explanation TEXT,
  difficulty TEXT DEFAULT 'medium'
    CHECK (difficulty IN ('easy', 'medium', 'hard')),
  state_specific TEXT DEFAULT 'general',
  is_current_affairs BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'ai_generated',
  verified BOOLEAN DEFAULT false,
  report_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create current affairs table
CREATE TABLE IF NOT EXISTS current_affairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  headline TEXT NOT NULL,
  summary TEXT NOT NULL,
  sector TEXT NOT NULL,
  relevance_score INTEGER DEFAULT 5,
  source_url TEXT,
  published_date DATE DEFAULT CURRENT_DATE,
  questions_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for new tables
ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE current_affairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "question_bank_read_all"
  ON question_bank FOR SELECT
  USING (true);

CREATE POLICY "current_affairs_read_all"
  ON current_affairs FOR SELECT
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_question_bank_sector ON question_bank(sector);
CREATE INDEX IF NOT EXISTS idx_question_bank_exam ON question_bank(exam_type);
CREATE INDEX IF NOT EXISTS idx_current_affairs_date ON current_affairs(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_sector ON sessions(sector);
