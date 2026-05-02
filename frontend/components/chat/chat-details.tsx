'use client'

import { useState } from 'react'
import { 
  Info, 
  ChevronRight, 
  ChevronLeft, 
  Cpu, 
  Clock, 
  Zap, 
  Shield, 
  Database,
  BarChart3,
  Network,
  Lock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ChatDetailsProps {
  model?: string
  tokens?: number
  latency?: string
  isCollapsed: boolean
  onToggle: () => void
}

export function ChatDetails({
  model = 'Llama 3.1 70B',
  tokens = 0,
  latency = '124ms',
  isCollapsed,
  onToggle
}: ChatDetailsProps) {
  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-l border-border/10 bg-background/60 backdrop-blur-3xl transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
        isCollapsed ? 'w-[50px]' : 'w-[300px]'
      )}
    >
      <div className="flex h-14 items-center justify-between px-4 border-b border-border/5">
        {!isCollapsed && (
          <div className="flex items-center gap-2 animate-in fade-in duration-700">
            <Info className="h-4 w-4 text-primary" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground/80">
              Telemetry
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn(
            "h-8 w-8 rounded-lg hover:bg-primary/5 text-muted-foreground/40 hover:text-primary transition-all duration-500",
            isCollapsed && "mx-auto"
          )}
        >
          {isCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      {!isCollapsed ? (
        <ScrollArea className="flex-1">
          <div className="p-5 space-y-6">
            {/* Model Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Active Unit</span>
                <div className="flex items-center gap-1.5">
                  <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary/60">Optimized</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-border/10 space-y-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 h-10 w-10 bg-primary/5 rounded-bl-[2rem] -mr-4 -mt-4 transition-all group-hover:bg-primary/10" />
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-xl group-hover:border-primary/40 transition-colors">
                    <Cpu className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-black uppercase tracking-tight leading-none mb-1">{model}</span>
                    <Badge variant="outline" className="text-[7px] h-3.5 border-none bg-primary/5 text-primary/60 uppercase font-black px-1.5">v3.2.1 Stable</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/30 block mb-0.5">Latency</span>
                    <span className="text-[10px] font-bold text-foreground/80">{latency}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/30 block mb-0.5">Context</span>
                    <span className="text-[10px] font-bold text-foreground/80">128K</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Neural Diagnostics */}
            <div className="space-y-3">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Neural Diagnostics</span>
              <div className="space-y-4 p-4 rounded-xl bg-muted/5 border border-border/5">
                {[
                  { label: 'Attention Density', value: 78, color: 'bg-primary' },
                  { label: 'Latent Precision', value: 92, color: 'bg-blue-500' },
                  { label: 'Compute Velocity', value: 45, color: 'bg-emerald-500' },
                ].map((stat, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                      <span className="text-muted-foreground/50">{stat.label}</span>
                      <span className="text-foreground/60">{stat.value}%</span>
                    </div>
                    <div className="h-1 w-full bg-muted/20 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full transition-all duration-1000", stat.color)} 
                        style={{ width: `${stat.value}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Protocol Stack */}
            <div className="space-y-3">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Security Matrix</span>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { icon: Shield, label: 'Quantum Shield', status: 'Active', color: 'text-emerald-500' },
                  { icon: Lock, label: 'End-to-End Encryption', status: 'Verified', color: 'text-emerald-500' },
                  { icon: Network, label: 'Neural VPN', status: 'Live', color: 'text-blue-500' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-black/20 border border-border/5 group hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-3">
                      <item.icon className="h-3 w-3 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={cn("h-1 w-1 rounded-full", item.color === 'text-emerald-500' ? 'bg-emerald-500' : 'bg-blue-500')} />
                      <span className={cn("text-[8px] font-black uppercase", item.color)}>{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Session Analytics */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <BarChart3 className="h-12 w-12 text-primary rotate-12" />
              </div>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-3.5 w-3.5 text-primary" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Session Intel</span>
              </div>
              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="flex flex-col">
                  <span className="text-[20px] font-black tracking-tighter text-foreground/90">{tokens}</span>
                  <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/40">~Tokens (est.)</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[20px] font-black tracking-tighter text-primary">0.002<span className="text-[10px] ml-0.5">$</span></span>
                  <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/40">Est. Usage</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      ) : (
        <div className="flex-1 flex flex-col items-center py-6 gap-6 opacity-20">
          <Cpu className="h-4 w-4" />
          <Activity className="h-4 w-4 animate-pulse text-emerald-500" />
          <BarChart3 className="h-4 w-4" />
          <Shield className="h-4 w-4" />
        </div>
      )}
    </aside>
  )
}

function Activity({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}
