import { TaskStatus } from '@/types'

export const TASK_STATUS_CONFIG: Record<TaskStatus, {
  label: string
  color: string
  bgColor: string
  borderColor: string
  dotColor: string
}> = {
  planned: {
    label: 'Planned',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/20',
    dotColor: 'bg-slate-400',
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    dotColor: 'bg-blue-400',
  },
  ready: {
    label: 'Ready',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    dotColor: 'bg-amber-400',
  },
  delivered: {
    label: 'Delivered',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    dotColor: 'bg-emerald-400',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    dotColor: 'bg-red-400',
  },
}

export const VALID_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  planned: ['in_progress', 'cancelled'],
  in_progress: ['ready', 'planned', 'cancelled'],
  ready: ['delivered', 'in_progress', 'cancelled'],
  delivered: ['ready'],
  cancelled: ['planned'],
}

export function getValidTransitions(current: TaskStatus): TaskStatus[] {
  return VALID_STATUS_TRANSITIONS[current] ?? []
}
