// supabase/functions/send-notifications/index.ts
// Supabase Edge Function — runs on Deno runtime
// Called by pg_cron every hour

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_URL = Deno.env.get('APP_URL')!
const NOTIFICATION_EDGE_SECRET = Deno.env.get('NOTIFICATION_EDGE_SECRET')!

Deno.serve(async (_req: Request) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const now = new Date()
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    // Find tasks due within 24 hours
    const { data: upcomingTasks, error: upcomingError } = await supabase
      .from('tasks')
      .select('id, user_id, title, deadline, status, clients(business_name)')
      .gt('deadline', now.toISOString())
      .lte('deadline', in24h.toISOString())
      .not('status', 'in', '("delivered","cancelled")')

    if (upcomingError) {
      console.error('Error fetching upcoming tasks:', upcomingError)
    }

    // Find overdue tasks
    const { data: overdueTasks, error: overdueError } = await supabase
      .from('tasks')
      .select('id, user_id, title, deadline, status, clients(business_name)')
      .lt('deadline', now.toISOString())
      .not('status', 'in', '("delivered","cancelled")')

    if (overdueError) {
      console.error('Error fetching overdue tasks:', overdueError)
    }

    // Check already-sent notifications
    const allTaskIds = [
      ...(upcomingTasks ?? []).map(t => t.id),
      ...(overdueTasks ?? []).map(t => t.id),
    ]

    let alreadyNotified24h = new Set<string>()
    let alreadyNotifiedOverdue = new Set<string>()

    if (allTaskIds.length > 0) {
      const { data: existingLogs } = await supabase
        .from('notification_log')
        .select('task_id, notification_type, sent_at')
        .in('task_id', allTaskIds)
        .eq('status', 'sent')

      for (const log of existingLogs ?? []) {
        if (log.notification_type === '24h_reminder') {
          alreadyNotified24h.add(log.task_id)
        }
        if (
          log.notification_type === 'overdue_alert' &&
          log.sent_at &&
          new Date(log.sent_at) > oneHourAgo
        ) {
          alreadyNotifiedOverdue.add(log.task_id)
        }
      }
    }

    let totalSent = 0
    let totalSkipped = 0

    // Send 24h reminders
    for (const task of upcomingTasks ?? []) {
      if (alreadyNotified24h.has(task.id)) {
        totalSkipped++
        continue
      }

      const { data: settings } = await supabase
        .from('user_settings')
        .select('notifications_enabled, notify_24h_before')
        .eq('user_id', task.user_id)
        .single()

      if (!settings?.notifications_enabled || !settings?.notify_24h_before) {
        totalSkipped++
        continue
      }

      const deadline = new Date(task.deadline)
      const hoursUntil = Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60))
      const clientName = (task.clients as any)?.business_name ?? 'Client'

      const response = await fetch(`${APP_URL}/api/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: task.user_id,
          title: `⏰ Due in ${hoursUntil}h: ${task.title}`,
          body: `${clientName} · Deadline approaching`,
          url: `/work/${task.id}`,
          tag: `24h-${task.id}`,
          task_id: task.id,
          notification_type: '24h_reminder',
          requireInteraction: true,
          secret: NOTIFICATION_EDGE_SECRET,
        }),
      })

      if (response.ok) totalSent++
    }

    // Send overdue alerts
    for (const task of overdueTasks ?? []) {
      if (alreadyNotifiedOverdue.has(task.id)) {
        totalSkipped++
        continue
      }

      const { data: settings } = await supabase
        .from('user_settings')
        .select('notifications_enabled, notify_overdue')
        .eq('user_id', task.user_id)
        .single()

      if (!settings?.notifications_enabled || !settings?.notify_overdue) {
        totalSkipped++
        continue
      }

      const clientName = (task.clients as any)?.business_name ?? 'Client'
      const deadline = new Date(task.deadline)
      const daysOverdue = Math.floor((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24))
      const overdueLabel = daysOverdue === 0 ? 'due today' : daysOverdue === 1 ? '1 day overdue' : `${daysOverdue} days overdue`

      const response = await fetch(`${APP_URL}/api/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: task.user_id,
          title: `🔴 Overdue: ${task.title}`,
          body: `${clientName} · ${overdueLabel}`,
          url: `/work/${task.id}`,
          tag: `overdue-${task.id}`,
          task_id: task.id,
          notification_type: 'overdue_alert',
          requireInteraction: false,
          secret: NOTIFICATION_EDGE_SECRET,
        }),
      })

      if (response.ok) totalSent++
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: (upcomingTasks?.length ?? 0) + (overdueTasks?.length ?? 0),
        sent: totalSent,
        skipped: totalSkipped,
        timestamp: now.toISOString(),
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 })
  }
})
