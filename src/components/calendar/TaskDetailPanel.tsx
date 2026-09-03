'use client'

import { TaskWithRelations } from '@/types'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge'
import { getClientColor, isTaskOverdue, formatEventTime } from '@/lib/calendar-utils'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Pencil, ExternalLink, Clock, Lock } from 'lucide-react'
import Link from 'next/link'

interface TaskDetailPanelProps {
  task: TaskWithRelations | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEditTask: (task: TaskWithRelations) => void
  timezone: string
  currencySymbol: string
}

export function TaskDetailPanel({ task, open, onOpenChange, onEditTask, timezone, currencySymbol }: TaskDetailPanelProps) {
  if (!task) return null

  const clientColor = getClientColor(task.client_id)
  const time = formatEventTime(task.deadline, timezone)
  const overdue = isTaskOverdue(task)
  const billingAmount = task.is_billable && task.effective_unit_price ? task.effective_unit_price * task.billing_quantity : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-slate-900 border-slate-700 w-full sm:max-w-[400px] overflow-y-auto">
        <SheetHeader className="border-b border-slate-700 pb-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn('w-2 h-2 rounded-full', clientColor.bg)} />
            <Link href={`/clients/${task.client_id}`} className="text-sm text-slate-400 hover:text-violet-400">
              {task.clients?.business_name}
            </Link>
          </div>
          <SheetTitle className="text-xl font-semibold text-slate-50">{task.title}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TaskStatusBadge status={task.status} />
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <span>{task.work_types?.name}</span>
              {task.platform && <><span>·</span><span>{task.platform}</span></>}
            </div>
            <div className={cn('flex items-center gap-2', overdue ? 'text-red-400' : 'text-slate-400')}>
              <Clock className="h-4 w-4" />
              <span>{formatDate(task.deadline, timezone)}</span>
              {time && <span className="text-slate-500">at {time}</span>}
              {overdue && <span className="text-red-400 font-medium">Overdue</span>}
            </div>
          </div>

          {task.description && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Description</p>
              <p className="text-sm text-slate-300">{task.description}</p>
            </div>
          )}

          {task.notes && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Notes</p>
              <p className="text-sm text-slate-300">{task.notes}</p>
            </div>
          )}

          {task.is_billable && (
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              {task.status === 'delivered' && billingAmount ? (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Price locked</span>
                    <span className="text-slate-50 font-semibold">{formatCurrency(billingAmount, currencySymbol)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-amber-400">
                    <Lock className="h-3 w-3" />
                    <span>Locked at delivery</span>
                  </div>
                </div>
              ) : task.effective_unit_price ? (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Expected</span>
                  <span className="text-slate-50">{formatCurrency(task.effective_unit_price * task.billing_quantity, currencySymbol)}</span>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No pricing rule set</p>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 border-slate-700 text-slate-300" onClick={() => onEditTask(task)}>
              <Pencil className="mr-2 h-4 w-4" />Edit Task
            </Button>
            <Button variant="outline" className="border-slate-700 text-slate-300" asChild>
              <Link href={`/work/${task.id}`}>
                <ExternalLink className="mr-2 h-4 w-4" />Full Details
              </Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
