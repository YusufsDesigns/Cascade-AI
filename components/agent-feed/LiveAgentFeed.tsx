'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, ChevronDown } from 'lucide-react'
import { AgentLine, type AgentEvent, type AgentId } from './AgentLine'
import { AgentSummary } from './AgentSummary'
import { ClarificationCard } from './ClarificationCard'
import { cn } from '@/lib/utils'

interface DbEvent {
  id: string
  type: string
  agent: string | null
  message: string
  eventData: Record<string, unknown> | null
  createdAt: string
}

interface Props {
  projectId: string
  initialEvents?: DbEvent[]
  initialAgentStatus?: string
}

interface PendingClarification {
  clarificationId: string
  agent: AgentId
  message: string
  questions: string[]
}

export function LiveAgentFeed({ projectId, initialEvents = [], initialAgentStatus = 'idle' }: Props) {
  const [events, setEvents]           = useState<DbEvent[]>(initialEvents)
  const [agentStatus, setAgentStatus] = useState(initialAgentStatus)
  const [pending, setPending]         = useState<PendingClarification | null>(null)
  const [collapsed, setCollapsed]     = useState(
    initialAgentStatus === 'completed' || initialAgentStatus === 'failed'
  )

  const lastIdRef  = useRef<string | undefined>(initialEvents[initialEvents.length - 1]?.id)
  const scrollRef  = useRef<HTMLDivElement>(null)
  const stoppedRef = useRef(false)

  const isRunning = agentStatus === 'running'
  const isDone    = agentStatus === 'completed' || agentStatus === 'failed'

  const emailCount     = events.filter(e => e.type === 'email_sent').length
  const milestoneCount = events.filter(e => e.type === 'milestone_saved').length
  const riskCount      = events.filter(e => e.type === 'risk').length

  // Detect unanswered clarification from the event stream
  useEffect(() => {
    const clarificationEvs = events.filter(
      e => e.type === 'clarification' && e.eventData?.clarificationId && (e.eventData?.questions as unknown[])?.length
    )
    const answeredIds = new Set(
      events
        .filter(e => e.type === 'clarification_answered' && e.eventData?.clarificationId)
        .map(e => e.eventData!.clarificationId as string)
    )
    const unanswered = clarificationEvs.find(
      e => !answeredIds.has(e.eventData!.clarificationId as string)
    )

    if (unanswered && !pending) {
      setPending({
        clarificationId: unanswered.eventData!.clarificationId as string,
        agent:           (unanswered.agent ?? 'system') as AgentId,
        message:         unanswered.message,
        questions:       unanswered.eventData!.questions as string[],
      })
    } else if (!unanswered && pending) {
      setPending(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events])

  // Auto-scroll (paused while clarification is showing)
  useEffect(() => {
    if (pending) return
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [events, pending, isDone])

  // Polling loop
  useEffect(() => {
    if (isDone) return
    stoppedRef.current = false

    async function poll() {
      while (!stoppedRef.current) {
        await new Promise<void>(r => setTimeout(r, 2000))
        if (stoppedRef.current) break

        try {
          const qs  = lastIdRef.current ? `?afterId=${lastIdRef.current}` : ''
          const res = await fetch(`/api/projects/${projectId}/events${qs}`)
          if (!res.ok) continue

          const { events: newEvs, agentStatus: newStatus } = await res.json() as {
            events: DbEvent[]
            agentStatus: string
          }

          if (newEvs.length > 0) {
            setEvents(prev => [...prev, ...newEvs])
            lastIdRef.current = newEvs[newEvs.length - 1].id
          }

          setAgentStatus(newStatus)

          if (newStatus === 'completed' || newStatus === 'failed') {
            stoppedRef.current = true
            setCollapsed(true)
            break
          }
        } catch {
          // network error, retry on next tick
        }
      }
    }

    poll()
    return () => { stoppedRef.current = true }
  }, [projectId, isDone])

  function toAgentEvent(e: DbEvent): AgentEvent {
    return {
      type:            e.type as AgentEvent['type'],
      agent:           (e.agent ?? undefined) as AgentEvent['agent'],
      message:         e.message,
      questions:       e.eventData?.questions as string[] | undefined,
      clarificationId: e.eventData?.clarificationId as string | undefined,
      data:            e.eventData ?? undefined,
    }
  }

  const isDimmed = pending !== null

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm shadow-zinc-900/[0.04]">
      {/* Header — always visible, clickable to collapse/expand */}
      <button
        type="button"
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 bg-white hover:bg-zinc-50/60 transition-colors duration-150"
      >
        <div className="flex items-center gap-2.5">
          {isRunning && (
            <div className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
            </div>
          )}
          {isDone && agentStatus === 'completed' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          )}
          {isDone && agentStatus === 'failed' && (
            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
          )}
          {!isRunning && !isDone && (
            <span className="w-2 h-2 rounded-full bg-zinc-300 shrink-0" />
          )}
          <span className="text-xs font-semibold text-zinc-800 tracking-wide uppercase">
            Agent Activity
          </span>

          {/* Summary pills shown only when collapsed + done */}
          {collapsed && isDone && agentStatus === 'completed' && (
            <div className="flex items-center gap-1.5 ml-1">
              {emailCount > 0 && (
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                  {emailCount} email{emailCount !== 1 ? 's' : ''}
                </span>
              )}
              {milestoneCount > 0 && (
                <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                  {milestoneCount} milestone{milestoneCount !== 1 ? 's' : ''}
                </span>
              )}
              {riskCount > 0 && (
                <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                  {riskCount} risk{riskCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className={cn(
            'text-xs font-mono',
            isRunning ? 'text-indigo-500' :
            agentStatus === 'completed' ? 'text-emerald-600' :
            agentStatus === 'failed'    ? 'text-red-500' : 'text-zinc-400',
          )}>
            {isRunning ? 'Live' : agentStatus === 'completed' ? 'Done' : agentStatus === 'failed' ? 'Failed' : 'Ready'}
          </span>
          <ChevronDown className={cn(
            'w-3.5 h-3.5 text-zinc-400 transition-transform duration-200',
            collapsed ? '' : 'rotate-180',
          )} />
        </div>
      </button>

      {/* Feed — collapsible */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="feed"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div
              ref={scrollRef}
              className="p-5 space-y-1 max-h-[520px] overflow-y-auto scroll-smooth font-mono text-xs"
            >
              <AnimatePresence initial={false}>
                {events.map(ev => (
                  <AgentLine key={ev.id} event={toAgentEvent(ev)} dimmed={isDimmed} />
                ))}
              </AnimatePresence>

              {/* Clarification card */}
              <AnimatePresence>
                {pending && (
                  <ClarificationCard
                    key={pending.clarificationId}
                    {...pending}
                    onSubmitted={() => {
                      setEvents(prev => [...prev, {
                        id:        `local-answered-${Date.now()}`,
                        type:      'clarification_answered',
                        agent:     pending.agent,
                        message:   'Context provided — agent continuing',
                        eventData: { clarificationId: pending.clarificationId, answer: 'Answers submitted' },
                        createdAt: new Date().toISOString(),
                      }])
                      setPending(null)
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Summary card when complete */}
              {agentStatus === 'completed' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <AgentSummary
                    projectId={projectId}
                    emailCount={emailCount}
                    milestoneCount={milestoneCount}
                    riskCount={riskCount}
                    elapsed={0}
                  />
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
