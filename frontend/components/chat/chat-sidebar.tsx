'use client'

import { useState } from 'react'
import {
  Plus,
  MessageSquare,
  Trash2,
  MoreHorizontal,
  X,
  Search,
  Sparkles,
  Archive,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Chat } from '@/lib/types'
import { isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns'

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

function groupChatsByDate(chats: Chat[]) {
  const groups: { [key: string]: Chat[] } = {
    Today: [],
    Yesterday: [],
    'This Week': [],
    'This Month': [],
    Older: [],
  }

  chats.forEach((chat) => {
    const date = new Date(chat.updatedAt)
    if (isToday(date)) {
      groups['Today'].push(chat)
    } else if (isYesterday(date)) {
      groups['Yesterday'].push(chat)
    } else if (isThisWeek(date)) {
      groups['This Week'].push(chat)
    } else if (isThisMonth(date)) {
      groups['This Month'].push(chat)
    } else {
      groups['Older'].push(chat)
    }
  })

  return Object.entries(groups).filter(([, chats]) => chats.length > 0)
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
  const [searchQuery, setSearchQuery] = useState('')

  const filteredChats = searchQuery
    ? chats.filter((chat) =>
        chat.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : chats

  const groupedChats = groupChatsByDate(filteredChats)

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar/95 backdrop-blur-xl transition-all duration-300 ease-in-out md:relative md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? 'w-[70px]' : 'w-72'
        )}
      >
        {/* Desktop Collapse Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 z-50 hidden h-6 w-6 rounded-full border border-sidebar-border bg-sidebar shadow-sm md:flex"
          onClick={(e) => {
            e.stopPropagation()
            onToggleCollapse()
          }}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </Button>
        {/* Header */}
        <div className="flex flex-col gap-3 p-3">
          <div className="flex items-center justify-between px-1">
            <div className={cn("flex items-center gap-2.5 overflow-hidden transition-all duration-500 ease-in-out", isCollapsed ? "w-0 opacity-0" : "w-full opacity-100")}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 shadow-inner glow-sm transition-transform hover:scale-110">
                <Sparkles className="h-5 w-5 text-primary animate-pulse-slow" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-foreground/90 truncate">Graviton AI</span>
                <span className="text-[10px] font-medium text-muted-foreground/60 leading-tight">Intelligent Workspace</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 md:hidden hover:bg-sidebar-accent/50 rounded-xl"
              onClick={onClose}
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>

          {/* New Chat Button */}
          <Button
            onClick={() => {
              onNewChat()
              if (window.innerWidth < 768) onClose()
            }}
            size={isCollapsed ? "icon" : "default"}
            className={cn(
              "justify-start gap-2 glow-sm transition-all duration-300",
              isCollapsed ? "h-11 w-11 p-0 justify-center mx-auto" : "w-full"
            )}
          >
            <Plus className={cn("h-4 w-4", isCollapsed && "h-5 w-5")} />
            {!isCollapsed && <span>New Chat</span>}
          </Button>

          {/* Search */}
          {!isCollapsed && (
            <div className="relative group animate-in fade-in slide-in-from-top-2 duration-500">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history..."
                className="h-9 pl-9 bg-sidebar-accent/30 border-transparent hover:bg-sidebar-accent/50 focus:bg-sidebar-accent/80 focus:border-primary/20 text-xs transition-all duration-300 rounded-xl"
              />
            </div>
          )}
        </div>

        {/* Chat list */}
        <ScrollArea className="flex-1 px-2">
          <div className="pb-4">
            {groupedChats.length === 0 ? (
              !isCollapsed && (
                <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in-95 duration-300">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                    <Archive className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {searchQuery ? 'No chats found' : 'No conversations'}
                  </p>
                </div>
              )
            ) : (
              <div className="space-y-4">
                {groupedChats.map(([group, groupChats]) => (
                  <div key={group}>
                    {!isCollapsed && (
                      <h3 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 animate-in slide-in-from-left duration-300">
                        {group}
                      </h3>
                    )}
                    <div className="space-y-1">
                      {groupChats.map((chat) => (
                        <ChatItem
                          key={chat.id}
                          chat={chat}
                          isCollapsed={isCollapsed}
                          isActive={chat.id === currentChatId}
                          onSelect={() => {
                            onSelectChat(chat.id)
                            if (window.innerWidth < 768) onClose()
                          }}
                          onDelete={() => onDeleteChat(chat.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        {!isCollapsed && (
          <div className="border-t border-sidebar-border p-3">
            <div className="rounded-lg bg-primary/5 p-2 text-center glass">
              <p className="text-[10px] text-muted-foreground">
                <span className="font-bold text-primary">{chats.length}</span>{' '}
                CONVERSATIONS
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}

interface ChatItemProps {
  chat: Chat
  isActive: boolean
  isCollapsed: boolean
  onSelect: () => void
  onDelete: () => void
}

function ChatItem({ chat, isActive, isCollapsed, onSelect, onDelete }: ChatItemProps) {
  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 rounded-xl px-2 py-2.5 transition-all duration-300 cursor-pointer',
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-md glow-sm scale-[1.02]'
          : 'text-sidebar-foreground hover:bg-sidebar-accent/40',
        isCollapsed && "justify-center px-0"
      )}
      onClick={onSelect}
      title={isCollapsed ? chat.title : undefined}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300 shadow-sm',
          isActive ? 'bg-primary text-primary-foreground shadow-primary/20 rotate-0' : 'bg-sidebar-accent/50 text-muted-foreground group-hover:bg-sidebar-accent/80'
        )}
      >
        <MessageSquare
          className={cn(
            'h-4 w-4 transition-transform duration-300',
            isActive ? 'scale-110' : 'group-hover:scale-110'
          )}
        />
      </div>
      
      {!isCollapsed && (
        <>
          <span className={cn(
            "flex-1 truncate text-[13.5px] font-medium tracking-tight transition-colors duration-300 animate-in fade-in slide-in-from-left-2",
            isActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground"
          )}>
            {chat.title}
          </span>

          {/* Active indicator */}
          {isActive && (
            <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-7 w-7 shrink-0 transition-opacity',
                  isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive gap-2"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  )
}
