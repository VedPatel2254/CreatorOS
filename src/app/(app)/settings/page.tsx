'use client'

import { useState, useEffect } from 'react'
import { useSettings, useUpdateSettings, useWorkTypes, useAddWorkType, useUpdateWorkType, useDeleteWorkType } from '@/hooks/useSettings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, GripVertical, Trash2, Save, Loader2, Building2, CreditCard, FileText, Briefcase, Bell } from 'lucide-react'
import { EnableNotifications } from '@/components/notifications/EnableNotifications'
import { DeviceList } from '@/components/notifications/DeviceList'
import { usePushSubscriptions, useUpdateNotificationSettings } from '@/hooks/useNotifications'
import { getCurrentPushSubscription, isPushSupported } from '@/lib/push-utils'

const profileSchema = z.object({
  business_name: z.string().min(1, 'Business name is required'),
  business_email: z.string().email('Invalid email').or(z.literal('')),
  business_phone: z.string().optional().default(''),
  business_address: z.string().optional().default(''),
})

type ProfileFormValues = z.infer<typeof profileSchema>

const invoiceSchema = z.object({
  invoice_prefix: z.string().optional().default('INV'),
  invoice_next_number: z.coerce.number().min(1),
})

type InvoiceFormValues = z.infer<typeof invoiceSchema>

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings()
  const updateSettings = useUpdateSettings()
  const { data: workTypes = [] } = useWorkTypes()
  const addWorkType = useAddWorkType()
  const updateWorkType = useUpdateWorkType()
  const deleteWorkType = useDeleteWorkType()

  const [showAddWorkType, setShowAddWorkType] = useState(false)
  const [newWorkType, setNewWorkType] = useState('')
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [bulkImportText, setBulkImportText] = useState('')
  const [editingWorkType, setEditingWorkType] = useState<{ id: string; name: string } | null>(null)

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema) as any,
    values: settings ? {
      business_name: settings.business_name ?? '',
      business_email: settings.business_email ?? '',
      business_phone: settings.business_phone ?? '',
      business_address: settings.business_address ?? '',
    } : undefined,
  })

  const invoiceForm = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema) as any,
    values: settings ? {
      invoice_prefix: settings.invoice_prefix ?? 'INV',
      invoice_next_number: settings.invoice_next_number ?? 1,
    } : undefined,
  })

  const handleSaveProfile = async (data: ProfileFormValues) => {
    try {
      await updateSettings.mutateAsync(data)
      toast.success('Profile updated')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile')
    }
  }

  const handleSaveInvoice = async (data: InvoiceFormValues) => {
    try {
      await updateSettings.mutateAsync(data)
      toast.success('Invoice settings updated')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update invoice settings')
    }
  }

  const handleAddWorkType = async () => {
    if (!newWorkType.trim()) return
    await addWorkType.mutateAsync(newWorkType.trim())
    setNewWorkType('')
    setShowAddWorkType(false)
    toast.success('Work type added')
  }

  const handleToggleWorkType = async (id: string, isActive: boolean) => {
    await updateWorkType.mutateAsync({ id, is_active: !isActive })
  }

  const handleDeleteWorkType = async (id: string) => {
    await deleteWorkType.mutateAsync(id)
    toast.success('Work type deleted')
  }

  const handleUpdateWorkType = async () => {
    if (!editingWorkType || !editingWorkType.name.trim()) return
    await updateWorkType.mutateAsync({ id: editingWorkType.id, name: editingWorkType.name.trim() })
    setEditingWorkType(null)
    toast.success('Work type updated')
  }

  const handleBulkImport = async () => {
    const names = bulkImportText
      .split(/[,\n]/)
      .map(n => n.trim())
      .filter(n => n.length > 0)

    if (names.length === 0) return

    const existingNames = new Set(workTypes.map(wt => wt.name.toLowerCase()))
    const newNames = names.filter(n => !existingNames.has(n.toLowerCase()))
    const duplicates = names.filter(n => existingNames.has(n.toLowerCase()))

    if (newNames.length === 0) {
      toast.warning('All work types already exist')
      setShowBulkImport(false)
      setBulkImportText('')
      return
    }

    let added = 0
    for (const name of newNames) {
      try {
        await addWorkType.mutateAsync(name)
        added++
      } catch {}
    }

    if (duplicates.length > 0) {
      toast.info(`Added ${added} work type(s), skipped ${duplicates.length} duplicate(s)`)
    } else {
      toast.success(`Added ${added} work type(s)`)
    }

    setShowBulkImport(false)
    setBulkImportText('')
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48 bg-slate-800" />
        <Skeleton className="h-[400px] w-full bg-slate-800 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-50">Settings</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-slate-800 border-slate-700 w-full justify-start">
          <TabsTrigger value="profile" className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-50">
            <Building2 className="mr-2 h-4 w-4" />Profile
          </TabsTrigger>
          <TabsTrigger value="work-types" className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-50">
            <Briefcase className="mr-2 h-4 w-4" />Work Types
          </TabsTrigger>
          <TabsTrigger value="invoicing" className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-50">
            <FileText className="mr-2 h-4 w-4" />Invoicing
          </TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-50">
            <CreditCard className="mr-2 h-4 w-4" />Billing
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-50">
            <Bell className="mr-2 h-4 w-4" />Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-50">Business Profile</CardTitle>
              <CardDescription className="text-slate-400">Your business details for invoices and communication</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(handleSaveProfile)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Business Name</Label>
                    <Input {...profileForm.register('business_name')} className="bg-slate-800 border-slate-700 text-slate-50" />
                    {profileForm.formState.errors.business_name && <p role="alert" className="text-sm text-red-500">{profileForm.formState.errors.business_name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Business Email</Label>
                    <Input {...profileForm.register('business_email')} type="email" className="bg-slate-800 border-slate-700 text-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Phone</Label>
                    <Input {...profileForm.register('business_phone')} className="bg-slate-800 border-slate-700 text-slate-50" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Business Address</Label>
                  <Textarea {...profileForm.register('business_address')} className="bg-slate-800 border-slate-700 text-slate-50 min-h-[80px]" />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={updateSettings.isPending} className="bg-violet-600 hover:bg-violet-700 text-white">
                    {updateSettings.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Profile
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="work-types">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-slate-50">Work Types</CardTitle>
                <CardDescription className="text-slate-400">Manage your service categories</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => setShowBulkImport(true)} size="sm" variant="outline" className="border-slate-700 text-slate-300">
                  Bulk Add
                </Button>
                <Button onClick={() => setShowAddWorkType(true)} size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {workTypes.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-8">No work types configured yet. Add one to get started.</p>
                )}
                {workTypes.map((wt) => (
                  <div key={wt.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-slate-500 cursor-grab" />
                      <span className={`text-sm font-medium ${wt.is_active ? 'text-slate-50' : 'text-slate-500'}`}>{wt.name}</span>
                      {!wt.is_active && <Badge variant="secondary" className="text-xs">Hidden</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={wt.is_active} onCheckedChange={() => handleToggleWorkType(wt.id, wt.is_active)} />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-50" onClick={() => setEditingWorkType({ id: wt.id, name: wt.name })} aria-label={`Edit ${wt.name}`}>
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-400" onClick={() => handleDeleteWorkType(wt.id)} aria-label={`Delete ${wt.name}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoicing">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-50">Invoice Settings</CardTitle>
              <CardDescription className="text-slate-400">Configure your invoice numbering</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={invoiceForm.handleSubmit(handleSaveInvoice)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Invoice Prefix</Label>
                    <Input {...invoiceForm.register('invoice_prefix')} className="bg-slate-800 border-slate-700 text-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Next Invoice Number</Label>
                    <Input {...invoiceForm.register('invoice_next_number')} type="number" className="bg-slate-800 border-slate-700 text-slate-50" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={updateSettings.isPending} className="bg-violet-600 hover:bg-violet-700 text-white">
                    {updateSettings.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Invoice Settings
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-50">Billing & Payments</CardTitle>
              <CardDescription className="text-slate-400">Payment preferences (coming soon)</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">Payment gateway integration and default payment terms will be available here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsTab settings={settings} />
        </TabsContent>
      </Tabs>

      {/* Add Work Type Dialog */}
      <Dialog open={showAddWorkType} onOpenChange={setShowAddWorkType}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-50">Add Work Type</DialogTitle>
          </DialogHeader>
          <Input value={newWorkType} onChange={(e) => setNewWorkType(e.target.value)} placeholder="e.g. Instagram Reel, YouTube Video" className="bg-slate-800 border-slate-700 text-slate-50" onKeyDown={(e) => e.key === 'Enter' && handleAddWorkType()} aria-label="New work type name" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddWorkType(false)} className="border-slate-700 text-slate-300">Cancel</Button>
            <Button onClick={handleAddWorkType} disabled={!newWorkType.trim()} className="bg-violet-600 hover:bg-violet-700 text-white">Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Work Type Dialog */}
      <Dialog open={!!editingWorkType} onOpenChange={() => setEditingWorkType(null)}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-50">Edit Work Type</DialogTitle>
          </DialogHeader>
          <Input value={editingWorkType?.name ?? ''} onChange={(e) => setEditingWorkType(prev => prev ? { ...prev, name: e.target.value } : null)} className="bg-slate-800 border-slate-700 text-slate-50" onKeyDown={(e) => e.key === 'Enter' && handleUpdateWorkType()} aria-label="Edit work type name" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingWorkType(null)} className="border-slate-700 text-slate-300">Cancel</Button>
            <Button onClick={handleUpdateWorkType} className="bg-violet-600 hover:bg-violet-700 text-white">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Work Types Dialog */}
      <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-50">Bulk Add Work Types</DialogTitle>
            <CardDescription className="text-slate-400">Separate each work type with a comma or new line</CardDescription>
          </DialogHeader>
          <Textarea
            value={bulkImportText}
            onChange={(e) => setBulkImportText(e.target.value)}
            placeholder={"Instagram Reel, YouTube Video, Blog Post\nSocial Media Post, Email Newsletter"}
            className="bg-slate-800 border-slate-700 text-slate-50 min-h-[150px]"
            aria-label="Bulk work types input"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowBulkImport(false); setBulkImportText('') }} className="border-slate-700 text-slate-300">Cancel</Button>
            <Button onClick={handleBulkImport} disabled={!bulkImportText.trim()} className="bg-violet-600 hover:bg-violet-700 text-white">
              {addWorkType.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Add All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NotificationsTab({ settings }: { settings: any }) {
  const updateNotificationSettings = useUpdateNotificationSettings()
  const { data: subscriptions = [] } = usePushSubscriptions()
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null)

  useEffect(() => {
    if (isPushSupported()) {
      getCurrentPushSubscription().then(sub => {
        setCurrentEndpoint(sub?.endpoint ?? null)
      })
    }
  }, [])

  const notificationsEnabled = settings?.notifications_enabled ?? true
  const notify24h = settings?.notify_24h_before ?? true
  const notifyOverdue = settings?.notify_overdue ?? true

  const handleToggleMaster = async (checked: boolean) => {
    await updateNotificationSettings.mutateAsync({ notifications_enabled: checked })
    toast.success(checked ? 'Notifications enabled' : 'Notifications disabled')
  }

  const handleToggle24h = async (checked: boolean) => {
    await updateNotificationSettings.mutateAsync({ notify_24h_before: checked })
  }

  const handleToggleOverdue = async (checked: boolean) => {
    await updateNotificationSettings.mutateAsync({ notify_overdue: checked })
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Browser Permission */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-50">Browser Notifications</CardTitle>
          <CardDescription className="text-slate-400">Configure push notification delivery to this browser</CardDescription>
        </CardHeader>
        <CardContent>
          <EnableNotifications />
        </CardContent>
      </Card>

      {/* Section 2: Notification Preferences */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-50">Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-200">Enable Notifications</p>
              <p className="text-xs text-slate-400">Master switch for all push notifications</p>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={handleToggleMaster}
              disabled={updateNotificationSettings.isPending}
            />
          </div>
          <Separator className="bg-slate-700" />
          <div className={`flex items-center justify-between ${!notificationsEnabled ? 'opacity-50' : ''}`}>
            <div>
              <p className="text-sm font-medium text-slate-200">24h Deadline Reminders</p>
              <p className="text-xs text-slate-400">Get notified 24 hours before each deadline</p>
            </div>
            <Switch
              checked={notify24h}
              onCheckedChange={handleToggle24h}
              disabled={!notificationsEnabled || updateNotificationSettings.isPending}
            />
          </div>
          <Separator className="bg-slate-700" />
          <div className={`flex items-center justify-between ${!notificationsEnabled ? 'opacity-50' : ''}`}>
            <div>
              <p className="text-sm font-medium text-slate-200">Overdue Task Alerts</p>
              <p className="text-xs text-slate-400">Get alerts for past-due tasks</p>
            </div>
            <Switch
              checked={notifyOverdue}
              onCheckedChange={handleToggleOverdue}
              disabled={!notificationsEnabled || updateNotificationSettings.isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Registered Devices */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-50">Registered Devices</CardTitle>
          <CardDescription className="text-slate-400">{subscriptions.length} device(s) registered for push notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <DeviceList subscriptions={subscriptions} currentEndpoint={currentEndpoint} />
        </CardContent>
      </Card>

      {/* iOS PWA Instructions */}
      {typeof navigator !== 'undefined' && /iPhone|iPad/.test(navigator.userAgent) && !isPushSupported() && (
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-50">iOS Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400">
              Push notifications on iPhone/iPad require CreatorOS to be installed as an app:
            </p>
            <ol className="text-sm text-slate-400 mt-2 space-y-1 list-decimal list-inside">
              <li>Open CreatorOS in Safari</li>
              <li>Tap the Share button (□↑)</li>
              <li>Tap &quot;Add to Home Screen&quot;</li>
              <li>Open CreatorOS from your home screen</li>
              <li>Enable notifications here</li>
            </ol>
            <p className="text-xs text-slate-500 mt-2">iOS 16.4 or later required.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
