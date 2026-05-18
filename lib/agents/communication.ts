import { GoogleGenAI, type Content, type FunctionCall } from '@google/genai'
import { prisma } from '@/lib/db/prisma'
import { commsTools } from '@/lib/tools/comms-tools'
import { scheduleFollowUpMessage } from '@/lib/scheduler/qstash'
import { sendEmail } from '@/lib/email/resend'
import type { AgentEvent } from '@/lib/tools/deal-tools'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
const MAX_STEPS = 15

const COMMS_SYSTEM_PROMPT = `
You are the Communication Agent for Cascade.
You draft AND SEND all client-facing communications for a new B2B onboarding engagement.
You have been given the full project data AND a client intelligence profile. Read both carefully before drafting anything.

You have four tools: saveEmail, saveIntakeQuestion, requestMoreContext, scheduleFollowUp.

YOUR PROCESS — follow in order:

Step 1: Read the project data and client intelligence. Understand who the client is, what they need, what was promised.
  The client intelligence tells you their industry, tone of voice, and key insights.
  Ask yourself: do I know enough to write credible, personalized emails?
  If a critical detail is missing that would make an email generic or inaccurate, call requestMoreContext first.

Step 2: Draft the WELCOME email — call saveEmail with type WELCOME.
  - Address the client by their actual name.
  - Reference the actual deliverables by name.
  - Use their tone of voice (formal/casual as the intelligence suggests).
  - Mention what happens next: intake form, then a project kickoff once they've responded.
  - Reference something specific from the client intelligence that shows you understand their business.
  - Warm, professional, specific. Not a template. Write as a senior account manager would.
  The email will be SENT immediately via Resend when you call saveEmail. Make it perfect.

Step 3: Create 5-8 intake questions — call saveIntakeQuestion once per question.
  Every question must be specific to THIS client's deliverables and situation.
  Use the client intelligence to make questions even more targeted.
  Think: what does the team need to actually start this project?
  BAD: "What are your goals for this project?"
  GOOD: "For the admin dashboard, will staff only view reports or also upload files? This determines the storage and permissions architecture."

Step 4: Draft the QUESTIONNAIRE email — call saveEmail with type QUESTIONNAIRE.
  Keep it short and friendly. Include the intake form link that was provided to you.
  Reference something specific about why each section matters for their project.

Step 5: Call scheduleFollowUp with 48 hours. This is the final step.

CRITICAL RULES:
- Write like a senior account manager at a premium agency. Not like AI.
- Every email MUST reference something specific to this client. Never generic copy.
- Intake questions must be tailored. If deliverables include a mobile app, ask about platforms. If integrations, ask about existing APIs.
- If you realize mid-drafting you need a detail, call requestMoreContext. Do not produce a weaker email instead.
- Never use placeholders like [Name], [Company], or [Link]. Use the real values or ask for them.
- The intake form URL is provided in your context. Use it exactly as given.
- The client intelligence may include red flags or contract discrepancies. Reference these appropriately — warn the client where relevant.
- You have exactly 3 jobs: welcome email, questionnaire email, schedule follow-up. Do not create any other emails.
`

export interface CommsResult {
  emailCount: number
  questionCount: number
}

export async function runCommunicationAgent(
  projectId: string,
  clientIntelligence: string,
  emit: (event: AgentEvent) => void,
  onClarificationNeeded: (questions: string[]) => Promise<string>,
): Promise<CommsResult> {
  const project = await prisma.project.findUniqueOrThrow({ where: { id: projectId } })

  const intakeForm = await prisma.intakeForm.upsert({
    where:  { projectId },
    create: { projectId, questions: [] },
    update: {},
  })
  const intakeUrl = `${process.env.APP_URL ?? 'http://localhost:3000'}/intake/${projectId}/${intakeForm.token}`

  emit({ type: 'agent', agent: 'comms', message: '' })

  let emailCount = 0
  const questions: Array<{
    id: string
    question: string
    type: string
    options?: string[]
    required: boolean
  }> = []

  async function executeTool(
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    switch (toolName) {

      case 'saveEmail': {
        const type    = args.type    as 'WELCOME' | 'QUESTIONNAIRE' | 'FOLLOWUP'
        const subject = args.subject as string
        const content = args.content as string

        // Always save to DB first so the email appears in the project page
        const emailRecord = await prisma.projectEmail.create({
          data: {
            projectId,
            type,
            subject,
            content,
            recipient: project.clientEmail,
            status:    'DRAFT',
          },
        })
        emailCount++

        // Try to deliver via Resend — failure keeps email as DRAFT for PM to send manually
        try {
          await sendEmail({
            to:   project.clientEmail,
            subject,
            html: content.replace(/\n/g, '<br>'),
          })
          await prisma.projectEmail.update({
            where: { id: emailRecord.id },
            data:  { status: 'SENT', sentAt: new Date() },
          })
          emit({ type: 'email_sent', agent: 'comms', message: `✓ ${type.toLowerCase()} email sent to ${project.clientEmail}` })
        } catch (sendErr) {
          emit({
            type:    'warning',
            agent:   'comms',
            message: `⚠ ${type.toLowerCase()} email saved as draft — Resend delivery failed (${sendErr instanceof Error ? sendErr.message : 'check config'}). PM can send from the project page.`,
          })
        }

        return {
          success: true,
          emailCount,
          instruction: 'Email processed. Continue with the next communication in your process.',
        }
      }

      case 'saveIntakeQuestion': {
        const q = {
          id:       `q_${questions.length + 1}`,
          question: args.question as string,
          type:     args.type     as string,
          options:  args.options  as string[] | undefined,
          required: args.required as boolean,
        }
        questions.push(q)
        emit({
          type: 'step',
          agent: 'comms',
          message: `→ Q${questions.length}: ${q.question.slice(0, 70)}${q.question.length > 70 ? '…' : ''}`,
        })
        return {
          success: true,
          questionCount: questions.length,
          instruction: questions.length < 5
            ? 'Question saved. Add more questions — aim for 5-8 total.'
            : 'Question saved. Continue adding questions or move to drafting the QUESTIONNAIRE email.',
        }
      }

      case 'requestMoreContext': {
        const reason         = args.reason    as string
        const questionsToAsk = args.questions as string[]

        emit({ type: 'clarification', agent: 'comms', message: reason, questions: questionsToAsk })
        const answers = await onClarificationNeeded(questionsToAsk)
        emit({ type: 'step', agent: 'comms', message: '→ Context received. Continuing...' })

        return {
          success: true,
          answers,
          instruction: 'You have received the additional context. Use it to write better communications. Continue your process.',
        }
      }

      case 'scheduleFollowUp': {
        const delayHours  = (args.delayHours as number) || 48
        const scheduledAt = new Date(Date.now() + delayHours * 60 * 60 * 1000)

        const followUp = await prisma.followUp.upsert({
          where:  { projectId },
          create: { projectId, scheduledAt, status: 'SCHEDULED' },
          update: { scheduledAt, status: 'SCHEDULED' },
        })

        const qstashId = await scheduleFollowUpMessage(projectId, delayHours * 3600)
        if (qstashId) {
          await prisma.followUp.update({ where: { id: followUp.id }, data: { qstashId } })
        }

        emit({
          type: 'success',
          agent: 'comms',
          message: `✓ Follow-up scheduled for ${scheduledAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        })
        return { success: true, instruction: 'Follow-up scheduled. Your work is complete.' }
      }

      default:
        return { error: `Unknown tool: ${toolName}` }
    }
  }

  const intelligenceSection = clientIntelligence
    ? `\n\nCLIENT INTELLIGENCE (use this to personalize every email and question):\n${clientIntelligence}`
    : ''

  const messages: Content[] = [
    {
      role: 'user',
      parts: [{
        text: `Draft and SEND all onboarding communications for this project:\n\n${JSON.stringify({
          projectId:     project.id,
          clientName:    project.clientName,
          clientEmail:   project.clientEmail,
          projectName:   project.name,
          brief:         project.brief,
          intakeFormUrl: intakeUrl,
        }, null, 2)}${intelligenceSection}`,
      }],
    },
  ]

  let steps = 0
  let response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: messages,
    config: { tools: [commsTools], systemInstruction: COMMS_SYSTEM_PROMPT },
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

      emit({ type: 'step', agent: 'comms', message: `→ ${toolName}...` })

      const result = await executeTool(toolName, toolArgs)
      responseParts.push({ functionResponse: { name: toolName, response: result } })
    }

    messages.push(
      { role: 'model', parts: modelParts },
      { role: 'user',  parts: responseParts },
    )

    response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: messages,
      config: { tools: [commsTools], systemInstruction: COMMS_SYSTEM_PROMPT },
    })
  }

  if (questions.length > 0) {
    await prisma.intakeForm.update({
      where: { projectId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data:  { questions: questions as any },
    })
    emit({ type: 'success', agent: 'comms', message: `✓ ${questions.length} intake questions saved` })
  }

  return { emailCount, questionCount: questions.length }
}
