'use client'

import { Menu, Sun, Moon, Settings as SettingsIcon } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import { SettingsDialog, SessionStats } from './settings-dialog'
import { Settings } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ChatHeaderProps {
  onToggleSidebar: () => void
  isSidebarCollapsed?: boolean
  settings: Settings
  onSaveSettings: (settings: Settings) => void
  session?: SessionStats
  availableModels: { id: string; name: string; provider: string; badge?: string; category: string }[]
}

export function ChatHeader({
  onToggleSidebar,
  isSidebarCollapsed = false,
  settings,
  onSaveSettings,
  session,
}: ChatHeaderProps) {
  const { theme, setTheme } = useTheme()

  return (
    <header
      className="flex h-11 items-center justify-between px-5 sticky top-0 z-40 shrink-0"
      style={{
        borderBottom: '1px solid var(--ed-rule)',
        background: 'var(--ed-paper-2)',
      }}
    >
      {/* Left — mobile toggle + wordmark */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-7 w-7 md:hidden text-muted-foreground hover:text-foreground"
        >
          <Menu className="h-3.5 w-3.5" />
        </Button>

        <div className={cn(
          'flex items-baseline gap-1.5 transition-all duration-300',
          !isSidebarCollapsed && 'md:opacity-0 md:pointer-events-none',
        )}>
          <span
            className="ed-display"
            style={{ fontSize: 17, color: 'var(--foreground)', letterSpacing: '-0.03em' }}
          >
            Graviton
          </span>
          <span className="ed-mono" style={{ fontSize: 9, color: 'var(--ed-ink-4)' }}>™</span>
        </div>
      </div>

      {/* Right — controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          style={{ border: '1px solid var(--ed-rule)', background: 'transparent' }}
        >
          {theme === 'dark' ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
        </Button>

        <SettingsDialog settings={settings} onSave={onSaveSettings} session={session}>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            style={{ border: '1px solid var(--ed-rule)', background: 'transparent' }}
          >
            <SettingsIcon className="h-3 w-3" />
          </Button>
        </SettingsDialog>
      </div>
    </header>
  )
}
