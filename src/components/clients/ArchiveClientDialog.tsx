'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Client } from '@/types'

interface ArchiveClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client | null
  action: 'archive' | 'restore'
  onConfirm: () => void
  isLoading: boolean
}

export function ArchiveClientDialog({ open, onOpenChange, client, action, onConfirm, isLoading }: ArchiveClientDialogProps) {
  if (!client) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-slate-900 border-slate-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-slate-50">
            {action === 'archive' ? `Archive ${client.business_name}?` : `Restore ${client.business_name}?`}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400">
            {action === 'archive'
              ? 'Archiving this client will hide them from your active client list. Their work history, billing records, and invoices will be preserved. You can restore them at any time.'
              : 'This will move the client back to your active client list.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} className="border-slate-700 text-slate-300">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={action === 'archive' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white'}
          >
            {isLoading ? 'Processing...' : action === 'archive' ? 'Archive Client' : 'Restore Client'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
