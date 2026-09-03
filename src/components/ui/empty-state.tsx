'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { LucideIcon } from 'lucide-react'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: { label: string; onClick: () => void } | { label: string; href: string }
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-500" />
      </div>
      <h3 className="text-sm font-semibold text-slate-300 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-xs mb-6">{description}</p>}
      {action && (
        'onClick' in action
          ? <Button size="sm" onClick={action.onClick} className="bg-violet-600 hover:bg-violet-700 text-white">{action.label}</Button>
          : <Button size="sm" asChild className="bg-violet-600 hover:bg-violet-700 text-white"><Link href={action.href}>{action.label}</Link></Button>
      )}
    </div>
  )
}
