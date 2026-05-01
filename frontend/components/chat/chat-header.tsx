'use client'

import { Menu, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { SettingsDialog } from './settings-dialog'
import { Settings } from '@/lib/types'

interface ChatHeaderProps {
  onToggleSidebar: () => void
  settings: Settings
  onSaveSettings: (settings: Settings) => void
}

export function ChatHeader({
  onToggleSidebar,
  settings,
  onSaveSettings,
}: ChatHeaderProps) {
  const { theme, setTheme } = useTheme()

  return (
    <header className="flex h-14 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-9 w-9 hover:bg-accent hover-lift"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>

        <span className="text-lg font-bold tracking-tight text-foreground">
          Graviton AI
        </span>
      </div>

      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-9 w-9 hover:bg-accent hover-lift"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Settings */}
        <SettingsDialog settings={settings} onSave={onSaveSettings} />
      </div>
    </header>
  )
}
