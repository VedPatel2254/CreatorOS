import { CalendarView, TaskStatus } from '@/types'

const STORAGE_KEY = 'creatoros-calendar-prefs'

type CalendarPrefs = {
  view: CalendarView
  filterClientId: string | null
  filterStatus: TaskStatus[]
  filterWorkTypeId: string | null
}

export function saveCalendarPrefs(prefs: CalendarPrefs): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}

export function loadCalendarPrefs(): CalendarPrefs | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
