'use client'

import type { ComponentType } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, Globe, ExternalLink, Sparkles, AlertTriangle,
  ArrowRight, PenLine, Send, CheckSquare, ShieldAlert,
  MessageSquare, Share2, Mail, LayoutGrid, Check,
  XCircle, Microscope, GitBranch, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type AgentEventType =
  | 'start' | 'agent' | 'thinking' | 'reading_doc' | 'reading_web'
  | 'searching' | 'intelligence' | 'discrepancy' | 'step' | 'generating'
  | 'email_sent' | 'question_saved' | 'milestone_saved' | 'risk'
  | 'clarification' | 'clarification_answered' | 'delegate' | 'parallel_start'
  | 'success' | 'done' | 'error' | 'meeting_requested'

export type AgentId = 'system' | 'research' | 'orchestrator' | 'comms' | 'project' | 'reactivation'

export interface AgentEvent {
  type: AgentEventType
  agent?: AgentId
  message: string
  questions?: string[]
  clarificationId?: string
  projectId?: string
  data?: Record<string, unknown>
}

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1]

type AgentMeta = {
  label: string
  color: string
  dividerColor: string
  Icon: ComponentType<{ className?: string }>
}

const AGENT_META: Record<AgentId, AgentMeta> = {
  system:       { label: 'System',             color: 'text-zinc-500',    dividerColor: 'bg-zinc-200',    Icon: Zap },
  research:     { label: 'Research Agent',     color: 'text-violet-600',  dividerColor: 'bg-violet-200',  Icon: Microscope },
  orchestrator: { label: 'Orchestrator',       color: 'text-indigo-600',  dividerColor: 'bg-indigo-200',  Icon: GitBranch },
  comms:        { label: 'Communication Agent',color: 'text-emerald-600', dividerColor: 'bg-emerald-200', Icon: Mail },
  project:      { label: 'Project Agent',      color: 'text-blue-600',    dividerColor: 'bg-blue-200',    Icon: LayoutGrid },
  reactivation: { label: 'Reactivation Agent', color: 'text-violet-600',  dividerColor: 'bg-violet-200',  Icon: Sparkles },
}

export function AgentLine({ event, dimmed = false }: { event: AgentEvent; dimmed?: boolean }) {
  const opacity = dimmed ? 0.6 : 1
  const dClass = dimmed ? 'pointer-events-none' : ''

  switch (event.type) {
    case 'agent': {
      const meta = AGENT_META[event.agent ?? 'system'] ?? AGENT_META.system
      const { Icon } = meta
      return (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity, y: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className={cn('flex items-center gap-2 py-2 mt-3', dClass)}
        >
          <Icon className={cn('w-3.5 h-3.5 shrink-0', meta.color)} />
          <span className={cn('font-semibold text-xs', meta.color)}>{meta.label}</span>
          <div className={cn('flex-1 h-px', meta.dividerColor)} />
          <span className="text-zinc-400 text-[10px]">activated</span>
        </motion.div>
      )
    }

    case 'thinking':
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity }}
          transition={{ duration: 0.2 }}
          className={cn('flex items-center gap-1.5 pl-5 py-0.5', dClass)}
        >
          <div className="flex gap-0.5">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1 h-1 rounded-full bg-zinc-300"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
          <span className="text-zinc-400 text-[10px]">thinking...</span>
        </motion.div>
      )

    case 'reading_doc':
      return (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity, y: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className={cn('flex items-center gap-2 pl-5 py-0.5 text-violet-600', dClass)}
        >
          <FileText className="w-3 h-3 shrink-0" />
          <span className="truncate flex-1">{event.message}</span>
          <motion.div
            className="h-px bg-violet-200 w-14 shrink-0"
            initial={{ scaleX: 0, originX: '0%' }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 2.5, ease: 'easeOut' }}
          />
        </motion.div>
      )

    case 'searching':
      return (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity, y: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className={cn('flex items-center gap-2 pl-5 py-0.5 text-violet-500', dClass)}
        >
          <Globe className="w-3 h-3 shrink-0 animate-spin" style={{ animationDuration: '3s' }} />
          <span>{event.message}</span>
        </motion.div>
      )

    case 'reading_web':
      return (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity, y: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className={cn('flex items-center gap-2 pl-5 py-0.5 text-violet-500', dClass)}
        >
          <ExternalLink className="w-3 h-3 shrink-0" />
          <span>{event.message}</span>
        </motion.div>
      )

    case 'intelligence':
      return (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity, y: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className={cn('flex items-start gap-2 pl-5 py-0.5', dClass)}
        >
          <Sparkles className="w-3 h-3 text-violet-500 shrink-0 mt-0.5" />
          <span className="text-violet-700">{event.message}</span>
        </motion.div>
      )

    case 'discrepancy':
      return (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity, y: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className={cn('flex items-start gap-2 pl-4 py-1.5 rounded-lg bg-amber-50 border border-amber-200 my-1', dClass)}
        >
          <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
          <span className="text-amber-700 font-medium">{event.message}</span>
        </motion.div>
      )

    case 'step':
      return (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity, y: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className={cn('flex items-center gap-2 pl-5 py-0.5 text-zinc-500', dClass)}
        >
          <ArrowRight className="w-3 h-3 shrink-0" />
          <span>{event.message}</span>
        </motion.div>
      )

    case 'generating':
      return (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity, y: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className={cn('flex items-center gap-2 pl-5 py-0.5 text-zinc-600', dClass)}
        >
          <PenLine className="w-3 h-3 shrink-0" />
          <span>{event.message}</span>
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="text-zinc-300"
          >
            |
          </motion.span>
        </motion.div>
      )

    case 'email_sent':
      return (
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity, x: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
          className={cn('flex items-center gap-2 pl-4 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 my-1', dClass)}
        >
          <Send className="w-3 h-3 text-emerald-600 shrink-0" />
          <span className="text-emerald-700 font-medium flex-1">{event.message}</span>
          <span className="text-emerald-500 text-[10px]">delivered</span>
        </motion.div>
      )

    case 'question_saved':
      return (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity, y: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className={cn('flex items-center gap-2 pl-5 py-0.5 text-emerald-600', dClass)}
        >
          <MessageSquare className="w-3 h-3 shrink-0" />
          <span>{event.message}</span>
        </motion.div>
      )

    case 'milestone_saved':
      return (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity, y: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className={cn('flex items-center gap-2 pl-5 py-0.5 text-blue-600', dClass)}
        >
          <CheckSquare className="w-3 h-3 shrink-0" />
          <span>{event.message}</span>
        </motion.div>
      )

    case 'risk':
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity, scale: 1 }}
          transition={{ duration: 0.25, ease: EASE }}
          className={cn('flex items-start gap-2 pl-4 py-2 rounded-lg bg-red-50 border border-red-200 my-1.5', dClass)}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <span className="text-red-700 font-semibold text-[10px] uppercase tracking-wider block">
              Risk Identified
            </span>
            <p className="text-red-600 mt-0.5">{event.message}</p>
          </div>
        </motion.div>
      )

    case 'clarification':
      return (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity, y: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className={cn('flex items-center gap-2 pl-5 py-0.5', dClass)}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <span className="text-indigo-600 font-medium">Agent paused — waiting for context...</span>
        </motion.div>
      )

    case 'clarification_answered': {
      const answer = event.data?.answer as string | undefined
      return (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity, y: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className={cn('flex items-center gap-1.5 pl-5 py-0.5 text-emerald-600', dClass)}
        >
          <MessageSquare className="w-3 h-3 shrink-0" />
          {answer && (
            <span className="italic text-zinc-400 truncate max-w-[180px]">"{answer}"</span>
          )}
          <ArrowRight className="w-3 h-3 shrink-0" />
          <span>Agent continuing</span>
        </motion.div>
      )
    }

    case 'delegate':
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity }}
          transition={{ duration: 0.2 }}
          className={cn('flex items-center gap-3 py-2 my-1', dClass)}
        >
          <div className="flex-1 h-px bg-zinc-200" />
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-200 bg-indigo-50 shrink-0">
            <Share2 className="w-3 h-3 text-indigo-500" />
            <span className="text-indigo-600 text-[10px] font-medium">Delegating to agents</span>
          </div>
          <div className="flex-1 h-px bg-zinc-200" />
        </motion.div>
      )

    case 'parallel_start':
      return (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity, y: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
          className={cn('flex items-center gap-2 py-1.5 my-1', dClass)}
        >
          <div className="flex-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50">
            <Mail className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="text-emerald-700 text-[10px] font-medium">Communication Agent</span>
            <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse ml-auto" />
          </div>
          <div className="flex-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50">
            <LayoutGrid className="w-3 h-3 text-blue-600 shrink-0" />
            <span className="text-blue-700 text-[10px] font-medium">Project Agent</span>
            <div className="w-1 h-1 rounded-full bg-blue-400 animate-pulse ml-auto" />
          </div>
        </motion.div>
      )

    case 'success':
      return (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity, y: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className={cn('flex items-center gap-2 pl-5 py-0.5 text-emerald-600', dClass)}
        >
          <Check className="w-3 h-3 shrink-0" />
          <span>{event.message}</span>
        </motion.div>
      )

    case 'error':
      return (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity, y: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className={cn('flex items-start gap-2 pl-4 py-1.5 rounded-lg bg-red-50 border border-red-200 my-1', dClass)}
        >
          <XCircle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
          <span className="text-red-700">{event.message}</span>
        </motion.div>
      )

    case 'meeting_requested':
      return (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity, y: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
          className={cn('flex items-center gap-2 pl-5 py-0.5', dClass)}
        >
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[11px] font-semibold">
            <MessageSquare className="w-3 h-3 shrink-0" />
            Meeting requested — pending PM review
          </span>
        </motion.div>
      )

    case 'start':
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: opacity * 0.7 }}
          transition={{ duration: 0.3 }}
          className={cn('flex items-center gap-2 py-0.5 text-zinc-400', dClass)}
        >
          <Zap className="w-3 h-3 shrink-0" />
          <span>{event.message}</span>
        </motion.div>
      )

    default:
      return null
  }
}
