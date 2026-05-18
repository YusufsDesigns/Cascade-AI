import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const member = await prisma.teamMember.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.teamMember.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
