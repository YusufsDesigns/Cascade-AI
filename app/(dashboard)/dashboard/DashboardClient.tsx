'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Zap, Mail, ArrowRight, Plus, TrendingUp, CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Project {
  id: string
  name: string
  clientName: string
  clientEmail: string
  status: string
  createdAt: Date
  _count: { emails: number; milestones: number }
  followUp: { status: string; scheduledAt: Date } | null
}

interface Stats {
  total: number
  onboarding: number
  emailsSent: number
  pendingFollowUps: number
}

interface Props {
  projects: Project[]
  stats: Stats
  firstName: string
}

const statusConfig: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  INTAKE:     { label: 'Intake',      dot: 'bg-zinc-400',   bg: 'bg-zinc-100',    text: 'text-zinc-600' },
  ONBOARDING: { label: 'Onboarding',  dot: 'bg-indigo-500', bg: 'bg-indigo-50',   text: 'text-indigo-700' },
  ACTIVE:     { label: 'Active',      dot: 'bg-emerald-500',bg: 'bg-emerald-50',  text: 'text-emerald-700' },
  COMPLETED:  { label: 'Completed',   dot: 'bg-zinc-300',   bg: 'bg-zinc-100',    text: 'text-zinc-500' },
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}
const itemVariants = {
  hidden:   { opacity: 0, y: 10 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' as const } },
}

function greeting(name: string) {
  const h = new Date().getHours()
  const salutation = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return `${salutation}, ${name}.`
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function DashboardClient({ projects, stats, firstName }: Props) {
  const statItems = [
    { label: 'Total projects',    value: stats.total,          color: 'text-zinc-900'   },
    { label: 'Onboarding now',    value: stats.onboarding,     color: 'text-indigo-600' },
    { label: 'Emails sent',       value: stats.emailsSent,     color: 'text-emerald-600'},
    { label: 'Pending follow-ups',value: stats.pendingFollowUps,
      color: stats.pendingFollowUps > 0 ? 'text-amber-600' : 'text-zinc-900' },
  ]

  return (
    <div className="px-8 py-8 max-w-6xl mx-auto">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' as const }}
        className="flex items-start justify-between mb-8"
      >
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">
            {greeting(firstName)}
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          href="/onboard"
          className={cn(
            'flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium',
            'bg-indigo-600 text-white',
            'hover:bg-indigo-700 active:bg-indigo-800',
            'shadow-sm shadow-indigo-600/25',
            'transition-all duration-150',
          )}
        >
          <Plus className="w-4 h-4" />
          New onboarding
        </Link>
      </motion.div>

      {/* ── Stats row ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-4 gap-px bg-zinc-100 rounded-2xl overflow-hidden border border-zinc-100 mb-8"
      >
        {statItems.map(({ label, value, color }) => (
          <motion.div
            key={label}
            variants={itemVariants}
            className="bg-white px-6 py-5"
          >
            <p className={cn('text-3xl font-bold tabular-nums leading-none mb-1.5', color)}>{value}</p>
            <p className="text-xs text-zinc-400">{label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Recent projects ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15, ease: 'easeOut' as const }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-900">Recent projects</h2>
          {projects.length > 0 && (
            <span className="text-xs text-zinc-400">{projects.length} total</span>
          )}
        </div>

        {projects.length === 0 ? (
          /* Empty state */
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
            </div>
            <p className="text-sm font-semibold text-zinc-700 mb-1">No projects yet</p>
            <p className="text-xs text-zinc-400 mb-5 max-w-xs mx-auto leading-relaxed">
              Paste a deal brief and three AI agents will set up the entire onboarding in under a minute.
            </p>
            <Link
              href="/onboard"
              className={cn(
                'inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-medium',
                'bg-indigo-600 text-white hover:bg-indigo-700',
                'shadow-sm shadow-indigo-600/20 transition-all duration-150',
              )}
            >
              <Zap className="w-3.5 h-3.5" /> Start first onboarding
            </Link>
          </div>
        ) : (
          /* Project list */
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-2"
          >
            {projects.map((project) => {
              const cfg = statusConfig[project.status] ?? statusConfig.INTAKE
              return (
                <motion.div key={project.id} variants={itemVariants}>
                  <Link
                    href={`/projects/${project.id}`}
                    className={cn(
                      'flex items-center gap-4 px-5 py-4 rounded-2xl',
                      'bg-white border border-zinc-100',
                      'hover:border-zinc-200 hover:shadow-sm hover:shadow-zinc-900/4',
                      'transition-all duration-150 group',
                    )}
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-indigo-600">
                        {project.clientName.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Main */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-zinc-900 truncate">{project.name}</p>
                      </div>
                      <p className="text-xs text-zinc-400 truncate">
                        {project.clientName} · {project.clientEmail}
                      </p>
                    </div>

                    {/* Counts */}
                    <div className="hidden sm:flex items-center gap-4 text-xs text-zinc-400 shrink-0">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {project._count.emails}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {project._count.milestones}
                      </span>
                    </div>

                    {/* Status badge */}
                    <span className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0',
                      cfg.bg, cfg.text,
                    )}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
                      {cfg.label}
                    </span>

                    {/* Date */}
                    <span className="hidden lg:block text-xs text-zinc-400 shrink-0 w-24 text-right">
                      {formatDate(project.createdAt)}
                    </span>

                    <ArrowRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
