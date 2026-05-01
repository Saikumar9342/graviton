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
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar/95 backdrop-blur-3xl transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] md:relative md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? 'md:w-[80px]' : 'md:w-[300px]',
          'w-[280px]' // Fixed width for mobile overlay
        )}
      >
        {/* Desktop Collapse Toggle - Enhanced positioning and styling */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3.5 top-24 z-50 hidden h-7 w-7 rounded-full border border-sidebar-border bg-sidebar shadow-2xl md:flex hover:scale-125 active:scale-90 transition-all duration-500 group hover:shadow-primary/40 hover:border-primary/50"
          onClick={(e) => {
            e.stopPropagation()
            onToggleCollapse()
          }}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-primary transition-transform group-hover:-translate-x-0.5" />
          )}
        </Button>

        {/* Header Section */}
        <div className="flex flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div className={cn("flex items-center gap-3.5 overflow-hidden transition-all duration-700", isCollapsed ? "w-0 opacity-0" : "w-full opacity-100")}>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-xl shadow-primary/20 transition-all hover:scale-110 active:scale-95 cursor-default relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Sparkles className="h-5.5 w-5.5 text-primary-foreground relative z-10" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xl font-bold tracking-tight text-foreground leading-none">Graviton</span>
                <span className="text-[10px] font-medium text-primary/70 tracking-[0.2em] uppercase mt-1 flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--primary)]" />
                  Interface v2
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 md:hidden hover:bg-sidebar-accent/50 rounded-2xl transition-all active:scale-90"
              onClick={onClose}
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>

          {/* New Chat Button - Refined aesthetics */}
          <Button
            onClick={() => {
              onNewChat()
              if (window.innerWidth < 768) onClose()
            }}
            size={isCollapsed ? "icon" : "default"}
            className={cn(
              "relative overflow-hidden group justify-start gap-4 transition-all duration-700 shadow-2xl hover:shadow-primary/30 active:scale-95",
              isCollapsed 
                ? "h-14 w-14 p-0 justify-center mx-auto rounded-[18px]" 
                : "w-full h-13 px-5 rounded-[20px] bg-primary text-primary-foreground font-bold tracking-tight"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">
              <Plus className={cn("h-4 w-4 transition-transform duration-700 group-hover:rotate-180", isCollapsed ? "h-5 w-5" : "")} />
            </div>
            {!isCollapsed && <span className="text-xs font-semibold tracking-tight">New Transmission</span>}
          </Button>

          {/* Search Bar - Better integration */}
          {!isCollapsed && (
            <div className="relative group animate-in fade-in slide-in-from-top-4 duration-700">
              <Search className="absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-all duration-300" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Recall transmission..."
                className="h-11 pl-10 bg-sidebar-accent/5 border-border/10 hover:border-primary/20 focus:bg-sidebar-accent/10 focus:border-primary/30 focus:ring-0 text-[12px] transition-all duration-300 rounded-xl placeholder:text-muted-foreground/30 font-semibold tracking-tight"
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
                  <div key={group} className={cn("animate-in fade-in slide-in-from-bottom-2 duration-700")}>
                    {!isCollapsed && (
                      <div className="flex items-center gap-3 mb-3 mt-8 px-4 first:mt-2">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 whitespace-nowrap">
                          {group}
                        </h3>
                        <div className="h-px w-full bg-gradient-to-r from-primary/20 via-primary/5 to-transparent" />
                      </div>
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
          ? 'bg-primary/10 text-foreground shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] ring-1 ring-primary/20'
          : 'text-muted-foreground/60 hover:bg-sidebar-accent/30 hover:text-foreground',
        isCollapsed && "justify-center px-0 hover:translate-x-0 hover:scale-105"
      )}
      onClick={onSelect}
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] transition-all duration-500 shadow-sm z-10',
          isActive 
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 rotate-3' 
            : 'bg-sidebar-accent/40 text-muted-foreground/40 group-hover:bg-primary/20 group-hover:text-primary group-hover:-rotate-3'
        )}
      >
        <MessageSquare
          className={cn(
            'h-4.5 w-4.5 transition-transform duration-500',
            isActive ? 'scale-110' : 'group-hover:scale-110'
          )}
        />
      </div>
      
      {!isCollapsed && (
        <>
          <div className="flex flex-1 flex-col overflow-hidden z-10 pr-2">
            <span className={cn(
              "truncate text-[13px] font-medium tracking-tight transition-colors duration-300",
              isActive ? "text-foreground" : "text-foreground/70 group-hover:text-foreground"
            )}>
              {chat.title}
            </span>
            <div className="flex items-center gap-2 mt-1 opacity-40 group-hover:opacity-70 transition-all duration-500">
              <span className="text-[9px] font-medium uppercase tracking-wider">
                {new Date(chat.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
              <span className="h-0.5 w-0.5 rounded-full bg-current opacity-30" />
              <span className="text-[9px] font-medium uppercase tracking-wider">
                {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
              </span>
            </div>
          </div>

          {/* More Actions Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-8 w-8 shrink-0 rounded-xl transition-all',
                  isActive ? 'opacity-100 bg-primary/5' : 'opacity-0 group-hover:opacity-100 hover:bg-primary/10'
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 p-2 rounded-2xl glass-strong shadow-2xl border-primary/10 animate-in zoom-in-95 duration-300">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10 gap-3 py-3 rounded-xl cursor-pointer font-black text-[10px] uppercase tracking-[0.2em] transition-all"
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

          {/* Active indicator bar - Premium Glow */}
          {isActive && (
            <div className="absolute left-0 top-1/2 h-10 w-1 -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_15px_var(--primary)] animate-pulse" />
          )}
        </>
      )}

      {/* Collapsed Active Indicator */}
      {isCollapsed && isActive && (
        <div className="absolute -left-1 top-1/2 h-8 w-2 -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_10px_var(--primary)]" />
      )}
    </div>
  )
}
