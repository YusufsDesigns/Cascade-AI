import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { runCommunicationAgent } from '@/lib/agents/communication'
import type { AgentEvent } from '@/lib/tools/deal-tools'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 })

  const { id } = await params

  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
    include: { intakeForm: true },
  })
  if (!project) return new Response('Not found', { status: 404 })

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: AgentEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }

      try {
        // Clear unsent emails so the agent starts clean
        await prisma.projectEmail.deleteMany({
          where: { projectId: id, status: { in: ['DRAFT', 'APPROVED'] } },
        })

        // Reset intake questions so they are regenerated fresh
        if (project.intakeForm) {
          await prisma.intakeForm.update({
            where: { projectId: id },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data: { questions: [] as any },
          })
        }

        emit({ type: 'start', agent: 'system', message: '● Rerunning Communication Agent...' })

        await runCommunicationAgent(
          id,
          project.clientIntelligence ?? '',
          emit,
          async (questions) => {
            // Clarification is not interactive in rerun mode
            emit({ type: 'warning', agent: 'comms', message: '⚠ Clarification skipped in rerun mode' })
            return `Rerun mode — no additional context. Questions asked: ${questions.join('; ')}`
          },
        )

        emit({ type: 'done', agent: 'system', message: '✓ Communication Agent complete', projectId: id })
      } catch (err) {
        emit({
          type: 'error',
          agent: 'system',
          message: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        })
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
