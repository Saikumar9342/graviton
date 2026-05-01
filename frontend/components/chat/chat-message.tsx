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
        'group relative px-3 sm:px-6 transition-all animate-slide-up',
        compactMode ? 'py-2.5 sm:py-3.5' : 'py-4 sm:py-6',
        !isUser && 'bg-muted/30 backdrop-blur-sm'
      )}
    >
      <div className="mx-auto max-w-4xl">
        <div className={cn("flex gap-3 sm:gap-5", isUser ? "flex-row-reverse" : "flex-row")}>
          {/* Avatar */}
          <div className="relative shrink-0 mt-1">
            <div
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-500 shadow-xl overflow-hidden relative group',
                isUser
                  ? 'bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground shadow-primary/30 ring-1 ring-white/20'
                  : 'bg-gradient-to-br from-sidebar-accent via-background to-sidebar-accent text-foreground shadow-inner border border-border/50 ring-1 ring-white/5'
              )}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              {isUser ? (
                <User className="h-5.5 w-5.5 relative z-10" />
              ) : (
                <Sparkles className={cn('h-5.5 w-5.5 text-primary relative z-10', isStreaming && 'animate-pulse')} />
              )}
            </div>
            {/* Online indicator for assistant */}
            {!isUser && (
              <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-[3.5px] border-background bg-emerald-500 shadow-md" />
            )}
          </div>

          {/* Content */}
          <div className={cn("flex-1 space-y-2.5 overflow-hidden", isUser ? "text-right" : "text-left")}>
            <div className={cn("flex items-center gap-2", isUser ? "justify-end" : "justify-start")}>
              <span className="text-[10px] font-black tracking-[0.2em] uppercase text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors">
                {isUser ? 'Neural Signature' : 'Core Processing Unit'}
              </span>
              {!isUser && isStreaming && (
                <span className="flex items-center gap-2 text-[9px] font-black text-primary uppercase tracking-[0.15em] bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/10 animate-pulse">
                  Linking...
                </span>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4 animate-scale-in text-left">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[120px] resize-none border-primary/30 focus:border-primary bg-background/50 backdrop-blur-sm shadow-inner rounded-2xl p-4 transition-all text-sm"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="rounded-xl px-4 text-[10px] font-black uppercase tracking-widest"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    className="glow-sm gap-2 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Update Response
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  'text-[14px] sm:text-[15.5px] leading-relaxed transition-all duration-300',
                  isUser 
                    ? cn(getBubbleClasses(), 'bg-primary text-primary-foreground shadow-2xl shadow-primary/20 ml-auto inline-block max-w-[95%] sm:max-w-[85%] rounded-tr-none text-left font-semibold tracking-tight ring-1 ring-white/10') 
                    : 'text-foreground/90 font-medium'
                )}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap">{content}</p>
                ) : (
                  <div className="prose-chat max-w-none">
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
