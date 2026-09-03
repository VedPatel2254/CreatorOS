import 'server-only'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer'
import { createElement } from 'react'
import { InvoiceRenderData } from '@/types'
import { format } from 'date-fns'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 48,
    backgroundColor: '#ffffff',
    color: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  businessName: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  businessDetail: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  invoiceTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: '#7c3aed',
    textAlign: 'right',
  },
  invoiceNumber: {
    fontSize: 11,
    color: '#374151',
    textAlign: 'right',
    marginTop: 4,
    fontFamily: 'Helvetica-Bold',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginVertical: 16,
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  billingBlock: {
    width: '45%',
  },
  billingLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  billingValue: {
    fontSize: 10,
    color: '#111827',
    marginBottom: 2,
  },
  billingValueBold: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 24,
  },
  metaBlock: {
    flexDirection: 'column',
  },
  metaLabel: {
    fontSize: 8,
    color: '#9ca3af',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 10,
    color: '#374151',
  },
  table: {
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableRowAlt: {
    backgroundColor: '#fafafa',
  },
  colDate: { width: '12%' },
  colDescription: { width: '36%' },
  colWorkType: { width: '16%' },
  colQty: { width: '8%', textAlign: 'right' },
  colRate: { width: '14%', textAlign: 'right' },
  colAmount: { width: '14%', textAlign: 'right' },
  tableCell: {
    fontSize: 9,
    color: '#374151',
  },
  tableCellMuted: {
    fontSize: 9,
    color: '#9ca3af',
  },
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 24,
  },
  totalsBlock: {
    width: '40%',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalsLabel: {
    fontSize: 9,
    color: '#6b7280',
  },
  totalsValue: {
    fontSize: 9,
    color: '#374151',
  },
  totalsDivider: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginVertical: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  totalValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#7c3aed',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusPaid: { backgroundColor: '#d1fae5' },
  statusText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  statusTextPaid: { color: '#065f46' },
  notesSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  notesLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
})

function formatMoney(amount: number, symbol: string): string {
  return `${symbol}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatPdfDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  try {
    return format(new Date(dateStr), 'd MMM yyyy')
  } catch {
    return dateStr
  }
}

function InvoiceDocument({ data }: { data: InvoiceRenderData }) {
  const { invoice, lineItems, client, business, currencySymbol } = data
  const isPaid = invoice.status === 'paid'
  const hasDiscount = invoice.discount_amount > 0
  const hasTax = invoice.tax_rate > 0

  return createElement(
    Document,
    { title: `Invoice ${invoice.invoice_number}`, author: business.business_name },
    createElement(
      Page,
      { size: 'A4', style: styles.page },
      createElement(View, { style: styles.header },
        createElement(View, null,
          createElement(Text, { style: styles.businessName }, business.business_name),
          business.business_email ? createElement(Text, { style: styles.businessDetail }, business.business_email) : null,
          business.business_phone ? createElement(Text, { style: styles.businessDetail }, business.business_phone) : null,
          business.business_address ? createElement(Text, { style: styles.businessDetail }, business.business_address) : null,
        ),
        createElement(View, null,
          createElement(Text, { style: styles.invoiceTitle }, 'INVOICE'),
          createElement(Text, { style: styles.invoiceNumber }, invoice.invoice_number),
        ),
      ),
      createElement(View, { style: styles.divider }),
      createElement(View, { style: styles.billingRow },
        createElement(View, { style: styles.billingBlock },
          createElement(Text, { style: styles.billingLabel }, 'Bill To'),
          createElement(Text, { style: styles.billingValueBold }, client.business_name),
          client.contact_name ? createElement(Text, { style: styles.billingValue }, client.contact_name) : null,
          client.email ? createElement(Text, { style: styles.billingValue }, client.email) : null,
          client.phone ? createElement(Text, { style: styles.billingValue }, client.phone) : null,
          client.address ? createElement(Text, { style: styles.billingValue }, client.address) : null,
        ),
        createElement(View, { style: styles.billingBlock },
          createElement(View, { style: styles.metaRow },
            createElement(View, { style: styles.metaBlock },
              createElement(Text, { style: styles.metaLabel }, 'Issue Date'),
              createElement(Text, { style: styles.metaValue }, formatPdfDate(invoice.issue_date)),
            ),
            invoice.due_date ? createElement(View, { style: styles.metaBlock },
              createElement(Text, { style: styles.metaLabel }, 'Due Date'),
              createElement(Text, { style: styles.metaValue }, formatPdfDate(invoice.due_date)),
            ) : null,
          ),
          invoice.billing_period_start ? createElement(View, null,
            createElement(Text, { style: styles.metaLabel }, 'Billing Period'),
            createElement(Text, { style: styles.metaValue }, `${formatPdfDate(invoice.billing_period_start)} – ${formatPdfDate(invoice.billing_period_end)}`),
          ) : null,
        ),
      ),
      createElement(View, { style: styles.table },
        createElement(View, { style: styles.tableHeader },
          invoice.invoice_type === 'detailed' ? createElement(Text, { style: [styles.tableHeaderText, styles.colDate] }, 'Date') : null,
          createElement(Text, { style: [styles.tableHeaderText, invoice.invoice_type === 'detailed' ? styles.colDescription : { width: '52%' }] }, 'Description'),
          invoice.invoice_type === 'detailed' ? createElement(Text, { style: [styles.tableHeaderText, styles.colWorkType] }, 'Type') : null,
          createElement(Text, { style: [styles.tableHeaderText, styles.colQty] }, 'Qty'),
          createElement(Text, { style: [styles.tableHeaderText, styles.colRate] }, 'Rate'),
          createElement(Text, { style: [styles.tableHeaderText, styles.colAmount] }, 'Amount'),
        ),
        ...lineItems.map((item, index) =>
          createElement(View, { key: index, style: [styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}] },
            invoice.invoice_type === 'detailed' ? createElement(Text, { style: [styles.tableCellMuted, styles.colDate] }, formatPdfDate(item.delivery_date)) : null,
            createElement(Text, { style: [styles.tableCell, invoice.invoice_type === 'detailed' ? styles.colDescription : { width: '52%' }] }, item.description),
            invoice.invoice_type === 'detailed' ? createElement(Text, { style: [styles.tableCellMuted, styles.colWorkType] }, item.work_type_name) : null,
            createElement(Text, { style: [styles.tableCell, styles.colQty] }, item.quantity.toString()),
            createElement(Text, { style: [styles.tableCell, styles.colRate] }, formatMoney(item.unit_price, currencySymbol)),
            createElement(Text, { style: [styles.tableCell, styles.colAmount] }, formatMoney(item.amount, currencySymbol)),
          )
        ),
      ),
      createElement(View, { style: styles.totalsSection },
        createElement(View, { style: styles.totalsBlock },
          createElement(View, { style: styles.totalsRow },
            createElement(Text, { style: styles.totalsLabel }, 'Subtotal'),
            createElement(Text, { style: styles.totalsValue }, formatMoney(invoice.subtotal, currencySymbol)),
          ),
          hasDiscount ? createElement(View, { style: styles.totalsRow },
            createElement(Text, { style: styles.totalsLabel }, 'Discount'),
            createElement(Text, { style: styles.totalsValue }, `−${formatMoney(invoice.discount_amount, currencySymbol)}`),
          ) : null,
          hasTax ? createElement(View, { style: styles.totalsRow },
            createElement(Text, { style: styles.totalsLabel }, `${invoice.tax_label || 'Tax'} (${invoice.tax_rate}%)`),
            createElement(Text, { style: styles.totalsValue }, formatMoney(invoice.tax_amount, currencySymbol)),
          ) : null,
          createElement(View, { style: styles.totalsDivider }),
          createElement(View, { style: styles.totalRow },
            createElement(Text, { style: styles.totalLabel }, 'Total'),
            createElement(Text, { style: styles.totalValue }, formatMoney(invoice.total, currencySymbol)),
          ),
          invoice.amount_paid > 0 ? createElement(View, { style: styles.totalsRow },
            createElement(Text, { style: styles.totalsLabel }, 'Amount Paid'),
            createElement(Text, { style: styles.totalsValue }, formatMoney(invoice.amount_paid, currencySymbol)),
          ) : null,
          invoice.amount_paid > 0 && invoice.amount_paid < invoice.total ? createElement(View, { style: styles.totalsRow },
            createElement(Text, { style: [styles.totalsLabel, { color: '#dc2626' }] }, 'Balance Due'),
            createElement(Text, { style: [styles.totalsValue, { color: '#dc2626', fontFamily: 'Helvetica-Bold' }] }, formatMoney(invoice.total - invoice.amount_paid, currencySymbol)),
          ) : null,
        ),
      ),
      isPaid ? createElement(View, { style: [styles.statusBadge, styles.statusPaid] },
        createElement(Text, { style: [styles.statusText, styles.statusTextPaid] }, 'PAID'),
      ) : null,
      invoice.notes ? createElement(View, { style: styles.notesSection },
        createElement(Text, { style: styles.notesLabel }, 'Notes'),
        createElement(Text, { style: styles.notesText }, invoice.notes),
      ) : null,
      invoice.payment_notes ? createElement(View, { style: [styles.notesSection, { marginTop: 8 }] },
        createElement(Text, { style: styles.notesLabel }, 'Payment Details'),
        createElement(Text, { style: styles.notesText }, invoice.payment_notes),
      ) : null,
      createElement(View, { style: styles.footer },
        createElement(Text, { style: styles.footerText }, `${invoice.invoice_number} · Generated by CreatorOS`),
        createElement(Text, { style: styles.footerText }, 'Page 1'),
      ),
    )
  )
}

export async function renderInvoicePdf(data: InvoiceRenderData): Promise<Buffer> {
  const doc = createElement(InvoiceDocument, { data })
  const buffer = await renderToBuffer(doc as any)
  return buffer
}
