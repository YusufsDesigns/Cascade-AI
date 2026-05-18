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
  const { subject, content } = await req.json() as { subject: string; content: string }

  const email = await prisma.projectEmail.findFirst({
    where: { id, project: { userId: session.user.id } },
  })
  if (!email) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (email.status === 'SENT') return NextResponse.json({ error: 'Cannot edit a sent email' }, { status: 409 })

  const updated = await prisma.projectEmail.update({
    where: { id },
    data: { subject, content },
  })

  return NextResponse.json(updated)
}
