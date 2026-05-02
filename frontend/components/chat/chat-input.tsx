'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowUp, Square, Paperclip, Globe, ChevronDown, Cpu, Search, MessageSquare, Terminal } from 'lucide-react'
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

const MODES = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'code', label: 'Dev', icon: Terminal },
  { id: 'research', label: 'Research', icon: Search },
]

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
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (isLoading && onStop) onStop()
      else handleSubmit()
    }
  }

  const hasContent = input.trim().length > 0

  return (
    <div className="relative w-full">
      {/* Single container — no outer wrapper div that caused double border */}
      <div className={cn(
        'relative rounded-2xl border bg-muted/20 transition-all duration-200 overflow-hidden',
        isFocused
          ? 'border-primary/40 ring-[3px] ring-primary/[0.07] shadow-xl shadow-black/15'
          : 'border-border/50 hover:border-border/80 shadow-md shadow-black/10',
        isLoading && !isFocused && 'border-primary/25',
      )}>

        {/* Toolbar */}
        <div className="flex items-center gap-1.5 px-4 pt-3 pb-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-2xl shrink-0"
              >
                <Cpu className="h-3 w-3 text-primary/70" />
                {currentModel?.name ?? settings.model}
                <ChevronDown className="h-3 w-3 opacity-40" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60 rounded-2xl p-1.5">
              <div className="px-2 py-1.5 mb-1">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Models</p>
              </div>
              {models.map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => onSettingsChange({ ...settings, model: model.id })}
                  className={cn(
                    'flex items-center justify-between py-2 px-2.5 rounded-xl cursor-pointer',
                    settings.model === model.id && 'bg-primary/10 text-primary'
                  )}
                >
                  <div>
                    <p className="text-sm font-medium leading-none mb-0.5">{model.name}</p>
                    <p className="text-[11px] text-muted-foreground/60">{model.provider}</p>
                  </div>
                  {model.badge && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-medium">
                      {model.badge}
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-3.5 w-px bg-border/40 mx-0.5" />

          {/* Mode tabs */}
          <div className="flex items-center gap-0.5">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={cn(
                  'flex items-center gap-1.5 text-[11px] font-medium h-6 px-2.5 rounded-2xl transition-all duration-150',
                  mode === m.id
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground/45 hover:text-muted-foreground hover:bg-muted/40'
                )}
              >
                <m.icon className="h-2.5 w-2.5" />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Textarea */}
        <div className="px-4 py-1">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={
              mode === 'chat'
                ? 'Ask anything…'
                : mode === 'code'
                  ? 'Describe what you want to build or debug…'
                  : 'What would you like to research?'
            }
            className="w-full resize-none bg-transparent border-none focus-visible:ring-0 p-0 text-sm leading-relaxed placeholder:text-muted-foreground/35 scrollbar-none min-h-[44px]"
          />
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-4 pb-3 pt-1">
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-2xl text-muted-foreground/35 hover:text-muted-foreground/70 hover:bg-muted/40"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">Attach file</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-2xl text-muted-foreground/35 hover:text-muted-foreground/70 hover:bg-muted/40 hidden sm:flex"
                >
                  <Globe className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">Web search</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-2">
            {input.length > 0 && (
              <span className="text-[11px] text-muted-foreground/25 tabular-nums select-none">
                {input.length}
              </span>
            )}

            {isLoading ? (
              <Button
                size="icon"
                onClick={onStop}
                className="h-8 w-8 rounded-xl bg-muted/50 hover:bg-destructive/10 hover:text-destructive text-muted-foreground/50 transition-all duration-150"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={handleSubmit}
                disabled={!hasContent || disabled}
                className={cn(
                  'h-8 w-8 rounded-2xl transition-all duration-200',
                  hasContent
                    ? 'bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/25 active:scale-95'
                    : 'bg-muted/40 text-muted-foreground/20 cursor-not-allowed'
                )}
              >
                <ArrowUp className={cn('h-3.5 w-3.5', hasContent && 'stroke-[2.5px]')} />
              </Button>
            )}
          </div>
        </div>
      </div>

      <p className="mt-2 text-center text-[11px] text-muted-foreground/25 select-none">
        Graviton can make mistakes. Verify important information.
      </p>
    </div>
  )
}
