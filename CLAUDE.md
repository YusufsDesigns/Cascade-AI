@AGENTS.md

# CLAUDE.md — Cascade AI Onboarding Platform
## Complete Build Instructions for Claude Code

---

## 0. READ THESE FIRST — MANDATORY BEFORE EVERY SESSION

At the start of EVERY session, before writing a single line of code,
Claude Code MUST read the following files in this exact order:

### Project Files (read every session)
```
STYLE.md       ← design system, colors, components, animations, light mode rules
PROGRESS.md    ← read the LAST session entry to know exactly where we are and what to do next
```

### Skills (read before working on the relevant area)

Read these skills BEFORE touching any component, page, or UI code:

```
/mnt/skills/user/shadcn/SKILL.md              ← before using any shadcn component
/mnt/skills/user/shadcn-ui/SKILL.md           ← before building UI with shadcn/ui
/mnt/skills/user/frontend-design/SKILL.md     ← before building any page or component
/mnt/skills/user/ui-ux-pro-max/SKILL.md       ← before making any design decision
/mnt/skills/user/vercel-react-best-practices/SKILL.md ← before writing any React or Next.js code
/mnt/skills/user/web-design-guidelines/SKILL.md ← before reviewing or auditing UI
/mnt/skills/user/web-accessibility/SKILL.md   ← before finalising any interactive component
```

Read these skills BEFORE working on the specific area they cover:

```
/mnt/skills/user/create-readme/SKILL.md       ← before writing the GitHub README for submission
/mnt/skills/user/x-posts/SKILL.md             ← before writing any X/Twitter post
/mnt/skills/user/linkedin-posts/SKILL.md      ← before writing any LinkedIn post
```

### How To Use Skills
- View the SKILL.md file first
- Follow the patterns and constraints it defines
- The skills override generic assumptions — they encode project-specific rules

---

## 1. What Cascade Is

Cascade is a multi-agent B2B client onboarding platform built for the
AI Agent Olympics Hackathon at Milan AI Week 2026.

Account manager uploads a contract PDF and types or pastes a deal brief.
Four coordinating AI agents powered by Gemini 2.5 Flash activate:
a Research Agent that reads the PDF and the client website before anything is drafted,
an Orchestrator that plans strategy and delegates,
a Communication Agent that actually sends emails to the client,
and a Project Agent that generates a full milestone plan with independent risk flags.

When the client submits the intake form, agents automatically re-activate —
updating the project plan, sending a confirmation, and posting an internal summary —
without any human trigger. This ongoing autonomy is the core of the product.

**This is not a chatbot or a draft generator. It is an autonomous agent system
that takes real-world actions and responds to real-world events.**

Prize targets: Gemini Best Use + Vultr Best Enterprise Agent +
Agentic Workflows + Collaborative Systems.

---

## 1a. The 8 Features That Win — Nothing Else Gets Built

Every build decision is evaluated against this list. If a feature is not on this list,
it does not get built. No exceptions.

```
TIER 1 — FOUNDATION (build first, everything depends on this)
  1. True Gemini tool calling loops — ALL agents use while loop + functionDeclarations
  2. requestMoreContext tool in every agent — agent asks before proceeding when needed
  3. Project Agent independent risk flagging — finds risks nobody told it to look for
  4. Parallel execution — Communication + Project agents run simultaneously, visible in feed

TIER 2 — DIFFERENTIATORS (what wins first place)
  5. PDF upload + Gemini native document reading — contract → structured commitments
  6. Research Agent — web search + Gemini URL Context → personalized intelligence
  7. Resend actually SENDS emails — agent takes real-world action, not drafts
  8. Intake form triggers automatic agent re-activation — ongoing autonomy, no human trigger
```

Features explicitly NOT being built:
- Slack integration (not agentic, just a webhook)
- Notion workspace (API calls not reasoning)
- Google Calendar (scheduling not intelligence)
- Monitor Agent polling (cannot demo in 3 minutes)
- Email open tracking (not agentic enough for build cost)
- Client reply auto-response (too fragile for live demo)
- Speechmatics voice notes (adds complexity, low agentic return)

---

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 16 App Router + TypeScript | Already scaffolded |
| Styling | Tailwind CSS + shadcn/ui | Light mode only |
| Animations | Framer Motion | All transitions and feed lines |
| Toasts | Sonner | `toast.success()`, `toast.error()` |
| Icons | lucide-react | Only icon library used |
| AI | @google/genai | Google's official JS SDK |
| AI Model | gemini-2.5-flash | NOT 2.0-flash (deprecated). NOT 3.x (paid preview only) |
| Gemini Tools Used | Document Understanding, URL Context, Web Search, Function Calling | All native Gemini capabilities |
| Database | Prisma ORM + PostgreSQL | Neon for dev, Vultr for prod |
| Email | Resend | Sends real emails. Not drafts. |
| Scheduling | QStash by Upstash | Follow-up scheduling + intake re-activation trigger |
| Auth | NextAuth.js v5 | Registration + login, bcryptjs for passwords |
| Utilities | clsx + tailwind-merge | cn() in lib/utils.ts |
| Deployment | Vultr VM + Coolify + Docker | See deployment section |

---

## 3. File Structure

```
cascade/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx           ← NEW: company registration
│   ├── (dashboard)/
│   │   ├── layout.tsx                  ← sidebar shell + auth guard
│   │   ├── dashboard/page.tsx          ← stats row + project list
│   │   ├── onboard/page.tsx            ← PromptInput + PDF upload + live AgentFeed
│   │   ├── projects/[id]/page.tsx      ← review: emails, milestones, clarifications
│   │   └── settings/page.tsx          ← team member CRUD
│   ├── intake/[projectId]/[token]/
│   │   └── page.tsx                    ← PUBLIC, no auth, client fills form
│   └── api/
│       ├── onboard/route.ts            ← POST: triggers all agents, streams SSE
│       ├── onboard/reactivate/route.ts ← POST: intake submission triggers re-run
│       ├── projects/route.ts           ← GET: all projects for user
│       ├── projects/[id]/route.ts      ← GET: single project with relations
│       ├── emails/[id]/route.ts        ← PATCH: save edits
│       ├── intake/[projectId]/route.ts ← GET: questions / POST: submit (triggers reactivate)
│       └── webhooks/followup/route.ts  ← POST: QStash 48hr follow-up
├── lib/
│   ├── agents/
│   │   ├── research.ts                 ← NEW: Research Agent (PDF + web + URL context)
│   │   ├── orchestrator.ts             ← Orchestrator Agent
│   │   ├── communication.ts            ← Communication Agent (sends real emails)
│   │   └── project.ts                  ← Project Agent (flags risks independently)
│   ├── tools/
│   │   ├── research-tools.ts           ← NEW: readDocument, searchWeb, readClientWebsite
│   │   ├── orchestrator-tools.ts       ← extractDealInfo, requestClarification, assessComplexity, delegateToAgents
│   │   ├── comms-tools.ts              ← saveEmail (sends immediately), saveIntakeQuestion, scheduleFollowUp
│   │   └── project-tools.ts            ← saveMilestone, flagRisk, requestMoreContext
│   ├── db/prisma.ts                    ← Prisma singleton
│   ├── email/resend.ts                 ← sendEmail helper (actually sends)
│   ├── scheduler/qstash.ts             ← schedule + cancel + reactivate
│   └── utils.ts                        ← cn()
├── components/
│   ├── ui/                             ← all shadcn components
│   ├── agent-feed/
│   │   ├── AgentFeed.tsx               ← SSE reader + animated line renderer
│   │   ├── AgentLine.tsx               ← single Framer Motion line with type colors
│   │   ├── ClarificationCard.tsx       ← NEW: inline question form in feed
│   │   └── AgentSummary.tsx            ← completion card
│   ├── emails/
│   │   ├── EmailCard.tsx               ← shows sent status (not draft)
│   │   └── EmailEditor.tsx
│   ├── milestones/
│   │   ├── MilestoneList.tsx
│   │   └── MilestoneCard.tsx           ← shows risk flags
│   ├── projects/ProjectCard.tsx
│   ├── intake/IntakeForm.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       └── Shell.tsx
├── prisma/schema.prisma
├── Dockerfile
├── docker-compose.yml
└── [CLAUDE.md, STYLE.md, PROGRESS.md]
```
├── Dockerfile
├── docker-compose.yml
├── .env.local                      ← never commit this
├── .env.example                    ← commit this (empty values)
├── CLAUDE.md
├── STYLE.md
└── PROGRESS.md
```

---

## 4. Environment Variables

```bash
# .env.local

# AI — use gemini-2.5-flash in all agent calls
GEMINI_API_KEY=

# Database — Neon for dev, Vultr PostgreSQL for prod
DATABASE_URL=

# Email — Resend (already familiar from Unigram V2)
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# QStash — for 48hr follow-up scheduling
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=

# Auth — NextAuth v5
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# App URL — used to generate intake form links
APP_URL=http://localhost:3000
```

---

## 5. Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_URL")
}

model Project {
  id                 String        @id @default(cuid())
  userId             String
  clientName         String
  clientEmail        String
  dealBrief          String        @db.Text
  clientIntelligence String?       @db.Text  // Research Agent output — enriched client profile
  contractSummary    String?       @db.Text  // PDF extraction summary
  websiteInsights    String?       @db.Text  // URL Context reading
  status             ProjectStatus @default(INTAKE)
  complexity         String        @default("standard")
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt

  user        User           @relation(fields: [userId], references: [id])
  milestones  Milestone[]
  emails      ProjectEmail[]
  followUps   FollowUp[]
  intakeForm  IntakeForm?
  risks       ProjectRisk[]
}

enum ProjectStatus {
  INTAKE        // brief submitted, not yet processed
  ONBOARDING    // agents ran, awaiting client response
  ACTIVE        // intake received, project underway
  COMPLETED
}

// NEW — risks flagged independently by the Project Agent
model ProjectRisk {
  id          String   @id @default(cuid())
  projectId   String
  description String   @db.Text
  severity    String   @default("medium")  // low | medium | high
  milestone   String?  // which milestone this affects
  createdAt   DateTime @default(now())

  project Project @relation(fields: [projectId], references: [id])
}

model User {
  id          String   @id @default(cuid())
  name        String
  email       String   @unique
  password    String
  companyName String
  createdAt   DateTime @default(now())

  projects    Project[]
  teamMembers TeamMember[]
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
  ownerName      String?  // resolved from TeamMember when assigning
  status         String   @default("not_started")
  requiresClient Boolean  @default(false)
  deliverable    String?  // what the client must approve or provide

  project Project @relation(fields: [projectId], references: [id])
}

model ProjectEmail {
  id        String      @id @default(cuid())
  projectId String
  type      EmailType
  subject   String
  content   String      @db.Text
  recipient String
  status    EmailStatus @default(DRAFT)
  sentAt    DateTime?
  createdAt DateTime    @default(now())

  project Project @relation(fields: [projectId], references: [id])
}

enum EmailType {
  WELCOME               // sent immediately on approval
  INTAKE_QUESTIONNAIRE  // sent day 1 with link to /intake/[id]/[token]
  KICKOFF_AGENDA        // included in kickoff meeting invite
  FOLLOW_UP             // auto-sent at 48hrs if no intake response
}

enum EmailStatus {
  DRAFT      // generated by agent, awaiting review
  APPROVED   // reviewed by account manager
  SENT       // delivered via Resend
  CANCELLED  // cancelled (e.g. follow-up when intake submitted)
}

model FollowUp {
  id           String         @id @default(cuid())
  projectId    String
  emailId      String
  scheduledFor DateTime
  status       FollowUpStatus @default(SCHEDULED)
  qstashMsgId  String?        // store QStash message ID for cancellation

  project Project @relation(fields: [projectId], references: [id])
}

enum FollowUpStatus {
  SCHEDULED
  SENT
  CANCELLED  // cancelled when intake form is submitted
}

model IntakeForm {
  id          String    @id @default(cuid())
  projectId   String    @unique
  token       String    @unique @default(cuid())
  questions   Json      // array of { id, question, required, type }
  responses   Json?     // array of { questionId, answer } — filled by client
  submittedAt DateTime?

  project Project @relation(fields: [projectId], references: [id])
}

model TeamMember {
  id    String @id @default(cuid())
  name  String
  email String
  role  String // designer | developer | pm | qa
}
```

---

## 6. The Agent Architecture — What Truly Agentic Means

### The Critical Distinction — Pipeline vs Agent

**WRONG — this is a pipeline, not an agent:**
```typescript
// Developer hardcoded every step. Gemini decided nothing.
const welcome = await draftWelcomeEmail(info)
const questionnaire = await draftIntakeQuestionnaire(info)
const kickoff = await draftKickoffAgenda(info)
```

**WRONG — this is text generation, not tool calling:**
```typescript
// Gemini used as autocomplete. No tools. No decisions. No memory.
async function generate(prompt: string) {
  const response = await ai.models.generateContent({ contents: [{ text: prompt }] })
  return response.text
}
```

**CORRECT — Gemini decides what to call, writes content as tool arguments:**
```typescript
// Gemini reads project context, decides which tool to call, provides content as args
// YOUR CODE only executes what Gemini requested and saves it
```

### The Back And Forth — What Judges Want To See

Each agent must be capable of pausing mid-run and requesting more information
when it needs it. This is not optional. This is the core of agentic behavior.

When the Communication Agent notices the brief did not mention the client's
brand colors or existing assets, it should call `requestMoreContext` with
specific questions. The stream pauses. The frontend shows those questions.
The account manager answers. The answers go back into Gemini as a tool
response. Gemini continues from where it stopped — now informed.

This back-and-forth is the proof of autonomous thinking. Every agent has it.

### The Loop Pattern — Mandatory For All Three Agents

```typescript
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
const MAX_STEPS = 15

export async function runCommunicationAgent(
  projectId: string,
  onStep: (event: AgentEvent) => void,
  // Called when agent needs more info — returns the user's answers
  onClarificationNeeded: (questions: string[]) => Promise<string>
) {
  // Load project data from DB to give Gemini full context
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { intakeForm: true }
  })

  const messages = [{
    role: 'user',
    parts: [{ text: `Draft all onboarding communications for this project:\n${JSON.stringify(project, null, 2)}` }]
  }]

  let steps = 0

  let response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: messages,
    config: {
      tools: [commsToolDeclarations],  // ← TOOLS PASSED TO GEMINI
      systemInstruction: COMMS_SYSTEM_PROMPT
    }
  })

  // Gemini runs until it has no more tools to call
  while (response.functionCalls?.length && steps < MAX_STEPS) {
    steps++
    const call = response.functionCalls[0]

    onStep({ type: 'step', agent: 'comms', message: `→ ${call.name}...` })

    // Execute whatever Gemini decided to call
    const result = await executeCommsTool(call.name, call.args, projectId, onStep, onClarificationNeeded)

    // Append both sides to history — Gemini needs the full transcript
    messages.push(
      { role: 'model', parts: [{ functionCall: call }] },
      { role: 'user',  parts: [{ functionResponse: { name: call.name, response: result } }] }
    )

    // Call Gemini again with full updated history
    response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: messages,
      config: {
        tools: [commsToolDeclarations],
        systemInstruction: COMMS_SYSTEM_PROMPT
      }
    })
  }

  return response.text
}
```

### Tool Declarations — Every Agent Has These

Tools are schemas that tell Gemini what actions are available.
Gemini reads the description and decides when to call each one.
Gemini provides the content as typed arguments — your code just saves them.

#### Orchestrator Tools

```typescript
const orchestratorToolDeclarations = {
  functionDeclarations: [
    {
      name: 'extractDealInfo',
      description: 'CALL THIS FIRST. Extract all structured information from the deal brief.',
      parameters: {
        type: 'OBJECT',
        properties: {
          clientName:    { type: 'STRING' },
          clientEmail:   { type: 'STRING' },
          contactName:   { type: 'STRING' },
          deliverables:  { type: 'ARRAY', items: { type: 'STRING' } },
          timelineWeeks: { type: 'NUMBER' },
          budget:        { type: 'STRING' },
          isComplete:    { type: 'BOOLEAN', description: 'True only if clientName, clientEmail, deliverables, AND timelineWeeks are all present' },
          missingFields: { type: 'ARRAY', items: { type: 'STRING' } }
        },
        required: ['isComplete', 'missingFields']
      }
    },
    {
      name: 'requestClarification',
      description: 'Call this when critical information is missing from the brief. Pauses the workflow and prompts the account manager for specific answers.',
      parameters: {
        type: 'OBJECT',
        properties: {
          reason:    { type: 'STRING', description: 'Why you need this information' },
          questions: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Specific questions to ask the account manager' }
        },
        required: ['reason', 'questions']
      }
    },
    {
      name: 'assessComplexity',
      description: 'Call after extractDealInfo when info is complete. Assess project complexity.',
      parameters: {
        type: 'OBJECT',
        properties: {
          complexity: { type: 'STRING', enum: ['standard', 'high'] },
          reasoning:  { type: 'STRING' }
        },
        required: ['complexity', 'reasoning']
      }
    },
    {
      name: 'delegateToAgents',
      description: 'Call as the FINAL step when extraction and complexity are done. Triggers Communication and Project agents.',
      parameters: {
        type: 'OBJECT',
        properties: {
          proceed:    { type: 'BOOLEAN' },
          complexity: { type: 'STRING', enum: ['standard', 'high'] },
          notes:      { type: 'STRING', description: 'Any notes for the sub-agents based on what you observed' }
        },
        required: ['proceed']
      }
    }
  ]
}
```

#### Communication Agent Tools

```typescript
const commsToolDeclarations = {
  functionDeclarations: [
    {
      name: 'saveEmail',
      description: 'Save a drafted email to the database. You write the full content as arguments — make it personalized, professional, and specific to this client.',
      parameters: {
        type: 'OBJECT',
        properties: {
          type:    { type: 'STRING', enum: ['WELCOME', 'INTAKE_QUESTIONNAIRE', 'KICKOFF_AGENDA', 'FOLLOW_UP'] },
          subject: { type: 'STRING', description: 'Specific, personalized subject line' },
          content: { type: 'STRING', description: 'Complete email body. Professional, warm, referencing the actual deliverables and client name. NO placeholders.' }
        },
        required: ['type', 'subject', 'content']
      }
    },
    {
      name: 'saveIntakeQuestion',
      description: 'Save one intake questionnaire question. Call this multiple times for each question you want to ask.',
      parameters: {
        type: 'OBJECT',
        properties: {
          question: { type: 'STRING', description: 'The specific question to ask the client, relevant to their deliverables' },
          type:     { type: 'STRING', enum: ['text', 'textarea', 'select', 'checkbox'] },
          options:  { type: 'ARRAY', items: { type: 'STRING' }, description: 'Only for select or checkbox types' },
          required: { type: 'BOOLEAN' }
        },
        required: ['question', 'type', 'required']
      }
    },
    {
      name: 'requestMoreContext',
      description: 'Call this when you need additional information to write better communications. The account manager will answer and you will receive their responses.',
      parameters: {
        type: 'OBJECT',
        properties: {
          reason:    { type: 'STRING', description: 'Specifically what you need and why it matters for the communications' },
          questions: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Your specific questions' }
        },
        required: ['reason', 'questions']
      }
    },
    {
      name: 'scheduleFollowUp',
      description: 'Schedule an automatic follow-up to fire if the client does not submit the intake form.',
      parameters: {
        type: 'OBJECT',
        properties: {
          delayHours: { type: 'NUMBER', description: 'Hours until follow-up fires. Use 48.' },
          note:       { type: 'STRING', description: 'Why you chose this delay' }
        },
        required: ['delayHours']
      }
    }
  ]
}
```

#### Project Agent Tools

```typescript
const projectToolDeclarations = {
  functionDeclarations: [
    {
      name: 'saveMilestone',
      description: 'Save one project milestone. Call this for each milestone you create. You decide the content, structure, owner, and dates based on the deliverables and timeline.',
      parameters: {
        type: 'OBJECT',
        properties: {
          title:         { type: 'STRING', description: 'Specific actionable title — not Phase 1 but Discovery & Requirements Sign-off' },
          description:   { type: 'STRING', description: 'What work happens in this milestone and what the output is' },
          phase:         { type: 'NUMBER' },
          ownerRole:     { type: 'STRING', enum: ['designer', 'developer', 'pm', 'qa'] },
          dueWeek:       { type: 'NUMBER', description: 'Which week this milestone is due, counting from project start' },
          requiresClient:{ type: 'BOOLEAN', description: 'True if client must do or provide something for this milestone to proceed' },
          riskNote:      { type: 'STRING', description: 'Flag any dependency, risk, or blocker you observed. Leave empty if none.' }
        },
        required: ['title', 'description', 'phase', 'ownerRole', 'dueWeek', 'requiresClient']
      }
    },
    {
      name: 'requestMoreContext',
      description: 'Call this when the deliverables are unclear or you need more detail to create an accurate project plan.',
      parameters: {
        type: 'OBJECT',
        properties: {
          reason:    { type: 'STRING' },
          questions: { type: 'ARRAY', items: { type: 'STRING' } }
        },
        required: ['reason', 'questions']
      }
    },
    {
      name: 'flagProjectRisk',
      description: 'Call this when you identify a project-level risk that is not specific to one milestone — timeline too tight, scope creep potential, missing critical information.',
      parameters: {
        type: 'OBJECT',
        properties: {
          risk:           { type: 'STRING', description: 'Description of the risk' },
          recommendation: { type: 'STRING', description: 'What you recommend to address it' },
          severity:       { type: 'STRING', enum: ['low', 'medium', 'high'] }
        },
        required: ['risk', 'recommendation', 'severity']
      }
    }
  ]
}
```

### Tool Execute Functions — Your Code Runs Here

When Gemini calls a tool, your execute function runs.
Gemini provided the content as arguments. You just save and respond.

```typescript
// Communication Agent execute dispatcher
async function executeCommsTool(
  name: string,
  args: Record<string, any>,
  projectId: string,
  onStep: (e: AgentEvent) => void,
  onClarificationNeeded: (questions: string[]) => Promise<string>
): Promise<Record<string, any>> {

  switch (name) {

    case 'saveEmail': {
      const email = await prisma.projectEmail.create({
        data: {
          projectId,
          type:      args.type,
          subject:   args.subject,
          content:   args.content,
          recipient: '', // filled from project.clientEmail
          status:    'DRAFT'
        }
      })
      onStep({ type: 'success', agent: 'comms', message: `✓ ${args.type} email drafted` })
      return { success: true, emailId: email.id, instruction: 'Email saved. Continue with next communication.' }
    }

    case 'saveIntakeQuestion': {
      // Accumulate questions — store in session or DB as part of IntakeForm
      onStep({ type: 'step', agent: 'comms', message: `→ Question saved: ${args.question.slice(0, 50)}...` })
      return { success: true, instruction: 'Question saved. Add more questions or move to scheduling follow-up.' }
    }

    case 'requestMoreContext': {
      // Emit clarification event to frontend — stream pauses here
      onStep({ type: 'clarification', agent: 'comms', message: args.reason, questions: args.questions })

      // Wait for the account manager to respond
      // onClarificationNeeded is a promise that resolves when user submits answers
      const answers = await onClarificationNeeded(args.questions)

      onStep({ type: 'step', agent: 'comms', message: '→ Context received. Continuing...' })

      // Feed answers back to Gemini as the tool result
      return {
        success: true,
        answers,
        instruction: 'You now have the additional context. Continue drafting communications.'
      }
    }

    case 'scheduleFollowUp': {
      const scheduledFor = new Date(Date.now() + args.delayHours * 60 * 60 * 1000)
      const followUp = await prisma.followUp.create({
        data: { projectId, emailId: '', scheduledFor, status: 'SCHEDULED' }
      })

      // Schedule via QStash
      const msgId = await scheduleQStashMessage(projectId, args.delayHours)
      await prisma.followUp.update({ where: { id: followUp.id }, data: { qstashMsgId: msgId } })

      onStep({ type: 'success', agent: 'comms', message: `✓ Follow-up scheduled for ${scheduledFor.toLocaleDateString()}` })
      return { success: true, instruction: 'Follow-up scheduled. Your work is complete.' }
    }

    default:
      return { error: `Unknown tool: ${name}` }
  }
}
```

### System Prompts — Written For Autonomous Thinking

Each system prompt must tell the agent:
- What its goal is
- What context it has access to
- When to request more information (not IF — WHEN)
- When it is done
- What NOT to do

#### Orchestrator System Prompt

```typescript
const ORCHESTRATOR_SYSTEM_PROMPT = `
You are the Orchestrator Agent for Cascade, an autonomous B2B client onboarding system.
Your job is to read a deal brief, understand it deeply, and coordinate onboarding.

You have access to these tools: extractDealInfo, requestClarification, assessComplexity, delegateToAgents.

YOUR PROCESS:

1. Call extractDealInfo first. Read everything in the brief carefully.

2. Think critically about what you extracted:
   - Is the client email actually valid-looking?
   - Are the deliverables specific enough for a project plan?
   - Is the timeline realistic for the scope?
   - Is anything ambiguous that would cause problems downstream?

3. If anything critical is missing OR ambiguous in ways that would block the work:
   Call requestClarification with specific, intelligent questions.
   Do NOT proceed to delegation if you lack what the sub-agents need.
   Do NOT ask for information you can reasonably infer.

4. When you have sufficient information, call assessComplexity.
   Think about: number of deliverables, timeline pressure, technical complexity.

5. Call delegateToAgents. Include notes for the sub-agents about anything you observed
   — risks, ambiguities, things they should pay attention to.

CRITICAL RULES:
- You are thinking, not executing a script. Use judgment.
- If the brief is vague about deliverables, ask. Vague deliverables produce vague plans.
- If the timeline seems unrealistic for the scope, flag it in your delegation notes.
- Never guess a missing email address. Always ask.
- Your requestClarification questions should be specific, not generic.
  BAD: "Can you provide more details?"
  GOOD: "The brief mentions a dashboard — is this for internal staff or external clients? This affects the entire architecture."
`
```

#### Communication Agent System Prompt

```typescript
const COMMS_SYSTEM_PROMPT = `
You are the Communication Agent for Cascade.
You draft all client-facing communications for a new onboarding.
You have been given the full project data. Read it carefully before drafting anything.

You have access to: saveEmail, saveIntakeQuestion, requestMoreContext, scheduleFollowUp.

YOUR PROCESS:

1. Read the project data. Understand: who the client is, what they need, what was promised.

2. Think about what you need to write excellent communications:
   - Do you know enough about their industry to write a credible email?
   - Do you know who the actual human is you are writing to?
   - Are there details that would make the intake questions more relevant?
   If anything important is missing for writing quality communications, call requestMoreContext first.

3. Draft the WELCOME email using saveEmail (type: WELCOME).
   - Use the client's actual name. Use the actual deliverables.
   - Warm, professional, specific. Not generic. Not a template.
   - Mention what happens next: intake form, kickoff call.

4. Draft 5-8 INTAKE QUESTIONS using saveIntakeQuestion — one call per question.
   Questions must be specific to THEIR deliverables and situation.
   Think: what does the team need to actually start this project?
   BAD question: "What are your goals?"
   GOOD question: "For the admin dashboard, will staff upload files or only view reports? This determines the storage architecture."

5. Draft the INTAKE QUESTIONNAIRE EMAIL using saveEmail (type: INTAKE_QUESTIONNAIRE).
   Reference the specific intake form link. Friendly, short, clear.

6. Draft the KICKOFF AGENDA using saveEmail (type: KICKOFF_AGENDA).
   A real agenda specific to their project — not generic agenda items.

7. Call scheduleFollowUp with 48 hours.

CRITICAL RULES:
- Write like a senior account manager at a premium agency, not like an AI.
- Every email must reference something specific to this client. Never generic.
- Your intake questions must be tailored. If they have a mobile app deliverable, ask about platforms. If they have integrations, ask about existing APIs.
- If you realize mid-drafting that you need a detail, call requestMoreContext. Do not produce a worse email instead.
- Never use placeholders like [Name] or [Your Company]. Use the real values or ask for them.
`
```

#### Project Agent System Prompt

```typescript
const PROJECT_SYSTEM_PROMPT = `
You are the Project Agent for Cascade.
You create detailed, realistic project plans from deal information.
You have been given the full project data. Think carefully before creating milestones.

You have access to: saveMilestone, requestMoreContext, flagProjectRisk.

YOUR PROCESS:

1. Read all deliverables carefully. Think about what each one actually requires to build.
   What are the dependencies? What must be designed before it can be built?
   What requires client input before the team can proceed?

2. If deliverables are vague or you cannot confidently plan without more detail, call requestMoreContext.
   BAD: Creating vague milestones for vague deliverables.
   GOOD: Asking "The brief mentions a reporting dashboard — what data sources does it pull from? This determines Phase 2."

3. Create milestones using saveMilestone — one call per milestone.
   Build phase by phase: Discovery → Design → Development → Integration/Testing → Launch
   Each milestone must have:
   - A SPECIFIC title (not "Phase 2" — name what actually gets done)
   - A clear description of the work and the output
   - The right owner role based on the work type
   - A realistic due week within the total timeline
   - requiresClient: true if the team cannot proceed without client input/approval

4. Use flagProjectRisk for any project-level concerns:
   - Timeline that seems too tight for the scope
   - Missing information that will cause problems later
   - Technical complexity that was not reflected in the timeline
   - Client dependencies that could block progress

CRITICAL RULES:
- Milestones must be realistic. Do not compress 12 weeks of work into 4.
- Think about DEPENDENCIES. Design cannot start before discovery. Development cannot start before design approval.
- requiresClient is not optional — identify every point where work stops without the client.
- Your risk flags are valuable. Judges are looking for agents that think independently.
- If the timeline is genuinely too short, create a milestone called "Timeline Risk" and flag it.
  Do not silently create an impossible plan.
- Owner roles: pm (planning, communication), designer (UI/UX, mockups), developer (code, build), qa (testing, review)
`
```

### How requestMoreContext Works In The Stream

When any agent calls requestMoreContext or requestClarification:

1. The execute function emits a `clarification` event to the SSE stream
2. The frontend receives this event type and renders the questions
3. The account manager types answers and submits
4. The answers POST to the API
5. The API resolves the `onClarificationNeeded` promise with the answers
6. The answers become the tool response fed back to Gemini
7. Gemini reads the answers and continues its work — now informed

```typescript
// AgentEvent type — add clarification
type AgentEvent = {
  type: 'start' | 'agent' | 'step' | 'success' | 'delegate'
       | 'warning' | 'done' | 'error' | 'clarification'
  agent?: 'orchestrator' | 'comms' | 'project' | 'system'
  message: string
  questions?: string[]  // present when type === 'clarification'
}
```

The frontend AgentFeed renders a `clarification` event as an input form
inline in the feed — not a modal, not a separate page. The feed pauses,
shows the questions, account manager answers, feed resumes.

This back-and-forth is what separates a genuine agentic system from a pipeline.

---

## 7. Critical Implementation Rule — Read This Before Writing Any Agent Code

The current implementation in the codebase is a PIPELINE, not an agent.
It calls Gemini with a prompt, gets text back, and saves it. This is wrong.

Here is exactly what must be true for every agent:

**1. Tools are declared as schemas and passed to Gemini via `config.tools`.**
Gemini reads the schemas and decides which tool to call. You do not call tools yourself.

**2. Gemini provides email content, milestone details, and questions as TOOL ARGUMENTS.**
You do not parse Gemini's text response. Gemini calls `saveEmail({ type, subject, content })`
and your execute function saves those arguments directly.

**3. Every agent file has a while loop.**
No exceptions. If there is no while loop, it is not an agent.

**4. The `generate(prompt)` pattern is FORBIDDEN.**
```typescript
// NEVER DO THIS IN AN AGENT FILE
async function generate(prompt: string) {
  const response = await ai.models.generateContent({ contents: [{ text: prompt }] })
  return response.text  // ← this is not agentic
}
```

**5. Every agent must have requestMoreContext as a tool.**
When Gemini needs more information to do its job well, it calls this tool.
The stream pauses. The frontend prompts the user. The answers come back to Gemini.
Gemini continues — now informed. This is the back-and-forth that proves autonomous thinking.

**6. The execute switch statement is the only place tools run.**
```typescript
// CORRECT — Gemini requested this tool, you execute it
async function executeCommsTool(name, args, ...) {
  switch (name) {
    case 'saveEmail': { /* save args.content to DB */ }
    case 'requestMoreContext': { /* pause stream, wait for user */ }
  }
}

// WRONG — you decided to call this, not Gemini
await draftWelcomeEmail(info)
```

**Files that need to be completely rebuilt:**
- `lib/tools/comms-tools.ts` — delete the `generate()` pattern entirely
- `lib/agents/communication.ts` — replace sequential calls with while loop
- `lib/agents/project.ts` — replace sequential calls with while loop
- `lib/agents/orchestrator.ts` — replace direct function calls with while loop
- `lib/tools/deal-tools.ts` — extractDealInfo should not call Gemini directly; it should be a tool that Gemini calls in the Orchestrator loop



The `/api/onboard` route uses a ReadableStream to push events as Server-Sent Events.
Each event is a JSON object on its own line, prefixed with `data: `.

### API Route (Server Side)

```typescript
// app/api/onboard/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { runOrchestratorAgent } from '@/lib/agents/orchestrator'

export async function POST(req: NextRequest) {
  const { dealBrief } = await req.json()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: AgentEvent) => {
        const data = `data: ${JSON.stringify(event)}\n\n`
        controller.enqueue(new TextEncoder().encode(data))
      }

      try {
        // Create project record first
        const project = await prisma.project.create({
          data: {
            clientName:  'Pending',
            clientEmail: 'pending@pending.com',
            dealBrief,
          }
        })

        send({ type: 'start', agent: 'system', message: '● Cascade is starting...' })
        send({ type: 'agent', agent: 'orchestrator', message: '◆ Orchestrator Agent activated' })

        await runOrchestratorAgent(dealBrief, project.id, send)

        send({ type: 'done', agent: 'system', message: '✓ Cascade complete', projectId: project.id })

      } catch (error) {
        send({ type: 'error', agent: 'system', message: 'Agent encountered an error. Check server logs.' })
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}
```

### Frontend AgentFeed Component (Client Side)

```typescript
// components/agent-feed/AgentFeed.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AgentLine } from './AgentLine'

type AgentEvent = {
  type: string
  agent?: string
  message: string
  projectId?: string
}

export function AgentFeed({ onComplete }: { onComplete: (projectId: string) => void }) {
  const [lines, setLines] = useState<AgentEvent[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const addLine = (event: AgentEvent) => {
    setLines(prev => [...prev, event])
    // Auto-scroll to bottom
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  async function startOnboarding(dealBrief: string) {
    setIsRunning(true)
    setLines([])
    setIsDone(false)

    const response = await fetch('/api/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dealBrief })
    })

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) return

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const text = decoder.decode(value)
      const lines = text.split('\n').filter(l => l.startsWith('data: '))

      for (const line of lines) {
        try {
          const event: AgentEvent = JSON.parse(line.replace('data: ', ''))
          addLine(event)

          if (event.type === 'done' && event.projectId) {
            setIsDone(true)
            setIsRunning(false)
            onComplete(event.projectId)
          }
        } catch {}
      }
    }
  }

  return { lines, isRunning, isDone, startOnboarding, bottomRef }
}
```

### SSE Event Types — What Each Triggers

| type | agent | What it means | UI effect |
|---|---|---|---|
| `start` | system | Cascade initialising | Pulse dot appears, container opens |
| `agent` | orchestrator/comms/project | New agent activated | Coloured agent header line |
| `step` | any | Agent calling a tool or doing work | Indented mono line, grey |
| `success` | any | A tool completed successfully | Green ✓ line |
| `delegate` | orchestrator | Handing off to sub-agents | Blue delegation line |
| `warning` | any | Risk or issue flagged | Amber ⚠ line |
| `done` | system | All agents complete | Summary card appears, review unlocks |
| `error` | system | Something failed | Red line + toast.error() |

---

## 9. Multi-Agent Coordination

The Communication and Project agents run in PARALLEL using Promise.all().
They share the database — both read the project record and write their outputs to it.
They do not communicate with each other directly.

```typescript
// Inside orchestrator's executeDelegateToAgents function
case 'delegateToAgents': {
  // Both agents start at EXACTLY the same time
  // Total time = whichever agent takes longer (not sum of both)
  const [commsResult, projectResult] = await Promise.all([
    runCommunicationAgent(projectId, onStep),  // has its own while loop
    runProjectAgent(projectId, onStep)          // has its own while loop
  ])

  return {
    success: true,
    emailsDrafted: commsResult.emailCount,
    milestonesCreated: projectResult.milestoneCount
  }
}
```

Each sub-agent (Communication, Project) follows the EXACT same loop pattern
as the Orchestrator. They have their own:
- messages array (starts fresh)
- system prompt (focused on their role)
- tools array (only their tools)
- while loop with MAX_STEPS = 10

---

## 10. The Branching Logic

Branches do NOT live in if/else code in the while loop.
The while loop is dumb — it just runs until no function calls remain.
Branching lives in TWO places:

1. **Tool return values** — include a signal that tells Gemini what to do next
2. **System prompt rules** — tell Gemini explicitly which tool to call based on signals

Example branch: incomplete deal brief
```
extractDealInfo returns { isComplete: false, instruction: 'Call requestMoreInfo next.' }
         ↓
Gemini reads the instruction in the return value
         ↓
Gemini calls requestMoreInfo (not delegateToAgents)
         ↓
requestMoreInfo returns { halted: true }
         ↓
Gemini returns text summary (no more tool calls)
         ↓
Loop exits. Project status: INTAKE. UI shows missing fields.
```

Example branch: complete brief
```
extractDealInfo returns { isComplete: true, instruction: 'Call assessComplexity next.' }
         ↓
assessComplexity returns { complexity: 'standard', instruction: 'Call delegateToAgents now.' }
         ↓
delegateToAgents runs — Promise.all fires both sub-agents
         ↓
Both sub-agents complete — results returned
         ↓
Gemini returns done text
         ↓
Loop exits. Project status: ONBOARDING. Review dashboard unlocks.
```

---

## 11. The Intake Form

The client intake form is hosted at `/intake/[projectId]/[token]`.
This page requires NO authentication — it is publicly accessible via the unique token.

The Communication Agent generates the questions when draftIntakeQuestionnaire runs.
Questions are saved to the IntakeForm model as JSON.

When the client submits the form:
1. Responses saved to intakeForm.responses in the database
2. intakeForm.submittedAt set to now()
3. Project status updated to ACTIVE
4. Any SCHEDULED follow-up for this project is cancelled:
   - FollowUp.status set to CANCELLED
   - QStash message cancelled via qstashMsgId

```typescript
// app/api/intake/[projectId]/route.ts
// POST handler when client submits
export async function POST(req, { params }) {
  const { responses, token } = await req.json()

  // Verify token matches
  const form = await prisma.intakeForm.findFirst({
    where: { projectId: params.projectId, token }
  })
  if (!form) return NextResponse.json({ error: 'Invalid' }, { status: 404 })

  // Save responses
  await prisma.intakeForm.update({
    where: { id: form.id },
    data: { responses, submittedAt: new Date() }
  })

  // Update project status
  await prisma.project.update({
    where: { id: params.projectId },
    data: { status: 'ACTIVE' }
  })

  // Cancel pending follow-up
  const followUp = await prisma.followUp.findFirst({
    where: { projectId: params.projectId, status: 'SCHEDULED' }
  })
  if (followUp) {
    await cancelQStashMessage(followUp.qstashMsgId)
    await prisma.followUp.update({
      where: { id: followUp.id },
      data: { status: 'CANCELLED' }
    })
  }

  return NextResponse.json({ success: true })
}
```

---

## 12. QStash Follow-Up Scheduling

When the Communication Agent runs scheduleFollowUp:

```typescript
// lib/scheduler/qstash.ts
import { Client } from '@upstash/qstash'

const qstash = new Client({ token: process.env.QSTASH_TOKEN! })

export async function scheduleFollowUp(projectId: string, emailId: string) {
  const msg = await qstash.publishJSON({
    url: `${process.env.APP_URL}/api/webhooks/followup`,
    body: { projectId, emailId },
    delay: 60 * 60 * 48  // 48 hours in seconds
  })
  return msg.messageId
}

export async function cancelQStashMessage(messageId: string | null) {
  if (!messageId) return
  try {
    await qstash.cancel(messageId)
  } catch {
    // ignore if already sent
  }
}
```

The webhook handler at `/api/webhooks/followup`:
```typescript
// app/api/webhooks/followup/route.ts
export async function POST(req) {
  const { projectId, emailId } = await req.json()

  // Check if intake already submitted — if so, do nothing
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { intakeForm: true }
  })

  if (project?.intakeForm?.submittedAt) {
    // Client already responded — cancel is irrelevant, just return
    return NextResponse.json({ cancelled: true })
  }

  // Send the follow-up via Resend
  const email = await prisma.projectEmail.findUnique({ where: { id: emailId } })
  if (email) {
    await sendEmail({ to: email.recipient, subject: email.subject, html: email.content })
    await prisma.projectEmail.update({ where: { id: emailId }, data: { status: 'SENT', sentAt: new Date() } })
    await prisma.followUp.updateMany({ where: { projectId, emailId }, data: { status: 'SENT' } })
  }

  return NextResponse.json({ sent: true })
}
```

---

## 13. Email Sending via Resend

```typescript
// lib/email/resend.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
  to,
  subject,
  html
}: { to: string; subject: string; html: string }) {
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject,
    html
  })

  if (error) throw new Error(`Resend error: ${error.message}`)
  return data
}
```

---

## 14. Human-In-The-Loop Design

This is intentional. Nothing sends without human review (except auto follow-ups).

| Action | Human Required? | Why |
|---|---|---|
| Welcome email | YES — approve and send | Content quality matters |
| Intake questionnaire | YES — review questions | Agent-generated, needs check |
| Kickoff agenda | YES — approve | Must be accurate |
| 48hr follow-up | NO — auto-sends | Low stakes, pre-approved pattern |
| Project milestones | YES — confirm plan | Commits team to a timeline |

The review dashboard shows all drafts with Edit / Approve & Send buttons.
Account manager can edit any draft inline before sending.
Regenerate button lets them ask agent to rewrite with new instructions.

---

## 15. Vultr Deployment (Complete Steps)

This must be done on Day 5 or 6 of the hackathon build.

### Prerequisites
- Vultr account with billing method
- Domain name pointed to Vultr server IP (or use the sslip.io temp domain)
- GitHub repo is public

### Step 1: Provision Vultr Server

In Vultr console:
- Deploy → Instances → Shared CPU
- Image: Ubuntu 22.04 LTS
- Plan: 2GB RAM, 1 CPU ($12/mo minimum for Coolify)
- Location: pick closest to demo location
- Click Deploy. Wait ~60 seconds for status: Running.

### Step 2: Install Coolify via Vultr Marketplace

Alternative: In Vultr Marketplace, search for Coolify and deploy directly.
This is the fastest path — Coolify comes pre-installed.

OR manual install after SSH:
```bash
ssh root@YOUR_VULTR_IP
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

### Step 3: Access Coolify Dashboard

Navigate to: `http://YOUR_VULTR_IP:8000`
Create admin account on first visit.

### Step 4: Connect GitHub

Coolify dashboard → Sources → Add Source → GitHub → Authorize OAuth.
This lets Coolify pull from your repositories.

### Step 5: Add PostgreSQL Database

Coolify dashboard → Your Project → Add Resource → Database → PostgreSQL.
Coolify creates it and shows a connection string.
Copy the internal connection string for use as DATABASE_URL.

### Step 6: Deploy the Application

Coolify dashboard → Your Project → Add Resource → Application → GitHub.
Select the cascade repository → branch: main.
Coolify detects docker-compose.yml automatically.
Select Docker Compose as build pack.
Click Save. Coolify generates a temporary URL (RANDOM.IP.sslip.io).

### Step 7: Set Environment Variables

In Coolify → Application → Environment Variables:
Add every variable from .env.local.
Use the internal PostgreSQL connection string for DATABASE_URL.
Set APP_URL to the Coolify-generated domain (or custom domain).
Click Save.

### Step 8: Run Database Migration

After first deployment, run migrations via Coolify terminal or SSH:
```bash
npx prisma migrate deploy
```

### Step 9: Enable CI/CD (Auto-Deploy on Push)

Coolify → Application → Settings → Enable Automatic Deployment.
Copy the webhook URL shown.
GitHub repo → Settings → Webhooks → Add webhook.
Paste Coolify webhook URL. Content type: application/json. Event: push.
Now every git push to main auto-deploys.

### Step 10: Custom Domain (Optional for Demo)

Coolify → Application → Configuration → Domains.
Replace sslip.io domain with your custom domain.
Enable Automatic HTTPS (Let's Encrypt).
Save → Redeploy.

### Dockerfile Required

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

### docker-compose.yml Required

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

Note: PostgreSQL is a SEPARATE Coolify resource — do not include it in docker-compose.

---

## 16. Pages — What Each One Contains

### /login
Simple centered card. Email + password fields. NextAuth credential provider.
On success → redirect to /dashboard.

### /dashboard
- Header: "Welcome back" + "New Onboarding" button (→ /onboard)
- Stats row: 4 cards (Total Projects, Onboarding, Emails Sent, Pending Responses)
- Project list: staggered Framer Motion cards, each showing client name, status badge, date, quick actions

### /onboard
- Page title: "New Client Onboarding"
- PromptInput component (from /components/ui/prompt-input.tsx) — deal brief text area with optional PDF upload
- Below input: AgentFeed component — hidden until "Start Cascade" is clicked
- When agents complete: redirect to /projects/[id] automatically

### /projects/[id]
- Three panels side by side or stacked:
  1. **Emails** — EmailCard components for WELCOME, INTAKE_QUESTIONNAIRE, KICKOFF_AGENDA, FOLLOW_UP
  2. **Project Plan** — MilestoneList with MilestoneCard for each phase
  3. **Follow-up Schedule** — shows QStash scheduled times, cancel option

### /intake/[projectId]/[token]
- NO sidebar, NO auth
- Cascade branding at top
- Progress bar (Framer Motion animated width)
- Multistep form — one question per step using AnimatePresence
- Questions loaded from database (generated by AI agent)
- Submit → POST to /api/intake/[projectId] → shows success screen

### /settings
- Team Members section — list of TeamMember records
- Add/edit/delete team members (name, email, role)
- Roles: Designer, Developer, Project Manager, QA

---

## 17. Coding Rules

1. **Never use `any`** — type everything. Use Prisma generated types.
2. **Use `cn()` for all classNames** — import from `@/lib/utils`
3. **Server components by default** — add `'use client'` only for interactivity
4. **Framer Motion** — all entrance animations, all feed lines, all state transitions
5. **Sonner** — `toast.success()` and `toast.error()` for all feedback to user
6. **Prisma** — import ONLY from `@/lib/db/prisma`. Never `new PrismaClient()` directly.
7. **Tool descriptions** — written as imperatives. Gemini decides when to call based on the description string.
8. **Return signals** — every tool execute function returns an `instruction` field to guide Gemini's next decision.
9. **MAX_STEPS = 10** — every agent loop must have this hard limit. Prevents runaway API calls.
10. **Error handling** — every async function needs try/catch. Errors must stream as AgentEvent to frontend.
11. **Environment variables** — always `process.env.VAR_NAME`. Never hardcode.
12. **Dates** — store UTC in database. Convert to local timezone only at display time.
13. **Model name** — always `gemini-2.5-flash`. Never 2.0-flash (deprecated). Never 3.x (paid preview).

---

## 18. Key Decisions Made During Planning

These decisions were deliberately made — do not undo them without reason:

- **Light mode only** — enterprise tool, professional aesthetic, no dark mode
- **Text input (not PDF first)** — account manager types or pastes the brief. PDF upload optional enhancement.
- **Human reviews emails before sending** — no auto-send for welcome/intake/kickoff emails. Only follow-up auto-sends.
- **Follow-up auto-cancels when intake submitted** — system checks DB before sending. If client already responded, nothing sends.
- **No Calendly API** — generate meeting time suggestions in the kickoff email instead. Saves 4 hours of build time.
- **No client login** — client only sees the public intake form at /intake/[id]/[token]. Nothing else.
- **No mobile responsive** — desktop only for the demo. Not worth the time.
- **Three agents not one** — parallel execution is real, specialization improves quality, hits Collaborative Systems track.
- **Neon for dev, Vultr PostgreSQL for prod** — Neon is fastest to set up locally on Windows. Vultr runs the production DB.
- **Promise.all() for sub-agents** — Communication and Project agents run simultaneously. Not sequential.

---

## 19. Demo Video Strategy — First Place Script

The demo must tell a story in under 3 minutes. Every second counts.

### The Script

**0:00 — Setup (15 seconds)**
Show the clean dashboard. Empty. Professional. One project exists as example.
Say: "This is Cascade. You close a deal. You give it the context. It handles the rest."

**0:15 — Input (30 seconds)**
Upload a real PDF contract. A real one. Multiple pages.
Type a natural language brief below it.
Paste the client's website URL.
Say: "Three inputs. That's it."
Click Start Cascade.

**0:45 — Research Agent fires (30 seconds)**
Feed shows Research Agent reading the PDF.
Show it extracting specific commitments from the contract.
Show it reading the website — identifying the industry, company description.
Show it finding a discrepancy: "Contract mentions 3 revision rounds — brief only mentioned 1."
Say: "Before anything is drafted, the Research Agent reads everything. No templates."

**1:15 — Parallel agents (30 seconds)**
Show Communication Agent and Project Agent activating simultaneously in the feed.
Show the requestMoreContext moment — agent asks one smart question.
Account manager answers inline in the feed. Agent continues.
Say: "When the agent needs something it doesn't have, it asks. Then it continues."

**1:45 — Real-world actions (20 seconds)**
Switch to the email inbox. Show the welcome email arrived. Real. Personalized.
It references something specific from the research — the company's actual product.
Show the risk flag: "⚠ Paystack integration requires API credentials — blocking milestone 4."
Say: "The agent sent that email. And it found a risk nobody told it to look for."

**2:05 — The autonomy moment (40 seconds)**
Open the intake form URL in a new tab. Fill it out as the client.
Submit.
Switch back to the dashboard.
Watch agents re-activate automatically. No click. No trigger.
Updated milestones appear. Status changes to ACTIVE.
Say: "The client filled out the form. Nobody triggered anything. The agents responded."

**2:45 — Close (15 seconds)**
Show the project review page. Emails sent. Milestones updated. Risks flagged.
Say: "From deal brief to fully onboarded client. Autonomous. Multimodal. Multi-agent."

**Total: ~3 minutes.**

### The Three Moments Judges Will Remember
1. Research Agent reading the PDF and finding the discrepancy
2. The agent asking a smart question and continuing after the answer
3. Agents re-activating when the client submits the form with nobody clicking anything

---

## 20. Do Not Build

- Landing page
- Mobile responsive design
- Multi-user auth with roles
- Client login/portal
- Calendly API integration
- Meeting notes agent
- Real-time WebSockets (SSE is sufficient)
- Prisma migrations inside Dockerfile
- Complex loading skeletons

---

## Commands

```bash
npm run dev                           # start dev server
npx prisma migrate dev --name [name] # create and apply migration
npx prisma migrate deploy            # apply migrations in production
npx prisma generate                  # regenerate TypeScript types
npx prisma studio                    # visual DB browser on :5555
npx shadcn@latest add [component]    # add shadcn component
npm run build                        # test production build
npm run lint                         # ESLint check
```