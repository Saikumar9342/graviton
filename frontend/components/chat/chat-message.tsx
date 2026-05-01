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
    const base = 'transition-all duration-200'
    switch (bubbleStyle) {
      case 'modern':
        return cn(base, 'rounded-2xl px-4 py-3')
      case 'classic':
        return cn(base, 'rounded-lg px-4 py-3')
      case 'minimal':
        return cn(base, 'rounded-md px-3 py-2')
      case 'glass':
        return cn(base, 'rounded-2xl px-4 py-3 glass')
      default:
        return cn(base, 'rounded-2xl px-4 py-3')
    }
  }

  return (
    <div
      className={cn(
        'group relative px-4 py-4 transition-all animate-slide-up border-b border-border/5',
        compactMode ? 'py-2.5' : 'py-4',
        !isUser && 'bg-chat-assistant/20 backdrop-blur-sm'
      )}
    >
      <div className="mx-auto max-w-3xl">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300',
                isUser
                  ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20'
                  : 'bg-gradient-to-br from-primary/80 via-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/30'
              )}
            >
              {isUser ? (
                <User className="h-4 w-4" />
              ) : (
                <Sparkles className={cn('h-4 w-4', isStreaming && 'animate-pulse')} />
              )}
            </div>
            {/* Online indicator for assistant */}
            {!isUser && (
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 space-y-2 overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">
                {isUser ? 'You' : 'Graviton'}
              </span>
              {!isUser && isStreaming && (
                <span className="flex items-center gap-1 text-xs text-primary">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  Thinking
                </span>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-3 animate-scale-in">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[100px] resize-none border-primary/50 focus:border-primary input-glow"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    className="glow-sm gap-2"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Save & Regenerate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  'text-sm leading-relaxed',
                  isUser ? cn(getBubbleClasses(), 'bg-primary/10 border border-primary/20 shadow-sm ml-auto inline-block max-w-[85%]') : 'text-foreground'
                )}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap">{content}</p>
                ) : (
                  <div className="prose-chat">
                    <MarkdownRenderer content={content} isStreaming={isStreaming} />
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            {!isEditing && !isStreaming && content && (
              <div className="flex items-center gap-1 pt-1 opacity-0 transition-all duration-200 group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className={cn(
                    'h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent',
                    copied && 'text-emerald-500'
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copied!
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
                    className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                )}

                {!isUser && (
                  <>
                    <div className="mx-1 h-4 w-px bg-border" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
                      className={cn(
                        'h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent',
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
                        'h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent',
                        feedback === 'down' && 'text-rose-500 bg-rose-500/10'
                      )}
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
