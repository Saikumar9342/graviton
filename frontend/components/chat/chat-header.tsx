'use client'

import { Menu, Sun, Moon, Sparkles } from 'lucide-react'
import { useTheme } from 'next-themes'
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
    <header className="flex h-16 items-center justify-between border-b border-border/40 bg-background/60 backdrop-blur-3xl px-4 sm:px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-10 w-10 md:hidden hover:bg-primary/5 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95"
        >
          <Menu className="h-5 w-5 text-primary" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>

        <div className={cn(
          "flex items-center gap-2 group cursor-pointer transition-all duration-500",
          !isSidebarCollapsed && "md:opacity-0 md:pointer-events-none"
        )}>
          <div className="h-9 w-9 rounded-xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center transition-all duration-500 group-hover:rotate-12 group-hover:scale-110">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-black tracking-tighter text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
            GRAVITON
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-2xl border border-border/20 shadow-inner">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-9 w-9 rounded-xl hover:bg-background/80 hover:shadow-sm transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <Sun className="h-4.5 w-4.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
            <Moon className="absolute h-4.5 w-4.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-primary" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Settings */}
          <SettingsDialog settings={settings} onSave={onSaveSettings} />
        </div>
      </div>
    </header>
  )
}
