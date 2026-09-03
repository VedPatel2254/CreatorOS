'use client'

import { InvoiceRenderData, InvoiceLineItem } from '@/types'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface InvoicePreviewProps {
  data: InvoiceRenderData
  showWatermark?: boolean
}

function formatMoney(amount: number, symbol: string): string {
  return `${symbol}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatPreviewDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  try {
    return format(new Date(dateStr), 'd MMM yyyy')
  } catch {
    return dateStr
  }
}

export function InvoicePreview({ data, showWatermark = false }: InvoicePreviewProps) {
  const { invoice, lineItems, client, business, currencySymbol } = data
  const isPaid = invoice.status === 'paid'
  const hasDiscount = invoice.discount_amount > 0
  const hasTax = invoice.tax_rate > 0

  return (
    <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl mx-auto my-8 font-sans overflow-hidden">
      {showWatermark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10">
          <span className="text-8xl font-bold text-gray-100 transform -rotate-30 opacity-80">DRAFT</span>
        </div>
      )}

      <div className="p-12 text-gray-900">
        {/* Header */}
        <div className="flex justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{business.business_name}</h1>
            {business.business_email && <p className="text-sm text-gray-500">{business.business_email}</p>}
            {business.business_phone && <p className="text-sm text-gray-500">{business.business_phone}</p>}
            {business.business_address && <p className="text-sm text-gray-500">{business.business_address}</p>}
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-violet-600">INVOICE</h2>
            <p className="text-sm font-bold text-gray-700 mt-1">{invoice.invoice_number}</p>
          </div>
        </div>

        <hr className="border-gray-200 mb-6" />

        {/* Billing Info */}
        <div className="flex justify-between mb-8">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Bill To</p>
            <p className="font-bold text-gray-900">{client.business_name}</p>
            {client.contact_name && <p className="text-sm text-gray-600">{client.contact_name}</p>}
            {client.email && <p className="text-sm text-gray-600">{client.email}</p>}
            {client.phone && <p className="text-sm text-gray-600">{client.phone}</p>}
            {client.address && <p className="text-sm text-gray-600">{client.address}</p>}
          </div>
          <div>
            <div className="flex gap-8 mb-2">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Issue Date</p>
                <p className="text-sm text-gray-700">{formatPreviewDate(invoice.issue_date)}</p>
              </div>
              {invoice.due_date && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Due Date</p>
                  <p className="text-sm text-gray-700">{formatPreviewDate(invoice.due_date)}</p>
                </div>
              )}
            </div>
            {invoice.billing_period_start && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Billing Period</p>
                <p className="text-sm text-gray-700">{formatPreviewDate(invoice.billing_period_start)} – {formatPreviewDate(invoice.billing_period_end)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-t border-b border-gray-200 bg-gray-50">
              {invoice.invoice_type === 'detailed' && <th className="py-2 px-2 text-left text-xs font-bold text-gray-500 uppercase">Date</th>}
              <th className="py-2 px-2 text-left text-xs font-bold text-gray-500 uppercase">Description</th>
              {invoice.invoice_type === 'detailed' && <th className="py-2 px-2 text-left text-xs font-bold text-gray-500 uppercase">Type</th>}
              <th className="py-2 px-2 text-right text-xs font-bold text-gray-500 uppercase">Qty</th>
              <th className="py-2 px-2 text-right text-xs font-bold text-gray-500 uppercase">Rate</th>
              <th className="py-2 px-2 text-right text-xs font-bold text-gray-500 uppercase">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, index) => (
              <tr key={item.id || index} className={cn('border-b border-gray-100', index % 2 === 1 && 'bg-gray-50')}>
                {invoice.invoice_type === 'detailed' && <td className="py-2 px-2 text-sm text-gray-500">{formatPreviewDate(item.delivery_date)}</td>}
                <td className="py-2 px-2 text-sm text-gray-900">{item.description}</td>
                {invoice.invoice_type === 'detailed' && <td className="py-2 px-2 text-sm text-gray-500">{item.work_type_name}</td>}
                <td className="py-2 px-2 text-sm text-gray-900 text-right">{item.quantity}</td>
                <td className="py-2 px-2 text-sm text-gray-900 text-right">{formatMoney(item.unit_price, currencySymbol)}</td>
                <td className="py-2 px-2 text-sm text-gray-900 text-right font-medium">{formatMoney(item.amount, currencySymbol)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-2/5">
            <div className="flex justify-between py-1">
              <span className="text-sm text-gray-500">Subtotal</span>
              <span className="text-sm text-gray-700">{formatMoney(invoice.subtotal, currencySymbol)}</span>
            </div>
            {hasDiscount && (
              <div className="flex justify-between py-1">
                <span className="text-sm text-gray-500">Discount</span>
                <span className="text-sm text-gray-700">−{formatMoney(invoice.discount_amount, currencySymbol)}</span>
              </div>
            )}
            {hasTax && (
              <div className="flex justify-between py-1">
                <span className="text-sm text-gray-500">{invoice.tax_label || 'Tax'} ({invoice.tax_rate}%)</span>
                <span className="text-sm text-gray-700">{formatMoney(invoice.tax_amount, currencySymbol)}</span>
              </div>
            )}
            <hr className="border-gray-200 my-2" />
            <div className="flex justify-between py-1">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-lg font-bold text-violet-600">{formatMoney(invoice.total, currencySymbol)}</span>
            </div>
            {invoice.amount_paid > 0 && (
              <div className="flex justify-between py-1">
                <span className="text-sm text-gray-500">Amount Paid</span>
                <span className="text-sm text-gray-700">{formatMoney(invoice.amount_paid, currencySymbol)}</span>
              </div>
            )}
            {invoice.amount_paid > 0 && invoice.amount_paid < invoice.total && (
              <div className="flex justify-between py-1">
                <span className="text-sm text-red-600 font-medium">Balance Due</span>
                <span className="text-sm text-red-600 font-bold">{formatMoney(invoice.total - invoice.amount_paid, currencySymbol)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Paid Badge */}
        {isPaid && (
          <div className="inline-block px-4 py-1 bg-green-100 rounded-full mb-4">
            <span className="text-xs font-bold text-green-800">PAID</span>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Notes</p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}

        {invoice.payment_notes && (
          <div className="mt-2 p-3 bg-gray-50 rounded">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Payment Details</p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.payment_notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="absolute bottom-8 left-12 right-12 flex justify-between border-t border-gray-200 pt-2">
          <span className="text-xs text-gray-400">{invoice.invoice_number} · Generated by CreatorOS</span>
          <span className="text-xs text-gray-400">Page 1</span>
        </div>
      </div>
    </div>
  )
}
