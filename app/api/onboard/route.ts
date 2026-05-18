import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { runOrchestrator } from '@/lib/agents/orchestrator'
import { createEventLogger } from '@/lib/agents/event-logger'
import type { AgentEvent } from '@/lib/tools/deal-tools'

async function runAgentsBackground(
  projectId: string,
  brief: string,
  emit: (event: AgentEvent) => void,
  logEvent: (event: AgentEvent) => Promise<void>,
  pdfBase64: string | null,
  websiteUrl: string | null,
) {
  try {
    await runOrchestrator(projectId, brief, emit, pdfBase64, websiteUrl)
    await prisma.project.update({
      where: { id: projectId },
      data:  { agentStatus: 'completed' },
    })
  } catch (err) {
    console.error('[onboard] Background agent error:', err)
    await logEvent({
      type:    'error',
      message: `Agent error: ${err instanceof Error ? err.message : 'Unknown error'}`,
    }).catch(console.error)
    await prisma.project.update({
      where: { id: projectId },
      data:  { agentStatus: 'failed' },
    })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return new Response('Unauthorized', { status: 401 })

    const userId = session.user.id

    let brief = ''
    let pdfBase64: string | null = null
    let websiteUrl: string | null = null

    const contentType = req.headers.get('content-type') ?? ''

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      brief      = (form.get('brief') as string | null)?.trim() ?? ''
      websiteUrl = (form.get('websiteUrl') as string | null)?.trim() || null

      const pdfFile = form.get('pdf') as File | null
      if (pdfFile && pdfFile.size > 0) {
        const buffer = await pdfFile.arrayBuffer()
        pdfBase64 = Buffer.from(buffer).toString('base64')
      }
    } else {
      const body = await req.json() as { brief?: string; websiteUrl?: string }
      brief      = body.brief?.trim() ?? ''
      websiteUrl = body.websiteUrl?.trim() || null
    }

    if (!brief) return new Response('Brief is required', { status: 400 })

    // Create project immediately
    const project = await prisma.project.create({
      data: {
        userId,
        name:        'Processing...',
        clientName:  'Pending',
        clientEmail: 'pending@pending.com',
        brief,
        agentStatus: 'running',
      },
    })

    const logEvent = createEventLogger(project.id, 'initial')

    // Log first event before returning
    await logEvent({ type: 'start', message: '● Cascade is starting...' })

    // Sync wrapper — agents call emit() without await
    const emit = (event: AgentEvent) => { logEvent(event).catch(console.error) }

    // Fire agents in background — does not block the response
    void runAgentsBackground(project.id, brief, emit, logEvent, pdfBase64, websiteUrl)

    return Response.json({ projectId: project.id })

  } catch (err) {
    console.error('[onboard] Route error:', err)
    return Response.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
