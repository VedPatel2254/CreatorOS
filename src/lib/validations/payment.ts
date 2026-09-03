import { z } from 'zod'

export const paymentRecordSchema = z.object({
  client_id: z.string().uuid('Please select a client'),
  amount: z.coerce
    .number()
    .min(0.01, 'Amount must be greater than 0')
    .max(9999999, 'Amount too large'),
  payment_date: z.string().min(1, 'Payment date is required'),
  payment_method: z.string().max(100).default(''),
  reference: z.string().max(200).default(''),
  notes: z.string().max(500).default(''),
})

export type PaymentRecordFormValues = z.infer<typeof paymentRecordSchema>
