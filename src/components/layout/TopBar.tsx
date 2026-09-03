'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User, Settings, LogOut, Search, Sun, Moon, Monitor } from 'lucide-react'
import Link from 'next/link'
import { useSearch } from '@/components/search/SearchContext'
import { useTheme } from '@/components/providers/ThemeProvider'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard', '/calendar': 'Calendar', '/clients': 'Clients',
  '/work': 'Work', '/billing': 'Billing', '/invoices': 'Invoices',
  '/notifications': 'Notifications', '/settings': 'Settings',
}

interface TopBarProps { user: { email?: string; id: string } }

export function TopBar({ user }: TopBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { open: openSearch } = useSearch()
  const { theme, setTheme } = useTheme()
  const title = pageTitles[pathname] || 'CreatorOS'

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const initials = user.email ? user.email.substring(0, 2).toUpperCase() : 'CO'

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 md:px-6 bg-slate-950/80 backdrop-blur-sm border-b border-slate-800">
      <h1 className="text-lg font-semibold text-slate-50">{title}</h1>
      <div className="flex items-center gap-2">
        <button
          onClick={openSearch}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-750 hover:text-slate-300 transition-colors w-56"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
          <span>Search...</span>
          <kbd className="ml-auto text-xs text-slate-500 bg-slate-700 px-1.5 py-0.5 rounded">⌘K</kbd>
        </button>
        <button onClick={openSearch} className="md:hidden p-2 text-slate-400 hover:text-slate-50" aria-label="Search">
          <Search className="h-5 w-5" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-full" aria-label="User menu">
              <Avatar className="h-8 w-8"><AvatarFallback className="bg-violet-600 text-white text-xs">{initials}</AvatarFallback></Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-slate-700">
            <div className="px-3 py-2 text-xs text-slate-500">{user.email}</div>
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem
              onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
              className="text-slate-300 focus:bg-slate-700 focus:text-slate-50 cursor-pointer"
            >
              {theme === 'dark' ? <Moon className="mr-2 h-4 w-4" /> : theme === 'light' ? <Sun className="mr-2 h-4 w-4" /> : <Monitor className="mr-2 h-4 w-4" />}
              Theme: {theme.charAt(0).toUpperCase() + theme.slice(1)}
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="text-slate-300 focus:bg-slate-700 focus:text-slate-50"><Link href="/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link></DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-400 focus:bg-red-500/20 focus:text-red-400"><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
