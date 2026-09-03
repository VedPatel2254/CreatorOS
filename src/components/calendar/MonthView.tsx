'use client'

import { useState } from 'react'
import { CalendarWeek, TaskWithRelations } from '@/types'
import { EventChip } from './EventChip'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface MonthViewProps {
  weeks: CalendarWeek[]
  onDayClick: (date: Date) => void
  onTaskClick: (task: TaskWithRelations) => void
  timezone: string
  maxEventsPerDay?: number
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function MonthView({ weeks, onDayClick, onTaskClick, timezone, maxEventsPerDay = 3 }: MonthViewProps) {
  const [overflowDay, setOverflowDay] = useState<string | null>(null)

  return (
    <div className="border border-slate-700/50 rounded-xl overflow-hidden">
      <div className="grid grid-cols-7">
        {DAY_NAMES.map((day) => (
          <div key={day} className="py-2 text-center text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-700/50">
            {day}
          </div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-b border-slate-700/50 last:border-b-0">
          {week.map((day) => {
            const tasksToShow = day.tasks.slice(0, maxEventsPerDay)
            const overflowCount = day.tasks.length - maxEventsPerDay
            const dateKey = format(day.date, 'yyyy-MM-dd')

            return (
              <div
                key={dateKey}
                onClick={() => onDayClick(day.date)}
                className={cn(
                  'min-h-[112px] p-1.5 border-r border-slate-700/50 last:border-r-0 cursor-pointer transition-colors hover:bg-slate-800/30',
                  !day.isCurrentMonth && 'bg-slate-900/50 opacity-60',
                  day.isToday && 'bg-violet-950/20 border-violet-500/30',
                  day.isWeekend && 'bg-slate-800/10'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    'text-xs',
                    day.isToday ? 'bg-violet-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-medium' : day.isCurrentMonth ? 'text-slate-300' : 'text-slate-600'
                  )}>
                    {format(day.date, 'd')}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {tasksToShow.map((task) => (
                    <EventChip key={task.id} task={task} timezone={timezone} onClick={() => onTaskClick(task)} compact />
                  ))}
                  {overflowCount > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setOverflowDay(overflowDay === dateKey ? null : dateKey) }}
                      className="text-[10px] text-slate-500 hover:text-slate-300 px-1 cursor-pointer"
                    >
                      +{overflowCount} more
                    </button>
                  )}
                </div>
                {overflowDay === dateKey && (
                  <div className="absolute z-50 mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 shadow-xl max-h-48 overflow-y-auto w-64">
                    {day.tasks.map((task) => (
                      <EventChip key={task.id} task={task} timezone={timezone} onClick={() => { onTaskClick(task); setOverflowDay(null) }} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
