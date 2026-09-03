'use client'

import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ErrorState({
  message = 'Something went wrong.',
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
      <p className="text-sm text-slate-400 mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="border-slate-700 text-slate-300">
          Try Again
        </Button>
      )}
    </div>
  )
}
