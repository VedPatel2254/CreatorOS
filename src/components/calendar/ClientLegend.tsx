'use client'

import { TaskWithRelations } from '@/types'
import { getClientColor } from '@/lib/calendar-utils'

interface ClientLegendProps {
  tasks: TaskWithRelations[]
  filterClientId: string | null
  onFilterClientChange: (id: string | null) => void
}

export function ClientLegend({ tasks, filterClientId, onFilterClientChange }: ClientLegendProps) {
  const uniqueClients = new Map<string, string>()
  tasks.forEach((t) => {
    if (t.clients?.id && t.clients?.business_name) {
      uniqueClients.set(t.clients.id, t.clients.business_name)
    }
  })

  if (uniqueClients.size === 0) return null

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Clients</h3>
      <div className="space-y-2">
        {Array.from(uniqueClients.entries()).map(([id, name]) => {
          const color = getClientColor(id)
          return (
            <button
              key={id}
              onClick={() => onFilterClientChange(filterClientId === id ? null : id)}
              className={`flex items-center gap-2 w-full text-left text-sm transition-colors ${filterClientId === id ? 'text-slate-50' : 'text-slate-400 hover:text-slate-300'}`}
            >
              <span className={`w-2 h-2 rounded-full ${color.bg}`} />
              <span className="truncate">{name}</span>
            </button>
          )
        })}
      </div>
      {filterClientId && (
        <button
          onClick={() => onFilterClientChange(null)}
          className="text-xs text-violet-400 hover:text-violet-300 mt-3"
        >
          Show All
        </button>
      )}
    </div>
  )
}
