import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { createEventLogger } from '@/lib/agents/event-logger'
import { runCompletionAgent } from '@/lib/agents/completion'
import type { AgentEvent } from '@/lib/tools/deal-tools'

const STATUS_MAP: Record<string, 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'> = {
  not_started: 'PENDING',
  in_progress: 'IN_PROGRESS',
  completed:   'COMPLETED',
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 })

  const { id: milestoneId } = await params
  const { status: rawStatus } = await req.json() as { status: string }

  const dbStatus = STATUS_MAP[rawStatus]
  if (!dbStatus) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  // Verify ownership via project
  const milestone = await prisma.milestone.findFirst({
    where: { id: milestoneId, project: { userId: session.user.id } },
    include: { project: true },
  })
  if (!milestone) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.milestone.update({
    where: { id: milestoneId },
    data:  { status: dbStatus },
  })

  // Check if all milestones are now completed
  if (dbStatus === 'COMPLETED') {
    const allMilestones = await prisma.milestone.findMany({
      where: { projectId: milestone.projectId },
    })
    const allComplete = allMilestones.every(m =>
      m.id === milestoneId ? true : m.status === 'COMPLETED'
    )

    if (allComplete && allMilestones.length > 0) {
      // Trigger completion agent
      await prisma.project.update({
        where: { id: milestone.projectId },
        data:  { agentStatus: 'running' },
      })

      const logEvent = createEventLogger(milestone.projectId, 'completion')
      await logEvent({
        type:    'start',
        agent:   'system',
        message: '● All milestones complete — generating project completion summary...',
      })

      const emit = (event: AgentEvent) => { logEvent(event).catch(console.error) }

      void (async () => {
        try {
          await runCompletionAgent(milestone.projectId, emit)
          await prisma.project.update({
            where: { id: milestone.projectId },
            data:  { agentStatus: 'completed', status: 'COMPLETED' },
          })
        } catch (error) {
          console.error('[milestone-status] Completion agent failed:', error)
          await prisma.project.update({
            where: { id: milestone.projectId },
            data:  { agentStatus: 'failed' },
          })
        }
      })()

      return NextResponse.json({ status: dbStatus, completionTriggered: true })
    }
  }

  return NextResponse.json({ status: dbStatus, completionTriggered: false })
}
