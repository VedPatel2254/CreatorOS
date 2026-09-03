'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileText, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useInvoice } from '@/hooks/useInvoices'
import { useSettings } from '@/hooks/useSettings'
import { InvoicePreview } from '@/components/invoices/InvoicePreview'
import { InvoiceStatusBadge } from '@/components/invoices/InvoiceStatusBadge'
import { InvoiceRenderData } from '@/types'

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const { data: invoice, isLoading } = useInvoice(id)
  const { data: settings } = useSettings()

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48 bg-slate-800" />
        <Skeleton className="h-[600px] w-full bg-slate-800 rounded-xl" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-xl font-semibold text-slate-300">Invoice not found</h2>
      </div>
    )
  }

  const renderData: InvoiceRenderData = {
    invoice,
    lineItems: invoice.invoice_line_items ?? [],
    client: invoice.clients,
    business: {
      business_name: settings?.business_name ?? '',
      business_email: settings?.business_email ?? '',
      business_phone: settings?.business_phone ?? '',
      business_address: settings?.business_address ?? '',
      logo_url: settings?.logo_url ?? null,
      currency_symbol: settings?.currency_symbol ?? '₹',
      currency_code: settings?.currency_code ?? 'INR',
    },
    currencySymbol: settings?.currency_symbol ?? '₹',
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.push('/invoices')} className="text-slate-400 hover:text-slate-50">
        <ArrowLeft className="mr-2 h-4 w-4" />Invoices
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-50">{invoice.invoice_number}</h1>
            <InvoiceStatusBadge status={invoice.status} size="md" />
          </div>
          <p className="text-sm text-slate-400 mt-1">
            {invoice.clients?.business_name} · {invoice.total.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.open(`/api/invoices/${invoice.id}/pdf`, '_blank')} className="border-slate-700 text-slate-300">
            <FileText className="mr-2 h-4 w-4" />Download PDF
          </Button>
          {invoice.status === 'draft' && (
            <Button onClick={() => router.push('/invoices')} className="bg-violet-600 hover:bg-violet-700 text-white">
              <Send className="mr-2 h-4 w-4" />Mark as Sent
            </Button>
          )}
        </div>
      </div>

      <InvoicePreview data={renderData} />
    </div>
  )
}
