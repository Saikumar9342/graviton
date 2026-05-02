'use client'

import { Plus, MessageSquare, Trash2, ChevronLeft, ChevronRight, Hash, Clock, Settings2, Terminal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Chat } from '@/lib/types'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatDistanceToNow } from 'date-fns'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

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
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/5 bg-black/60 backdrop-blur-3xl transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] md:relative',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          isCollapsed ? 'w-[70px]' : 'w-[260px]'
        )}
      >
        {/* Sidebar Header - Instrumentation Panel */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-white/5 bg-white/5">
          {!isCollapsed && (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-1000">
              <div className="h-6 w-6 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center relative overflow-hidden group">
                <Terminal className="h-3 w-3 text-primary relative z-10" />
                <div className="absolute inset-0 bg-primary/20 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/90">
                  GRAVITON
                </span>
                <span className="text-[6px] font-black uppercase tracking-[0.5em] text-primary/40 mt-0.5">
                  OS_KERNEL_v2
                </span>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className={cn(
              "h-7 w-7 rounded-lg hover:bg-primary/10 text-muted-foreground/30 hover:text-primary transition-all duration-500",
              isCollapsed && "mx-auto"
            )}
          >
            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </Button>
        </div>

        {/* Initialization Command */}
        <div className="p-4">
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onNewChat}
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 mx-auto rounded-xl border-dashed border-primary/40 hover:border-primary hover:bg-primary/10 hover:text-primary transition-all duration-500 bg-black/40 group relative overflow-hidden"
                >
                  <Plus className="h-4 w-4 relative z-10" />
                  <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-[8px] font-black uppercase tracking-[0.2em] bg-black border-white/10">INIT_CORE</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              onClick={onNewChat}
              className="w-full justify-start gap-3 h-10 px-3 rounded-lg bg-primary text-primary-foreground hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 shadow-xl shadow-primary/20 border-t border-white/30 group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="h-5 w-5 rounded bg-white/20 flex items-center justify-center relative z-10">
                <Plus className="h-3 w-3" />
              </div>
              <span className="font-black text-[9px] uppercase tracking-[0.2em] relative z-10">Initialize_Protocol</span>
            </Button>
          )}
        </div>

        <div className="px-4 mb-2">
          <div className="h-px bg-white/5 w-full" />
        </div>

        {/* Protocol Logs */}
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1 pb-4">
            {!isCollapsed && (
              <div className="flex items-center justify-between px-2 py-2 mb-1">
                <span className="text-[7px] font-black uppercase tracking-[0.3em] text-muted-foreground/20">
                  Active_Logs
                </span>
                <div className="h-1 w-1 rounded-full bg-primary/20 animate-pulse" />
              </div>
            )}
            
            {chats.map((chat) => (
              <div key={chat.id} className="group relative">
                {isCollapsed ? (
                  <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onSelectChat(chat.id)}
                        className={cn(
                          'h-10 w-10 mx-auto rounded-xl transition-all duration-500 relative overflow-hidden',
                          currentChatId === chat.id
                            ? 'bg-primary/20 text-primary border border-primary/40'
                            : 'text-muted-foreground/20 hover:bg-white/5 hover:text-foreground'
                        )}
                      >
                        <Hash className={cn("h-3.5 w-3.5", currentChatId === chat.id ? "animate-pulse" : "")} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-black border-white/10 p-2 rounded-lg">
                      <p className="font-black text-[9px] uppercase tracking-widest">{chat.title}</p>
                    </TooltipContent>
                  </Tooltip>
                  </TooltipProvider>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => onSelectChat(chat.id)}
                    className={cn(
                      'w-full justify-start gap-3 h-10 px-2.5 rounded-lg transition-all duration-300 group overflow-hidden relative border',
                      currentChatId === chat.id
                        ? 'bg-primary/10 text-primary border-primary/30 shadow-lg shadow-primary/5'
                        : 'text-muted-foreground/40 hover:bg-white/5 hover:text-foreground border-transparent hover:border-white/5'
                    )}
                  >
                    <div className={cn(
                      "h-6 w-6 rounded flex items-center justify-center transition-all",
                      currentChatId === chat.id ? "bg-primary/20" : "bg-white/5 opacity-40 group-hover:opacity-100"
                    )}>
                      <MessageSquare className="h-3 w-3" />
                    </div>

                    <div className="flex flex-col flex-1 truncate text-left">
                      <span className="truncate text-[9px] font-black uppercase tracking-wider">
                        {chat.title}
                      </span>
                      <span className="text-[6px] font-bold text-muted-foreground/30 uppercase tracking-widest">
                        Node_ID: {chat.id.slice(0, 8)}
                      </span>
                    </div>
                    
                    {currentChatId !== chat.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteChat(chat.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 rounded hover:bg-destructive/10 hover:text-destructive transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* System Diagnostics Footer */}
        <div className="p-4 border-t border-white/5 bg-black/40 space-y-4">
          {!isCollapsed && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[7px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">Neural_Load</span>
                <span className="text-[7px] font-black uppercase tracking-[0.3em] text-primary/60">Optimized</span>
              </div>
              <div className="flex gap-0.5 h-4 items-end overflow-hidden px-1">
                {[3, 6, 4, 7, 5, 8, 4, 6, 9, 5, 7, 3, 6, 4, 8, 5].map((h, i) => (
                  <div 
                    key={i} 
                    className="flex-1 bg-primary/20 rounded-t-[0.5px] transition-colors duration-500" 
                    style={{ 
                      height: `${h * 10}%`,
                      animation: `neural-pulse ${1.5 + Math.random()}s ease-in-out infinite`,
                      animationDelay: `${i * 0.1}s`
                    }} 
                  />
                ))}
              </div>
            </div>
          )}

          {!isCollapsed ? (
            <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 group cursor-pointer hover:border-primary/30 transition-all duration-500">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-black/40 flex items-center justify-center border border-white/10 group-hover:border-primary/20 relative overflow-hidden">
                  <Settings2 className="h-3.5 w-3.5 text-primary/40 group-hover:text-primary transition-colors" />
                  <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-foreground/70">System_Config</span>
                  <span className="text-[6px] font-bold text-muted-foreground/30 uppercase tracking-[0.3em]">Hardware_Link</span>
                </div>
              </div>
              <ChevronRight className="h-3 w-3 text-muted-foreground/20 group-hover:text-primary transition-all" />
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 mx-auto rounded-xl text-muted-foreground/30 hover:text-primary hover:bg-primary/10"
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-[8px] font-black uppercase tracking-widest bg-black border-white/10">SYS_CONFIG</TooltipContent>
            </Tooltip>
          )}
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}
    </TooltipProvider>
  )
}
