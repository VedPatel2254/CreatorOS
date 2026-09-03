'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Circle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type OnboardingChecklistProps = {
  hasClients: boolean
  hasTasks: boolean
  hasInvoices: boolean
  businessNameSet: boolean
  onAddClient: () => void
  onAddTask: () => void
}

const DISMISS_KEY = 'creatoros-onboarding-dismissed'

export function OnboardingChecklist({ hasClients, hasTasks, hasInvoices, businessNameSet, onAddClient, onAddTask }: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === 'true')
  }, [])

  if (dismissed) return null
  if (hasClients && hasTasks && hasInvoices) return null

  const steps = [
    { done: businessNameSet, label: 'Set your business name', action: () => window.location.href = '/settings' },
    { done: hasClients, label: 'Add your first client', action: onAddClient },
    { done: hasTasks, label: 'Add your first task', action: onAddTask },
    { done: hasInvoices, label: 'Generate your first invoice', action: () => window.location.href = '/invoices/new' },
  ]

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true')
    setDismissed(true)
  }

  return (
    <div className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-6 mb-6 relative">
      <button onClick={handleDismiss} className="absolute top-3 right-3 text-slate-400 hover:text-slate-200 transition-colors" aria-label="Dismiss onboarding">
        <X className="h-4 w-4" />
      </button>
      <h3 className="text-lg font-semibold text-slate-100 mb-1">Welcome to CreatorOS!</h3>
      <p className="text-sm text-slate-400 mb-4">Let&apos;s get you set up. Complete these steps to get started.</p>
      <div className="space-y-3">
        {steps.map((step, i) => (
          <button
            key={i}
            onClick={step.action}
            className={cn(
              'flex items-center gap-3 w-full text-left p-2 rounded-lg transition-colors',
              step.done ? 'opacity-60' : 'hover:bg-slate-800/30'
            )}
          >
            {step.done ? (
              <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-slate-500 shrink-0" />
            )}
            <span className={cn('text-sm', step.done ? 'text-slate-400 line-through' : 'text-slate-200')}>
              {step.label}
            </span>
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-4">Each step takes less than a minute.</p>
    </div>
  )
}
