'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Microscope, ChevronDown, FileText, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResearchSectionProps {
  contractSummary: string | null
  websiteInsights: string | null
  clientIntelligence: string | null
}

export function ResearchSection({ contractSummary, websiteInsights, clientIntelligence }: ResearchSectionProps) {
  const [open, setOpen] = useState(false)

  if (!contractSummary && !websiteInsights && !clientIntelligence) return null

  return (
    <div id="section-research" className="rounded-2xl border border-zinc-100 bg-white shadow-sm shadow-zinc-900/4 overflow-hidden">
      <button
        onClick={() => setOpen(prev => !prev)}
        className={cn(
          'w-full flex items-center gap-3 px-5 py-4 text-left',
          'hover:bg-zinc-50/60 transition-colors duration-150',
          open && 'border-b border-zinc-100',
        )}
      >
        <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
          <Microscope className="w-4 h-4 text-violet-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-900">Research Agent Findings</p>
          <p className="text-xs text-zinc-400 mt-0.5">Automatically gathered before onboarding began</p>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] }}
        >
          <ChevronDown className="w-4 h-4 text-zinc-400" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-5 py-4 space-y-4">
              {contractSummary && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-3.5 h-3.5 text-violet-400" />
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Contract Summary</p>
                  </div>
                  <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">{contractSummary}</p>
                </div>
              )}

              {websiteInsights && (
                <div className={cn(contractSummary && 'pt-4 border-t border-zinc-50')}>
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-3.5 h-3.5 text-violet-400" />
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Website Insights</p>
                  </div>
                  <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">{websiteInsights}</p>
                </div>
              )}

              {clientIntelligence && !contractSummary && !websiteInsights && (
                <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">{clientIntelligence}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
