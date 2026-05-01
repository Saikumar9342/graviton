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
    <header className="flex h-18 items-center justify-between border-b border-white/5 bg-background/20 backdrop-blur-3xl px-4 sm:px-8 sticky top-0 z-40 transition-all duration-500">
      <div className="flex items-center gap-4 sm:gap-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-11 w-11 md:hidden hover:bg-primary/10 rounded-2xl transition-all duration-500 hover:scale-110 active:scale-90 border border-transparent hover:border-primary/20 shadow-none hover:shadow-lg hover:shadow-primary/10"
        >
          <Menu className="h-5.5 w-5.5 text-primary" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>

        <div className={cn(
          "flex items-center gap-3.5 group cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
          !isSidebarCollapsed && "md:opacity-0 md:pointer-events-none md:-translate-x-4"
        )}>
          <div className="relative h-11 w-11 rounded-[18px] bg-primary shadow-2xl shadow-primary/20 flex items-center justify-center transition-all duration-700 group-hover:rotate-[15deg] group-hover:scale-115 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Sparkles className="h-6 w-6 text-primary-foreground relative z-10" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-foreground leading-none">
              Graviton
            </span>
            <span className="text-[9px] font-medium text-primary/70 tracking-[0.2em] uppercase mt-1">
              Interface v2
            </span>
          </div>
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
