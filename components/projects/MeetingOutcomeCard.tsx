'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Zap, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Props {
  projectId:        string
  meetingRequestId: string
}

export function MeetingOutcomeCard({ projectId, meetingRequestId }: Props) {
  const [showNotepad, setShowNotepad]     = useState(false)
  const [meetingNotes, setMeetingNotes]   = useState('')
  const [isSubmitting, setIsSubmitting]   = useState(false)
  const router = useRouter()

  async function handleSubmitMeetingOutcome() {
    if (!meetingNotes.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/post-meeting`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ meetingNotes: meetingNotes.trim(), meetingRequestId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(data.error ?? 'Failed to submit meeting outcome')
      }
      toast.success('Meeting outcome submitted — agents are updating the plan.')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit.')
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] }}
      className="rounded-2xl border border-blue-200 bg-blue-50/60 overflow-hidden mb-4"
    >
      <div className="flex items-start gap-3 px-5 py-4 mb-0">
        <div className="w-8 h-8 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
          <CheckCircle2 className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-blue-900">Meeting request was sent</p>
          <p className="text-xs text-blue-700 mt-0.5">
            Once the meeting has happened, log the outcome so the agents can finalise the project plan.
          </p>
        </div>
      </div>

      <div className="px-5 pb-4">
        <AnimatePresence mode="wait">
          {!showNotepad ? (
            <motion.div
              key="btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <button
                onClick={() => setShowNotepad(true)}
                className={cn(
                  'h-9 px-4 rounded-xl bg-blue-600 text-white text-sm font-medium',
                  'hover:bg-blue-700 active:scale-[0.97] transition-all duration-150',
                  'shadow-sm shadow-blue-600/20',
                )}
              >
                Log meeting outcome
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="notepad"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="space-y-3"
            >
              <div>
                <label className="text-xs font-medium text-blue-900 mb-1.5 block">
                  What was discussed and decided?
                </label>
                <textarea
                  value={meetingNotes}
                  onChange={e => setMeetingNotes(e.target.value)}
                  rows={5}
                  autoFocus
                  placeholder={`e.g. Client confirmed 500 concurrent users means peak load, not average.\nDatabase will be PostgreSQL. They will provide Paystack credentials by May 28.\nTimeline adjusted to 18 weeks to accommodate extra revision round from contract.\nSarah will be the primary technical contact going forward.`}
                  className={cn(
                    'w-full px-3 py-2.5 rounded-xl border border-blue-200 text-sm text-zinc-800 bg-white',
                    'resize-none placeholder:text-zinc-400 leading-relaxed',
                    'focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-colors',
                  )}
                />
                <p className="text-xs text-blue-600 mt-1.5 leading-relaxed">
                  Write freely — the agent will read this and update milestones and risks accordingly.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSubmitMeetingOutcome}
                  disabled={!meetingNotes.trim() || isSubmitting}
                  className={cn(
                    'flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-medium transition-all duration-150',
                    'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.97]',
                    'shadow-sm shadow-blue-600/20 disabled:opacity-40 disabled:cursor-not-allowed',
                  )}
                >
                  {isSubmitting
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Agents updating…</>
                    : <><Zap className="w-3.5 h-3.5" /> Submit — activate agents</>
                  }
                </button>
                <button
                  onClick={() => setShowNotepad(false)}
                  disabled={isSubmitting}
                  className={cn(
                    'h-9 px-4 rounded-xl text-sm text-zinc-500 hover:bg-zinc-100',
                    'transition-colors duration-150 disabled:opacity-40',
                  )}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
