import { GoogleGenAI, type Content, type FunctionCall } from '@google/genai'
import { prisma } from '@/lib/db/prisma'
import { finalizationCommsTools, finalizationProjectTools } from '@/lib/tools/finalization-tools'
import { createEventLogger } from '@/lib/agents/event-logger'
import type { AgentEvent } from '@/lib/tools/deal-tools'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
const MAX_STEPS = 10

const FINALIZATION_COMMS_PROMPT = `
You are the Communication Agent for Cascade, handling the post-meeting finalization phase.

You have the complete context of a client project including the original brief, intake responses, and meeting outcome notes.

Your job: call saveEmail once to draft a post-meeting summary email for the client.

The email should:
- Thank them for the meeting
- Summarise what was confirmed and any changes made to the project plan
- State the finalised timeline clearly
- Confirm the next step (start of work, or kickoff date if mentioned)
- Be warm, professional, and specific

This email is saved as DRAFT for PM review before sending.

After saving the email, you are done.

CRITICAL RULES:
- Call saveEmail exactly ONCE
- Reference specific details from the meeting notes — not generic copy
- Never use placeholders
`

const FINALIZATION_PROJECT_PROMPT = `
You are the Project Agent for Cascade, handling the post-meeting finalization phase.

You have the complete context of a client project including original brief, intake responses, and meeting outcome notes.

YOUR PROCESS:

Step 1: Review the existing milestones carefully. Compare them against the meeting notes.
  Ask: did anything change that should update a milestone? Did the client reveal new timeline constraints,
  technical requirements, or scope changes?

Step 2: For each milestone that needs updating based on the meeting notes, call updateMilestone.
  Only update milestones where something genuinely changed. Do not update milestones needlessly.

Step 3: If the meeting revealed any new project-level risks, call flagRisk.
  Do not duplicate risks from before the meeting.

Step 4: Call finalizeProjectPlan. This is always the last step.

CRITICAL RULES:
- If nothing needs updating, call finalizeProjectPlan directly with a summary saying the plan is already accurate
- Only flag genuinely new risks
- finalizeProjectPlan is mandatory — always call it last
`

export async function runFinalizationAgents(
  projectId: string,
  meetingNotes: string,
  emit: (event: AgentEvent) => void = () => {},
): Promise<void> {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      intakeForm: true,
      milestones: { orderBy: [{ phase: 'asc' }, { createdAt: 'asc' }] },
      risks:      { orderBy: { createdAt: 'asc' } },
    },
  })

  // Format intake Q&A
  type IntakeQuestion = { id: string; question: string }
  const questions = (project.intakeForm?.questions as IntakeQuestion[] | null) ?? []
  const rawAnswers = (project.intakeForm?.answers ?? {}) as Record<string, string>
  const qaContext = questions
    .map(q => `Q: ${q.question}\nA: ${rawAnswers[q.id] ?? '(no answer)'}`)
    .join('\n\n')

  const existingMilestones = project.milestones
    .map(m => `[ID: ${m.id}] Phase ${m.phase}: ${m.title} — ${m.description}`)
    .join('\n')

  const existingRisks = project.risks
    .map(r => `[${r.severity.toUpperCase()}] ${r.description}`)
    .join('\n')

  const fullContext = `
ORIGINAL BRIEF:
${project.brief}

CONTRACT SUMMARY:
${project.contractSummary ?? 'No contract uploaded'}

CLIENT INTAKE RESPONSES:
${qaContext || '(no intake responses)'}

MEETING OUTCOME:
${meetingNotes}

EXISTING MILESTONES:
${existingMilestones || '(none)'}

EXISTING RISKS ALREADY FLAGGED:
${existingRisks || '(none)'}
`

  emit({ type: 'start', agent: 'system', message: '● Finalization agents starting...' })

  await Promise.all([
    runFinalizationCommsAgent(projectId, project.clientName, project.clientEmail, fullContext, emit),
    runFinalizationProjectAgent(projectId, project.milestones, fullContext, emit),
  ])

  emit({ type: 'done', agent: 'system', message: '✓ Post-meeting finalization complete', projectId })
}

async function runFinalizationCommsAgent(
  projectId: string,
  clientName: string,
  clientEmail: string,
  fullContext: string,
  emit: (event: AgentEvent) => void,
): Promise<void> {
  emit({ type: 'agent', agent: 'comms', message: '' })

  const messages: Content[] = [
    {
      role: 'user',
      parts: [{ text: `Draft a post-meeting summary email for this project:\n\nCLIENT: ${clientName} (${clientEmail})\n\n${fullContext}` }],
    },
  ]

  let steps = 0
  let response = await ai.models.generateContent({
    model:    'gemini-2.5-flash',
    contents: messages,
    config:   { tools: [finalizationCommsTools], systemInstruction: FINALIZATION_COMMS_PROMPT },
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
      if (toolName === 'saveEmail') {
        const subject = toolArgs.subject as string
        const content = toolArgs.content as string

        await prisma.projectEmail.create({
          data: {
            projectId,
            type:      'FINALIZATION',
            subject,
            content,
            recipient: clientEmail,
            status:    'DRAFT',
          },
        })

        emit({ type: 'success', agent: 'comms', message: `✓ Finalization summary email saved as draft` })
        result = { success: true, instruction: 'Email saved. You are done.' }
      } else {
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
      config:   { tools: [finalizationCommsTools], systemInstruction: FINALIZATION_COMMS_PROMPT },
    })
  }
}

type MilestoneData = {
  id: string
  phase: number
  title: string
  description: string
  ownerRole: string
}

async function runFinalizationProjectAgent(
  projectId: string,
  milestones: MilestoneData[],
  fullContext: string,
  emit: (event: AgentEvent) => void,
): Promise<void> {
  emit({ type: 'agent', agent: 'project', message: '' })

  const messages: Content[] = [
    {
      role: 'user',
      parts: [{ text: `Review and finalize project milestones based on meeting outcome:\n\n${fullContext}` }],
    },
  ]

  let steps = 0
  let response = await ai.models.generateContent({
    model:    'gemini-2.5-flash',
    contents: messages,
    config:   { tools: [finalizationProjectTools], systemInstruction: FINALIZATION_PROJECT_PROMPT },
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

      let result: Record<string, unknown>

      switch (toolName) {
        case 'updateMilestone': {
          const milestoneId = toolArgs.milestoneId as string
          const ms = milestones.find(m => m.id === milestoneId)
          if (!ms) {
            result = { error: `Milestone ${milestoneId} not found` }
            break
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const updateData: Record<string, any> = {}
          if (toolArgs.title)          updateData.title          = toolArgs.title
          if (toolArgs.description)    updateData.description    = toolArgs.description
          if (toolArgs.ownerRole)      updateData.ownerRole      = toolArgs.ownerRole
          if (toolArgs.requiresClient !== undefined) updateData.requiresClient = toolArgs.requiresClient
          if (toolArgs.riskNote)       updateData.riskNote       = toolArgs.riskNote

          if (Object.keys(updateData).length > 0) {
            await prisma.milestone.update({ where: { id: milestoneId }, data: updateData })
            emit({ type: 'milestone_saved', agent: 'project', message: `✓ Updated: ${ms.title}` })
          }
          result = { success: true, instruction: 'Milestone updated. Continue reviewing others or call finalizeProjectPlan.' }
          break
        }

        case 'flagRisk': {
          const risk     = toolArgs.risk     as string
          const severity = toolArgs.severity as string
          await prisma.projectRisk.create({
            data: { projectId, description: risk, severity },
          })
          emit({ type: 'risk', agent: 'project', message: risk })
          result = { success: true, instruction: 'Risk flagged. Continue or call finalizeProjectPlan.' }
          break
        }

        case 'finalizeProjectPlan': {
          emit({ type: 'success', agent: 'project', message: `✓ Project plan finalized — ${toolArgs.summary as string}` })
          result = { success: true, instruction: 'Done.' }
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
      config:   { tools: [finalizationProjectTools], systemInstruction: FINALIZATION_PROJECT_PROMPT },
    })
  }
}
