'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarClock, Send, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface MeetingRequestData {
  id: string
  reason: string
  suggestedTopics: string[]
  draftEmail: string
  status: 'PENDING_REVIEW' | 'SENT' | 'DECLINED'
  createdAt: Date | string
}

export function MeetingRequestCard({ request }: { request: MeetingRequestData }) {
  const [expanded, setExpanded]   = useState(false)
  const [draftEmail, setDraftEmail] = useState(request.draftEmail)
  const [sending, setSending]     = useState(false)
  const [declining, setDeclining] = useState(false)
  const router = useRouter()

  if (request.status !== 'PENDING_REVIEW') return null

  async function handleSend() {
    setSending(true)
    try {
      const res = await fetch(`/api/meeting-requests/${request.id}/send`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ draftEmail }),
      })
      if (!res.ok) throw new Error()
      toast.success('Meeting request sent to client.')
      router.refresh()
    } catch {
      toast.error('Failed to send meeting request.')
    } finally {
      setSending(false)
    }
  }

  async function handleDecline() {
    setDeclining(true)
    try {
      const res = await fetch(`/api/meeting-requests/${request.id}/decline`, { method: 'POST' })
      if (!res.ok) throw new Error()
      toast.success('Meeting request dismissed.')
      router.refresh()
    } catch {
      toast.error('Failed to dismiss.')
    } finally {
      setDeclining(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] }}
      className="rounded-2xl border border-violet-200 bg-violet-50/40 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start gap-3 px-5 py-4">
        <div className="w-8 h-8 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center shrink-0 mt-0.5">
          <CalendarClock className="w-4 h-4 text-violet-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-bold text-violet-700 uppercase tracking-wider">Meeting Requested</span>
            <span className="text-[10px] bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-medium border border-violet-200">
              Awaiting review
            </span>
          </div>
          <p className="text-sm text-zinc-700 leading-snug">{request.reason}</p>
          {request.suggestedTopics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {request.suggestedTopics.map((topic, i) => (
                <span key={i} className="text-[11px] bg-white border border-violet-200 text-violet-600 px-2 py-0.5 rounded-full">
                  {topic}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Draft email toggle */}
      <div className="px-5 pb-3">
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700 transition-colors font-medium"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? 'Hide draft email' : 'Edit draft email to client'}
        </button>

        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="mt-3 overflow-hidden"
          >
            <textarea
              value={draftEmail}
              onChange={e => setDraftEmail(e.target.value)}
              rows={8}
              className={cn(
                'w-full px-3 py-2.5 rounded-xl text-xs text-zinc-800 bg-white',
                'border border-violet-200 resize-none leading-relaxed font-mono',
                'focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 transition-colors',
              )}
            />
          </motion.div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-5 pb-4">
        <button
          onClick={handleSend}
          disabled={sending || declining}
          className={cn(
            'flex items-center gap-1.5 h-8 px-4 rounded-xl text-xs font-semibold transition-all duration-150',
            'bg-violet-600 text-white hover:bg-violet-700 active:scale-[0.97]',
            'shadow-sm shadow-violet-600/20 disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          {sending ? 'Sending…' : 'Approve & Send'}
        </button>
        <button
          onClick={handleDecline}
          disabled={sending || declining}
          className={cn(
            'flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium transition-all duration-150',
            'bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-700 hover:border-zinc-300',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          {declining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
          {declining ? 'Dismissing…' : 'Dismiss'}
        </button>
      </div>
    </motion.div>
  )
}
