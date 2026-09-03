'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, DollarSign, Pencil } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useAddPricingRule, useDeletePricingRule } from '@/hooks/useClients'
import { useWorkTypes } from '@/hooks/useSettings'
import { ClientPricingRuleWithWorkType } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface ClientPricingCardProps {
  clientId: string
  pricingRules: ClientPricingRuleWithWorkType[]
  currencySymbol?: string
}

export function ClientPricingCard({ clientId, pricingRules, currencySymbol = '₹' }: ClientPricingCardProps) {
  const { data: workTypes = [] } = useWorkTypes()
  const addRule = useAddPricingRule()
  const deleteRule = useDeletePricingRule()

  const [showAdd, setShowAdd] = useState(false)
  const [selectedWorkType, setSelectedWorkType] = useState('')
  const [price, setPrice] = useState('')

  const today = new Date().toISOString().split('T')[0]
  const activeRules = pricingRules.filter(
    (r) => r.effective_from <= today && (r.effective_to === null || r.effective_to >= today)
  )

  const availableWorkTypes = workTypes.filter(
    (wt) => wt.is_active && !activeRules.some((r) => r.work_type_id === wt.id)
  )

  const handleAdd = async () => {
    if (!selectedWorkType || !price) return
    await addRule.mutateAsync({
      client_id: clientId,
      work_type_id: selectedWorkType,
      unit_price: parseFloat(price),
    })
    setShowAdd(false)
    setSelectedWorkType('')
    setPrice('')
    toast.success('Pricing rule added')
  }

  const handleDelete = async (id: string) => {
    await deleteRule.mutateAsync({ id, client_id: clientId })
    toast.success('Pricing rule removed')
  }

  return (
    <Card className="bg-slate-900/50 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base text-slate-50 flex items-center gap-2">
          <DollarSign className="h-4 w-4" />Pricing Rules
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => setShowAdd(true)} disabled={availableWorkTypes.length === 0} className="border-slate-700 text-slate-300">
          <Plus className="mr-1 h-3 w-3" />Add
        </Button>
      </CardHeader>
      <CardContent>
        {activeRules.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No pricing rules set. Click &quot;Add&quot; to set per-work-type prices.</p>
        ) : (
          <div className="space-y-2">
            {activeRules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <div>
                  <span className="text-sm font-medium text-slate-50">{rule.work_types?.name}</span>
                  <span className="text-sm text-slate-400 ml-2">— {formatCurrency(rule.unit_price, currencySymbol)}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-400" onClick={() => handleDelete(rule.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-50">Add Pricing Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Work Type</Label>
              <Select value={selectedWorkType} onValueChange={setSelectedWorkType}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-50">
                  <SelectValue placeholder="Select work type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {availableWorkTypes.map((wt) => (
                    <SelectItem key={wt.id} value={wt.id}>{wt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Unit Price (₹)</Label>
              <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="bg-slate-800 border-slate-700 text-slate-50" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)} className="border-slate-700 text-slate-300">Cancel</Button>
            <Button onClick={handleAdd} disabled={!selectedWorkType || !price || addRule.isPending} className="bg-violet-600 hover:bg-violet-700 text-white">
              {addRule.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
