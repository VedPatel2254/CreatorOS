'use client'

import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfidenceBadgeProps {
  confidence: 'high' | 'medium' | 'low'
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  if (confidence === 'high') {
    return (
      <span className="inline-flex items-center text-emerald-400" title="High confidence">
        <CheckCircle className="h-4 w-4" />
      </span>
    )
  }

  if (confidence === 'medium') {
    return (
      <span className="inline-flex items-center text-amber-400" title="Medium confidence">
        <AlertTriangle className="h-4 w-4" />
      </span>
    )
  }

  return (
    <span className="inline-flex items-center text-red-400" title="Low confidence">
      <XCircle className="h-4 w-4" />
    </span>
  )
}

export function ImportBatchStatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    confirmed: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    discarded: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
    pending_review: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  }

  const labels: Record<string, string> = {
    confirmed: 'Confirmed',
    discarded: 'Discarded',
    pending_review: 'Pending Review',
  }

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', classes[status] ?? classes.pending_review)}>
      {labels[status] ?? status}
    </span>
  )
}
