'use client'

import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarView, TaskStatus } from '@/types'
import { getCalendarHeaderLabel } from '@/lib/calendar-utils'
import { cn } from '@/lib/utils'

interface CalendarHeaderProps {
  currentDate: Date
  view: CalendarView
  onViewChange: (view: CalendarView) => void
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onAddTask: () => void
  filterClientId: string | null
  filterStatus: TaskStatus[]
  filterWorkTypeId: string | null
  onFilterClientChange: (id: string | null) => void
  onFilterStatusChange: (statuses: TaskStatus[]) => void
  onFilterWorkTypeChange: (id: string | null) => void
  onClearFilters: () => void
  hasActiveFilters: boolean
  clients: { id: string; business_name: string }[]
  workTypes: { id: string; name: string }[]
  activeFilterCount: number
}

export function CalendarHeader({
  currentDate, view, onViewChange, onPrev, onNext, onToday, onAddTask,
  filterClientId, filterStatus, filterWorkTypeId,
  onFilterClientChange, onFilterStatusChange, onFilterWorkTypeChange,
  onClearFilters, hasActiveFilters, clients, workTypes, activeFilterCount,
}: CalendarHeaderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onPrev} className="text-slate-400 hover:text-slate-50">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="sm" onClick={onToday} className="border-slate-700 text-slate-300">
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={onNext} className="text-slate-400 hover:text-slate-50">
            <ChevronRight className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold text-slate-50 ml-2">
            {getCalendarHeaderLabel(view, currentDate)}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Select value={view} onValueChange={(v) => onViewChange(v as CalendarView)}>
            <SelectTrigger className="w-[120px] bg-slate-800 border-slate-700 text-slate-50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="agenda">Agenda</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={onAddTask} className="bg-violet-600 hover:bg-violet-700 text-white">
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Add Task</span>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filterClientId ?? '__all__'} onValueChange={(v) => onFilterClientChange(v === '__all__' ? null : v)}>
          <SelectTrigger className="w-[160px] bg-slate-800 border-slate-700 text-slate-50 text-xs">
            <SelectValue placeholder="All Clients" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="__all__">All Clients</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.business_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-1">
          {(['planned', 'in_progress', 'ready', 'delivered', 'cancelled'] as TaskStatus[]).map((status) => {
            const isActive = filterStatus.includes(status)
            return (
              <button
                key={status}
                onClick={() => {
                  if (isActive) {
                    onFilterStatusChange(filterStatus.filter((s) => s !== status))
                  } else {
                    onFilterStatusChange([...filterStatus, status])
                  }
                }}
                className={cn(
                  'px-2 py-1 rounded-full text-[10px] font-medium border transition-colors',
                  isActive ? 'bg-violet-600/20 text-violet-400 border-violet-500/30' : 'text-slate-500 border-slate-700 hover:bg-slate-800'
                )}
              >
                {status.replace('_', ' ')}
              </button>
            )
          })}
        </div>

        <Select value={filterWorkTypeId ?? '__all__'} onValueChange={(v) => onFilterWorkTypeChange(v === '__all__' ? null : v)}>
          <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700 text-slate-50 text-xs">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="__all__">All Types</SelectItem>
            {workTypes.map((w) => (
              <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-slate-400 hover:text-slate-50">
            <X className="mr-1 h-3 w-3" />Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
          </Button>
        )}
      </div>
    </div>
  )
}
