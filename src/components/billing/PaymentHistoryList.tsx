'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate, formatCurrency } from '@/lib/utils'
import { PaymentRecordWithClient } from '@/types'
import { DeletePaymentDialog } from './DeletePaymentDialog'
import { PaymentSheet } from './PaymentSheet'

interface PaymentHistoryListProps {
  payments: PaymentRecordWithClient[]
  currencySymbol: string
}

const PAYMENT_METHODS: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  upi: 'UPI',
  cash: 'Cash',
  cheque: 'Cheque',
  online: 'Online',
  other: 'Other',
}

export function PaymentHistoryList({ payments, currencySymbol }: PaymentHistoryListProps) {
  const [editingPayment, setEditingPayment] = useState<PaymentRecordWithClient | null>(null)
  const [deletingPayment, setDeletingPayment] = useState<PaymentRecordWithClient | null>(null)

  if (payments.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-4">No payments recorded in this period.</p>
    )
  }

  return (
    <>
      <div className="space-y-0">
        {payments.map((payment) => (
          <div key={payment.id} className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-b-0 text-sm">
            <div className="flex-1 min-w-0">
              <p className="text-slate-200 font-medium">{formatCurrency(payment.amount, currencySymbol)}</p>
              <p className="text-xs text-slate-400">
                {formatDate(payment.payment_date)} · {PAYMENT_METHODS[payment.payment_method] || payment.payment_method || '—'}
                {payment.clients?.business_name && ` · ${payment.clients.business_name}`}
              </p>
              {payment.reference && (
                <p className="text-xs text-slate-500">Ref: {payment.reference}</p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-50" onClick={() => setEditingPayment(payment)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-400" onClick={() => setDeletingPayment(payment)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {editingPayment && (
        <PaymentSheet
          open={!!editingPayment}
          onOpenChange={(open) => { if (!open) setEditingPayment(null) }}
          payment={editingPayment}
        />
      )}

      {deletingPayment && (
        <DeletePaymentDialog
          open={!!deletingPayment}
          onOpenChange={(open) => { if (!open) setDeletingPayment(null) }}
          payment={deletingPayment}
        />
      )}
    </>
  )
}
