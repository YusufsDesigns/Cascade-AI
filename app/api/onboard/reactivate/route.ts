import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { runCommunicationAgent } from '@/lib/agents/communication'
import { runProjectAgent } from '@/lib/agents/project'
import type { AgentEvent } from '@/lib/tools/deal-tools'

export async function POST(req: Request) {
  const { projectId } = await req.json() as { projectId: string }

  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 })
  }

  const project = await prisma.project.findUnique({
    where:   { id: projectId },
    include: { intakeForm: true },
  })

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const intakeAnswers = project.intakeForm?.answers
    ? JSON.stringify(project.intakeForm.answers, null, 2)
    : ''

  const clientIntelligence = project.clientIntelligence ?? ''

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: AgentEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }

      try {
        emit({ type: 'start', message: '● Re-activating agents from intake submission...' })

        // Build enriched context including intake answers
        const enrichedIntelligence = clientIntelligence
          ? `${clientIntelligence}\n\nINTAKE FORM RESPONSES:\n${intakeAnswers}`
          : `INTAKE FORM RESPONSES:\n${intakeAnswers}`

        // Run both agents in parallel with intake context
        const [commsResult, projectResult] = await Promise.all([
          runCommunicationAgent(
            projectId,
            enrichedIntelligence,
            emit,
            async () => '', // no clarification during reactivation
          ),
          runProjectAgent(
            projectId,
            enrichedIntelligence,
            emit,
            async () => '', // no clarification during reactivation
          ),
        ])

        // Cancel any pending follow-up since intake was submitted
        const followUp = await prisma.followUp.findUnique({ where: { projectId } })
        if (followUp && followUp.status === 'SCHEDULED' && followUp.qstashId) {
          try {
            const { cancelQStashMessage } = await import('@/lib/scheduler/qstash')
            await cancelQStashMessage(followUp.qstashId)
          } catch { /* ignore */ }
          await prisma.followUp.update({
            where: { id: followUp.id },
            data:  { status: 'CANCELLED' },
          })
        }

        await prisma.project.update({
          where: { id: projectId },
          data:  { status: 'ACTIVE' },
        })

        emit({
          type: 'done',
          agent: 'system',
          message: `✓ Re-activation complete · ${commsResult.emailCount} emails · ${projectResult.milestoneCount} milestones updated`,
          projectId,
        })
      } catch (err) {
        emit({ type: 'error', message: `Re-activation failed: ${err instanceof Error ? err.message : 'Unknown error'}` })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
