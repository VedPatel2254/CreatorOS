'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface MultiDatePickerProps {
  selectedDates: string[]
  onDatesChange: (dates: string[]) => void
  time?: string
  onTimeChange?: (time: string) => void
  disabled?: boolean
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function toDateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

export function MultiDatePicker({
  selectedDates,
  onDatesChange,
  time = '09:00',
  onTimeChange,
  disabled = false,
}: MultiDatePickerProps) {
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [viewYear, setViewYear] = useState(today.getFullYear())

  const selectedSet = useMemo(() => new Set(selectedDates), [selectedDates])

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(d)
    return days
  }, [firstDay, daysInMonth])

  const toggleDate = (day: number) => {
    if (disabled) return
    const dateKey = toDateKey(new Date(viewYear, viewMonth, day))
    if (selectedSet.has(dateKey)) {
      onDatesChange(selectedDates.filter((d) => d !== dateKey))
    } else {
      onDatesChange([...selectedDates, dateKey])
    }
  }

  const selectWeekdays = () => {
    if (disabled) return
    const dates: string[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d)
      const dayOfWeek = date.getDay()
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        dates.push(toDateKey(date))
      }
    }
    onDatesChange(dates)
  }

  const selectEveryOtherDay = () => {
    if (disabled) return
    const dates: string[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      if (d % 2 === 1) {
        dates.push(toDateKey(new Date(viewYear, viewMonth, d)))
      }
    }
    onDatesChange(dates)
  }

  const clearAll = () => {
    if (!disabled) onDatesChange([])
  }

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const goToToday = () => {
    setViewMonth(today.getMonth())
    setViewYear(today.getFullYear())
  }

  const sortedSelected = [...selectedDates].sort()

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-slate-300 flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          Delivery Dates {selectedDates.length > 0 && `(${selectedDates.length})`}
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={goToToday}
          className="text-xs text-slate-400 hover:text-slate-200 h-6 px-2"
          disabled={disabled}
        >
          Today
        </Button>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
        <div className="flex items-center justify-between mb-2">
          <Button type="button" variant="ghost" size="sm" onClick={prevMonth} disabled={disabled} className="h-7 w-7 p-0 text-slate-400 hover:text-slate-200">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-slate-200">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={nextMonth} disabled={disabled} className="h-7 w-7 p-0 text-slate-400 hover:text-slate-200">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-[10px] font-medium text-slate-500 py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />
            const dateKey = toDateKey(new Date(viewYear, viewMonth, day))
            const isSelected = selectedSet.has(dateKey)
            const isPast = new Date(viewYear, viewMonth, day) < today
            const isToday = dateKey === toDateKey(today)

            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDate(day)}
                disabled={disabled || isPast}
                className={cn(
                  'h-8 w-full rounded-md text-xs font-medium transition-colors',
                  isSelected && 'bg-violet-600 text-white hover:bg-violet-500',
                  !isSelected && !isPast && 'text-slate-300 hover:bg-slate-700',
                  isPast && !isSelected && 'text-slate-600 cursor-not-allowed',
                  isToday && !isSelected && 'ring-1 ring-violet-500/50',
                )}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>

      {onTimeChange && (
        <div className="space-y-1.5">
          <Label className="text-slate-400 text-xs">Time for all dates</Label>
          <Input
            type="time"
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
            className="bg-slate-800 border-slate-700 text-slate-50 h-9 text-sm"
            disabled={disabled}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        <Button type="button" variant="outline" size="sm" onClick={selectWeekdays} disabled={disabled}
          className="border-slate-700 text-slate-400 hover:text-slate-200 h-7 text-xs">
          Weekdays
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={selectEveryOtherDay} disabled={disabled}
          className="border-slate-700 text-slate-400 hover:text-slate-200 h-7 text-xs">
          Every Other Day
        </Button>
        {selectedDates.length > 0 && (
          <Button type="button" variant="outline" size="sm" onClick={clearAll} disabled={disabled}
            className="border-slate-700 text-slate-400 hover:text-slate-200 h-7 text-xs">
            <RotateCcw className="h-3 w-3 mr-1" />Clear
          </Button>
        )}
      </div>

      {sortedSelected.length > 0 && sortedSelected.length <= 10 && (
        <div className="flex flex-wrap gap-1">
          {sortedSelected.map((d) => (
            <span key={d} className="inline-flex items-center px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300">
              {new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          ))}
        </div>
      )}
      {sortedSelected.length > 10 && (
        <p className="text-xs text-slate-500">{sortedSelected.length} dates selected</p>
      )}
    </div>
  )
}
