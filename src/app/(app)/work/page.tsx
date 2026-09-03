'use client'

import { useState } from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Filter, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TaskBoard } from '@/components/tasks/TaskBoard'
import { TaskSheet } from '@/components/tasks/TaskSheet'
import { TaskStatsBar } from '@/components/tasks/TaskStatsBar'
import { useClients } from '@/hooks/useClients'
import { useWorkTypes } from '@/hooks/useSettings'

export default function WorkPage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const params = use(searchParams)
  const router = useRouter()
  const [showTaskSheet, setShowTaskSheet] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importClientId, setImportClientId] = useState('')
  const [selectedClient, setSelectedClient] = useState(params.client ?? '')
  const { data: clients = [] } = useClients()
  const { data: workTypes = [] } = useWorkTypes()

  const activeClients = clients.filter((c) => c.status === 'active')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Work</h1>
          <p className="text-sm text-slate-400 mt-1">Drag tasks between columns to update status</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-violet-600 hover:bg-violet-700 text-white">
              <Plus className="mr-2 h-4 w-4" />New Task
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-slate-800 border-slate-700">
            <DropdownMenuItem onClick={() => setShowTaskSheet(true)} className="text-slate-300 focus:bg-slate-700 focus:text-slate-50">
              Add Single Task
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowImportDialog(true)} className="text-slate-300 focus:bg-slate-700 focus:text-slate-50">
              <FileText className="mr-2 h-4 w-4" />Import from PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <TaskStatsBar />

      <div className="flex gap-3">
        <Select value={selectedClient} onValueChange={setSelectedClient}>
          <SelectTrigger className="w-[200px] bg-slate-800 border-slate-700 text-slate-50">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="All clients" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="">All clients</SelectItem>
            {activeClients.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.business_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TaskBoard clientId={selectedClient || undefined} />
      <TaskSheet open={showTaskSheet} onOpenChange={setShowTaskSheet} />

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-50">Select Client for PDF Import</DialogTitle>
            <DialogDescription className="text-slate-400">
              Choose a client to import a content calendar PDF for.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Select value={importClientId} onValueChange={setImportClientId}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-50">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {activeClients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.business_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowImportDialog(false)} className="border-slate-700 text-slate-300">
                Cancel
              </Button>
              <Button
                disabled={!importClientId}
                onClick={() => {
                  setShowImportDialog(false)
                  router.push(`/clients/${importClientId}/import`)
                }}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
