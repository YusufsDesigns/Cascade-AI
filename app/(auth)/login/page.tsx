'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
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

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const result = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (result?.error) {
      toast.error('Invalid email or password.')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-indigo-50/30 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' as const }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/Logo.png" alt="Cascade" width={160} height={48} className="h-12 w-auto" priority />
          </div>
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Welcome back</h1>
          <p className="text-sm text-zinc-500 mt-1.5">Sign in to your Cascade workspace.</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm shadow-zinc-900/5 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
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
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-500 mt-5">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors">
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
