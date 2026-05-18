import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { sendMilestoneAssignmentEmail } from '@/lib/email/milestone-notification'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { teamMemberId } = await req.json() as { teamMemberId: string }

  const milestone = await prisma.milestone.findFirst({
    where:   { id, project: { userId: session.user.id } },
    include: { project: { select: { name: true, clientName: true } } },
  })
  if (!milestone) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const member = await prisma.teamMember.findFirst({
    where: { id: teamMemberId, userId: session.user.id },
  })
  if (!member) return NextResponse.json({ error: 'Team member not found' }, { status: 404 })

  const updated = await prisma.milestone.update({
    where: { id },
    data:  { ownerName: member.name, ownerEmail: member.email, ownerRole: member.role },
  })

  // Notify the assigned team member (fire and forget — don't block the response)
  sendMilestoneAssignmentEmail({
    to:            member.email,
    memberName:    member.name,
    milestoneName: milestone.title,
    projectName:   milestone.project.name,
    clientName:    milestone.project.clientName,
    ownerRole:     member.role,
    dueDate:       milestone.dueDate,
  }).catch(console.error)

  return NextResponse.json(updated)
}
