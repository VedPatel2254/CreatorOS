import { z } from 'zod'

export const taskSchema = z.object({
  client_id: z.string().uuid('Please select a client'),
  work_type_id: z.string().uuid('Please select a work type'),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be under 200 characters'),
  description: z.string().max(2000).default(''),
  platform: z.string().max(100).default(''),
  deadline: z.string().min(1, 'Deadline is required'),
  is_billable: z.boolean().default(true),
  billing_quantity: z.coerce.number().min(0.1, 'Quantity must be at least 0.1').max(999, 'Quantity too large').default(1),
  effective_unit_price: z.coerce.number().min(0).nullable().optional(),
  billing_notes: z.string().max(500).default(''),
  notes: z.string().max(2000).default(''),
})

export type TaskFormValues = z.infer<typeof taskSchema>

export const bulkStatusSchema = z.object({
  task_ids: z.array(z.string().uuid()).min(1, 'Select at least one task'),
  status: z.enum(['planned', 'in_progress', 'ready', 'delivered', 'cancelled']),
})

export type BulkStatusValues = z.infer<typeof bulkStatusSchema>
