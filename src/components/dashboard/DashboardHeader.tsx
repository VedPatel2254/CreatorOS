'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, UserPlus, FileText, Upload, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TaskSheet } from '@/components/tasks/TaskSheet'
import { ClientSheet } from '@/components/clients/ClientSheet'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}

type DashboardHeaderProps = {
  businessName: string | undefined
  lastUpdated: Date
  onRefresh: () => void
}

export function DashboardHeader({ businessName, lastUpdated, onRefresh }: DashboardHeaderProps) {
  const router = useRouter()
  const [taskSheetOpen, setTaskSheetOpen] = useState(false)
  const [clientSheetOpen, setClientSheetOpen] = useState(false)

  const timeSince = Math.floor((Date.now() - lastUpdated.getTime()) / 60000)
  const isStale = timeSince > 10

  return (
    <>
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-50">
              {getGreeting()}{businessName ? `, ${businessName}` : ''}
            </h1>
            <p className="text-sm text-slate-400 mt-1">{formatDate()}</p>
            {!businessName && (
              <p className="text-xs text-violet-400 mt-1">
                Set your business name in <a href="/settings" className="underline">Settings</a>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {isStale && <span className="w-2 h-2 rounded-full bg-amber-500" />}
            <span>Last updated: {timeSince < 1 ? 'just now' : `${timeSince}m ago`}</span>
            <button onClick={onRefresh} className="p-1 hover:text-slate-300 transition-colors" aria-label="Refresh dashboard">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 md:pb-0">
          <Button size="sm" variant="outline" onClick={() => setTaskSheetOpen(true)} className="border-slate-700 text-slate-300 shrink-0">
            <Plus className="mr-1.5 h-3.5 w-3.5" />Add Task
          </Button>
          <Button size="sm" variant="outline" onClick={() => setClientSheetOpen(true)} className="border-slate-700 text-slate-300 shrink-0">
            <UserPlus className="mr-1.5 h-3.5 w-3.5" />Add Client
          </Button>
          <Button size="sm" variant="outline" onClick={() => router.push('/invoices/new')} className="border-slate-700 text-slate-300 shrink-0">
            <FileText className="mr-1.5 h-3.5 w-3.5" />Generate Invoice
          </Button>
          <Button size="sm" variant="outline" onClick={() => router.push('/clients')} className="border-slate-700 text-slate-300 shrink-0">
            <Upload className="mr-1.5 h-3.5 w-3.5" />Import PDF
          </Button>
        </div>
      </div>
      <TaskSheet open={taskSheetOpen} onOpenChange={setTaskSheetOpen} />
      <ClientSheet open={clientSheetOpen} onOpenChange={setClientSheetOpen} />
    </>
  )
}
