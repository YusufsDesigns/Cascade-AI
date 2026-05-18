'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Check, CheckCircle2, Zap, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Question {
  id: string
  question: string
  type: 'text' | 'textarea' | 'select' | 'checkbox'
  required: boolean
  options?: string[]
}

type PageState = 'loading' | 'error' | 'already_submitted' | 'form' | 'success'

export default function IntakePage() {
  const params = useParams()
  const projectId = params.projectId as string
  const token     = params.token as string

  const [pageState, setPageState]   = useState<PageState>('loading')
  const [questions, setQuestions]   = useState<Question[]>([])
  const [step, setStep]             = useState(0)
  const [direction, setDirection]   = useState(1)
  const [answers, setAnswers]       = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [clientName, setClientName] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/intake/${projectId}`)
        if (res.status === 404) { setPageState('error'); return }
        if (!res.ok) { setPageState('error'); return }

        const data = await res.json() as {
          questions: Question[]
          submittedAt: string | null
          clientName?: string
        }

        if (data.submittedAt) { setPageState('already_submitted'); return }
        if (!data.questions?.length) { setPageState('error'); return }

        setQuestions(data.questions)
        if (data.clientName) setClientName(data.clientName)
        setPageState('form')
      } catch {
        setPageState('error')
      }
    }
    load()
  }, [projectId])

  const progress = questions.length > 0
    ? Math.round(((step + 1) / questions.length) * 100)
    : 0

  const current = questions[step]

  function goNext() {
    if (current?.required && !answers[current.id]?.trim()) {
      toast.error('Please answer this question before continuing.')
      return
    }
    setDirection(1)
    setStep(s => s + 1)
  }

  function goBack() {
    setDirection(-1)
    setStep(s => s - 1)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey && current?.type !== 'textarea') {
      e.preventDefault()
      if (step < questions.length - 1) goNext()
    }
  }

  async function handleSubmit() {
    if (current?.required && !answers[current.id]?.trim()) {
      toast.error('Please answer this question before submitting.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/intake/${projectId}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ answers, token }),
      })

      if (res.status === 409) {
        setPageState('already_submitted')
        return
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error ?? 'Submission failed')
      }

      setPageState('success')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const slideVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 28 : -28 }),
    center: { opacity: 1, x: 0 },
    exit:  (dir: number) => ({ opacity: 0, x: dir > 0 ? -28 : 28 }),
  }

  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-indigo-50/20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          <p className="text-xs text-zinc-400">Loading your form…</p>
        </div>
      </div>
    )
  }

  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-indigo-50/20 flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-red-50 mb-4">
            <span className="text-xl">⚠</span>
          </div>
          <h1 className="text-lg font-semibold text-zinc-900 mb-2">Form not found</h1>
          <p className="text-sm text-zinc-500 leading-relaxed">
            This link may be invalid or expired. Contact your account manager for a new link.
          </p>
        </div>
      </div>
    )
  }

  if (pageState === 'already_submitted') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-indigo-50/20 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm text-center"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 mb-5">
            <Check className="w-6 h-6 text-emerald-600" />
          </div>
          <h1 className="text-lg font-semibold text-zinc-900 mb-2">Already submitted</h1>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Your intake form was already submitted. Your account manager has been notified and will be in touch shortly.
          </p>
        </motion.div>
      </div>
    )
  }

  if (pageState === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-indigo-50/20 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-sm text-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 mb-6"
          >
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          </motion.div>

          <h1 className="text-xl font-semibold text-zinc-900 mb-2">
            You&apos;re all set{clientName ? `, ${clientName}` : ''}!
          </h1>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-xs mx-auto">
            Your responses have been received. We&apos;re reviewing everything now and will confirm your next steps by email shortly.
          </p>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-zinc-400">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            Powered by Cascade AI
          </div>
        </motion.div>
      </div>
    )
  }

  // Form state
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-indigo-50/20 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">

        {/* Branding */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 shadow-sm shadow-indigo-600/30 mb-3">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <p className="text-sm font-bold text-zinc-900 tracking-tight">Cascade</p>
          <p className="text-xs text-zinc-400 mt-0.5">Client Onboarding Form</p>
        </motion.div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-zinc-400 font-medium">
              Question {step + 1} of {questions.length}
            </span>
            <span className="text-[11px] text-zinc-400 font-medium">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm shadow-zinc-900/4"
            >
              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-600">
                  {step + 1}
                </span>
                {current.required && (
                  <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Required</span>
                )}
              </div>

              {/* Question */}
              <p className="text-sm font-semibold text-zinc-900 leading-snug mb-4">
                {current.question}
              </p>

              {/* Input */}
              <QuestionInput
                question={current}
                value={answers[current.id] ?? ''}
                onChange={val => setAnswers(prev => ({ ...prev, [current.id]: val }))}
                onKeyDown={handleKeyDown}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={goBack}
            disabled={step === 0}
            className={cn(
              'flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-medium transition-colors',
              step === 0
                ? 'text-zinc-300 cursor-not-allowed'
                : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100',
            )}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back
          </button>

          {step < questions.length - 1 ? (
            <button
              onClick={goNext}
              className="flex items-center gap-1.5 h-9 px-5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-sm shadow-indigo-600/25 transition-all duration-150"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-1.5 h-9 px-5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm shadow-emerald-600/25 transition-all duration-150 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          )}
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-1.5 mt-5">
          {questions.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === step
                  ? 'w-5 bg-indigo-500'
                  : i < step
                    ? 'w-1.5 bg-indigo-200'
                    : 'w-1.5 bg-zinc-200',
              )}
            />
          ))}
        </div>

      </div>
    </div>
  )
}

function QuestionInput({
  question,
  value,
  onChange,
  onKeyDown,
}: {
  question: Question
  value: string
  onChange: (v: string) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
}) {
  const baseInput = 'w-full px-3 py-2.5 rounded-xl text-sm text-zinc-900 bg-white border border-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-colors duration-150'

  if (question.type === 'textarea') {
    return (
      <textarea
        rows={4}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Your answer…"
        className={cn(baseInput, 'resize-none leading-relaxed')}
        autoFocus
      />
    )
  }

  if (question.type === 'select' && question.options?.length) {
    return (
      <div className="space-y-2">
        {question.options.map(opt => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={cn(
              'w-full text-left px-4 py-2.5 rounded-xl text-sm border transition-all duration-150',
              value === opt
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50',
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    )
  }

  if (question.type === 'checkbox' && question.options?.length) {
    const selected = value ? value.split(',').map(s => s.trim()).filter(Boolean) : []

    function toggle(opt: string) {
      const next = selected.includes(opt)
        ? selected.filter(s => s !== opt)
        : [...selected, opt]
      onChange(next.join(', '))
    }

    return (
      <div className="space-y-2">
        {question.options.map(opt => {
          const checked = selected.includes(opt)
          return (
            <button
              key={opt}
              onClick={() => toggle(opt)}
              className={cn(
                'w-full text-left px-4 py-2.5 rounded-xl text-sm border transition-all duration-150 flex items-center gap-3',
                checked
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                  : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50',
              )}
            >
              <span className={cn(
                'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                checked ? 'bg-indigo-600 border-indigo-600' : 'border-zinc-300',
              )}>
                {checked && <Check className="w-2.5 h-2.5 text-white" />}
              </span>
              {opt}
            </button>
          )
        })}
      </div>
    )
  }

  // Default: text
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder="Your answer…"
      className={baseInput}
      autoFocus
    />
  )
}
