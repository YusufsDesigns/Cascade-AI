'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Plus, Trash2, Loader2, Users, Building2, User, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
}

interface Props {
  user: { name: string; email: string; companyName: string }
  initialMembers: TeamMember[]
}

const roleColors: Record<string, { bg: string; text: string }> = {
  pm:                { bg: 'bg-violet-50',  text: 'text-violet-700'  },
  'project manager': { bg: 'bg-violet-50',  text: 'text-violet-700'  },
  designer:          { bg: 'bg-pink-50',    text: 'text-pink-700'    },
  developer:         { bg: 'bg-blue-50',    text: 'text-blue-700'    },
  engineer:          { bg: 'bg-blue-50',    text: 'text-blue-700'    },
  qa:                { bg: 'bg-emerald-50', text: 'text-emerald-700' },
}

function roleStyle(role: string) {
  return roleColors[role.toLowerCase()] ?? { bg: 'bg-zinc-100', text: 'text-zinc-600' }
}

const itemVariants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } },
  exit:    { opacity: 0, x: 12, transition: { duration: 0.18 } },
}

export function SettingsClient({ user, initialMembers }: Props) {
  const [members, setMembers]         = useState<TeamMember[]>(initialMembers)
  const [showForm, setShowForm]       = useState(false)
  const [name, setName]               = useState('')
  const [email, setEmail]             = useState('')
  const [role, setRole]               = useState('')
  const [adding, setAdding]           = useState(false)
  const [deletingId, setDeletingId]   = useState<string | null>(null)

  async function handleAdd() {
    if (!name.trim() || !email.trim() || !role.trim()) {
      toast.error('Name, email, and role are required.')
      return
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRe.test(email.trim())) {
      toast.error('Enter a valid email address.')
      return
    }

    setAdding(true)
    try {
      const res = await fetch('/api/team', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: name.trim(), email: email.trim(), role }),
      })

      const data = await res.json() as TeamMember & { error?: string }

      if (!res.ok) {
        toast.error(data.error ?? 'Failed to add member.')
        return
      }

      setMembers(prev => [...prev, data])
      setName('')
      setEmail('')
      setRole('')
      setShowForm(false)
      toast.success(`${data.name} added to the team.`)
    } catch {
      toast.error('Something went wrong. Try again.')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id: string, memberName: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/team/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        toast.error('Failed to remove member.')
        return
      }
      setMembers(prev => prev.filter(m => m.id !== id))
      toast.success(`${memberName} removed from the team.`)
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="px-8 py-8 max-w-3xl mx-auto">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="mb-8"
      >
        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Settings</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Manage your account and team</p>
      </motion.div>

      {/* Account section */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.05, ease: 'easeOut' }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-4 h-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-900">Account</h2>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm shadow-zinc-900/4 divide-y divide-zinc-100">
          {[
            { label: 'Name',    value: user.name },
            { label: 'Email',   value: user.email },
            { label: 'Company', value: user.companyName },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-4 px-5 py-3.5">
              <span className="text-xs font-medium text-zinc-400 w-20 shrink-0">{label}</span>
              <span className="text-sm text-zinc-700">{value}</span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Team Members section */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.1, ease: 'easeOut' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-900">Team Members</h2>
            {members.length > 0 && (
              <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">{members.length}</span>
            )}
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className={cn(
              'flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold transition-all duration-150',
              showForm
                ? 'bg-zinc-100 text-zinc-600'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/20',
            )}
          >
            <Plus className={cn('w-3.5 h-3.5 transition-transform duration-200', showForm && 'rotate-45')} />
            {showForm ? 'Cancel' : 'Add member'}
          </button>
        </div>

        {/* Empty team warning */}
        {members.length === 0 && !showForm && (
          <div className="mb-3 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-700">No team members yet</p>
              <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
                The Project Agent can't assign milestone owners until you add your team. Add at least one member per role you need.
              </p>
            </div>
          </div>
        )}

        {/* Add member form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden mb-3"
            >
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-semibold text-indigo-700">New team member</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Jane Smith"
                      className="w-full h-9 px-3 rounded-xl text-sm text-zinc-900 bg-white border border-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="jane@company.com"
                      className="w-full h-9 px-3 rounded-xl text-sm text-zinc-900 bg-white border border-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Role</label>
                  <input
                    type="text"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    placeholder="e.g. Developer, Designer, Copywriter…"
                    className="w-full h-9 px-3 rounded-xl text-sm text-zinc-900 bg-white border border-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-colors"
                  />
                </div>
                <div className="pt-1">
                  <button
                    onClick={handleAdd}
                    disabled={adding || !name.trim() || !email.trim() || !role.trim()}
                    className="flex items-center gap-1.5 h-8 px-4 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-sm shadow-indigo-600/20"
                  >
                    {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                    {adding ? 'Adding…' : 'Add to team'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Members list */}
        {members.length === 0 && !showForm ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-10 text-center">
            <div className="w-11 h-11 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-3">
              <User className="w-5 h-5 text-zinc-400" />
            </div>
            <p className="text-sm font-semibold text-zinc-600 mb-1">No team members yet</p>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
              Add your team so agents can assign the right owners to project milestones.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm shadow-zinc-900/4 overflow-hidden">
            <AnimatePresence initial={false}>
              {members.map((member, i) => {
                return (
                  <motion.div
                    key={member.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className={cn(
                      'flex items-center gap-4 px-5 py-3.5 transition-colors',
                      i < members.length - 1 && 'border-b border-zinc-100',
                    )}
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-indigo-600">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Name + email */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">{member.name}</p>
                      <p className="text-xs text-zinc-400 truncate">{member.email}</p>
                    </div>

                    {/* Role badge */}
                    <span className={cn(
                      'text-xs font-medium px-2.5 py-1 rounded-full shrink-0',
                      roleStyle(member.role).bg, roleStyle(member.role).text,
                    )}>
                      {member.role}
                    </span>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(member.id, member.name)}
                      disabled={deletingId === member.id}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-300 hover:text-red-400 hover:bg-red-50 disabled:opacity-50 transition-all duration-150 shrink-0"
                      aria-label={`Remove ${member.name}`}
                    >
                      {deletingId === member.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />
                      }
                    </button>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}

        <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
          Team member roles are used by the Project Agent to assign milestone owners automatically.
        </p>
      </motion.section>
    </div>
  )
}
