'use client'

import { useState, useMemo } from 'react'
import {
  Check,
  Copy,
  Pencil,
  User,
  Terminal,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  Hash,
  Clock,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MarkdownRenderer } from './markdown-renderer'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ChatBubbleStyle } from '@/lib/types'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

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
  
  // Generate a mock transmission ID for tactical feel
  const transmissionId = useMemo(() => {
    return Math.random().toString(16).substring(2, 10).toUpperCase()
  }, [])

  const timestamp = useMemo(() => new Date(), [])

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

  return (
    <div
      className={cn(
        'group relative transition-all duration-700 animate-in fade-in slide-in-from-bottom-1',
        compactMode ? 'py-0.5' : 'py-2',
        !isUser && 'bg-primary/[0.02] border-y border-primary/[0.04]'
      )}
    >
      <div className="mx-auto max-w-3xl px-4 flex gap-4 sm:gap-6">
        {/* Avatar / Status Column */}
        <div className="shrink-0 flex flex-col items-center gap-2 mt-1">
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-500 shadow-lg relative group-hover:scale-105',
              isUser
                 ? 'bg-background border-border/10 text-foreground/60'
                 : 'bg-primary/10 border-primary/20 text-primary shadow-primary/5'
            )}
          >
            {isUser ? (
              <User className="h-3.5 w-3.5" />
            ) : (
              <Terminal className={cn('h-3.5 w-3.5', isStreaming && 'animate-pulse')} />
            )}
            
            {/* Status light */}
            <div className={cn(
              "absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full border border-background",
              isStreaming ? "bg-primary animate-pulse" : isUser ? "bg-muted-foreground/20" : "bg-emerald-500"
            )} />
          </div>
          
          <div className="w-px flex-1 bg-gradient-to-b from-border/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        </div>

        {/* Content Container */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center justify-between h-4">
            <div className="flex items-center gap-2.5">
              <span className={cn(
                "text-[9px] font-mono font-black uppercase tracking-[0.1em] flex items-center gap-1.5",
                isUser ? "text-muted-foreground/50" : "text-primary/70"
              )}>
                {isUser ? (
                  <>
                    <ChevronRight className="h-2.5 w-2.5 opacity-30" />
                    USER_OPS
                  </>
                ) : (
                  <>
                    <Zap className="h-2.5 w-2.5 opacity-50" />
                    CORE_UPLINK
                  </>
                )}
              </span>
              
              <div className="h-2.5 w-px bg-border/10" />
              
              <span className="text-[8px] font-mono text-muted-foreground/30 uppercase tracking-tighter">
                TX_{transmissionId}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1 text-[8px] font-mono text-muted-foreground/20 uppercase tracking-widest">
                <Clock className="h-2 w-2" />
                {format(timestamp, 'HH:mm:ss')}
              </div>

              {!isUser && isStreaming && (
                <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-primary/5 border border-primary/10">
                  <div className="flex gap-0.5">
                    <div className="h-0.5 w-0.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <div className="h-0.5 w-0.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <div className="h-0.5 w-0.5 rounded-full bg-primary animate-bounce" />
                  </div>
                  <span className="text-[7px] font-black text-primary uppercase tracking-[0.2em]">Receiving</span>
                </div>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-3 animate-in zoom-in-95 duration-500 pt-1">
              <div className="relative">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[120px] resize-none border-primary/20 focus:border-primary/50 bg-primary/5 rounded-xl p-4 text-[13px] font-medium leading-relaxed shadow-inner"
                  autoFocus
                />
                <div className="absolute top-2 right-2 text-[8px] font-black text-primary/30 uppercase tracking-widest font-mono">MOD_ACTIVE</div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  className="text-[9px] font-bold uppercase tracking-widest h-8 px-3 hover:bg-background"
                >
                  Abort
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  className="rounded-lg h-8 px-4 text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                >
                  Re-transmit
                </Button>
              </div>
            </div>
          ) : (
            <div className={cn(
              "text-[13px] leading-relaxed transition-colors duration-500",
              isUser ? "text-foreground/80 font-medium" : "text-foreground"
            )}>
              {isUser ? (
                <p className="whitespace-pre-wrap">{content}</p>
              ) : (
                <div className="prose-chat max-w-none">
                  <MarkdownRenderer content={content} isStreaming={isStreaming} />
                </div>
              )}
            </div>
          )}

          {!isEditing && !isStreaming && content && (
            <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-0.5 group-hover:translate-y-0">
              <div className="flex items-center gap-1 p-0.5 rounded-md border border-border/10 bg-background/30 backdrop-blur-sm shadow-sm">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCopy}
                      className={cn('h-7 w-7 rounded-md transition-all', copied && 'text-emerald-500 bg-emerald-500/10')}
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-[8px] font-black uppercase tracking-widest">Clone Data</TooltipContent>
                </Tooltip>

                {isUser && canEdit && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsEditing(true)}
                        className="h-7 w-7 rounded-md hover:text-primary hover:bg-primary/10"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-[8px] font-black uppercase tracking-widest">Edit Transmission</TooltipContent>
                  </Tooltip>
                )}

                {!isUser && (
                  <>
                    <div className="w-px h-3 bg-border/10 mx-0.5" />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
                          className={cn('h-7 w-7 rounded-md transition-all', feedback === 'up' && 'text-emerald-500 bg-emerald-500/10')}
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-[8px] font-black uppercase tracking-widest">Verify</TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
                          className={cn('h-7 w-7 rounded-md transition-all', feedback === 'down' && 'text-rose-500 bg-rose-500/10')}
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-[8px] font-black uppercase tracking-widest">Flag</TooltipContent>
                    </Tooltip>
                  </>
                )}
              </div>
              
              {!isUser && (
                <div className="flex items-center gap-2 ml-1">
                  <span className="text-[7px] font-mono text-muted-foreground/20 uppercase tracking-[0.1em]">INTEGRITY_CHECK_PASSED</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
