import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { createEventLogger } from '@/lib/agents/event-logger'
import { runFinalizationAgents } from '@/lib/agents/finalization'
import type { AgentEvent } from '@/lib/tools/deal-tools'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 })

  const { id: projectId } = await params
  const { meetingNotes, meetingRequestId } = await req.json() as {
    meetingNotes:     string
    meetingRequestId: string
  }

  if (!meetingNotes?.trim()) {
    return NextResponse.json({ error: 'Meeting notes are required' }, { status: 400 })
  }

  // Verify project ownership
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  })
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Save meeting notes and mark meeting as completed
  try {
    await prisma.meetingRequest.update({
      where: { id: meetingRequestId },
      data: {
        meetingNotes,
        meetingCompleted:   true,
        meetingCompletedAt: new Date(),
      },
    })
  } catch (error) {
    console.error('[post-meeting] Failed to update meeting request:', error)
    return NextResponse.json(
      { error: `Failed to save meeting notes: ${error instanceof Error ? error.message : 'Database error'}` },
      { status: 500 },
    )
  }

  // Set project back to running
  await prisma.project.update({
    where: { id: projectId },
    data:  { agentStatus: 'running' },
  })

  // Log start event for feed
  const logEvent = createEventLogger(projectId, 'finalization')
  await logEvent({
    type:    'start',
    agent:   'system',
    message: '● Cascade re-activating — meeting outcome received',
  })

  const emit = (event: AgentEvent) => { logEvent(event).catch(console.error) }

  // Fire finalization agents in background
  void (async () => {
    try {
      await runFinalizationAgents(projectId, meetingNotes, emit)
      await prisma.project.update({
        where: { id: projectId },
        data:  { agentStatus: 'completed', status: 'ACTIVE' },
      })
    } catch (error) {
      console.error('[post-meeting] Finalization failed:', error)
      await logEvent({
        type:    'error',
        agent:   'system',
        message: `Finalization error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }).catch(console.error)
      await prisma.project.update({
        where: { id: projectId },
        data:  { agentStatus: 'failed' },
      })
    }
  })()

  return NextResponse.json({ success: true })
}
