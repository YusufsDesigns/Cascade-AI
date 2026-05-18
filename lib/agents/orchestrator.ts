import { GoogleGenAI, type Content, type FunctionCall } from '@google/genai'
import { prisma } from '@/lib/db/prisma'
import { orchestratorTools, type AgentEvent } from '@/lib/tools/deal-tools'
import { runCommunicationAgent } from './communication'
import { runProjectAgent } from './project'
import { runResearchAgent } from './research'
import { awaitClarification, makeClarificationId } from './clarification'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
const MAX_STEPS = 15

const ORCHESTRATOR_SYSTEM_PROMPT = `
You are the Orchestrator Agent for Cascade, an autonomous B2B client onboarding system.
Your job is to read a deal brief, understand it deeply, and coordinate the full onboarding workflow.

You have four tools: extractDealInfo, requestClarification, assessComplexity, delegateToAgents.

YOUR PROCESS — follow in order:

Step 1: Call extractDealInfo immediately. Read every word of the brief carefully before extracting.

Step 2: Think critically about what you extracted:
  - Is the client email actually valid-looking (contains @ and a domain)?
  - Are the deliverables specific enough for a project plan, or just vague buzzwords?
  - Is the timeline realistic for the stated scope?
  - Is anything ambiguous that would cause problems downstream?

Step 3: If isComplete is false, OR if anything critical is ambiguous in ways that would block the sub-agents:
  Call requestClarification with specific, intelligent questions.
  Then continue from Step 2 with the answers you receive.
  Do NOT proceed to delegation if you lack what the sub-agents need.

Step 4: When you have sufficient, unambiguous information: call assessComplexity.
  High complexity: more than 5 deliverables, OR timeline under 6 weeks for complex work, OR significant technical uncertainty.
  Standard: everything else.

Step 5: Call delegateToAgents. Include notes about any risks, timeline concerns, or ambiguities you observed.
  The clientIntelligence field in your context already contains the Research Agent's findings — reference them in your notes.

CRITICAL RULES:
- You are thinking, not running a script. Use judgment at every step.
- If a brief is completely clear and detailed, proceed without requesting clarification.
- Never guess a missing email address. Always ask.
- Never proceed to delegation with missing clientEmail or missing deliverables.
- Your requestClarification questions must be specific:
  BAD: "Can you tell me more?"
  GOOD: "The brief mentions a dashboard — is it for internal staff or external clients? This determines the architecture the Project Agent will plan."
- After delegateToAgents returns, you are done. Return a brief one-sentence summary.
`

export async function runOrchestrator(
  projectId: string,
  brief: string,
  emit: (event: AgentEvent) => void,
  pdfBase64: string | null = null,
  websiteUrl: string | null = null,
): Promise<void> {
  // Run Research Agent first if we have something to research
  let clientIntelligence = ''
  if (pdfBase64 || websiteUrl) {
    emit({ type: 'step', agent: 'orchestrator', message: '→ Research Agent activating...' })
    try {
      const research = await runResearchAgent(projectId, brief, pdfBase64, websiteUrl, emit)
      clientIntelligence = research.clientIntelligence

      if (research.discrepancies.length > 0) {
        emit({
          type: 'warning',
          agent: 'orchestrator',
          message: `⚠ Contract discrepancies found: ${research.discrepancies.length}`,
        })
      }
    } catch (err) {
      emit({ type: 'step', agent: 'orchestrator', message: '→ Research Agent encountered an error — continuing without intelligence' })
      console.error('Research Agent error:', err)
    }
  }

  emit({ type: 'agent', agent: 'orchestrator', message: '' })

  const intelligenceContext = clientIntelligence
    ? `\n\nCLIENT INTELLIGENCE (from Research Agent):\n${clientIntelligence}`
    : ''

  const messages: Content[] = [
    {
      role: 'user',
      parts: [{
        text: `Deal brief to process:\n\n${brief}${intelligenceContext}`,
      }],
    },
  ]

  let steps = 0

  let response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: messages,
    config: { tools: [orchestratorTools], systemInstruction: ORCHESTRATOR_SYSTEM_PROMPT },
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

      emit({ type: 'step', agent: 'orchestrator', message: `→ ${toolName}...` })

      const result = await executeOrchestratorTool(
        toolName, toolArgs, projectId, clientIntelligence, emit,
      )
      responseParts.push({ functionResponse: { name: toolName, response: result } })
    }

    messages.push(
      { role: 'model', parts: modelParts },
      { role: 'user',  parts: responseParts },
    )

    response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: messages,
      config: { tools: [orchestratorTools], systemInstruction: ORCHESTRATOR_SYSTEM_PROMPT },
    })
  }

  emit({
    type: 'done',
    agent: 'system',
    message: response.text ?? '✓ Cascade complete',
    projectId,
  })
}

async function executeOrchestratorTool(
  name: string,
  args: Record<string, unknown>,
  projectId: string,
  clientIntelligence: string,
  emit: (event: AgentEvent) => void,
): Promise<Record<string, unknown>> {
  switch (name) {

    case 'extractDealInfo': {
      const clientName    = (args.clientName    as string) || 'Unknown'
      const clientEmail   = (args.clientEmail   as string) || ''
      const deliverables  = (args.deliverables  as string[]) ?? []
      const timelineWeeks = (args.timelineWeeks as number)  ?? 0
      const isComplete    = args.isComplete as boolean
      const missingFields = (args.missingFields as string[]) ?? []

      await prisma.project.update({
        where: { id: projectId },
        data: {
          name: `${clientName} Onboarding`,
          clientName,
          clientEmail: clientEmail || 'pending@pending.com',
        },
      })

      if (isComplete) {
        emit({ type: 'success', agent: 'orchestrator', message: `✓ Identified: ${clientName} · ${timelineWeeks}w · ${deliverables.length} deliverable${deliverables.length !== 1 ? 's' : ''}` })
        emit({ type: 'success', agent: 'orchestrator', message: `✓ Contact: ${clientEmail}` })
        emit({ type: 'success', agent: 'orchestrator', message: '✓ All required information present' })
        return {
          success: true,
          isComplete: true,
          clientName,
          clientEmail,
          deliverables,
          timelineWeeks,
          instruction: 'Information is complete. Call assessComplexity next.',
        }
      } else {
        emit({ type: 'warning', agent: 'orchestrator', message: `⚠ Missing: ${missingFields.join(', ')}` })
        return {
          success: true,
          isComplete: false,
          missingFields,
          instruction: `Critical information is missing: ${missingFields.join(', ')}. Call requestClarification with specific questions about these fields.`,
        }
      }
    }

    case 'requestClarification': {
      const reason    = args.reason    as string
      const questions = args.questions as string[]
      const id        = makeClarificationId(projectId, 'orchestrator')

      emit({ type: 'clarification', agent: 'orchestrator', message: reason, questions, clarificationId: id })
      const answers = await awaitClarification(id)
      emit({ type: 'step', agent: 'orchestrator', message: '→ Context received. Continuing...' })

      return {
        success: true,
        answers,
        instruction: 'You have received the account manager\'s answers. Use this information to continue. Re-call extractDealInfo if the answers filled missing fields, or proceed to assessComplexity if you now have everything.',
      }
    }

    case 'assessComplexity': {
      const complexity = args.complexity as string
      const reasoning  = args.reasoning  as string
      emit({ type: 'success', agent: 'orchestrator', message: `✓ Complexity: ${complexity} — ${reasoning}` })
      return {
        success: true,
        complexity,
        instruction: 'Complexity assessed. Call delegateToAgents now.',
      }
    }

    case 'delegateToAgents': {
      emit({ type: 'delegate', agent: 'orchestrator', message: '◈ Delegating to Communication and Project agents...' })

      const makeClarificationHandler = (agent: string) =>
        async (questions: string[]): Promise<string> => {
          const id = makeClarificationId(projectId, agent)
          emit({
            type: 'clarification',
            agent: agent as AgentEvent['agent'],
            message: `${agent === 'comms' ? 'Communication' : 'Project'} Agent needs more context:`,
            questions,
            clarificationId: id,
          })
          return awaitClarification(id)
        }

      const [commsResult, projectResult] = await Promise.all([
        runCommunicationAgent(projectId, clientIntelligence, emit, makeClarificationHandler('comms')),
        runProjectAgent(projectId, clientIntelligence, emit, makeClarificationHandler('project')),
      ])

      await prisma.project.update({
        where: { id: projectId },
        data:  { status: 'ONBOARDING' },
      })

      return {
        success:           true,
        emailsSent:        commsResult.emailCount,
        questionsCreated:  commsResult.questionCount,
        milestonesCreated: projectResult.milestoneCount,
        risksFound:        projectResult.riskCount,
        instruction:       'Both agents have completed. Your work is done. Return a brief summary sentence.',
      }
    }

    default:
      return { error: `Unknown tool: ${name}`, instruction: 'This tool does not exist. Continue with a valid tool.' }
  }
}
