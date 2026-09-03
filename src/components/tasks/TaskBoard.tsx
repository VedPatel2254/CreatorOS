'use client'

import { useState, useCallback } from 'react'
import { TaskCard } from './TaskCard'
import { useTasks, useBulkUpdateTaskStatus } from '@/hooks/useTasks'
import { TaskStatus, TaskWithRelations } from '@/types'
import { TASK_STATUS_CONFIG } from '@/lib/task-status'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const COLUMNS: { status: TaskStatus; color: string }[] = [
  { status: 'planned', color: 'border-slate-500' },
  { status: 'in_progress', color: 'border-blue-500' },
  { status: 'ready', color: 'border-amber-500' },
  { status: 'delivered', color: 'border-emerald-500' },
]

interface TaskBoardProps {
  clientId?: string
}

export function TaskBoard({ clientId }: TaskBoardProps) {
  const { data: tasks = [], isLoading } = useTasks(clientId ? { client_id: clientId } : undefined)
  const bulkUpdateStatus = useBulkUpdateTaskStatus()
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null)

  const tasksByStatus: Record<TaskStatus, TaskWithRelations[]> = {
    planned: [], in_progress: [], ready: [], delivered: [], cancelled: [],
  }

  tasks.forEach((task) => {
    if (tasksByStatus[task.status]) {
      tasksByStatus[task.status].push(task)
    }
  })

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(status)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault()
    setDragOverColumn(null)

    if (!draggedTaskId) return

    const task = tasks.find((t) => t.id === draggedTaskId)
    if (!task || task.status === targetStatus) {
      setDraggedTaskId(null)
      return
    }

    setDraggedTaskId(null)
    await bulkUpdateStatus.mutateAsync({ task_ids: [draggedTaskId], status: targetStatus })
    toast.success(`Task moved to ${TASK_STATUS_CONFIG[targetStatus].label}`)
  }, [draggedTaskId, tasks, bulkUpdateStatus])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {COLUMNS.map((col) => (
          <div key={col.status} className="space-y-3">
            <div className="h-10 bg-slate-800 rounded-lg animate-pulse" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {COLUMNS.map((col) => {
        const config = TASK_STATUS_CONFIG[col.status]
        const columnTasks = tasksByStatus[col.status]
        const isOver = dragOverColumn === col.status

        return (
          <div
            key={col.status}
            className={cn(
              "flex flex-col min-h-[200px] rounded-xl border-t-2 bg-slate-900/30 p-3 transition-colors",
              col.color,
              isOver && "bg-slate-800/50"
            )}
            onDragOver={(e) => handleDragOver(e, col.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.status)}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-300">{config.label}</h3>
              <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{columnTasks.length}</span>
            </div>
            <div className="flex-1 space-y-2">
              {columnTasks.map((task) => (
                <TaskCard key={task.id} task={task} onDragStart={handleDragStart} />
              ))}
              {columnTasks.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-500">No tasks</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
