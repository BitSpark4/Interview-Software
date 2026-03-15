# Supabase Backend Setup

Run these SQL files **in order** inside:
**Supabase Dashboard → SQL Editor → New Query → Paste → Run**

---

## Order to run

| File | What it does | When |
|------|-------------|------|
| `01_tables.sql` | Creates all 4 tables | Phase 1 |
| `02_rls.sql` | Enables RLS + all security policies | Phase 1 |
| `03_triggers.sql` | Auto-creates user row on signup + monthly reset | Phase 1 |
| `04_indexes.sql` | Performance indexes | Phase 1 |
| `05_razorpay_webhook.sql` | Upgrade user to pro function | Phase 6 only |

---

## Tables created

| Table | Purpose |
|-------|---------|
| `users` | Extended profile (name, plan, streak, score averages) |
| `sessions` | Each interview attempt — role, type, score, verdict |
| `messages` | Every Q&A in a session (feedback stored as JSONB) |
| `weak_areas` | Per-user weak areas tracked across sessions |

---

## After running all files, verify in Supabase:

1. **Table Editor** → you should see 4 tables: `users`, `sessions`, `messages`, `weak_areas`
2. **Authentication → Policies** → each table should show RLS enabled + policies listed
3. **Database → Functions** → `handle_new_user` and `reset_monthly_interviews` should exist

---

## Test the signup trigger

After running all files, create a test user via Supabase Auth UI or your app signup.
Then check **Table Editor → users** — a row should appear automatically.
