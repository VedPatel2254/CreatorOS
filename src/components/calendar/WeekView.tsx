'use client'

import { CalendarDay, TaskWithRelations } from '@/types'
import { EventChip } from './EventChip'
import { cn } from '@/lib/utils'
import { format, isToday } from 'date-fns'

interface WeekViewProps {
  days: CalendarDay[]
  onDayClick: (date: Date) => void
  onTaskClick: (task: TaskWithRelations) => void
  timezone: string
}

export function WeekView({ days, onDayClick, onTaskClick, timezone }: WeekViewProps) {
  return (
    <div className="grid grid-cols-7 gap-px bg-slate-700/50 rounded-xl overflow-hidden border border-slate-700/50">
      {days.map((day) => {
        const today = isToday(day.date)
        return (
          <div key={format(day.date, 'yyyy-MM-dd')} className="bg-slate-900 min-h-[400px]">
            <div className={cn(
              'p-2 text-center border-b border-slate-700/50',
              today && 'bg-violet-600 text-white rounded-t-lg'
            )}>
              <div className="text-xs font-medium">{format(day.date, 'EEE')}</div>
              <div className={cn('text-lg font-semibold', today ? 'text-white' : 'text-slate-300')}>
                {format(day.date, 'd')}
              </div>
            </div>
            <div
              className="p-1 space-y-0.5 cursor-pointer min-h-[340px]"
              onClick={() => onDayClick(day.date)}
            >
              {day.tasks.map((task) => (
                <EventChip key={task.id} task={task} timezone={timezone} onClick={() => onTaskClick(task)} />
              ))}
              {day.tasks.length === 0 && (
                <div className="text-xs text-slate-600 text-center py-4">No tasks</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
