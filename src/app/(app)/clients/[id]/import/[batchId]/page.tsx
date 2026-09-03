'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useImportBatch } from '@/hooks/useImportBatches'
import { useTasks } from '@/hooks/useTasks'
import { ImportBatchStatusBadge } from '@/components/import/ConfidenceBadge'
import { formatDate, cn } from '@/lib/utils'
import { TASK_STATUS_CONFIG } from '@/lib/task-status'

export default function BatchDetailPage({ params }: { params: Promise<{ id: string; batchId: string }> }) {
  const { id, batchId } = use(params)
  const router = useRouter()
  const { data: batch, isLoading: batchLoading } = useImportBatch(batchId)
  const { data: tasks = [], isLoading: tasksLoading } = useTasks({ client_id: id })

  if (batchLoading || tasksLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48 bg-slate-800" />
        <Skeleton className="h-[200px] w-full bg-slate-800 rounded-xl" />
        <Skeleton className="h-[200px] w-full bg-slate-800 rounded-xl" />
      </div>
    )
  }

  if (!batch) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-xl font-semibold text-slate-300">Import batch not found</h2>
        <Button variant="link" onClick={() => router.push(`/clients/${id}`)} className="mt-4 text-violet-400">
          Back to Client
        </Button>
      </div>
    )
  }

  const batchTasks = tasks.filter(t => t.import_batch_id === batchId)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.push(`/clients/${id}?tab=imports`)} className="text-slate-400 hover:text-slate-50">
        <ArrowLeft className="mr-2 h-4 w-4" />Back to Client
      </Button>

      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center">
          <FileText className="h-6 w-6 text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-50 truncate">{batch.original_filename}</h1>
          <p className="text-sm text-slate-400">Imported {formatDate(batch.created_at)}</p>
        </div>
        <ImportBatchStatusBadge status={batch.status} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 text-center">
          <div className="text-2xl font-bold text-slate-50">{batch.task_count_extracted}</div>
          <div className="text-xs text-slate-400">Extracted</div>
        </div>
        <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 text-center">
          <div className="text-2xl font-bold text-emerald-400">{batch.task_count_created}</div>
          <div className="text-xs text-slate-400">Created</div>
        </div>
        <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 text-center">
          <div className="text-2xl font-bold text-slate-50 capitalize">{batch.extraction_confidence}</div>
          <div className="text-xs text-slate-400">Confidence</div>
        </div>
      </div>

      {batch.extraction_warnings && batch.extraction_warnings.length > 0 && (
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-sm font-medium text-amber-300 mb-1">Warnings</p>
          {batch.extraction_warnings.map((w, i) => (
            <p key={i} className="text-xs text-amber-400/80">• {w}</p>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-50">Tasks Created</h2>
        {batchTasks.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No tasks found for this import.</p>
        ) : (
          <div className="space-y-2">
            {batchTasks.map((task) => {
              const config = TASK_STATUS_CONFIG[task.status]
              return (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-50 truncate">{task.title}</p>
                    <p className="text-xs text-slate-400">{task.work_types?.name} · Due {formatDate(task.deadline)}</p>
                  </div>
                  <Badge className={cn('text-xs ml-3', config.bgColor, config.color, config.borderColor, 'border')}>
                    <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', config.dotColor)} />
                    {config.label}
                  </Badge>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
