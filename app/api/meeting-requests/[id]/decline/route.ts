import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const meetingRequest = await prisma.meetingRequest.findFirst({
    where: { id, project: { userId: session.user.id } },
  })

  if (!meetingRequest) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (meetingRequest.status !== 'PENDING_REVIEW') {
    return NextResponse.json({ error: 'Already processed' }, { status: 409 })
  }

  await prisma.meetingRequest.update({
    where: { id },
    data:  { status: 'DECLINED' },
  })

  return NextResponse.json({ success: true })
}
