'use client'

import { TrendingUp, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'

interface BillingSummaryCardsProps {
  totalEarned: number
  totalPaid: number
  totalUnpaid: number
  totalPending: number
  activeClientCount: number
  currencySymbol: string
  isLoading?: boolean
}

export function BillingSummaryCards({
  totalEarned,
  totalPaid,
  totalUnpaid,
  totalPending,
  activeClientCount,
  currencySymbol,
  isLoading,
}: BillingSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-slate-800/50 border border-slate-700 animate-pulse" />
        ))}
      </div>
    )
  }

  const cards = [
    {
      label: 'Total Earned',
      value: totalEarned,
      sub: `${activeClientCount} client${activeClientCount !== 1 ? 's' : ''}`,
      icon: TrendingUp,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10',
      borderColor: '',
    },
    {
      label: 'Received',
      value: totalPaid,
      sub: 'payments received',
      icon: CheckCircle,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10',
      borderColor: '',
    },
    {
      label: 'Unpaid',
      value: totalUnpaid,
      sub: 'outstanding',
      icon: AlertCircle,
      iconColor: totalUnpaid > 0 ? 'text-red-400' : 'text-slate-400',
      iconBg: totalUnpaid > 0 ? 'bg-red-500/10' : 'bg-slate-500/10',
      borderColor: totalUnpaid > 0 ? 'border-red-500/30 bg-red-500/5' : '',
    },
    {
      label: 'Pending',
      value: totalPending,
      sub: 'expected from pipeline',
      icon: Clock,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10',
      borderColor: '',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={cn(
            'rounded-xl border border-slate-700 p-6 bg-slate-800/50',
            card.borderColor
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', card.iconBg)}>
              <card.icon className={cn('h-5 w-5', card.iconColor)} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-50">{formatCurrency(card.value, currencySymbol)}</div>
          <div className="text-sm text-slate-400 mt-1">{card.sub}</div>
          <div className="text-xs text-slate-500 mt-0.5">{card.label}</div>
        </div>
      ))}
    </div>
  )
}
