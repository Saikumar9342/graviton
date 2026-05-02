'use client'

import { Sparkles, Code2, FlaskConical, Pen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  onSuggestionClick: (suggestion: string) => void
}

const suggestions = [
  {
    icon: Code2,
    title: 'Code & Engineering',
    subtitle: 'Debug, architect, or review code',
    prompt: 'Design a high-performance distributed backend in Go with gRPC — explain the architecture, trade-offs, and key patterns.',
    accent: 'group-hover:text-violet-400',
    glow: 'group-hover:bg-violet-500/10 group-hover:border-violet-500/25',
  },
  {
    icon: FlaskConical,
    title: 'Research & Analysis',
    subtitle: 'Break down complex topics clearly',
    prompt: 'Analyze the trade-offs between micro-frontend architectures and monolithic frontends for large-scale web applications.',
    accent: 'group-hover:text-blue-400',
    glow: 'group-hover:bg-blue-500/10 group-hover:border-blue-500/25',
  },
  {
    icon: Pen,
    title: 'Writing & Strategy',
    subtitle: 'Draft, edit, or brainstorm ideas',
    prompt: 'Help me write a compelling technical proposal to migrate our monolithic app to microservices for a senior engineering audience.',
    accent: 'group-hover:text-emerald-400',
    glow: 'group-hover:bg-emerald-500/10 group-hover:border-emerald-500/25',
  },
]

export function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-12 animate-in fade-in duration-700">
      {/* Logo mark */}
      <div className="mb-8 relative animate-float">
        <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl shadow-primary/25 ring-1 ring-white/10">
          <Sparkles className="h-7 w-7 text-white drop-shadow-sm" />
        </div>
        <div className="absolute -inset-4 rounded-[2rem] bg-primary/8 blur-2xl -z-10 animate-pulse-ring" />
      </div>

      {/* Heading */}
      <div className="text-center mb-10 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100">
        <h1
          className="text-3xl sm:text-4xl font-bold text-foreground"
          style={{ letterSpacing: '-0.03em', textTransform: 'none', fontWeight: 700 }}
        >
          How can I help you?
        </h1>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Ask anything — code, research, writing, or just a good conversation.
        </p>
      </div>

      {/* Suggestion cards */}
      <div className="w-full max-w-2xl grid gap-3 sm:grid-cols-3 animate-in fade-in slide-in-from-bottom-3 duration-700 delay-200">
        {suggestions.map((s) => (
          <button
            key={s.title}
            onClick={() => onSuggestionClick(s.prompt)}
            className={cn(
              'group relative flex flex-col p-4 text-left rounded-2xl transition-all duration-300',
              'bg-card/60 border border-border/60',
              'hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20',
              s.glow
            )}
          >
            <div className={cn(
              'mb-3 h-8 w-8 rounded-xl flex items-center justify-center bg-muted/60 border border-border/50 transition-all duration-300',
              'group-hover:scale-110',
              s.accent
            )}>
              <s.icon className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold text-foreground/90 mb-1 leading-snug">{s.title}</p>
            <p className="text-xs text-muted-foreground/70 leading-relaxed">{s.subtitle}</p>
          </button>
        ))}
      </div>

      {/* Hint */}
      <p className="mt-12 text-xs text-muted-foreground/30 animate-in fade-in duration-1000 delay-500">
        Press <kbd className="mx-1 px-1.5 py-0.5 rounded border border-border/40 bg-muted/30 font-mono text-[10px]">↵</kbd> to send
      </p>
    </div>
  )
}
