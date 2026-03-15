-- ============================================================
-- STEP 5: RAZORPAY WEBHOOK HELPER  (run in Phase 6 only)
-- Copy-paste into Supabase SQL Editor when wiring Razorpay
-- This function upgrades a user to pro after successful payment
-- ============================================================

CREATE OR REPLACE FUNCTION public.upgrade_user_to_pro(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users
  SET
    plan       = 'pro',
    updated_at = now()
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Usage from Netlify webhook function:
-- await supabase.rpc('upgrade_user_to_pro', { user_email: 'user@example.com' })
