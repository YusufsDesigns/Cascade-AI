import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 })

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const afterId = searchParams.get('afterId') ?? undefined

  // Verify project ownership
  const project = await prisma.project.findFirst({
    where:  { id, userId: session.user.id },
    select: { agentStatus: true },
  })
  if (!project) return new Response('Not found', { status: 404 })

  const events = await prisma.agentEvent.findMany({
    where: {
      projectId: id,
      ...(afterId ? { id: { gt: afterId } } : {}),
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    take: 100,
  })

  return Response.json({ events, agentStatus: project.agentStatus })
}
