'use client'

import { Sparkles, Code2, FlaskConical, Pen } from 'lucide-react'
import { cn } from '@/lib/utils'

const suggestions = [
  {
    icon: Code2,
    title: 'Code & Engineering',
    subtitle: 'Debug, architect, or review code',
    prompt: 'Design a high-performance distributed backend in Go with gRPC — explain the architecture, trade-offs, and key patterns.',
    card: 'hover:border-violet-500/25 hover:bg-violet-500/[0.03]',
    icon_: 'group-hover:text-violet-400 group-hover:bg-violet-500/10 group-hover:border-violet-400/20',
  },
  {
    icon: FlaskConical,
    title: 'Research & Analysis',
    subtitle: 'Break down complex topics clearly',
    prompt: 'Analyze the trade-offs between micro-frontend and monolithic frontends for large-scale web applications.',
    card: 'hover:border-blue-500/25 hover:bg-blue-500/[0.03]',
    icon_: 'group-hover:text-blue-400 group-hover:bg-blue-500/10 group-hover:border-blue-400/20',
  },
  {
    icon: Pen,
    title: 'Writing & Strategy',
    subtitle: 'Draft, edit, or brainstorm ideas',
    prompt: 'Help me write a compelling technical proposal to migrate our monolithic app to microservices for a senior engineering audience.',
    card: 'hover:border-emerald-500/25 hover:bg-emerald-500/[0.03]',
    icon_: 'group-hover:text-emerald-400 group-hover:bg-emerald-500/10 group-hover:border-emerald-400/20',
  },
]

interface EmptyStateProps {
  onSuggestionClick: (suggestion: string) => void
}

export function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 select-none">

      {/* Icon mark */}
      <div className="mb-7 relative animate-float">
        <div className="h-[52px] w-[52px] rounded-[18px] bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="absolute -inset-3 rounded-[2rem] bg-primary/5 blur-2xl -z-10" />
      </div>

      {/* Heading */}
      <h1
        className="mb-3 text-center font-bold tracking-tight leading-none"
        style={{
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          letterSpacing: '-0.04em',
          background: 'linear-gradient(to bottom, var(--foreground) 30%, color-mix(in oklch, var(--foreground) 45%, transparent))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        How can I help you?
      </h1>

      <p className="mb-10 text-[13.5px] text-muted-foreground/55 text-center max-w-[270px] leading-relaxed">
        Ask anything — code, research, writing, or just a conversation.
      </p>

      {/* Suggestion cards */}
      <div className="w-full max-w-[640px] grid gap-2 sm:grid-cols-3 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
        {suggestions.map((s) => (
          <button
            key={s.title}
            onClick={() => onSuggestionClick(s.prompt)}
            className={cn(
              'group flex flex-col gap-3 p-4 text-left rounded-xl border border-border/40',
              'bg-card/30 hover:bg-card/60 backdrop-blur-sm',
              'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/10',
              s.card,
            )}
          >
            <div className={cn(
              'h-8 w-8 rounded-lg border border-border/40 bg-muted/50 flex items-center justify-center',
              'text-muted-foreground/55 transition-all duration-200',
              s.icon_,
            )}>
              <s.icon className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-foreground/85 leading-tight mb-0.5">{s.title}</p>
              <p className="text-[12px] text-muted-foreground/50 leading-snug">{s.subtitle}</p>
            </div>
          </button>
        ))}
      </div>

      <p className="mt-10 text-[11px] text-muted-foreground/25 animate-in fade-in duration-700 delay-300">
        Press{' '}
        <kbd className="mx-1 px-1.5 py-0.5 rounded-md border border-border/40 bg-muted/20 font-mono text-[10px]">
          ↵
        </kbd>
        to send
      </p>
    </div>
  )
}
