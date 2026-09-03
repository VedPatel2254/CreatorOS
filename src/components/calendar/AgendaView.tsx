'use client'

import { TaskWithRelations, CalendarDay } from '@/types'
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge'
import { getClientColor, isTaskOverdue, formatEventTime, getDayLabel } from '@/lib/calendar-utils'
import { cn } from '@/lib/utils'
import { Plus, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format, isToday, isBefore, startOfDay } from 'date-fns'

interface AgendaViewProps {
  days: CalendarDay[]
  onTaskClick: (task: TaskWithRelations) => void
  onAddTask: (date: Date) => void
  timezone: string
}

export function AgendaView({ days, onTaskClick, onAddTask, timezone }: AgendaViewProps) {
  const daysWithTasks = days.filter((d) => d.tasks.length > 0)

  if (daysWithTasks.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p>No tasks this month.</p>
        <Button size="sm" variant="outline" onClick={() => onAddTask(new Date())} className="mt-3 border-slate-700 text-slate-300">
          <Plus className="mr-2 h-4 w-4" />Add Task
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {daysWithTasks.map((day) => {
        const dayLabel = getDayLabel(day.date)
        const isPast = isBefore(day.date, startOfDay(new Date())) && !isToday(day.date)
        const hasOverdue = day.tasks.some((t) => isTaskOverdue(t))

        return (
          <div key={format(day.date, 'yyyy-MM-dd')}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className={cn(
                'text-sm font-semibold uppercase tracking-wider',
                isToday(day.date) ? 'text-violet-400' : hasOverdue ? 'text-red-400' : 'text-slate-400'
              )}>
                {hasOverdue && !isToday(day.date) ? 'OVERDUE' : dayLabel}
              </h3>
              <span className="text-xs text-slate-600">{format(day.date, 'd MMM yyyy')}</span>
            </div>
            <div className="space-y-2">
              {day.tasks.map((task) => {
                const clientColor = getClientColor(task.client_id)
                const time = formatEventTime(task.deadline, timezone)
                const overdue = isTaskOverdue(task)
                return (
                  <button
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className={cn(
                      'w-full text-left p-3 rounded-xl border transition-colors hover:bg-slate-800/50',
                      'bg-slate-900/50 border-slate-700',
                      overdue && 'border-l-2 border-l-red-500'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={cn('w-2 h-2 rounded-full flex-shrink-0', clientColor.bg)} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span>{task.clients?.business_name}</span>
                            <span>·</span>
                            <span>{task.work_types?.name}</span>
                            {time && (
                              <>
                                <span>·</span>
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{time}</span>
                              </>
                            )}
                          </div>
                          <p className="text-sm font-medium text-slate-50 truncate">{task.title}</p>
                        </div>
                      </div>
                      <TaskStatusBadge status={task.status} className="text-[10px] py-0 px-1.5 flex-shrink-0 ml-2" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
