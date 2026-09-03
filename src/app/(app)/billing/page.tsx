'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useBillingData, usePaymentRecords } from '@/hooks/useBilling'
import { useSettings } from '@/hooks/useSettings'
import { DateRangeSelector } from '@/components/billing/DateRangeSelector'
import { BillingSummaryCards } from '@/components/billing/BillingSummaryCards'
import { ClientBillingCard } from '@/components/billing/ClientBillingCard'
import { PaymentHistoryList } from '@/components/billing/PaymentHistoryList'
import { PaymentSheet } from '@/components/billing/PaymentSheet'
import { DateRange } from '@/types'
import { getDateRangeForPreset, generateBillingCsv, downloadCsv } from '@/lib/billing-utils'

export default function BillingPage() {
  const router = useRouter()
  const { data: settings } = useSettings()
  const [dateRange, setDateRange] = useState<DateRange>(getDateRangeForPreset('this_month'))
  const [showPaymentSheet, setShowPaymentSheet] = useState(false)
  const [paymentClientId, setPaymentClientId] = useState<string | undefined>()

  const { data: summary, isLoading } = useBillingData(dateRange)
  const { data: payments = [] } = usePaymentRecords({
    from: dateRange.start,
    to: dateRange.end,
  })

  const currencySymbol = settings?.currency_symbol ?? '₹'

  const handleExportCsv = () => {
    if (!summary) return
    const csv = generateBillingCsv(summary, currencySymbol)
    const filename = `creatoros-billing-${dateRange.start}-${dateRange.end}.csv`
    downloadCsv(csv, filename)
  }

  const handleRecordPayment = (clientId: string, suggestedAmount?: number) => {
    setPaymentClientId(clientId)
    setShowPaymentSheet(true)
  }

  const activeClientSummaries = useMemo(() =>
    summary?.clientSummaries.filter(cs =>
      cs.deliveredTasks.length > 0 || cs.pendingTasks.length > 0
    ) ?? [],
    [summary]
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-50">Billing</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCsv} disabled={isLoading} className="border-slate-700 text-slate-300">
            <Download className="mr-2 h-4 w-4" />Export CSV
          </Button>
          <Button onClick={() => setShowPaymentSheet(true)} className="bg-violet-600 hover:bg-violet-700 text-white">
            <Plus className="mr-2 h-4 w-4" />Record Payment
          </Button>
        </div>
      </div>

      <DateRangeSelector value={dateRange} onChange={setDateRange} />

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl bg-slate-800" />
          ))}
        </div>
      ) : summary ? (
        <BillingSummaryCards
          totalEarned={summary.totalDeliveredAmount}
          totalPaid={summary.totalPaidAmount}
          totalUnpaid={summary.totalUnpaidAmount}
          totalPending={summary.totalPendingAmount}
          activeClientCount={summary.activeClientCount}
          currencySymbol={currencySymbol}
        />
      ) : null}

      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-base text-slate-50">Client Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-5">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 rounded-lg bg-slate-800" />
              ))}
            </div>
          ) : activeClientSummaries.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No billing activity in this period.</p>
          ) : (
            activeClientSummaries.map((cs) => (
              <ClientBillingCard
                key={cs.client.id}
                summary={cs}
                currencySymbol={currencySymbol}
                onRecordPayment={handleRecordPayment}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-base text-slate-50">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 rounded-lg bg-slate-800" />
              ))}
            </div>
          ) : (
            <PaymentHistoryList payments={payments} currencySymbol={currencySymbol} />
          )}
        </CardContent>
      </Card>

      <PaymentSheet
        open={showPaymentSheet}
        onOpenChange={(open) => {
          setShowPaymentSheet(open)
          if (!open) setPaymentClientId(undefined)
        }}
        defaultClientId={paymentClientId}
      />
    </div>
  )
}
