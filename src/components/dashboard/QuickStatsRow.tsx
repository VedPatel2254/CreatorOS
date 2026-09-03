'use client'

import { useRouter } from 'next/navigation'
import { TrendingUp, AlertCircle, Users, Clock, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

type QuickStatsRowProps = {
  billingSummary: { totalEarned: number; totalPaid: number; totalUnpaid: number; totalPending: number } | undefined
  activeClientCount: number | undefined
  overdueCount: number
  invoiceStats: { overdue: number; totalOutstanding: number } | undefined
  currencySymbol: string
  isLoading: boolean
}

export function QuickStatsRow({ billingSummary, activeClientCount, overdueCount, invoiceStats, currencySymbol, isLoading }: QuickStatsRowProps) {
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-5 md:overflow-visible">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-20 min-w-[140px] md:min-w-0 rounded-xl bg-slate-800" />
        ))}
      </div>
    )
  }

  const stats = [
    {
      label: 'Earned',
      value: formatCurrency(billingSummary?.totalEarned ?? 0, currencySymbol),
      icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10',
      onClick: () => router.push('/billing'),
    },
    {
      label: 'Unpaid',
      value: formatCurrency(billingSummary?.totalUnpaid ?? 0, currencySymbol),
      icon: AlertCircle, color: (billingSummary?.totalUnpaid ?? 0) > 0 ? 'text-red-400' : 'text-slate-400', bg: (billingSummary?.totalUnpaid ?? 0) > 0 ? 'bg-red-500/10' : 'bg-slate-700/50',
      onClick: () => router.push('/billing'),
    },
    {
      label: 'Clients',
      value: String(activeClientCount ?? 0),
      icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10',
      onClick: () => router.push('/clients'),
    },
    {
      label: 'Overdue',
      value: String(overdueCount),
      icon: Clock, color: overdueCount > 0 ? 'text-red-400' : 'text-slate-400', bg: overdueCount > 0 ? 'bg-red-500/10' : 'bg-slate-700/50',
      onClick: () => router.push('/work'),
    },
    {
      label: 'Owed',
      value: formatCurrency(invoiceStats?.totalOutstanding ?? 0, currencySymbol),
      icon: FileText, color: (invoiceStats?.overdue ?? 0) > 0 ? 'text-red-400' : 'text-slate-400', bg: (invoiceStats?.overdue ?? 0) > 0 ? 'bg-red-500/10' : 'bg-slate-700/50',
      onClick: () => router.push('/invoices'),
    },
  ]

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-5 md:overflow-visible">
      {stats.map((stat) => (
        <button
          key={stat.label}
          onClick={stat.onClick}
          className="flex items-center gap-3 min-w-[140px] md:min-w-0 p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors text-left"
        >
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', stat.bg)}>
            <stat.icon className={cn('h-4 w-4', stat.color)} />
          </div>
          <div className="min-w-0">
            <p className={cn('text-sm font-bold truncate', stat.color)}>{stat.value}</p>
            <p className="text-xs text-slate-500 truncate">{stat.label}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
