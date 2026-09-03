'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle, PartyPopper } from 'lucide-react'
import { TaskWithRelations, TaskStatus } from '@/types'
import { getClientColor, formatEventTime } from '@/lib/calendar-utils'
import { useUpdateTaskStatus } from '@/hooks/useTasks'
import { getValidTransitions, TASK_STATUS_CONFIG } from '@/lib/task-status'
import { StatusChangeDialog } from '@/components/tasks/StatusChangeDialog'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

type TodayDeliveriesProps = {
  tasks: TaskWithRelations[]
  isLoading: boolean
  timezone: string
}

export function TodayDeliveries({ tasks, isLoading, timezone }: TodayDeliveriesProps) {
  const updateStatus = useUpdateTaskStatus()
  const [statusDialog, setStatusDialog] = useState<{ task: TaskWithRelations; target: TaskStatus } | null>(null)

  const handleStatusChange = (task: TaskWithRelations, newStatus: TaskStatus) => {
    const valid = getValidTransitions(task.status)
    if (valid.includes(newStatus)) {
      setStatusDialog({ task, target: newStatus })
    }
  }

  const confirmStatusChange = async () => {
    if (!statusDialog) return
    await updateStatus.mutateAsync({ id: statusDialog.task.id, status: statusDialog.target })
    setStatusDialog(null)
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl bg-slate-800" />)}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
        <PartyPopper className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-200">No deliveries today!</p>
        <p className="text-xs text-slate-400 mt-1">Check upcoming tasks or enjoy the break.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {tasks.map(task => {
          const color = getClientColor(task.client_id)
          const isDelivered = task.status === 'delivered'
          const isOverdue = new Date(task.deadline) < new Date() && !isDelivered
          const time = formatEventTime(task.deadline, timezone)
          const validTransitions = getValidTransitions(task.status)

          return (
            <div
              key={task.id}
              className={cn(
                'bg-slate-800/50 border rounded-xl p-4 transition-colors hover:border-slate-600',
                isDelivered && 'opacity-50',
                isOverdue && !isDelivered && 'border-l-2 border-red-500 border-slate-700',
                !isDelivered && !isOverdue && 'border-slate-700'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('w-2 h-2 rounded-full shrink-0', color.bg)} />
                    <span className="text-xs text-slate-400 truncate">{task.clients?.business_name}</span>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', color.light)}>
                      {task.work_types?.name}
                    </span>
                    {time && <span className="text-xs text-slate-500 ml-auto shrink-0">{time}</span>}
                    {isOverdue && <span className="text-[10px] text-red-400 font-medium ml-1">Late</span>}
                  </div>
                  <Link href={`/work/${task.id}`} className={cn(
                    'text-sm font-medium text-slate-100 hover:text-violet-400 transition-colors',
                    isDelivered && 'line-through text-slate-400'
                  )}>
                    {task.title}
                  </Link>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  {isDelivered ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <CheckCircle className="h-3.5 w-3.5" />Delivered
                    </span>
                  ) : (
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                      className="text-xs bg-slate-700 border border-slate-600 text-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-500 min-h-[44px]"
                      aria-label={`Change status for ${task.title}`}
                    >
                      {validTransitions.map(s => (
                        <option key={s} value={s}>{TASK_STATUS_CONFIG[s].label}</option>
                      ))}
                    </select>
                  )}
                  <Link href={`/work/${task.id}`} className="text-slate-400 hover:text-slate-200 transition-colors" aria-label={`View ${task.title} details`}>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {statusDialog && (
        <StatusChangeDialog
          open={true}
          onOpenChange={() => setStatusDialog(null)}
          task={statusDialog.task}
          targetStatus={statusDialog.target}
          onConfirm={confirmStatusChange}
          isLoading={updateStatus.isPending}
        />
      )}
    </>
  )
}
