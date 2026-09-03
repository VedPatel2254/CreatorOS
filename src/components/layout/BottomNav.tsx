'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LayoutDashboard, Calendar, CheckSquare, Users, MoreHorizontal, DollarSign, FileText, Bell, Settings } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const mainNav = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Work', href: '/work', icon: CheckSquare },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
]
const moreNav = [
  { name: 'Billing', href: '/billing', icon: DollarSign },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <nav className="flex items-center justify-around h-16">
        {mainNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.name} href={item.href} className={cn('flex flex-col items-center justify-center min-w-[64px] py-2 px-1 text-xs font-medium transition-colors active:opacity-70', isActive ? 'text-violet-400' : 'text-slate-400 hover:text-slate-50')}>
              <item.icon className={cn('h-5 w-5 mb-1', isActive ? 'text-violet-400' : 'text-slate-400')} />
              {item.name}
            </Link>
          )
        })}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className={cn('flex flex-col items-center justify-center min-w-[64px] py-2 px-1 text-xs font-medium transition-colors active:opacity-70', moreNav.some((item) => pathname === item.href || pathname.startsWith(item.href + '/')) ? 'text-violet-400' : 'text-slate-400 hover:text-slate-50')} aria-label="More options">
              <MoreHorizontal className="h-5 w-5 mb-1" />More
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-slate-900 border-slate-700 rounded-t-xl pb-8">
            <SheetHeader><SheetTitle className="text-slate-50">More Options</SheetTitle></SheetHeader>
            <nav className="grid gap-2 py-4">
              {moreNav.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link key={item.name} href={item.href} onClick={() => setIsOpen(false)} className={cn('flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-colors min-h-[44px]', isActive ? 'bg-violet-600/20 text-violet-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-50')}>
                    <item.icon className={cn('h-5 w-5', isActive ? 'text-violet-400' : 'text-slate-400')} />{item.name}
                  </Link>
                )
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  )
}
