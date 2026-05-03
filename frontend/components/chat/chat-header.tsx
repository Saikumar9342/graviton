'use client'

import { Menu, Sun, Moon, Sparkles, Cpu, Zap, Code2, BrainCircuit, Settings as SettingsIcon } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  availableModels,
}: ChatHeaderProps) {
  const { theme, setTheme } = useTheme()

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Coding': return <Code2 className="h-3 w-3" />
      case 'Reasoning': return <BrainCircuit className="h-3 w-3" />
      case 'Fast': return <Zap className="h-3 w-3" />
      default: return <Cpu className="h-3 w-3" />
    }
  }

  return (
    <header className="flex h-12 items-center justify-between border-b border-border/40 bg-background/60 backdrop-blur-xl px-4 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-8 w-8 md:hidden text-muted-foreground hover:text-foreground hover:bg-muted/10 rounded-lg"
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>

        {/* Logo group */}
        <div className={cn(
          'flex items-center gap-2 transition-all duration-500 ease-out',
          !isSidebarCollapsed && 'md:opacity-0 md:pointer-events-none md:-translate-x-2'
        )}>
        
           <span className="text-md font-bold tracking-tight text-foreground/80">Graviton</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {/* Model Switcher */}
  

        <div className="h-4 w-px bg-border/20" />

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/10 rounded-lg"
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </Button>

          <SettingsDialog
            settings={settings}
            onSave={onSaveSettings}
            session={session}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/10 rounded-lg"
            >
              <SettingsIcon className="h-3.5 w-3.5" />
            </Button>
          </SettingsDialog>
        </div>
      </div>
    </header>
  )
}
