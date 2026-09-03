'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { TaskWithRelations, TaskStatus } from '@/types'
import { TASK_STATUS_CONFIG } from '@/lib/task-status'

interface StatusChangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: TaskWithRelations
  targetStatus: TaskStatus
  onConfirm: () => void
  isLoading: boolean
}

export function StatusChangeDialog({ open, onOpenChange, task, targetStatus, onConfirm, isLoading }: StatusChangeDialogProps) {
  const targetConfig = TASK_STATUS_CONFIG[targetStatus]
  const currentConfig = TASK_STATUS_CONFIG[task.status]

  const getMessage = () => {
    if (targetStatus === 'cancelled') {
      return `Cancel "${task.title}"? This task will be marked as cancelled. You can re-open it later.`
    }
    if (task.status === 'delivered' && targetStatus === 'ready') {
      return `Un-deliver "${task.title}"? This will remove it from billing calculations. If this task has been invoiced, the invoice may need to be updated.`
    }
    if (targetStatus === 'delivered') {
      return `Mark "${task.title}" as Delivered? It is currently ${currentConfig.label}. Confirm you want to skip to Delivered.`
    }
    return `Move "${task.title}" from ${currentConfig.label} to ${targetConfig.label}?`
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-slate-900 border-slate-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-slate-50">Change Status to {targetConfig.label}?</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400">
            {getMessage()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} className="border-slate-700 text-slate-300">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={targetStatus === 'cancelled' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white'}
          >
            {isLoading ? 'Processing...' : `Move to ${targetConfig.label}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
