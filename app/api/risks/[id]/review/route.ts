import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { reviewed } = await req.json() as { reviewed: boolean }

  const risk = await prisma.projectRisk.findFirst({
    where: { id, project: { userId: session.user.id } },
  })
  if (!risk) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.projectRisk.update({
    where: { id },
    data: { reviewed },
  })

  return NextResponse.json(updated)
}
