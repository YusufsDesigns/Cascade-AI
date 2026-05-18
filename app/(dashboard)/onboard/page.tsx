'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { ArrowUp, Paperclip, Globe, X, FileText, Zap, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const EXAMPLES = [
  'Acme Corp · E-commerce on Shopify · sarah@acme.com · 12 weeks · deliverables: storefront, Paystack integration, launch',
  'Brightline Studio · Brand redesign + website · hello@brightline.io · 8 weeks · deliverables: logo suite, style guide, Next.js site',
  'Frontier SaaS · Go-to-market support · ceo@frontier.io · 6 weeks · deliverables: pitch deck, landing page, email sequence',
]

export default function OnboardPage() {
  const router = useRouter()
  const [brief, setBrief]           = useState('')
  const [pdfFile, setPdfFile]       = useState<File | null>(null)
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [showUrl, setShowUrl]       = useState(false)
  const [isRunning, setIsRunning]   = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSubmit() {
    if (!brief.trim()) { toast.error('Enter a deal brief first.'); return }
    setIsRunning(true)

    try {
      let body: BodyInit
      let headers: HeadersInit | undefined

      if (pdfFile || websiteUrl) {
        const form = new FormData()
        form.append('brief', brief)
        if (pdfFile)    form.append('pdf', pdfFile)
        if (websiteUrl) form.append('websiteUrl', websiteUrl)
        body = form
      } else {
        body    = JSON.stringify({ brief })
        headers = { 'Content-Type': 'application/json' }
      }

      const res = await fetch('/api/onboard', { method: 'POST', headers, body })

      if (!res.ok) {
        const payload = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(payload.error ?? `Server error ${res.status}`)
      }

      const { projectId } = await res.json() as { projectId: string }
      router.push(`/projects/${projectId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start')
      setIsRunning(false)
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') { toast.error('Only PDF files are supported.'); return }
    if (file.size > 20 * 1024 * 1024)   { toast.error('PDF must be under 20 MB.'); return }
    setPdfFile(file)
    toast.success(`Attached: ${file.name}`)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-57px)] px-8 py-8">
      <div className="w-full max-w-2xl space-y-4">

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          className="text-center space-y-3 mb-2"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-medium text-indigo-600">
            <Zap className="w-3 h-3" />
            Powered by Gemini 2.5 Flash
          </div>
          <h1 className="text-3xl font-semibold text-zinc-900 tracking-tight leading-snug">
            Describe the deal.<br />
            <span className="text-indigo-500">Cascade handles the rest.</span>
          </h1>
        </motion.div>

        {/* Input card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1], delay: 0.05 }}
          className={cn(
            'rounded-2xl bg-white border border-zinc-200',
            'shadow-sm shadow-zinc-900/[0.04]',
            'focus-within:border-indigo-300 focus-within:shadow-indigo-100/60 focus-within:shadow-lg',
            'transition-all duration-200',
          )}
        >
          <textarea
            value={brief}
            onChange={e => setBrief(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit() }}
            disabled={isRunning}
            placeholder="e.g. New client Acme Corp, sarah@acme.com — building an e-commerce store with Shopify. 12 weeks, deliverables: storefront design, Paystack setup, go-live support."
            rows={6}
            className="w-full px-5 pt-4 pb-3 text-sm text-zinc-900 placeholder:text-zinc-400 bg-transparent resize-none focus:outline-none leading-relaxed disabled:opacity-60"
          />

          {/* URL input */}
          <AnimatePresence>
            {showUrl && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden border-t border-zinc-100"
              >
                <div className="flex items-center gap-2 px-4 py-2.5">
                  <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={e => setWebsiteUrl(e.target.value)}
                    placeholder="Client website URL (e.g. https://acmecorp.com)"
                    className="flex-1 text-xs text-zinc-700 bg-transparent focus:outline-none placeholder:text-zinc-400"
                  />
                  <button onClick={() => { setShowUrl(false); setWebsiteUrl('') }} className="text-zinc-300 hover:text-zinc-500 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* PDF badge */}
          <AnimatePresence>
            {pdfFile && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden border-t border-zinc-100"
              >
                <div className="flex items-center gap-2 px-4 py-2.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="text-xs text-zinc-600 flex-1 truncate">{pdfFile.name}</span>
                  <button
                    onClick={() => { setPdfFile(null); if (fileRef.current) fileRef.current.value = '' }}
                    className="text-zinc-300 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions row */}
          <div className="flex items-center gap-2 px-4 pb-3 pt-1.5 border-t border-zinc-100">
            <label className={cn(
              'flex items-center gap-1.5 h-8 px-2.5 rounded-xl text-xs cursor-pointer transition-colors',
              pdfFile ? 'text-indigo-600 bg-indigo-50' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100',
            )}>
              <Paperclip className="w-3.5 h-3.5" />
              <span>PDF</span>
              <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFile} />
            </label>

            <button
              onClick={() => setShowUrl(v => !v)}
              className={cn(
                'flex items-center gap-1.5 h-8 px-2.5 rounded-xl text-xs transition-colors',
                showUrl || websiteUrl ? 'text-indigo-600 bg-indigo-50' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100',
              )}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Website</span>
            </button>

            <span className="text-zinc-200 text-sm">|</span>
            <p className="text-[11px] text-zinc-400 flex-1">⌘ + Enter</p>

            <button
              onClick={handleSubmit}
              disabled={!brief.trim() || isRunning}
              className={cn(
                'flex items-center gap-1.5 h-8 px-4 rounded-xl text-xs font-semibold',
                'bg-indigo-600 text-white',
                'hover:bg-indigo-700 active:scale-[0.97]',
                'shadow-sm shadow-indigo-600/30',
                'transition-all duration-150',
                'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:active:scale-100',
              )}
            >
              {isRunning
                ? <><Loader2 className="w-3 h-3 animate-spin" /> Starting…</>
                : <>Start Cascade <ArrowUp className="w-3 h-3" /></>
              }
            </button>
          </div>
        </motion.div>

        {/* Example briefs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="space-y-2"
        >
          <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Try an example</p>
          <div className="flex flex-col gap-1.5">
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => setBrief(ex)}
                disabled={isRunning}
                className="text-left text-xs text-zinc-500 px-3 py-2 rounded-xl hover:bg-white hover:text-zinc-700 border border-transparent hover:border-zinc-200 transition-all truncate disabled:opacity-40"
              >
                {ex}
              </button>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  )
}
