'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { PushSubscription, NotificationLogWithTask, NotificationType } from '@/types'
import { toast } from 'sonner'

export function usePushSubscriptions() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['push-subscriptions'],
    queryFn: async (): Promise<PushSubscription[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useNotificationLog(filters?: { limit?: number; notification_type?: NotificationType }) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['notification-log', filters],
    queryFn: async (): Promise<NotificationLogWithTask[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      let query = supabase
        .from('notification_log')
        .select('*, tasks(id, title, deadline, status)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(filters?.limit ?? 50)
      if (filters?.notification_type) {
        query = query.eq('notification_type', filters.notification_type)
      }
      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
    staleTime: 30 * 1000,
  })
}

export function useUnreadNotificationCount() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['notification-count'],
    queryFn: async (): Promise<number> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return 0
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { count, error } = await supabase
        .from('notification_log')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'sent')
        .gte('sent_at', oneDayAgo)
      if (error) return 0
      return count ?? 0
    },
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient()
  const supabase = createClient()
  return useMutation({
    mutationFn: async (data: { notifications_enabled?: boolean; notify_24h_before?: boolean; notify_overdue?: boolean; notification_sound?: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('user_settings')
        .update(data)
        .eq('user_id', user.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

export function useSaveSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { subscription: PushSubscriptionJSON; device_label: string; user_agent: string }) => {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['push-subscriptions'] })
    },
  })
}

export function useRemoveSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (endpoint: string) => {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['push-subscriptions'] })
    },
  })
}

export function useSendTestNotification() {
  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'CreatorOS Test',
          body: 'Notifications are working!',
          notification_type: 'test',
          tag: `test-${Date.now()}`,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      return data
    },
  })
}
