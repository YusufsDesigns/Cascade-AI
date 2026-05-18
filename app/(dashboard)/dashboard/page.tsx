import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { DashboardClient } from './DashboardClient'

async function getDashboardData(userId: string) {
  const [projects, emailsSent, pendingFollowUps] = await Promise.all([
    prisma.project.findMany({
      where: { userId },
      include: {
        _count: { select: { emails: true, milestones: true } },
        followUp: { select: { status: true, scheduledAt: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.projectEmail.count({
      where: { project: { userId }, status: 'SENT' },
    }),
    prisma.followUp.count({
      where: { project: { userId }, status: 'SCHEDULED' },
    }),
  ])

  const onboarding = projects.filter(p => p.status === 'ONBOARDING').length

  return { projects, stats: { total: projects.length, onboarding, emailsSent, pendingFollowUps } }
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { projects, stats } = await getDashboardData(session.user.id)
  const firstName = session.user.name?.split(' ')[0] ?? 'there'

  return <DashboardClient
    projects={projects as Parameters<typeof DashboardClient>[0]['projects']}
    stats={stats}
    firstName={firstName}
  />
}
