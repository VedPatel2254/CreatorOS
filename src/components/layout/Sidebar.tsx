'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Calendar, Users, CheckSquare, DollarSign, FileText, Bell, Settings, LogOut, User } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useActiveClientCount } from '@/hooks/useClients'
import { useTaskStats } from '@/hooks/useTasks'
import { useUnpaidTotal } from '@/hooks/useBilling'
import { useInvoiceStats } from '@/hooks/useInvoices'
import { useUnreadNotificationCount } from '@/hooks/useNotifications'
import { useSettings } from '@/hooks/useSettings'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Clients', href: '/clients', icon: Users, showCount: true, countType: 'clients' as const },
  { name: 'Work', href: '/work', icon: CheckSquare, showCount: true, countType: 'work' as const },
  { name: 'Billing', href: '/billing', icon: DollarSign },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
]

interface SidebarProps { user: { email?: string; id: string } }

function formatBadgeAmount(amount: number, symbol: string): string {
  if (amount >= 100000) return `${symbol}${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000) return `${symbol}${(amount / 1000).toFixed(0)}K`
  return `${symbol}${amount.toFixed(0)}`
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { data: clientCount } = useActiveClientCount()
  const { data: taskStats } = useTaskStats()
  const { data: unpaidData } = useUnpaidTotal()
  const { data: invoiceStats } = useInvoiceStats()
  const { data: notificationCount } = useUnreadNotificationCount()
  const { data: settings } = useSettings()

  const unpaidTotal = unpaidData?.total ?? 0
  const currencySymbol = settings?.currency_symbol ?? '₹'

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const initials = user.email ? user.email.substring(0, 2).toUpperCase() : 'CO'

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-slate-900 border-r border-slate-700">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-slate-700">
          <h1 className="text-xl font-bold text-slate-50">CreatorOS</h1>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            let count = 0
            if (item.countType === 'clients' && clientCount) count = clientCount
            if (item.countType === 'work' && taskStats) count = (taskStats.in_progress || 0) + (taskStats.ready || 0)
            return (
              <Link key={item.name} href={item.href} className={cn('flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors', isActive ? 'bg-violet-600/20 text-violet-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-50')}>
                <item.icon className={cn('mr-3 h-5 w-5 flex-shrink-0', isActive ? 'text-violet-400' : 'text-slate-400')} />
                {item.name}
                {count > 0 && <span className="ml-auto text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{count}</span>}
                {item.name === 'Billing' && unpaidTotal > 0 && (
                  <span className="ml-auto text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
                    {formatBadgeAmount(unpaidTotal, currencySymbol)}
                  </span>
                )}
                {item.name === 'Invoices' && invoiceStats && (invoiceStats.overdue ?? 0) > 0 && (
                  <span className="ml-auto text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                    {invoiceStats.overdue}
                  </span>
                )}
                {item.name === 'Notifications' && notificationCount && notificationCount > 0 && (
                  <span className="ml-auto text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-full">
                    {notificationCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
        <div className="flex-shrink-0 p-3 border-t border-slate-700">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-50 transition-colors">
                <Avatar className="h-8 w-8 mr-3"><AvatarFallback className="bg-violet-600 text-white text-xs">{initials}</AvatarFallback></Avatar>
                <span className="truncate">{user.email}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-slate-800 border-slate-700">
              <DropdownMenuItem className="text-slate-300 focus:bg-slate-700 focus:text-slate-50"><User className="mr-2 h-4 w-4" />Profile</DropdownMenuItem>
              <DropdownMenuItem asChild className="text-slate-300 focus:bg-slate-700 focus:text-slate-50"><Link href="/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link></DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-400 focus:bg-red-500/20 focus:text-red-400"><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  )
}
