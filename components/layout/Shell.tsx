import { Sidebar } from './Sidebar'

interface Props {
  children: React.ReactNode
  userName: string
  userEmail: string
}

export function Shell({ children, userName, userEmail }: Props) {
  return (
    <div className="flex h-full">
      <Sidebar userName={userName} userEmail={userEmail} />
      <main className="flex-1 ml-60 min-h-screen bg-zinc-50">
        {children}
      </main>
    </div>
  )
}
