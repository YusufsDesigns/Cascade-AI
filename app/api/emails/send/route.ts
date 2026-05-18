import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { sendEmail } from '@/lib/email/resend'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { emailId } = await req.json() as { emailId: string }

  const email = await prisma.projectEmail.findFirst({
    where: { id: emailId, project: { userId: session.user.id } },
  })
  if (!email) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (email.status === 'SENT') return NextResponse.json({ error: 'Already sent' }, { status: 409 })

  await sendEmail({ to: email.recipient, subject: email.subject, html: email.content })

  await prisma.projectEmail.update({
    where: { id: emailId },
    data: { status: 'SENT', sentAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
