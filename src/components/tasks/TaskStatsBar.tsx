'use client'

import { useTaskStats } from '@/hooks/useTasks'
import { TASK_STATUS_CONFIG } from '@/lib/task-status'
import { cn } from '@/lib/utils'

export function TaskStatsBar() {
  const { data: stats } = useTaskStats()

  if (!stats || stats.total === 0) return null

  const statuses = ['planned', 'in_progress', 'ready', 'delivered'] as const
  const total = stats.total - (stats.cancelled || 0)

  return (
    <div className="space-y-3">
      <div className="flex gap-4 flex-wrap">
        {statuses.map((status) => {
          const config = TASK_STATUS_CONFIG[status]
          const count = stats[status] || 0
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={status} className="flex items-center gap-2">
              <div className={cn("h-2.5 w-2.5 rounded-full", config.dotColor)} />
              <span className="text-xs text-slate-400">{config.label}</span>
              <span className="text-xs font-medium text-slate-300">{count}</span>
              <span className="text-xs text-slate-500">({pct}%)</span>
            </div>
          )
        })}
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-slate-800">
        {statuses.map((status) => {
          const count = stats[status] || 0
          const pct = total > 0 ? (count / total) * 100 : 0
          const config = TASK_STATUS_CONFIG[status]
          return (
            <div
              key={status}
              className={cn("transition-all", config.dotColor)}
              style={{ width: `${pct}%` }}
            />
          )
        })}
      </div>
    </div>
  )
}
