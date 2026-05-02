'use client'

import { Cpu, ChevronRight, ChevronLeft, MessageSquare, Hash, Zap, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface ChatDetailsProps {
  model?: string
  tokens?: number
  userMessages?: number
  assistantMessages?: number
  lastResponseMs?: number
  streamSpeed?: number
  isCollapsed: boolean
  onToggle: () => void
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/5 last:border-0">
      <span className="text-[11px] text-muted-foreground/50">{label}</span>
      <span className="text-[11px] font-medium text-foreground/80">
        {value}
        {sub && <span className="text-muted-foreground/40 ml-0.5">{sub}</span>}
      </span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/30 mb-1">{title}</p>
      <div className="px-3 rounded-xl bg-muted/[0.04] border border-border/5">
        {children}
      </div>
    </div>
  )
}

export function ChatDetails({
  model = '—',
  tokens = 0,
  userMessages = 0,
  assistantMessages = 0,
  lastResponseMs,
  streamSpeed,
  isCollapsed,
  onToggle,
}: ChatDetailsProps) {
  const totalMessages = userMessages + assistantMessages

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-l border-border/10 bg-background/60 backdrop-blur-3xl transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] shrink-0',
        isCollapsed ? 'w-[50px]' : 'w-[260px]',
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between px-3 border-b border-border/5 shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-2 animate-in fade-in duration-300">
            <Cpu className="h-3.5 w-3.5 text-primary/70" />
            <span className="text-[11px] font-semibold text-foreground/60 tracking-wide">Session</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn(
            'h-7 w-7 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-muted/50 transition-all',
            isCollapsed && 'mx-auto',
          )}
        >
          {isCollapsed ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {!isCollapsed ? (
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-5 animate-in fade-in duration-300">

            {/* Model */}
            <Section title="Model">
              <div className="flex items-center gap-2.5 py-3">
                <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                  <Cpu className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-foreground/80 truncate leading-tight">{model}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[9px] text-muted-foreground/40">Local · Ollama</span>
                  </div>
                </div>
              </div>
            </Section>

            {/* Conversation */}
            <Section title="Conversation">
              <Stat label="Total messages" value={totalMessages} />
              <Stat label="Your messages" value={userMessages} />
              <Stat label="AI responses" value={assistantMessages} />
              <Stat label="Est. tokens" value={tokens > 0 ? tokens.toLocaleString() : '—'} />
            </Section>

            {/* Performance */}
            <Section title="Performance">
              <Stat
                label="Last response"
                value={lastResponseMs != null ? (lastResponseMs / 1000).toFixed(1) : '—'}
                sub={lastResponseMs != null ? 's' : undefined}
              />
              <Stat
                label="Stream speed"
                value={streamSpeed != null ? streamSpeed.toLocaleString() : '—'}
                sub={streamSpeed != null ? ' ch/s' : undefined}
              />
            </Section>

          </div>
        </ScrollArea>
      ) : (
        <div className="flex-1 flex flex-col items-center pt-5 gap-5">
          <Cpu className="h-3.5 w-3.5 text-muted-foreground/20" />
          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground/20" />
          <Hash className="h-3.5 w-3.5 text-muted-foreground/20" />
          <Zap className="h-3.5 w-3.5 text-muted-foreground/20" />
          <Timer className="h-3.5 w-3.5 text-muted-foreground/20" />
        </div>
      )}
    </aside>
  )
}
