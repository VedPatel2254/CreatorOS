'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { PdfImportBatchWithClient, PdfImportBatch } from '@/types'

export function useImportBatches(clientId?: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['import-batches', clientId ?? 'all'],
    queryFn: async (): Promise<PdfImportBatchWithClient[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let query = supabase
        .from('pdf_import_batches')
        .select('*, clients(id, business_name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (clientId) {
        query = query.eq('client_id', clientId)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as PdfImportBatchWithClient[]
    },
    staleTime: 30 * 1000,
  })
}

export function useImportBatch(batchId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['import-batches', batchId],
    queryFn: async (): Promise<PdfImportBatchWithClient> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('pdf_import_batches')
        .select('*, clients(id, business_name)')
        .eq('id', batchId)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      return data as PdfImportBatchWithClient
    },
    enabled: !!batchId,
    staleTime: 30 * 1000,
  })
}

export function useDiscardImportBatch() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (batchId: string) => {
      const { error } = await supabase
        .from('pdf_import_batches')
        .update({ status: 'discarded' })
        .eq('id', batchId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-batches'] })
    },
  })
}
