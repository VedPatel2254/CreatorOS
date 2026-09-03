'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type DashboardSectionProps = {
  title: string
  count?: number
  action?: { label: string; href?: string; onClick?: () => void }
  children: ReactNode
  isEmpty?: boolean
  emptyState?: ReactNode
  alertLevel?: 'none' | 'warning' | 'error'
}

export function DashboardSection({ title, count, action, children, isEmpty, emptyState, alertLevel = 'none' }: DashboardSectionProps) {
  return (
    <div className={cn(
      'mb-6',
      alertLevel === 'warning' && 'border-l-4 border-amber-500 pl-4',
      alertLevel === 'error' && 'border-l-4 border-red-500 pl-4'
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{title}</h2>
          {count !== undefined && count > 0 && (
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{count}</span>
          )}
        </div>
        {action && (
          action.href ? (
            <Link href={action.href} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
              {action.label} <ChevronRight className="inline h-3 w-3" />
            </Link>
          ) : (
            <button onClick={action.onClick} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
              {action.label}
            </button>
          )
        )}
      </div>
      {isEmpty && emptyState ? emptyState : children}
    </div>
  )
}
