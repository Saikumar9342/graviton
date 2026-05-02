'use client'

import { Plus, MessageSquare, Trash2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Chat } from '@/lib/types'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDistanceToNow } from 'date-fns'

interface ChatSidebarProps {
  chats: Chat[]
  currentChatId: string | null
  onSelectChat: (id: string) => void
  onNewChat: () => void
  onDeleteChat: (id: string) => void
  isOpen: boolean
  isCollapsed: boolean
  onClose: () => void
  onToggleCollapse: () => void
}

export function ChatSidebar({
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  isOpen,
  isCollapsed,
  onClose,
  onToggleCollapse,
}: ChatSidebarProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border/50 bg-sidebar transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] md:relative',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          isCollapsed ? 'w-[60px]' : 'w-[240px]'
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between px-3 border-b border-border/50">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold text-foreground">Graviton</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className={cn(
              'h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground shrink-0',
              isCollapsed && 'mx-auto'
            )}
          >
            {isCollapsed
              ? <ChevronRight className="h-3.5 w-3.5" />
              : <ChevronLeft className="h-3.5 w-3.5" />
            }
          </Button>
        </div>

        {/* New Chat */}
        <div className="p-3">
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onNewChat}
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 mx-auto rounded-xl border-dashed hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs font-medium">New chat</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              onClick={onNewChat}
              className="w-full justify-start gap-2 h-9 text-sm font-medium rounded-xl bg-primary/10 text-primary hover:bg-primary/15 border-none shadow-none"
            >
              <Plus className="h-4 w-4 shrink-0" />
              New chat
            </Button>
          )}
        </div>

        {/* Recent chats */}
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-0.5 pb-4">
            {!isCollapsed && chats.length > 0 && (
              <p className="px-2 py-1.5 text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wider">
                Recent
              </p>
            )}

            {chats.map((chat) => (
              <div key={chat.id} className="group relative">
                {isCollapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onSelectChat(chat.id)}
                        className={cn(
                          'h-9 w-9 mx-auto rounded-xl transition-all',
                          currentChatId === chat.id
                            ? 'bg-primary/15 text-primary'
                            : 'text-muted-foreground/50 hover:text-foreground hover:bg-muted/50'
                        )}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs font-medium max-w-[200px] truncate">
                      {chat.title}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <button
                    onClick={() => onSelectChat(chat.id)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all duration-200 group/btn',
                      currentChatId === chat.id
                        ? 'bg-primary/12 text-foreground'
                        : 'text-muted-foreground/70 hover:text-foreground hover:bg-muted/40'
                    )}
                  >
                    <MessageSquare className={cn(
                      'h-3.5 w-3.5 shrink-0 transition-colors',
                      currentChatId === chat.id ? 'text-primary' : 'text-muted-foreground/40'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[13px] font-medium leading-none mb-0.5">{chat.title}</p>
                      <p className="text-[11px] text-muted-foreground/40 leading-none">
                        {formatDistanceToNow(chat.updatedAt, { addSuffix: true })}
                      </p>
                    </div>
                    {currentChatId !== chat.id && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id) }}
                        className="opacity-0 group-hover/btn:opacity-100 h-6 w-6 rounded-lg flex items-center justify-center hover:bg-destructive/10 hover:text-destructive text-muted-foreground/40 transition-all shrink-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </button>
                )}
              </div>
            ))}

            {chats.length === 0 && !isCollapsed && (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground/40">
                No conversations yet
              </p>
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}
    </TooltipProvider>
  )
}
