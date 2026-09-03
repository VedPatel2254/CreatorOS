'use client'

import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useDeletePaymentRecord } from '@/hooks/useBilling'
import { PaymentRecordWithClient } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

interface DeletePaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payment: PaymentRecordWithClient
}

export function DeletePaymentDialog({ open, onOpenChange, payment }: DeletePaymentDialogProps) {
  const deletePayment = useDeletePaymentRecord()

  const handleDelete = async () => {
    try {
      await deletePayment.mutateAsync(payment.id)
      toast.success('Payment deleted')
      onOpenChange(false)
    } catch {
      toast.error('Failed to delete payment')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-slate-50">Delete Payment?</h3>
        <p className="text-sm text-slate-400 mt-2">
          Delete this payment record of {formatCurrency(payment.amount)} from {payment.clients?.business_name} on {formatDate(payment.payment_date)}? This cannot be undone and will update billing totals immediately.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700 text-slate-300">
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deletePayment.isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deletePayment.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  )
}
