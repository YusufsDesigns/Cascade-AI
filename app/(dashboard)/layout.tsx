import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { Shell } from '@/components/layout/Shell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')
  return (
    <Shell
      userName={session.user?.name ?? ''}
      userEmail={session.user?.email ?? ''}
    >
      {children}
    </Shell>
  )
}
