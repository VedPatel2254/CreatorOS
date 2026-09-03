'use client'

import { cn } from '@/lib/utils'
import { TaskStatus } from '@/types'
import { TASK_STATUS_CONFIG } from '@/lib/task-status'

interface TaskStatusBadgeProps {
  status: TaskStatus
  className?: string
  showDot?: boolean
}

export function TaskStatusBadge({ status, className, showDot = true }: TaskStatusBadgeProps) {
  const config = TASK_STATUS_CONFIG[status]
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
      config.bgColor,
      config.color,
      config.borderColor,
      className
    )}>
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full', config.dotColor)} />}
      {config.label}
    </span>
  )
}
