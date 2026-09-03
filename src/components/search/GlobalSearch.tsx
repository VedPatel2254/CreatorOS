'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Users, CheckSquare, FileText, Plus, Upload, Loader2 } from 'lucide-react'
import { useSearch } from './SearchContext'
import { SearchResult } from '@/types'
import { Badge } from '@/components/ui/badge'

const QUICK_LINKS = [
  { label: 'Add Task', icon: Plus, action: 'task' as const },
  { label: 'Add Client', icon: Users, action: 'client' as const },
  { label: 'New Invoice', icon: FileText, url: '/invoices/new' },
  { label: 'Import PDF', icon: Upload, url: '/clients' },
]

function getResultIcon(type: string) {
  switch (type) {
    case 'client': return <Users className="h-4 w-4 text-violet-400" />
    case 'task': return <CheckSquare className="h-4 w-4 text-blue-400" />
    case 'invoice': return <FileText className="h-4 w-4 text-emerald-400" />
    default: return <Search className="h-4 w-4 text-slate-400" />
  }
}

function getResultTypeLabel(type: string) {
  switch (type) {
    case 'client': return 'CLIENTS'
    case 'task': return 'TASKS'
    case 'invoice': return 'INVOICES'
    default: return ''
  }
}

function getMetaBadge(meta: string) {
  if (['paid', 'delivered', 'active'].includes(meta)) {
    return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">{meta}</Badge>
  }
  if (['overdue', 'cancelled'].includes(meta)) {
    return <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-xs">{meta}</Badge>
  }
  if (['sent', 'in_progress', 'ready'].includes(meta)) {
    return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">{meta}</Badge>
  }
  return meta ? <Badge className="bg-slate-700 text-slate-300 text-xs">{meta}</Badge> : null
}

interface GlobalSearchProps {
  onOpenTaskSheet?: () => void
  onOpenClientSheet?: () => void
}

export function GlobalSearch({ onOpenTaskSheet, onOpenClientSheet }: GlobalSearchProps) {
  const { isOpen, close } = useSearch()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const allResults = results.reduce<{ type: string; items: SearchResult[] }[]>((groups, r) => {
    const existing = groups.find(g => g.type === r.type)
    if (existing) existing.items.push(r)
    else groups.push({ type: r.type, items: [r] })
    return groups
  }, [])

  const flatResults = allResults.flatMap(g => g.items)

  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setIsLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.results ?? [])
    } catch {
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchResults(query), 250)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, fetchResults])

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults([])
      setFocusedIndex(-1)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) close()
        else { open() }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, close])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { close(); return }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIndex(prev => Math.min(prev + 1, flatResults.length - 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIndex(prev => Math.max(prev - 1, -1))
    }
    if (e.key === 'Enter' && focusedIndex >= 0 && flatResults[focusedIndex]) {
      const r = flatResults[focusedIndex]
      router.push(r.url)
      close()
    }
  }

  const handleQuickLink = (action: string) => {
    if (action === 'task') { onOpenTaskSheet?.() }
    else if (action === 'client') { onOpenClientSheet?.() }
    close()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={close}>
      <div className="max-w-xl w-full mx-auto mt-[15vh] md:mt-[20vh]" onClick={e => e.stopPropagation()}>
        <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-700">
            {isLoading ? (
              <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
            ) : (
              <Search className="h-5 w-5 text-slate-400" />
            )}
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setFocusedIndex(-1) }}
              onKeyDown={handleKeyDown}
              placeholder="Search clients, tasks, invoices..."
              className="flex-1 bg-transparent text-slate-50 text-base focus:outline-none placeholder:text-slate-500"
            />
            <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-500 bg-slate-800 border border-slate-700 rounded">
              ESC
            </kbd>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {query.length < 2 ? (
              <div className="p-3">
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Quick Actions</p>
                {QUICK_LINKS.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => link.url ? (router.push(link.url), close()) : handleQuickLink(link.action!)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                      <link.icon className="h-4 w-4 text-slate-400" />
                    </div>
                    {link.label}
                  </button>
                ))}
              </div>
            ) : flatResults.length === 0 && !isLoading ? (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-400">No results for &ldquo;{query}&rdquo;</p>
              </div>
            ) : (
              <div className="p-3">
                {allResults.map((group) => (
                  <div key={group.type}>
                    <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {getResultTypeLabel(group.type)}
                    </p>
                    {group.items.map((result) => {
                      const idx = flatResults.indexOf(result)
                      return (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => { router.push(result.url); close() }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                            idx === focusedIndex ? 'bg-slate-800' : 'hover:bg-slate-800'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                            {getResultIcon(result.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-200 truncate">{result.title}</p>
                            <p className="text-xs text-slate-400 truncate">{result.subtitle}</p>
                          </div>
                          {result.meta && getMetaBadge(result.meta)}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
