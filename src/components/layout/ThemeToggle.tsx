'use client'

import { useTheme } from '@/components/providers/ThemeProvider'
import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const cycle = () => {
    if (theme === 'dark') setTheme('light')
    else if (theme === 'light') setTheme('system')
    else setTheme('dark')
  }

  const icons = { dark: Moon, light: Sun, system: Monitor }
  const labels = { dark: 'Dark mode', light: 'Light mode', system: 'System theme' }
  const Icon = icons[theme]

  return (
    <Button variant="ghost" size="icon" onClick={cycle} aria-label={labels[theme]} className="text-slate-400 hover:text-slate-50">
      <Icon className="h-5 w-5" />
    </Button>
  )
}
