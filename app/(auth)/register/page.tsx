'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const inputCls = cn(
  'w-full h-10 px-3 rounded-lg text-sm bg-white text-zinc-900',
  'border border-zinc-200 placeholder:text-zinc-400',
  'focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10',
  'transition-colors duration-150',
)

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ companyName: '', name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) {
        toast.error(data.error ?? 'Registration failed.')
      } else {
        toast.success('Account created — sign in to continue.')
        router.push('/login')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-50 via-white to-indigo-50/30 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' as const }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/Logo.png" alt="Cascade" width={160} height={48} className="h-12 w-auto" priority />
          </div>
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Create your workspace</h1>
          <p className="text-sm text-zinc-500 mt-1.5">Start automating client onboarding with AI.</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm shadow-zinc-900/5 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">Company name</label>
                <input
                  type="text"
                  required
                  value={form.companyName}
                  onChange={set('companyName')}
                  placeholder="Acme Agency"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">Your name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={set('name')}
                  placeholder="Sarah Chen"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">Work email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={set('email')}
                placeholder="sarah@acme.com"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={set('password')}
                placeholder="Min. 8 characters"
                className={inputCls}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full h-10 rounded-lg text-sm font-medium mt-1',
                'bg-indigo-600 text-white',
                'hover:bg-indigo-700 active:bg-indigo-800',
                'shadow-sm shadow-indigo-600/20',
                'transition-all duration-150',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-500 mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
