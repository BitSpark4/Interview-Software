# CLAUDE.md — InterviewIQ
# Read completely before any changes.

## Stack
Deploy: Netlify 
React 18 + Vite Frontend SPA 
Tailwind CSS Styling 
Supabase Auth + DB + Storage 
Claude API AI engine 
Razorpay INR payments
Netlify Hosting Free 
pdf.js Resume parsing 

## Folder Structure
src/components/  → Reusable UI only (no business logic)
src/pages/       → Landing, Login, Dashboard, Interview
src/lib/         → supabase.js, claudeApi.js, razorpay.js (API ONLY)
src/hooks/       → useAuth.js, useInterview.js, useUsage.js
src/utils/       → pdfParser.js, scoreHelpers.js

## Code Rules (strictly enforced)
- Functional components only. No class components.
- All async: async/await + try/catch. No .then() chains.
- All API calls through /lib files only. NEVER fetch() in components.
- Every async button MUST show loading spinner.
- Error states: inline red text. Never alert().
- Mobile-first: 375px minimum breakpoint.

## Agents to Use
- senior-architect → system design decisions
- senior-frontend-react → complex React architecture
- ui-ux-designer → page layouts + design system
- supabase-specialist → ALL database + RLS work
- senior-code-reviewer → run after EVERY phase
- git-commit-helper → commit messages

## Business Logic
- Free: 3 sessions/month. Check BEFORE starting (never after).
- Pro: unlimited. Razorpay webhook sets plan='pro' in Supabase.
- Always increment interviews_used after session completes.

## Supabase Rules
- RLS on ALL tables. Anon key on frontend only.
- Tables: users(id,email,plan,interviews_used)
         sessions(id,user_id,role,score,completed)
         messages(id,session_id,sender,content,score)

## Phase Tracker
- [x] P1: Scaffold + routing — COMPLETE
- [x] P2: Claude interview engine — COMPLETE
- [x] P3: Auth + plan gating + progress — COMPLETE (Razorpay deferred to P6)
- [x] P4: Resume upload (pdf.js parsing) — COMPLETE
- [x] P5: Landing page polish + PWA — COMPLETE (manifest, SW, SEO, full landing)
- [x] P6: Razorpay payments — COMPLETE (test mode, switch RAZORPAY_KEY_ID/SECRET to live in Netlify env)

## Boundaries — Strict Rules
- Only work inside this project folder
- Never read files outside this directory
- Never access system files or other projects
- Only connect to: Supabase project URL in .env.local
- Only push to: the GitHub repo defined in git remote
- Never read or write to any path outside /src, /public, /tests
```
