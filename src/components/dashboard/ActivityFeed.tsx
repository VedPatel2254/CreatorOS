'use client'

import Link from 'next/link'
import { CheckSquare, FileText, Users, DollarSign } from 'lucide-react'
import { ActivityLog } from '@/types'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

type ActivityFeedProps = {
  activities: ActivityLog[]
  isLoading: boolean
}

const ACTION_LABELS: Record<string, string> = {
  'created': 'Created',
  'status_changed': 'Status changed',
  'invoice_generated': 'Invoice generated',
  'payment_recorded': 'Payment recorded',
  'pdf_import_confirmed': 'PDF import confirmed',
  'deleted': 'Deleted',
}

function getEntityIcon(type: string) {
  switch (type) {
    case 'task': return <CheckSquare className="h-4 w-4 text-violet-400" />
    case 'invoice': return <FileText className="h-4 w-4 text-blue-400" />
    case 'client': return <Users className="h-4 w-4 text-emerald-400" />
    case 'payment': return <DollarSign className="h-4 w-4 text-amber-400" />
    default: return <CheckSquare className="h-4 w-4 text-slate-400" />
  }
}

function getEntityBg(type: string) {
  switch (type) {
    case 'task': return 'bg-violet-500/10'
    case 'invoice': return 'bg-blue-500/10'
    case 'client': return 'bg-emerald-500/10'
    case 'payment': return 'bg-amber-500/10'
    default: return 'bg-slate-700/50'
  }
}

function getEntityUrl(activity: ActivityLog): string | null {
  switch (activity.entity_type) {
    case 'task': return `/work/${activity.entity_id}`
    case 'invoice': return `/invoices/${activity.entity_id}`
    case 'client': return `/clients/${activity.entity_id}`
    default: return null
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
  if (diffD === 1) return 'Yesterday'
  return `${diffD}d ago`
}

function getEntityTitle(activity: ActivityLog): string {
  const nv = activity.new_value as any
  const ov = activity.old_value as any
  if (nv?.title) return nv.title
  if (nv?.status) return `Status → ${nv.status}`
  if (nv?.amount) return `Amount: ${nv.amount}`
  if (ov?.status && nv?.status) return `${ov.status} → ${nv.status}`
  return activity.action
}

export function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 rounded-lg bg-slate-800" />)}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-6">No recent activity. Start by adding clients and tasks.</p>
    )
  }

  return (
    <div>
      {activities.map(activity => {
        const url = getEntityUrl(activity)
        const content = (
          <div className="flex items-start gap-3 py-3 border-b border-slate-700/30 last:border-b-0">
            <div className={cn('w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center', getEntityBg(activity.entity_type))}>
              {getEntityIcon(activity.entity_type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-200">
                {ACTION_LABELS[activity.action] ?? activity.action}
                <span className="text-xs text-slate-500 ml-2">· {formatRelativeTime(activity.created_at)}</span>
              </p>
              <p className="text-xs text-slate-400 truncate mt-0.5">{getEntityTitle(activity)}</p>
            </div>
          </div>
        )

        return url ? (
          <Link key={activity.id} href={url} className="block hover:bg-slate-800/20 -mx-1 px-1 rounded transition-colors">
            {content}
          </Link>
        ) : (
          <div key={activity.id}>{content}</div>
        )
      })}
    </div>
  )
}
