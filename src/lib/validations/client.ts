import { z } from 'zod'

export const clientSchema = z.object({
  business_name: z.string().min(1, 'Business name is required').max(100),
  contact_name: z.string().max(100).default(''),
  email: z.union([z.literal(''), z.string().email('Invalid email address')]),
  phone: z.string().max(20).default(''),
  address: z.string().max(300).default(''),
  notes: z.string().max(1000).default(''),
  billing_type: z.enum(['per_item', 'monthly_package', 'one_off']),
  monthly_package_amount: z.coerce
    .number()
    .min(0, 'Amount must be positive')
    .nullable()
    .optional(),
  payment_preference: z.string().max(100).default(''),
  payment_notes: z.string().max(500).default(''),
}).superRefine((data, ctx) => {
  if (
    data.billing_type === 'monthly_package' &&
    (data.monthly_package_amount === null ||
      data.monthly_package_amount === undefined ||
      isNaN(data.monthly_package_amount))
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Monthly package amount is required for package clients',
      path: ['monthly_package_amount'],
    })
  }
})

export type ClientFormValues = z.infer<typeof clientSchema>

export const pricingRuleSchema = z.object({
  work_type_id: z.string().uuid('Please select a work type'),
  unit_price: z.coerce
    .number()
    .min(0, 'Price must be 0 or more')
    .max(999999, 'Price too large'),
})

export type PricingRuleFormValues = z.infer<typeof pricingRuleSchema>
