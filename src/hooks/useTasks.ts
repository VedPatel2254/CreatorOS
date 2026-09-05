'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Task, TaskWithRelations, TaskStatus } from '@/types'
import { resolveExpectedPrice } from '@/lib/billing-utils'

export function useTasks(filters?: { status?: TaskStatus; client_id?: string; work_type_id?: string }) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async (): Promise<TaskWithRelations[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let query = supabase
        .from('tasks')
        .select(`
          *,
          clients (id, business_name, status),
          work_types (id, name)
        `)
        .eq('user_id', user.id)

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.client_id) {
        query = query.eq('client_id', filters.client_id)
      }
      if (filters?.work_type_id) {
        query = query.eq('work_type_id', filters.work_type_id)
      }

      query = query.order('deadline', { ascending: true })

      const { data, error } = await query

      if (error) throw error
      return (data ?? []) as TaskWithRelations[]
    },
    staleTime: 30 * 1000,
  })
}

export function useTaskStats() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['tasks', 'stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('tasks')
        .select('status')
        .eq('user_id', user.id)

      if (error) throw error

      const stats: Record<string, number> = {
        planned: 0, in_progress: 0, ready: 0, delivered: 0, cancelled: 0, total: 0,
      }

      data?.forEach((task) => {
        stats[task.status] = (stats[task.status] || 0) + 1
        stats.total++
      })

      return stats
    },
    staleTime: 30 * 1000,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (data: {
      client_id: string
      work_type_id: string
      title: string
      description?: string
      platform?: string
      deadline: string
      is_billable?: boolean
      billing_quantity?: number
      effective_unit_price?: number | null
      billing_notes?: string
      notes?: string
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Fetch client pricing rules to resolve price
      const { data: clientData } = await supabase
        .from('clients')
        .select(`
          *,
          client_pricing_rules (
            *,
            work_types (id, name)
          )
        `)
        .eq('id', data.client_id)
        .single()

      const resolvedPrice = data.effective_unit_price ?? resolveExpectedPrice(
        (clientData as any)?.client_pricing_rules ?? [],
        data.work_type_id,
        data.effective_unit_price
      )

      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          ...data,
          user_id: user.id,
          status: 'planned',
          source: 'manual',
          effective_unit_price: resolvedPrice,
          billing_quantity: data.billing_quantity ?? 1,
          is_billable: data.is_billable ?? true,
        })
        .select()
        .single()

      if (error) throw error

      // Log activity
      await supabase.from('activity_log').insert({
        user_id: user.id,
        entity_type: 'task',
        entity_id: task.id,
        action: 'created',
        new_value: { title: data.title, status: 'planned' },
      })

      return task
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useCreateTasks() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (tasks: Array<{
      client_id: string
      work_type_id: string
      title: string
      description?: string
      platform?: string
      deadline: string
      is_billable?: boolean
      billing_quantity?: number
      effective_unit_price?: number | null
      billing_notes?: string
      notes?: string
    }>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const firstTask = tasks[0]
      const { data: clientData } = await supabase
        .from('clients')
        .select(`
          *,
          client_pricing_rules (
            *,
            work_types (id, name)
          )
        `)
        .eq('id', firstTask.client_id)
        .single()

      const resolvedPrice = firstTask.effective_unit_price ?? resolveExpectedPrice(
        (clientData as any)?.client_pricing_rules ?? [],
        firstTask.work_type_id,
        firstTask.effective_unit_price
      )

      const rows = tasks.map((t) => ({
        user_id: user.id,
        client_id: t.client_id,
        work_type_id: t.work_type_id,
        title: t.title,
        description: t.description ?? '',
        platform: t.platform ?? '',
        deadline: t.deadline,
        status: 'planned' as const,
        source: 'manual' as const,
        is_billable: t.is_billable ?? true,
        billing_quantity: t.billing_quantity ?? 1,
        effective_unit_price: t.effective_unit_price ?? resolvedPrice,
        billing_notes: t.billing_notes ?? '',
        notes: t.notes ?? '',
      }))

      const { data: created, error } = await supabase
        .from('tasks')
        .insert(rows)
        .select()

      if (error) throw error

      if (created && created.length > 0) {
        const logEntries = created.map((t) => ({
          user_id: user.id,
          entity_type: 'task' as const,
          entity_id: t.id,
          action: 'created' as const,
          new_value: { title: firstTask.title, status: 'planned' },
        }))
        await supabase.from('activity_log').insert(logEntries)
      }

      return created ?? []
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get current task for old status
      const { data: currentTask } = await supabase
        .from('tasks')
        .select('status, title')
        .eq('id', id)
        .single()

      const updateData: Partial<Task> = { status }
      if (status === 'delivered') {
        updateData.completed_at = new Date().toISOString()
      } else {
        updateData.completed_at = null
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      // Log activity
      await supabase.from('activity_log').insert({
        user_id: user.id,
        entity_type: 'task',
        entity_id: id,
        action: 'status_changed',
        old_value: { status: currentTask?.status },
        new_value: { status },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useBulkUpdateTaskStatus() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ task_ids, status }: { task_ids: string[]; status: TaskStatus }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const updateData: Partial<Task> = { status }
      if (status === 'delivered') {
        updateData.completed_at = new Date().toISOString()
      } else {
        updateData.completed_at = null
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .in('id', task_ids)

      if (error) throw error

      // Log activity for each task
      const logs = task_ids.map((id) => ({
        user_id: user.id,
        entity_type: 'task' as const,
        entity_id: id,
        action: 'status_changed',
        old_value: null,
        new_value: { status, bulk: true },
      }))

      await supabase.from('activity_log').insert(logs)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Task> & { id: string }) => {
      const { error } = await supabase
        .from('tasks')
        .update(data)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) throw error

      await supabase.from('activity_log').insert({
        user_id: user.id,
        entity_type: 'task',
        entity_id: id,
        action: 'deleted',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useTasksDueToday() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['tasks-due-today'],
    queryFn: async (): Promise<TaskWithRelations[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)

      const { data, error } = await supabase
        .from('tasks')
        .select('*, clients(id, business_name, status), work_types(id, name)')
        .eq('user_id', user.id)
        .gte('deadline', startOfDay.toISOString())
        .lt('deadline', endOfDay.toISOString())
        .not('status', 'in', '("delivered","cancelled")')
        .order('deadline', { ascending: true })

      if (error) throw error
      return (data ?? []) as TaskWithRelations[]
    },
    staleTime: 30 * 1000,
  })
}

export function useTasksDueThisWeek() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['tasks-due-this-week'],
    queryFn: async (): Promise<TaskWithRelations[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const now = new Date()
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      const in7Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 8)

      const { data, error } = await supabase
        .from('tasks')
        .select('*, clients(id, business_name, status), work_types(id, name)')
        .eq('user_id', user.id)
        .gte('deadline', tomorrow.toISOString())
        .lt('deadline', in7Days.toISOString())
        .not('status', 'in', '("delivered","cancelled")')
        .order('deadline', { ascending: true })

      if (error) throw error
      return (data ?? []) as TaskWithRelations[]
    },
    staleTime: 30 * 1000,
  })
}

export function useOverdueTasks() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['tasks-overdue'],
    queryFn: async (): Promise<TaskWithRelations[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('tasks')
        .select('*, clients(id, business_name, status), work_types(id, name)')
        .eq('user_id', user.id)
        .lt('deadline', new Date().toISOString())
        .not('status', 'in', '("delivered","cancelled")')
        .order('deadline', { ascending: true })

      if (error) throw error
      return (data ?? []) as TaskWithRelations[]
    },
    staleTime: 30 * 1000,
  })
}
