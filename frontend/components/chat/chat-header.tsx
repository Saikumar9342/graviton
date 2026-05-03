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
           <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
           </div>
           <span className="text-xs font-bold tracking-tight text-foreground/80">Graviton</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {/* Model Switcher */}
        <Select
          value={settings.model}
          onValueChange={(val) => onSaveSettings({ ...settings, model: val })}
        >
          <SelectTrigger className="h-8 w-auto min-w-[140px] bg-muted/5 border-border/20 text-[10px] uppercase tracking-wider font-bold gap-2 px-3 rounded-lg hover:bg-muted/10 transition-all shadow-none ring-0 focus:ring-0">
            <div className="flex items-center gap-2">
              <div className="h-1.2 w-1.2 rounded-full bg-emerald-500/80" />
              <SelectValue placeholder="Model" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-background border-border/40 rounded-xl min-w-[240px] p-1 shadow-xl">
             {['General', 'Coding', 'Reasoning', 'Fast'].map((cat) => {
               const modelsInCat = availableModels.filter(m => m.category === cat)
               if (modelsInCat.length === 0) return null
               return (
                 <SelectGroup key={cat} className="mb-1 last:mb-0">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-[8px] uppercase tracking-[0.15em] font-bold text-muted-foreground/40">
                       {getCategoryIcon(cat)}
                       {cat}
                    </div>
                    {modelsInCat.map((m) => (
                      <SelectItem 
                        key={m.id} 
                        value={m.id}
                        className="text-[12px] py-2 px-2.5 focus:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between w-full gap-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground/90">{m.name}</span>
                            <span className="text-[9px] opacity-30 uppercase tracking-wide font-normal">{m.provider}</span>
                          </div>
                          {m.badge && (
                            <span className="text-[7px] px-1.5 py-0.25 rounded bg-muted text-muted-foreground border border-border/50 font-bold uppercase tracking-tight">
                              {m.badge}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                 </SelectGroup>
               )
             })}
          </SelectContent>
        </Select>

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
