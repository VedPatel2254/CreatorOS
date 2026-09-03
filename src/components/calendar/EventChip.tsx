'use client'

import { TaskWithRelations } from '@/types'
import { getClientColor, formatEventTime, isTaskOverdue } from '@/lib/calendar-utils'
import { cn } from '@/lib/utils'

interface EventChipProps {
  task: TaskWithRelations
  timezone: string
  onClick: () => void
  compact?: boolean
}

export function EventChip({ task, timezone, onClick, compact }: EventChipProps) {
  const clientColor = getClientColor(task.client_id)
  const time = formatEventTime(task.deadline, timezone)
  const overdue = isTaskOverdue(task)
  const isDelivered = task.status === 'delivered'
  const isCancelled = task.status === 'cancelled'

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={cn(
        'flex items-center gap-1 px-1.5 py-0.5 rounded text-xs cursor-pointer truncate w-full mb-0.5 border transition-opacity hover:opacity-80 text-left',
        clientColor.light,
        overdue && 'border-l-2 border-l-red-500',
        isDelivered && 'opacity-50',
        isCancelled && 'opacity-40',
        compact ? 'text-[10px]' : 'text-xs'
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', clientColor.bg)} />
      <span className="truncate">
        {time && <span className="opacity-70">{time} · </span>}
        {task.clients?.business_name} · {task.title}
      </span>
    </button>
  )
}
