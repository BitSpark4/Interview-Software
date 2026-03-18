-- Fix sessions table constraints for sector expansion
-- Run this in: Supabase Dashboard → SQL Editor → New Query

-- FIX 1: Drop old interview_type check and add all sector values
ALTER TABLE sessions
DROP CONSTRAINT IF EXISTS sessions_interview_type_check;

ALTER TABLE sessions
ADD CONSTRAINT sessions_interview_type_check
CHECK (interview_type IN (
  'technical',
  'behavioral',
  'hr',
  'mixed',
  'full_mock_test',
  'gk_round',
  'current_affairs',
  'essay_writing',
  'banking_awareness',
  'numerical_reasoning',
  'english_round',
  'core_technical',
  'hr_behavioral',
  'aptitude_round',
  'clinical_case',
  'subject_knowledge',
  'viva_practice',
  'aptitude_reasoning',
  'hr_personality',
  'case_study',
  'hr_leadership',
  'group_discussion'
));

-- FIX 2: Drop exam_type constraint — accept any string value
ALTER TABLE sessions
DROP CONSTRAINT IF EXISTS sessions_exam_type_check;
