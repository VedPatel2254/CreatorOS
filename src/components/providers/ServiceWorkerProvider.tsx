'use client'

import { useEffect } from 'react'

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('CreatorOS: New service worker installed')
            }
          })
        })
        console.log('CreatorOS: Service worker registered')
      } catch (error) {
        console.error('CreatorOS: Service worker registration failed:', error)
      }
    }

    registerSW()
  }, [])

  return <>{children}</>
}
