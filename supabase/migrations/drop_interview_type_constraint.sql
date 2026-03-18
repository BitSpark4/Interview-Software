-- Drop interview_type check constraint entirely
-- UI already enforces valid values — DB constraint not needed
-- Run in: Supabase Dashboard → SQL Editor → New Query

ALTER TABLE sessions
DROP CONSTRAINT IF EXISTS sessions_interview_type_check;
