'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { RefreshCw, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type FeedLine = { type: string; message: string }

const lineStyles: Record<string, string> = {
  start:   'text-zinc-500',
  agent:   'text-emerald-700 font-semibold',
  step:    'text-zinc-500',
  success: 'text-emerald-600',
  warning: 'text-amber-600',
  error:   'text-red-600',
  done:    'text-emerald-700 font-semibold',
}

export function RerunButton({ projectId }: { projectId: string }) {
  const [running, setRunning]     = useState(false)
  const [done, setDone]           = useState(false)
  const [hasError, setHasError]   = useState(false)
  const [showFeed, setShowFeed]   = useState(false)
  const [lines, setLines]         = useState<FeedLine[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const router    = useRouter()

  function addLine(line: FeedLine) {
    setLines(prev => [...prev, line])
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 40)
  }

  async function handleRerun() {
    setRunning(true)
    setDone(false)
    setHasError(false)
    setLines([])
    setShowFeed(true)

    try {
      const res = await fetch(`/api/projects/${projectId}/rerun`, { method: 'POST' })
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No stream')

      const decoder = new TextDecoder()
      while (true) {
        const { done: streamDone, value } = await reader.read()
        if (streamDone) break

        for (const chunk of decoder.decode(value).split('\n')) {
          if (!chunk.startsWith('data: ')) continue
          try {
            const event = JSON.parse(chunk.slice(6)) as FeedLine
            addLine(event)
            if (event.type === 'done')  { setDone(true);     setRunning(false); router.refresh() }
            if (event.type === 'error') { setHasError(true); setRunning(false) }
          } catch { /* malformed chunk */ }
        }
      }
    } catch (err) {
      addLine({ type: 'error', message: `Failed to connect: ${err instanceof Error ? err.message : 'unknown'}` })
      setHasError(true)
      setRunning(false)
    }
  }

  return (
    <div className="w-full">
      <button
        onClick={handleRerun}
        disabled={running}
        className={cn(
          'flex items-center gap-1.5 h-7 px-3 rounded-xl text-xs font-medium transition-all duration-150',
          'bg-white border border-zinc-200 text-zinc-600',
          'hover:bg-zinc-50 hover:border-zinc-300 active:scale-[0.97]',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        )}
      >
        <RefreshCw className={cn('w-3 h-3', running && 'animate-spin')} />
        {running ? 'Running…' : 'Rerun agent'}
      </button>

      <AnimatePresence>
        {showFeed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] }}
            style={{ overflow: 'hidden' }}
            className="mt-3"
          >
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 overflow-hidden">
              {/* Feed header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-100 bg-white">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    running   ? 'bg-emerald-500 animate-pulse' :
                    hasError  ? 'bg-red-400' :
                    done      ? 'bg-emerald-500' : 'bg-zinc-300',
                  )} />
                  <span className="text-xs font-semibold text-zinc-700">Communication Agent</span>
                  {done && <span className="text-[10px] text-emerald-600 font-medium">complete</span>}
                  {hasError && <span className="text-[10px] text-red-500 font-medium">failed</span>}
                </div>
                {!running && (
                  <button
                    onClick={() => setShowFeed(false)}
                    className="text-zinc-300 hover:text-zinc-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Feed lines */}
              <div className="p-4 space-y-1 max-h-56 overflow-y-auto font-mono">
                {lines.map((line, i) => (
                  <div
                    key={i}
                    className={cn(
                      'text-xs leading-relaxed',
                      lineStyles[line.type] ?? 'text-zinc-500',
                      line.type === 'step' && 'pl-3',
                    )}
                  >
                    {line.message}
                  </div>
                ))}
                {running && lines.length === 0 && (
                  <div className="text-xs text-zinc-400 animate-pulse">Connecting…</div>
                )}
                <div ref={bottomRef} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
