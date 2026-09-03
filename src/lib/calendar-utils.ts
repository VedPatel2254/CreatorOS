import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isWeekend,
  format,
  isSameDay,
  isBefore,
  parseISO,
  getHours,
  getMinutes,
} from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { TaskWithRelations, CalendarDay, CalendarWeek } from '@/types'

export function buildMonthGrid(
  year: number,
  month: number,
  tasks: TaskWithRelations[],
  timezone: string
): CalendarWeek[] {
  const monthStart = startOfMonth(new Date(year, month))
  const monthEnd = endOfMonth(monthStart)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const calendarDays: CalendarDay[] = days.map((date) => ({
    date,
    isCurrentMonth: isSameMonth(date, monthStart),
    isToday: isToday(date),
    isWeekend: isWeekend(date),
    tasks: getTasksForDay(date, tasks, timezone),
  }))

  const weeks: CalendarWeek[] = []
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7))
  }
  return weeks
}

export function buildWeekDays(
  date: Date,
  tasks: TaskWithRelations[],
  timezone: string
): CalendarDay[] {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(date, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  return days.map((d) => ({
    date: d,
    isCurrentMonth: isSameMonth(d, date),
    isToday: isToday(d),
    isWeekend: isWeekend(d),
    tasks: getTasksForDay(d, tasks, timezone),
  }))
}

export function getTasksForDay(
  date: Date,
  tasks: TaskWithRelations[],
  timezone: string
): TaskWithRelations[] {
  return tasks.filter((task) => {
    const deadlineUtc = parseISO(task.deadline)
    const deadlineLocal = toZonedTime(deadlineUtc, timezone)
    return isSameDay(deadlineLocal, date)
  })
}

export function isTaskOverdue(task: TaskWithRelations): boolean {
  if (task.status === 'delivered' || task.status === 'cancelled') return false
  return isBefore(parseISO(task.deadline), new Date())
}

const CLIENT_COLORS = [
  { bg: 'bg-violet-500', text: 'text-violet-950', light: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  { bg: 'bg-blue-500', text: 'text-blue-950', light: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { bg: 'bg-emerald-500', text: 'text-emerald-950', light: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { bg: 'bg-amber-500', text: 'text-amber-950', light: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { bg: 'bg-rose-500', text: 'text-rose-950', light: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  { bg: 'bg-cyan-500', text: 'text-cyan-950', light: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  { bg: 'bg-pink-500', text: 'text-pink-950', light: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  { bg: 'bg-indigo-500', text: 'text-indigo-950', light: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  { bg: 'bg-orange-500', text: 'text-orange-950', light: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  { bg: 'bg-teal-500', text: 'text-teal-950', light: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
]

export function getClientColor(clientId: string): typeof CLIENT_COLORS[0] {
  let hash = 0
  for (let i = 0; i < clientId.length; i++) {
    hash = clientId.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % CLIENT_COLORS.length
  return CLIENT_COLORS[index]
}

export function formatEventTime(deadline: string, timezone: string): string {
  const deadlineUtc = parseISO(deadline)
  const deadlineLocal = toZonedTime(deadlineUtc, timezone)
  const hours = getHours(deadlineLocal)
  const minutes = getMinutes(deadlineLocal)
  if (hours === 0 && minutes === 0) return ''
  return format(deadlineLocal, 'h:mm a')
}

export function getCalendarHeaderLabel(
  view: 'month' | 'week' | 'day' | 'agenda',
  date: Date
): string {
  switch (view) {
    case 'month':
      return format(date, 'MMMM yyyy')
    case 'week': {
      const start = startOfWeek(date, { weekStartsOn: 0 })
      const end = endOfWeek(date, { weekStartsOn: 0 })
      if (format(start, 'MMM yyyy') === format(end, 'MMM yyyy')) {
        return `${format(start, 'MMM d')} – ${format(end, 'd, yyyy')}`
      }
      return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
    }
    case 'day':
      return format(date, 'EEEE, MMMM d, yyyy')
    case 'agenda':
      return format(date, 'MMMM yyyy')
  }
}

export function getDayLabel(date: Date): string {
  if (isToday(date)) return 'TODAY'
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (isSameDay(date, tomorrow)) return 'TOMORROW'
  return format(date, 'EEE, d MMM')
}
