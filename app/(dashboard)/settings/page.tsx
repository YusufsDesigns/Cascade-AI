import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { SettingsClient } from './SettingsClient'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [user, members] = await Promise.all([
    prisma.user.findUnique({
      where:  { id: session.user.id },
      select: { name: true, email: true, companyName: true },
    }),
    prisma.teamMember.findMany({
      where:   { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  return (
    <SettingsClient
      user={user ?? { name: '', email: '', companyName: '' }}
      initialMembers={members}
    />
  )
}
