'use client'

import { useRouter } from 'next/navigation'
import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { useImportBatches } from '@/hooks/useImportBatches'
import { ImportBatchStatusBadge } from './ConfidenceBadge'
import { Skeleton } from '@/components/ui/skeleton'

interface ImportHistoryListProps {
  clientId: string
  clientName: string
}

export function ImportHistoryList({ clientId, clientName }: ImportHistoryListProps) {
  const router = useRouter()
  const { data: batches = [], isLoading } = useImportBatches(clientId)

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-lg border border-slate-700/50 bg-slate-800/30">
            <Skeleton className="h-4 w-48 bg-slate-700 mb-2" />
            <Skeleton className="h-3 w-32 bg-slate-700" />
          </div>
        ))}
      </div>
    )
  }

  if (batches.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">No imports yet.</p>
        <p className="text-sm text-slate-500 mt-1">Upload a PDF content calendar to get started.</p>
        <Button
          variant="outline"
          onClick={() => router.push(`/clients/${clientId}/import`)}
          className="mt-4 border-slate-700 text-slate-300"
        >
          Import PDF
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-400">Import History</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/clients/${clientId}/import`)}
          className="border-slate-700 text-slate-300"
        >
          Import PDF
        </Button>
      </div>
      <div className="space-y-0">
        {batches.map((batch) => (
          <div
            key={batch.id}
            className="flex items-center justify-between py-4 border-b border-slate-700/50 hover:bg-slate-800/20 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="h-5 w-5 text-slate-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{batch.original_filename}</p>
                <p className="text-xs text-slate-400">
                  {batch.task_count_created} tasks created · {formatDate(batch.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <ImportBatchStatusBadge status={batch.status} />
              {batch.status === 'confirmed' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/clients/${clientId}/import/${batch.id}`)}
                  className="text-violet-400 hover:text-violet-300"
                >
                  View Batch
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
