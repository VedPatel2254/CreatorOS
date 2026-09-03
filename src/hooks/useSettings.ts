'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { UserSettings, WorkType } from '@/types'

export function useSettings() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['settings'],
    queryFn: async (): Promise<UserSettings> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (data: Partial<UserSettings>) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error(authError?.message || 'Not authenticated')

      const { data: result, error } = await supabase
        .from('user_settings')
        .upsert({ ...data, user_id: user.id }, { onConflict: 'user_id' })
        .select()
        .single()

      if (error) {
        console.error('Settings update error:', error)
        throw error
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

export function useWorkTypes() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['work-types'],
    queryFn: async (): Promise<WorkType[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('work_types')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true })

      if (error) throw error
      return data ?? []
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useAddWorkType() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: existing } = await supabase
        .from('work_types')
        .select('id')
        .eq('user_id', user.id)

      const sortOrder = (existing?.length ?? 0)

      const { data, error } = await supabase
        .from('work_types')
        .insert({ name, user_id: user.id, sort_order: sortOrder })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-types'] })
    },
  })
}

export function useUpdateWorkType() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; is_active?: boolean; sort_order?: number }) => {
      const { error } = await supabase
        .from('work_types')
        .update(data)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-types'] })
    },
  })
}

export function useDeleteWorkType() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('work_types')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-types'] })
    },
  })
}
