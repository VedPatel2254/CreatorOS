'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, CheckCircle, FileText, Eye, Send, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useClients } from '@/hooks/useClients'
import { useTasks } from '@/hooks/useTasks'
import { useSettings } from '@/hooks/useSettings'
import { useInvoices } from '@/hooks/useInvoices'
import { InvoicePreview } from '@/components/invoices/InvoicePreview'
import { InvoiceRenderData, InvoiceType, BilledTask, InvoiceLineItem } from '@/types'
import { roundCurrency, buildDetailedLineItems, buildSummaryLineItems, buildPackageLineItems, calculateInvoiceTotals } from '@/lib/billing-utils'
import { formatCurrency, formatDate } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'

type WizardStep = 'setup' | 'tasks' | 'adjust' | 'preview' | 'generating' | 'done'

export default function NewInvoicePage() {
  const router = useRouter()
  const { data: clients = [] } = useClients()
  const { data: settings } = useSettings()
  const activeClients = clients.filter(c => c.status === 'active')
  const currencySymbol = settings?.currency_symbol ?? '₹'

  const [step, setStep] = useState<WizardStep>('setup')
  const [clientId, setClientId] = useState('')
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('detailed')
  const [periodStart, setPeriodStart] = useState(format(new Date(), 'yyyy-MM-01'))
  const [periodEnd, setPeriodEnd] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd'))
  const [issueDate, setIssueDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [dueDate, setDueDate] = useState(format(new Date(Date.now() + 30 * 86400000), 'yyyy-MM-dd'))
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [discount, setDiscount] = useState(0)
  const [taxLabel, setTaxLabel] = useState('')
  const [taxRate, setTaxRate] = useState(0)
  const [notes, setNotes] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(null)
  const [createdInvoiceNumber, setCreatedInvoiceNumber] = useState('')
  const [createdTotal, setCreatedTotal] = useState(0)

  const selectedClient = activeClients.find(c => c.id === clientId)
  const isPackageClient = selectedClient?.billing_type === 'monthly_package'

  const { data: clientTasks = [] } = useTasks({ client_id: clientId })
  const availableTasks = clientTasks.filter(t =>
    t.status === 'delivered' &&
    t.is_billable &&
    !t.billing_locked &&
    t.completed_at &&
    t.completed_at >= periodStart &&
    t.completed_at <= periodEnd + 'T23:59:59'
  )

  const billedTasks: BilledTask[] = availableTasks.map(t => ({
    taskId: t.id,
    title: t.title,
    workTypeName: t.work_types?.name ?? 'Unknown',
    platform: t.platform,
    completedAt: t.completed_at!,
    effectiveUnitPrice: t.effective_unit_price ?? 0,
    billingQuantity: t.billing_quantity,
    billingAmount: roundCurrency((t.effective_unit_price ?? 0) * t.billing_quantity),
    billingLocked: t.billing_locked,
    importBatchId: t.import_batch_id,
  }))

  const selectedBilledTasks = billedTasks.filter(t => selectedTaskIds.includes(t.taskId))

  const lineItems = invoiceType === 'detailed'
    ? buildDetailedLineItems(selectedBilledTasks)
    : invoiceType === 'summary'
      ? buildSummaryLineItems(selectedBilledTasks)
      : buildPackageLineItems(selectedClient?.monthly_package_amount ?? 0, format(new Date(periodStart), 'MMMM yyyy'))

  const totals = calculateInvoiceTotals(lineItems, discount, taxRate)

  const renderData: InvoiceRenderData = {
    invoice: {
      id: '',
      user_id: '',
      client_id: clientId,
      invoice_number: 'INV-0000-0000',
      invoice_type: invoiceType,
      status: 'draft',
      issue_date: issueDate,
      due_date: dueDate,
      billing_period_start: periodStart,
      billing_period_end: periodEnd,
      subtotal: totals.subtotal,
      discount_amount: totals.discountAmount,
      tax_label: taxLabel,
      tax_rate: taxRate,
      tax_amount: totals.taxAmount,
      total: totals.total,
      amount_paid: 0,
      notes,
      payment_notes: paymentNotes,
      pdf_storage_path: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    lineItems: lineItems as InvoiceLineItem[],
    client: {
      id: clientId,
      business_name: selectedClient?.business_name ?? '',
      contact_name: selectedClient?.contact_name ?? '',
      email: selectedClient?.email ?? '',
      phone: selectedClient?.phone ?? '',
      address: selectedClient?.address ?? '',
    },
    business: {
      business_name: settings?.business_name ?? '',
      business_email: settings?.business_email ?? '',
      business_phone: settings?.business_phone ?? '',
      business_address: settings?.business_address ?? '',
      logo_url: settings?.logo_url ?? null,
      currency_symbol: currencySymbol,
      currency_code: settings?.currency_code ?? 'INR',
    },
    currencySymbol,
  }

  const handleGenerate = async () => {
    setStep('generating')
    try {
      const response = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          invoice_type: invoiceType,
          issue_date: issueDate,
          due_date: dueDate,
          billing_period_start: periodStart,
          billing_period_end: periodEnd,
          task_ids: invoiceType === 'package' ? [] : selectedTaskIds,
          discount_amount: discount,
          tax_label: taxLabel,
          tax_rate: taxRate,
          notes,
          payment_notes: paymentNotes,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setCreatedInvoiceId(data.invoice_id)
      setCreatedInvoiceNumber(data.invoice_number)
      setCreatedTotal(data.total)
      setStep('done')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate invoice')
      setStep('preview')
    }
  }

  const toggleTask = (taskId: string) => {
    setSelectedTaskIds(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    )
  }

  if (step === 'done') {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
          <CheckCircle className="h-10 w-10 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100 mt-6">Invoice Generated!</h1>
        <p className="text-slate-400 mt-2">{createdInvoiceNumber} · {formatCurrency(createdTotal, currencySymbol)}</p>
        <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
          <Button variant="outline" onClick={() => window.open(`/api/invoices/${createdInvoiceId}/pdf`, '_blank')} className="border-slate-700 text-slate-300">
            <FileText className="mr-2 h-4 w-4" />Download PDF
          </Button>
          <Button variant="outline" onClick={() => router.push(`/invoices/${createdInvoiceId}`)} className="border-slate-700 text-slate-300">
            <Eye className="mr-2 h-4 w-4" />View Invoice
          </Button>
          <Button variant="outline" onClick={() => router.push('/invoices')} className="border-slate-700 text-slate-300">
            <Plus className="mr-2 h-4 w-4" />Create Another
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.push('/invoices')} className="text-slate-400 hover:text-slate-50">
        <ArrowLeft className="mr-2 h-4 w-4" />Invoices
      </Button>

      <h1 className="text-2xl font-bold text-slate-50">New Invoice</h1>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8">
        {(['setup', 'tasks', 'adjust', 'preview'] as const).map((s, i) => {
          const stepOrder = ['setup', 'tasks', 'adjust', 'preview']
          const currentIdx = stepOrder.indexOf(step === 'generating' ? 'preview' : step)
          const isActive = stepOrder.indexOf(s) === currentIdx
          const isCompleted = stepOrder.indexOf(s) < currentIdx
          return (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                isActive ? 'bg-violet-600 border-violet-600 text-white' :
                isCompleted ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
                'border-slate-700 text-slate-500'
              }`}>
                {isCompleted ? '✓' : i + 1}
              </div>
              {i < 3 && <div className={`w-12 h-0.5 mx-2 ${isCompleted ? 'bg-emerald-500/30' : 'bg-slate-700'}`} />}
            </div>
          )
        })}
      </div>

      {/* Step 1: Setup */}
      {(step === 'setup' || step === 'generating') && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Client *</Label>
            <Select value={clientId} onValueChange={(v) => { setClientId(v); setSelectedTaskIds([]) }}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-50">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {activeClients.map(c => <SelectItem key={c.id} value={c.id}>{c.business_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Invoice Type *</Label>
            <div className="flex flex-col gap-2">
              {(['detailed', 'summary', 'package'] as const).map(type => (
                <label key={type} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  invoiceType === type ? 'border-violet-500 bg-violet-500/10' : 'border-slate-700 hover:bg-slate-800'
                } ${type === 'package' && !isPackageClient ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input
                    type="radio"
                    name="invoiceType"
                    value={type}
                    checked={invoiceType === type}
                    onChange={() => setInvoiceType(type)}
                    disabled={type === 'package' && !isPackageClient}
                    className="text-violet-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-200 capitalize">{type} Invoice</p>
                    <p className="text-xs text-slate-400">
                      {type === 'detailed' && 'One line item per delivery'}
                      {type === 'summary' && 'Aggregated by work type'}
                      {type === 'package' && 'Fixed monthly retainer'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Period From</Label>
              <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="bg-slate-800 border-slate-700 text-slate-50" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Period To</Label>
              <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="bg-slate-800 border-slate-700 text-slate-50" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Issue Date</Label>
              <Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} className="bg-slate-800 border-slate-700 text-slate-50" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Due Date</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="bg-slate-800 border-slate-700 text-slate-50" />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              disabled={!clientId}
              onClick={() => setStep(invoiceType === 'package' ? 'adjust' : 'tasks')}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Select Tasks */}
      {step === 'tasks' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-50">Select Tasks</h2>
          {availableTasks.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No uninvoiced delivered tasks found for this period.</p>
          ) : (
            <>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedTaskIds(availableTasks.map(t => t.id))} className="border-slate-700 text-slate-300">Select All</Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedTaskIds([])} className="border-slate-700 text-slate-300">Deselect All</Button>
              </div>
              <div className="space-y-2">
                {availableTasks.map(task => (
                  <label key={task.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedTaskIds.includes(task.id) ? 'border-violet-500 bg-violet-500/10' : 'border-slate-700 hover:bg-slate-800'
                  }`}>
                    <input type="checkbox" checked={selectedTaskIds.includes(task.id)} onChange={() => toggleTask(task.id)} className="text-violet-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{task.title}</p>
                      <p className="text-xs text-slate-400">{task.work_types?.name} · {formatDate(task.completed_at!)}</p>
                    </div>
                    <p className="text-sm font-medium text-slate-100">{formatCurrency(roundCurrency((task.effective_unit_price ?? 0) * task.billing_quantity), currencySymbol)}</p>
                  </label>
                ))}
              </div>
              <p className="text-sm text-slate-400">{selectedTaskIds.length} tasks selected · Subtotal: {formatCurrency(totals.subtotal, currencySymbol)}</p>
            </>
          )}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('setup')} className="border-slate-700 text-slate-300">Back</Button>
            <Button disabled={selectedTaskIds.length === 0} onClick={() => setStep('adjust')} className="bg-violet-600 hover:bg-violet-700 text-white">Continue</Button>
          </div>
        </div>
      )}

      {/* Step 3: Adjust */}
      {step === 'adjust' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-50">Adjustments</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Discount</Label>
              <Input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="bg-slate-800 border-slate-700 text-slate-50" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Tax Rate (%)</Label>
              <Input type="number" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} className="bg-slate-800 border-slate-700 text-slate-50" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Tax Label</Label>
            <Input value={taxLabel} onChange={e => setTaxLabel(e.target.value)} placeholder="GST, VAT, etc." className="bg-slate-800 border-slate-700 text-slate-50" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="bg-slate-800 border-slate-700 text-slate-50" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Payment Details</Label>
            <Textarea value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} className="bg-slate-800 border-slate-700 text-slate-50" />
          </div>
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="flex justify-between text-sm"><span className="text-slate-400">Subtotal</span><span className="text-slate-100">{formatCurrency(totals.subtotal, currencySymbol)}</span></div>
            {discount > 0 && <div className="flex justify-between text-sm"><span className="text-slate-400">Discount</span><span className="text-slate-100">-{formatCurrency(totals.discountAmount, currencySymbol)}</span></div>}
            {taxRate > 0 && <div className="flex justify-between text-sm"><span className="text-slate-400">{taxLabel || 'Tax'} ({taxRate}%)</span><span className="text-slate-100">{formatCurrency(totals.taxAmount, currencySymbol)}</span></div>}
            <hr className="border-slate-700 my-2" />
            <div className="flex justify-between font-bold"><span className="text-slate-50">Total</span><span className="text-violet-400">{formatCurrency(totals.total, currencySymbol)}</span></div>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(invoiceType === 'package' ? 'setup' : 'tasks')} className="border-slate-700 text-slate-300">Back</Button>
            <Button onClick={() => setStep('preview')} className="bg-violet-600 hover:bg-violet-700 text-white">Preview Invoice</Button>
          </div>
        </div>
      )}

      {/* Step 4: Preview */}
      {step === 'preview' && (
        <div className="space-y-4">
          <InvoicePreview data={renderData} showWatermark={true} />
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('adjust')} className="border-slate-700 text-slate-300">Back</Button>
            <Button onClick={handleGenerate} className="bg-violet-600 hover:bg-violet-700 text-white">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...
            </Button>
          </div>
        </div>
      )}

      {step === 'generating' && (
        <div className="text-center py-16">
          <Loader2 className="h-12 w-12 text-violet-500 animate-spin mx-auto" />
          <p className="text-slate-400 mt-4">Generating invoice...</p>
        </div>
      )}
    </div>
  )
}
