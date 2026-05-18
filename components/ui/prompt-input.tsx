'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

interface PromptInputProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function PromptInput({ className, children, ...props }: PromptInputProps) {
  return (
    <div
      className={cn(
        'flex flex-col border border-zinc-200 bg-white shadow-sm rounded-2xl px-4 py-3 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface PromptInputTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const PromptInputTextarea = React.forwardRef<HTMLTextAreaElement, PromptInputTextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={4}
      className={cn(
        'w-full resize-none bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none',
        className,
      )}
      {...props}
    />
  ),
)
PromptInputTextarea.displayName = 'PromptInputTextarea'

interface PromptInputActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function PromptInputActions({ className, children, ...props }: PromptInputActionsProps) {
  return (
    <div className={cn('flex items-center gap-2 pt-2 border-t border-zinc-100 mt-2', className)} {...props}>
      {children}
    </div>
  )
}

interface PromptInputActionProps {
  tooltip: string
  children: React.ReactNode
}

export function PromptInputAction({ tooltip, children }: PromptInputActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger>{children}</TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-xs">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
}
