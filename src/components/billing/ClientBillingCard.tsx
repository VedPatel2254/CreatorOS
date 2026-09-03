'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle, AlertCircle, Lock, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ClientBillingSummary } from '@/types'
import { formatCurrency, cn } from '@/lib/utils'
import { formatBillingType } from '@/lib/billing-utils'
import { formatDate } from '@/lib/utils'

interface ClientBillingCardProps {
  summary: ClientBillingSummary
  currencySymbol: string
  defaultExpanded?: boolean
  onRecordPayment?: (clientId: string, suggestedAmount?: number) => void
  showClientName?: boolean
}

export function ClientBillingCard({
  summary,
  currencySymbol,
  defaultExpanded = false,
  onRecordPayment,
  showClientName = true,
}: ClientBillingCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const { client, deliveredTasks, pendingTasks, deliveredAmount, pendingAmount, packageAmount, totalEarned, totalPaid, totalUnpaid } = summary

  const isPaid = totalUnpaid <= 0 && totalEarned > 0
  const isPartial = totalPaid > 0 && totalUnpaid > 0

  return (
    <div className="border-b border-slate-700/50 last:border-b-0">
      <div
        className="flex items-start justify-between p-5 hover:bg-slate-800/20 cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          {showClientName && (
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-slate-100 truncate">{client.business_name}</h3>
              <Badge className={cn('text-xs', client.billing_type === 'monthly_package' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20')}>
                {formatBillingType(client.billing_type)}
              </Badge>
            </div>
          )}
          <p className="text-xs text-slate-400">
            {deliveredTasks.length} tasks delivered
            {pendingTasks.length > 0 && ` · ${pendingTasks.length} pending`}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-100">{formatCurrency(totalEarned, currencySymbol)}</p>
            <p className="text-xs text-slate-400">
              {isPaid ? (
                <span className="text-emerald-400 flex items-center gap-1 justify-end">
                  <CheckCircle className="h-3 w-3" /> Paid
                </span>
              ) : isPartial ? (
                <span className="text-amber-400">{formatCurrency(totalUnpaid, currencySymbol)} Unpaid</span>
              ) : totalEarned > 0 ? (
                <span className="text-red-400">{formatCurrency(totalUnpaid, currencySymbol)} Unpaid</span>
              ) : (
                <span className="text-slate-500">No earnings</span>
              )}
            </p>
          </div>

          {onRecordPayment && totalUnpaid > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onRecordPayment(client.id, totalUnpaid)
              }}
              className="border-slate-700 text-slate-300 shrink-0"
            >
              <DollarSign className="mr-1 h-3 w-3" />Record Payment
            </Button>
          )}

          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 shrink-0">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="bg-slate-900/50 border-t border-slate-700/50 p-5">
          {client.billing_type === 'monthly_package' && (
            <div className="mb-4 p-3 rounded-lg bg-violet-500/5 border border-violet-500/20">
              <p className="text-sm font-medium text-violet-300">Monthly Package: {formatCurrency(packageAmount, currencySymbol)}</p>
            </div>
          )}

          {deliveredTasks.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Delivered Tasks</h4>
              <div className="rounded-lg border border-slate-700/50 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Title</th>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-right">Qty</th>
                      <th className="px-4 py-2 text-right">Rate</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveredTasks.map((task) => (
                      <tr key={task.taskId} className="border-b border-slate-700/30 text-sm text-slate-300">
                        <td className="px-4 py-3 text-slate-400">{formatDate(task.completedAt)}</td>
                        <td className="px-4 py-3">{task.title}</td>
                        <td className="px-4 py-3 text-slate-400">{task.workTypeName}</td>
                        <td className="px-4 py-3 text-right">{task.billingQuantity}</td>
                        <td className="px-4 py-3 text-right">
                          {task.effectiveUnitPrice === 0 ? (
                            <span className="text-amber-400 flex items-center justify-end gap-1" title="No pricing rule at delivery">
                              ₹0 <AlertCircle className="h-3 w-3" />
                            </span>
                          ) : (
                            formatCurrency(task.effectiveUnitPrice, currencySymbol)
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCurrency(task.billingAmount, currencySymbol)}
                          {task.billingLocked && <Lock className="inline ml-1 h-3 w-3 text-slate-500" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-semibold text-slate-100 bg-slate-800/30">
                      <td colSpan={5} className="px-4 py-3 text-right">Total:</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(deliveredAmount, currencySymbol)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {pendingTasks.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Pending Tasks (Estimated)</h4>
              <div className="rounded-lg border border-slate-700/50 overflow-hidden opacity-70">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-2 text-left">Title</th>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-left">Deadline</th>
                      <th className="px-4 py-2 text-right">Est. Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingTasks.map((task) => (
                      <tr key={task.taskId} className="border-b border-slate-700/30 text-sm text-slate-300">
                        <td className="px-4 py-3">{task.title}</td>
                        <td className="px-4 py-3 text-slate-400">{task.workTypeName}</td>
                        <td className="px-4 py-3 text-slate-400">{formatDate(task.deadline)}</td>
                        <td className="px-4 py-3 text-right">
                          {task.estimatedAmount !== null ? `Est. ${formatCurrency(task.estimatedAmount, currencySymbol)}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-semibold text-slate-100 bg-slate-800/30">
                      <td colSpan={3} className="px-4 py-3 text-right">Est. Total:</td>
                      <td className="px-4 py-3 text-right">Est. {formatCurrency(pendingAmount, currencySymbol)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
