-- ============================================================
-- STEP 6: Resume + Skills columns
-- Run in Supabase SQL Editor
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS resume_filename    TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS resume_uploaded_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS skills             JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS best_score         NUMERIC(4,2) DEFAULT 0;

-- Storage bucket RLS: authenticated users can manage their own folder only
-- Run this AFTER creating the 'resumes' bucket in Supabase Dashboard > Storage

-- Allow users to upload/update their own resume
DROP POLICY IF EXISTS "Users can upload own resume" ON storage.objects;
CREATE POLICY "Users can upload own resume"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own resume" ON storage.objects;
CREATE POLICY "Users can update own resume"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can read own resume" ON storage.objects;
CREATE POLICY "Users can read own resume"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);
