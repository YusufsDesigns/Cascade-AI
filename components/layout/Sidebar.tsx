'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Zap, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from 'next-auth/react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/onboard',   label: 'New Onboarding', icon: Zap             },
  { href: '/settings',  label: 'Settings',        icon: Settings        },
]

interface Props {
  userName: string
  userEmail: string
}

export function Sidebar({ userName, userEmail }: Props) {
  const pathname = usePathname()
  const initial  = userName.charAt(0).toUpperCase() || '?'

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-zinc-200 flex flex-col z-40">
      <div className="h-14 flex items-center gap-2.5 px-5 border-b border-zinc-100">
        <Image src="/Logo.png" alt="Cascade logo" width={28} height={28} className="h-7 w-7 object-contain shrink-0" priority />
        <span className="font-semibold text-zinc-900 text-sm tracking-tight">Cascade</span>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/onboard' && pathname.startsWith(href + '/'))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900',
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-zinc-100">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-zinc-50 cursor-pointer transition-colors group"
        >
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-indigo-600">{initial}</span>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-medium text-zinc-900 truncate">{userName || 'Account'}</p>
            <p className="text-xs text-zinc-400 truncate">{userEmail}</p>
          </div>
          <LogOut className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-500 transition-colors shrink-0" />
        </button>
      </div>
    </aside>
  )
}
