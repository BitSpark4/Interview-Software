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

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
|------|----------|
| `detect_changes` | Reviewing code changes � gives risk-scored analysis |
| `get_review_context` | Need source snippets for review � token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.
