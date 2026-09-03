'use client'

import { useState } from 'react'
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
import { useClients } from '@/hooks/useClients'
import { useCreatePaymentRecord, useUpdatePaymentRecord, usePaymentRecords } from '@/hooks/useBilling'
import { paymentRecordSchema, PaymentRecordFormValues } from '@/lib/validations/payment'
import { PaymentRecord } from '@/types'

interface PaymentSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payment?: PaymentRecord
  defaultClientId?: string
  defaultAmount?: number
}

export function PaymentSheet({ open, onOpenChange, payment, defaultClientId, defaultAmount }: PaymentSheetProps) {
  const createPayment = useCreatePaymentRecord()
  const updatePayment = useUpdatePaymentRecord()
  const { data: clients = [] } = useClients()
  const { data: payments = [] } = usePaymentRecords({ client_id: defaultClientId })
  const isEditing = !!payment

  const activeClients = clients.filter((c) => c.status === 'active')

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<PaymentRecordFormValues>({
    resolver: zodResolver(paymentRecordSchema) as any,
    defaultValues: {
      client_id: defaultClientId ?? payment?.client_id ?? '',
      amount: defaultAmount ?? payment?.amount ?? 0,
      payment_date: payment?.payment_date ?? new Date().toISOString().split('T')[0],
      payment_method: payment?.payment_method ?? '',
      reference: payment?.reference ?? '',
      notes: payment?.notes ?? '',
    },
  })

  const selectedClientId = watch('client_id')
  const clientPayments = payments.filter(p => p.client_id === selectedClientId)
  const totalPaid = clientPayments.reduce((sum, p) => sum + p.amount, 0)
  const selectedClient = activeClients.find(c => c.id === selectedClientId)

  const onSubmit = async (data: PaymentRecordFormValues) => {
    try {
      if (isEditing) {
        await updatePayment.mutateAsync({ id: payment.id, ...data })
        toast.success('Payment updated')
      } else {
        await createPayment.mutateAsync(data)
        toast.success('Payment recorded')
      }
      onOpenChange(false)
    } catch {
      toast.error(isEditing ? 'Failed to update payment' : 'Failed to record payment')
    }
  }

  const isPending = createPayment.isPending || updatePayment.isPending

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-slate-900 border-slate-700 w-full sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-slate-50">{isEditing ? 'Edit Payment' : 'Record Payment'}</SheetTitle>
          <SheetDescription className="text-slate-400">
            {isEditing ? 'Update payment details' : 'Record a payment received from a client'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Amount *</Label>
              <Input {...register('amount')} type="number" step="0.01" className="bg-slate-800 border-slate-700 text-slate-50" />
              {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Payment Date *</Label>
              <Input {...register('payment_date')} type="date" className="bg-slate-800 border-slate-700 text-slate-50" />
              {errors.payment_date && <p className="text-sm text-red-500">{errors.payment_date.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Payment Method</Label>
            <Select value={watch('payment_method')} onValueChange={(v) => setValue('payment_method', v)}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-50">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Reference</Label>
            <Input {...register('reference')} className="bg-slate-800 border-slate-700 text-slate-50" placeholder="Transaction ID, cheque number, etc." />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Notes</Label>
            <Textarea {...register('notes')} className="bg-slate-800 border-slate-700 text-slate-50 min-h-[60px]" />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700 text-slate-300" disabled={isPending}>
              <X className="mr-2 h-4 w-4" />Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-violet-600 hover:bg-violet-700 text-white">
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isEditing ? 'Update Payment' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
