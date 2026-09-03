'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns'

interface MiniCalendarProps {
  currentDate: Date
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  taskDates: Set<string>
}

export function MiniCalendar({ currentDate, selectedDate, onDateSelect, taskDates }: MiniCalendarProps) {
  const [displayMonth, setDisplayMonth] = useState(currentDate)

  const monthStart = startOfMonth(displayMonth)
  const monthEnd = endOfMonth(displayMonth)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400" onClick={() => setDisplayMonth(subMonths(displayMonth, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium text-slate-300">{format(displayMonth, 'MMMM yyyy')}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400" onClick={() => setDisplayMonth(addMonths(displayMonth, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-slate-500 py-1">{d}</div>
        ))}
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const hasTask = taskDates.has(dateKey)
          const today = isToday(day)
          const selected = selectedDate && isSameDay(day, selectedDate)
          const inMonth = isSameMonth(day, displayMonth)

          return (
            <button
              key={dateKey}
              onClick={() => onDateSelect(day)}
              className={cn(
                'relative w-8 h-8 flex items-center justify-center text-xs rounded-full transition-colors',
                !inMonth && 'text-slate-700',
                inMonth && !today && !selected && 'text-slate-400 hover:bg-slate-700',
                today && !selected && 'bg-violet-600 text-white',
                selected && 'ring-2 ring-violet-500 text-slate-50'
              )}
            >
              {format(day, 'd')}
              {hasTask && !today && (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-violet-500" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
