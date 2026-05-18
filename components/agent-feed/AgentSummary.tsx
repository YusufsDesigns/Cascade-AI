'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Props {
  projectId: string
  emailCount: number
  milestoneCount: number
  riskCount: number
  elapsed: number
}

export function AgentSummary({ projectId, emailCount, milestoneCount, riskCount, elapsed }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1], delay: 0.15 }}
      className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 mt-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
        <span className="font-semibold text-emerald-800 text-sm">Cascade complete</span>
        <span className="ml-auto text-xs text-emerald-600 font-mono tabular-nums">{elapsed}s</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 rounded-lg bg-white border border-zinc-100">
          <p className="text-2xl font-bold text-zinc-900 tabular-nums leading-none">{emailCount}</p>
          <p className="text-[11px] text-zinc-500 mt-1.5">Emails sent</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-white border border-zinc-100">
          <p className="text-2xl font-bold text-zinc-900 tabular-nums leading-none">{milestoneCount}</p>
          <p className="text-[11px] text-zinc-500 mt-1.5">Milestones</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-white border border-zinc-100">
          <p className={cn('text-2xl font-bold tabular-nums leading-none', riskCount > 0 ? 'text-red-600' : 'text-zinc-900')}>
            {riskCount}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1.5">Risks flagged</p>
        </div>
      </div>

      <Link
        href={`/projects/${projectId}`}
        className="flex items-center justify-center gap-2 w-full h-9 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 active:scale-[0.98] transition-all duration-150 shadow-sm shadow-indigo-600/20"
      >
        Review project
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </motion.div>
  )
}
