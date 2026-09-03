'use client'

import Link from 'next/link'
import { TrendingUp, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

type BillingSummaryCardsProps = {
  summary: { totalEarned: number; totalPaid: number; totalUnpaid: number; totalPending: number } | undefined
  currencySymbol: string
  isLoading: boolean
}

export function BillingSummaryCards({ summary, currencySymbol, isLoading }: BillingSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl bg-slate-800" />)}
      </div>
    )
  }

  if (!summary) return null

  const cards = [
    { label: 'Earned', value: summary.totalEarned, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Received', value: summary.totalPaid, icon: CheckCircle, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Unpaid', value: summary.totalUnpaid, icon: AlertCircle, color: summary.totalUnpaid > 0 ? 'text-red-400' : 'text-slate-400', bg: summary.totalUnpaid > 0 ? 'bg-red-500/10' : 'bg-slate-700/50' },
    { label: 'Pending', value: summary.totalPending, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ]

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {cards.map(card => (
          <div key={card.label} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2', card.bg)}>
              <card.icon className={cn('h-4 w-4', card.color)} />
            </div>
            <p className={cn('text-xl font-bold', card.color)}>
              {formatCurrency(card.value, currencySymbol)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>
      <Link href="/billing" className="text-xs text-violet-400 hover:text-violet-300 mt-3 inline-block">
        View Full Billing →
      </Link>
    </div>
  )
}
