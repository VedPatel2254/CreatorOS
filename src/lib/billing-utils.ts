import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  format,
  parseISO,
  isWithinInterval,
} from 'date-fns'

import {
  ClientPricingRuleWithWorkType,
  Task,
  TaskWithRelations,
  Client,
  PaymentRecord,
  ClientBillingSummary,
  BilledTask,
  PendingTask,
  BillingPeriodSummary,
  DateRange,
  DateRangePreset,
  BillingType,
  InvoiceLineItem,
  InvoiceType,
} from '@/types'

export function resolveExpectedPrice(
  clientPricingRules: ClientPricingRuleWithWorkType[],
  workTypeId: string,
  priceOverride?: number | null
): number | null {
  if (priceOverride !== null && priceOverride !== undefined) {
    return priceOverride
  }
  const today = new Date().toISOString().split('T')[0]
  const rule = clientPricingRules.find(
    (r) =>
      r.work_type_id === workTypeId &&
      r.effective_from <= today &&
      (r.effective_to === null || r.effective_to >= today)
  )
  return rule?.unit_price ?? null
}

export function calculateTaskBillingAmount(
  unitPrice: number | null,
  quantity: number
): number | null {
  if (unitPrice === null) return null
  return Math.round(unitPrice * quantity * 100) / 100
}

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function formatBillingType(billingType: BillingType): string {
  switch (billingType) {
    case 'per_item': return 'Per Item'
    case 'monthly_package': return 'Monthly Package'
    case 'one_off': return 'One-off'
  }
}

export function getDateRangeForPreset(preset: DateRangePreset): DateRange {
  const now = new Date()

  switch (preset) {
    case 'this_month':
      return {
        start: format(startOfMonth(now), 'yyyy-MM-dd'),
        end: format(endOfMonth(now), 'yyyy-MM-dd'),
        preset,
      }
    case 'last_month': {
      const lastMonth = subMonths(now, 1)
      return {
        start: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
        end: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
        preset,
      }
    }
    case 'last_3_months': {
      const threeMonthsAgo = subMonths(now, 3)
      return {
        start: format(startOfMonth(threeMonthsAgo), 'yyyy-MM-dd'),
        end: format(endOfMonth(now), 'yyyy-MM-dd'),
        preset,
      }
    }
    case 'last_6_months': {
      const sixMonthsAgo = subMonths(now, 6)
      return {
        start: format(startOfMonth(sixMonthsAgo), 'yyyy-MM-dd'),
        end: format(endOfMonth(now), 'yyyy-MM-dd'),
        preset,
      }
    }
    case 'this_year':
      return {
        start: format(startOfYear(now), 'yyyy-MM-dd'),
        end: format(endOfYear(now), 'yyyy-MM-dd'),
        preset,
      }
    case 'custom':
      return {
        start: format(startOfMonth(now), 'yyyy-MM-dd'),
        end: format(endOfMonth(now), 'yyyy-MM-dd'),
        preset: 'custom',
      }
  }
}

export function formatDateRange(range: DateRange): string {
  const start = parseISO(range.start)
  const end = parseISO(range.end)

  if (range.preset === 'this_month' || range.preset === 'last_month') {
    return format(start, 'MMMM yyyy')
  }
  if (range.preset === 'this_year') {
    return format(start, 'yyyy')
  }
  if (format(start, 'yyyy') === format(end, 'yyyy')) {
    return `${format(start, 'MMM')} – ${format(end, 'MMM yyyy')}`
  }
  return `${format(start, 'd MMM yyyy')} – ${format(end, 'd MMM yyyy')}`
}

export function calculateClientBilling(
  client: Pick<Client, 'id' | 'business_name' | 'billing_type' | 'monthly_package_amount'>,
  tasks: TaskWithRelations[],
  pricingRules: ClientPricingRuleWithWorkType[],
  paymentRecords: PaymentRecord[],
  dateRange: DateRange
): ClientBillingSummary {
  const rangeStart = parseISO(dateRange.start)
  const rangeEnd = parseISO(dateRange.end)
  const clientTasks = tasks.filter(t => t.client_id === client.id)

  const deliveredTasks: BilledTask[] = clientTasks
    .filter(t => {
      if (t.status !== 'delivered' || !t.is_billable) return false
      if (!t.completed_at) return false
      const completedDate = parseISO(t.completed_at)
      return isWithinInterval(completedDate, { start: rangeStart, end: rangeEnd })
    })
    .map(t => {
      const unitPrice = t.effective_unit_price ?? 0
      return {
        taskId: t.id,
        title: t.title,
        workTypeName: t.work_types?.name ?? 'Unknown',
        platform: t.platform,
        completedAt: t.completed_at!,
        effectiveUnitPrice: unitPrice,
        billingQuantity: t.billing_quantity,
        billingAmount: roundCurrency(unitPrice * t.billing_quantity),
        billingLocked: t.billing_locked,
        importBatchId: t.import_batch_id,
      }
    })

  const pendingTasks: PendingTask[] = clientTasks
    .filter(t => {
      if (!['planned', 'in_progress', 'ready'].includes(t.status)) return false
      if (!t.is_billable) return false
      const deadlineDate = parseISO(t.deadline)
      return isWithinInterval(deadlineDate, { start: rangeStart, end: rangeEnd })
    })
    .map(t => {
      const estimatedPrice = resolveExpectedPrice(pricingRules, t.work_type_id, t.effective_unit_price)
      return {
        taskId: t.id,
        title: t.title,
        workTypeName: t.work_types?.name ?? 'Unknown',
        platform: t.platform,
        deadline: t.deadline,
        status: t.status,
        estimatedUnitPrice: estimatedPrice,
        billingQuantity: t.billing_quantity,
        estimatedAmount: estimatedPrice !== null ? roundCurrency(estimatedPrice * t.billing_quantity) : null,
      }
    })

  const clientPayments = paymentRecords.filter(p => {
    if (p.client_id !== client.id) return false
    const paymentDate = parseISO(p.payment_date)
    return isWithinInterval(paymentDate, { start: rangeStart, end: rangeEnd })
  })

  const deliveredAmount = deliveredTasks.reduce((sum, t) => sum + t.billingAmount, 0)
  const pendingAmount = pendingTasks.reduce((sum, t) => sum + (t.estimatedAmount ?? 0), 0)
  const packageAmount = client.billing_type === 'monthly_package' ? (client.monthly_package_amount ?? 0) : 0

  const totalEarned = client.billing_type === 'monthly_package' ? packageAmount : deliveredAmount
  const totalPaid = clientPayments.reduce((sum, p) => sum + p.amount, 0)
  const totalUnpaid = Math.max(0, roundCurrency(totalEarned - totalPaid))

  return {
    client: {
      id: client.id,
      business_name: client.business_name,
      billing_type: client.billing_type,
      monthly_package_amount: client.monthly_package_amount,
    },
    deliveredTasks,
    pendingTasks,
    deliveredAmount: roundCurrency(deliveredAmount),
    pendingAmount: roundCurrency(pendingAmount),
    packageAmount: roundCurrency(packageAmount),
    totalEarned: roundCurrency(totalEarned),
    totalPaid: roundCurrency(totalPaid),
    totalUnpaid,
  }
}

export function calculateBillingPeriodSummary(
  clientSummaries: ClientBillingSummary[],
  dateRange: DateRange
): BillingPeriodSummary {
  const activeClientCount = clientSummaries.filter(
    cs => cs.deliveredTasks.length > 0 || cs.pendingTasks.length > 0
  ).length

  return {
    periodStart: dateRange.start,
    periodEnd: dateRange.end,
    clientSummaries,
    totalDeliveredAmount: roundCurrency(clientSummaries.reduce((sum, cs) => sum + cs.totalEarned, 0)),
    totalPendingAmount: roundCurrency(clientSummaries.reduce((sum, cs) => sum + cs.pendingAmount, 0)),
    totalPaidAmount: roundCurrency(clientSummaries.reduce((sum, cs) => sum + cs.totalPaid, 0)),
    totalUnpaidAmount: roundCurrency(clientSummaries.reduce((sum, cs) => sum + cs.totalUnpaid, 0)),
    totalClients: clientSummaries.length,
    activeClientCount,
  }
}

export function buildDetailedLineItems(tasks: BilledTask[]): Omit<InvoiceLineItem, 'id' | 'invoice_id' | 'created_at'>[] {
  return tasks
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
    .map((task, index) => ({
      task_id: task.taskId,
      description: task.title,
      work_type_name: task.workTypeName,
      delivery_date: task.completedAt.split('T')[0],
      quantity: task.billingQuantity,
      unit_price: task.effectiveUnitPrice,
      amount: task.billingAmount,
      sort_order: index,
    }))
}

export function buildSummaryLineItems(tasks: BilledTask[]): Omit<InvoiceLineItem, 'id' | 'invoice_id' | 'created_at'>[] {
  const groups = new Map<string, { totalQty: number; totalAmount: number; unitPrice: number; sortOrder: number }>()

  tasks.forEach((task, index) => {
    const key = task.workTypeName
    const existing = groups.get(key)
    if (existing) {
      existing.totalQty += task.billingQuantity
      existing.totalAmount = roundCurrency(existing.totalAmount + task.billingAmount)
    } else {
      groups.set(key, {
        totalQty: task.billingQuantity,
        totalAmount: task.billingAmount,
        unitPrice: task.effectiveUnitPrice,
        sortOrder: index,
      })
    }
  })

  return Array.from(groups.entries())
    .sort((a, b) => a[1].sortOrder - b[1].sortOrder)
    .map(([workTypeName, data], index) => ({
      task_id: null,
      description: workTypeName,
      work_type_name: workTypeName,
      delivery_date: null,
      quantity: data.totalQty,
      unit_price: data.totalAmount / data.totalQty,
      amount: data.totalAmount,
      sort_order: index,
    }))
}

export function buildPackageLineItems(packageAmount: number, periodLabel: string): Omit<InvoiceLineItem, 'id' | 'invoice_id' | 'created_at'>[] {
  return [{
    task_id: null,
    description: `Monthly Retainer — ${periodLabel}`,
    work_type_name: 'Package',
    delivery_date: null,
    quantity: 1,
    unit_price: packageAmount,
    amount: packageAmount,
    sort_order: 0,
  }]
}

export function calculateInvoiceTotals(
  lineItems: Omit<InvoiceLineItem, 'id' | 'invoice_id' | 'created_at'>[],
  discountAmount: number,
  taxRate: number
): { subtotal: number; discountAmount: number; taxAmount: number; total: number } {
  const subtotal = roundCurrency(lineItems.reduce((sum, item) => sum + item.amount, 0))
  const afterDiscount = roundCurrency(Math.max(0, subtotal - discountAmount))
  const taxAmount = roundCurrency(afterDiscount * (taxRate / 100))
  const total = roundCurrency(afterDiscount + taxAmount)

  return {
    subtotal,
    discountAmount: roundCurrency(discountAmount),
    taxAmount,
    total,
  }
}

export function generateBillingCsv(summary: BillingPeriodSummary, currencySymbol: string): string {
  const lines: string[] = []

  lines.push(`CreatorOS Billing Export`)
  lines.push(`Period,${summary.periodStart} to ${summary.periodEnd}`)
  lines.push(`Generated,${new Date().toISOString()}`)
  lines.push(``)
  lines.push(`SUMMARY`)
  lines.push(`Total Earned,${currencySymbol}${summary.totalDeliveredAmount.toFixed(2)}`)
  lines.push(`Total Paid,${currencySymbol}${summary.totalPaidAmount.toFixed(2)}`)
  lines.push(`Total Unpaid,${currencySymbol}${summary.totalUnpaidAmount.toFixed(2)}`)
  lines.push(`Active Clients,${summary.activeClientCount}`)
  lines.push(``)
  lines.push(`CLIENT BREAKDOWN`)
  lines.push(`Client,Billing Type,Delivered Tasks,Earned,Paid,Unpaid`)

  for (const cs of summary.clientSummaries) {
    if (cs.deliveredTasks.length === 0 && cs.pendingTasks.length === 0) continue
    lines.push([
      csvEscape(cs.client.business_name),
      formatBillingType(cs.client.billing_type),
      cs.deliveredTasks.length,
      `${currencySymbol}${cs.totalEarned.toFixed(2)}`,
      `${currencySymbol}${cs.totalPaid.toFixed(2)}`,
      `${currencySymbol}${cs.totalUnpaid.toFixed(2)}`,
    ].join(','))
  }

  lines.push(``)
  lines.push(`DELIVERED TASKS`)
  lines.push(`Client,Date,Title,Work Type,Platform,Qty,Unit Price,Amount`)

  for (const cs of summary.clientSummaries) {
    for (const task of cs.deliveredTasks) {
      lines.push([
        csvEscape(cs.client.business_name),
        task.completedAt.split('T')[0],
        csvEscape(task.title),
        csvEscape(task.workTypeName),
        csvEscape(task.platform),
        task.billingQuantity,
        `${currencySymbol}${task.effectiveUnitPrice.toFixed(2)}`,
        `${currencySymbol}${task.billingAmount.toFixed(2)}`,
      ].join(','))
    }
  }

  return lines.join('\n')
}

function csvEscape(value: string): string {
  if (!value) return ''
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
