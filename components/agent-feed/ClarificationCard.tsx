'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Loader2, GitBranch, Mail, LayoutGrid, Microscope, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { AgentId } from './AgentLine'

interface Props {
  clarificationId: string
  agent: AgentId
  message: string
  questions: string[]
  onSubmitted: () => void
}

const AGENT_LABEL: Record<AgentId, string> = {
  system:       'System',
  research:     'Research Agent',
  orchestrator: 'Orchestrator',
  comms:        'Communication Agent',
  project:      'Project Agent',
  reactivation: 'Reactivation Agent',
}

const AGENT_ICON: Record<AgentId, React.ComponentType<{ className?: string }>> = {
  system:       Zap,
  research:     Microscope,
  orchestrator: GitBranch,
  comms:        Mail,
  project:      LayoutGrid,
  reactivation: Microscope,
}

export function ClarificationCard({ clarificationId, agent, message, questions, onSubmitted }: Props) {
  const [answers, setAnswers] = useState<string[]>(new Array(questions.length).fill(''))
  const [submitting, setSubmitting] = useState(false)
  const firstRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const id = setTimeout(() => firstRef.current?.focus(), 80)
    return () => clearTimeout(id)
  }, [])

  async function handleSubmit() {
    if (submitting) return
    if (answers.every(a => !a.trim())) {
      toast.error('Please answer at least one question.')
      return
    }
    setSubmitting(true)
    try {
      const combined = questions
        .map((q, i) => `Q: ${q}\nA: ${answers[i]?.trim() ?? '(no answer)'}`)
        .join('\n\n')

      const res = await fetch('/api/onboard/clarify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ clarificationId, answers: combined }),
      })
      if (!res.ok) throw new Error('Failed to submit answers')

      toast.success('Context provided — agent continuing...')
      onSubmitted()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Submission failed')
      setSubmitting(false)
    }
  }

  const Icon = AGENT_ICON[agent] ?? Zap

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className="rounded-xl border-2 border-indigo-300 bg-white shadow-lg shadow-indigo-100 overflow-hidden my-3"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-indigo-50 border-b border-indigo-200">
        <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
          <Icon className="w-3 h-3 text-indigo-600" />
        </div>
        <span className="text-xs font-semibold text-indigo-800">
          {AGENT_LABEL[agent]} needs clarification
        </span>
        <div className="ml-auto w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
      </div>

      {/* Body */}
      <div className="px-4 py-4 space-y-4">
        <p className="text-xs font-mono text-indigo-700 bg-indigo-50 rounded-lg px-3 py-2 border border-indigo-100 leading-relaxed">
          {message}
        </p>

        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={i} className="space-y-1.5">
              <label className="flex items-start gap-1.5 text-xs font-semibold text-zinc-700">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 text-[9px] font-bold shrink-0 mt-px">
                  {i + 1}
                </span>
                {q}
              </label>
              <textarea
                ref={i === 0 ? firstRef : undefined}
                rows={2}
                value={answers[i] ?? ''}
                onChange={e => {
                  const next = [...answers]
                  next[i] = e.target.value
                  setAnswers(next)
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
                }}
                placeholder="Your answer…"
                className={cn(
                  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2',
                  'text-xs text-zinc-800 placeholder:text-zinc-400',
                  'focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10',
                  'resize-none transition-colors',
                )}
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || answers.every(a => !a.trim())}
          className={cn(
            'flex items-center gap-2 h-8 px-4 rounded-xl text-xs font-semibold',
            'bg-indigo-600 text-white',
            'hover:bg-indigo-700 active:scale-[0.97]',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'transition-all duration-150 shadow-sm shadow-indigo-600/20',
          )}
        >
          {submitting ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <ArrowRight className="w-3 h-3" />
          )}
          {submitting ? 'Sending…' : 'Answer'}
        </button>
      </div>
    </motion.div>
  )
}
