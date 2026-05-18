import { NextResponse } from 'next/server'
import { submitClarification } from '@/lib/agents/clarification'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: Request) {
  const { clarificationId, answers } = await req.json() as {
    clarificationId: string
    answers: string
  }

  if (!clarificationId || !answers) {
    return NextResponse.json({ error: 'Missing clarificationId or answers' }, { status: 400 })
  }

  const resolved = submitClarification(clarificationId, answers)
  if (!resolved) {
    return NextResponse.json({ error: 'Clarification ID not found or already resolved' }, { status: 404 })
  }

  // Extract projectId from clarificationId (format: "${cuid}-${agent}-${uuid}")
  // cuid has no hyphens, so the first segment is always the projectId
  const projectId = clarificationId.split('-')[0]

  if (projectId) {
    // Log the answered event so the feed stops showing the clarification card on refresh
    prisma.agentEvent.create({
      data: {
        projectId,
        runType:   'initial',
        type:      'clarification_answered',
        agent:     null,
        message:   'Context provided — agent continuing',
        eventData: { clarificationId, answer: answers.slice(0, 120) },
      },
    }).catch(console.error)
  }

  return NextResponse.json({ success: true })
}
