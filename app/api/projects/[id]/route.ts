import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
    include: {
      emails: { orderBy: { createdAt: 'asc' } },
      milestones: { orderBy: [{ phase: 'asc' }, { createdAt: 'asc' }] },
      followUp: true,
      intakeForm: { select: { token: true, submittedAt: true } },
    },
  })

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(project)
}
