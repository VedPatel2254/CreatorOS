'use client'

import { toast } from 'sonner'
import { Loader2, GripVertical, DollarSign, Clock, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUpdateTaskStatus, useDeleteTask } from '@/hooks/useTasks'
import { TaskWithRelations, TaskStatus } from '@/types'
import { TASK_STATUS_CONFIG, getValidTransitions } from '@/lib/task-status'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { useState } from 'react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

interface TaskCardProps {
  task: TaskWithRelations
  onDragStart?: (e: React.DragEvent, taskId: string) => void
}

export function TaskCard({ task, onDragStart }: TaskCardProps) {
  const updateStatus = useUpdateTaskStatus()
  const deleteTask = useDeleteTask()
  const [showDelete, setShowDelete] = useState(false)

  const config = TASK_STATUS_CONFIG[task.status]
  const validTransitions = getValidTransitions(task.status)
  const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'delivered' && task.status !== 'cancelled'

  const handleStatusChange = async (newStatus: TaskStatus) => {
    await updateStatus.mutateAsync({ id: task.id, status: newStatus })
    toast.success(`Task moved to ${TASK_STATUS_CONFIG[newStatus].label}`)
  }

  const handleDelete = async () => {
    await deleteTask.mutateAsync(task.id)
    toast.success('Task deleted')
    setShowDelete(false)
  }

  return (
    <>
      <div
        draggable
        onDragStart={(e) => onDragStart?.(e, task.id)}
        className={cn(
          "group relative p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing",
          "bg-slate-900/50 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/50"
        )}
      >
        <div className="flex items-start gap-2">
          <GripVertical className="h-4 w-4 text-slate-600 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-medium text-slate-50 truncate">{task.title}</h4>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <span className="truncate">{task.clients?.business_name}</span>
              <span>·</span>
              <span className="truncate">{task.work_types?.name}</span>
              {task.platform && (
                <>
                  <span>·</span>
                  <span className="truncate">{task.platform}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className={cn("flex items-center gap-1 text-xs", isOverdue ? 'text-red-400' : 'text-slate-400')}>
                <Clock className="h-3 w-3" />
                <span>{formatDate(task.deadline)}</span>
              </div>
              {task.is_billable && task.effective_unit_price && (
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <DollarSign className="h-3 w-3" />
                  <span>{formatCurrency(task.effective_unit_price * task.billing_quantity)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
          <Badge className={cn("text-xs", config.bgColor, config.color, config.borderColor, 'border')}>
            {config.label}
          </Badge>
          <div className="flex items-center gap-1">
            {validTransitions.length > 0 && (
              <Select value={task.status} onValueChange={(v) => handleStatusChange(v as TaskStatus)}>
                <SelectTrigger className="h-7 w-auto text-xs border-0 bg-transparent hover:bg-slate-700 text-slate-400" onClick={(e) => e.stopPropagation()}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value={task.status} disabled>{TASK_STATUS_CONFIG[task.status].label} (current)</SelectItem>
                  {validTransitions.map((s) => (
                    <SelectItem key={s} value={s}>{TASK_STATUS_CONFIG[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-red-400"
              onClick={(e) => { e.stopPropagation(); setShowDelete(true) }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-50">Delete Task</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete &quot;{task.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 text-slate-300">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
