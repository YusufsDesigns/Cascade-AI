# STYLE.md — Cascade Design System

## Design Philosophy

**Clean. Professional. Alive.**

Cascade is a light-mode enterprise SaaS tool. The aesthetic is refined, minimal,
and technically precise — think Notion, Linear (light), Vercel's white theme.
No dark backgrounds. No heavy gradients. The interface is honest and trustworthy.

The defining visual is the **Agent Feed** — a live pipeline where text streams
in line by line using Framer Motion, showing exactly what each agent is doing
at every moment. This is the soul of the product and everything serves it.

---

## Color System

Add these to `app/globals.css` as CSS custom properties:

```css
:root {
  /* Backgrounds */
  --bg-base: #ffffff;
  --bg-surface: #f9f9fb;
  --bg-elevated: #f3f4f6;
  --bg-hover: #f0f0f8;
  --bg-active: #ebebf5;

  /* Borders */
  --border-subtle: #f0f0f5;
  --border-default: #e4e4ec;
  --border-strong: #d0d0e0;
  --border-focus: #6366f1;

  /* Text */
  --text-primary: #09090b;
  --text-secondary: #52525b;
  --text-muted: #a1a1aa;
  --text-placeholder: #c4c4cf;

  /* Accent — Indigo */
  --accent: #6366f1;
  --accent-hover: #4f46e5;
  --accent-light: rgba(99, 102, 241, 0.08);
  --accent-border: rgba(99, 102, 241, 0.2);
  --accent-text: #4338ca;

  /* Agent Identity Colors (used in feed) */
  --agent-orchestrator: #4f46e5;
  --agent-orchestrator-bg: rgba(79, 70, 229, 0.06);
  --agent-comms: #059669;
  --agent-comms-bg: rgba(5, 150, 105, 0.06);
  --agent-project: #2563eb;
  --agent-project-bg: rgba(37, 99, 235, 0.06);

  /* Semantic */
  --success: #059669;
  --success-bg: rgba(5, 150, 105, 0.08);
  --success-border: rgba(5, 150, 105, 0.2);
  --warning: #d97706;
  --warning-bg: rgba(217, 119, 6, 0.08);
  --error: #dc2626;
  --error-bg: rgba(220, 38, 38, 0.08);

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.08);
}
```

Tailwind config — extend with these colors:
```js
// tailwind.config.ts
colors: {
  accent: '#6366f1',
  'accent-hover': '#4f46e5',
}
```

---

## Typography

Font stack (Geist is installed with Next.js by default):

```css
body {
  font-family: var(--font-geist-sans), system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-primary);
  background: var(--bg-base);
  -webkit-font-smoothing: antialiased;
}

code, .font-mono {
  font-family: var(--font-geist-mono), 'Courier New', monospace;
}
```

Type scale:

| Use | Tailwind Classes | Notes |
|---|---|---|
| Page title | `text-2xl font-semibold text-zinc-900` | Dashboard headings |
| Section heading | `text-sm font-semibold text-zinc-900 uppercase tracking-wider` | Card headers |
| Body text | `text-sm text-zinc-700` | Default content |
| Label | `text-xs font-medium text-zinc-500` | Form labels, metadata |
| Caption / meta | `text-xs text-zinc-400` | Timestamps, IDs |
| Agent feed text | `text-sm font-mono text-zinc-700` | Monospace in feed |
| Agent step text | `text-xs font-mono text-zinc-500` | Indented feed steps |

---

## Layout & Spacing

```
Sidebar:        240px fixed left
Content area:   calc(100vw - 240px), starts at left: 240px
Page padding:   px-8 py-7
Card padding:   p-5
Section gap:    space-y-6
Element gap:    space-y-3 or gap-3
Border radius:  rounded-lg (8px) for cards, rounded-md (6px) for inputs/buttons
```

---

## Sidebar

```tsx
// components/layout/Sidebar.tsx
// Fixed 240px, white background, right border

<aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-zinc-200 flex flex-col z-40">

  {/* Logo */}
  <div className="h-14 flex items-center px-5 border-b border-zinc-100">
    <span className="text-sm font-bold text-zinc-900 tracking-tight">Cascade</span>
    <span className="ml-1 text-xs font-semibold text-indigo-500">AI</span>
  </div>

  {/* Nav */}
  <nav className="flex-1 p-3 space-y-0.5">

    {/* Active state */}
    <Link className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium
      bg-indigo-50 text-indigo-700">
      <Icon className="w-4 h-4" />
      Label
    </Link>

    {/* Inactive state */}
    <Link className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm
      text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
      <Icon className="w-4 h-4" />
      Label
    </Link>

  </nav>

  {/* Bottom user area */}
  <div className="p-3 border-t border-zinc-100">
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-zinc-50 cursor-pointer">
      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
        <span className="text-xs font-semibold text-indigo-600">Y</span>
      </div>
      <div>
        <p className="text-xs font-medium text-zinc-900">Account</p>
        <p className="text-xs text-zinc-400">Settings</p>
      </div>
    </div>
  </div>

</aside>
```

---

## Cards

```tsx
{/* Base card */}
<div className="bg-white rounded-lg border border-zinc-200 p-5 shadow-sm">

{/* Elevated card (used on surfaces) */}
<div className="bg-white rounded-lg border border-zinc-200 p-5 shadow-md">

{/* Subtle surface card */}
<div className="bg-zinc-50 rounded-lg border border-zinc-100 p-5">
```

---

## Buttons

```tsx
{/* Primary */}
<button className="h-9 px-4 rounded-md text-sm font-medium
  bg-indigo-600 text-white hover:bg-indigo-700
  transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed">

{/* Secondary */}
<button className="h-9 px-4 rounded-md text-sm font-medium
  bg-white text-zinc-700 border border-zinc-200
  hover:bg-zinc-50 hover:border-zinc-300
  transition-colors duration-150">

{/* Ghost */}
<button className="h-9 px-4 rounded-md text-sm text-zinc-500
  hover:text-zinc-900 hover:bg-zinc-100
  transition-colors duration-150">

{/* Destructive */}
<button className="h-9 px-4 rounded-md text-sm font-medium
  text-red-600 border border-red-200 bg-red-50
  hover:bg-red-100 transition-colors duration-150">

{/* Icon button */}
<button className="h-8 w-8 rounded-md flex items-center justify-center
  text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100
  transition-colors duration-150">
```

---

## Form Inputs

```tsx
{/* Text input */}
<input className="w-full h-9 px-3 rounded-md text-sm
  bg-white text-zinc-900 border border-zinc-200
  placeholder:text-zinc-400
  focus:outline-none focus:border-indigo-400
  focus:ring-2 focus:ring-indigo-500/10
  transition-colors duration-150" />

{/* Textarea */}
<textarea className="w-full px-3 py-2 rounded-md text-sm
  bg-white text-zinc-900 border border-zinc-200
  placeholder:text-zinc-400
  focus:outline-none focus:border-indigo-400
  focus:ring-2 focus:ring-indigo-500/10
  transition-colors duration-150 resize-none" />

{/* Label */}
<label className="block text-xs font-medium text-zinc-600 mb-1.5">

{/* Helper text */}
<p className="text-xs text-zinc-400 mt-1">
```

---

## The Deal Brief Input (PromptInput Component)

Use the `PromptInput` component from `/components/ui/prompt-input.tsx` on the `/onboard` page.
Customise it with light-mode classes:

```tsx
<PromptInput className="border-zinc-200 bg-white shadow-sm rounded-2xl">
  <PromptInputTextarea
    placeholder="Describe the new client deal... client name, deliverables, timeline, contact email"
    className="text-zinc-900 placeholder:text-zinc-400 min-h-[80px]"
  />
  <PromptInputActions className="justify-between pt-2">
    <PromptInputAction tooltip="Upload contract PDF">
      <label className="flex h-8 w-8 cursor-pointer items-center justify-center
        rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600
        transition-colors">
        <input type="file" accept=".pdf" className="hidden" />
        <Paperclip className="w-4 h-4" />
      </label>
    </PromptInputAction>
    <PromptInputAction tooltip="Start onboarding">
      <Button
        size="sm"
        className="h-8 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium"
        onClick={handleSubmit}
      >
        {isLoading ? <Square className="w-3 h-3 fill-current" /> : <>Start Cascade <ArrowUp className="w-3 h-3 ml-1" /></>}
      </Button>
    </PromptInputAction>
  </PromptInputActions>
</PromptInput>
```

---

## The Agent Feed — Core Component

This is the most important visual in the entire product.
It must feel like a GitHub Actions pipeline — alive, precise, readable.

### Feed Container

```tsx
<div className="rounded-xl border border-zinc-200 bg-zinc-50 overflow-hidden">

  {/* Header bar */}
  <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-white">
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
      <span className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
        Agent Activity
      </span>
    </div>
    <span className="text-xs text-zinc-400">Live</span>
  </div>

  {/* Feed lines — scrollable */}
  <div className="p-4 space-y-1 max-h-[420px] overflow-y-auto font-mono">
    {lines.map((line, i) => <AgentLine key={i} line={line} />)}
  </div>

</div>
```

### AgentLine Component

Each line animates in with Framer Motion. Color depends on type:

```tsx
// components/agent-feed/AgentLine.tsx
import { motion } from 'framer-motion'

type LineType = 'start' | 'agent' | 'step' | 'success' | 'delegate' | 'warning' | 'done' | 'error'

interface FeedLine {
  type: LineType
  agent?: 'orchestrator' | 'comms' | 'project' | 'system'
  message: string
}

const lineStyles: Record<LineType, string> = {
  start:    'text-zinc-500',
  agent:    'text-indigo-600 font-semibold',      // agent name headers
  step:     'text-zinc-500 pl-4',                 // indented steps
  success:  'text-emerald-600 pl-4',              // ✓ completed
  delegate: 'text-blue-600',                      // delegation events
  warning:  'text-amber-600 pl-4',                // ⚠ warnings
  done:     'text-emerald-700 font-semibold',     // final completion
  error:    'text-red-600',                       // errors
}

const agentPrefix: Record<string, string> = {
  orchestrator: '◆ Orchestrator',
  comms:        '◈ Communication Agent',
  project:      '◈ Project Agent',
  system:       '●',
}

export function AgentLine({ line }: { line: FeedLine }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`text-xs leading-relaxed ${lineStyles[line.type]}`}
    >
      {line.type === 'agent' && line.agent
        ? `${agentPrefix[line.agent]} activated`
        : line.message
      }
    </motion.div>
  )
}
```

### What The Feed Looks Like When Running

```
● Cascade is starting...

◆ Orchestrator activated
    → Reading deal brief...
    → Identified: Acme Corp · 12 weeks · 3 deliverables
    → Contact: sarah@acme.com
    ✓ All information present
    ✓ Complexity: Standard

◈ Delegating to agents...

◈ Communication Agent activated
    → Drafting welcome email for Sarah...
    ✓ Welcome email ready
    → Generating intake questionnaire...
    ✓ 5 questions generated
    → Scheduling 48-hour follow-up...
    ✓ Follow-up scheduled for May 17

◈ Project Agent activated
    → Analysing 3 deliverables...
    → Building milestone structure...
    ✓ Phase 1: Discovery & Requirements (Week 1–2)
    ✓ Phase 2: Storefront Design (Week 3–5)
    ✓ Phase 3: Development (Week 6–9)
    ⚠ Risk: Paystack requires API credentials from client
    ✓ Phase 4: Integration & Launch (Week 10–12)
    ✓ 5 milestones created

✓ Cascade complete · 47 seconds
  3 emails drafted · 5 milestones created · 1 follow-up scheduled
```

---

## Status Badges

```tsx
const statusConfig = {
  INTAKE:      { label: 'Intake',      class: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
  ONBOARDING:  { label: 'Onboarding',  class: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  ACTIVE:      { label: 'Active',      class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  COMPLETED:   { label: 'Completed',   class: 'bg-zinc-100 text-zinc-500 border-zinc-200' },
  DRAFT:       { label: 'Draft',       class: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
  APPROVED:    { label: 'Approved',    class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  SENT:        { label: 'Sent',        class: 'bg-blue-50 text-blue-700 border-blue-200' },
  SCHEDULED:   { label: 'Scheduled',   class: 'bg-amber-50 text-amber-700 border-amber-200' },
}

// Badge markup
<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${config.class}`}>
  {config.label}
</span>
```

---

## Email Card (Review Dashboard)

```tsx
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  className="bg-white rounded-lg border border-zinc-200 p-5 shadow-sm"
>
  {/* Header */}
  <div className="flex items-start justify-between mb-3">
    <div>
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
        Welcome Email
      </p>
      <p className="text-sm font-semibold text-zinc-900">{email.subject}</p>
      <p className="text-xs text-zinc-400 mt-0.5">To: {email.recipient}</p>
    </div>
    <StatusBadge status={email.status} />
  </div>

  {/* Content — editable or read-only */}
  {isEditing ? (
    <textarea
      className="w-full text-sm text-zinc-700 bg-zinc-50 rounded-md border border-zinc-200
        p-3 resize-none focus:outline-none focus:border-indigo-400 focus:ring-2
        focus:ring-indigo-500/10 min-h-[140px]"
      value={content}
      onChange={e => setContent(e.target.value)}
    />
  ) : (
    <p className="text-sm text-zinc-600 leading-relaxed line-clamp-4">{email.content}</p>
  )}

  {/* Actions */}
  <div className="flex items-center gap-2 mt-4">
    <button onClick={toggleEdit}
      className="h-8 px-3 text-xs rounded-md border border-zinc-200 text-zinc-600
        hover:bg-zinc-50 transition-colors">
      {isEditing ? 'Done' : 'Edit'}
    </button>
    <button
      className="h-8 px-3 text-xs rounded-md bg-emerald-600 text-white
        hover:bg-emerald-700 transition-colors disabled:opacity-40"
      disabled={email.status === 'SENT'}>
      {email.status === 'SENT' ? '✓ Sent' : 'Approve & Send'}
    </button>
  </div>
</motion.div>
```

---

## Milestone Card

```tsx
<motion.div
  initial={{ opacity: 0, x: -4 }}
  animate={{ opacity: 1, x: 0 }}
  className="flex items-start gap-3 p-4 rounded-lg border border-zinc-100
    bg-white hover:border-zinc-200 transition-colors"
>
  {/* Phase dot */}
  <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100
    flex items-center justify-center flex-shrink-0 mt-0.5">
    <span className="text-xs font-bold text-indigo-600">{phase}</span>
  </div>

  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2 mb-0.5">
      <p className="text-sm font-medium text-zinc-900">{title}</p>
      {requiresClient && (
        <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
          Client action
        </span>
      )}
    </div>
    <p className="text-xs text-zinc-500 mb-2">{description}</p>
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-400">{ownerRole}</span>
      <span className="text-xs text-zinc-300">·</span>
      <span className="text-xs text-zinc-400">{formatDate(dueDate)}</span>
    </div>
  </div>

  <StatusBadge status={status} />
</motion.div>
```

---

## Client Intake Form (Public Page)

The `/intake/[projectId]/[token]` page uses a multistep form with Framer Motion
(same pattern as the multistep-form component from shadcn). Each question is a step.

Structure:
```
Step 1 of N: [Question text]
[ Answer input ]
← Back    Next →
```

Progress bar uses framer-motion animated width.
Questions are loaded from the DB (generated by the AI agent).

```tsx
// Outer container
<div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
  <div className="w-full max-w-lg">

    {/* Cascade branding */}
    <div className="text-center mb-8">
      <p className="text-sm font-bold text-zinc-900">Cascade</p>
      <p className="text-xs text-zinc-400 mt-1">Client Onboarding Form</p>
    </div>

    {/* Progress bar */}
    <div className="w-full h-1 bg-zinc-200 rounded-full mb-8 overflow-hidden">
      <motion.div
        className="h-full bg-indigo-500 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </div>

    {/* Question card */}
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm"
      >
        ...question content
      </motion.div>
    </AnimatePresence>

  </div>
</div>
```

---

## Page Animations (Framer Motion)

All page content animates in on mount:

```tsx
// Standard page entrance
const pageVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
}

// Staggered list entrance
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } }
}

// Usage
<motion.div variants={pageVariants} initial="hidden" animate="visible">
  <motion.ul variants={containerVariants} initial="hidden" animate="visible">
    {items.map(item => (
      <motion.li key={item.id} variants={itemVariants}>
        <ProjectCard {...item} />
      </motion.li>
    ))}
  </motion.ul>
</motion.div>
```

---

## Toasts (Sonner)

```tsx
// Layout setup — add once to root layout
import { Toaster } from 'sonner'
<Toaster position="bottom-right" richColors />

// Usage throughout app
import { toast } from 'sonner'
toast.success('Email sent to Sarah at Acme Corp')
toast.error('Failed to connect to Gemini. Check API key.')
toast.loading('Cascade is running...')  // use with .dismiss() when done
```

---

## Dashboard Stats Row

```tsx
<div className="grid grid-cols-4 gap-4 mb-6">
  {[
    { label: 'Total Projects',    value: 12, icon: FolderOpen },
    { label: 'Onboarding',        value: 3,  icon: Zap, accent: true },
    { label: 'Emails Sent',       value: 47, icon: Mail },
    { label: 'Pending Responses', value: 2,  icon: Clock, warning: true },
  ].map(stat => (
    <div key={stat.label}
      className={`bg-white rounded-lg border p-4 ${stat.accent ? 'border-indigo-200' : 'border-zinc-200'}`}>
      <div className="flex items-center gap-2 mb-2">
        <stat.icon className={`w-4 h-4 ${stat.accent ? 'text-indigo-500' : 'text-zinc-400'}`} />
        <p className="text-xs text-zinc-500">{stat.label}</p>
      </div>
      <p className={`text-2xl font-bold ${stat.accent ? 'text-indigo-600' : 'text-zinc-900'}`}>
        {stat.value}
      </p>
    </div>
  ))}
</div>
```

---

## Auth Pages (Login / Register)

Auth pages use a subtle gradient background, never plain `bg-zinc-50`:

```tsx
<div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-indigo-50/30 flex items-center justify-center p-6">
```

Cards on auth pages use `rounded-2xl` (not `rounded-lg`) with a faint shadow:
```tsx
<div className="bg-white rounded-2xl border border-zinc-200 shadow-sm shadow-zinc-900/5 p-6">
```

Logo icon lockup (used on all auth pages):
```tsx
<div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/25 mb-4">
  <Zap className="w-5 h-5 text-white" />
</div>
```

Auth page inputs use `h-10 rounded-lg` (slightly taller than dashboard inputs):
```tsx
<input className="w-full h-10 px-3 rounded-lg text-sm bg-white text-zinc-900 border border-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-colors duration-150" />
```

Auth page primary button:
```tsx
<button className="w-full h-10 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-sm shadow-indigo-600/20 transition-all duration-150 disabled:opacity-50">
```

---

## Dashboard Page

The dashboard is a **server component** that fetches data directly from Prisma (no extra API round-trip).

### Header with greeting + CTA
```tsx
<div className="flex items-start justify-between mb-8">
  <div>
    <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">{greeting}</h1>
    <p className="text-sm text-zinc-400 mt-0.5">{formattedDate}</p>
  </div>
  <Link href="/onboard" className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/25 transition-all">
    <Plus className="w-4 h-4" /> New onboarding
  </Link>
</div>
```

### Stat cards (updated — rounded-2xl with hover lift)
```tsx
<div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm shadow-zinc-900/4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-indigo-50">
    <Icon className="w-4 h-4 text-indigo-500" />
  </div>
  <p className="text-2xl font-bold text-zinc-900 leading-none mb-1">{value}</p>
  <p className="text-xs text-zinc-400">{label}</p>
</div>
```

### Project list rows
Each project is a full-width link row:
```tsx
<Link href={`/projects/${id}`}
  className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-white border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all group">

  {/* Client avatar */}
  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
    <span className="text-xs font-bold text-indigo-600">{initial}</span>
  </div>

  {/* Name + email */}
  <div className="flex-1 min-w-0">
    <p className="text-sm font-semibold text-zinc-900 truncate">{name}</p>
    <p className="text-xs text-zinc-400 truncate">{clientName} · {email}</p>
  </div>

  {/* Status badge with dot */}
  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
    Onboarding
  </span>

  <ArrowRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-500 group-hover:translate-x-0.5 transition-all" />
</Link>
```

### Empty state
```tsx
<div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center">
  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
    <TrendingUp className="w-5 h-5 text-indigo-500" />
  </div>
  <p className="text-sm font-semibold text-zinc-700 mb-1">No projects yet</p>
  <p className="text-xs text-zinc-400 mb-5 max-w-xs mx-auto leading-relaxed">...</p>
  <Link href="/onboard" className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700">
    <Zap className="w-3.5 h-3.5" /> Start first onboarding
  </Link>
</div>
```

---

## Onboard / Command Prompt Layout

For pages that have a "compose" or "create" action as the primary focus, use a centered idle state:

```tsx
{/* IDLE: vertically centered in content area */}
<div className="min-h-[calc(100vh-57px)] flex flex-col items-center justify-center px-8 py-12">
  <div className="w-full max-w-2xl">
    {/* Badge pill above headline */}
    <div className="flex justify-center mb-6">
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-medium text-indigo-600">
        <Sparkles className="w-3 h-3" /> Powered by Gemini 2.5 Flash
      </span>
    </div>

    {/* Headline */}
    <h1 className="text-3xl font-semibold text-zinc-900 tracking-tight text-center leading-snug">
      Describe the deal.<br />
      <span className="text-indigo-500">Cascade handles the rest.</span>
    </h1>

    {/* Input card */}
    <div className="rounded-2xl bg-white border border-zinc-200 shadow-lg shadow-zinc-900/5 focus-within:border-indigo-300 focus-within:shadow-indigo-100/80 focus-within:shadow-xl transition-all duration-200 mt-8">
      <textarea className="w-full px-5 pt-4 pb-3 text-sm text-zinc-900 placeholder:text-zinc-400 bg-transparent resize-none focus:outline-none leading-relaxed" />
      <div className="flex items-center gap-2 px-4 pb-3 pt-1 border-t border-zinc-100">
        {/* actions */}
      </div>
    </div>
  </div>
</div>

{/* ACTIVE: pipeline view */}
<div className="px-8 py-7">
  <div className="w-full max-w-4xl mx-auto">
    {/* brief chip */}
    <div className="mb-4 px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-100 flex items-start gap-3">
      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mt-0.5 shrink-0">Brief</span>
      <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2">{brief}</p>
    </div>
    <AgentFeed brief={brief} />
  </div>
</div>
```

---

## Agent Feed — Grouped Sections

The feed groups events by agent. Each agent renders as a bordered card with a colored header.

```tsx
{/* Section card */}
<div className="rounded-xl border border-zinc-100 overflow-hidden">

  {/* Header — color varies by agent */}
  <div className="flex items-center gap-2 px-4 py-2.5 border-b bg-indigo-50 border-indigo-100">
    <span className="text-sm font-bold text-indigo-600">◆</span>
    <span className="text-xs font-semibold text-indigo-800">Orchestrator</span>
    <span className="ml-auto text-[10px] text-zinc-400 font-medium uppercase tracking-wider">active</span>
  </div>

  {/* Lines */}
  <div className="px-4 py-3 space-y-1.5 bg-zinc-50/50">
    {/* step */}
    <div className="flex items-start gap-2 font-mono text-xs text-zinc-500">
      <ArrowRight className="w-3 h-3 shrink-0 mt-px text-zinc-400" />
      <span>→ Reading deal brief...</span>
    </div>
    {/* success */}
    <div className="flex items-start gap-2 font-mono text-xs text-emerald-700">
      <Check className="w-3 h-3 shrink-0 mt-px text-emerald-500" />
      <span>✓ All information present</span>
    </div>
  </div>
</div>
```

Agent header colours:
| Agent | Symbol | headerBg | headerBorder | symbolColor | labelColor |
|---|---|---|---|---|---|
| Orchestrator | ◆ | `bg-indigo-50` | `border-indigo-100` | `text-indigo-600` | `text-indigo-800` |
| Communication | ◈ | `bg-emerald-50` | `border-emerald-100` | `text-emerald-600` | `text-emerald-800` |
| Project | ◈ | `bg-blue-50` | `border-blue-100` | `text-blue-600` | `text-blue-800` |

---

## Design Upgrade Rules (applied from Session 4 onward)

- **Border radius:** prefer `rounded-2xl` for cards and containers; `rounded-xl` for buttons and inputs; `rounded-lg` only for small elements
- **Shadows:** use `shadow-sm shadow-zinc-900/4` (not `shadow-sm` alone); use `shadow-indigo-600/25` on indigo buttons
- **Hover lift:** interactive cards get `hover:-translate-y-0.5 hover:shadow-md transition-all duration-200`
- **Buttons:** `rounded-xl` (not `rounded-md`); primary gets `shadow-sm shadow-indigo-600/20`; active state `active:bg-indigo-800`
- **Section headings:** `text-sm font-semibold text-zinc-900` (no uppercase, no tracking)
- **Empty states:** `border-dashed border-zinc-200` with `rounded-2xl`, icon in `rounded-2xl bg-[color]-50`, description under 2 lines
- **Status badges:** dot + label pill with `rounded-full`; dot is `w-1.5 h-1.5 rounded-full`

---

## What NOT To Do

- No dark mode anywhere
- No plain `bg-zinc-50` backgrounds on full pages — use gradient or white
- No `rounded-lg` or `rounded-md` for primary cards/buttons — use `rounded-2xl` / `rounded-xl`
- No heavy box shadows — use the `/4` and `/5` opacity variants
- No bouncing animations — `easeOut` only, duration ≤ 0.35s
- No more than 2 accent colors on any single screen
- No skeleton loaders — use Framer Motion `opacity: 0 → 1` fade-in
- No inline styles — always Tailwind classes
- No auto-redirecting after async operations — always show a button