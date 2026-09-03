'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useSettings } from '@/hooks/useSettings'
import { useTasksDueToday, useTasksDueThisWeek, useOverdueTasks, useTaskStats } from '@/hooks/useTasks'
import { useBillingSummaryForDashboard } from '@/hooks/useBilling'
import { useActiveClientCount } from '@/hooks/useClients'
import { useInvoiceStats, useRecentInvoices } from '@/hooks/useInvoices'
import { useRecentActivity } from '@/hooks/useActivityLog'
import { useUnreadNotificationCount } from '@/hooks/useNotifications'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { QuickStatsRow } from '@/components/dashboard/QuickStatsRow'
import { TodayDeliveries } from '@/components/dashboard/TodayDeliveries'
import { OverdueTasks } from '@/components/dashboard/OverdueTasks'
import { UpcomingTasks } from '@/components/dashboard/UpcomingTasks'
import { BillingSummaryCards } from '@/components/dashboard/BillingSummaryCards'
import { RecentInvoices } from '@/components/dashboard/RecentInvoices'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist'
import { DashboardSection } from '@/components/dashboard/DashboardSection'
import { TaskSheet } from '@/components/tasks/TaskSheet'
import { ClientSheet } from '@/components/clients/ClientSheet'

export default function DashboardPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: settings } = useSettings()
  const { data: tasksDueToday = [], isLoading: todayLoading } = useTasksDueToday()
  const { data: tasksUpcoming = [], isLoading: upcomingLoading } = useTasksDueThisWeek()
  const { data: tasksOverdue = [], isLoading: overdueLoading } = useOverdueTasks()
  const billingResult = useBillingSummaryForDashboard()
  const { data: activeClientCount } = useActiveClientCount()
  const { data: taskStats } = useTaskStats()
  const { data: invoiceStats } = useInvoiceStats()
  const { data: recentInvoices = [], isLoading: invoicesLoading } = useRecentInvoices(5)
  const { data: recentActivity = [], isLoading: activityLoading } = useRecentActivity(15)

  const currencySymbol = settings?.currency_symbol ?? '₹'
  const timezone = settings?.timezone ?? 'Asia/Kolkata'
  const billingSummary = billingResult
  const billingLoading = billingResult.isLoading

  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [taskSheetOpen, setTaskSheetOpen] = useState(false)
  const [clientSheetOpen, setClientSheetOpen] = useState(false)

  useEffect(() => {
    if (!todayLoading && !upcomingLoading && !overdueLoading && !billingLoading) {
      setLastUpdated(new Date())
    }
  }, [todayLoading, upcomingLoading, overdueLoading, billingLoading])

  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['tasks-due-today'] })
      queryClient.invalidateQueries({ queryKey: ['tasks-due-this-week'] })
      queryClient.invalidateQueries({ queryKey: ['tasks-overdue'] })
      queryClient.invalidateQueries({ queryKey: ['billing'] })
      queryClient.invalidateQueries({ queryKey: ['invoices-recent'] })
      queryClient.invalidateQueries({ queryKey: ['activity-log'] })
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [queryClient])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as Element)?.tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return
      if (e.metaKey || e.ctrlKey) return
      switch (e.key.toLowerCase()) {
        case 'n': setTaskSheetOpen(true); break
        case 'c': setClientSheetOpen(true); break
        case 'i': router.push('/invoices/new'); break
        case 'b': router.push('/billing'); break
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [router])

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['tasks-due-today'] })
    queryClient.invalidateQueries({ queryKey: ['tasks-due-this-week'] })
    queryClient.invalidateQueries({ queryKey: ['tasks-overdue'] })
    queryClient.invalidateQueries({ queryKey: ['billing'] })
    queryClient.invalidateQueries({ queryKey: ['invoices-recent'] })
    queryClient.invalidateQueries({ queryKey: ['activity-log'] })
    queryClient.invalidateQueries({ queryKey: ['task-stats'] })
    queryClient.invalidateQueries({ queryKey: ['invoice-stats'] })
  }, [queryClient])

  const isLoaded = !todayLoading && !upcomingLoading && !overdueLoading && !billingLoading
  const showOnboarding = isLoaded && (activeClientCount ?? 0) === 0 && tasksDueToday.length === 0 && recentInvoices.length === 0

  return (
    <div className="max-w-7xl mx-auto">
      <DashboardHeader
        businessName={settings?.business_name}
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
      />

      {showOnboarding && (
        <OnboardingChecklist
          hasClients={(activeClientCount ?? 0) > 0}
          hasTasks={tasksDueToday.length > 0 || (taskStats?.total ?? 0) > 0}
          hasInvoices={recentInvoices.length > 0}
          businessNameSet={!!settings?.business_name}
          onAddClient={() => setClientSheetOpen(true)}
          onAddTask={() => setTaskSheetOpen(true)}
        />
      )}

      {/* Mobile: stats row */}
      <div className="mb-6 md:hidden">
        <QuickStatsRow
          billingSummary={billingSummary}
          activeClientCount={activeClientCount}
          overdueCount={tasksOverdue.length}
          invoiceStats={invoiceStats ? { overdue: invoiceStats.overdue, totalOutstanding: invoiceStats.total_outstanding } : undefined}
          currencySymbol={currencySymbol}
          isLoading={billingLoading}
        />
      </div>

      {/* Desktop: 3-column layout */}
      <div className="hidden md:grid md:grid-cols-[1fr_1fr_320px] gap-6">
        {/* Column 1 */}
        <div>
          <DashboardSection title="Today's Deliveries" count={tasksDueToday.length}>
            <TodayDeliveries tasks={tasksDueToday} isLoading={todayLoading} timezone={timezone} />
          </DashboardSection>

          <OverdueTasks tasks={tasksOverdue} isLoading={overdueLoading} />

          <DashboardSection
            title="Upcoming (Next 7 Days)"
            count={tasksUpcoming.length}
            action={{ label: 'View Calendar', href: '/calendar' }}
            isEmpty={tasksUpcoming.length === 0 && !upcomingLoading}
            emptyState={
              <div className="text-center py-6">
                <p className="text-sm text-slate-400">No upcoming tasks in the next 7 days.</p>
              </div>
            }
          >
            <UpcomingTasks tasks={tasksUpcoming} isLoading={upcomingLoading} timezone={timezone} />
          </DashboardSection>
        </div>

        {/* Column 2 */}
        <div>
          <DashboardSection title="Billing Summary" action={{ label: 'View Full Billing', href: '/billing' }}>
            <BillingSummaryCards summary={billingSummary} currencySymbol={currencySymbol} isLoading={billingLoading} />
          </DashboardSection>

          <DashboardSection
            title="Recent Invoices"
            count={recentInvoices.length}
            action={{ label: 'View All', href: '/invoices' }}
            isEmpty={recentInvoices.length === 0 && !invoicesLoading}
            emptyState={
              <div className="text-center py-6">
                <p className="text-sm text-slate-400">No invoices yet.</p>
                <a href="/invoices/new" className="text-xs text-violet-400 hover:text-violet-300 mt-1 inline-block">
                  Generate your first invoice →
                </a>
              </div>
            }
          >
            <RecentInvoices invoices={recentInvoices} isLoading={invoicesLoading} currencySymbol={currencySymbol} />
          </DashboardSection>
        </div>

        {/* Column 3 */}
        <div>
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Quick Stats</h2>
            <QuickStatsRow
              billingSummary={billingSummary}
              activeClientCount={activeClientCount}
              overdueCount={tasksOverdue.length}
              invoiceStats={invoiceStats ? { overdue: invoiceStats.overdue, totalOutstanding: invoiceStats.total_outstanding } : undefined}
              currencySymbol={currencySymbol}
              isLoading={billingLoading}
            />
          </div>

          <DashboardSection title="Recent Activity">
            <ActivityFeed activities={recentActivity} isLoading={activityLoading} />
          </DashboardSection>
        </div>
      </div>

      {/* Mobile: stacked layout */}
      <div className="md:hidden space-y-6">
        <DashboardSection title="Today's Deliveries" count={tasksDueToday.length}>
          <TodayDeliveries tasks={tasksDueToday} isLoading={todayLoading} timezone={timezone} />
        </DashboardSection>

        <OverdueTasks tasks={tasksOverdue} isLoading={overdueLoading} />

        <DashboardSection title="Billing Summary">
          <BillingSummaryCards summary={billingSummary} currencySymbol={currencySymbol} isLoading={billingLoading} />
        </DashboardSection>

        <DashboardSection
          title="Upcoming (Next 7 Days)"
          count={tasksUpcoming.length}
          action={{ label: 'View Calendar', href: '/calendar' }}
          isEmpty={tasksUpcoming.length === 0 && !upcomingLoading}
          emptyState={
            <div className="text-center py-6">
              <p className="text-sm text-slate-400">No upcoming tasks in the next 7 days.</p>
            </div>
          }
        >
          <UpcomingTasks tasks={tasksUpcoming} isLoading={upcomingLoading} timezone={timezone} />
        </DashboardSection>

        <DashboardSection
          title="Recent Invoices"
          count={recentInvoices.length}
          action={{ label: 'View All', href: '/invoices' }}
          isEmpty={recentInvoices.length === 0 && !invoicesLoading}
          emptyState={
            <div className="text-center py-6">
              <p className="text-sm text-slate-400">No invoices yet.</p>
              <a href="/invoices/new" className="text-xs text-violet-400 hover:text-violet-300 mt-1 inline-block">
                Generate your first invoice →
              </a>
            </div>
          }
        >
          <RecentInvoices invoices={recentInvoices} isLoading={invoicesLoading} currencySymbol={currencySymbol} />
        </DashboardSection>

        <DashboardSection title="Recent Activity">
          <ActivityFeed activities={recentActivity} isLoading={activityLoading} />
        </DashboardSection>
      </div>

      <TaskSheet open={taskSheetOpen} onOpenChange={setTaskSheetOpen} />
      <ClientSheet open={clientSheetOpen} onOpenChange={setClientSheetOpen} />
    </div>
  )
}
