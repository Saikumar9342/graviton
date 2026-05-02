'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowUp, Square, Paperclip, Mic, Sparkles, ChevronDown, Cpu, Search, Activity, Globe, Command as CommandIcon, MessageSquare, Terminal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Settings, AVAILABLE_MODELS } from '@/lib/types'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface ChatInputProps {
  onSend: (message: string, mode: string) => void
  onStop?: () => void
  isLoading?: boolean
  disabled?: boolean
  settings: Settings
  onSettingsChange: (settings: Settings) => void
  availableModels?: { id: string; name: string; provider: string; badge?: string }[]
}

export function ChatInput({
  onSend,
  onStop,
  isLoading = false,
  disabled = false,
  settings,
  onSettingsChange,
  availableModels,
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [mode, setMode] = useState('chat')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const models = availableModels ?? AVAILABLE_MODELS
  const currentModel = models.find((m) => m.id === settings.model) ?? models[0]

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 240)}px`
    }
  }, [input])

  const handleSubmit = () => {
    if (!input.trim() || disabled) return
    onSend(input.trim(), mode)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (isLoading && onStop) {
        onStop()
      } else {
        handleSubmit()
      }
    }
  }

  const hasContent = input.trim().length > 0

  return (
    <div className="relative group/input max-w-4xl mx-auto w-full px-4 sm:px-0">
      {/* Visual background glow for focused state */}
      <div className={cn(
        "absolute -inset-4 bg-primary/5 rounded-[3rem] blur-3xl transition-opacity duration-1000 opacity-0 pointer-events-none",
        isFocused && "opacity-100"
      )} />

      <div
        className={cn(
          'relative flex flex-col transition-all duration-500 ease-out overflow-hidden',
          'bg-black/40 backdrop-blur-3xl shadow-2xl',
          'tactical-border rounded-2xl',
          isFocused
            ? 'border-primary/40 shadow-[0_0_50px_-12px_var(--glow-primary)] ring-1 ring-primary/10'
            : 'border-white/5 hover:border-white/10 shadow-black/40',
          isLoading && 'animate-neural-pulse border-primary/20'
        )}
      >
        {/* Tactical Control Bar */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 bg-white/5 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-2 px-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-primary hover:bg-primary/10 rounded-md transition-all border border-transparent hover:border-primary/20 group/model"
                >
                  <Cpu className="h-3 w-3 text-primary/40 group-hover/model:text-primary transition-colors" />
                  <span>{currentModel?.name}</span>
                  <ChevronDown className="h-2.5 w-2.5 opacity-20" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 p-1 rounded-xl glass-strong shadow-3xl border-primary/20 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between bg-white/5 rounded-t-lg">
                  <span className="text-[8px] font-black text-primary uppercase tracking-[0.3em]">Core_Neural_Matrix</span>
                  <Activity className="h-3 w-3 text-primary/30" />
                </div>
                {models.map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => onSettingsChange({ ...settings, model: model.id })}
                    className="flex items-center justify-between py-2 px-2 rounded-lg cursor-pointer hover:bg-primary/10 focus:bg-primary/10 transition-all group m-1"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-black text-[10px] uppercase tracking-wider group-hover:text-primary transition-colors">{model.name}</span>
                      <span className="text-[7px] text-muted-foreground/40 uppercase tracking-[0.2em]">{model.id}</span>
                    </div>
                    {model.badge && (
                      <Badge variant="outline" className="text-[6px] h-3.5 px-1 bg-primary/10 text-primary border-primary/30 font-black uppercase tracking-tighter">
                        {model.badge}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="h-3 w-px bg-white/10" />

            <div className="flex items-center gap-1 bg-black/20 p-0.5 rounded-lg border border-white/5">
              {[
                { id: 'chat', label: 'Chat', icon: MessageSquare },
                { id: 'code', label: 'Dev', icon: Terminal },
                { id: 'research', label: 'Scan', icon: Search }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setMode(t.id)}
                  className={cn(
                    "text-[8px] font-black uppercase tracking-[0.2em] h-6 px-3 rounded-md transition-all duration-300 flex items-center gap-1.5",
                    mode === t.id
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground/40 hover:text-muted-foreground/80 hover:bg-white/5"
                  )}
                >
                  <t.icon className={cn("h-2.5 w-2.5", mode === t.id ? "opacity-100" : "opacity-30")} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-3 px-2 py-0.5 rounded-md border border-white/5 bg-black/20">
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-emerald-500 shadow-[0_0_5px_var(--glow-emerald)] animate-pulse" />
                <span className="text-[7px] font-black text-emerald-500/40 uppercase tracking-[0.25em]">Link_Up</span>
              </div>
              <div className="h-2 w-px bg-white/10" />
              <div className="flex items-center gap-2">
                <Activity className="h-2.5 w-2.5 text-primary/30 animate-pulse" />
                <span className="text-[7px] font-black text-primary/40 uppercase tracking-[0.25em]">Sync_Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Input Field */}
        <div className="flex items-start p-2 gap-2 relative">
          {/* Side Actions Column */}
          <div className="flex flex-col gap-1.5 self-end pb-1 pl-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-muted-foreground/30 hover:text-primary hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20 active:scale-95 group/btn"
                >
                  <Paperclip className="h-3.5 w-3.5 transition-transform group-hover/btn:rotate-12" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-[8px] font-black uppercase tracking-widest bg-black border-white/10">Attach_Resource</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-muted-foreground/30 hover:text-blue-500 hover:bg-blue-500/10 transition-all border border-transparent hover:border-blue-500/20 active:scale-95 group/btn"
                >
                  <Globe className="h-3.5 w-3.5 transition-transform group-hover/btn:scale-110" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-[8px] font-black uppercase tracking-widest bg-black border-white/10">World_Link</TooltipContent>
            </Tooltip>
          </div>

          {/* Text Area */}
          <div className="flex-1 min-h-[44px] relative py-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={
                mode === 'chat'
                  ? "AWAITING TRANSMISSION..."
                  : mode === 'code'
                    ? "ENGINEERING PROTOCOL_INIT..."
                    : "SYNTHESIZE KNOWLEDGE_BASE..."
              }
              className={cn(
                'w-full resize-none bg-transparent border-none focus-visible:ring-0 p-0 text-sm font-medium leading-relaxed placeholder:text-muted-foreground/10 selection:bg-primary/20',
                'scrollbar-none min-h-[44px] transition-all duration-500'
              )}
            />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/5 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/5 pointer-events-none" />
          </div>

          {/* Send Action Column */}
          <div className="flex items-center gap-1.5 self-end pb-1 pr-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden sm:flex h-8 w-8 rounded-lg text-muted-foreground/30 hover:text-primary hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20 group/mic"
                >
                  <Mic className="h-3.5 w-3.5 relative z-10" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[8px] font-black uppercase tracking-widest bg-black border-white/10">Voice_In</TooltipContent>
            </Tooltip>

            {isLoading ? (
              <Button
                size="icon"
                onClick={onStop}
                className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all shadow-lg shadow-destructive/20 border border-destructive/30 active:scale-95 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-destructive/20 animate-shimmer" />
                <Square className="h-3.5 w-3.5 fill-current relative z-10" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={handleSubmit}
                disabled={!hasContent || disabled}
                className={cn(
                  'h-10 w-10 rounded-xl transition-all duration-700 shadow-2xl group relative overflow-hidden active:scale-95',
                  hasContent
                    ? 'bg-primary text-primary-foreground hover:scale-105 glow-primary border-t border-white/20'
                    : 'bg-white/5 text-muted-foreground/10 border border-white/5'
                )}
              >
                {hasContent ? (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <ArrowUp className="h-4 w-4 stroke-[3.5px] transition-transform duration-500 group-hover:-translate-y-1 relative z-10" />
                  </>
                ) : (
                  <Sparkles className="h-3.5 w-3.5 opacity-20 group-hover:opacity-100 transition-opacity" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="flex items-center justify-between px-3 py-1 bg-black/40 border-t border-white/5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "h-1 w-1 rounded-full transition-colors duration-1000",
                input.length > 0 ? "bg-primary animate-pulse shadow-[0_0_5px_var(--glow-primary)]" : "bg-white/10"
              )} />
              <span className="text-[7px] font-black text-muted-foreground/30 uppercase tracking-[0.2em]">
                BUF: {input.length} <span className="opacity-50">BYTES</span>
              </span>
            </div>

            <div className="h-2 w-px bg-white/5" />

            <div className="flex items-center gap-1.5 opacity-30 hover:opacity-100 transition-opacity cursor-help">
              <CommandIcon className="h-2.5 w-2.5 text-primary" />
              <span className="text-[7px] font-black text-muted-foreground uppercase tracking-[0.2em]">Execute: <span className="text-primary/60">ENTER</span></span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[7px] font-black text-primary/30 uppercase tracking-[0.4em] animate-pulse">
              SECURE_LINK_ENCRYPTED_AES_256
            </span>
          </div>
        </div>

        {/* Dynamic Scanline on Input */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-scanline animate-scanline" />
      </div>

      {/* Floating Shortcut Hint */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-0 group-hover/input:opacity-100 transition-all duration-700 delay-300">
        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
          Command Palette: <span className="text-primary/40">/HELP</span>
        </span>
      </div>
    </div>
  )
}
