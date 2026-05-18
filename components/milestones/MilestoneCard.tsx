'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, UserX, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'

export interface TeamMember {
  id: string
  name: string
  role: string
}

export interface MilestoneData {
  id: string
  phase: number
  title: string
  description: string
  ownerRole: string
  ownerName: string | null
  ownerEmail: string | null
  dueDate: Date | string | null
  requiresClient: boolean
  status: MilestoneStatus
  riskNote: string | null
}

const roleColors: Record<string, { bg: string; text: string; avatar: string }> = {
  pm:        { bg: 'bg-violet-50',  text: 'text-violet-700',  avatar: 'bg-violet-100 text-violet-700'  },
  designer:  { bg: 'bg-pink-50',   text: 'text-pink-700',    avatar: 'bg-pink-100 text-pink-700'      },
  developer: { bg: 'bg-blue-50',   text: 'text-blue-700',    avatar: 'bg-blue-100 text-blue-700'      },
  qa:        { bg: 'bg-emerald-50', text: 'text-emerald-700', avatar: 'bg-emerald-100 text-emerald-700' },
}

const phaseColors = [
  'bg-indigo-500', 'bg-blue-500', 'bg-violet-500',
  'bg-emerald-500', 'bg-amber-500', 'bg-pink-500',
]

function formatDate(d: Date | string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function roleLabel(role: string) {
  const map: Record<string, string> = { pm: 'PM', designer: 'Designer', developer: 'Dev', qa: 'QA' }
  return map[role] ?? role
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

const STATUS_DISPLAY: Record<MilestoneStatus, string> = {
  PENDING:     'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED:   'completed',
}

const STATUS_ACTIVE: Record<string, string> = {
  not_started: 'bg-zinc-100 text-zinc-700 border-zinc-300',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  completed:   'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const STATUS_LABELS: Record<string, React.ReactNode> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed:   <><Check className="w-2.5 h-2.5 inline mr-0.5" />Complete</>,
}

export function MilestoneCard({
  milestone: initial,
  teamMembers,
  index,
}: {
  milestone: MilestoneData
  teamMembers: TeamMember[]
  index: number
}) {
  const [milestone, setMilestone] = useState(initial)
  const [assigning, setAssigning] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const router = useRouter()

  async function handleStatusChange(newDisplayStatus: string) {
    if (updatingStatus) return
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/milestones/${milestone.id}/status`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: newDisplayStatus }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json() as { status: MilestoneStatus; completionTriggered: boolean }

      setMilestone(prev => ({ ...prev, status: data.status }))
      if (data.completionTriggered) {
        toast.success('All milestones complete — generating completion summary…')
      }
      router.refresh()
    } catch {
      toast.error('Failed to update milestone status.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const roleStyle = roleColors[milestone.ownerRole] ?? { bg: 'bg-zinc-100', text: 'text-zinc-600', avatar: 'bg-zinc-100 text-zinc-600' }
  const dotColor = phaseColors[(milestone.phase - 1) % phaseColors.length]
  const date = formatDate(milestone.dueDate)

  async function handleAssign(memberId: string) {
    if (assigning) return
    setAssigning(true)
    try {
      const res = await fetch(`/api/milestones/${milestone.id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamMemberId: memberId }),
      })
      if (!res.ok) throw new Error()
      const updated = (await res.json()) as { ownerName: string; ownerEmail: string; ownerRole: string }
      setMilestone(prev => ({
        ...prev,
        ownerName: updated.ownerName,
        ownerEmail: updated.ownerEmail,
        ownerRole: updated.ownerRole,
      }))
      toast.success(`Assigned to ${updated.ownerName}`)
      router.refresh()
    } catch {
      toast.error('Failed to assign team member.')
    } finally {
      setAssigning(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.22,
        delay: index * 0.04,
        ease: [0.23, 1, 0.32, 1] as [number, number, number, number],
      }}
      className={cn(
        'flex items-start gap-4 p-4 rounded-2xl border transition-colors duration-150',
        milestone.requiresClient
          ? 'border-amber-100 bg-amber-50/30 hover:border-amber-200'
          : 'border-zinc-100 bg-white hover:border-zinc-200',
      )}
    >
      {/* Phase dot */}
      <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5', dotColor)}>
        <span className="text-[10px] font-bold text-white">{milestone.phase}</span>
      </div>

      <div className="flex-1 min-w-0">
        {/* Title row */}
        <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
          <p className="text-sm font-semibold text-zinc-900">{milestone.title}</p>
          {milestone.requiresClient && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
              <AlertTriangle className="w-2.5 h-2.5" /> Client action
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-zinc-500 leading-relaxed mb-2.5">{milestone.description}</p>

        {/* Risk note */}
        {milestone.riskNote && (
          <div className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 mb-2.5 leading-relaxed">
            <AlertTriangle className="w-3 h-3 shrink-0 mt-px" />
            <span>{milestone.riskNote}</span>
          </div>
        )}

        {/* Status selector pills */}
        <div className="flex items-center gap-1.5 mb-2.5">
          {(['not_started', 'in_progress', 'completed'] as const).map(s => {
            const isActive = STATUS_DISPLAY[milestone.status] === s
            return (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={updatingStatus || isActive}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium transition-colors duration-150 border',
                  isActive
                    ? STATUS_ACTIVE[s]
                    : 'bg-zinc-50 text-zinc-400 border-zinc-200 hover:bg-zinc-100 hover:text-zinc-600',
                  'disabled:cursor-not-allowed',
                )}
              >
                {STATUS_LABELS[s]}
              </button>
            )
          })}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap">
          {milestone.ownerName ? (
            <div className="flex items-center gap-1.5">
              <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0', roleStyle.avatar)}>
                {getInitials(milestone.ownerName)}
              </div>
              <span className={cn('text-xs font-medium', roleStyle.text)}>{milestone.ownerName}</span>
              <span className="text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-full">{roleLabel(milestone.ownerRole)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <UserX className="w-3 h-3 text-amber-500 shrink-0" />
              {teamMembers.length > 0 ? (
                <select
                  disabled={assigning}
                  value=""
                  onChange={e => { if (e.target.value) handleAssign(e.target.value) }}
                  className={cn(
                    'text-[11px] font-medium h-6 pl-2 pr-6 rounded-full border appearance-none cursor-pointer',
                    'bg-amber-50 text-amber-700 border-amber-200',
                    'hover:bg-amber-100 transition-colors duration-150',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'focus:outline-none focus:ring-1 focus:ring-amber-300',
                  )}
                >
                  <option value="">{assigning ? 'Assigning…' : 'Assign owner…'}</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} · {roleLabel(m.role)}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-[11px] font-medium text-amber-600">
                  Unassigned — add team in Settings
                </span>
              )}
            </div>
          )}

          {date && (
            <span className="text-xs text-zinc-400">Due {date}</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
