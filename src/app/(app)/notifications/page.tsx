'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Settings, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useNotificationLog } from '@/hooks/useNotifications'
import { NotificationCard } from '@/components/notifications/NotificationCard'
import { NotificationType } from '@/types'

type FilterType = 'all' | '24h_reminder' | 'overdue_alert' | 'test'

const filters: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'all' },
  { label: '24h Reminders', value: '24h_reminder' },
  { label: 'Overdue Alerts', value: 'overdue_alert' },
  { label: 'Test', value: 'test' },
]

function groupByDate(notifications: any[]) {
  const groups: Record<string, any[]> = {}
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  for (const n of notifications) {
    const date = new Date(n.created_at)
    date.setHours(0, 0, 0, 0)

    let key: string
    if (date.getTime() === today.getTime()) {
      key = 'TODAY'
    } else if (date.getTime() === yesterday.getTime()) {
      key = 'YESTERDAY'
    } else {
      key = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }

    if (!groups[key]) groups[key] = []
    groups[key].push(n)
  }

  return groups
}

export default function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const { data: notifications = [], isLoading } = useNotificationLog({
    limit: 50,
    notification_type: activeFilter === 'all' ? undefined : (activeFilter as NotificationType),
  })

  const grouped = groupByDate(notifications)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-50">Notifications</h1>
        <Button variant="ghost" asChild className="text-slate-400 hover:text-slate-50">
          <Link href="/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              activeFilter === f.value
                ? 'bg-violet-600/20 text-violet-400 border-violet-500/30'
                : 'text-slate-400 border-slate-700 hover:bg-slate-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notification Log */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl bg-slate-800" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No notifications yet.</p>
          <p className="text-sm text-slate-500 mt-1">Notifications will appear here after the system sends deadline reminders.</p>
          <Button variant="outline" asChild className="mt-4 border-slate-700 text-slate-300">
            <Link href="/settings">Go to Settings</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 mt-6 first:mt-0">
                {dateLabel}
              </h2>
              {items.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
