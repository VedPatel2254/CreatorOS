'use client'

import Link from 'next/link'
import { FileText } from 'lucide-react'
import { InvoiceWithClientName } from '@/types'
import { InvoiceStatusBadge } from '@/components/invoices/InvoiceStatusBadge'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

type RecentInvoicesProps = {
  invoices: InvoiceWithClientName[]
  isLoading: boolean
  currencySymbol: string
}

export function RecentInvoices({ invoices, isLoading, currencySymbol }: RecentInvoicesProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 rounded-lg bg-slate-800" />)}
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-6">
        <FileText className="h-8 w-8 text-slate-600 mx-auto mb-2" />
        <p className="text-sm text-slate-400">No invoices yet.</p>
        <Link href="/invoices/new" className="text-xs text-violet-400 hover:text-violet-300 mt-1 inline-block">
          Generate your first invoice →
        </Link>
      </div>
    )
  }

  return (
    <div>
      {invoices.map(invoice => {
        const isOverdue = invoice.status === 'overdue'
        return (
          <Link
            key={invoice.id}
            href={`/invoices/${invoice.id}`}
            className={cn(
              'flex items-center justify-between py-3 border-b border-slate-700/50 last:border-b-0 hover:bg-slate-800/20 px-1 transition-colors rounded',
              isOverdue && 'border-l-2 border-red-500'
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-sm font-medium text-slate-200 font-mono shrink-0">{invoice.invoice_number}</span>
              <span className="text-xs text-slate-400 truncate">{invoice.clients?.business_name}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm font-medium text-slate-100">
                {formatCurrency(invoice.total, currencySymbol)}
              </span>
              <InvoiceStatusBadge status={invoice.status} />
              <span className="text-xs text-slate-500">{formatDate(invoice.issue_date)}</span>
            </div>
          </Link>
        )
      })}
      <Link href="/invoices" className="text-xs text-violet-400 hover:text-violet-300 mt-3 inline-block">
        View All →
      </Link>
    </div>
  )
}
