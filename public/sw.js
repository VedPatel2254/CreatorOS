const STATIC_CACHE = 'creatoros-static-v3'
const DYNAMIC_CACHE = 'creatoros-dynamic-v3'

const PRECACHE_ASSETS = ['/', '/dashboard', '/offline', '/manifest.json']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      Promise.allSettled(PRECACHE_ASSETS.map(url => cache.add(url).catch(() => {})))
    )
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => ![STATIC_CACHE, DYNAMIC_CACHE].includes(key)).map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)

  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('googleapis.com') ||
    !url.origin.includes(self.location.origin)
  ) return

  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg')
  ) {
    event.respondWith(
      caches.match(event.request).then(
        cached => cached || fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(STATIC_CACHE).then(cache => cache.put(event.request, clone))
          }
          return response
        })
      )
    )
    return
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() =>
        caches.match(event.request).then(
          cached => cached || caches.match('/offline')
        )
      )
  )
})

self.addEventListener('push', (event) => {
  if (!event.data) return
  let data = {}
  try { data = event.data.json() } catch { data = { title: 'CreatorOS', body: event.data.text() } }

  const title = data.title || 'CreatorOS'
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'creatoros-notification',
    data: { url: data.url || '/dashboard', task_id: data.task_id || null, notification_type: data.notification_type || 'general' },
    requireInteraction: data.requireInteraction || false,
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const urlToOpen = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.navigate(urlToOpen)
          return
        }
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen)
    })
  )
})
