'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useUpdateTaskStatus, useDeleteTask } from '@/hooks/useTasks'
import { useActivityLog } from '@/hooks/useActivityLog'
import { useSettings } from '@/hooks/useSettings'
import { TaskSheet } from '@/components/tasks/TaskSheet'
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge'
import { StatusChangeDialog } from '@/components/tasks/StatusChangeDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { ArrowLeft, Pencil, Trash2, Lock, Clock } from 'lucide-react'
import { TaskWithRelations, TaskStatus } from '@/types'
import { TASK_STATUS_CONFIG, getValidTransitions } from '@/lib/task-status'
import { formatCurrency, formatDate, cn } from '@/lib/utils'

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const updateStatus = useUpdateTaskStatus()
  const deleteTask = useDeleteTask()
  const { data: settings } = useSettings()
  const currencySymbol = settings?.currency_symbol ?? '₹'

  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [targetStatus, setTargetStatus] = useState<TaskStatus>('planned')

  const { data: task, isLoading } = useQuery({
    queryKey: ['tasks', id],
    queryFn: async (): Promise<TaskWithRelations> => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, clients (id, business_name, status), work_types (id, name)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as TaskWithRelations
    },
    enabled: !!id,
  })

  const { data: activityLog = [] } = useActivityLog({ entity_type: 'task', entity_id: id })

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48 bg-slate-800" />
        <Skeleton className="h-[300px] w-full bg-slate-800 rounded-xl" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-xl font-semibold text-slate-300">Task not found</h2>
        <Button variant="link" onClick={() => router.push('/work')} className="mt-4 text-violet-400">Back to Work</Button>
      </div>
    )
  }

  const config = TASK_STATUS_CONFIG[task.status]
  const validTransitions = getValidTransitions(task.status)
  const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'delivered' && task.status !== 'cancelled'

  const handleStatusChange = async (newStatus: TaskStatus) => {
    setTargetStatus(newStatus)
    setStatusDialogOpen(true)
  }

  const confirmStatusChange = async () => {
    await updateStatus.mutateAsync({ id: task.id, status: targetStatus })
    setStatusDialogOpen(false)
  }

  const handleDelete = async () => {
    await deleteTask.mutateAsync(task.id)
    toast.success('Task deleted')
    router.push('/work')
  }

  const billingAmount = task.is_billable && task.effective_unit_price
    ? task.effective_unit_price * task.billing_quantity
    : null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/work')} className="text-slate-400 hover:text-slate-50">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={cn('text-xs', TASK_STATUS_CONFIG[task.work_types ? 'planned' : 'planned'].bgColor, 'text-slate-400', 'border border-slate-500/20')}>
              {task.work_types?.name}
            </Badge>
            <TaskStatusBadge status={task.status} />
          </div>
          <h1 className="text-2xl font-bold text-slate-50">{task.title}</h1>
          <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
            <a href={`/clients/${task.clients?.id}`} className="hover:text-violet-400">{task.clients?.business_name}</a>
            {task.platform && <><span>·</span><span>{task.platform}</span></>}
            <span>·</span>
            <span className={cn('flex items-center gap-1', isOverdue && 'text-red-400')}>
              <Clock className="h-3 w-3" />
              {formatDate(task.deadline)}
              {isOverdue && <span className="text-red-400 ml-1">Overdue</span>}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {validTransitions.length > 0 && (
            <Select value={task.status} onValueChange={(v) => handleStatusChange(v as TaskStatus)}>
              <SelectTrigger className="w-[160px] bg-slate-800 border-slate-700 text-slate-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {validTransitions.map((s) => (
                  <SelectItem key={s} value={s}>{TASK_STATUS_CONFIG[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={() => setShowEdit(true)} variant="outline" size="sm" className="border-slate-700 text-slate-300">
            <Pencil className="mr-2 h-4 w-4" />Edit
          </Button>
          <Button variant="outline" size="icon" className="border-slate-700 text-slate-400 hover:text-red-400" onClick={() => setShowDelete(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-base text-slate-50">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {task.description && (
              <div>
                <p className="text-xs text-slate-400 mb-1">Description</p>
                <p className="text-sm text-slate-300">{task.description}</p>
              </div>
            )}
            {task.notes && (
              <div>
                <p className="text-xs text-slate-400 mb-1">Notes</p>
                <p className="text-sm text-slate-300">{task.notes}</p>
              </div>
            )}
            <div className="pt-2 border-t border-slate-700/50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Created</span>
                <span className="text-slate-50">{formatDate(task.created_at)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Updated</span>
                <span className="text-slate-50">{formatDate(task.updated_at)}</span>
              </div>
              {task.completed_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Completed</span>
                  <span className="text-slate-50">{formatDate(task.completed_at)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-base text-slate-50">Billing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!task.is_billable ? (
              <p className="text-sm text-slate-400">This task is not billable</p>
            ) : task.status === 'delivered' ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Unit Price</span>
                  <span className="text-slate-50">{formatCurrency(task.effective_unit_price ?? 0, currencySymbol)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Quantity</span>
                  <span className="text-slate-50">{task.billing_quantity}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-2 border-t border-slate-700/50">
                  <span className="text-slate-300">Total</span>
                  <span className="text-slate-50">{formatCurrency(billingAmount ?? 0, currencySymbol)}</span>
                </div>
                {task.billing_locked && (
                  <div className="flex items-center gap-2 text-xs text-amber-400 pt-2">
                    <Lock className="h-3 w-3" />
                    <span>Price locked at delivery</span>
                  </div>
                )}
                {task.billing_notes && (
                  <div className="pt-2 border-t border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">Billing Notes</p>
                    <p className="text-sm text-slate-300">{task.billing_notes}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Expected Price</span>
                  <span className="text-slate-50">{formatCurrency(task.effective_unit_price ?? 0, currencySymbol)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Quantity</span>
                  <span className="text-slate-50">{task.billing_quantity}</span>
                </div>
                <p className="text-xs text-slate-500 pt-2">Price will be locked when delivered</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-base text-slate-50">Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLog.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {activityLog.map((entry) => (
                  <div key={entry.id} className="text-sm">
                    <p className="text-slate-300">{entry.action.replace('_', ' ')}</p>
                    <p className="text-xs text-slate-500">{formatDate(entry.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <TaskSheet open={showEdit} onOpenChange={setShowEdit} task={task} />
      <StatusChangeDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen} task={task} targetStatus={targetStatus} onConfirm={confirmStatusChange} isLoading={updateStatus.isPending} />

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-50">Delete Task</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Delete &quot;{task.title}&quot;? This cannot be undone. Use &quot;Cancel&quot; status instead for routine cancellations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 text-slate-300">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}


