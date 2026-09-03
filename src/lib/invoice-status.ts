import { InvoiceStatus, InvoiceStatusConfig } from '@/types'

export const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, InvoiceStatusConfig> = {
  draft: {
    label: 'Draft',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/20',
  },
  sent: {
    label: 'Sent',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  paid: {
    label: 'Paid',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
  },
  partially_paid: {
    label: 'Partially Paid',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
  overdue: {
    label: 'Overdue',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-slate-500',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/20',
  },
}

export function deriveInvoiceStatus(
  total: number,
  amountPaid: number,
  dueDate: string | null,
  currentStatus: InvoiceStatus
): InvoiceStatus {
  if (currentStatus === 'cancelled') return 'cancelled'

  if (amountPaid <= 0) {
    if (dueDate && new Date(dueDate) < new Date() && currentStatus === 'sent') {
      return 'overdue'
    }
    return currentStatus === 'draft' ? 'draft' : 'sent'
  }

  if (amountPaid >= total) return 'paid'
  return 'partially_paid'
}

export const VALID_INVOICE_STATUS_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ['sent', 'cancelled'],
  sent: ['paid', 'partially_paid', 'overdue', 'cancelled', 'draft'],
  paid: ['sent'],
  partially_paid: ['paid', 'sent', 'cancelled'],
  overdue: ['paid', 'partially_paid', 'sent', 'cancelled'],
  cancelled: ['draft'],
}
