export type UserSettings = {
  id: string
  user_id: string
  business_name: string
  business_email: string
  business_phone: string
  business_address: string
  logo_url: string | null
  currency_symbol: string
  currency_code: string
  timezone: string
  invoice_prefix: string
  invoice_next_number: number
  notifications_enabled: boolean
  notify_24h_before: boolean
  notify_overdue: boolean
  notification_sound: boolean
  created_at: string
  updated_at: string
}

export type WorkType = {
  id: string
  user_id: string
  name: string
  is_active: boolean
  sort_order: number
  created_at: string
}

export type BillingType = 'per_item' | 'monthly_package' | 'one_off'
export type ClientStatus = 'active' | 'archived'

export type Client = {
  id: string
  user_id: string
  business_name: string
  contact_name: string
  email: string
  phone: string
  address: string
  notes: string
  billing_type: BillingType
  monthly_package_amount: number | null
  payment_preference: string
  payment_notes: string
  status: ClientStatus
  created_at: string
  updated_at: string
}

export type ClientPricingRule = {
  id: string
  client_id: string
  user_id: string
  work_type_id: string
  unit_price: number
  effective_from: string
  effective_to: string | null
  created_at: string
}

export type ClientPricingRuleWithWorkType = ClientPricingRule & {
  work_types: {
    id: string
    name: string
  }
}

export type ClientWithPricing = Client & {
  client_pricing_rules: ClientPricingRuleWithWorkType[]
}

export type TaskStatus = 'planned' | 'in_progress' | 'ready' | 'delivered' | 'cancelled'
export type TaskSource = 'manual' | 'pdf_import'

export type Task = {
  id: string
  user_id: string
  client_id: string
  work_type_id: string
  assigned_to: string | null
  title: string
  description: string
  platform: string
  deadline: string
  status: TaskStatus
  is_billable: boolean
  effective_unit_price: number | null
  billing_quantity: number
  billing_notes: string
  billing_locked: boolean
  source: TaskSource
  import_batch_id: string | null
  notes: string
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type TaskWithRelations = Task & {
  clients: {
    id: string
    business_name: string
    status: string
  }
  work_types: {
    id: string
    name: string
  }
}

export type ActivityLog = {
  id: string
  user_id: string
  entity_type: 'task' | 'invoice' | 'client' | 'payment'
  entity_id: string
  action: string
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  created_at: string
}

export type CalendarView = 'month' | 'week' | 'day' | 'agenda'

export type CalendarDay = {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  isWeekend: boolean
  tasks: TaskWithRelations[]
}

export type CalendarWeek = CalendarDay[]

export type ClientColorMap = Record<string, string>

export type ImportBatchStatus = 'pending_review' | 'confirmed' | 'discarded'
export type ExtractionConfidence = 'high' | 'medium' | 'low' | 'failed'
export type ExtractionMethod = 'text' | 'ocr_unavailable'

export type PdfImportBatch = {
  id: string
  user_id: string
  client_id: string
  original_filename: string
  storage_path: string | null
  extracted_raw: ExtractedRaw | null
  extraction_method: ExtractionMethod
  extraction_confidence: ExtractionConfidence
  status: ImportBatchStatus
  task_count_extracted: number
  task_count_created: number
  extraction_warnings: string[] | null
  created_at: string
  updated_at: string
}

export type ExtractedRaw = {
  rows: ExtractedRow[]
  metadata: {
    page_count: number
    text_length: number
    extraction_method: string
    extracted_at: string
  }
}

export type ExtractedRow = {
  id: string
  date: string | null
  parsed_date: string | null
  title: string | null
  content_type: string | null
  matched_work_type_id: string | null
  platform: string | null
  caption: string | null
  notes: string | null
  deadline_time: string | null
  confidence: 'high' | 'medium' | 'low'
  warnings: string[]
  raw_text: string
}

export type ReviewRow = {
  id: string
  selected: boolean
  title: string
  work_type_id: string
  platform: string
  deadline: string
  description: string
  notes: string
  is_billable: boolean
  confidence: 'high' | 'medium' | 'low'
  warnings: string[]
  raw_text: string
}

export type PdfImportBatchWithClient = PdfImportBatch & {
  clients: {
    id: string
    business_name: string
  }
}

export type PaymentMethod = 'bank_transfer' | 'upi' | 'cash' | 'cheque' | 'online' | 'other'

export type PaymentRecord = {
  id: string
  user_id: string
  client_id: string
  invoice_id: string | null
  amount: number
  payment_date: string
  payment_method: string
  reference: string
  notes: string
  created_at: string
  updated_at: string
}

export type PaymentRecordWithClient = PaymentRecord & {
  clients: {
    id: string
    business_name: string
  }
}

export type ClientBillingSummary = {
  client: {
    id: string
    business_name: string
    billing_type: BillingType
    monthly_package_amount: number | null
  }
  deliveredTasks: BilledTask[]
  pendingTasks: PendingTask[]
  deliveredAmount: number
  pendingAmount: number
  packageAmount: number
  totalEarned: number
  totalPaid: number
  totalUnpaid: number
}

export type BilledTask = {
  taskId: string
  title: string
  workTypeName: string
  platform: string
  completedAt: string
  effectiveUnitPrice: number
  billingQuantity: number
  billingAmount: number
  billingLocked: boolean
  importBatchId: string | null
}

export type PendingTask = {
  taskId: string
  title: string
  workTypeName: string
  platform: string
  deadline: string
  status: TaskStatus
  estimatedUnitPrice: number | null
  billingQuantity: number
  estimatedAmount: number | null
}

export type BillingPeriodSummary = {
  periodStart: string
  periodEnd: string
  clientSummaries: ClientBillingSummary[]
  totalDeliveredAmount: number
  totalPendingAmount: number
  totalPaidAmount: number
  totalUnpaidAmount: number
  totalClients: number
  activeClientCount: number
}

export type DateRangePreset = 'this_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'this_year' | 'custom'

export type DateRange = {
  start: string
  end: string
  preset: DateRangePreset
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled'
export type InvoiceType = 'detailed' | 'summary' | 'package'

export type Invoice = {
  id: string
  user_id: string
  client_id: string
  invoice_number: string
  invoice_type: InvoiceType
  status: InvoiceStatus
  issue_date: string
  due_date: string | null
  billing_period_start: string | null
  billing_period_end: string | null
  subtotal: number
  discount_amount: number
  tax_label: string
  tax_rate: number
  tax_amount: number
  total: number
  amount_paid: number
  notes: string
  payment_notes: string
  pdf_storage_path: string | null
  created_at: string
  updated_at: string
}

export type InvoiceLineItem = {
  id: string
  invoice_id: string
  task_id: string | null
  description: string
  work_type_name: string
  delivery_date: string | null
  quantity: number
  unit_price: number
  amount: number
  sort_order: number
  created_at: string
}

export type InvoiceWithDetails = Invoice & {
  clients: {
    id: string
    business_name: string
    contact_name: string
    email: string
    phone: string
    address: string
  }
  invoice_line_items: InvoiceLineItem[]
}

export type InvoiceStatusConfig = {
  label: string
  color: string
  bgColor: string
  borderColor: string
}

export type InvoiceGenerationInput = {
  client_id: string
  invoice_type: InvoiceType
  issue_date: string
  due_date: string | null
  billing_period_start: string
  billing_period_end: string
  task_ids: string[]
  discount_amount: number
  tax_label: string
  tax_rate: number
  notes: string
  payment_notes: string
}

export type InvoiceBusinessDetails = {
  business_name: string
  business_email: string
  business_phone: string
  business_address: string
  logo_url: string | null
  currency_symbol: string
  currency_code: string
}

export type InvoiceRenderData = {
  invoice: Invoice
  lineItems: InvoiceLineItem[]
  client: InvoiceWithDetails['clients']
  business: InvoiceBusinessDetails
  currencySymbol: string
}

export type NotificationType = '24h_reminder' | 'overdue_alert' | 'test'

export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'skipped'

export type PushSubscription = {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  device_label: string
  user_agent: string
  is_active: boolean
  last_used_at: string | null
  created_at: string
  updated_at: string
}

export type NotificationLog = {
  id: string
  user_id: string
  task_id: string | null
  notification_type: NotificationType
  title: string
  body: string
  scheduled_for: string | null
  sent_at: string | null
  status: NotificationStatus
  error_message: string | null
  subscription_count: number
  created_at: string
}

export type NotificationLogWithTask = NotificationLog & {
  tasks: {
    id: string
    title: string
    deadline: string
    status: string
  } | null
}

export type DashboardData = {
  tasksDueToday: TaskWithRelations[]
  tasksUpcoming: TaskWithRelations[]
  tasksOverdue: TaskWithRelations[]
  billingSummary: {
    totalEarned: number
    totalPaid: number
    totalUnpaid: number
    totalPending: number
  }
  activeClientCount: number
  invoiceStats: {
    draft: number
    sent: number
    overdue: number
    totalOutstanding: number
  }
  recentInvoices: InvoiceWithClientName[]
  taskStats: Record<TaskStatus, number>
  recentActivity: ActivityLog[]
  unreadNotifications: number
}

export type InvoiceWithClientName = Invoice & {
  clients: {
    id: string
    business_name: string
  }
}

export type SearchResultType = 'client' | 'task' | 'invoice'

export type SearchResult = {
  id: string
  type: SearchResultType
  title: string
  subtitle: string
  url: string
  meta?: string
}
