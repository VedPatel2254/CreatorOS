'use client'

import { useState, useEffect } from 'react'
import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DateRange, DateRangePreset } from '@/types'
import { getDateRangeForPreset, formatDateRange } from '@/lib/billing-utils'

interface DateRangeSelectorProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

const PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'last_6_months', label: 'Last 6 Months' },
  { value: 'this_year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range...' },
]

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const [showCustom, setShowCustom] = useState(false)
  const [customStart, setCustomStart] = useState(value.start)
  const [customEnd, setCustomEnd] = useState(value.end)

  useEffect(() => {
    setCustomStart(value.start)
    setCustomEnd(value.end)
  }, [value.start, value.end])

  const handlePresetChange = (preset: string) => {
    if (preset === 'custom') {
      setShowCustom(true)
      return
    }
    setShowCustom(false)
    onChange(getDateRangeForPreset(preset as DateRangePreset))
  }

  const handleCustomApply = () => {
    if (customStart && customEnd && customStart <= customEnd) {
      onChange({ start: customStart, end: customEnd, preset: 'custom' })
      setShowCustom(false)
    }
  }

  const displayLabel = value.preset === 'custom'
    ? formatDateRange(value)
    : PRESETS.find(p => p.value === value.preset)?.label ?? 'Select period'

  return (
    <div className="space-y-2">
      <Select value={value.preset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-full sm:w-[200px] bg-slate-800 border-slate-700 text-slate-50">
          <Calendar className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700">
          {PRESETS.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>{preset.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-slate-400">{formatDateRange(value)}</p>

      {showCustom && (
        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <div className="flex-1">
            <Label className="text-xs text-slate-400">From</Label>
            <Input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-slate-800 border-slate-700 text-slate-50"
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs text-slate-400">To</Label>
            <Input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-slate-800 border-slate-700 text-slate-50"
            />
          </div>
          <Button onClick={handleCustomApply} className="bg-violet-600 hover:bg-violet-700 text-white mt-4 sm:mt-6">
            Apply
          </Button>
        </div>
      )}
    </div>
  )
}
