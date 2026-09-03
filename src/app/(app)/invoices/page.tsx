'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useInvoices, useInvoiceStats } from '@/hooks/useInvoices'
import { useClients } from '@/hooks/useClients'
import { useSettings } from '@/hooks/useSettings'
import { InvoiceStatusBadge } from '@/components/invoices/InvoiceStatusBadge'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import { InvoiceStatus } from '@/types'

export default function InvoicesPage() {
  const router = useRouter()
  const { data: settings } = useSettings()
  const { data: stats, isLoading: statsLoading } = useInvoiceStats()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [clientFilter, setClientFilter] = useState('')

  const { data: invoices = [], isLoading } = useInvoices({
    search: search || undefined,
    status: statusFilter ? (statusFilter as InvoiceStatus) : undefined,
    client_id: clientFilter || undefined,
  })

  const { data: clients = [] } = useClients()
  const currencySymbol = settings?.currency_symbol ?? '₹'

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-50">Invoices</h1>
        <Button onClick={() => router.push('/invoices/new')} className="bg-violet-600 hover:bg-violet-700 text-white">
          <Plus className="mr-2 h-4 w-4" />New Invoice
        </Button>
      </div>

      {!statsLoading && stats && (
        <div className="flex flex-wrap gap-2">
          {(['draft', 'sent', 'paid', 'partially_paid', 'overdue'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                statusFilter === status ? 'bg-violet-600/20 text-violet-400 border-violet-500/30' : 'text-slate-400 border-slate-700 hover:bg-slate-800'
              )}
            >
              {status === 'partially_paid' ? 'Partial' : status.charAt(0).toUpperCase() + status.slice(1)}: {(stats as any)[status] ?? 0}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search invoice number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-slate-50"
          />
        </div>
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-full sm:w-[200px] bg-slate-800 border-slate-700 text-slate-50">
            <SelectValue placeholder="All clients" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="">All clients</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.business_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg bg-slate-800" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No invoices yet.</p>
          <p className="text-sm text-slate-500 mt-1">Generate your first invoice from the Billing page.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              onClick={() => router.push(`/invoices/${invoice.id}`)}
              className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800/80 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-4 min-w-0">
                <FileText className="h-5 w-5 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-200">{invoice.invoice_number}</p>
                  <p className="text-xs text-slate-400">
                    {invoice.clients?.business_name} · {formatDate(invoice.issue_date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <p className="text-sm font-semibold text-slate-100">{formatCurrency(invoice.total, currencySymbol)}</p>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
