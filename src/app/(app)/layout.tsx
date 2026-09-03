import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { SearchProvider } from '@/components/search/SearchContext'
import { GlobalSearch } from '@/components/search/GlobalSearch'
import { Toaster } from '@/components/ui/sonner'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'
import { QuickAddFAB } from '@/components/layout/QuickAddFAB'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let user: any = null

  try {
    const supabase = await createClient()
    const { data: { user: u } } = await supabase.auth.getUser()
    user = u
  } catch {
    redirect('/auth/login')
  }

  if (!user) { redirect('/auth/login') }

  return (
    <ThemeProvider>
      <QueryProvider>
        <SearchProvider>
          <div className="flex min-h-screen bg-slate-950 dark:bg-slate-950 light:bg-white">
            <Sidebar user={user} />
            <div className="flex-1 flex flex-col md:ml-64">
              <TopBar user={user} />
              <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">{children}</main>
            </div>
            <BottomNav />
            <QuickAddFAB />
          </div>
          <GlobalSearch />
          <InstallPrompt />
          <Toaster />
        </SearchProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}
