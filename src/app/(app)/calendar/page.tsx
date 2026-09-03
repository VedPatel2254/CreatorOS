'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useSettings } from '@/hooks/useSettings'
import { useClients } from '@/hooks/useClients'
import { useWorkTypes } from '@/hooks/useSettings'
import { useUpdateTaskStatus } from '@/hooks/useTasks'
import { TaskSheet } from '@/components/tasks/TaskSheet'
import { CalendarHeader } from '@/components/calendar/CalendarHeader'
import { MonthView } from '@/components/calendar/MonthView'
import { WeekView } from '@/components/calendar/WeekView'
import { DayView } from '@/components/calendar/DayView'
import { AgendaView } from '@/components/calendar/AgendaView'
import { TaskDetailPanel } from '@/components/calendar/TaskDetailPanel'
import { MiniCalendar } from '@/components/calendar/MiniCalendar'
import { ClientLegend } from '@/components/calendar/ClientLegend'
import { buildMonthGrid, buildWeekDays } from '@/lib/calendar-utils'
import { saveCalendarPrefs, loadCalendarPrefs } from '@/lib/calendar-preferences'
import { CalendarView, TaskWithRelations, TaskStatus } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, format } from 'date-fns'

export default function CalendarPage() {
  const supabase = createClient()
  const { data: settings } = useSettings()
  const { data: clients = [] } = useClients()
  const { data: workTypes = [] } = useWorkTypes()
  const updateStatus = useUpdateTaskStatus()

  const timezone = settings?.timezone ?? 'Asia/Kolkata'

  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>('month')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null)
  const [taskDetailOpen, setTaskDetailOpen] = useState(false)
  const [taskSheetOpen, setTaskSheetOpen] = useState(false)
  const [taskSheetDate, setTaskSheetDate] = useState<Date | null>(null)
  const [filterClientId, setFilterClientId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<TaskStatus[]>([])
  const [filterWorkTypeId, setFilterWorkTypeId] = useState<string | null>(null)

  useEffect(() => {
    const prefs = loadCalendarPrefs()
    if (prefs) {
      setView(prefs.view)
      setFilterClientId(prefs.filterClientId)
      setFilterStatus(prefs.filterStatus)
      setFilterWorkTypeId(prefs.filterWorkTypeId)
    }
  }, [])

  useEffect(() => {
    saveCalendarPrefs({ view, filterClientId, filterStatus, filterWorkTypeId })
  }, [view, filterClientId, filterStatus, filterWorkTypeId])

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks-calendar', format(currentDate, 'yyyy-MM'), filterClientId, filterStatus, filterWorkTypeId],
    queryFn: async (): Promise<TaskWithRelations[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59)
      const from = new Date(monthStart)
      from.setDate(from.getDate() - 3)
      const to = new Date(monthEnd)
      to.setDate(to.getDate() + 3)

      let query = supabase
        .from('tasks')
        .select('*, clients (id, business_name, status), work_types (id, name)')
        .eq('user_id', user.id)
        .gte('deadline', from.toISOString())
        .lte('deadline', to.toISOString())
        .order('deadline', { ascending: true })

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as TaskWithRelations[]
    },
    staleTime: 30 * 1000,
  })

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filterClientId && task.client_id !== filterClientId) return false
      if (filterStatus.length > 0 && !filterStatus.includes(task.status)) return false
      if (filterWorkTypeId && task.work_type_id !== filterWorkTypeId) return false
      return true
    })
  }, [tasks, filterClientId, filterStatus, filterWorkTypeId])

  const weeks = useMemo(() => buildMonthGrid(currentDate.getFullYear(), currentDate.getMonth(), filteredTasks, timezone), [currentDate, filteredTasks, timezone])
  const weekDays = useMemo(() => buildWeekDays(currentDate, filteredTasks, timezone), [currentDate, filteredTasks, timezone])

  const currentDayTasks = useMemo(() => {
    return filteredTasks.filter((task) => {
      const d = new Date(task.deadline)
      return d.toDateString() === currentDate.toDateString()
    })
  }, [filteredTasks, currentDate])

  const taskDates = useMemo(() => {
    return new Set(tasks.map((t) => new Date(t.deadline).toISOString().split('T')[0]))
  }, [tasks])

  const hasActiveFilters = filterClientId !== null || filterStatus.length > 0 || filterWorkTypeId !== null
  const activeFilterCount = [filterClientId, filterStatus.length > 0, filterWorkTypeId].filter(Boolean).length

  const handlePrev = useCallback(() => {
    switch (view) {
      case 'month': setCurrentDate(subMonths(currentDate, 1)); break
      case 'week': setCurrentDate(subWeeks(currentDate, 1)); break
      case 'day': setCurrentDate(subDays(currentDate, 1)); break
      case 'agenda': setCurrentDate(subMonths(currentDate, 1)); break
    }
  }, [view, currentDate])

  const handleNext = useCallback(() => {
    switch (view) {
      case 'month': setCurrentDate(addMonths(currentDate, 1)); break
      case 'week': setCurrentDate(addWeeks(currentDate, 1)); break
      case 'day': setCurrentDate(addDays(currentDate, 1)); break
      case 'agenda': setCurrentDate(addMonths(currentDate, 1)); break
    }
  }, [view, currentDate])

  const handleToday = useCallback(() => setCurrentDate(new Date()), [])

  const handleDayClick = useCallback((date: Date) => {
    setCurrentDate(date)
    setView('day')
  }, [])

  const handleTaskClick = useCallback((task: TaskWithRelations) => {
    setSelectedTask(task)
    setTaskDetailOpen(true)
  }, [])

  const handleAddTask = useCallback((date?: Date) => {
    setTaskSheetDate(date ?? null)
    setTaskSheetOpen(true)
  }, [])

  const handleEditTask = useCallback((task: TaskWithRelations) => {
    setTaskDetailOpen(false)
    setSelectedTask(task)
    setTaskSheetOpen(true)
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilterClientId(null)
    setFilterStatus([])
    setFilterWorkTypeId(null)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return
      if (document.querySelector('[role="dialog"]')) return

      switch (e.key) {
        case 'ArrowLeft': handlePrev(); break
        case 'ArrowRight': handleNext(); break
        case 't': case 'T': handleToday(); break
        case 'm': case 'M': setView('month'); break
        case 'w': case 'W': setView('week'); break
        case 'd': case 'D': setView('day'); break
        case 'a': case 'A': setView('agenda'); break
        case 'n': case 'N': handleAddTask(); break
        case 'Escape':
          setTaskDetailOpen(false)
          setTaskSheetOpen(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlePrev, handleNext, handleToday, handleAddTask])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full bg-slate-800" />
        <Skeleton className="h-[500px] w-full bg-slate-800 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex gap-6 h-full">
      <aside className="hidden lg:block w-64 flex-shrink-0 space-y-4">
        <MiniCalendar
          currentDate={currentDate}
          selectedDate={currentDate}
          onDateSelect={(date) => { setCurrentDate(date); setView('day') }}
          taskDates={taskDates}
        />
        <ClientLegend tasks={tasks} filterClientId={filterClientId} onFilterClientChange={setFilterClientId} />
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <CalendarHeader
          currentDate={currentDate}
          view={view}
          onViewChange={setView}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          onAddTask={() => handleAddTask()}
          filterClientId={filterClientId}
          filterStatus={filterStatus}
          filterWorkTypeId={filterWorkTypeId}
          onFilterClientChange={setFilterClientId}
          onFilterStatusChange={setFilterStatus}
          onFilterWorkTypeChange={setFilterWorkTypeId}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
          clients={clients.filter((c) => c.status === 'active')}
          workTypes={workTypes.filter((w) => w.is_active)}
          activeFilterCount={activeFilterCount}
        />

        {hasActiveFilters && (
          <div className="mt-2 text-xs text-slate-500">
            Showing filtered results
            {filterClientId && ` · ${clients.find((c) => c.id === filterClientId)?.business_name}`}
            {filterStatus.length > 0 && ` · ${filterStatus.join(', ')}`}
            {filterWorkTypeId && ` · ${workTypes.find((w) => w.id === filterWorkTypeId)?.name}`}
          </div>
        )}

        <div className="mt-4 flex-1">
          {view === 'month' && (
            <MonthView weeks={weeks} onDayClick={handleDayClick} onTaskClick={handleTaskClick} timezone={timezone} />
          )}
          {view === 'week' && (
            <WeekView days={weekDays} onDayClick={handleDayClick} onTaskClick={handleTaskClick} timezone={timezone} />
          )}
          {view === 'day' && (
            <DayView day={{ date: currentDate, isCurrentMonth: true, isToday: new Date().toDateString() === currentDate.toDateString(), isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6, tasks: currentDayTasks }} onTaskClick={handleTaskClick} onAddTask={handleAddTask} timezone={timezone} />
          )}
          {view === 'agenda' && (
            <AgendaView days={weeks.flat()} onTaskClick={handleTaskClick} onAddTask={handleAddTask} timezone={timezone} />
          )}
        </div>

        <div className="hidden md:block text-xs text-slate-600 mt-4 text-center">
          ← → navigate · T today · M/W/D/A views · N new task
        </div>
      </main>

      <TaskDetailPanel
        task={selectedTask}
        open={taskDetailOpen}
        onOpenChange={setTaskDetailOpen}
        onEditTask={handleEditTask}
        timezone={timezone}
        currencySymbol={settings?.currency_symbol ?? '₹'}
      />

      <TaskSheet open={taskSheetOpen} onOpenChange={setTaskSheetOpen} task={selectedTask} defaultClientId={filterClientId ?? undefined} />
    </div>
  )
}
