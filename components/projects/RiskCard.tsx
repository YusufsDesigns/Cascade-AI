'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Risk {
  id: string
  description: string
  severity: string
  milestone: string | null
  reviewed: boolean
}

const severityConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
  high:   { label: 'HIGH',   bg: 'bg-red-50',   text: 'text-red-700',   border: 'border-red-100'   },
  medium: { label: 'MEDIUM', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
  low:    { label: 'LOW',    bg: 'bg-zinc-50',  text: 'text-zinc-600',  border: 'border-zinc-100'  },
}

export function RiskCard({ risk: initial, index }: { risk: Risk; index: number }) {
  const [risk, setRisk] = useState(initial)
  const [toggling, setToggling] = useState(false)

  const cfg = severityConfig[risk.severity] ?? severityConfig.medium

  async function toggleReview() {
    if (toggling) return
    setToggling(true)
    const next = !risk.reviewed
    try {
      const res = await fetch(`/api/risks/${risk.id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewed: next }),
      })
      if (!res.ok) throw new Error()
      setRisk(prev => ({ ...prev, reviewed: next }))
      toast.success(next ? 'Risk marked as reviewed.' : 'Marked as unreviewed.')
    } catch {
      toast.error('Failed to update risk status.')
    } finally {
      setToggling(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.22,
        delay: index * 0.05,
        ease: [0.23, 1, 0.32, 1] as [number, number, number, number],
      }}
      className={cn(
        'rounded-2xl border p-4 flex items-start gap-3 transition-all duration-300',
        risk.reviewed ? 'border-zinc-100 bg-zinc-50/40' : cn(cfg.bg, cfg.border),
      )}
    >
      {/* Review toggle */}
      <button
        onClick={toggleReview}
        disabled={toggling}
        title={risk.reviewed ? 'Mark as unreviewed' : 'Mark as reviewed'}
        className="shrink-0 mt-0.5 hover:scale-110 active:scale-95 transition-transform duration-150 disabled:opacity-50"
      >
        <AnimatePresence mode="wait" initial={false}>
          {risk.reviewed ? (
            <motion.div
              key="checked"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </motion.div>
          ) : (
            <motion.div
              key="unchecked"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Circle className="w-4 h-4 text-zinc-300 hover:text-zinc-400 transition-colors" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-xs leading-relaxed transition-all duration-300',
            risk.reviewed ? 'text-zinc-400 line-through' : cfg.text,
          )}
        >
          {risk.description}
        </p>
        {risk.milestone && !risk.reviewed && (
          <p className="text-[11px] text-zinc-400 mt-1">Affects: {risk.milestone}</p>
        )}
      </div>

      {/* Severity badge */}
      <span
        className={cn(
          'text-[10px] font-semibold uppercase tracking-wider shrink-0 transition-colors duration-300',
          risk.reviewed ? 'text-zinc-300' : cfg.text,
        )}
      >
        {cfg.label}
      </span>
    </motion.div>
  )
}
