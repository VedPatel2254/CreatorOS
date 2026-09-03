'use client'

import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DoneStepProps {
  clientName: string
  clientId: string
  tasksCreated: number
  onImportAnother: () => void
}

export function DoneStep({ clientName, clientId, tasksCreated, onImportAnother }: DoneStepProps) {
  const router = useRouter()

  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
        <CheckCircle className="h-10 w-10 text-emerald-400" />
      </div>

      <h1 className="text-2xl font-bold text-slate-100 mt-6">Import Complete!</h1>
      <p className="text-slate-400 mt-2">
        {tasksCreated} {tasksCreated === 1 ? 'task' : 'tasks'} created for {clientName}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
        <Button
          variant="outline"
          onClick={() => router.push(`/clients/${clientId}?tab=work`)}
          className="border-slate-700 text-slate-300"
        >
          View Tasks for Client
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/calendar')}
          className="border-slate-700 text-slate-300"
        >
          Go to Calendar
        </Button>
        <Button
          variant="outline"
          onClick={onImportAnother}
          className="border-slate-700 text-slate-300"
        >
          Import Another PDF
        </Button>
      </div>
    </div>
  )
}
