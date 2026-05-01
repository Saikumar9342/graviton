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
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-md md:hidden animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar/95 backdrop-blur-2xl transition-all duration-500 ease-in-out md:relative md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? 'w-[78px]' : 'w-72'
        )}
      >
        {/* Desktop Collapse Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 z-50 hidden h-7 w-7 rounded-full border border-sidebar-border bg-sidebar shadow-lg md:flex hover:scale-110 transition-all duration-300 group hover:shadow-primary/20"
          onClick={(e) => {
            e.stopPropagation()
            onToggleCollapse()
          }}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-primary group-hover:translate-x-0.5 transition-transform" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-primary group-hover:-translate-x-0.5 transition-transform" />
          )}
        </Button>

        {/* Header */}
        <div className="flex flex-col gap-5 p-5">
          <div className="flex items-center justify-between">
            <div className={cn("flex items-center gap-3 overflow-hidden transition-all duration-500", isCollapsed ? "w-0 opacity-0" : "w-full opacity-100")}>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 cursor-default">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tighter text-foreground leading-none">GRAVITON</span>
                <span className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase mt-0.5">Core v2.4</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 md:hidden hover:bg-sidebar-accent/50 rounded-2xl"
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
              "relative overflow-hidden group justify-start gap-2.5 glow-sm transition-all duration-300 shadow-lg hover:shadow-primary/20",
              isCollapsed ? "h-12 w-12 p-0 justify-center mx-auto rounded-2xl" : "w-full h-11 px-4 rounded-xl"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Plus className={cn("h-5 w-5 transition-transform duration-300 group-hover:rotate-90", isCollapsed ? "h-6 w-6" : "")} />
            {!isCollapsed && <span className="font-bold tracking-tight">New Message</span>}
          </Button>

          {/* Search */}
          {!isCollapsed && (
            <div className="relative group animate-in fade-in slide-in-from-top-4 duration-700">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary group-focus-within:scale-110 transition-all" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history..."
                className="h-11 pl-11 bg-sidebar-accent/30 border-transparent hover:bg-sidebar-accent/50 focus:bg-sidebar-accent/70 focus:ring-2 focus:ring-primary/10 text-sm transition-all duration-300 rounded-2xl placeholder:text-muted-foreground/40 font-medium"
              />
            </div>
          )}
        </div>

        {/* Chat list */}
        <ScrollArea className="flex-1 px-3">
          <div className="pb-6">
            {groupedChats.length === 0 ? (
              !isCollapsed && (
                <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in-95 duration-500">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sidebar-accent/50 text-muted-foreground/30">
                    <Archive className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground/60">
                    {searchQuery ? 'No results found' : 'No history yet'}
                  </p>
                </div>
              )
            ) : (
              <div className="space-y-6">
                {groupedChats.map(([group, groupChats], idx) => (
                  <div key={group} className={cn("animate-in fade-in slide-in-from-bottom-2", `delay-[${idx * 100}ms]`)}>
                    {!isCollapsed && (
                      <h3 className="mb-3 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                        {group}
                      </h3>
                    )}
                    <div className="space-y-1.5">
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
          <div className="p-4 pt-2">
            <div className="rounded-2xl bg-primary/5 p-3 text-center border border-primary/10 glass shadow-inner">
              <p className="text-[10px] font-black tracking-widest text-muted-foreground/60 uppercase">
                <span className="text-primary font-black">{chats.length}</span>{' '}
                Total Chats
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
        'group relative flex items-center gap-3 rounded-2xl px-2.5 py-3 transition-all duration-300 cursor-pointer overflow-hidden',
        isActive
          ? 'bg-primary/10 text-foreground shadow-sm ring-1 ring-primary/20 scale-[1.02]'
          : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground hover:translate-x-1',
        isCollapsed && "justify-center px-0 hover:translate-x-0 hover:scale-110"
      )}
      onClick={onSelect}
    >
      {/* Active Indicator Bar */}
      {isActive && !isCollapsed && (
        <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-r-full shadow-[0_0_10px_rgba(var(--primary),0.5)] z-10" />
      )}

      {/* Background glow for active item */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent animate-in fade-in duration-700" />
      )}

      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-500 shadow-sm z-10',
          isActive 
            ? 'bg-primary text-primary-foreground shadow-primary/30 rotate-0' 
            : 'bg-sidebar-accent/50 text-muted-foreground/60 group-hover:bg-primary/20 group-hover:text-primary group-hover:rotate-12'
        )}
      >
        <MessageSquare
          className={cn(
            'h-5 w-5 transition-transform duration-500',
            isActive ? 'scale-110' : 'group-hover:scale-110'
          )}
        />
      </div>
      
      {!isCollapsed && (
        <>
          <div className="flex flex-1 flex-col overflow-hidden z-10 py-0.5">
            <span className={cn(
              "truncate text-[13px] font-semibold tracking-tight transition-colors duration-300",
              isActive ? "text-foreground" : "text-muted-foreground/90 group-hover:text-foreground"
            )}>
              {chat.title}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                "text-[9px] font-medium uppercase tracking-[0.05em] transition-colors",
                isActive ? "text-primary/70" : "text-muted-foreground/40 group-hover:text-muted-foreground/60"
              )}>
                {new Date(chat.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
              <span className="h-0.5 w-0.5 rounded-full bg-muted-foreground/20" />
              <span className={cn(
                "text-[9px] font-medium uppercase tracking-[0.05em] transition-colors",
                isActive ? "text-primary/70" : "text-muted-foreground/40 group-hover:text-muted-foreground/60"
              )}>
                {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
              </span>
            </div>
          </div>

          {/* Delete Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-8 w-8 shrink-0 rounded-xl transition-all',
                  isActive ? 'opacity-100 bg-primary/5' : 'opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive'
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 p-2 rounded-2xl glass-strong shadow-2xl border-primary/5">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10 gap-3 py-3 rounded-xl cursor-pointer font-black text-[10px] uppercase tracking-[0.2em]"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
              >
                <Trash2 className="h-4 w-4" />
                Purge History
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Active indicator bar */}
          {isActive && (
            <div className="absolute left-0 top-1/2 h-10 w-1.5 -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_15px_var(--primary)]" />
          )}
        </>
      )}

      {/* Collapsed Active Dot */}
      {isCollapsed && isActive && (
        <div className="absolute -left-1 top-1/2 h-8 w-2 -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_10px_var(--primary)]" />
      )}
    </div>
  )
}
