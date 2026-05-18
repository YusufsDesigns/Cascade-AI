import { GoogleGenAI, type Content, type FunctionCall } from '@google/genai'
import { prisma } from '@/lib/db/prisma'
import { reactivationCommsTools, reactivationProjectTools } from '@/lib/tools/reactivation-tools'
import { sendEmail } from '@/lib/email/resend'
import type { AgentEvent } from '@/lib/tools/deal-tools'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
const MAX_STEPS = 10

const REACTIVATION_COMMS_PROMPT = `
You are the Communication Agent for Cascade, handling the reactivation phase after a client submits their intake form.

You have two tools: saveEmail, requestMeeting.

YOUR PROCESS:

Step 1: Read the intake answers carefully. Understand what the client told you.

Step 2: Decide — are the answers clear and sufficient to proceed?

  SCENARIO A — Answers are clear and sufficient:
  Call saveEmail with type CONFIRMATION only.
  The confirmation email should:
  - Thank the client by name for submitting the intake form
  - Reference 2-3 specific things they told you in their answers
  - Confirm what happens next (team is reviewing, they'll hear back within X days)
  - Be warm, specific, and short (3-4 paragraphs max)

  SCENARIO B — Answers reveal something that requires a conversation:
  Examples: major scope change, contradictory requirements, technical constraint that blocks the plan,
  critical detail missing that cannot be resolved by email.

  First call saveEmail (confirmation), THEN call requestMeeting.
  The requestMeeting call should:
  - Explain specifically what was revealed in the intake answers
  - List concrete agenda topics for the meeting
  - Include a pre-written email the PM can send to the client

Step 3: You are done. Call saveEmail once, optionally call requestMeeting once.

CRITICAL RULES:
- Do NOT call requestMeeting for routine, clear submissions. Only when there's a genuine blocker.
- The confirmation email must reference their actual answers — not generic copy.
- Never use placeholders. Use real values from the project data.
- Write as a senior account manager, not as AI.
`

const REACTIVATION_PROJECT_PROMPT = `
You are the Project Agent for Cascade, handling the reactivation phase after a client submits their intake form.

You have one tool: flagProjectRisk.

YOUR PROCESS:

Step 1: Read the intake answers and the existing project risks carefully.

Step 2: Identify any NEW risks revealed by the intake answers that were NOT known at project start.

  Examples of new risks to flag:
  - Client revealed they need a third-party integration that wasn't in the original brief
  - Timeline is now in conflict with something the client mentioned
  - Technical constraint revealed (legacy system, unusual infrastructure)
  - Scope is larger than initially understood
  - Budget or resourcing concern emerged from the answers

Step 3: For each new risk, call flagProjectRisk.
  If the answers reveal no new risks beyond what was already flagged, call nothing — you are done.

CRITICAL RULES:
- Do NOT duplicate risks that are already flagged in the existing risks list.
- Only flag genuine risks based on what the client actually said in their answers.
- If there are no new risks, your tool calls are zero. That is fine.
- Severity: high = blocks the project, medium = needs attention, low = worth noting.
`

export async function runReactivationAgents(
  projectId: string,
  answers: Record<string, string>,
  emit: (event: AgentEvent) => void = () => {},
): Promise<void> {
  const project = await prisma.project.findUniqueOrThrow({
    where:   { id: projectId },
    include: {
      intakeForm: true,
      risks:      { orderBy: { createdAt: 'asc' } },
      user:       true,
    },
  })

  type IntakeQuestion = { id: string; question: string }
  const questions = (project.intakeForm?.questions as IntakeQuestion[] | null) ?? []

  // Format intake Q&A as readable context
  const qaContext = questions
    .map(q => {
      const answer = answers[q.id] ?? '(no answer)'
      return `Q: ${q.question}\nA: ${answer}`
    })
    .join('\n\n')

  const existingRisks = project.risks.map(r => `[${r.severity.toUpperCase()}] ${r.description}`).join('\n')

  emit({ type: 'parallel_start', agent: 'reactivation', message: 'Running reactivation agents in parallel' })

  await Promise.all([
    runReactivationCommsAgent(project, qaContext, emit),
    runReactivationProjectAgent(project, qaContext, existingRisks, emit),
  ])

  emit({ type: 'done', agent: 'reactivation', message: '✓ Reactivation complete', projectId })
}

async function runReactivationCommsAgent(
  project: Awaited<ReturnType<typeof prisma.project.findUniqueOrThrow>> & {
    user: { email: string; name: string }
  },
  qaContext: string,
  emit: (event: AgentEvent) => void,
): Promise<void> {
  const projectId = project.id

  emit({ type: 'agent', agent: 'reactivation', message: '' })

  const messages: Content[] = [
    {
      role: 'user',
      parts: [{
        text: `Handle post-intake-submission communication for this project:\n\n${JSON.stringify({
          projectId:   project.id,
          clientName:  project.clientName,
          clientEmail: project.clientEmail,
          projectName: project.name,
          brief:       project.brief,
        }, null, 2)}\n\nINTAKE ANSWERS:\n${qaContext}`,
      }],
    },
  ]

  let steps = 0
  let response = await ai.models.generateContent({
    model:    'gemini-2.5-flash',
    contents: messages,
    config:   { tools: [reactivationCommsTools], systemInstruction: REACTIVATION_COMMS_PROMPT },
  })

  while (response.functionCalls?.length && steps < MAX_STEPS) {
    const calls = response.functionCalls as FunctionCall[]
    const modelParts = calls.map(c => ({ functionCall: c }))
    const responseParts: Array<{ functionResponse: { name: string; response: Record<string, unknown> } }> = []

    for (const call of calls) {
      if (steps >= MAX_STEPS) break
      steps++
      const toolName = call.name!
      const toolArgs = (call.args ?? {}) as Record<string, unknown>

      emit({ type: 'step', agent: 'reactivation', message: `→ ${toolName}...` })
      const result = await executeReactivationCommsTool(toolName, toolArgs, projectId, project.clientEmail, project.user, emit)
      responseParts.push({ functionResponse: { name: toolName, response: result } })
    }

    messages.push(
      { role: 'model', parts: modelParts },
      { role: 'user',  parts: responseParts },
    )

    response = await ai.models.generateContent({
      model:    'gemini-2.5-flash',
      contents: messages,
      config:   { tools: [reactivationCommsTools], systemInstruction: REACTIVATION_COMMS_PROMPT },
    })
  }
}

async function executeReactivationCommsTool(
  toolName: string,
  args: Record<string, unknown>,
  projectId: string,
  clientEmail: string,
  pmUser: { email: string; name: string },
  emit: (event: AgentEvent) => void,
): Promise<Record<string, unknown>> {
  switch (toolName) {

    case 'saveEmail': {
      const subject = args.subject as string
      const content = args.content as string

      const emailRecord = await prisma.projectEmail.create({
        data: {
          projectId,
          type:      'CONFIRMATION',
          subject,
          content,
          recipient: clientEmail,
          status:    'DRAFT',
        },
      })

      try {
        await sendEmail({ to: clientEmail, subject, html: content.replace(/\n/g, '<br>') })
        await prisma.projectEmail.update({
          where: { id: emailRecord.id },
          data:  { status: 'SENT', sentAt: new Date() },
        })
        emit({ type: 'email_sent', agent: 'reactivation', message: `✓ Confirmation email sent to ${clientEmail}` })
      } catch {
        emit({ type: 'warning', agent: 'reactivation', message: '⚠ Confirmation email saved as draft — delivery failed. PM can send from project page.' })
      }

      return { success: true, instruction: 'Confirmation email handled. If the answers revealed issues requiring a meeting, call requestMeeting next. Otherwise you are done.' }
    }

    case 'requestMeeting': {
      const reason          = args.reason          as string
      const suggestedTopics = args.suggestedTopics as string[]
      const draftEmail      = args.draftEmail      as string

      await prisma.meetingRequest.create({
        data: { projectId, reason, suggestedTopics, draftEmail, status: 'PENDING_REVIEW' },
      })

      // Notify the PM
      await sendEmail({
        to:      pmUser.email,
        subject: `Meeting requested — ${reason.slice(0, 60)}`,
        html: `
<p>Hi ${pmUser.name},</p>
<p>Based on the client's intake form submission, a meeting has been flagged as needed:</p>
<p><strong>Reason:</strong> ${reason}</p>
<p><strong>Topics:</strong></p>
<ul>${suggestedTopics.map(t => `<li>${t}</li>`).join('')}</ul>
<p>A draft email to the client is ready for your review in Cascade.</p>`,
      }).catch(() => { /* non-critical — PM will see it in the UI */ })

      emit({ type: 'meeting_requested', agent: 'reactivation', message: 'Meeting request created — pending PM review' })
      return { success: true, instruction: 'Meeting request created. PM will review and send. You are done.' }
    }

    default:
      return { error: `Unknown tool: ${toolName}` }
  }
}

async function runReactivationProjectAgent(
  project: { id: string; name: string; clientName: string; brief: string },
  qaContext: string,
  existingRisks: string,
  emit: (event: AgentEvent) => void,
): Promise<void> {
  const projectId = project.id

  const messages: Content[] = [
    {
      role: 'user',
      parts: [{
        text: `Review intake answers for new project risks:\n\n${JSON.stringify({
          projectName: project.name,
          clientName:  project.clientName,
          brief:       project.brief,
        }, null, 2)}\n\nEXISTING RISKS ALREADY FLAGGED:\n${existingRisks || '(none)'}\n\nINTAKE ANSWERS:\n${qaContext}`,
      }],
    },
  ]

  let steps = 0
  let response = await ai.models.generateContent({
    model:    'gemini-2.5-flash',
    contents: messages,
    config:   { tools: [reactivationProjectTools], systemInstruction: REACTIVATION_PROJECT_PROMPT },
  })

  while (response.functionCalls?.length && steps < MAX_STEPS) {
    const calls = response.functionCalls as FunctionCall[]
    const modelParts = calls.map(c => ({ functionCall: c }))
    const responseParts: Array<{ functionResponse: { name: string; response: Record<string, unknown> } }> = []

    for (const call of calls) {
      if (steps >= MAX_STEPS) break
      steps++
      const toolName = call.name!
      const toolArgs = (call.args ?? {}) as Record<string, unknown>

      emit({ type: 'step', agent: 'project', message: `→ ${toolName}...` })
      const result = await executeReactivationProjectTool(toolName, toolArgs, projectId, emit)
      responseParts.push({ functionResponse: { name: toolName, response: result } })
    }

    messages.push(
      { role: 'model', parts: modelParts },
      { role: 'user',  parts: responseParts },
    )

    response = await ai.models.generateContent({
      model:    'gemini-2.5-flash',
      contents: messages,
      config:   { tools: [reactivationProjectTools], systemInstruction: REACTIVATION_PROJECT_PROMPT },
    })
  }
}

async function executeReactivationProjectTool(
  toolName: string,
  args: Record<string, unknown>,
  projectId: string,
  emit: (event: AgentEvent) => void,
): Promise<Record<string, unknown>> {
  switch (toolName) {

    case 'flagProjectRisk': {
      const risk     = args.risk     as string
      const severity = args.severity as string

      await prisma.projectRisk.create({
        data: { projectId, description: risk, severity },
      })

      emit({ type: 'risk', agent: 'project', message: risk })
      return { success: true, instruction: 'Risk flagged. Continue checking for other new risks, or finish if there are none.' }
    }

    default:
      return { error: `Unknown tool: ${toolName}` }
  }
}
