'use client'

import Link from 'next/link'
import { Calendar } from 'lucide-react'
import { TaskWithRelations } from '@/types'
import { getClientColor, formatEventTime, getDayLabel } from '@/lib/calendar-utils'
import { TASK_STATUS_CONFIG } from '@/lib/task-status'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { useMemo } from 'react'

type UpcomingTasksProps = {
  tasks: TaskWithRelations[]
  isLoading: boolean
  timezone: string
}

export function UpcomingTasks({ tasks, isLoading, timezone }: UpcomingTasksProps) {
  const grouped = useMemo(() => {
    const groups: Record<string, TaskWithRelations[]> = {}
    for (const task of tasks) {
      const date = new Date(task.deadline)
      date.setHours(0, 0, 0, 0)
      const key = date.toISOString()
      if (!groups[key]) groups[key] = []
      groups[key].push(task)
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [tasks])

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 rounded-lg bg-slate-800" />)}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-slate-400">No upcoming tasks in the next 7 days.</p>
        <Link href="/work" className="text-xs text-violet-400 hover:text-violet-300 mt-1 inline-block">
          Add a Task →
        </Link>
      </div>
    )
  }

  const shown = tasks.slice(0, 10)
  const remaining = tasks.length - shown.length

  return (
    <div>
      {grouped.map(([dateKey, dayTasks]) => {
        const displayTasks = dayTasks.filter(t => shown.includes(t))
        if (displayTasks.length === 0) return null

        return (
          <div key={dateKey} className="mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-4 mb-2 first:mt-0">
              {getDayLabel(new Date(dateKey))}
            </p>
            <div className="space-y-1">
              {displayTasks.map(task => {
                const color = getClientColor(task.client_id)
                const time = formatEventTime(task.deadline, timezone)
                const statusConfig = TASK_STATUS_CONFIG[task.status]

                return (
                  <Link
                    key={task.id}
                    href={`/work/${task.id}`}
                    className="flex items-center gap-3 py-2 hover:bg-slate-800/20 rounded-lg px-2 transition-colors"
                  >
                    <span className={cn('w-2 h-2 rounded-full shrink-0', color.bg)} />
                    <span className="text-xs text-slate-400 w-20 truncate shrink-0">{task.clients?.business_name}</span>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded border shrink-0', color.light)}>
                      {task.work_types?.name}
                    </span>
                    <span className="text-sm text-slate-200 flex-1 truncate">{task.title}</span>
                    {time && <span className="text-xs text-slate-500 shrink-0">{time}</span>}
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded shrink-0', statusConfig.bgColor, statusConfig.color)}>
                      {statusConfig.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })}
      {remaining > 0 && (
        <Link href="/work" className="text-xs text-violet-400 hover:text-violet-300 mt-2 inline-block">
          {remaining} more task{remaining > 1 ? 's' : ''} this week
        </Link>
      )}
    </div>
  )
}
