import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  buildDetailedLineItems,
  buildSummaryLineItems,
  buildPackageLineItems,
  calculateInvoiceTotals,
  roundCurrency,
} from '@/lib/billing-utils'
import { InvoiceGenerationInput, BilledTask } from '@/types'
import { format } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const input: InvoiceGenerationInput = await request.json()

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, business_name, billing_type, monthly_package_amount')
      .eq('id', input.client_id)
      .eq('user_id', user.id)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const { data: invoiceNumberData, error: numberError } = await supabase
      .rpc('get_next_invoice_number', { p_user_id: user.id })

    if (numberError || !invoiceNumberData) {
      return NextResponse.json(
        { error: 'Failed to generate invoice number' },
        { status: 500 }
      )
    }

    const invoiceNumber = invoiceNumberData as string

    let billedTasks: BilledTask[] = []

    if (input.invoice_type !== 'package' && input.task_ids.length > 0) {
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, status, is_billable, effective_unit_price, billing_quantity, billing_locked, completed_at, import_batch_id, work_types(id, name)')
        .in('id', input.task_ids)
        .eq('user_id', user.id)
        .eq('status', 'delivered')
        .eq('is_billable', true)

      if (tasksError) {
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
      }

      const alreadyLocked = tasks?.filter(t => t.billing_locked) ?? []
      if (alreadyLocked.length > 0) {
        return NextResponse.json(
          { error: 'Some tasks have already been invoiced', locked_task_ids: alreadyLocked.map(t => t.id) },
          { status: 409 }
        )
      }

      billedTasks = (tasks ?? []).map(t => ({
        taskId: t.id,
        title: t.title,
        workTypeName: (t.work_types as any)?.name ?? 'Unknown',
        platform: '',
        completedAt: t.completed_at!,
        effectiveUnitPrice: t.effective_unit_price ?? 0,
        billingQuantity: t.billing_quantity,
        billingAmount: roundCurrency((t.effective_unit_price ?? 0) * t.billing_quantity),
        billingLocked: t.billing_locked,
        importBatchId: t.import_batch_id,
      }))
    }

    let lineItems: ReturnType<typeof buildDetailedLineItems> = []

    switch (input.invoice_type) {
      case 'detailed':
        lineItems = buildDetailedLineItems(billedTasks)
        break
      case 'summary':
        lineItems = buildSummaryLineItems(billedTasks)
        break
      case 'package': {
        const packageAmount = client.monthly_package_amount ?? 0
        const periodLabel = format(new Date(input.billing_period_start), 'MMMM yyyy')
        lineItems = buildPackageLineItems(packageAmount, periodLabel)
        break
      }
    }

    if (lineItems.length === 0 && input.invoice_type !== 'package') {
      return NextResponse.json(
        { error: 'No billable tasks found for the selected period' },
        { status: 400 }
      )
    }

    const totals = calculateInvoiceTotals(lineItems, input.discount_amount, input.tax_rate)

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        user_id: user.id,
        client_id: input.client_id,
        invoice_number: invoiceNumber,
        invoice_type: input.invoice_type,
        status: 'draft',
        issue_date: input.issue_date,
        due_date: input.due_date,
        billing_period_start: input.billing_period_start,
        billing_period_end: input.billing_period_end,
        subtotal: totals.subtotal,
        discount_amount: totals.discountAmount,
        tax_label: input.tax_label,
        tax_rate: input.tax_rate,
        tax_amount: totals.taxAmount,
        total: totals.total,
        amount_paid: 0,
        notes: input.notes,
        payment_notes: input.payment_notes,
      })
      .select()
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
    }

    if (lineItems.length > 0) {
      const { error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .insert(lineItems.map(item => ({ ...item, invoice_id: invoice.id })))

      if (lineItemsError) {
        await supabase.from('invoices').delete().eq('id', invoice.id)
        return NextResponse.json({ error: 'Failed to create invoice line items' }, { status: 500 })
      }
    }

    if (input.task_ids.length > 0 && input.invoice_type !== 'package') {
      await supabase
        .from('tasks')
        .update({ billing_locked: true })
        .in('id', input.task_ids)
        .eq('user_id', user.id)
    }

    await supabase.from('activity_log').insert({
      user_id: user.id,
      entity_type: 'invoice',
      entity_id: invoice.id,
      action: 'invoice_generated',
      new_value: {
        invoice_number: invoiceNumber,
        client_id: input.client_id,
        invoice_type: input.invoice_type,
        total: totals.total,
        task_count: input.task_ids.length,
      },
    })

    return NextResponse.json({
      invoice_id: invoice.id,
      invoice_number: invoiceNumber,
      total: totals.total,
    })

  } catch (error) {
    console.error('Invoice generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    )
  }
}
