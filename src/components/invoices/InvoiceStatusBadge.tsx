'use client'

import { InvoiceStatus } from '@/types'
import { INVOICE_STATUS_CONFIG } from '@/lib/invoice-status'
import { cn } from '@/lib/utils'

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus
  size?: 'sm' | 'md'
}

export function InvoiceStatusBadge({ status, size = 'sm' }: InvoiceStatusBadgeProps) {
  const config = INVOICE_STATUS_CONFIG[status]

  return (
    <span className={cn(
      'inline-flex items-center font-medium rounded-full border',
      config.bgColor,
      config.color,
      config.borderColor,
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
    )}>
      {config.label}
    </span>
  )
}
