'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { AgentLine, type AgentEvent, type AgentId } from './AgentLine'
import { AgentSummary } from './AgentSummary'
import { ClarificationCard } from './ClarificationCard'
import { cn } from '@/lib/utils'

interface Props {
  brief: string
  pdfFile?: File | null
  websiteUrl?: string
  onComplete?: (projectId: string) => void
}

interface PendingClarification {
  clarificationId: string
  agent: AgentId
  message: string
  questions: string[]
}

interface SummaryData {
  projectId: string
  emailCount: number
  milestoneCount: number
  riskCount: number
  elapsed: number
}

export function AgentFeed({ brief, pdfFile, websiteUrl, onComplete }: Props) {
  const [lines, setLines]             = useState<AgentEvent[]>([])
  const [isRunning, setIsRunning]     = useState(false)
  const [isDone, setIsDone]           = useState(false)
  const [summary, setSummary]         = useState<SummaryData | null>(null)
  const [pending, setPending]         = useState<PendingClarification | null>(null)
  const [elapsed, setElapsed]         = useState(0)

  // counters tracked by ref to avoid stale closures in the stream loop
  const emailCountRef     = useRef(0)
  const milestoneCountRef = useRef(0)
  const riskCountRef      = useRef(0)
  const startTimeRef      = useRef<number | null>(null)
  const scrollRef         = useRef<HTMLDivElement>(null)

  // elapsed timer
  useEffect(() => {
    if (!isRunning) return
    const id = setInterval(() => {
      if (startTimeRef.current !== null) {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }
    }, 1000)
    return () => clearInterval(id)
  }, [isRunning])

  // auto-scroll — disabled when clarification is pending
  useEffect(() => {
    if (pending) return
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [lines, pending, isDone])

  // SSE stream
  useEffect(() => {
    if (!brief) return
    const ctrl = new AbortController()

    emailCountRef.current     = 0
    milestoneCountRef.current = 0
    riskCountRef.current      = 0
    startTimeRef.current      = null
    setLines([])
    setIsRunning(false)
    setIsDone(false)
    setSummary(null)
    setPending(null)
    setElapsed(0)

    async function run() {
      let body: BodyInit
      let headers: HeadersInit | undefined

      if (pdfFile || websiteUrl) {
        const form = new FormData()
        form.append('brief', brief)
        if (pdfFile)      form.append('pdf', pdfFile)
        if (websiteUrl)   form.append('websiteUrl', websiteUrl)
        body = form
      } else {
        body    = JSON.stringify({ brief })
        headers = { 'Content-Type': 'application/json' }
      }

      const res = await fetch('/api/onboard', {
        method: 'POST',
        headers,
        body,
        signal: ctrl.signal,
      })
      if (!res.ok || !res.body) {
        setLines(prev => [...prev, { type: 'error', message: 'Failed to start pipeline. Check server logs.' }])
        return
      }

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done: streamDone, value } = await reader.read()
        if (streamDone) break

        buf += decoder.decode(value, { stream: true })
        const parts = buf.split('\n\n')
        buf = parts.pop() ?? ''

        for (const part of parts) {
          const raw = part.replace(/^data: /, '').trim()
          if (!raw) continue
          try {
            const ev = JSON.parse(raw) as AgentEvent

            // start the timer on first event
            if (startTimeRef.current === null) {
              startTimeRef.current = Date.now()
              setIsRunning(true)
            }

            if (ev.type === 'done') {
              const finalElapsed = startTimeRef.current
                ? Math.floor((Date.now() - startTimeRef.current) / 1000)
                : 0
              setIsDone(true)
              setIsRunning(false)
              setSummary({
                projectId:      ev.projectId ?? '',
                emailCount:     emailCountRef.current,
                milestoneCount: milestoneCountRef.current,
                riskCount:      riskCountRef.current,
                elapsed:        finalElapsed,
              })
              if (ev.projectId) onComplete?.(ev.projectId)
              continue
            }

            // count specific events for summary
            if (ev.type === 'email_sent')     emailCountRef.current++
            if (ev.type === 'milestone_saved') milestoneCountRef.current++
            if (ev.type === 'risk')            riskCountRef.current++

            // handle clarification — set pending card
            if (ev.type === 'clarification' && ev.clarificationId && ev.questions?.length) {
              setPending({
                clarificationId: ev.clarificationId,
                agent:           ev.agent ?? 'system',
                message:         ev.message,
                questions:       ev.questions ?? [],
              })
            }

            setLines(prev => [...prev, ev])
          } catch { /* ignore parse errors */ }
        }
      }
    }

    run().catch(() => {})
    return () => ctrl.abort()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brief, pdfFile, websiteUrl])

  const isDimmed = pending !== null

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm shadow-zinc-900/[0.04]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 bg-white">
        <div className="flex items-center gap-2.5">
          {isRunning && (
            <div className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
            </div>
          )}
          {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
          {!isRunning && !isDone && (
            <span className="w-2 h-2 rounded-full bg-zinc-300 shrink-0" />
          )}
          <span className="text-xs font-semibold text-zinc-800 tracking-wide uppercase">
            Agent Activity
          </span>
        </div>
        <span className={cn(
          'text-xs font-mono',
          isRunning ? 'text-indigo-500' : isDone ? 'text-emerald-600' : 'text-zinc-400',
        )}>
          {isRunning ? 'Live' : isDone ? `${elapsed}s` : 'Ready'}
        </span>
      </div>

      {/* Feed */}
      <div
        ref={scrollRef}
        className="p-5 space-y-1 max-h-[520px] overflow-y-auto scroll-smooth font-mono text-xs"
      >
        <AnimatePresence initial={false}>
          {lines.map((line, i) => (
            <AgentLine key={i} event={line} dimmed={isDimmed} />
          ))}
        </AnimatePresence>

        {/* Clarification card — appears after all lines */}
        <AnimatePresence>
          {pending && (
            <ClarificationCard
              key={pending.clarificationId}
              {...pending}
              onSubmitted={() => {
                setLines(prev => [...prev, {
                  type:    'clarification_answered',
                  agent:   pending.agent,
                  message: 'Context provided',
                  data:    { answer: 'Answers submitted' },
                }])
                setPending(null)
              }}
            />
          )}
        </AnimatePresence>

        {/* Summary card */}
        {summary && isDone && (
          <AgentSummary
            projectId={summary.projectId}
            emailCount={summary.emailCount}
            milestoneCount={summary.milestoneCount}
            riskCount={summary.riskCount}
            elapsed={summary.elapsed}
          />
        )}
      </div>
    </div>
  )
}
