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
          'relative rounded-2xl border transition-all duration-500 ease-in-out',
          'bg-background/40 backdrop-blur-3xl shadow-2xl',
          isFocused
            ? 'border-primary/40 ring-4 ring-primary/5 shadow-primary/10 -translate-y-0.5'
            : 'border-border/40 shadow-black/5 hover:border-border/60',
          isLoading && 'border-primary/20 animate-pulse-subtle'
        )}
      >
        {/* Progress bar for loading state */}
        {isLoading && (
          <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden rounded-t-2xl">
            <div className="h-full bg-gradient-to-r from-transparent via-primary to-transparent animate-shimmer" />
          </div>
        )}

        {/* Model selector row */}
        <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border-b border-border/5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 sm:h-8 gap-2 px-2 text-muted-foreground hover:text-foreground hover:bg-primary/5 rounded-lg transition-colors"
              >
                <div className="p-0.5 sm:p-1 rounded bg-primary/10">
                  <Zap className="h-2.5 sm:h-3 w-2.5 sm:w-3 text-primary" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider">{currentModel?.name || 'Select Model'}</span>
                <ChevronDown className="h-2.5 sm:h-3 w-2.5 sm:w-3 opacity-30" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 p-2 rounded-2xl backdrop-blur-3xl border-border/40 shadow-2xl">
              {AVAILABLE_MODELS.map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => onSettingsChange({ ...settings, model: model.id })}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl cursor-pointer hover:bg-primary/5 focus:bg-primary/5 transition-colors"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-xs sm:text-sm">{model.name}</span>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold opacity-60">
                      {model.provider}
                    </span>
                  </div>
                  {model.badge && (
                    <Badge variant="secondary" className="text-[8px] px-1.5 py-0 font-black uppercase tracking-tighter bg-primary/10 text-primary border-none">
                      {model.badge}
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="relative flex items-end gap-1.5 sm:gap-2 p-2 sm:p-3">
          {/* Attachment button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-300 hover:scale-105 active:scale-95"
            aria-label="Attach file"
          >
            <Paperclip className="h-5 w-5" />
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
              placeholder="Message Graviton..."
              disabled={disabled}
              rows={1}
              className={cn(
                'max-h-[200px] min-h-[44px] w-full resize-none bg-transparent px-1 py-3 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:outline-none',
                'scrollbar-none'
              )}
              aria-label="Chat message input"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            {/* Voice input button - hidden on very small screens to save space */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden sm:flex h-11 w-11 shrink-0 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-300 hover:scale-105 active:scale-95"
              aria-label="Voice input"
            >
              <Mic className="h-5 w-5" />
            </Button>

            {/* Send / Stop button */}
            {isLoading ? (
              <Button
                size="icon"
                onClick={onStop}
                className="h-11 w-11 shrink-0 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-destructive/20"
                aria-label="Stop generating"
              >
                <Square className="h-4 w-4 fill-current" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={handleSubmit}
                disabled={!hasContent || disabled}
                className={cn(
                  'h-11 w-11 shrink-0 rounded-xl transition-all duration-500 shadow-xl',
                  hasContent
                    ? 'bg-primary text-white hover:bg-primary/90 hover:scale-105 active:scale-95 glow-sm'
                    : 'bg-muted/50 text-muted-foreground cursor-not-allowed'
                )}
                aria-label="Send message"
              >
                {hasContent ? (
                  <ArrowUp className="h-5 w-5 stroke-[2.5px]" />
                ) : (
                  <Sparkles className="h-5 w-5" />
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
