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
    <div
      className={cn(
        'relative rounded-2xl border bg-card transition-all duration-300',
        isFocused
          ? 'border-primary/50 shadow-xl shadow-primary/10 ring-2 ring-primary/20'
          : 'border-border shadow-lg hover:border-primary/30 hover:shadow-xl',
        isLoading && 'border-primary/30'
      )}
    >
      {/* Glow effect when focused */}
      {isFocused && (
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-primary/20 via-transparent to-primary/20 opacity-50 blur-sm" />
      )}

      {/* Model selector row */}
      <div className="flex items-center gap-2 px-3 pt-2 pb-1 border-b border-border/30">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-muted-foreground hover:text-foreground rounded-lg"
            >
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium">{currentModel?.name || 'Select Model'}</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {AVAILABLE_MODELS.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onClick={() => onSettingsChange({ ...settings, model: model.id })}
                className="flex items-center justify-between py-2.5"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{model.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {model.provider}
                  </span>
                </div>
                {model.badge && (
                  <Badge variant="secondary" className="text-[10px] px-1.5">
                    {model.badge}
                  </Badge>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="relative flex items-end gap-2 p-2">
        {/* Attachment button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent"
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
            placeholder="Ask Graviton anything..."
            disabled={disabled}
            rows={1}
            className={cn(
              'max-h-[200px] min-h-[44px] w-full resize-none bg-transparent px-2 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none',
              'scrollbar-thin'
            )}
            aria-label="Chat message input"
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {/* Voice input button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent"
            aria-label="Voice input"
          >
            <Mic className="h-5 w-5" />
          </Button>

          {/* Send / Stop button */}
          {isLoading ? (
            <Button
              size="icon"
              onClick={onStop}
              className="h-10 w-10 shrink-0 rounded-xl bg-destructive hover:bg-destructive/90 transition-all duration-200 hover:scale-105"
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
                'h-10 w-10 shrink-0 rounded-xl transition-all duration-300',
                hasContent
                  ? 'bg-primary hover:bg-primary/90 glow-sm hover:scale-105'
                  : 'bg-muted text-muted-foreground'
              )}
              aria-label="Send message"
            >
              {hasContent ? (
                <ArrowUp className="h-5 w-5" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Character count indicator */}
      {input.length > 500 && (
        <div className="absolute -bottom-5 right-2 text-xs text-muted-foreground">
          {input.length} / 4000
        </div>
      )}
    </div>
  )
}
