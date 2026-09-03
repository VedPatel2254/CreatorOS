'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Client, ClientWithPricing, ClientPricingRuleWithWorkType } from '@/types'

export function useClients() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['clients'],
    queryFn: async (): Promise<Client[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data ?? []
    },
    staleTime: 60 * 1000,
  })
}

export function useActiveClientCount() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['clients', 'active-count'],
    queryFn: async (): Promise<number> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { count, error } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (error) throw error
      return count ?? 0
    },
    staleTime: 60 * 1000,
  })
}

export function useClient(id: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['clients', id],
    queryFn: async (): Promise<ClientWithPricing> => {
      if (!id) throw new Error('No client ID')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          client_pricing_rules (
            *,
            work_types (id, name)
          )
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      return data as ClientWithPricing
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (data: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: client, error } = await supabase
        .from('clients')
        .insert({ ...data, user_id: user.id })
        .select()
        .single()

      if (error) throw error
      return client
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Client> & { id: string }) => {
      const { error } = await supabase
        .from('clients')
        .update(data)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['clients', variables.id] })
    },
  })
}

export function useArchiveClient() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clients')
        .update({ status: 'archived' })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useUnarchiveClient() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clients')
        .update({ status: 'active' })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useAddPricingRule() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (data: { client_id: string; work_type_id: string; unit_price: number; effective_from?: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Expire any existing rule for this work type on this client
      const today = new Date().toISOString().split('T')[0]
      await supabase
        .from('client_pricing_rules')
        .update({ effective_to: today })
        .eq('client_id', data.client_id)
        .eq('work_type_id', data.work_type_id)
        .is('effective_to', null)

      const { data: rule, error } = await supabase
        .from('client_pricing_rules')
        .insert({
          client_id: data.client_id,
          work_type_id: data.work_type_id,
          unit_price: data.unit_price,
          user_id: user.id,
          effective_from: data.effective_from ?? today,
        })
        .select()
        .single()

      if (error) throw error
      return rule
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients', variables.client_id] })
    },
  })
}

export function useUpdatePricingRule() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, unit_price, client_id }: { id: string; unit_price: number; client_id: string }) => {
      const { error } = await supabase
        .from('client_pricing_rules')
        .update({ unit_price })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients', variables.client_id] })
    },
  })
}

export function useDeletePricingRule() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, client_id }: { id: string; client_id: string }) => {
      const { error } = await supabase
        .from('client_pricing_rules')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients', variables.client_id] })
    },
  })
}
