-- Phase 32 Task 1 — Add stack selection columns to sessions table
-- Run manually in Supabase SQL editor

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS selected_stack TEXT[]   DEFAULT '{}';

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS stack_source   TEXT      DEFAULT 'manual';
