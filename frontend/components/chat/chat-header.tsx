'use client'

import { Menu, Sun, Moon, Sparkles, Activity, Wifi, Cpu, Database } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { SettingsDialog } from './settings-dialog'
import { Settings } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

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
    <header className="flex h-14 items-center justify-between border-b border-border/10 bg-background/60 backdrop-blur-3xl px-4 sm:px-6 sticky top-0 z-40 transition-all duration-500 overflow-hidden">
      <div className="absolute inset-0 bg-noise pointer-events-none opacity-20" />
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="flex items-center gap-4 sm:gap-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-9 w-9 md:hidden hover:bg-primary/10 rounded-xl transition-all duration-500 hover:scale-110 active:scale-90 border border-transparent hover:border-primary/20 shadow-none hover:shadow-lg hover:shadow-primary/10"
        >
          <Menu className="h-4.5 w-4.5 text-primary" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>

        <div className={cn(
          "flex items-center gap-3.5 group cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
          !isSidebarCollapsed && "md:opacity-0 md:pointer-events-none md:-translate-x-4"
        )}>
          <div className="relative h-7 w-7 rounded-lg bg-primary shadow-2xl shadow-primary/20 flex items-center justify-center transition-all duration-700 group-hover:rotate-[15deg] group-hover:scale-110 overflow-hidden eng-border border-primary/40">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Sparkles className="h-3.5 w-3.5 text-primary-foreground relative z-10" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-black tracking-tight text-foreground leading-none">
              GRAVITON
            </span>
            <span className="text-[7px] font-bold text-primary/70 tracking-[0.3em] uppercase mt-0.5">
              NEURAL INTERFACE
            </span>
          </div>
        </div>
      </div>

      {/* Center Tactical Readout */}
      <div className="hidden lg:flex items-center gap-6 px-5 py-1.5 rounded-full bg-muted/5 border border-border/10 glass-card">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none">Status</span>
            <span className="text-[9px] font-bold uppercase tracking-tighter leading-none mt-1">Operational</span>
          </div>
        </div>
        <Separator orientation="vertical" className="h-4 bg-border/20" />
        <div className="flex items-center gap-2 text-primary/60">
          <Cpu className="h-3 w-3" />
          <div className="flex flex-col">
            <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none">Compute</span>
            <span className="text-[9px] font-bold uppercase tracking-tighter leading-none mt-1 text-foreground">98.4 TFLOPS</span>
          </div>
        </div>
        <Separator orientation="vertical" className="h-4 bg-border/20" />
        <div className="flex items-center gap-2 text-blue-500/60">
          <Database className="h-3 w-3" />
          <div className="flex flex-col">
            <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none">Database</span>
            <span className="text-[9px] font-bold uppercase tracking-tighter leading-none mt-1 text-foreground">Synchronized</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg border border-border/10 bg-muted/20">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/20 blur-sm animate-pulse rounded-full" />
            <Wifi className="h-3.5 w-3.5 text-emerald-500 relative" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/70">Secure Uplink</span>
        </div>

        <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl border border-border/20 shadow-inner">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-8 w-8 rounded-lg hover:bg-background/80 hover:shadow-sm transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-primary" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <SettingsDialog settings={settings} onSave={onSaveSettings} />
        </div>
      </div>
    </header>
  )
}
