-- ============================================================
-- STEP 3: TRIGGERS
-- Copy-paste this entire file into Supabase SQL Editor → Run
-- Run AFTER 02_rls.sql
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- TRIGGER 1: Auto-create users row when someone signs up
-- Fires on every new auth.users insert (signup)
-- Creates the public.users profile row automatically
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- TRIGGER 2: Auto-reset monthly interview count
-- Fires before any UPDATE on users
-- If a new calendar month has started, resets interviews_used to 0
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reset_monthly_interviews()
RETURNS TRIGGER AS $$
BEGIN
  IF date_trunc('month', now()) > date_trunc('month', OLD.interviews_reset_at) THEN
    NEW.interviews_used := 0;
    NEW.interviews_reset_at := date_trunc('month', now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_reset_interviews ON users;
CREATE TRIGGER auto_reset_interviews
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE PROCEDURE public.reset_monthly_interviews();
