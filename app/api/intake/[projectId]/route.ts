import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { cancelQStashMessage } from '@/lib/scheduler/qstash'
import { runReactivationAgents } from '@/lib/agents/reactivation'
import { createEventLogger } from '@/lib/agents/event-logger'
import type { AgentEvent } from '@/lib/tools/deal-tools'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params
  const form = await prisma.intakeForm.findUnique({
    where:   { projectId },
    include: { project: { select: { clientName: true } } },
  })

  if (!form) {
    return NextResponse.json({ error: 'Intake form not found' }, { status: 404 })
  }

  return NextResponse.json({
    questions:   form.questions,
    submittedAt: form.submittedAt,
    clientName:  form.project.clientName,
  })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params
  const { answers, token } = await req.json() as {
    answers: Record<string, string>
    token: string
  }

  // 1. Verify token
  const form = await prisma.intakeForm.findFirst({
    where: { projectId, token },
  })

  if (!form) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  }

  if (form.submittedAt) {
    return NextResponse.json({ error: 'Already submitted' }, { status: 409 })
  }

  // 2+3. Save answers and mark submitted
  await prisma.intakeForm.update({
    where: { id: form.id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data:  { answers: answers as any, submittedAt: new Date() },
  })

  // 4. Set Project.status = 'ACTIVE', agentStatus = 'running'
  await prisma.project.update({
    where: { id: projectId },
    data:  { status: 'ACTIVE', agentStatus: 'running' },
  })

  // 5. Cancel any SCHEDULED follow-up
  const followUp = await prisma.followUp.findFirst({
    where: { projectId, status: 'SCHEDULED' },
  })
  if (followUp) {
    await cancelQStashMessage(followUp.qstashId)
    await prisma.followUp.update({
      where: { id: followUp.id },
      data:  { status: 'CANCELLED' },
    })
  }

  // 6. Set up event logger for reactivation run
  const logEvent = createEventLogger(projectId, 'reactivation')
  await logEvent({ type: 'start', agent: 'reactivation', message: '● Reactivation agents starting...' })

  const emit = (event: AgentEvent) => { logEvent(event).catch(console.error) }

  // 7. Fire reactivation agents in the background
  void (async () => {
    try {
      await runReactivationAgents(projectId, answers, emit)
      await prisma.project.update({
        where: { id: projectId },
        data:  { agentStatus: 'completed' },
      })
    } catch (err) {
      await logEvent({
        type:    'error',
        agent:   'reactivation',
        message: `Reactivation error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      }).catch(console.error)
      await prisma.project.update({
        where: { id: projectId },
        data:  { agentStatus: 'failed' },
      })
    }
  })()

  return NextResponse.json({ success: true })
}
