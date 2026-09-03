'use client'

import { Smartphone, Tablet, Monitor, Trash2, Loader2 } from 'lucide-react'
import { PushSubscription } from '@/types'
import { useRemoveSubscription } from '@/hooks/useNotifications'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface DeviceListProps {
  subscriptions: PushSubscription[]
  currentEndpoint: string | null
}

function getDeviceIcon(label: string) {
  if (/iPhone|Android Phone/.test(label)) return <Smartphone className="h-5 w-5 text-slate-400" />
  if (/iPad|Android Tablet/.test(label)) return <Tablet className="h-5 w-5 text-slate-400" />
  return <Monitor className="h-5 w-5 text-slate-400" />
}

export function DeviceList({ subscriptions, currentEndpoint }: DeviceListProps) {
  const removeSubscription = useRemoveSubscription()

  const handleRemove = async (endpoint: string) => {
    try {
      await removeSubscription.mutateAsync(endpoint)
      toast.success('Device removed')
    } catch {
      toast.error('Failed to remove device')
    }
  }

  if (subscriptions.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-4">No devices registered.</p>
  }

  return (
    <div className="space-y-0">
      {subscriptions.map((sub) => {
        const isCurrentDevice = sub.endpoint === currentEndpoint
        return (
          <div key={sub.id} className="flex items-center justify-between py-4 border-b border-slate-700/50 last:border-0">
            <div className="flex items-center gap-3">
              {getDeviceIcon(sub.device_label)}
              <div>
                <p className="text-sm font-medium text-slate-200">
                  {sub.device_label}
                  {isCurrentDevice && <span className="ml-2 text-xs text-violet-400">(This device)</span>}
                </p>
                <p className="text-xs text-slate-500">
                  Added {new Date(sub.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemove(sub.endpoint)}
              disabled={removeSubscription.isPending}
              className="text-slate-400 hover:text-red-400"
            >
              {removeSubscription.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        )
      })}
    </div>
  )
}
