'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Mail, FileQuestion, CalendarDays, Clock, Check, Pencil, X, Send, FileCheck2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type EmailType = 'WELCOME' | 'QUESTIONNAIRE' | 'CONFIRMATION' | 'FOLLOWUP' | 'FINALIZATION' | 'COMPLETION'
type EmailStatus = 'DRAFT' | 'APPROVED' | 'SENT'

interface Email {
  id: string
  type: EmailType
  subject: string
  recipient: string
  content: string
  status: EmailStatus
}

const typeConfig: Record<EmailType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  WELCOME:       { label: 'Welcome Email',          icon: Mail,          color: 'text-indigo-600',  bg: 'bg-indigo-50'  },
  QUESTIONNAIRE: { label: 'Intake Questionnaire',   icon: FileQuestion,  color: 'text-violet-600',  bg: 'bg-violet-50'  },
  CONFIRMATION:  { label: 'Intake Confirmation',    icon: CalendarDays,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
  FOLLOWUP:      { label: 'Follow-up',              icon: Clock,         color: 'text-amber-600',   bg: 'bg-amber-50'   },
  FINALIZATION:  { label: 'Post-Meeting Summary',   icon: FileCheck2,    color: 'text-blue-600',    bg: 'bg-blue-50'    },
  COMPLETION:    { label: 'Project Completion',     icon: Check,         color: 'text-emerald-600', bg: 'bg-emerald-50' },
}

const statusConfig: Record<EmailStatus, { label: string; dot: string; bg: string; text: string }> = {
  DRAFT:    { label: 'Draft',    dot: 'bg-zinc-400',   bg: 'bg-zinc-100',   text: 'text-zinc-600'   },
  APPROVED: { label: 'Approved', dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  SENT:     { label: 'Sent',     dot: 'bg-blue-500',   bg: 'bg-blue-50',    text: 'text-blue-700'   },
}

export function EmailCard({ email: initial }: { email: Email }) {
  const [email, setEmail] = useState(initial)
  const [isEditing, setIsEditing] = useState(false)
  const [subject, setSubject] = useState(initial.subject)
  const [content, setContent] = useState(initial.content)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)

  const type = typeConfig[email.type]
  const status = statusConfig[email.status]
  const Icon = type.icon
  const isSent = email.status === 'SENT'

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/emails/${email.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, content }),
      })
      if (!res.ok) throw new Error()
      setEmail(prev => ({ ...prev, subject, content }))
      setIsEditing(false)
      toast.success('Changes saved.')
    } catch {
      toast.error('Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  function handleCancelEdit() {
    setSubject(email.subject)
    setContent(email.content)
    setIsEditing(false)
  }

  async function handleSend() {
    setSending(true)
    try {
      const res = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId: email.id }),
      })
      if (!res.ok) throw new Error()
      setEmail(prev => ({ ...prev, status: 'SENT' }))
      toast.success(`${type.label} sent to ${email.recipient}`)
    } catch {
      toast.error('Failed to send email. Check Resend configuration.')
    } finally {
      setSending(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' as const }}
      className="bg-white rounded-2xl border border-zinc-100 shadow-sm shadow-zinc-900/4 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-zinc-100">
        <div className="flex items-start gap-3">
          <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', type.bg)}>
            <Icon className={cn('w-4 h-4', type.color)} />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-0.5">
              {type.label}
            </p>
            {isEditing ? (
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className={cn(
                  'text-sm font-semibold text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-lg',
                  'px-2 py-0.5 w-64 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10',
                  'transition-colors',
                )}
              />
            ) : (
              <p className="text-sm font-semibold text-zinc-900">{email.subject}</p>
            )}
            <p className="text-xs text-zinc-400 mt-0.5">To: {email.recipient}</p>
          </div>
        </div>

        <span className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0',
          status.bg, status.text,
        )}>
          <span className={cn('w-1.5 h-1.5 rounded-full', status.dot)} />
          {status.label}
        </span>
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        {isEditing ? (
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={8}
            className={cn(
              'w-full text-sm text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-xl',
              'px-3 py-2.5 resize-none focus:outline-none focus:border-indigo-400',
              'focus:ring-2 focus:ring-indigo-500/10 transition-colors leading-relaxed',
            )}
          />
        ) : (
          <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap line-clamp-5">
            {email.content}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-5 pb-5">
        {isEditing ? (
          <>
            <button
              onClick={handleCancelEdit}
              disabled={saving}
              className={cn(
                'flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium',
                'bg-white border border-zinc-200 text-zinc-600',
                'hover:bg-zinc-50 hover:border-zinc-300 transition-all duration-150',
                'disabled:opacity-50',
              )}
            >
              <X className="w-3 h-3" /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={cn(
                'flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium',
                'bg-zinc-900 text-white',
                'hover:bg-zinc-700 transition-all duration-150',
                'disabled:opacity-50',
              )}
            >
              <Check className="w-3 h-3" />
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        ) : (
          <>
            {!isSent && (
              <button
                onClick={() => setIsEditing(true)}
                className={cn(
                  'flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium',
                  'bg-white border border-zinc-200 text-zinc-600',
                  'hover:bg-zinc-50 hover:border-zinc-300 transition-all duration-150',
                )}
              >
                <Pencil className="w-3 h-3" /> Edit
              </button>
            )}
            <button
              onClick={handleSend}
              disabled={isSent || sending}
              className={cn(
                'flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium transition-all duration-150',
                isSent
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 disabled:opacity-50',
              )}
            >
              {isSent ? (
                <><Check className="w-3 h-3" /> Sent</>
              ) : (
                <><Send className="w-3 h-3" /> {sending ? 'Sending…' : 'Approve & Send'}</>
              )}
            </button>
          </>
        )}
      </div>
    </motion.div>
  )
}
