'use client'

import { Sparkles, Code, Brain, Zap, Terminal, Activity, Shield, Cpu, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  onSuggestionClick: (suggestion: string) => void
}

const suggestions = [
  {
    icon: Code,
    title: 'System Architecture',
    prompt: 'Design a high-performance, distributed backend architecture for a real-time analytics platform using Go and gRPC.',
    tag: 'ENG_ALPHA',
  },
  {
    icon: Brain,
    title: 'Neural Optimization',
    prompt: 'Analyze this React component tree for performance bottlenecks and suggest optimizations for rendering and state management.',
    tag: 'OPT_NODE',
  },
  {
    icon: Shield,
    title: 'Security Protocol',
    prompt: 'Perform a security audit of a standard Node.js authentication flow, identifying common vulnerabilities and mitigation strategies.',
    tag: 'SEC_LEVEL_4',
  },
]

export function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-12 animate-in fade-in zoom-in-95 duration-1000 relative overflow-hidden">
      {/* Central Diagnostic Hub */}
      <div className="relative mb-16">
        {/* Rotating Rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-primary/10 rounded-full animate-[spin_20s_linear_infinite]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-dashed border-primary/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-primary/5 rounded-full animate-[spin_30s_linear_infinite]" />
        
        {/* Core Icon */}
        <div className="relative flex h-32 w-32 items-center justify-center rounded-3xl bg-black border border-primary/30 shadow-[0_0_50px_-10px_rgba(var(--primary),0.3)] overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-50" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_70%)] opacity-10 animate-pulse" />
          <Sparkles className="h-12 w-12 text-primary relative z-10 filter drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
          
          {/* Scanning Effect */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-primary/50 blur-[1px] animate-scanline z-20" />
        </div>

        {/* Floating Technical Tags */}
        <div className="absolute -top-10 -right-20 flex flex-col items-end gap-1 opacity-40 hover:opacity-100 transition-opacity">
          <span className="text-[8px] font-black tracking-widest uppercase text-primary">Core_Status: Online</span>
          <div className="h-1 w-20 bg-primary/10 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-[85%] animate-pulse" />
          </div>
        </div>
        
        <div className="absolute -bottom-10 -left-20 flex flex-col items-start gap-1 opacity-40 hover:opacity-100 transition-opacity">
          <span className="text-[8px] font-black tracking-widest uppercase text-muted-foreground">Neural_Link: Established</span>
          <div className="flex gap-0.5">
            {[1,1,1,1,0,1,1].map((v, i) => (
              <div key={i} className={cn("h-2 w-1 rounded-[1px]", v ? "bg-primary/40" : "bg-primary/5")} />
            ))}
          </div>
        </div>
      </div>

      {/* Main Title Area */}
      <div className="text-center mb-16 space-y-4 max-w-2xl">
        <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm mb-4">
          <Activity className="h-3 w-3 text-primary animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">System Initialized</span>
        </div>
        
        <h1 className="text-4xl font-black tracking-[0.4em] uppercase text-foreground leading-tight">
          Graviton
        </h1>
        
        <p className="text-[12px] font-medium text-muted-foreground/60 tracking-wider max-w-lg mx-auto leading-relaxed">
          The next generation neural interface for high-frequency engineering, system architecture, and strategic deconstruction.
        </p>
      </div>

      {/* Structured Suggestion Area */}
      <div className="w-full max-w-3xl space-y-3">
        <div className="flex items-center gap-4 px-4 mb-4">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-border/20" />
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">Select Protocol</span>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-border/20" />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.title}
              onClick={() => onSuggestionClick(suggestion.prompt)}
              className={cn(
                'group relative flex flex-col p-4 text-left transition-all duration-500',
                'bg-black/20 border border-border/10 hover:border-primary/40 hover:bg-primary/5',
                'rounded-xl overflow-hidden'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-background border border-border/10 group-hover:scale-110 group-hover:border-primary/40 transition-all duration-500">
                  <suggestion.icon className="h-4 w-4 text-primary/60 group-hover:text-primary" />
                </div>
                <span className="text-[7px] font-black text-muted-foreground/20 uppercase tracking-widest group-hover:text-primary/40">
                  {suggestion.tag}
                </span>
              </div>
              <h3 className="text-[11px] font-black text-foreground/80 uppercase tracking-wider mb-2 group-hover:text-primary transition-colors">
                {suggestion.title}
              </h3>
              <div className="flex items-center gap-1 mt-auto opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-x-2 group-hover:translate-x-0">
                <span className="text-[8px] font-black text-primary uppercase tracking-tighter">Execute</span>
                <ChevronRight className="h-2 w-2 text-primary" />
              </div>
              
              {/* Corner Accents */}
              <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-100 transition-opacity">
                <div className="h-2 w-2 border-t border-r border-primary/40" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Hint */}
      <div className="mt-20 flex items-center gap-4 opacity-20 hover:opacity-100 transition-all duration-1000 group">
        <Terminal className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="text-[10px] font-mono tracking-wider text-muted-foreground/60">
          TYPE <span className="text-primary/60">/help</span> TO VIEW AVAILABLE SYSTEM COMMANDS
        </span>
      </div>
    </div>
  )
}