// Client-side push subscription utilities
// No server-only imports here

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported'
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return 'denied'
  return await Notification.requestPermission()
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null
  try {
    const registration = await navigator.serviceWorker.ready
    return await registration.pushManager.getSubscription()
  } catch {
    return null
  }
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null
  try {
    const registration = await navigator.serviceWorker.ready
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BIDzdgpwYHucKornHKAtvmWS9XQRvMDykRD5Ky32nHcsPFQD1g8UaobBdwmCtxcegta3rv3sCsX74rLw3D-boqw'
    if (!publicKey) throw new Error('VAPID public key not configured')
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    })
    return subscription
  } catch (error) {
    console.error('Failed to subscribe to push:', error)
    return null
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const subscription = await getCurrentPushSubscription()
    if (!subscription) return true
    return await subscription.unsubscribe()
  } catch {
    return false
  }
}

export function detectDeviceLabel(): string {
  const ua = navigator.userAgent
  if (/iPhone/.test(ua)) return 'iPhone'
  if (/iPad/.test(ua)) return 'iPad'
  if (/Android/.test(ua) && /Mobile/.test(ua)) return 'Android Phone'
  if (/Android/.test(ua)) return 'Android Tablet'
  if (/Mac/.test(ua)) return 'Mac'
  if (/Windows/.test(ua)) return 'Windows PC'
  if (/Linux/.test(ua)) return 'Linux'
  return 'Browser'
}
