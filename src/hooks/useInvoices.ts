'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Invoice, InvoiceWithDetails, InvoiceStatus } from '@/types'
import { deriveInvoiceStatus } from '@/lib/invoice-status'

interface InvoiceFilters {
  client_id?: string
  status?: InvoiceStatus | InvoiceStatus[]
  from?: string
  to?: string
  search?: string
}

export function useInvoices(filters?: InvoiceFilters) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: async (): Promise<(Invoice & { clients: { id: string; business_name: string } })[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let query = supabase
        .from('invoices')
        .select('id, user_id, client_id, invoice_number, invoice_type, status, issue_date, due_date, billing_period_start, billing_period_end, subtotal, discount_amount, tax_label, tax_rate, tax_amount, total, amount_paid, notes, payment_notes, pdf_storage_path, created_at, updated_at, clients(id, business_name)')
        .eq('user_id', user.id)
        .order('issue_date', { ascending: false })

      if (filters?.client_id) {
        query = query.eq('client_id', filters.client_id)
      }
      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status)
        } else {
          query = query.eq('status', filters.status)
        }
      }
      if (filters?.from) {
        query = query.gte('issue_date', filters.from)
      }
      if (filters?.to) {
        query = query.lte('issue_date', filters.to)
      }
      if (filters?.search) {
        query = query.ilike('invoice_number', `%${filters.search}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as any
    },
    staleTime: 30 * 1000,
  })
}

export function useInvoice(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['invoices', id],
    queryFn: async (): Promise<InvoiceWithDetails> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('invoices')
        .select('*, clients(id, business_name, contact_name, email, phone, address), invoice_line_items(*)')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      return data as InvoiceWithDetails
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  })
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, status, amount_paid }: { id: string; status?: InvoiceStatus; amount_paid?: number }) => {
      const updateData: Partial<Invoice> = {}
      if (status) updateData.status = status
      if (amount_paid !== undefined) updateData.amount_paid = amount_paid

      const { error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['billing'] })
      queryClient.invalidateQueries({ queryKey: ['payment-records'] })
    },
  })
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (invoice: InvoiceWithDetails) => {
      if (invoice.status === 'draft') {
        // Hard delete: unlock tasks first
        const lineItemTaskIds = invoice.invoice_line_items
          .filter(li => li.task_id)
          .map(li => li.task_id!)

        if (lineItemTaskIds.length > 0) {
          await supabase
            .from('tasks')
            .update({ billing_locked: false })
            .in('id', lineItemTaskIds)
        }

        // Delete line items
        await supabase
          .from('invoice_line_items')
          .delete()
          .eq('invoice_id', invoice.id)

        // Delete invoice
        const { error } = await supabase
          .from('invoices')
          .delete()
          .eq('id', invoice.id)

        if (error) throw error
      } else {
        // Soft delete: set status to cancelled
        const { error } = await supabase
          .from('invoices')
          .update({ status: 'cancelled' })
          .eq('id', invoice.id)

        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

export function useInvoiceStats() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['invoice-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('invoices')
        .select('status, total, amount_paid')
        .eq('user_id', user.id)

      if (error) throw error

      const stats = {
        draft: 0,
        sent: 0,
        paid: 0,
        partially_paid: 0,
        overdue: 0,
        cancelled: 0,
        total_outstanding: 0,
      }

      data?.forEach((invoice) => {
        stats[invoice.status as keyof typeof stats] = (stats[invoice.status as keyof typeof stats] || 0) + 1
        if (['sent', 'partially_paid', 'overdue'].includes(invoice.status)) {
          stats.total_outstanding += (invoice.total - invoice.amount_paid)
        }
      })

      return stats
    },
    staleTime: 30 * 1000,
  })
}

export function useMarkInvoicePaid() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (invoice: InvoiceWithDetails) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create payment record
      await supabase.from('payment_records').insert({
        user_id: user.id,
        client_id: invoice.client_id,
        invoice_id: invoice.id,
        amount: invoice.total - invoice.amount_paid,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'other',
        reference: `Invoice ${invoice.invoice_number}`,
        notes: 'Auto-recorded on marking invoice as paid',
      })

      // Update invoice
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          amount_paid: invoice.total,
        })
        .eq('id', invoice.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['billing'] })
      queryClient.invalidateQueries({ queryKey: ['payment-records'] })
    },
  })
}

export function useMarkInvoiceSent() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

export function useRecentInvoices(limit = 5) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['invoices-recent', limit],
    queryFn: async (): Promise<(Invoice & { clients: { id: string; business_name: string } })[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('invoices')
        .select('id, user_id, client_id, invoice_number, invoice_type, status, issue_date, due_date, billing_period_start, billing_period_end, subtotal, discount_amount, tax_label, tax_rate, tax_amount, total, amount_paid, notes, payment_notes, pdf_storage_path, created_at, updated_at, clients(id, business_name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data ?? []) as any
    },
    staleTime: 30 * 1000,
  })
}
