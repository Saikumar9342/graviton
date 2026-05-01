'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowUp, Square, Paperclip, Mic, Sparkles, ChevronDown, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { Settings, AVAILABLE_MODELS } from '@/lib/types'

interface ChatInputProps {
  onSend: (message: string) => void
  onStop?: () => void
  isLoading?: boolean
  disabled?: boolean
  settings: Settings
  onSettingsChange: (settings: Settings) => void
}

export function ChatInput({
  onSend,
  onStop,
  isLoading = false,
  disabled = false,
  settings,
  onSettingsChange,
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const currentModel = AVAILABLE_MODELS.find((m) => m.id === settings.model)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [input])

  // Keyboard shortcut to focus
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        textareaRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  const handleSubmit = () => {
    if (!input.trim() || disabled) return
    onSend(input.trim())
    setInput('')
    // Reset height
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
    <div className="relative w-full max-w-5xl mx-auto px-4 pb-4 sm:pb-6">
      <div
        className={cn(
          'relative rounded-[28px] border transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
          'bg-background/30 backdrop-blur-3xl shadow-2xl',
          isFocused
            ? 'border-primary/40 ring-8 ring-primary/5 shadow-[0_20px_50px_-12px_rgba(var(--primary),0.2)] -translate-y-1'
            : 'border-white/5 shadow-black/10 hover:border-white/10',
          isLoading && 'border-primary/20 animate-pulse-subtle'
        )}
      >
        {/* Progress bar for loading state */}
        {isLoading && (
          <div className="absolute top-0 left-0 right-0 h-[3px] overflow-hidden rounded-t-[28px]">
            <div className="h-full bg-gradient-to-r from-transparent via-primary to-transparent animate-shimmer" />
          </div>
        )}

        {/* Model selector row */}
        <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 border-b border-white/5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 sm:h-9 gap-3 px-3 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl transition-all duration-500 hover:scale-105"
              >
                <div className="p-1.5 rounded-lg bg-primary/10 shadow-inner">
                  <Zap className="h-3 sm:h-3.5 w-3.5 sm:w-3.5 text-primary" />
                </div>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em]">{currentModel?.name || 'Select Model'}</span>
                  <span className="text-[7px] font-bold text-primary/60 tracking-widest uppercase mt-0.5">Core Active</span>
                </div>
                <ChevronDown className="h-3 sm:h-3.5 w-3.5 sm:w-3.5 opacity-20 group-hover:opacity-100 transition-opacity" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72 p-3 rounded-3xl glass-strong border-white/10 shadow-3xl animate-in zoom-in-95 duration-500">
              {AVAILABLE_MODELS.map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => onSettingsChange({ ...settings, model: model.id })}
                  className="flex items-center justify-between py-3 px-4 rounded-2xl cursor-pointer hover:bg-primary/10 focus:bg-primary/10 transition-all mb-1 last:mb-0"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-black text-xs sm:text-sm tracking-tight">{model.name}</span>
                    <span className="text-[8px] text-muted-foreground uppercase tracking-[0.2em] font-black opacity-50">
                      {model.provider} Protocol
                    </span>
                  </div>
                  {model.badge && (
                    <Badge variant="secondary" className="text-[8px] px-2 py-0.5 font-black uppercase tracking-widest bg-primary text-primary-foreground border-none rounded-full shadow-lg shadow-primary/20">
                      {model.badge}
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="h-4 w-px bg-white/5 mx-2" />
          <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-primary/5 border border-primary/10">
             <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
             <span className="text-[8px] font-black text-primary/80 uppercase tracking-widest">Neural Link Secure</span>
          </div>
        </div>

        <div className="relative flex items-end gap-2 sm:gap-3 p-3 sm:p-4">
          {/* Attachment button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-12 w-12 shrink-0 rounded-2xl text-muted-foreground/50 hover:text-primary hover:bg-primary/10 transition-all duration-500 hover:scale-110 active:scale-90 border border-transparent hover:border-primary/20 shadow-none hover:shadow-xl hover:shadow-primary/5"
            aria-label="Attach file"
          >
            <Paperclip className="h-5.5 w-5.5" />
          </Button>

          {/* Textarea */}
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Transmit neural request..."
              disabled={disabled}
              rows={1}
              className={cn(
                'max-h-[220px] min-h-[48px] w-full resize-none bg-transparent px-1 py-3.5 text-[15px] sm:text-[16px] font-medium leading-relaxed text-foreground placeholder:text-muted-foreground/30 focus:outline-none',
                'scrollbar-none'
              )}
              aria-label="Chat message input"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Voice input button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden sm:flex h-12 w-12 shrink-0 rounded-2xl text-muted-foreground/50 hover:text-primary hover:bg-primary/10 transition-all duration-500 hover:scale-110 active:scale-90 border border-transparent hover:border-primary/20"
              aria-label="Voice input"
            >
              <Mic className="h-5.5 w-5.5" />
            </Button>

            {/* Send / Stop button */}
            {isLoading ? (
              <Button
                size="icon"
                onClick={onStop}
                className="h-12 w-12 shrink-0 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all duration-500 hover:scale-110 active:scale-90 shadow-2xl shadow-destructive/20 border border-destructive/20"
                aria-label="Stop generating"
              >
                <Square className="h-4.5 w-4.5 fill-current" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={handleSubmit}
                disabled={!hasContent || disabled}
                className={cn(
                  'h-12 w-12 shrink-0 rounded-2xl transition-all duration-700 shadow-2xl overflow-hidden group',
                  hasContent
                    ? 'bg-primary text-white hover:bg-primary/90 hover:scale-110 active:scale-90 glow'
                    : 'bg-muted/30 text-muted-foreground/30 cursor-not-allowed opacity-50'
                )}
                aria-label="Send message"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {hasContent ? (
                  <ArrowUp className="h-6 w-6 stroke-[3px] transition-transform duration-500 group-hover:-translate-y-1" />
                ) : (
                  <Sparkles className="h-6 w-6 transition-transform duration-700 group-hover:rotate-180" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Character count indicator */}
      {input.length > 500 && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 bg-background/50 px-2 rounded-full border border-border/10">
          {input.length} / 4000
        </div>
      )}
    </div>
  )
}
