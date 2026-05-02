'use client'

import { Menu, Sun, Moon, Sparkles } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import { SettingsDialog } from './settings-dialog'
import { Settings } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ChatHeaderProps {
  onToggleSidebar: () => void
  isSidebarCollapsed?: boolean
  settings: Settings
  onSaveSettings: (settings: Settings) => void
}

export function ChatHeader({
  onToggleSidebar,
  isSidebarCollapsed = false,
  settings,
  onSaveSettings,
}: ChatHeaderProps) {
  const { theme, setTheme } = useTheme()

  return (
    <header className="flex h-14 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-8 w-8 md:hidden text-muted-foreground hover:text-foreground"
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>

        {/* Logo — visible only when sidebar is collapsed on desktop */}
        <div className={cn(
          'flex items-center gap-2.5 transition-all duration-500',
          !isSidebarCollapsed && 'md:opacity-0 md:pointer-events-none md:-translate-x-3'
        )}>
         
          <span className="text-sm font-semibold text-foreground">Graviton</span>
        </div>
      </div>

      {/* Current model pill */}
      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/40 border border-border/50 text-xs text-muted-foreground font-medium">
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
        {settings.model}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-primary" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        <SettingsDialog settings={settings} onSave={onSaveSettings} />
      </div>
    </header>
  )
}
