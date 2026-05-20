# Cascade

**Autonomous multi-agent B2B client onboarding — powered by Gemini 2.5 Flash, deployed on Vultr**

> Built for the [AI Agent Olympics Hackathon](https://lablab.ai/event/ai-agent-olympics) at Milan AI Week 2026  
> Solo build · 7 days · Abuja, Nigeria
>Site - https://cascadeai.live/

---

## What Is Cascade

Cascade is an autonomous multi-agent platform that handles B2B client onboarding from deal close to active project — without manual coordination.

When a deal closes, the account manager pastes a brief and uploads the signed contract. Four AI agents powered by **Gemini 2.5 Flash** activate: a Research Agent reads the PDF and the client's website using Gemini's native multimodal capabilities; an Orchestrator plans strategy and delegates; a Communication Agent drafts and sends personalized emails; and a Project Agent builds a milestone plan, assigns team members, and flags risks it identified independently.

When the client submits the intake form, agents **re-activate automatically** with no human trigger. They read the responses, update the project plan, send a personalized confirmation, and notify the team. If a meeting is needed, the agent generates the request and surfaces it to the PM for review.

What used to take 3–4 hours of manual coordination happens in under 90 seconds.

---

## The Problem It Solves

Every service business — agency, consultancy, software studio — has the same broken process when a deal closes:

- Account manager manually writes a welcome email from last month's template
- Intake questionnaire is the same 5 generic questions regardless of the project
- Project plan is built from memory, usually missing client dependencies
- Team members find out they're assigned weeks later
- Client goes quiet and nobody sends a follow-up because everyone forgot
- Meeting notes from the kickoff call disappear

One slipped step and the client loses confidence before the work has even started. Cascade eliminates every one of these failure points with agents that observe events, make decisions, and act.

---

## Why This Is A Genuine Agentic Workflow

Cascade is not a content generator or a pipeline with an AI label. Every behavior described below is driven by **Gemini making decisions through tool calling loops** — not hardcoded sequences.

**Gemini decides what to call.** Each agent has a set of tools declared as function schemas. Gemini reads the context, reasons about what is needed next, and calls the appropriate tool with arguments it fills in itself. The developer's code only executes what Gemini requests. The sequence is not predetermined.

**Agents ask when they need to.** Every agent has a `requestMoreContext` tool. When Gemini identifies an ambiguity that would compromise its output quality, it calls this tool with a specific, targeted question. The feed pauses. The account manager answers inline. The agent continues with the answer incorporated into its full conversation history.

**Agents flag risks nobody mentioned.** The Project Agent calls `flagRisk` independently when it reads the deliverables and contract language and identifies blocking dependencies. Nobody instructs it to look for Paystack credentials or Dojah API requirements. It reasons about what each deliverable requires and surfaces the dependencies.

**The system responds to real-world events.** When the client submits the intake form, agents re-activate with no human trigger. The system observed a world event and responded with multiple intelligent actions in parallel.

**Agents accumulate full conversation history.** Every Gemini call receives the complete message history from the beginning of that agent's session. Gemini never loses context across tool calls within a run.

**All agent events persist in the database.** Every event from every agent run is saved to an `AgentEvent` table as it occurs. The browser is not involved in whether agents run. Refreshing the page, closing the tab, or losing connection does not stop the agents. The project page polls for new events every 2 seconds and renders them when they arrive.

---

## The Four Agents

### 1 — Research Agent

Runs before any email is drafted or milestone created. It is the only agent with access to external information sources.

**Tools available:**
- `readDocument` — Receives the contract PDF as raw base64 bytes and passes them to Gemini as `inlineData`. Gemini reads the entire document natively — no parsing library, no text extraction. It identifies every deliverable, payment milestone, revision round, IP clause, and client obligation in the contract. It then compares these against the text brief and flags any discrepancy it finds.
- `readClientWebsite` — Makes a secondary Gemini call with URL Context enabled. Gemini fetches and reads the client's actual website, extracting their industry, company description, tone of voice, technical maturity signals, and team size context.
- `searchClientBackground` — Uses Gemini's built-in Google Search tool to find recent news about the company — funding rounds, product launches, leadership changes.
- `synthesizeIntelligence` — Combines all findings into a structured client intelligence profile saved to `Project.clientIntelligence`. This profile is passed to every downstream agent.

### 2 — Orchestrator Agent

Receives the deal brief and the Research Agent's intelligence profile. Makes all strategic decisions.

**Tools available:**
- `extractDealInfo` — Extracts structured data from the natural language brief: client name, contact email, deliverables list, timeline, budget. Gemini fills in all values itself.
- `requestClarification` — Called when critical information is missing or ambiguous. Generates a specific, targeted question. The execute function saves the pending question and emits a `clarification` event to the live feed. The agent pauses and waits.
- `assessComplexity` — Evaluates deliverable count and timeline against each other to determine standard or high complexity.
- `delegateToAgents` — Final step. Triggers `Promise.all([runCommunicationAgent(), runProjectAgent()])`. Both sub-agents start simultaneously.

### 3 — Communication Agent

Handles all outgoing client communications. Uses the full intelligence profile to personalize every output.

**Initial run tools:**
- `saveEmail (WELCOME)` — Gemini writes the full welcome email body as tool arguments, informed by research findings. The execute function calls Resend and **sends the email immediately**. Saved with status `SENT`.
- `saveEmail (INTAKE_QUESTIONNAIRE)` — Generates 5-8 targeted questions specific to the actual deliverables — not generic questions. Includes a link to the client's intake form at `/intake/[projectId]/[token]`. Sends immediately via Resend.
- `scheduleFollowUp` — Calls QStash API to schedule an automatic 48-hour follow-up webhook. Stores the QStash message ID for later cancellation.

**Reactivation run tools (after intake form submission):**
- `sendConfirmationEmail` — Reads the client's intake responses and writes a confirmation email referencing their specific answers. Not a template.
- `requestMeeting` — Called only when responses are unclear or contradictory. Gemini generates a specific explanation of why a meeting is needed and a draft email for the PM to review. Not called as a formality.

### 4 — Project Agent

Builds the project plan from contract deliverables and timeline. Assigns team members. Finds risks.

**Tools available:**
- `saveMilestone` — Called once per milestone. Gemini generates the title, description, phase, dates, and ownerRole from the deliverables and timeline. The execute function resolves the role to an actual TeamMember record and sends them a notification email via Resend.
- `flagRisk` — Called independently when Gemini identifies a blocking dependency. No instruction to look for risks — it reasons about what each deliverable requires and surfaces what must come from the client before work can proceed.
- `requestMoreContext` — If deliverable scope is vague, Gemini asks before building the plan.
- `updateMilestone` — Used during reactivation and finalization runs to update existing milestones based on new information.

---

## The Full Project Lifecycle

```
TRIGGER 1 — Brief + PDF submitted
─────────────────────────────────────────────────────────────
Research Agent     reads PDF (native Gemini doc understanding)
                   reads client website (URL Context)
                   searches web background (Google Search tool)
                   synthesizes client intelligence profile

Orchestrator       extracts all structured information
                   asks for clarification if needed (pauses feed)
                   assesses complexity
                   delegates to Communication + Project simultaneously

Communication      sends welcome email via Resend (SENT, not draft)
                   sends intake questionnaire email via Resend
                   schedules 48hr follow-up via QStash

Project            creates milestones (Gemini decides phases + owners)
                   assigns real team members (resolves role → person)
                   flags risks independently
                   sends milestone notification emails to team

Project status → ONBOARDING

TRIGGER 2 — Client submits intake form
─────────────────────────────────────────────────────────────
QStash follow-up   cancelled automatically (client responded)

Communication      reads actual intake responses
                   sends personalized confirmation email
                   if unclear: generates meeting request for PM review

Project            updates milestones from new information
                   flags any new risks revealed by answers

Project status → ACTIVE (or MEETING_REQUESTED)

TRIGGER 3 — PM logs meeting outcome (only if meeting occurred)
─────────────────────────────────────────────────────────────
PM types what was discussed and decided (free text, any format)
Full context assembled: brief + contract + intake + meeting notes

Communication      drafts project plan confirmation email (DRAFT, PM reviews)

Project            finalizes milestones with complete information
                   corrects anything that changed in the meeting
                   flags any new risks from meeting discussion

Project status → ACTIVE

TRIGGER 4 — PM marks final milestone complete
─────────────────────────────────────────────────────────────
Completion Agent   reads complete project history
                   generates project handoff summary
                   sends to client automatically
                   closes the project

Project status → COMPLETED
```

---

## Multimodal Inputs

Three input types feed the Research Agent. All processed natively by Gemini.

### PDF Contract / Statement of Work

```typescript
// Passed to Gemini as raw bytes — no PDF parsing library
const messages = [{
  role: 'user',
  parts: [
    {
      inlineData: {
        mimeType: 'application/pdf',
        data: pdfBase64  // base64-encoded contract bytes
      }
    },
    {
      text: 'Extract all deliverables, payment milestones, revision rounds, IP terms, and client obligations. Compare against the project brief and flag any discrepancies.'
    }
  ]
}]
```

Gemini reads the full document. It extracts structured data from legal language, identifies what the client must provide before work can begin, and surfaces scope or timeline differences between the contract and the brief.

### Client Website — URL Context

```typescript
// Secondary Gemini call with URL Context tool enabled
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [{ role: 'user', parts: [{ text: `Read this company website: ${url}` }] }],
  config: {
    tools: [{ urlContext: {} }]  // Gemini fetches and reads the URL
  }
})
```

Gemini reads the actual website — not a cached version. It extracts industry positioning, company description, tone of voice (formal, casual, technical), and any technology signals from career pages or product descriptions. Every communication Cascade produces is personalized using this context.

### Web Search

Gemini's built-in Google Search tool retrieves recent news about the company — funding, launches, leadership — giving the Research Agent context that makes the welcome email genuinely relevant.

---

## Agent Event Persistence

Agent events are written to the database as they occur, not streamed through the HTTP connection. This decouples agent execution from browser state entirely.

```typescript
// The onStep callback saves to DB — browser not involved
export function createEventLogger(projectId: string, runType: string) {
  return async function logEvent(event: AgentEvent) {
    await prisma.agentEvent.create({
      data: {
        projectId,
        runType,   // initial | reactivation | finalization | completion
        type:      event.type,
        agent:     event.agent,
        message:   event.message,
        eventData: event.data,
      }
    })
  }
}
```

The API route returns the project ID immediately and starts agents in the background:

```typescript
export async function POST(req: NextRequest) {
  const project = await prisma.project.create({ data: { ... } })

  // Return IMMEDIATELY — agents start independently
  setImmediate(async () => {
    const onStep = createEventLogger(project.id, 'initial')
    await runAllAgents({ projectId: project.id, ..., onStep })
  })

  return NextResponse.json({ projectId: project.id })
}
```

The project page polls `/api/projects/[id]/events` every 2 seconds:

```typescript
// Frontend polls for new events — no SSE, no WebSocket
const poll = async () => {
  const res = await fetch(`/api/projects/${projectId}/events?afterId=${lastId}`)
  const { events, agentStatus } = await res.json()
  setLines(prev => [...prev, ...events])
  if (agentStatus === 'completed') setIsPolling(false)
}
const interval = setInterval(poll, 2000)
```

**Behavior:** Close the tab. Come back ten minutes later. Every agent event that ran while you were gone loads from the database and renders in the feed instantly.

---

## Database Schema

```prisma
model Project {
  id                 String        @id @default(cuid())
  userId             String
  clientName         String
  clientEmail        String
  dealBrief          String        @db.Text
  clientIntelligence String?       @db.Text  // Research Agent output
  contractSummary    String?       @db.Text  // PDF extraction
  websiteInsights    String?       @db.Text  // URL Context reading
  status             ProjectStatus @default(INTAKE)
  agentStatus        String        @default("idle")
  // idle | running | completed | failed
  complexity         String        @default("standard")
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt

  user            User            @relation(...)
  milestones      Milestone[]
  emails          ProjectEmail[]
  followUps       FollowUp[]
  intakeForm      IntakeForm?
  risks           ProjectRisk[]
  meetingRequests MeetingRequest[]
  agentEvents     AgentEvent[]
}

model AgentEvent {
  id        String   @id @default(cuid())
  projectId String
  runType   String   @default("initial")
  // initial | reactivation | finalization | completion
  type      String
  // start | agent | thinking | reading_doc | reading_web | searching
  // intelligence | discrepancy | step | generating | email_sent
  // milestone_saved | risk | clarification | delegate | success | done | error
  agent     String?
  // system | research | orchestrator | comms | project
  message   String   @db.Text
  eventData Json?
  createdAt DateTime @default(now())
}

model Milestone {
  id             String   @id @default(cuid())
  projectId      String
  title          String
  description    String   @db.Text
  phase          Int
  startDate      DateTime
  dueDate        DateTime
  ownerRole      String   // designer | developer | pm | qa
  ownerName      String?  // resolved from TeamMember
  ownerEmail     String?  // for notification delivery
  status         String   @default("not_started")
  requiresClient Boolean  @default(false)
  deliverable    String?
}

model ProjectRisk {
  id          String   @id @default(cuid())
  projectId   String
  description String   @db.Text
  severity    String   @default("medium")  // low | medium | high
  milestone   String?  // which milestone this affects
  reviewed    Boolean  @default(false)
}

model MeetingRequest {
  id               String        @id @default(cuid())
  projectId        String
  reason           String        @db.Text  // why agent flagged this
  emailSubject     String
  emailContent     String        @db.Text
  status           MeetingStatus @default(PENDING_REVIEW)
  meetingNotes     String?       @db.Text  // PM fills after meeting
  meetingCompleted Boolean       @default(false)
  sentAt           DateTime?
}

model IntakeForm {
  id          String    @id @default(cuid())
  projectId   String    @unique
  token       String    @unique @default(cuid())
  questions   Json      // [{id, question, type, required}]
  responses   Json?     // [{questionId, answer}]
  submittedAt DateTime?
}

model TeamMember {
  id     String @id @default(cuid())
  userId String
  name   String
  email  String
  role   String  // designer | developer | pm | qa
}

model User {
  id          String   @id @default(cuid())
  name        String
  email       String   @unique
  password    String   // bcrypt hashed
  companyName String
  createdAt   DateTime @default(now())
}
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database ([Neon](https://neon.tech) recommended for development — free serverless tier, instant setup)
- Gemini API key from [Google AI Studio](https://aistudio.google.com/api-keys) with billing enabled for Tier 1 rate limits
- [Resend](https://resend.com) account for email delivery
- [Upstash QStash](https://upstash.com/qstash) for follow-up scheduling

### Install Dependencies

```bash
[git clone https://github.com/YusufsDesigns/Cascade-AI.git](https://github.com/YusufsDesigns/Cascade-AI)
cd cascade
npm install
```

### Environment Variables

Create `.env.local` in the project root. All variables are required.

```bash
# ── AI ────────────────────────────────────────────────────────
# Gemini 2.5 Flash — requires billing enabled for Tier 1 rate limits
# Get from: https://aistudio.google.com/api-keys
GEMINI_API_KEY=

# ── Database ──────────────────────────────────────────────────
# PostgreSQL connection string
# Neon (dev): postgresql://user:pass@ep-xxx.neon.tech/cascade?sslmode=require
# Vultr (prod): postgresql://user:pass@localhost:5432/cascade
DATABASE_URL=

# ── Email ─────────────────────────────────────────────────────
# Resend: https://resend.com
RESEND_API_KEY=
RESEND_FROM_EMAIL=onboarding@yourdomain.com

# ── Scheduling ────────────────────────────────────────────────
# QStash: https://console.upstash.com/qstash
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=

# ── Auth ──────────────────────────────────────────────────────
# Generate secret: openssl rand -base64 32
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# ── App ───────────────────────────────────────────────────────
APP_URL=http://localhost:3000
```

### Database Setup

```bash
# Apply all migrations
npx prisma migrate dev

# Generate the TypeScript client
npx prisma generate

# Optional: open the visual database browser
npx prisma studio
```

### Run The Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), register an account, add your team members under Settings, then navigate to New Onboarding.

---

## Gemini API — Billing Note

The free tier provides 10 requests per minute and 500 requests per day on Gemini 2.5 Flash. A single full Cascade run (all four agents, PDF reading, web research, 3–4 emails, 5–7 milestones) makes approximately 25–35 Gemini calls. For reliable development and demo use, enable billing on your Google Cloud project linked to your AI Studio API key.

At Gemini 2.5 Flash pricing, a complete run costs approximately $0.01. One hundred test runs costs under $1.

**To enable billing:** Go to [aistudio.google.com/api-keys](https://aistudio.google.com/api-keys) → find your project → click **Set up billing** → add a payment method → buy the minimum $10 in prepay credits. Your existing API key immediately gains Tier 1 rate limits (1,000 RPM). The key does not change.

---

## Production Deployment on Vultr with Coolify

Cascade is deployed on a Vultr cloud compute instance using [Coolify](https://coolify.io) — a self-hosted platform-as-a-service that automates Docker orchestration, reverse proxy configuration, TLS certificate provisioning, and continuous deployment from GitHub.

### Step 1 — Provision a Vultr Instance

Log in to [console.vultr.com](https://console.vultr.com).

**Option A (recommended) — Vultr Marketplace:** Go to **Marketplace** and search for **Coolify**. Deploy the pre-configured Coolify marketplace app. Coolify comes pre-installed.

**Option B — Manual:** Deploy a Compute instance with the following specifications:
- **Image:** Ubuntu 22.04 LTS
- **Plan:** Minimum 2 GB RAM, 1 vCPU ($12/month or higher)
- **Location:** Select the region closest to your users

Wait approximately 60 seconds for the instance status to change from **Installing** to **Running**. Note the server's public IP address.

### Step 2 — Install Coolify (Option B only)

SSH into the server and run the one-line installer:

```bash
ssh root@YOUR_VULTR_IP

curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

The installer configures Docker, sets up Traefik as the reverse proxy, and starts Coolify. This takes 2–3 minutes.

### Step 3 — Access the Coolify Dashboard

Open `http://YOUR_VULTR_IP:8000` in your browser.

On first access, Coolify displays a setup wizard. Enter an email address and password to create the administrator account. This account has full control over all deployments, resources, and team management.

After registration, Coolify redirects to the dashboard.

### Step 4 — Connect Your GitHub Repository

Coolify needs OAuth access to pull your repository on every deployment.

1. In the Coolify dashboard, click **Sources** in the left sidebar
2. Click **Add Source** → select **GitHub**
3. Coolify redirects to GitHub for OAuth authorization
4. Click **Authorize** to grant repository access
5. GitHub redirects back to Coolify. Your GitHub account appears in the Sources list.

### Step 5 — Add a PostgreSQL Database

Cascade requires a PostgreSQL database. Coolify manages this as a separate resource within the same server.

1. In the dashboard, click **Projects** → **Add Project** → name it `cascade`
2. Click **Add Resource** → **Database** → **PostgreSQL**
3. Enter a database name (e.g., `cascade`) and click **Create**
4. Coolify generates secure credentials automatically
5. On the database details page, copy the **internal connection string** — it will look like: `postgresql://postgres:GENERATED_PASSWORD@cascade-db:5432/cascade`
6. This is your `DATABASE_URL` for the application

### Step 6 — Deploy the Application

1. In your Cascade project, click **Add Resource** → **Application**
2. Select **GitHub** as the source
3. Choose your `cascade` repository from the dropdown
4. Set the branch to `main`
5. Coolify analyzes the repository. When it detects `docker-compose.yml`, select **Docker Compose** as the build pack
6. Click **Continue**
7. Coolify generates a temporary public URL in the format `RANDOM_ID.YOUR_VULTR_IP.sslip.io` for immediate testing
8. Click **Save**. Coolify redirects to the application configuration page.

### Step 7 — Configure Environment Variables

In the application details page, click **Environment Variables** in the left sidebar.

Click **+ Add** for each variable. Add every variable from your `.env.local`, replacing local values with production values:

```
GEMINI_API_KEY          = your Gemini API key
DATABASE_URL            = the internal PostgreSQL connection string from Step 5
RESEND_API_KEY          = your Resend API key
RESEND_FROM_EMAIL       = your verified sender email
QSTASH_TOKEN            = your QStash token
QSTASH_CURRENT_SIGNING_KEY  = from Upstash console
QSTASH_NEXT_SIGNING_KEY     = from Upstash console
NEXTAUTH_SECRET         = generate with: openssl rand -base64 32
NEXTAUTH_URL            = https://your-sslip-domain or custom domain
APP_URL                 = same as NEXTAUTH_URL
```

Click **Save** after adding all variables.

### Step 8 — Run Database Migrations

Before the first deployment serves traffic, run Prisma migrations against the production database.

In the Coolify dashboard, navigate to your application → **Terminal** tab. Run:

```bash
npx prisma migrate deploy
```

This applies all pending migrations to the production PostgreSQL instance. Run this again after any schema changes.

### Step 9 — Deploy

Click **Deploy** on the application details page.

Coolify initiates the build process. Click **Logs** to monitor progress in real time. The process:

1. Clones your repository from GitHub
2. Builds the Docker image using your `Dockerfile`
3. Starts the container
4. Configures Traefik routing rules
5. The application is now live

The first build takes 3–5 minutes. Subsequent builds are faster due to Docker layer caching.

When deployment completes, the application status changes to **Running**.

### Step 10 — Verify the Deployment

1. Click **Links** in the application details page
2. Click the Coolify-generated domain link
3. The Cascade registration page loads. Create your account.

### Step 11 — Configure a Custom Domain with HTTPS

Replace the temporary `sslip.io` domain with your own domain.

1. In your DNS provider, create an A record pointing your domain (e.g., `app.yourdomain.com`) to the Vultr server's public IP
2. In Coolify → application → **Configuration** → **Domains**
3. Replace the generated domain with `https://app.yourdomain.com`
4. Enable **Automatic HTTPS** — Coolify provisions a Let's Encrypt TLS certificate automatically
5. Click **Save** → **Redeploy**

Coolify rebuilds the application with the new domain and requests the certificate. This takes 2–3 minutes. After completion, your domain loads over HTTPS with a valid certificate.

### Step 12 — Configure CI/CD for Automatic Deployments

Every push to `main` should trigger an automatic redeployment.

**In Coolify:**
1. Application details → **Settings**
2. Enable **Automatic Deployment**
3. Copy the displayed webhook URL

**In GitHub:**
1. Go to your repository → **Settings** → **Webhooks** → **Add webhook**
2. Paste the Coolify webhook URL in **Payload URL**
3. Set **Content type** to `application/json`
4. Select **Just the push event**
5. Click **Add webhook**

GitHub sends a test payload. Verify the webhook shows a green checkmark in the GitHub webhooks list.

From this point, every `git push origin main` triggers a full rebuild and zero-downtime deployment. The old container continues serving traffic until the new container is ready, then traffic switches.

**Optional — Add GitHub Actions for pre-deployment testing:**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: npm run lint
```

With this workflow, Coolify only deploys after the GitHub Actions build passes. Failed builds are never deployed to production.

### Dockerfile

```dockerfile
FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    restart: unless-stopped
```

> **Note:** PostgreSQL is managed as a separate Coolify resource — do not include a `db` service in `docker-compose.yml` for the Vultr deployment.

---

## Project Structure

```
cascade/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # NextAuth credential login
│   │   └── register/page.tsx       # Company registration
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Sidebar shell + auth guard
│   │   ├── dashboard/page.tsx      # Project list + stats overview
│   │   ├── onboard/page.tsx        # Brief + PDF input
│   │   ├── projects/[id]/page.tsx  # Full project review page
│   │   └── settings/page.tsx       # Team member configuration
│   ├── intake/[id]/[token]/
│   │   └── page.tsx                # Public client intake form (no auth)
│   └── api/
│       ├── onboard/route.ts             # Start agents (background)
│       ├── onboard/reactivate/route.ts  # Intake-triggered reactivation
│       ├── onboard/clarify/route.ts     # Answer agent clarification
│       ├── projects/[id]/events/        # Polling endpoint for feed
│       ├── projects/[id]/post-meeting/  # Log meeting outcome
│       ├── emails/[id]/route.ts         # Update email draft
│       ├── emails/send/route.ts         # Send via Resend
│       ├── milestones/[id]/assign/      # Assign team member
│       ├── milestones/[id]/status/      # Update milestone status
│       ├── meeting-requests/[id]/send/  # PM approves meeting request
│       ├── intake/[id]/route.ts         # Client form submit
│       └── webhooks/followup/route.ts   # QStash 48hr trigger
├── lib/
│   ├── agents/
│   │   ├── research.ts        # Research Agent (PDF + web + search)
│   │   ├── orchestrator.ts    # Orchestrator Agent
│   │   ├── communication.ts   # Communication Agent (initial run)
│   │   ├── project.ts         # Project Agent
│   │   ├── reactivation.ts    # Post-intake coordination
│   │   ├── finalization.ts    # Post-meeting coordination
│   │   └── completion.ts      # Project completion
│   ├── tools/
│   │   ├── research-tools.ts       # readDocument, readClientWebsite, searchClientBackground
│   │   ├── orchestrator-tools.ts   # extractDealInfo, requestClarification, assessComplexity, delegateToAgents
│   │   ├── comms-tools.ts          # saveEmail, saveIntakeQuestion, scheduleFollowUp, requestMeeting
│   │   └── project-tools.ts        # saveMilestone, flagRisk, requestMoreContext, updateMilestone
│   ├── db/prisma.ts            # Prisma singleton — only import from here
│   ├── email/resend.ts         # Resend client + sendEmail + milestone notification
│   ├── scheduler/qstash.ts     # scheduleFollowUp + cancelFollowUp
│   ├── agents/event-logger.ts  # createEventLogger — onStep saves to DB
│   └── utils.ts                # cn() utility
├── components/
│   ├── agent-feed/
│   │   ├── LiveAgentFeed.tsx      # Polls DB, renders live events
│   │   ├── AgentLine.tsx          # Per-event visual treatment
│   │   ├── ClarificationCard.tsx  # Pause state — agent asks question
│   │   └── AgentSummary.tsx       # Completion card
│   ├── emails/
│   │   ├── EmailCard.tsx    # Draft/sent email with edit/send
│   │   └── EmailEditor.tsx  # Inline editable textarea
│   ├── milestones/
│   │   ├── MilestoneList.tsx  # Full plan grouped by phase
│   │   └── MilestoneCard.tsx  # Single milestone with owner + status
│   ├── meeting/
│   │   └── MeetingRequestCard.tsx  # PM review + approve/decline
│   └── layout/
│       ├── Sidebar.tsx   # Fixed 240px navigation
│       └── Shell.tsx     # Content wrapper
├── prisma/
│   └── schema.prisma
├── Dockerfile
├── docker-compose.yml
├── .env.example          # Template — never commit .env.local
├── CLAUDE.md             # Full build instructions for AI assistance
├── STYLE.md              # Design system and component patterns
└── PROGRESS.md           # Session build log
```

---

## Test Scenarios

Five pre-built scenarios covering every agent behavior and branching path. Each uses a real company with a real website so the Research Agent demonstrates live URL Context reading.

| # | Company | Website | What It Tests |
|---|---|---|---|
| 1 | Cowrywise | `cowrywise.com` | Happy path — contract discrepancy detected, high complexity, full parallel run |
| 2 | Mono | `mono.co` | `requestClarification` — missing timeline triggers agent pause and question |
| 3 | Lendsqr | `lendsqr.com` | Risk flagging — multiple blocking dependencies found independently |
| 4 | Bumpa | `bumpa.app` | Simple path — brief only (no PDF), low complexity, fast execution |
| 5 | Andela | `andela.com` | Major discrepancy — budget, timeline, and scope all differ between brief and contract |

Sample PDFs for scenarios 1, 2, 3, and 5 are available in `/sample-docs/`.

**Recommended test order:** Scenario 4 (fast, simple, confirms basic flow) → Scenario 1 (full happy path) → Scenario 2 (clarification pause) → Scenario 3 (risk flagging) → Scenario 5 (discrepancy detection, save for final demo rehearsal).

---

## Built By

**Yusuf Lawal** — CTO and co-founder of [Unigram](https://unigram.ng)

[@dev_lawal on X](https://x.com/dev_lawal) · [github.com/dev_lawal](https://github.com/dev_lawal)

Built solo in 7 days from Abuja, Nigeria.  
AI Agent Olympics Hackathon · Milan AI Week 2026.

---

> Powered by [Gemini 2.5 Flash](https://ai.google.dev) · Deployed on [Vultr](https://vultr.com) with [Coolify](https://coolify.io)
