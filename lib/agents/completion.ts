import { GoogleGenAI, type Content, type FunctionCall } from '@google/genai'
import { prisma } from '@/lib/db/prisma'
import { completionTools } from '@/lib/tools/completion-tools'
import { sendEmail } from '@/lib/email/resend'
import type { AgentEvent } from '@/lib/tools/deal-tools'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
const MAX_STEPS = 6

const COMPLETION_SYSTEM_PROMPT = `
You are the Completion Agent for Cascade. All milestones for this project are now marked complete.

Your job is to close the project professionally. You have two tools: generateCompletionSummary, sendCompletionEmail.

YOUR PROCESS:

Step 1: Call generateCompletionSummary.
  Write a comprehensive handoff summary:
  - Each deliverable and confirmation it is complete
  - Key decisions made during the project
  - What the client now has access to or owns
  - Any handoff notes or recommended next steps for the client
  - A warm, professional closing message

Step 2: Call sendCompletionEmail.
  Send the summary to the client.
  Subject should be: "[Project Name] — Project Complete"
  The email is the summary you wrote, formatted as a client-facing email (warm, not bullet-point heavy).

After the email sends, you are done.

CRITICAL RULES:
- Use the client's real name and actual deliverables — no generic copy
- Both tool calls are required, in order
`

export async function runCompletionAgent(
  projectId: string,
  emit: (event: AgentEvent) => void = () => {},
): Promise<void> {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      milestones: { orderBy: [{ phase: 'asc' }, { createdAt: 'asc' }] },
    },
  })

  const milestoneList = project.milestones
    .map(m => `Phase ${m.phase}: ${m.title} — ${m.description}`)
    .join('\n')

  emit({ type: 'agent', agent: 'comms', message: '' })

  const messages: Content[] = [
    {
      role: 'user',
      parts: [{
        text: `Generate project completion summary and send final email:\n\n${JSON.stringify({
          projectName: project.name,
          clientName:  project.clientName,
          clientEmail: project.clientEmail,
          brief:       project.brief,
        }, null, 2)}\n\nCOMPLETED MILESTONES:\n${milestoneList}`,
      }],
    },
  ]

  let steps = 0
  let response = await ai.models.generateContent({
    model:    'gemini-2.5-flash',
    contents: messages,
    config:   { tools: [completionTools], systemInstruction: COMPLETION_SYSTEM_PROMPT },
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

      let result: Record<string, unknown>

      switch (toolName) {
        case 'generateCompletionSummary': {
          const summary = toolArgs.summary as string
          await prisma.project.update({
            where: { id: projectId },
            data:  { completionSummary: summary },
          })
          emit({ type: 'success', agent: 'comms', message: '✓ Completion summary generated' })
          result = { success: true, instruction: 'Summary saved. Now call sendCompletionEmail.' }
          break
        }

        case 'sendCompletionEmail': {
          const subject = toolArgs.subject as string
          const content = toolArgs.content as string

          const emailRecord = await prisma.projectEmail.create({
            data: {
              projectId,
              type:      'COMPLETION',
              subject,
              content,
              recipient: project.clientEmail,
              status:    'DRAFT',
            },
          })

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
            emit({ type: 'email_sent', agent: 'comms', message: `✓ Completion email sent to ${project.clientEmail}` })
          } catch {
            emit({ type: 'warning', agent: 'comms', message: '⚠ Completion email saved as draft — Resend delivery failed. PM can send from project page.' })
          }

          result = { success: true, instruction: 'Email sent. You are done.' }
          break
        }

        default:
          result = { error: `Unknown tool: ${toolName}` }
      }

      responseParts.push({ functionResponse: { name: toolName, response: result } })
    }

    messages.push(
      { role: 'model', parts: modelParts },
      { role: 'user',  parts: responseParts },
    )

    response = await ai.models.generateContent({
      model:    'gemini-2.5-flash',
      contents: messages,
      config:   { tools: [completionTools], systemInstruction: COMPLETION_SYSTEM_PROMPT },
    })
  }
}
