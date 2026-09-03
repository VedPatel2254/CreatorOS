'use client'

import { CheckCircle, XCircle, Clock, Bell, AlertTriangle } from 'lucide-react'
import { NotificationLogWithTask } from '@/types'
import { cn } from '@/lib/utils'

interface NotificationCardProps {
  notification: NotificationLogWithTask
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'sent':
      return <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
    case 'failed':
      return <XCircle className="h-3.5 w-3.5 text-red-400" />
    case 'pending':
      return <Clock className="h-3.5 w-3.5 text-amber-400" />
    default:
      return <Clock className="h-3.5 w-3.5 text-slate-400" />
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case '24h_reminder':
      return <Clock className="h-4 w-4 text-amber-400" />
    case 'overdue_alert':
      return <AlertTriangle className="h-4 w-4 text-red-400" />
    case 'test':
      return <Bell className="h-4 w-4 text-violet-400" />
    default:
      return <Bell className="h-4 w-4 text-slate-400" />
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case '24h_reminder': return '24h Reminder'
    case 'overdue_alert': return 'Overdue Alert'
    case 'test': return 'Test'
    default: return type
  }
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  return `${diffD}d ago`
}

export function NotificationCard({ notification }: NotificationCardProps) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-3 hover:border-slate-600 transition-colors">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getTypeIcon(notification.notification_type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-200">{getTypeLabel(notification.notification_type)}</span>
            <span className="text-xs text-slate-500">· {formatRelativeTime(notification.created_at)}</span>
          </div>
          {notification.tasks && (
            <p className="text-sm text-slate-300 mt-1">
              {notification.tasks.title}
            </p>
          )}
          {notification.tasks && (
            <p className="text-xs text-slate-500 mt-0.5">
              Due {new Date(notification.tasks.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          )}
          <div className={cn(
            'flex items-center gap-1 text-xs mt-2',
            notification.status === 'sent' ? 'text-emerald-400' :
            notification.status === 'failed' ? 'text-red-400' : 'text-amber-400'
          )}>
            {getStatusIcon(notification.status)}
            {notification.status === 'sent' && `Sent to ${notification.subscription_count} device(s)`}
            {notification.status === 'failed' && 'Failed'}
            {notification.status === 'pending' && 'Pending'}
            {notification.status === 'skipped' && 'Skipped'}
          </div>
        </div>
      </div>
    </div>
  )
}
