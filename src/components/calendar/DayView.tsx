'use client'

import { CalendarDay, TaskWithRelations } from '@/types'
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge'
import { getClientColor, isTaskOverdue, formatEventTime } from '@/lib/calendar-utils'
import { formatDate, cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Plus, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DayViewProps {
  day: CalendarDay
  onTaskClick: (task: TaskWithRelations) => void
  onAddTask: (date: Date) => void
  timezone: string
}

export function DayView({ day, onTaskClick, onAddTask, timezone }: DayViewProps) {
  const sortedTasks = [...day.tasks].sort((a, b) => {
    const aTime = formatEventTime(a.deadline, timezone)
    const bTime = formatEventTime(b.deadline, timezone)
    if (aTime && !bTime) return -1
    if (!aTime && bTime) return 1
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-50">{format(day.date, 'EEEE, MMMM d, yyyy')}</h3>
          <p className="text-sm text-slate-400">{day.tasks.length} task{day.tasks.length !== 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" onClick={() => onAddTask(day.date)} className="bg-violet-600 hover:bg-violet-700 text-white">
          <Plus className="mr-2 h-4 w-4" />Add Task
        </Button>
      </div>

      {sortedTasks.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p>No tasks scheduled for this day.</p>
          <Button size="sm" variant="outline" onClick={() => onAddTask(day.date)} className="mt-3 border-slate-700 text-slate-300">
            <Plus className="mr-2 h-4 w-4" />Add Task
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedTasks.map((task) => {
            const clientColor = getClientColor(task.client_id)
            const time = formatEventTime(task.deadline, timezone)
            const overdue = isTaskOverdue(task)
            return (
              <button
                key={task.id}
                onClick={() => onTaskClick(task)}
                className={cn(
                  'w-full text-left p-4 rounded-xl border transition-colors hover:bg-slate-800/50',
                  'bg-slate-900/50 border-slate-700',
                  overdue && 'border-l-2 border-l-red-500'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn('w-1 h-full min-h-[40px] rounded-full flex-shrink-0', clientColor.bg)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-400">{task.clients?.business_name}</span>
                      <span className="text-xs text-slate-600">·</span>
                      <span className="text-xs text-slate-500">{task.work_types?.name}</span>
                      {task.platform && (
                        <>
                          <span className="text-xs text-slate-600">·</span>
                          <span className="text-xs text-slate-500">{task.platform}</span>
                        </>
                      )}
                    </div>
                    <h4 className="text-sm font-medium text-slate-50 mb-1">{task.title}</h4>
                    <div className="flex items-center gap-3">
                      <span className={cn('flex items-center gap-1 text-xs', overdue ? 'text-red-400' : 'text-slate-400')}>
                        <Clock className="h-3 w-3" />
                        {time || 'No time set'}
                      </span>
                      <TaskStatusBadge status={task.status} className="text-[10px] py-0 px-1.5" />
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
