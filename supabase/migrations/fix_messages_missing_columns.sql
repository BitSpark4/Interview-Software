-- Fix: messages table missing correct_answer and topic columns
-- Root cause: sendAnswer inserts these fields but the table schema never had them.
-- This caused the entire feedback INSERT to fail silently (no error check in code),
-- meaning NO feedback was ever saved. Report page showed nothing.
--
-- Run this in Supabase SQL Editor → Run

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS correct_answer TEXT DEFAULT '';

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS topic TEXT DEFAULT '';
