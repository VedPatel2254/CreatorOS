'use client'

import { useEffect } from 'react'
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
import { Separator } from '@/components/ui/separator'
import { useCreateClient, useUpdateClient } from '@/hooks/useClients'
import { clientSchema, ClientFormValues } from '@/lib/validations/client'
import { Client } from '@/types'

interface ClientSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Client | null
}

export function ClientSheet({ open, onOpenChange, client }: ClientSheetProps) {
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const isEditing = !!client

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema) as any,
    defaultValues: {
      business_name: '',
      contact_name: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
      billing_type: 'per_item',
      monthly_package_amount: null,
      payment_preference: '',
      payment_notes: '',
    },
  })

  const billingType = watch('billing_type')

  useEffect(() => {
    if (open && client) {
      reset({
        business_name: client.business_name,
        contact_name: client.contact_name ?? '',
        email: client.email ?? '',
        phone: client.phone ?? '',
        address: client.address ?? '',
        notes: client.notes ?? '',
        billing_type: client.billing_type,
        monthly_package_amount: client.monthly_package_amount,
        payment_preference: client.payment_preference ?? '',
        payment_notes: client.payment_notes ?? '',
      })
    } else if (open) {
      reset({
        business_name: '', contact_name: '', email: '', phone: '', address: '',
        notes: '', billing_type: 'per_item', monthly_package_amount: null,
        payment_preference: '', payment_notes: '',
      })
    }
  }, [open, client, reset])

  const onSubmit = async (data: ClientFormValues) => {
    try {
      if (isEditing) {
        await updateClient.mutateAsync({ id: client.id, ...data })
        toast.success('Client updated')
      } else {
        await createClient.mutateAsync({
          ...data,
          status: 'active',
          email: data.email || '',
          contact_name: data.contact_name || '',
          phone: data.phone || '',
          address: data.address || '',
          notes: data.notes || '',
          payment_preference: data.payment_preference || '',
          payment_notes: data.payment_notes || '',
          monthly_package_amount: data.monthly_package_amount ?? null,
        } as any)
        toast.success('Client created')
      }
      onOpenChange(false)
    } catch {
      toast.error('Something went wrong')
    }
  }

  const isPending = createClient.isPending || updateClient.isPending

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-slate-900 border-slate-700 w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-slate-50">{isEditing ? 'Edit Client' : 'New Client'}</SheetTitle>
          <SheetDescription className="text-slate-400">
            {isEditing ? 'Update client details' : 'Add a new client to your roster'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Business Name *</Label>
              <Input {...register('business_name')} className="bg-slate-800 border-slate-700 text-slate-50" placeholder="Acme Corp" />
              {errors.business_name && <p className="text-sm text-red-500">{errors.business_name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Contact Name</Label>
                <Input {...register('contact_name')} className="bg-slate-800 border-slate-700 text-slate-50" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Email</Label>
                <Input {...register('email')} type="email" className="bg-slate-800 border-slate-700 text-slate-50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Phone</Label>
                <Input {...register('phone')} className="bg-slate-800 border-slate-700 text-slate-50" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Billing Type</Label>
                <Select value={billingType} onValueChange={(v) => setValue('billing_type', v as any)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="per_item">Per Item</SelectItem>
                    <SelectItem value="monthly_package">Monthly Package</SelectItem>
                    <SelectItem value="one_off">One Off</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {billingType === 'monthly_package' && (
              <div className="space-y-2">
                <Label className="text-slate-300">Monthly Package Amount (₹)</Label>
                <Input {...register('monthly_package_amount')} type="number" step="0.01" className="bg-slate-800 border-slate-700 text-slate-50" />
                {errors.monthly_package_amount && <p className="text-sm text-red-500">{errors.monthly_package_amount.message}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-slate-300">Address</Label>
              <Textarea {...register('address')} className="bg-slate-800 border-slate-700 text-slate-50 min-h-[60px]" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Notes</Label>
              <Textarea {...register('notes')} className="bg-slate-800 border-slate-700 text-slate-50 min-h-[60px]" />
            </div>
          </div>

          <Separator className="bg-slate-700" />

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-300">Payment</h3>
            <div className="space-y-2">
              <Label className="text-slate-300">Payment Preference</Label>
              <Input {...register('payment_preference')} className="bg-slate-800 border-slate-700 text-slate-50" placeholder="e.g. Bank Transfer, UPI" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Payment Notes</Label>
              <Textarea {...register('payment_notes')} className="bg-slate-800 border-slate-700 text-slate-50 min-h-[60px]" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700 text-slate-300" disabled={isPending}>
              <X className="mr-2 h-4 w-4" />Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-violet-600 hover:bg-violet-700 text-white">
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
