import { GoogleGenAI, type Content, type FunctionCall } from '@google/genai'
import { prisma } from '@/lib/db/prisma'
import { projectTools } from '@/lib/tools/project-tools'
import type { AgentEvent } from '@/lib/tools/deal-tools'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
const MAX_STEPS = 15

const PROJECT_SYSTEM_PROMPT = `
You are the Project Agent for Cascade.
You create detailed, realistic project plans from deal information.
You have been given the full project data AND client intelligence from the Research Agent.
Use both to create a plan that is specific, realistic, and accounts for what the Research Agent discovered.

You have three tools: saveMilestone, requestMoreContext, flagProjectRisk.

YOUR PROCESS — follow in order:

Step 1: Read all deliverables carefully. Think about what each one actually requires to build.
  - What are the dependencies between deliverables?
  - What must be designed before it can be built?
  - What requires client input before the team can start?
  - Is the timeline realistic for the scope?
  - What did the Research Agent flag as red flags or contract discrepancies?
    → These may create additional milestones or change timeline estimates.

Step 2: If ANY deliverable is too vague to confidently plan, call requestMoreContext.
  BAD: Creating a vague milestone like "Development Phase" for an unclear deliverable.
  GOOD: Asking "The brief mentions a reporting dashboard — what data sources does it pull from? This determines Phase 2 entirely."

Step 3: Create milestones using saveMilestone — one call per milestone.
  Structure them phase by phase:
  Phase 1: Discovery & Requirements (pm)
  Phase 2: Design / UX (designer)
  Phase 3: Development (developer) — can have multiple milestones
  Phase 4: Integration / QA (qa or developer)
  Phase 5: Launch / Handover (pm)

  Adapt phases to what the project actually needs. Not every project needs all phases.
  Each milestone must have a SPECIFIC title, clear description, correct owner role,
  a realistic due week within the stated timeline, and requiresClient set accurately.

Step 4: Use flagProjectRisk for project-level risks:
  - Timeline too tight for the scope
  - Scope creep potential
  - Missing information that will block the project later
  - Technical complexity not reflected in the quoted timeline
  - Critical client dependencies that could stall the project
  - Contract discrepancies that affect scope (from Research Agent)

After flagProjectRisk (or after your final saveMilestone if no risks), you are done.

CRITICAL RULES:
- Milestones must be realistic. Never compress 12 weeks of work into 4.
- DEPENDENCIES MATTER. Design cannot start before discovery sign-off. Development cannot start before design approval.
- requiresClient must be TRUE for every milestone where work literally cannot proceed without client input, assets, credentials, or sign-off.
- Your risk flags are valuable — judges want to see an agent that thinks independently about project risk.
- If the client intelligence contains red flags, create corresponding risks.
- If the timeline is genuinely too short for the scope, create a flagProjectRisk with severity "high". Do not silently create an impossible plan.
- Owner roles must be exact: pm | designer | developer | qa
- Due weeks must fit within the project timeline. Do not exceed the stated total weeks.
- DO NOT create milestones for "initial meetings", "kickoff calls", or "client discovery calls". The intake form handles information gathering. A meeting is only requested by the system AFTER the client submits their intake form if issues are found. Start Phase 1 with Discovery & Requirements work, not a meeting.

OWNER ROLE RULES (mandatory):
Every milestone MUST have an ownerRole assigned. Never omit it.
Choose based on what the milestone actually involves:
- Planning, communication, client coordination, requirements gathering → pm
- UI design, mockups, wireframes, brand work, visual identity → designer
- Code, backend logic, integrations, APIs, infrastructure, build → developer
- Testing, QA, review cycles, bug verification, UAT → qa
If in doubt: use pm for discovery/launch phases, developer for build phases.
`

export interface ProjectResult {
  milestoneCount: number
  riskCount: number
}

export async function runProjectAgent(
  projectId: string,
  clientIntelligence: string,
  emit: (event: AgentEvent) => void,
  onClarificationNeeded: (questions: string[]) => Promise<string>,
): Promise<ProjectResult> {
  const project = await prisma.project.findUniqueOrThrow({ where: { id: projectId } })

  emit({ type: 'agent', agent: 'project', message: '' })

  let milestoneCount = 0
  let riskCount = 0

  async function executeTool(
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    switch (toolName) {

      case 'saveMilestone': {
        // Validate required fields before hitting the DB
        const missing = (['title', 'description', 'phase', 'ownerRole', 'dueWeek'] as const)
          .filter(f => args[f] === undefined || args[f] === null || args[f] === '')
        if (missing.length > 0) {
          return {
            error: `saveMilestone called with missing required fields: ${missing.join(', ')}. You MUST include all required fields. Retry this milestone with all fields present.`,
          }
        }

        const dueWeek = (args.dueWeek as number) ?? 1
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + dueWeek * 7)

        // Resolve ownerRole → actual TeamMember
        const teamMember = await prisma.teamMember.findFirst({
          where: { userId: project.userId, role: args.ownerRole as string },
        })

        if (!teamMember) {
          emit({
            type: 'warning',
            agent: 'project',
            message: `⚠ No ${args.ownerRole} found in team settings — milestone needs manual assignment`,
          })
        }

        await prisma.milestone.create({
          data: {
            projectId,
            phase:          args.phase          as number,
            title:          args.title          as string,
            description:    args.description    as string,
            ownerRole:      args.ownerRole      as string,
            ownerName:      teamMember?.name    ?? null,
            ownerEmail:     teamMember?.email   ?? null,
            dueDate,
            requiresClient: args.requiresClient as boolean,
            riskNote:       (args.riskNote as string | undefined) || null,
            status:         'PENDING',
          },
        })
        milestoneCount++

        const ownerSuffix = teamMember ? ` → ${teamMember.name}` : ' → unassigned'
        const riskSuffix  = args.riskNote ? ` ⚠ ${(args.riskNote as string).slice(0, 50)}` : ''
        emit({
          type: 'milestone_saved',
          agent: 'project',
          message: `Phase ${args.phase}: ${args.title}${ownerSuffix}${riskSuffix}`,
        })

        return {
          success: true,
          milestoneCount,
          instruction: 'Milestone saved. Continue creating the next milestone, or call flagProjectRisk for any project-level risks, or finish if the plan is complete.',
        }
      }

      case 'requestMoreContext': {
        const reason         = args.reason    as string
        const questionsToAsk = args.questions as string[]

        emit({ type: 'clarification', agent: 'project', message: reason, questions: questionsToAsk })
        const answers = await onClarificationNeeded(questionsToAsk)
        emit({ type: 'step', agent: 'project', message: '→ Context received. Continuing...' })

        return {
          success: true,
          answers,
          instruction: 'You have received the additional context. Use it to create accurate milestones. Continue your process.',
        }
      }

      case 'flagProjectRisk': {
        const risk           = args.risk           as string
        const recommendation = args.recommendation as string
        const severity       = args.severity       as string

        // Save to ProjectRisk table
        await prisma.projectRisk.create({
          data: {
            projectId,
            description: risk,
            severity,
          },
        })
        riskCount++

        emit({
          type: 'warning',
          agent: 'project',
          message: `⚠ ${severity.toUpperCase()}: ${risk} — ${recommendation}`,
        })

        return {
          success: true,
          riskCount,
          instruction: 'Risk flagged and saved. Continue creating milestones or finish if the plan is complete.',
        }
      }

      default:
        return { error: `Unknown tool: ${toolName}` }
    }
  }

  const intelligenceSection = clientIntelligence
    ? `\n\nCLIENT INTELLIGENCE (factor this into your risk assessment and milestone planning):\n${clientIntelligence}`
    : ''

  const messages: Content[] = [
    {
      role: 'user',
      parts: [{
        text: `Create a detailed project plan for this onboarding:\n\n${JSON.stringify({
          projectId:   project.id,
          clientName:  project.clientName,
          projectName: project.name,
          brief:       project.brief,
        }, null, 2)}${intelligenceSection}`,
      }],
    },
  ]

  let steps = 0
  let response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: messages,
    config: { tools: [projectTools], systemInstruction: PROJECT_SYSTEM_PROMPT },
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
      config: { tools: [projectTools], systemInstruction: PROJECT_SYSTEM_PROMPT },
    })
  }

  emit({ type: 'success', agent: 'project', message: `✓ ${milestoneCount} milestones · ${riskCount} risks flagged` })

  return { milestoneCount, riskCount }
}
