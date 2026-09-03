import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export interface SendNotificationPayload {
  user_id: string
  title: string
  body: string
  url?: string
  tag?: string
  task_id?: string
  notification_type?: string
  requireInteraction?: boolean
  secret?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body: SendNotificationPayload = await request.json()

    const { data: { user } } = await supabase.auth.getUser()
    const edgeSecret = process.env.NOTIFICATION_EDGE_SECRET
    const isEdgeCall = body.secret && edgeSecret && body.secret === edgeSecret
    const isUserCall = !!user

    if (!isUserCall && !isEdgeCall) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const targetUserId = isUserCall ? user!.id : body.user_id

    if (isUserCall && body.user_id && body.user_id !== user!.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('is_active', true)

    if (subError || !subscriptions?.length) {
      return NextResponse.json({ success: true, sent: 0, message: 'No active subscriptions' })
    }

    const payload = JSON.stringify({
      title: body.title,
      body: body.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      url: body.url || '/dashboard',
      tag: body.tag || `creatoros-${Date.now()}`,
      task_id: body.task_id || null,
      notification_type: body.notification_type || 'general',
      requireInteraction: body.requireInteraction || false,
    })

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
            { TTL: 86400, urgency: 'normal' }
          )
          await supabase
            .from('push_subscriptions')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', sub.id)
          return { success: true, id: sub.id }
        } catch (error: any) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            await supabase
              .from('push_subscriptions')
              .update({ is_active: false })
              .eq('id', sub.id)
          }
          throw error
        }
      })
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    if (body.task_id || body.notification_type !== 'test') {
      await supabase.from('notification_log').insert({
        user_id: targetUserId,
        task_id: body.task_id || null,
        notification_type: body.notification_type || 'test',
        title: body.title,
        body: body.body,
        sent_at: new Date().toISOString(),
        status: sent > 0 ? 'sent' : 'failed',
        subscription_count: sent,
        error_message: failed > 0 ? `${failed} subscriptions failed` : null,
      })
    }

    return NextResponse.json({ success: true, sent, failed, total: subscriptions.length })
  } catch (error) {
    console.error('Send notification error:', error)
    return NextResponse.json({ error: 'Send failed' }, { status: 500 })
  }
}
