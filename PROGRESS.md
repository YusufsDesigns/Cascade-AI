# PROGRESS.md — Cascade Build Log

## How To Use This File

At the END of every build session, log what was done, what's broken, and what's next.
This file is the handoff between sessions. When you start a new session, read the
LAST entry first. It tells you exactly where you are and what to do next.

Format for each entry:
```
## Session [N] — [Date] — [Duration]
### ✅ Completed
### ⚠️ Issues / Blockers
### 🔴 Broken / Needs Fix
### 📋 Next Session Starts With
```

---

## Project Status Overview

| Area | Status |
|---|---|
| Next.js scaffold | ✅ Done |
| Packages installed | ✅ Done |
| Gemini API tested | ✅ Done |
| Prisma schema | ✅ Done |
| Neon DB connected | ✅ Done |
| shadcn setup | ✅ Done |
| Framer Motion installed | ✅ Done |
| Sonner installed | ✅ Done |
| Sidebar + Shell layout | ✅ Done |
| Login page | ✅ Done |
| Dashboard page | ✅ Done (stub) |
| Onboard page + PromptInput | ✅ Done |
| Agent Feed component | ✅ Done |
| Orchestrator Agent | ✅ Done |
| Communication Agent | ✅ Done |
| Project Agent | ✅ Done |
| /api/onboard route + SSE | ✅ Done |
| Email cards (review page) | ✅ Done |
| Milestone cards | ✅ Done |
| Resend integration | ✅ Done |
| QStash follow-up | ✅ Done (scheduler + webhook + intake cancel) |
| Intake form (public) | ✅ Done |
| Settings page | ✅ Done |
| Trigger 3 — Post-meeting finalization | ✅ Done |
| Trigger 4 — Project completion | ✅ Done |
| Milestone status pills | ✅ Done |
| Run history (all agent activations) | ✅ Done |
| Completion banner | ✅ Done |
| Duplicate email/risk bug fixed | ✅ Done |
| Vultr + Coolify deployment | 🔶 Partial (Dockerfile + docker-compose.yml done; server not yet provisioned) |
| Demo video recorded | ⬜ Not started |
| GitHub README written | ⬜ Not started |
| Submitted to hackathon | ⬜ Not started |

---

## Build Order (Priority Queue)

Build in this exact order. Do not skip ahead.

```
PHASE 1 — FOUNDATION (do this first session)
  [ ] shadcn init + install all UI components
  [ ] Install framer-motion, sonner, lucide-react
  [ ] lib/utils.ts → cn() function
  [ ] lib/db/prisma.ts → Prisma singleton
  [ ] Sidebar.tsx + Shell.tsx layout
  [ ] (dashboard)/layout.tsx wrapping sidebar
  [ ] Login page (simple, NextAuth credential)

PHASE 2 — CORE AGENT (second session)
  [ ] lib/tools/deal-tools.ts → extractDealInfo, assessCompleteness
  [ ] lib/agents/orchestrator.ts → full agent loop
  [ ] Test orchestrator in isolation with hardcoded brief
  [ ] /api/onboard/route.ts → SSE streaming
  [ ] AgentFeed.tsx + AgentLine.tsx (reads SSE, renders lines)
  [ ] /onboard page → PromptInput + AgentFeed wired together

PHASE 3 — SUB-AGENTS (third session)
  [ ] lib/tools/comms-tools.ts → draftWelcomeEmail, draftQuestionnaire, draftFollowUp
  [ ] lib/agents/communication.ts → full agent loop
  [ ] lib/tools/project-tools.ts → createMilestones, assignOwners, flagRisks
  [ ] lib/agents/project.ts → full agent loop
  [ ] Wire Promise.all() delegation in orchestrator's executeDelegateToAgents
  [ ] Test full 3-agent pipeline end to end

PHASE 4 — REVIEW DASHBOARD (fourth session)
  [ ] /projects/[id] page
  [ ] EmailCard.tsx with edit/approve/send
  [ ] MilestoneList.tsx + MilestoneCard.tsx
  [ ] /api/emails/[id]/route.ts → PATCH (save edits)
  [ ] /api/emails/send/route.ts → POST (Resend)
  [ ] lib/email/resend.ts → sendEmail helper

PHASE 5 — AUTOMATION + INTAKE (fifth session)
  [ ] lib/scheduler/qstash.ts → schedule + cancel helpers
  [ ] /api/webhooks/followup/route.ts → auto-send on trigger
  [ ] IntakeForm.tsx → multistep framer-motion form
  [ ] /intake/[projectId]/[token]/page.tsx → public client page
  [ ] /api/intake/[projectId]/route.ts → GET questions / POST submit
  [ ] Cancel follow-up when intake submitted

PHASE 6 — POLISH + DEPLOY (sixth session, final)
  [ ] Dashboard page → ProjectCard list + stats row
  [ ] Settings page → TeamMember CRUD
  [ ] AgentSummary.tsx → completion state after feed ends
  [ ] Dockerfile + docker-compose.yml
  [ ] Vultr VM provisioned
  [ ] Coolify installed + GitHub repo connected
  [ ] Env vars set in Coolify
  [ ] First successful deployment
  [ ] Public URL working

PHASE 7 — SUBMISSION (final day)
  [ ] End-to-end test with 3 different deal briefs
  [ ] Record demo video (script it: input → agents running → review → send)
  [ ] Write GitHub README with architecture diagram
  [ ] Submit to lablab.ai hackathon page
  [ ] Post X + LinkedIn build-in-public update
```

---

## Session Log

---

## Session 1 — May 12, 2026 — ~2 hours

### ✅ Completed
- Next.js 16 project scaffolded with TypeScript + Tailwind
- GitHub repo created and pushed
- Core packages installed: @google/genai, prisma, resend, @upstash/qstash, next-auth, zod, dotenv
- Gemini API key obtained from Google AI Studio
- test-gemini.ts file created and tested — Gemini responding successfully
- Prisma schema written (Project, Milestone, ProjectEmail, FollowUp, IntakeForm, TeamMember)
- Neon database created and DATABASE_URL set in .env.local
- First Prisma migration run successfully (npx prisma migrate dev --name init)
- Prisma generate run — client types available
- CLAUDE.md, STYLE.md, PROGRESS.md created in project root

### ⚠️ Issues
- Windows PowerShell env variable syntax tripped up first Gemini test (resolved — used dotenv)
- Old API key accidentally shared in chat (revoked and replaced)
- Gemini 2.0 Flash was deprecated — switched to gemini-2.5-flash in all references

### 🔴 Broken / Needs Fix
- Nothing currently broken

### 📋 Next Session Starts With
1. `npx shadcn@latest init` — initialise shadcn in the project
2. `npx shadcn@latest add button card input label textarea select checkbox radio-group tooltip badge`
3. `npm install framer-motion sonner lucide-react clsx tailwind-merge`
4. Add `cn()` to `lib/utils.ts`
5. Create `lib/db/prisma.ts` Prisma singleton
6. Build `Sidebar.tsx` and `Shell.tsx`
7. Build `(dashboard)/layout.tsx`

---

<!-- PASTE NEW SESSION ENTRIES BELOW THIS LINE -->
<!-- Copy the template, fill it in, leave blank entries for future sessions -->

---

## Session 2 — May 15, 2026 — ~1.5 hours

### ✅ Completed
- Prisma v7 setup: `prisma/schema.prisma` with all 6 models (Project, ProjectEmail, Milestone, FollowUp, IntakeForm, TeamMember)
- `prisma.config.ts` created (Prisma v7 datasource config pattern)
- `@prisma/adapter-pg` + `pg` installed; Prisma client generated to `generated/prisma/`
- `lib/db/prisma.ts` singleton with PrismaPg adapter (global reuse pattern)
- `lib/utils.ts` with `cn()` helper
- `globals.css` updated with full STYLE.md design system (CSS vars, shadcn tokens, no dark mode)
- shadcn initialized + button, card, input, label, textarea, select, checkbox, badge, tooltip installed
- framer-motion, sonner, lucide-react, clsx, tailwind-merge installed
- `components/layout/Sidebar.tsx` — fixed 240px nav with active state
- `components/layout/Shell.tsx` — layout wrapper
- `app/(dashboard)/layout.tsx` — dashboard shell wrapper
- `app/(dashboard)/dashboard/page.tsx` — stats row + empty state stub
- `app/(auth)/login/page.tsx` — NextAuth credentials login form
- `app/layout.tsx` — updated metadata, TooltipProvider, Toaster
- TypeScript passes clean (0 errors)
- Dev server running on http://localhost:3000

### ⚠️ Issues / Blockers
- DATABASE_URL must be set in `.env.local` before running `prisma migrate dev`
- NextAuth not yet configured (auth/route.ts + auth.ts still missing)

### 🔴 Broken / Needs Fix
- Nothing currently broken

### 📋 Next Session Starts With
1. Set up NextAuth: create `auth.ts` (credentials provider) + `app/api/auth/[...nextauth]/route.ts`
2. Add auth guard to `(dashboard)/layout.tsx`
3. Move into Phase 2: `lib/tools/deal-tools.ts` → extractDealInfo, assessCompleteness
4. `lib/agents/orchestrator.ts` → full agent loop with Gemini 2.5 Flash
5. `/api/onboard/route.ts` → SSE streaming endpoint
6. `AgentFeed.tsx` + `AgentLine.tsx` components
7. `/onboard` page → PromptInput + AgentFeed wired

---

## Session 3 — May 15, 2026 — ~1 hour

### ✅ Completed
- Prisma migration applied to Neon DB (fixed: `prisma.config.ts` now loads `.env.local` via dotenv)
- `auth.ts` — NextAuth v5 credentials provider (email/password, env-configurable)
- `app/api/auth/[...nextauth]/route.ts` — auth handlers
- `(dashboard)/layout.tsx` — server-side auth guard (redirects to /login if no session)
- `app/page.tsx` — redirects root to /dashboard
- `lib/tools/deal-tools.ts` — extractDealInfo (Gemini), assessCompleteness
- `lib/tools/comms-tools.ts` — draftWelcomeEmail, draftIntakeQuestionnaire, draftKickoffAgenda
- `lib/tools/project-tools.ts` — createMilestones (Gemini, returns phases + risks)
- `lib/agents/communication.ts` — full agent: 3 emails + intake form + follow-up saved to DB
- `lib/agents/project.ts` — full agent: milestones saved to DB
- `lib/agents/orchestrator.ts` — coordinates both sub-agents in parallel via Promise.all
- `app/api/onboard/route.ts` — SSE streaming endpoint
- `components/ui/prompt-input.tsx` — PromptInput compound component
- `components/agent-feed/AgentLine.tsx` — animated line renderer
- `components/agent-feed/AgentSummary.tsx` — completion card
- `components/agent-feed/AgentFeed.tsx` — SSE reader + renders lines
- `app/(dashboard)/onboard/page.tsx` — PromptInput + AgentFeed wired end-to-end
- TypeScript passes clean (0 errors)

### ⚠️ Issues / Blockers
- NEXTAUTH_SECRET must be set in .env.local for production; dev works without it but shows a warning
- ADMIN_EMAIL / ADMIN_PASSWORD fallback to hardcoded defaults if not set in env

### 🔴 Broken / Needs Fix
- /projects/[id] page doesn't exist yet — AgentSummary "Review & approve" button will 404

### 📋 Next Session Starts With
1. Build `/projects/[id]` review page (Phase 4)
2. `components/emails/EmailCard.tsx` — edit/approve/send
3. `components/milestones/MilestoneList.tsx` + `MilestoneCard.tsx`
4. `app/api/projects/[id]/route.ts` — GET single project with relations
5. `app/api/emails/[id]/route.ts` — PATCH (save edits)
6. `app/api/emails/send/route.ts` — POST (trigger Resend)
7. `lib/email/resend.ts` — sendEmail helper
8. Update dashboard page to fetch and list real projects

---

## Session 4 — May 15, 2026 — ~1 hour

### ✅ Completed
- Prisma schema: added `User` model + `userId` to `Project` and `TeamMember`; TeamMember email uniqueness scoped to `@@unique([userId, email])`
- DB reset + `prisma db push` applied cleanly (migrate dev is interactive-only; db push used for automation)
- `bcryptjs` installed for password hashing
- `auth.ts` updated: DB-backed credentials auth, `bcrypt.compare` verification, `userId` in JWT + session via callbacks
- `types/next-auth.d.ts`: session type extended with `user.id`
- `app/api/auth/register/route.ts`: checks duplicate email, hashes with bcrypt(10), creates User
- `app/(auth)/register/page.tsx`: full register form (companyName, name, email, password); gradient background; links to /login
- `app/(auth)/login/page.tsx`: redesigned with gradient bg, larger rounded card, link to /register
- `app/api/onboard/route.ts`: passes `session.user.id` to orchestrator
- `lib/agents/orchestrator.ts`: accepts `userId`, attaches it to project creation
- `components/agent-feed/AgentLine.tsx`: redesigned with icons per line type, cleaner mono layout
- `components/agent-feed/AgentSummary.tsx`: no auto-redirect; shows stats grid + "View project" button
- `components/agent-feed/AgentFeed.tsx`: fully redesigned — grouped sections per agent with colored headers, "Working…" pulse while streaming, section cards with bg tints
- `app/(dashboard)/onboard/page.tsx`: fully redesigned — centered command prompt when idle, full pipeline view when running; ⌘+Enter shortcut; example briefs; brief chip; "New brief" reset button
- TypeScript passes clean (0 errors)

### ⚠️ Issues / Blockers
- `prisma migrate dev` cannot run non-interactively — use `prisma db push` in scripts, run `migrate dev` manually in terminal for tracked migrations

### 🔴 Broken / Needs Fix
- /projects/[id] still 404 (Phase 4 not yet built)

### 🔴 Fixed this session
- Pipeline error: `AUTH_SECRET` (NextAuth v5) was missing — added via crypto.randomBytes, appended to `.env.local`
- Dashboard redesigned: server component with real DB fetch, personalized greeting, stat cards with hover lift, project list rows, proper empty state
- STYLE.md updated with all new patterns (auth pages, dashboard, command prompt layout, agent feed sections, design rules)

### 📋 Next Session Starts With
1. Phase 4: `/app/(dashboard)/projects/[id]/page.tsx` — review dashboard
2. `components/emails/EmailCard.tsx` — edit/approve/send
3. `components/milestones/MilestoneList.tsx` + `MilestoneCard.tsx`
4. `app/api/projects/route.ts` — GET all projects (scoped to userId)
5. `app/api/projects/[id]/route.ts` — GET single project with relations (scoped to userId)
6. `app/api/emails/[id]/route.ts` — PATCH (save edits)
7. `app/api/emails/send/route.ts` — POST (Resend)
8. `lib/email/resend.ts` — sendEmail helper
9. Update dashboard page to fetch + list real projects from DB

---

## Session 5 — May 15, 2026 — ~1 hour

### ✅ Completed
- Fixed signup failure: stale dev server was missing `AUTH_SECRET` — killed and restarted fresh
- Fixed `prisma.config.ts` to load `.env` (not `.env.local`) so Prisma CLI picks up DATABASE_URL
- Replaced generic Zap icon on auth pages with `Logo.png` (Next.js `<Image>`) — login + register
- Replaced "Cascade AI" text wordmark in Sidebar with `Logo.png`
- `lib/email/resend.ts` — Resend client + sendEmail helper
- `app/api/projects/[id]/route.ts` — GET single project with all relations, scoped to userId
- `app/api/emails/[id]/route.ts` — PATCH (save edits), blocks editing sent emails
- `app/api/emails/send/route.ts` — POST (Resend), marks email SENT after delivery
- `components/emails/EmailCard.tsx` — full edit/approve/send flow, local optimistic state, status badges with icons per email type
- `components/milestones/MilestoneCard.tsx` — phase dot, title, client-action badge, risk note, owner role pill, due date
- `components/milestones/MilestoneList.tsx` — renders list with empty state
- `app/(dashboard)/projects/[id]/page.tsx` — full review dashboard: header with avatar/status/brief chip, 2-col grid (emails left, plan + follow-up + intake link right)
- TypeScript passes clean (0 errors)

### ⚠️ Issues / Blockers
- Resend sending only works once RESEND_API_KEY and RESEND_FROM_EMAIL are set in `.env`
- Resend free tier requires verified sender domain — use onboarding@resend.dev for testing

### 🔴 Broken / Needs Fix
- Nothing currently broken

### 🔴 Fixed this session
- Signup was failing: `AUTH_SECRET` not loaded in stale dev server

### 📋 Next Session Starts With
1. Phase 5: `lib/scheduler/qstash.ts` — scheduleFollowUp + cancelFollowUp helpers
2. `app/api/webhooks/followup/route.ts` — QStash fires here after 48hrs, sends email via Resend
3. Wire QStash scheduling into `communication.ts` (currently just creates FollowUp DB record, doesn't call QStash)
4. `app/intake/[projectId]/[token]/page.tsx` — public multistep intake form (no auth)
5. `app/api/intake/[projectId]/route.ts` — GET questions / POST submit answers + cancel follow-up
6. Phase 6: `app/(dashboard)/settings/page.tsx` — TeamMember CRUD scoped to userId

---

## Session 6 — May 15, 2026 — ~1 hour

### ✅ Completed
- Full agent rebuild: all 6 agent/tool files replaced with true agentic architecture (while loops, functionDeclarations, Gemini decides tool calls, content written as tool args)
- `lib/tools/deal-tools.ts` — pure Tool schema + AgentEvent type; uses `Type` enum from @google/genai
- `lib/tools/comms-tools.ts` — pure Tool schema; uses `Type` enum
- `lib/tools/project-tools.ts` — pure Tool schema; uses `Type` enum
- `lib/agents/orchestrator.ts` — while loop, MAX_STEPS=15, messages array grows per round trip, clarification via in-memory Map, delegateToAgents runs Promise.all
- `lib/agents/communication.ts` — while loop, closure-based question buffer, IntakeForm upsert at start for token, all 4 tools in execute switch
- `lib/agents/project.ts` — while loop, saveMilestone/requestMoreContext/flagProjectRisk in execute switch
- `lib/agents/clarification.ts` — in-memory Map resolver (makeClarificationId, awaitClarification, submitClarification)
- `lib/scheduler/qstash.ts` — QStash client helper (scheduleFollowUpMessage, cancelQStashMessage using messages.cancel)
- `app/api/onboard/clarify/route.ts` — POST endpoint that resolves waiting agent clarification promises
- `AgentLine.tsx` — added `clarification` LineType + `questions`, `clarificationId`, `projectId` to FeedLine interface
- `AgentFeed.tsx` — handles `clarification` events with inline question form (textarea per question, Send button, submits to /api/onboard/clarify)
- TypeScript passes clean (0 errors)

### ⚠️ Issues / Blockers
- QStash `messages.cancel(id)` is the correct API (not `client.cancel(id)`)
- Tool schema `type` fields require `Type` enum from @google/genai (e.g. `Type.OBJECT`), not string literals

### 🔴 Broken / Needs Fix
- Nothing currently broken

### 📋 Next Session Starts With
1. Phase 5: `app/api/webhooks/followup/route.ts` — QStash fires here after 48hrs, sends email via Resend, marks FollowUp SENT
2. `app/intake/[projectId]/[token]/page.tsx` — public multistep intake form (no auth, Framer Motion AnimatePresence between questions)
3. `app/api/intake/[projectId]/route.ts` — GET questions / POST submit answers + cancel follow-up
4. Phase 6: `app/(dashboard)/settings/page.tsx` — TeamMember CRUD scoped to userId
5. `app/(dashboard)/dashboard/page.tsx` — update to show real project list with ProjectCard + status badges
6. Dockerfile + docker-compose.yml for Vultr/Coolify deployment

---

## Session 7 — May 16, 2026 — ~1 hour

### ✅ Completed
- Fixed `app/(dashboard)/onboard/page.tsx` — removed invalid mid-file `import` statements and inline duplicate component definitions; all attachment state (PDF, URL) now snapshotted at submit time via `activePdf`/`activeUrl` state
- Updated `components/agent-feed/AgentFeed.tsx` — added optional `pdfFile?: File | null` and `websiteUrl?: string` props; conditionally sends FormData (when PDF/URL present) or JSON; eliminates need for separate AgentFeedFormData component
- `app/intake/[projectId]/[token]/page.tsx` (NEW) — public multistep intake form: Framer Motion directional slide transitions (AnimatePresence mode="wait"), progress bar with animated width, dot navigation, 4 question input types (text, textarea, select, checkbox), already-submitted detection, animated success screen with client name
- `app/api/intake/[projectId]/route.ts` — GET now includes `clientName` from project relation for success screen personalization
- TypeScript: 0 errors across all files

### ⚠️ Issues / Blockers
- None

### 🔴 Broken / Needs Fix
- Nothing currently broken

### 📋 Next Session Starts With
1. `app/(dashboard)/settings/page.tsx` — TeamMember CRUD scoped to userId (list + add + delete)
2. `app/(dashboard)/projects/[id]/page.tsx` — verify risk flags from `ProjectRisk` table are displayed in MilestoneList
3. `app/(dashboard)/dashboard/page.tsx` — verify real project list renders with correct status badges
4. Dockerfile + docker-compose.yml for Vultr/Coolify deployment
5. End-to-end test: brief → agents → review → send email → intake form → re-activation

---

## Session 8 — May 16, 2026 — ~45 minutes

### ✅ Completed
- `app/api/team/route.ts` — GET (list members scoped to userId) + POST (create, unique email constraint, P2002 handled)
- `app/api/team/[id]/route.ts` — DELETE (ownership-checked before delete)
- `app/(dashboard)/settings/page.tsx` — server component: fetches user + members, passes to SettingsClient
- `app/(dashboard)/settings/SettingsClient.tsx` — client CRUD: animated add form (inline, not modal), role picker buttons, delete with trash icon + spinner, AnimatePresence exit on remove, empty state
- `app/(dashboard)/projects/[id]/page.tsx` — added `risks: true` to Prisma include; added Risk Flags section with severity-coloured cards (red/amber/zinc), ShieldAlert icon, count badge
- `Dockerfile` — multi-stage Node 20 Alpine build with standalone output; non-root `nextjs` user
- `docker-compose.yml` — app service with env_file + healthcheck
- `next.config.ts` — `output: 'standalone'` for Docker compatibility
- `app/api/health/route.ts` — GET returns `{ ok: true }` for healthcheck
- `components/layout/Sidebar.tsx` — replaced hardcoded "Y" / "Account" with real `userName`/`userEmail` props; logout button calls `signOut({ callbackUrl: '/login' })`
- `components/layout/Shell.tsx` — passes `userName`/`userEmail` down to Sidebar
- `app/(dashboard)/layout.tsx` — extracts `session.user.name` + `.email` and forwards to Shell
- TypeScript: 0 errors across all files

### ⚠️ Issues / Blockers
- None

### 🔴 Broken / Needs Fix
- Nothing currently broken

### 📋 Next Session Starts With
1. **End-to-end test** — run dev server, submit a real brief, watch agents stream, check emails/milestones/risks on project page, open intake form URL, submit it, verify re-activation
2. **Provision Vultr VM** — Ubuntu 22.04, 2GB RAM; install Coolify via marketplace
3. **Deploy to Coolify** — connect GitHub, add PostgreSQL resource, set env vars, first deploy
4. **Run `npx prisma migrate deploy`** on production DB after first deploy
5. **GitHub README** — architecture diagram + features + quick-start (see /mnt/skills/user/create-readme/SKILL.md)
6. **Demo video** — follow the 3-minute script in CLAUDE.md section 19

---

## Session 9 — May 16, 2026 — ~1 hour

### ✅ Completed
- Complete agent feed UI rebuild from scratch
- `AgentLine.tsx` — 22 event types, each with distinct visual (thinking dots, reading_doc progress bar, email_sent slide-in, risk scale animation, parallel_start dual pill, delegate centered divider, etc.)
- New `AgentEvent` type with expanded `AgentId` (now includes `research`) and `data?: Record<string, unknown>` field
- `AgentFeed.tsx` — flat `lines[]` array (no sections), elapsed timer, stats tracking (emailCount/milestoneCount/riskCount via refs), dimming all lines when clarification is pending, auto-scroll disabled during clarification
- `ClarificationCard.tsx` — auto-focuses first textarea on mount (80ms delay), ⌘+Enter to submit
- `AgentSummary.tsx` — stats grid (emails sent / milestones / risks flagged), elapsed time, indigo CTA button
- `app/(dashboard)/onboard/page.tsx` — two-column layout (40/60), brief chip on left when running, sticky feed on right, placeholder when idle, examples collapse when running
- TypeScript: 0 errors. Build: passes clean.

### ⚠️ Issues / Blockers
- New SSE event types (thinking, reading_doc, reading_web, searching, intelligence, discrepancy, generating, email_sent, question_saved, milestone_saved, risk, parallel_start) need to be emitted by the agent files to be visible in the feed — they render correctly when received but the current agent code may still emit only the old event types

### 🔴 Broken / Needs Fix
- Nothing currently broken

### 📋 Next Session Starts With
1. End-to-end test — run dev server, submit a real brief, verify new feed event types stream correctly
2. Update agent files to emit new SSE event types (research, thinking, reading_doc, etc.) for the Research Agent
3. Provision Vultr VM + Coolify deployment
4. GitHub README + demo video

---

## Session 10 — May 17, 2026 — ~2 hours

### ✅ Completed
- **FIX 1** — `app/api/intake/[projectId]/route.ts` POST: sets Project.status='ACTIVE', cancels SCHEDULED follow-up via cancelQStashMessage, fires `runReactivationAgents` in background
- **FIX 2** — `lib/agents/reactivation.ts` (NEW): coordinator runs comms + project reactivation agents in parallel; comms sends CONFIRMATION email + optionally creates MeetingRequest; project agent flags new risks from answers
- **FIX 3** — Intake success screen: `CheckCircle2` icon, updated copy ("You're all set!")
- **FIX 4** — `lib/email/milestone-notification.ts` (NEW): HTML email to assigned team member with milestone/project/due date details
- **FIX 5** — `MilestoneCard.tsx`: replaced custom dropdown with native `<select>` + `router.refresh()` after assignment
- **FIX 6** — `app/api/milestones/[id]/assign/route.ts`: calls `sendMilestoneAssignmentEmail` after milestone update (fire and forget)
- **Settings warning** — `SettingsClient.tsx`: amber warning banner when no team members are added
- **Meeting Request Flow (schema)** — Added `MeetingRequest` model + `MeetingStatus` enum to schema; added `meetingRequests MeetingRequest[]` to Project; `prisma db push` applied successfully
- **Meeting Request Flow (enum)** — Removed `KICKOFF` from `EmailType`, added `CONFIRMATION`; deleted existing KICKOFF email records before migration
- **Meeting Request Flow (initial comms agent)** — `communication.ts` system prompt updated: removed all kickoff agenda mention; agent now has 3 jobs (welcome, questionnaire, schedule follow-up); `saveEmail` case simplified (no KICKOFF branch)
- **Meeting Request Flow (tools)** — `lib/tools/reactivation-tools.ts` (NEW): saveEmail + requestMeeting tools for comms; flagProjectRisk for project reactivation
- **Meeting Request Flow (reactivation agent)** — `lib/agents/reactivation.ts`: CONFIRMATION email sends immediately via Resend; requestMeeting creates DB record + notifies PM
- **Meeting Request Flow (project page card)** — `MeetingRequestCard.tsx` (NEW): editable draft email, Approve & Send, Dismiss; integrated in project page above action items
- **Meeting Request Flow (API routes)** — `POST /api/meeting-requests/[id]/send` and `POST /api/meeting-requests/[id]/decline`
- **AgentLine** — Added `meeting_requested` visual; added `reactivation` to AgentId; added `reactivation` to AgentLine/ClarificationCard meta maps
- **EmailCard** — Updated local `EmailType` type from KICKOFF → CONFIRMATION
- TypeScript: 0 errors after all changes

### ⚠️ Issues / Blockers
- Reactivation agents run fire-and-forget after intake submission — errors are only visible in server logs
- `sendMilestoneAssignmentEmail` uses fire-and-forget; if Resend is not configured it silently fails

### 🔴 Broken / Needs Fix
- Nothing currently broken

### 📋 Next Session Starts With
1. End-to-end test — submit a brief, run agents, open intake form, submit it, verify CONFIRMATION email sent + agents re-activated
2. Provision Vultr VM + Coolify deployment
3. GitHub README + demo video

---

## Session 11 — May 18, 2026 — ~2 hours

### ✅ Completed

**Bug Fixes:**
- **Duplicate emails/risks bug** — root cause was `response.functionCalls[0]` in all while loops; when Gemini returned multiple tool calls per response, only the first was executed, causing Gemini to retry all calls exponentially. Fixed in `lib/agents/reactivation.ts` (both `runReactivationCommsAgent` and `runReactivationProjectAgent`) by processing ALL function calls per response iteration using the same multi-call pattern from `project.ts`.

**Trigger 3 — Post-Meeting Finalization:**
- `prisma/schema.prisma` — added `meetingNotes String? @db.Text`, `meetingCompleted Boolean @default(false)`, `meetingCompletedAt DateTime?` to `MeetingRequest`; added `completionSummary String? @db.Text` to `Project`; added `FINALIZATION` and `COMPLETION` to `EmailType` enum; `prisma db push` + `prisma generate` applied
- `lib/tools/finalization-tools.ts` — `finalizationCommsTools` (saveEmail) + `finalizationProjectTools` (updateMilestone, flagRisk, finalizeProjectPlan)
- `lib/agents/finalization.ts` — `runFinalizationAgents`: two parallel agents (comms + project) using multi-call while loop; builds full context from brief, contract, intake Q&A, meeting notes, existing milestones/risks
- `app/api/projects/[id]/post-meeting/route.ts` — POST: saves meetingNotes to MeetingRequest, sets meetingCompleted=true, fires finalization agents in background, logs 'finalization' run events
- `components/projects/MeetingOutcomeCard.tsx` (NEW) — blue-themed card shown after meeting request sent; AnimatePresence between button/notepad states; submits to post-meeting route

**Trigger 4 — Project Completion:**
- `lib/tools/completion-tools.ts` — `completionTools` with `generateCompletionSummary` + `sendCompletionEmail` tools
- `lib/agents/completion.ts` — `runCompletionAgent`: single agent; generates handoff summary, saves to `Project.completionSummary`, sends COMPLETION email via Resend (falls back to DRAFT on failure)
- `app/api/milestones/[id]/status/route.ts` — PATCH: maps not_started/in_progress/completed → PENDING/IN_PROGRESS/COMPLETED enum; checks if all project milestones COMPLETED; triggers `runCompletionAgent` in background when all done; returns `{ status, completionTriggered: boolean }`

**UI Enhancements:**
- `components/milestones/MilestoneCard.tsx` — added status selector pills (Not started / In progress / Complete) between description and meta row; optimistic local state update; toast when completion triggers agents
- `components/milestones/MilestoneList.tsx` — removed `onAllComplete` prop (server component constraint)
- `components/emails/EmailCard.tsx` — added FINALIZATION and COMPLETION to EmailType + typeConfig (PostHog blue + emerald colors)
- `components/agent-feed/RunHistory.tsx` (NEW) — groups agent runs by runType; past runs show as collapsible sections with ChevronDown; latest run uses LiveAgentFeed for live polling; RUN_LABELS: initial/reactivation/finalization/completion
- `app/(dashboard)/projects/[id]/page.tsx` — added event grouping logic (Map by runType, sorted by RUN_ORDER); replaced LiveAgentFeed block with RunHistory; added MeetingOutcomeCard when meeting sent but not yet completed; added completion banner (emerald) when project.status === 'COMPLETED'

**TypeScript: 0 errors across all files.**

### ⚠️ Issues / Blockers
- `meetingCompleted` field requires type assertion (`as (typeof latestMeeting & { meetingCompleted?: boolean }) | undefined`) in project page until Prisma client is regenerated fresh — schema was pushed but TS types may lag on first load
- Finalization/completion agents run fire-and-forget after route returns — errors only visible in server logs

### 🔴 Broken / Needs Fix
- Nothing currently broken

### 📋 Next Session Starts With
1. End-to-end test — submit brief, approve emails, submit intake, watch reactivation, log meeting outcome, watch finalization, mark all milestones complete, watch completion agent fire
2. Provision Vultr VM + Coolify deployment
3. GitHub README + demo video

---

## Session 12 (FINAL) — [Date] — [Duration]

### ✅ Completed
-

### Demo Notes
- Deal brief used for demo:
- Agents performed:
- Total time from brief to complete:
- Public URL:

### Submission Checklist
- [ ] GitHub repo is public
- [ ] README has architecture diagram
- [ ] Demo video uploaded
- [ ] Submitted to lablab.ai
- [ ] X post published
- [ ] LinkedIn post published