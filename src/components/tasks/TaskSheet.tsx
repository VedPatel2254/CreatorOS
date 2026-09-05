'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Save, X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useCreateTask, useCreateTasks, useUpdateTask } from '@/hooks/useTasks'
import { useClients } from '@/hooks/useClients'
import { useWorkTypes } from '@/hooks/useSettings'
import { taskSchema, TaskFormValues } from '@/lib/validations/task'
import { resolveExpectedPrice } from '@/lib/billing-utils'
import { formatCurrency } from '@/lib/utils'
import { TaskWithRelations, Client, ClientPricingRuleWithWorkType } from '@/types'
import { MultiDatePicker } from './MultiDatePicker'

interface TaskSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: TaskWithRelations | null
  defaultClientId?: string
}

export function TaskSheet({ open, onOpenChange, task, defaultClientId }: TaskSheetProps) {
  const createTask = useCreateTask()
  const createTasks = useCreateTasks()
  const updateTask = useUpdateTask()
  const { data: clients = [] } = useClients()
  const { data: workTypes = [] } = useWorkTypes()
  const isEditing = !!task

  const activeClients = clients.filter((c) => c.status === 'active')
  const activeWorkTypes = workTypes.filter((w) => w.is_active)

  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [selectedTime, setSelectedTime] = useState('09:00')

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema) as any,
    defaultValues: {
      client_id: '',
      work_type_id: '',
      title: '',
      description: '',
      platform: '',
      deadline: '',
      is_billable: true,
      billing_quantity: 1,
      effective_unit_price: null,
      billing_notes: '',
      notes: '',
    },
  })

  const selectedClientId = watch('client_id')
  const selectedWorkTypeId = watch('work_type_id')
  const isBillable = watch('is_billable')
  const billingQuantity = watch('billing_quantity')
  const selectedClient = activeClients.find((c) => c.id === selectedClientId) as (Client & { client_pricing_rules?: ClientPricingRuleWithWorkType[] }) | undefined
  const resolvedPrice = selectedClient?.client_pricing_rules
    ? resolveExpectedPrice(selectedClient.client_pricing_rules, selectedWorkTypeId)
    : null
  const effectivePrice = watch('effective_unit_price') ?? resolvedPrice
  const totalAmount = effectivePrice && billingQuantity ? effectivePrice * billingQuantity : null

  useEffect(() => {
    if (open && task) {
      reset({
        client_id: task.client_id,
        work_type_id: task.work_type_id,
        title: task.title,
        description: task.description ?? '',
        platform: task.platform ?? '',
        deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '',
        is_billable: task.is_billable,
        billing_quantity: task.billing_quantity ?? 1,
        effective_unit_price: task.effective_unit_price,
        billing_notes: task.billing_notes ?? '',
        notes: task.notes ?? '',
      })
      setSelectedDates([])
      setSelectedTime('09:00')
    } else if (open) {
      reset({
        client_id: defaultClientId ?? '',
        work_type_id: '', title: '', description: '', platform: '',
        deadline: '', is_billable: true, billing_quantity: 1,
        effective_unit_price: null, billing_notes: '', notes: '',
      })
      setSelectedDates([])
      setSelectedTime('09:00')
    }
  }, [open, task, defaultClientId, reset])

  useEffect(() => {
    if (!isEditing) {
      setValue('effective_unit_price', null)
    }
  }, [selectedWorkTypeId, setValue, isEditing])

  const onSubmit = async (data: TaskFormValues) => {
    try {
      if (isEditing) {
        await updateTask.mutateAsync({ id: task.id, ...data })
        toast.success('Task updated')
      } else {
        const datesToUse = selectedDates.length > 0
          ? selectedDates
          : data.deadline ? [data.deadline] : []

        if (datesToUse.length === 0) {
          toast.error('Please select at least one delivery date')
          return
        }

        const payload = {
          ...data,
          effective_unit_price: data.effective_unit_price ?? resolvedPrice,
        }

        if (datesToUse.length === 1) {
          await createTask.mutateAsync({ ...payload, deadline: datesToUse[0] })
          toast.success('Task created')
        } else {
          const tasks = datesToUse.map((date) => ({
            ...payload,
            deadline: date.includes('T') ? date : `${date}T${selectedTime}:00`,
          }))
          await createTasks.mutateAsync(tasks)
          toast.success(`${tasks.length} tasks created`)
        }
      }
      onOpenChange(false)
    } catch {
      toast.error(isEditing ? 'Failed to update task' : 'Failed to create task')
    }
  }

  const isPending = createTask.isPending || createTasks.isPending || updateTask.isPending

  const selectedClientForBilling = activeClients.find((c) => c.id === selectedClientId)
  const billingType = selectedClientForBilling?.billing_type

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-slate-900 border-slate-700 w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-slate-50">{isEditing ? 'Edit Task' : 'New Task'}</SheetTitle>
          <SheetDescription className="text-slate-400">
            {isEditing ? 'Update task details' : 'Add a new task to your work queue'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Client *</Label>
              <Select value={selectedClientId} onValueChange={(v) => setValue('client_id', v)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-50">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {activeClients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.business_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.client_id && <p className="text-sm text-red-500">{errors.client_id.message}</p>}
              {selectedClientId && billingType && (
                <p className="text-xs text-slate-500">
                  {billingType === 'monthly_package' ? '(Monthly Package — billing is fixed)' : billingType === 'per_item' ? '(Per Item — pricing from client rules)' : '(One Off — custom pricing)'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Title *</Label>
              <Input {...register('title')} className="bg-slate-800 border-slate-700 text-slate-50" placeholder="e.g. Instagram Reel for product launch" />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Work Type *</Label>
              <Select value={selectedWorkTypeId} onValueChange={(v) => setValue('work_type_id', v)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-50">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {activeWorkTypes.map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.work_type_id && <p className="text-sm text-red-500">{errors.work_type_id.message}</p>}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <Label className="text-slate-300">Deadline *</Label>
                <Input {...register('deadline')} type="datetime-local" className="bg-slate-800 border-slate-700 text-slate-50" />
                {errors.deadline && <p className="text-sm text-red-500">{errors.deadline.message}</p>}
              </div>
            ) : (
              <MultiDatePicker
                selectedDates={selectedDates}
                onDatesChange={setSelectedDates}
                time={selectedTime}
                onTimeChange={setSelectedTime}
              />
            )}

            <div className="space-y-2">
              <Label className="text-slate-300">Platform</Label>
              <Input {...register('platform')} className="bg-slate-800 border-slate-700 text-slate-50" placeholder="e.g. Instagram, YouTube" list="platforms" />
              <datalist id="platforms">
                <option value="Instagram" />
                <option value="YouTube" />
                <option value="Facebook" />
                <option value="LinkedIn" />
                <option value="Twitter/X" />
                <option value="TikTok" />
                <option value="Website" />
              </datalist>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Description</Label>
              <Textarea {...register('description')} className="bg-slate-800 border-slate-700 text-slate-50 min-h-[60px]" />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Notes</Label>
              <Textarea {...register('notes')} className="bg-slate-800 border-slate-700 text-slate-50 min-h-[60px]" />
            </div>
          </div>

          <Separator className="bg-slate-700" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-slate-300">Billable</Label>
              <Switch checked={isBillable} onCheckedChange={(v) => setValue('is_billable', v)} disabled={task?.billing_locked} />
            </div>

            {isBillable && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Quantity</Label>
                    <Input {...register('billing_quantity')} type="number" step="0.1" className="bg-slate-800 border-slate-700 text-slate-50" disabled={task?.billing_locked} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Unit Price Override</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={watch('effective_unit_price') ?? ''}
                      onChange={(e) => {
                        const val = e.target.value ? parseFloat(e.target.value) : null
                        setValue('effective_unit_price', val)
                      }}
                      className="bg-slate-800 border-slate-700 text-slate-50"
                      placeholder={resolvedPrice ? `Default: ${formatCurrency(resolvedPrice)}` : 'No price set'}
                      disabled={task?.billing_locked}
                    />
                    {resolvedPrice && !watch('effective_unit_price') && (
                      <p className="text-xs text-slate-400">Using client default: {formatCurrency(resolvedPrice)}</p>
                    )}
                  </div>
                </div>

                {totalAmount !== null && (
                  <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Estimated Amount</span>
                      <span className="text-slate-50 font-medium">{formatCurrency(totalAmount)}</span>
                    </div>
                    {selectedDates.length > 1 && (
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-slate-400">Total ({selectedDates.length}x)</span>
                        <span className="text-slate-50 font-medium">{formatCurrency(totalAmount * selectedDates.length)}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-slate-300">Billing Notes</Label>
                  <Input {...register('billing_notes')} className="bg-slate-800 border-slate-700 text-slate-50" placeholder="Additional billing info" disabled={task?.billing_locked} />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700 text-slate-300" disabled={isPending}>
              <X className="mr-2 h-4 w-4" />Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-violet-600 hover:bg-violet-700 text-white">
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isEditing ? 'Update Task' : selectedDates.length > 1 ? `Create ${selectedDates.length} Tasks` : 'Create Task'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
