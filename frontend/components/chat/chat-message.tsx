'use client'

import { useState } from 'react'
import { Check, Copy, Pencil, ThumbsUp, ThumbsDown, Sparkles, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MarkdownRenderer } from './markdown-renderer'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  onEdit?: (newContent: string) => void
  canEdit?: boolean
  compactMode?: boolean
}

export function ChatMessage({
  role,
  content,
  isStreaming,
  onEdit,
  canEdit = false,
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
    if (editContent.trim() && onEdit) onEdit(editContent.trim())
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditContent(content)
    setIsEditing(false)
  }

  return (
    <div className={cn(
      'group animate-in fade-in slide-in-from-bottom-1 duration-300',
      compactMode ? 'py-1' : 'py-2',
    )}>
      {isUser ? (
        /* ── User message ─────────────────────────────────────── */
        <div className="flex justify-end gap-3 max-w-3xl mx-auto">
          <div className="max-w-[80%] space-y-1.5">
            {isEditing ? (
              <div className="space-y-2 animate-in zoom-in-95 duration-200">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[80px] resize-none rounded-2xl border-primary/30 bg-primary/5 p-3 text-sm focus-visible:ring-1 focus-visible:ring-primary/50"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-7 text-xs rounded-lg">
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveEdit} className="h-7 text-xs rounded-lg shadow-sm shadow-primary/20">
                    Send
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative group/bubble">
                <div className="px-4 py-3 rounded-2xl rounded-br-sm bg-primary/12 border border-primary/15 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                  {content}
                </div>
                {/* Edit button */}
                {canEdit && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="absolute -bottom-2 -right-2 opacity-0 group-hover/bubble:opacity-100 transition-opacity h-6 w-6 rounded-full bg-background border border-border/60 flex items-center justify-center text-muted-foreground/60 hover:text-foreground shadow-sm"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* User avatar */}
          <div className="shrink-0 h-8 w-8 rounded-full bg-muted border border-border/50 flex items-center justify-center mt-0.5">
            <User className="h-3.5 w-3.5 text-muted-foreground/70" />
          </div>
        </div>
      ) : (
        /* ── Assistant message ────────────────────────────────── */
        <div className="flex gap-3 max-w-3xl mx-auto">
          {/* Graviton avatar */}
          <div className="shrink-0 h-8 w-8 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center mt-0.5">
            <Sparkles className={cn('h-3.5 w-3.5 text-primary', isStreaming && 'animate-pulse')} />
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            {/* Streaming indicator */}
            {isStreaming && !content && (
              <div className="flex items-center gap-1.5 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
              </div>
            )}

            {content && (
              <div className="prose-chat max-w-none">
                <MarkdownRenderer content={content} isStreaming={isStreaming} />
              </div>
            )}

            {/* Action bar */}
            {!isStreaming && content && (
              <div className="flex items-center gap-0.5 pt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCopy}
                      className={cn(
                        'h-7 w-7 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/60',
                        copied && 'text-emerald-500 bg-emerald-500/10 hover:text-emerald-500'
                      )}
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">Copy</TooltipContent>
                </Tooltip>

                <div className="w-px h-3.5 bg-border/50 mx-0.5" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
                      className={cn(
                        'h-7 w-7 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/60',
                        feedback === 'up' && 'text-emerald-500 bg-emerald-500/10 hover:text-emerald-500'
                      )}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">Good response</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
                      className={cn(
                        'h-7 w-7 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/60',
                        feedback === 'down' && 'text-rose-500 bg-rose-500/10 hover:text-rose-500'
                      )}
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">Bad response</TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
