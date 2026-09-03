'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { ActivityLog } from '@/types'

export function useActivityLog(options?: { limit?: number; entity_type?: string; entity_id?: string }) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['activity-log', options],
    queryFn: async (): Promise<ActivityLog[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let query = supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', user.id)

      if (options?.entity_type) {
        query = query.eq('entity_type', options.entity_type)
      }
      if (options?.entity_id) {
        query = query.eq('entity_id', options.entity_id)
      }

      query = query
        .order('created_at', { ascending: false })
        .limit(options?.limit ?? 50)

      const { data, error } = await query

      if (error) throw error
      return data ?? []
    },
    staleTime: 30 * 1000,
  })
}

export function useRecentActivity(limit = 15) {
  return useActivityLog({ limit })
}
