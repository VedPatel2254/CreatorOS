'use client'

import { useState } from 'react'
import { ArrowLeft, AlertTriangle, Plus, Trash2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ConfidenceBadge } from './ConfidenceBadge'
import { useWorkTypes } from '@/hooks/useSettings'
import { ReviewRow, WorkType } from '@/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ReviewStepProps {
  clientId: string
  clientName: string
  batchId: string
  reviewRows: ReviewRow[]
  isImageBased: boolean
  onRowsChange: (rows: ReviewRow[]) => void
  onConfirm: () => Promise<void>
  onDiscard: () => void
  isConfirming: boolean
  onBackToUpload: () => void
}

export function ReviewStep({
  clientId,
  clientName,
  batchId,
  reviewRows,
  isImageBased,
  onRowsChange,
  onConfirm,
  onDiscard,
  isConfirming,
  onBackToUpload,
}: ReviewStepProps) {
  const router = useRouter()
  const { data: workTypes = [] } = useWorkTypes()
  const activeWorkTypes = workTypes.filter((w: WorkType) => w.is_active)

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [validationErrors, setValidationErrors] = useState<Map<string, string[]>>(new Map())
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)

  const selectedCount = reviewRows.filter(r => r.selected).length
  const warningCount = reviewRows.filter(r => r.confidence === 'low').length

  const allSelected = reviewRows.length > 0 && reviewRows.every(r => r.selected)
  const someSelected = reviewRows.some(r => r.selected) && !allSelected

  const toggleRow = (id: string) => {
    onRowsChange(reviewRows.map(r => r.id === id ? { ...r, selected: !r.selected } : r))
  }

  const selectAll = () => {
    onRowsChange(reviewRows.map(r => ({ ...r, selected: true })))
  }

  const deselectAll = () => {
    onRowsChange(reviewRows.map(r => ({ ...r, selected: false })))
  }

  const updateRow = (id: string, field: keyof ReviewRow, value: any) => {
    onRowsChange(reviewRows.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const addRow = () => {
    const newRow: ReviewRow = {
      id: crypto.randomUUID(),
      selected: true,
      title: '',
      work_type_id: '',
      platform: '',
      deadline: '',
      description: '',
      notes: '',
      is_billable: true,
      confidence: 'low',
      warnings: [],
      raw_text: '',
    }
    onRowsChange([...reviewRows, newRow])
    setExpandedRows(prev => new Set([...prev, newRow.id]))
  }

  const deleteRow = (id: string) => {
    onRowsChange(reviewRows.filter(r => r.id !== id))
    setExpandedRows(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const toggleExpanded = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const validateSelected = (): boolean => {
    const errors = new Map<string, string[]>()
    reviewRows.forEach(row => {
      if (!row.selected) return
      const rowErrors: string[] = []
      if (!row.title.trim()) rowErrors.push('Title is required')
      if (!row.work_type_id) rowErrors.push('Work type is required')
      if (!row.deadline || isNaN(new Date(row.deadline).getTime())) rowErrors.push('Valid deadline is required')
      if (rowErrors.length > 0) errors.set(row.id, rowErrors)
    })
    setValidationErrors(errors)
    return errors.size === 0
  }

  const handleConfirm = async () => {
    if (!validateSelected()) {
      toast.error('Please fix the highlighted rows before importing.')
      return
    }
    try {
      await onConfirm()
    } catch {
      toast.error('Failed to import tasks. Please try again.')
    }
  }

  if (isImageBased && reviewRows.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-300">This PDF appears to be image-based (scanned).</p>
              <p className="text-sm text-amber-400/80 mt-1">Text extraction is not possible for scanned PDFs. You can manually add tasks below, or go back and upload a text-based PDF.</p>
              <div className="flex gap-3 mt-3">
                <Button variant="outline" size="sm" onClick={onBackToUpload} className="border-slate-700 text-slate-300">
                  Go Back
                </Button>
                <Button size="sm" onClick={addRow} className="bg-violet-600 hover:bg-violet-700 text-white">
                  Add Manually
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Button variant="ghost" onClick={() => router.push(`/clients/${clientId}`)} className="text-slate-400 hover:text-slate-50 mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />Back to Client
      </Button>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-50">Review Extracted Tasks</h1>
          <p className="text-sm text-slate-400 mt-1">
            {clientName} · {reviewRows.length} tasks extracted · {warningCount} warnings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={selectAll} className="border-slate-700 text-slate-300">Select All</Button>
          <Button variant="outline" size="sm" onClick={deselectAll} className="border-slate-700 text-slate-300">Deselect All</Button>
          <Button variant="outline" size="sm" onClick={addRow} className="border-slate-700 text-slate-300">
            <Plus className="mr-1 h-4 w-4" />Add Row
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-700 mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <th className="p-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected }}
                  onChange={() => allSelected ? deselectAll() : selectAll()}
                  className="rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500"
                />
              </th>
              <th className="p-3 w-10"></th>
              <th className="p-3 text-left">Date/Deadline</th>
              <th className="p-3 text-left">Title</th>
              <th className="p-3 text-left">Work Type</th>
              <th className="p-3 text-left">Platform</th>
              <th className="p-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {reviewRows.map((row) => {
              const isExpanded = expandedRows.has(row.id)
              const errors = validationErrors.get(row.id) || []
              const hasErrors = errors.length > 0

              return (
                <ReviewRowComponent
                  key={row.id}
                  row={row}
                  isExpanded={isExpanded}
                  hasErrors={hasErrors}
                  errors={errors}
                  activeWorkTypes={activeWorkTypes}
                  onToggle={() => toggleRow(row.id)}
                  onUpdate={(field, value) => updateRow(row.id, field, value)}
                  onDelete={() => deleteRow(row.id)}
                  onExpand={() => toggleExpanded(row.id)}
                />
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setShowDiscardDialog(true)} className="border-slate-700 text-slate-400 hover:text-red-400">
          Discard Import
        </Button>
        <div className="flex items-center gap-4">
          <p className="text-sm text-slate-400">
            {selectedCount} of {reviewRows.length} tasks selected · {warningCount} warnings · {validationErrors.size} errors
          </p>
          <Button
            onClick={handleConfirm}
            disabled={selectedCount === 0 || isConfirming}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {isConfirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Import {selectedCount} Selected {selectedCount === 1 ? 'Task' : 'Tasks'}
          </Button>
        </div>
      </div>

      {showDiscardDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-50">Discard this import?</h3>
            <p className="text-sm text-slate-400 mt-2">Extracted data will be lost. No tasks will be created.</p>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowDiscardDialog(false)} className="border-slate-700 text-slate-300">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setShowDiscardDialog(false)
                  onDiscard()
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Discard
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ReviewRowComponent({
  row,
  isExpanded,
  hasErrors,
  errors,
  activeWorkTypes,
  onToggle,
  onUpdate,
  onDelete,
  onExpand,
}: {
  row: ReviewRow
  isExpanded: boolean
  hasErrors: boolean
  errors: string[]
  activeWorkTypes: WorkType[]
  onToggle: () => void
  onUpdate: (field: keyof ReviewRow, value: any) => void
  onDelete: () => void
  onExpand: () => void
}) {
  return (
    <>
      <tr className={cn(
        'border-b border-slate-700/50 transition-colors',
        !row.selected && 'opacity-50',
        hasErrors && 'bg-red-500/5 border-l-2 border-red-500',
        row.confidence === 'low' && row.selected && !hasErrors && 'bg-amber-500/5',
      )}>
        <td className="p-3">
          <input
            type="checkbox"
            checked={row.selected}
            onChange={onToggle}
            className="rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500"
          />
        </td>
        <td className="p-3">
          <ConfidenceBadge confidence={row.confidence} />
        </td>
        <td className="p-3">
          <Input
            type="date"
            value={row.deadline ? row.deadline.split('T')[0] : ''}
            onChange={(e) => {
              const dateVal = e.target.value
              if (dateVal) {
                const dt = new Date(dateVal + 'T00:00:00')
                onUpdate('deadline', dt.toISOString())
              } else {
                onUpdate('deadline', '')
              }
            }}
            className={cn(
              'bg-slate-800 border-slate-700 text-slate-50 w-40 text-xs',
              (!row.deadline || isNaN(new Date(row.deadline).getTime())) && 'border-red-500'
            )}
          />
        </td>
        <td className="p-3">
          <Input
            value={row.title}
            onChange={(e) => onUpdate('title', e.target.value)}
            placeholder="Task title"
            className={cn(
              'bg-slate-800 border-slate-700 text-slate-50 min-w-[180px]',
              !row.title.trim() && 'border-red-500'
            )}
          />
        </td>
        <td className="p-3">
          <Select value={row.work_type_id} onValueChange={(v) => onUpdate('work_type_id', v)}>
            <SelectTrigger className={cn(
              'bg-slate-800 border-slate-700 text-slate-50 w-36',
              !row.work_type_id && 'border-red-500'
            )}>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {activeWorkTypes.map((wt) => (
                <SelectItem key={wt.id} value={wt.id}>{wt.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>
        <td className="p-3">
          <Input
            value={row.platform}
            onChange={(e) => onUpdate('platform', e.target.value)}
            placeholder="Platform"
            className="bg-slate-800 border-slate-700 text-slate-50 w-28"
          />
        </td>
        <td className="p-3">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onExpand} className="h-7 w-7 text-slate-400 hover:text-slate-50">
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} className="h-7 w-7 text-slate-400 hover:text-red-400">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr className={cn('border-b border-slate-700/50', !row.selected && 'opacity-50')}>
          <td colSpan={7} className="px-6 py-4 bg-slate-800/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Description</Label>
                <Textarea
                  value={row.description}
                  onChange={(e) => onUpdate('description', e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-50 min-h-[60px] text-xs"
                  placeholder="Task description"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Notes</Label>
                <Textarea
                  value={row.notes}
                  onChange={(e) => onUpdate('notes', e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-50 min-h-[60px] text-xs"
                  placeholder="Additional notes"
                />
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-xs text-slate-400">Billable</Label>
                <Switch
                  checked={row.is_billable}
                  onCheckedChange={(v) => onUpdate('is_billable', v)}
                />
              </div>
            </div>
            {row.raw_text && (
              <div className="mt-3">
                <Label className="text-xs text-slate-500">Original: {row.raw_text}</Label>
              </div>
            )}
            {row.warnings.length > 0 && (
              <div className="mt-3 space-y-1">
                {row.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-amber-400">⚠ {w}</p>
                ))}
              </div>
            )}
            {errors.length > 0 && (
              <div className="mt-3 space-y-1">
                {errors.map((e, i) => (
                  <p key={i} className="text-xs text-red-400">✗ {e}</p>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}
