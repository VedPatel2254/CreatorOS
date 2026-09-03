'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { TaskSheet } from '@/components/tasks/TaskSheet'

export function QuickAddFAB() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)} className="md:hidden fixed bottom-20 right-4 z-40 bg-violet-600 hover:bg-violet-500 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-violet-500/25 transition-colors">
        <Plus className="h-6 w-6" />
      </button>
      <TaskSheet open={open} onOpenChange={setOpen} />
    </>
  )
}
