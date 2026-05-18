'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { AgentLine, type AgentEvent } from './AgentLine'
import { LiveAgentFeed } from './LiveAgentFeed'
import { cn } from '@/lib/utils'

interface DbEvent {
  id:        string
  type:      string
  agent:     string | null
  message:   string
  eventData: Record<string, unknown> | null
  createdAt: string
  runType:   string
}

interface AgentRun {
  runType:   string
  events:    DbEvent[]
  startedAt: string
}

const RUN_LABELS: Record<string, string> = {
  initial:      'Initial onboarding',
  reactivation: 'Intake received',
  finalization: 'Post-meeting finalisation',
  completion:   'Project completion',
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

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

function PastRunFeed({ events }: { events: DbEvent[] }) {
  const emailCount     = events.filter(e => e.type === 'email_sent').length
  const milestoneCount = events.filter(e => e.type === 'milestone_saved').length
  const riskCount      = events.filter(e => e.type === 'risk').length

  return (
    <div className="p-4 space-y-0.5 max-h-[360px] overflow-y-auto font-mono text-xs">
      {events.map(ev => (
        <AgentLine key={ev.id} event={toAgentEvent(ev)} dimmed={false} />
      ))}
      {(emailCount > 0 || milestoneCount > 0 || riskCount > 0) && (
        <div className="flex items-center gap-2 pt-3 mt-1 border-t border-zinc-100">
          {emailCount > 0 && (
            <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-medium">
              {emailCount} email{emailCount !== 1 ? 's' : ''}
            </span>
          )}
          {milestoneCount > 0 && (
            <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full font-medium">
              {milestoneCount} milestone{milestoneCount !== 1 ? 's' : ''}
            </span>
          )}
          {riskCount > 0 && (
            <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full font-medium">
              {riskCount} risk{riskCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

interface Props {
  projectId:    string
  runs:         AgentRun[]
  agentStatus:  string
}

export function RunHistory({ projectId, runs, agentStatus }: Props) {
  if (runs.length === 0) return null

  const latestRun = runs[runs.length - 1]
  const pastRuns  = runs.slice(0, -1)

  const [expandedPast, setExpandedPast] = useState<string | null>(null)

  const isCurrentlyRunning = agentStatus === 'running'

  return (
    <div className="space-y-3 mb-6">
      {/* Past runs — collapsed by default */}
      {pastRuns.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-0.5">
            Run history
          </p>
          {pastRuns.map(run => {
            const isOpen   = expandedPast === run.runType
            const label    = RUN_LABELS[run.runType] ?? run.runType
            const hasFailed = run.events.some(e => e.type === 'error')
            return (
              <div
                key={run.runType}
                className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm shadow-zinc-900/[0.04]"
              >
                <button
                  type="button"
                  onClick={() => setExpandedPast(isOpen ? null : run.runType)}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-zinc-50/60 transition-colors duration-150"
                >
                  <div className="flex items-center gap-2.5">
                    {hasFailed
                      ? <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    }
                    <span className="text-xs font-semibold text-zinc-700">{label}</span>
                    <span className="text-[10px] text-zinc-400 font-mono">{formatDateTime(run.startedAt)}</span>
                  </div>
                  <ChevronDown className={cn(
                    'w-3.5 h-3.5 text-zinc-400 transition-transform duration-200',
                    isOpen && 'rotate-180',
                  )} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                      className="overflow-hidden border-t border-zinc-100"
                    >
                      <PastRunFeed events={run.events} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}

      {/* Latest / current run — uses LiveAgentFeed for live polling */}
      <div>
        {pastRuns.length > 0 && (
          <div className="flex items-center gap-2 mb-2 px-0.5">
            <Clock className="w-3 h-3 text-zinc-400" />
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              {isCurrentlyRunning ? 'Current run' : 'Latest run'}
              {' — '}
              {RUN_LABELS[latestRun.runType] ?? latestRun.runType}
            </p>
          </div>
        )}
        <LiveAgentFeed
          projectId={projectId}
          initialEvents={latestRun.events.map(e => ({
            id:        e.id,
            type:      e.type,
            agent:     e.agent,
            message:   e.message,
            eventData: e.eventData,
            createdAt: e.createdAt,
          }))}
          initialAgentStatus={agentStatus}
        />
      </div>
    </div>
  )
}
