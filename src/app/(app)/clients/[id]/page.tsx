'use client'

import { use, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useClient } from '@/hooks/useClients'
import { useTasks } from '@/hooks/useTasks'
import { useSettings } from '@/hooks/useSettings'
import { useClientBillingData, usePaymentRecords } from '@/hooks/useBilling'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClientPricingCard } from '@/components/clients/ClientPricingCard'
import { ClientSheet } from '@/components/clients/ClientSheet'
import { ArchiveClientDialog } from '@/components/clients/ArchiveClientDialog'
import { TaskSheet } from '@/components/tasks/TaskSheet'
import { ImportHistoryList } from '@/components/import/ImportHistoryList'
import { ClientBillingCard } from '@/components/billing/ClientBillingCard'
import { PaymentHistoryList } from '@/components/billing/PaymentHistoryList'
import { PaymentSheet } from '@/components/billing/PaymentSheet'
import { DateRangeSelector } from '@/components/billing/DateRangeSelector'
import { useInvoices } from '@/hooks/useInvoices'
import { InvoiceStatusBadge } from '@/components/invoices/InvoiceStatusBadge'
import { ArrowLeft, Pencil, Mail, Phone, MapPin, Archive, ArchiveRestore, FileText, Plus } from 'lucide-react'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { useArchiveClient, useUnarchiveClient } from '@/hooks/useClients'
import { toast } from 'sonner'
import { TASK_STATUS_CONFIG } from '@/lib/task-status'
import { DateRange } from '@/types'
import { getDateRangeForPreset } from '@/lib/billing-utils'

function getAvatarColor(name: string): string {
  const colors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500']
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: client, isLoading } = useClient(id)
  const { data: tasks = [] } = useTasks({ client_id: id })
  const { data: settings } = useSettings()
  const archiveClient = useArchiveClient()
  const unarchiveClient = useUnarchiveClient()

  const [showEdit, setShowEdit] = useState(false)
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [archiveAction, setArchiveAction] = useState<'archive' | 'restore'>('archive')
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') ?? 'overview'
  const [showTaskSheet, setShowTaskSheet] = useState(false)
  const [workTab, setWorkTab] = useState('all')
  const [billingDateRange, setBillingDateRange] = useState<DateRange>(getDateRangeForPreset('this_month'))
  const [showPaymentSheet, setShowPaymentSheet] = useState(false)

  const { data: billingData } = useClientBillingData(id, billingDateRange)
  const { data: clientPayments = [] } = usePaymentRecords({ client_id: id })
  const { data: clientInvoices = [] } = useInvoices({ client_id: id })

  const currencySymbol = settings?.currency_symbol ?? '₹'

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48 bg-slate-800" />
        <Skeleton className="h-[200px] w-full bg-slate-800 rounded-xl" />
        <Skeleton className="h-[200px] w-full bg-slate-800 rounded-xl" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-xl font-semibold text-slate-300">Client not found</h2>
        <Button variant="link" onClick={() => router.push('/clients')} className="mt-4 text-violet-400">Back to Clients</Button>
      </div>
    )
  }

  const activeTasks = tasks.filter((t) => t.status !== 'delivered' && t.status !== 'cancelled')
  const deliveredTasks = tasks.filter((t) => t.status === 'delivered')
  const cancelledTasks = tasks.filter((t) => t.status === 'cancelled')

  const filteredWorkTasks = workTab === 'all' ? tasks
    : workTab === 'active' ? activeTasks
    : workTab === 'delivered' ? deliveredTasks
    : cancelledTasks

  const handleArchiveAction = async () => {
    if (archiveAction === 'archive') {
      await archiveClient.mutateAsync(client.id)
      toast.success('Client archived')
    } else {
      await unarchiveClient.mutateAsync(client.id)
      toast.success('Client restored')
    }
    setShowArchiveDialog(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/clients')} className="text-slate-400 hover:text-slate-50">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className={cn('h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold', getAvatarColor(client.business_name))}>
          {client.business_name.substring(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-50">{client.business_name}</h1>
          <div className="flex items-center gap-2 text-sm text-slate-400 flex-wrap">
            {client.contact_name && <span>{client.contact_name}</span>}
            {client.contact_name && client.email && <span>·</span>}
            {client.email && <a href={`mailto:${client.email}`} className="hover:text-violet-400">{client.email}</a>}
            {(client.contact_name || client.email) && client.phone && <span>·</span>}
            {client.phone && <a href={`tel:${client.phone}`} className="hover:text-violet-400">{client.phone}</a>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn('text-xs', client.billing_type === 'monthly_package' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : client.billing_type === 'per_item' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20')}>
            {client.billing_type === 'monthly_package' ? 'Monthly Package' : client.billing_type === 'per_item' ? 'Per Item' : 'One Off'}
          </Badge>
          <Badge className={cn('text-xs', client.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20')}>
            {client.status === 'active' ? 'Active' : 'Archived'}
          </Badge>
          <Button onClick={() => setShowEdit(true)} variant="outline" size="sm" className="border-slate-700 text-slate-300">
            <Pencil className="mr-2 h-4 w-4" />Edit
          </Button>
          {client.status === 'active' ? (
            <Button variant="outline" size="sm" onClick={() => { setArchiveAction('archive'); setShowArchiveDialog(true) }} className="border-slate-700 text-slate-400 hover:text-red-400">
              <Archive className="mr-2 h-4 w-4" />Archive
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => { setArchiveAction('restore'); setShowArchiveDialog(true) }} className="border-slate-700 text-slate-400 hover:text-emerald-400">
              <ArchiveRestore className="mr-2 h-4 w-4" />Restore
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="bg-slate-800 border-slate-700 w-full justify-start">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-50">Overview</TabsTrigger>
          <TabsTrigger value="work" className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-50">Work</TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-50">Billing</TabsTrigger>
          <TabsTrigger value="invoices" className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-50">Invoices</TabsTrigger>
          <TabsTrigger value="imports" className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-50">Imports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-base text-slate-50">Client Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {client.contact_name && (
                  <div className="flex items-center gap-3 text-sm"><span className="text-slate-400 w-24">Contact:</span><span className="text-slate-50">{client.contact_name}</span></div>
                )}
                {client.email && (
                  <div className="flex items-center gap-3 text-sm"><Mail className="h-4 w-4 text-slate-400 w-24 shrink-0" /><a href={`mailto:${client.email}`} className="text-slate-50 hover:text-violet-400">{client.email}</a></div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-3 text-sm"><Phone className="h-4 w-4 text-slate-400 w-24 shrink-0" /><a href={`tel:${client.phone}`} className="text-slate-50 hover:text-violet-400">{client.phone}</a></div>
                )}
                {client.address && (
                  <div className="flex items-center gap-3 text-sm"><MapPin className="h-4 w-4 text-slate-400 w-24 shrink-0" /><span className="text-slate-50">{client.address}</span></div>
                )}
                {client.notes && (
                  <div className="pt-2 border-t border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">Notes</p>
                    <p className="text-sm text-slate-300">{client.notes}</p>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm pt-2 border-t border-slate-700/50">
                  <span className="text-slate-400 w-24">Created:</span>
                  <span className="text-slate-50">{formatDate(client.created_at)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-base text-slate-50">Billing & Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-slate-400 w-24">Billing:</span>
                  <Badge className={cn('text-xs', client.billing_type === 'monthly_package' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : client.billing_type === 'per_item' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20')}>
                    {client.billing_type === 'monthly_package' ? 'Monthly Package' : client.billing_type === 'per_item' ? 'Per Item' : 'One Off'}
                  </Badge>
                </div>
                {client.billing_type === 'monthly_package' && client.monthly_package_amount && (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-slate-400 w-24">Package:</span>
                    <span className="text-slate-50 font-semibold">{formatCurrency(client.monthly_package_amount, currencySymbol)}/month</span>
                  </div>
                )}
                {client.payment_preference && (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-slate-400 w-24">Payment:</span>
                    <span className="text-slate-50">{client.payment_preference}</span>
                  </div>
                )}
                {client.payment_notes && (
                  <div className="pt-2 border-t border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">Payment Notes</p>
                    <p className="text-sm text-slate-300">{client.payment_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {client.billing_type === 'per_item' && (
            <div className="mt-6">
              <ClientPricingCard clientId={id} pricingRules={client.client_pricing_rules ?? []} currencySymbol={currencySymbol} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="work" className="mt-6">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base text-slate-50">Tasks</CardTitle>
                <p className="text-sm text-slate-400 mt-1">{tasks.length} total · {activeTasks.length} active</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => setShowTaskSheet(true)} className="bg-violet-600 hover:bg-violet-700 text-white">
                  + Add Task
                </Button>
                <Button size="sm" variant="outline" onClick={() => router.push(`/clients/${id}/import`)} className="border-slate-700 text-slate-300">
                  <FileText className="mr-2 h-4 w-4" />Import PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                {(['all', 'active', 'delivered', 'cancelled'] as const).map((tab) => (
                  <button key={tab} onClick={() => setWorkTab(tab)} className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-colors', workTab === tab ? 'bg-violet-600/20 text-violet-400 border-violet-500/30' : 'text-slate-400 border-slate-700 hover:bg-slate-800')}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)} ({tab === 'all' ? tasks.length : tab === 'active' ? activeTasks.length : tab === 'delivered' ? deliveredTasks.length : cancelledTasks.length})
                  </button>
                ))}
              </div>
              {filteredWorkTasks.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  {workTab === 'all' ? 'No tasks for this client yet.' : `No ${workTab} tasks.`}
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredWorkTasks.map((task) => {
                    const config = TASK_STATUS_CONFIG[task.status]
                    return (
                      <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-50 truncate">{task.title}</p>
                          <p className="text-xs text-slate-400">{task.work_types?.name} · Due {formatDate(task.deadline)}</p>
                        </div>
                        <Badge className={cn('text-xs ml-3', config.bgColor, config.color, config.borderColor, 'border')}>
                          <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', config.dotColor)} />
                          {config.label}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <DateRangeSelector value={billingDateRange} onChange={setBillingDateRange} />
              <Button onClick={() => setShowPaymentSheet(true)} className="bg-violet-600 hover:bg-violet-700 text-white">
                <Plus className="mr-2 h-4 w-4" />Record Payment
              </Button>
            </div>

            {billingData ? (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-slate-800/50">
                    <div className="text-2xl font-bold text-slate-50">{formatCurrency(billingData.totalEarned, currencySymbol)}</div>
                    <div className="text-xs text-slate-400">Earned</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-slate-800/50">
                    <div className="text-2xl font-bold text-emerald-400">{formatCurrency(billingData.totalPaid, currencySymbol)}</div>
                    <div className="text-xs text-slate-400">Paid</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-slate-800/50">
                    <div className={cn('text-2xl font-bold', billingData.totalUnpaid > 0 ? 'text-red-400' : 'text-slate-50')}>{formatCurrency(billingData.totalUnpaid, currencySymbol)}</div>
                    <div className="text-xs text-slate-400">Unpaid</div>
                  </div>
                </div>

                <Card className="bg-slate-900/50 border-slate-700">
                  <CardContent className="p-0">
                    <ClientBillingCard summary={billingData} currencySymbol={currencySymbol} defaultExpanded={true} showClientName={false} />
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-base text-slate-50">Payment History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PaymentHistoryList payments={clientPayments} currencySymbol={currencySymbol} />
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent>
                  <p className="text-sm text-slate-400 text-center py-8">Loading billing data...</p>
                </CardContent>
              </Card>
            )}
          </div>

          <PaymentSheet open={showPaymentSheet} onOpenChange={setShowPaymentSheet} defaultClientId={id} />
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-slate-50">Invoices</CardTitle>
                <Button size="sm" onClick={() => router.push('/invoices/new')} className="bg-violet-600 hover:bg-violet-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />New Invoice
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {clientInvoices.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No invoices yet.</p>
              ) : (
                <div className="space-y-2">
                  {clientInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => router.push(`/invoices/${inv.id}`)}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-700/50 bg-slate-800/50 hover:bg-slate-800/80 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-200">{inv.invoice_number}</p>
                          <p className="text-xs text-slate-400">{formatDate(inv.issue_date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <p className="text-sm font-medium text-slate-100">{formatCurrency(inv.total, currencySymbol)}</p>
                        <InvoiceStatusBadge status={inv.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imports" className="mt-6">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-base text-slate-50">Import History</CardTitle>
            </CardHeader>
            <CardContent>
              <ImportHistoryList clientId={id} clientName={client.business_name} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ClientSheet open={showEdit} onOpenChange={setShowEdit} client={client} />
      <ArchiveClientDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog} client={client} action={archiveAction} onConfirm={handleArchiveAction} isLoading={archiveClient.isPending || unarchiveClient.isPending} />
      <TaskSheet open={showTaskSheet} onOpenChange={setShowTaskSheet} defaultClientId={id} />
    </div>
  )
}
