'use client'

import Link from 'next/link'
import { ArrowRight, AlertTriangle } from 'lucide-react'
import { TaskWithRelations } from '@/types'
import { getClientColor } from '@/lib/calendar-utils'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

type OverdueTasksProps = {
  tasks: TaskWithRelations[]
  isLoading: boolean
}

function getOverdueDuration(deadline: string): string {
  const diffMs = Date.now() - new Date(deadline).getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Overdue today'
  if (diffDays === 1) return 'Overdue 1 day'
  return `Overdue ${diffDays} days`
}

export function OverdueTasks({ tasks, isLoading }: OverdueTasksProps) {
  if (isLoading) return null
  if (tasks.length === 0) return null

  const shown = tasks.slice(0, 5)
  const remaining = tasks.length - shown.length

  return (
    <div className="border-l-4 border-red-500 pl-4 mb-6">
      <div className="space-y-2">
        {shown.map(task => {
          const color = getClientColor(task.client_id)
          return (
            <div key={task.id} className="flex items-center gap-3 py-2.5 border-b border-slate-700/30 last:border-b-0">
              <span className={cn('w-2 h-2 rounded-full shrink-0', color.bg)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 truncate">{task.clients?.business_name}</span>
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', color.light)}>
                    {task.work_types?.name}
                  </span>
                </div>
                <Link href={`/work/${task.id}`} className="text-sm text-slate-200 hover:text-violet-400 transition-colors truncate block">
                  {task.title}
                </Link>
              </div>
              <span className="text-xs text-red-400 shrink-0">{getOverdueDuration(task.deadline)}</span>
              <Link href={`/work/${task.id}`} className="text-slate-400 hover:text-slate-200 transition-colors shrink-0" aria-label={`View ${task.title} details`}>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )
        })}
      </div>
      {remaining > 0 && (
        <Link href="/work" className="text-xs text-violet-400 hover:text-violet-300 mt-2 inline-block">
          {remaining} more overdue task{remaining > 1 ? 's' : ''}
        </Link>
      )}
    </div>
  )
}
