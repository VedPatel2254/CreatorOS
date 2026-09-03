'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import {
  PaymentRecord,
  PaymentRecordWithClient,
  TaskWithRelations,
  ClientWithPricing,
  DateRange,
  ClientBillingSummary,
  BillingPeriodSummary,
} from '@/types'
import {
  calculateClientBilling,
  calculateBillingPeriodSummary,
  getDateRangeForPreset,
} from '@/lib/billing-utils'

export function useBillingData(dateRange: DateRange) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['billing', dateRange.start, dateRange.end],
    queryFn: async (): Promise<BillingPeriodSummary> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: clients } = await supabase
        .from('clients')
        .select('*, client_pricing_rules(*, work_types(id, name))')
        .eq('user_id', user.id)

      const { data: tasks } = await supabase
        .from('tasks')
        .select('*, clients(id, business_name, status), work_types(id, name)')
        .eq('user_id', user.id)

      const { data: payments } = await supabase
        .from('payment_records')
        .select('*')
        .eq('user_id', user.id)

      const allClients = (clients ?? []) as ClientWithPricing[]
      const allTasks = (tasks ?? []) as TaskWithRelations[]
      const allPayments = (payments ?? []) as PaymentRecord[]

      const clientSummaries: ClientBillingSummary[] = allClients.map(client =>
        calculateClientBilling(client, allTasks, client.client_pricing_rules ?? [], allPayments, dateRange)
      )

      return calculateBillingPeriodSummary(clientSummaries, dateRange)
    },
    staleTime: 30 * 1000,
  })
}

export function useClientBillingData(clientId: string, dateRange: DateRange) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['billing', 'client', clientId, dateRange.start, dateRange.end],
    queryFn: async (): Promise<ClientBillingSummary> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: client } = await supabase
        .from('clients')
        .select('*, client_pricing_rules(*, work_types(id, name))')
        .eq('id', clientId)
        .eq('user_id', user.id)
        .single()

      if (!client) throw new Error('Client not found')

      const { data: tasks } = await supabase
        .from('tasks')
        .select('*, clients(id, business_name, status), work_types(id, name)')
        .eq('user_id', user.id)
        .eq('client_id', clientId)

      const { data: payments } = await supabase
        .from('payment_records')
        .select('*')
        .eq('user_id', user.id)
        .eq('client_id', clientId)

      return calculateClientBilling(
        client as ClientWithPricing,
        (tasks ?? []) as TaskWithRelations[],
        (client as ClientWithPricing).client_pricing_rules ?? [],
        (payments ?? []) as PaymentRecord[],
        dateRange
      )
    },
    enabled: !!clientId,
    staleTime: 30 * 1000,
  })
}

export function usePaymentRecords(filters?: { client_id?: string; from?: string; to?: string }) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['payment-records', filters],
    queryFn: async (): Promise<PaymentRecordWithClient[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let query = supabase
        .from('payment_records')
        .select('*, clients(id, business_name)')
        .eq('user_id', user.id)
        .order('payment_date', { ascending: false })

      if (filters?.client_id) {
        query = query.eq('client_id', filters.client_id)
      }
      if (filters?.from) {
        query = query.gte('payment_date', filters.from)
      }
      if (filters?.to) {
        query = query.lte('payment_date', filters.to)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as PaymentRecordWithClient[]
    },
    staleTime: 30 * 1000,
  })
}

export function useCreatePaymentRecord() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (data: {
      client_id: string
      amount: number
      payment_date: string
      payment_method?: string
      reference?: string
      notes?: string
      invoice_id?: string
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: record, error } = await supabase
        .from('payment_records')
        .insert({
          ...data,
          user_id: user.id,
          invoice_id: data.invoice_id ?? null,
        })
        .select()
        .single()

      if (error) throw error

      await supabase.from('activity_log').insert({
        user_id: user.id,
        entity_type: 'payment',
        entity_id: record.id,
        action: 'payment_recorded',
        new_value: { amount: data.amount, client_id: data.client_id },
      })

      return record
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-records'] })
      queryClient.invalidateQueries({ queryKey: ['billing'] })
    },
  })
}

export function useUpdatePaymentRecord() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<PaymentRecord> & { id: string }) => {
      const { error } = await supabase
        .from('payment_records')
        .update(data)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-records'] })
      queryClient.invalidateQueries({ queryKey: ['billing'] })
    },
  })
}

export function useDeletePaymentRecord() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payment_records')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-records'] })
      queryClient.invalidateQueries({ queryKey: ['billing'] })
    },
  })
}

export function useUnpaidTotal() {
  const supabase = createClient()
  const dateRange = getDateRangeForPreset('this_month')

  return useQuery({
    queryKey: ['billing-unpaid-total'],
    queryFn: async (): Promise<{ total: number }> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: clients } = await supabase
        .from('clients')
        .select('*, client_pricing_rules(*, work_types(id, name))')
        .eq('user_id', user.id)

      const { data: tasks } = await supabase
        .from('tasks')
        .select('*, clients(id, business_name, status), work_types(id, name)')
        .eq('user_id', user.id)

      const { data: payments } = await supabase
        .from('payment_records')
        .select('*')
        .eq('user_id', user.id)

      const allClients = (clients ?? []) as ClientWithPricing[]
      const allTasks = (tasks ?? []) as TaskWithRelations[]
      const allPayments = (payments ?? []) as PaymentRecord[]

      const summaries = allClients.map(client =>
        calculateClientBilling(client, allTasks, client.client_pricing_rules ?? [], allPayments, dateRange)
      )

      const total = summaries.reduce((sum, s) => sum + s.totalUnpaid, 0)
      return { total: Math.round(total * 100) / 100 }
    },
    staleTime: 60 * 1000,
  })
}

export function useBillingSummaryForDashboard() {
  const dateRange = getDateRangeForPreset('this_month')
  const { data: summary, isLoading } = useBillingData(dateRange)

  return {
    totalEarned: summary?.totalDeliveredAmount ?? 0,
    totalPaid: summary?.totalPaidAmount ?? 0,
    totalUnpaid: summary?.totalUnpaidAmount ?? 0,
    totalPending: summary?.totalPendingAmount ?? 0,
    isLoading,
  }
}
