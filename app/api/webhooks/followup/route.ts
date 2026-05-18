import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { sendEmail } from '@/lib/email/resend'

export async function POST(req: Request) {
  const { projectId } = await req.json() as { projectId: string }

  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 })
  }

  const project = await prisma.project.findUnique({
    where:   { id: projectId },
    include: { intakeForm: true, emails: true },
  })

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // Intake already submitted — do nothing
  if (project.intakeForm?.submittedAt) {
    return NextResponse.json({ cancelled: true, reason: 'Intake already submitted' })
  }

  // Find the follow-up email draft or questionnaire
  const followUpEmail = project.emails.find(e => e.type === 'FOLLOWUP')
    ?? project.emails.find(e => e.type === 'QUESTIONNAIRE')

  if (!followUpEmail) {
    return NextResponse.json({ error: 'No follow-up email found' }, { status: 404 })
  }

  try {
    await sendEmail({
      to:      project.clientEmail,
      subject: `Following up: ${followUpEmail.subject}`,
      html:    followUpEmail.content.replace(/\n/g, '<br>'),
    })

    await prisma.projectEmail.update({
      where: { id: followUpEmail.id },
      data:  { status: 'SENT' },
    })

    await prisma.followUp.updateMany({
      where: { projectId, status: 'SCHEDULED' },
      data:  { status: 'SENT' },
    })

    return NextResponse.json({ sent: true })
  } catch (err) {
    console.error('Follow-up send failed:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Send failed' },
      { status: 500 },
    )
  }
}
