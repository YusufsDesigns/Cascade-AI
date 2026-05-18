'use client'

import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ActionItem {
  id: string
  title: string
  description: string
  sectionId: string
  cta: string
}

function scrollTo(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const itemVariants = {
  hidden:  { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] as [number,number,number,number] } },
}

export function ActionItemsSection({ items }: { items: ActionItem[] }) {
  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-emerald-200 bg-emerald-50 mb-6"
      >
        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
        <div>
          <p className="text-sm font-medium text-emerald-800">Everything is on track</p>
          <p className="text-xs text-emerald-600 mt-0.5">No action needed right now.</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-2 mb-6"
    >
      {items.map(item => (
        <motion.div
          key={item.id}
          variants={itemVariants}
          className="flex items-start gap-3 px-4 py-3.5 rounded-xl border border-amber-200 bg-amber-50"
        >
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-900">{item.title}</p>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">{item.description}</p>
          </div>
          <button
            onClick={() => scrollTo(item.sectionId)}
            className={cn(
              'shrink-0 text-xs font-medium text-amber-700',
              'underline underline-offset-2 hover:text-amber-900 transition-colors',
            )}
          >
            {item.cta}
          </button>
        </motion.div>
      ))}
    </motion.div>
  )
}
