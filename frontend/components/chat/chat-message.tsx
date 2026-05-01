'use client'

import { useState } from 'react'
import {
  Check,
  Copy,
  Pencil,
  User,
  Sparkles,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MarkdownRenderer } from './markdown-renderer'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ChatBubbleStyle } from '@/lib/types'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  onEdit?: (newContent: string) => void
  canEdit?: boolean
  bubbleStyle?: ChatBubbleStyle
  compactMode?: boolean
}

export function ChatMessage({
  role,
  content,
  isStreaming,
  onEdit,
  canEdit = false,
  bubbleStyle = 'modern',
  compactMode = false,
}: ChatMessageProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)

  const isUser = role === 'user'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveEdit = () => {
    if (editContent.trim() && onEdit) {
      onEdit(editContent.trim())
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditContent(content)
    setIsEditing(false)
  }

  const getBubbleClasses = () => {
    const base = 'transition-all duration-300'
    switch (bubbleStyle) {
      case 'modern':
        return cn(base, 'rounded-2xl px-5 py-3.5')
      case 'classic':
        return cn(base, 'rounded-xl px-5 py-3.5')
      case 'minimal':
        return cn(base, 'rounded-lg px-4 py-2.5')
      case 'glass':
        return cn(base, 'rounded-2xl px-5 py-3.5 glass-strong')
      default:
        return cn(base, 'rounded-2xl px-5 py-3.5')
    }
  }

  return (
    <div
      className={cn(
        'group relative transition-all duration-700 animate-in fade-in slide-in-from-bottom-4',
        compactMode ? 'py-4 sm:py-6' : 'py-8 sm:py-12',
        !isUser && 'bg-muted/5'
      )}
    >
      <div className="mx-auto max-w-4xl">
        <div className={cn("flex gap-3 sm:gap-5", isUser ? "flex-row-reverse" : "flex-row")}>
          {/* Avatar */}
          <div className="relative shrink-0 mt-1">
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-[20px] transition-all duration-700 shadow-2xl overflow-hidden relative group',
                isUser
                  ? 'bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground shadow-primary/30 ring-2 ring-white/10'
                  : 'bg-gradient-to-br from-sidebar-accent/80 via-background to-sidebar-accent text-foreground shadow-inner border border-border/20 ring-2 ring-white/5'
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              {isUser ? (
                <User className="h-6 w-6 relative z-10" />
              ) : (
                <Sparkles className={cn('h-6 w-6 text-primary relative z-10 drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]', isStreaming && 'animate-pulse')} />
              )}
            </div>
            {/* Online indicator for assistant */}
            {!isUser && (
              <div className="absolute -bottom-0.5 -right-0.5 h-4.5 w-4.5 rounded-full border-[3px] border-background bg-emerald-500 shadow-lg shadow-emerald-500/20" />
            )}
          </div>

          {/* Content */}
          <div className={cn("flex-1 space-y-4 overflow-hidden", isUser ? "text-right" : "text-left")}>
            <div className={cn("flex items-center gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
              <span className="text-[9px] font-black tracking-[0.3em] uppercase text-primary/40 group-hover:text-primary/70 transition-all duration-700">
                {isUser ? 'Neural Signature' : 'Core Processing Unit'}
              </span>
              <div className="h-px w-10 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              {!isUser && isStreaming && (
                <div className="flex items-center gap-2.5 bg-primary/5 border border-primary/20 px-3.5 py-1.5 rounded-full animate-pulse shadow-[0_0_15px_rgba(var(--primary),0.1)]">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </div>
                  <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">
                    Processing...
                  </span>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4 animate-scale-in text-left">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[140px] resize-none border-primary/30 focus:border-primary bg-background/50 backdrop-blur-xl shadow-2xl rounded-3xl p-6 transition-all text-sm font-medium leading-relaxed"
                  autoFocus
                />
                <div className="flex gap-3 justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelEdit}
                    className="rounded-xl px-5 text-[9px] font-black uppercase tracking-widest hover:bg-primary/5"
                  >
                    Abort
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    className="glow gap-2 rounded-xl px-6 h-10 text-[9px] font-black uppercase tracking-widest"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Re-Execute
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  'text-[15px] sm:text-[16.5px] leading-[1.6] transition-all duration-700',
                  isUser 
                    ? cn(getBubbleClasses(), 'bg-primary text-primary-foreground shadow-2xl shadow-primary/20 ml-auto inline-block max-w-[92%] sm:max-w-[85%] rounded-[24px] rounded-tr-[4px] text-left font-semibold tracking-tight hover:shadow-primary/40 hover:-translate-y-0.5') 
                    : 'text-foreground/90 font-medium'
                )}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap">{content}</p>
                ) : (
                  <div className="prose-chat max-w-none prose-p:leading-relaxed prose-pre:rounded-2xl prose-pre:bg-black/20 prose-pre:border prose-pre:border-white/5 prose-code:text-primary/90">
                    <MarkdownRenderer content={content} isStreaming={isStreaming} />
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            {!isEditing && !isStreaming && content && (
              <div className={cn(
                "flex items-center gap-2 pt-2 opacity-0 transition-all duration-300 group-hover:opacity-100",
                isUser ? "justify-end" : "justify-start"
              )}>
                <div className="flex items-center gap-1 bg-background/50 backdrop-blur-md p-1 rounded-xl border border-border/40 shadow-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className={cn(
                      'h-8 px-2.5 gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all rounded-lg',
                      copied && 'text-emerald-500'
                    )}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </>
                    )}
                  </Button>

                  {isUser && canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="h-8 px-2.5 gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all rounded-lg"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  )}

                  {!isUser && (
                    <>
                      <div className="mx-1 h-4 w-px bg-border/50" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
                        className={cn(
                          'h-8 w-8 p-0 text-muted-foreground hover:text-foreground transition-all rounded-lg',
                          feedback === 'up' && 'text-emerald-500 bg-emerald-500/10'
                        )}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
                        className={cn(
                          'h-8 w-8 p-0 text-muted-foreground hover:text-foreground transition-all rounded-lg',
                          feedback === 'down' && 'text-rose-500 bg-rose-500/10'
                        )}
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
