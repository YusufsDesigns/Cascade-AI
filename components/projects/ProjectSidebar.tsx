import Link from 'next/link'
import { cn } from '@/lib/utils'

interface SidebarNav {
  id: string
  label: string
}

interface SidebarTeamMember {
  name: string
  role: string
}

interface ProjectSidebarProps {
  status: string
  emailsSent: number
  emailsTotal: number
  milestonesTotal: number
  risksTotal: number
  risksReviewed: number
  team: SidebarTeamMember[]
  nav: SidebarNav[]
  intakeSubmitted: boolean
}

const statusConfig: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  INTAKE:     { label: 'Intake',     dot: 'bg-zinc-400',    bg: 'bg-zinc-100',   text: 'text-zinc-600'   },
  ONBOARDING: { label: 'Onboarding', dot: 'bg-indigo-500',  bg: 'bg-indigo-50',  text: 'text-indigo-700' },
  ACTIVE:     { label: 'Active',     dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700'},
  COMPLETED:  { label: 'Completed',  dot: 'bg-zinc-300',    bg: 'bg-zinc-100',   text: 'text-zinc-500'   },
}

const roleColors: Record<string, { avatar: string }> = {
  pm:        { avatar: 'bg-violet-100 text-violet-700'  },
  designer:  { avatar: 'bg-pink-100 text-pink-700'      },
  developer: { avatar: 'bg-blue-100 text-blue-700'      },
  qa:        { avatar: 'bg-emerald-100 text-emerald-700' },
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export function ProjectSidebar({
  status,
  emailsSent,
  emailsTotal,
  milestonesTotal,
  risksTotal,
  risksReviewed,
  team,
  nav,
  intakeSubmitted,
}: ProjectSidebarProps) {
  const cfg = statusConfig[status] ?? statusConfig.INTAKE

  return (
    <div className="space-y-3">
      {/* Status */}
      <div className="rounded-2xl border border-zinc-100 bg-white shadow-sm shadow-zinc-900/4 px-4 py-3.5">
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Status</p>
        <span className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
          cfg.bg, cfg.text,
        )}>
          <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
          {cfg.label}
        </span>
      </div>

      {/* Stats */}
      <div className="rounded-2xl border border-zinc-100 bg-white shadow-sm shadow-zinc-900/4 px-4 py-3.5">
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">Quick stats</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">Emails sent</span>
            <span className="text-xs font-semibold text-zinc-900 tabular-nums">
              {emailsSent}<span className="text-zinc-300 font-normal">/{emailsTotal}</span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">Milestones</span>
            <span className="text-xs font-semibold text-zinc-900 tabular-nums">{milestonesTotal}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">Risks reviewed</span>
            <span className="text-xs font-semibold text-zinc-900 tabular-nums">
              {risksReviewed}<span className="text-zinc-300 font-normal">/{risksTotal}</span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">Intake form</span>
            <span className={cn(
              'text-xs font-medium',
              intakeSubmitted ? 'text-emerald-600' : 'text-amber-600',
            )}>
              {intakeSubmitted ? 'Submitted' : 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Team */}
      {team.length > 0 && (
        <div className="rounded-2xl border border-zinc-100 bg-white shadow-sm shadow-zinc-900/4 px-4 py-3.5">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">Team on project</p>
          <div className="space-y-2">
            {team.map((member, i) => {
              const style = roleColors[member.role] ?? roleColors.pm
              return (
                <div key={i} className="flex items-center gap-2.5">
                  <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0', style.avatar)}>
                    {getInitials(member.name)}
                  </div>
                  <span className="text-xs text-zinc-700 font-medium truncate">{member.name}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="rounded-2xl border border-zinc-100 bg-white shadow-sm shadow-zinc-900/4 px-4 py-3.5">
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Jump to</p>
        <div className="space-y-0.5">
          {nav.map(item => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="block text-xs text-zinc-500 hover:text-zinc-900 py-1 transition-colors duration-150"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
