'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { isPushSupported, requestNotificationPermission, subscribeToPush, unsubscribeFromPush, getCurrentPushSubscription, detectDeviceLabel } from '@/lib/push-utils'
import { useSaveSubscription, useSendTestNotification, usePushSubscriptions } from '@/hooks/useNotifications'
import { toast } from 'sonner'

export function EnableNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const saveSubscription = useSaveSubscription()
  const sendTest = useSendTestNotification()
  const { data: subscriptions = [] } = usePushSubscriptions()

  useEffect(() => {
    setPermission(isPushSupported() ? Notification.permission : 'unsupported')
    getCurrentPushSubscription().then(sub => setIsSubscribed(!!sub))
  }, [])

  const handleEnable = async () => {
    setIsLoading(true)
    try {
      const result = await requestNotificationPermission()
      setPermission(result)
      if (result === 'granted') {
        const subscription = await subscribeToPush()
        if (subscription) {
          const subJson = subscription.toJSON()
          await saveSubscription.mutateAsync({
            subscription: subJson as PushSubscriptionJSON,
            device_label: detectDeviceLabel(),
            user_agent: navigator.userAgent,
          })
          setIsSubscribed(true)
          toast.success('Notifications enabled for this browser')
        } else {
          toast.error('Failed to set up push notifications. Please try again.')
        }
      } else if (result === 'denied') {
        toast.error('Notification permission denied. Please enable in browser settings.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisable = async () => {
    setIsLoading(true)
    try {
      const sub = await getCurrentPushSubscription()
      if (sub) {
        await unsubscribeFromPush()
        await fetch('/api/notifications/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
      }
      setIsSubscribed(false)
      setPermission(Notification.permission)
      toast.success('Notifications disabled for this browser')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTest = async () => {
    try {
      await sendTest.mutateAsync()
      toast.success('Test notification sent — check your browser')
    } catch {
      toast.error('Failed to send test notification')
    }
  }

  // Unsupported state
  if (permission === 'unsupported') {
    return (
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-700/50 flex items-center justify-center shrink-0">
            <BellOff className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Push Notifications Not Supported</h3>
            <p className="text-sm text-slate-400 mt-1">Your browser does not support push notifications. Try Chrome, Firefox, or Edge.</p>
          </div>
        </div>
      </div>
    )
  }

  // Blocked state
  if (permission === 'denied') {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
            <BellOff className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Notifications Blocked</h3>
            <p className="text-sm text-slate-400 mt-1">Browser has blocked notifications. To enable: click the lock icon in your browser&apos;s address bar and allow notifications.</p>
          </div>
        </div>
      </div>
    )
  }

  // Granted + subscribed state
  if (permission === 'granted' && isSubscribed) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
            <BellRing className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-200">Notifications Enabled</h3>
            <p className="text-sm text-slate-400 mt-1">This browser is registered for push alerts.</p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={handleTest}
                disabled={sendTest.isPending}
                className="border-slate-700 text-slate-300"
              >
                {sendTest.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send Test Notification
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDisable}
                disabled={isLoading}
                className="border-slate-700 text-slate-300"
              >
                Disable
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Default state (not yet enabled)
  return (
    <div className="rounded-xl border-2 border-dashed border-slate-700 bg-slate-800/50 p-5">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-slate-700/50 flex items-center justify-center shrink-0">
          <Bell className="h-5 w-5 text-slate-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Enable Push Notifications</h3>
          <p className="text-sm text-slate-400 mt-1">Get deadline reminders even when the app is closed. Requires browser permission.</p>
          <Button
            size="sm"
            onClick={handleEnable}
            disabled={isLoading || saveSubscription.isPending}
            className="mt-3 bg-violet-600 hover:bg-violet-700 text-white"
          >
            {(isLoading || saveSubscription.isPending) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Enable Notifications
          </Button>
        </div>
      </div>
    </div>
  )
}
