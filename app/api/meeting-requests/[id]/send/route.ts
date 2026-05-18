import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { sendEmail } from '@/lib/email/resend'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { draftEmail } = await req.json() as { draftEmail?: string }

  const meetingRequest = await prisma.meetingRequest.findFirst({
    where:   { id, project: { userId: session.user.id } },
    include: {
      project: {
        select: {
          clientName: true, clientEmail: true, name: true,
          user: { select: { email: true, name: true } },
        },
      },
    },
  })

  if (!meetingRequest) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (meetingRequest.status !== 'PENDING_REVIEW') {
    return NextResponse.json({ error: 'Already processed' }, { status: 409 })
  }

  const emailBody = draftEmail ?? meetingRequest.draftEmail

  await sendEmail({
    to:      meetingRequest.project.clientEmail,
    subject: `Let's schedule a call — ${meetingRequest.project.name}`,
    html:    emailBody.replace(/\n/g, '<br>'),
  })

  await prisma.meetingRequest.update({
    where: { id },
    data:  { status: 'SENT', sentAt: new Date(), draftEmail: emailBody },
  })

  // Notify the account owner that the meeting request was sent
  const pm = meetingRequest.project.user
  await sendEmail({
    to:      pm.email,
    subject: `Meeting request sent — ${meetingRequest.project.name}`,
    html: `<p>Hi ${pm.name},</p>
<p>Your meeting request has been sent to <strong>${meetingRequest.project.clientName}</strong> for the project <strong>${meetingRequest.project.name}</strong>.</p>
<p>Once the meeting has taken place, log the outcome in Cascade so the agents can finalise the project plan.</p>`,
  }).catch(() => { /* non-critical — PM will see the status update in the UI */ })

  return NextResponse.json({ success: true })
}
