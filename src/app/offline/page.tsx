'use client'

import Link from 'next/link'
import { WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-6">
          <WifiOff className="h-8 w-8 text-slate-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">You&apos;re offline</h1>
        <p className="text-slate-400 mb-6">
          CreatorOS requires an internet connection. Your data is safe — reconnect to continue.
        </p>
        <Button onClick={() => window.location.reload()} className="bg-violet-600 hover:bg-violet-700 text-white">
          Try Again
        </Button>
      </div>
    </div>
  )
}
