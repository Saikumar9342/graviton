'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, UIMessage } from 'ai'
import { AlertCircle, RefreshCw, Sparkles } from 'lucide-react'
import { ChatHeader } from './chat-header'
import { ChatSidebar } from './chat-sidebar'
import { ChatMessage } from './chat-message'
import { ChatInput } from './chat-input'
import { EmptyState } from './empty-state'
import { ChatDetails } from './chat-details'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  getSettings,
  saveSettings,
  generateId,
  generateTitle,
} from '@/lib/chat-store'
import { fetchChats, createChat, deleteChat as apiDeleteChat, fetchMessages, fetchModels } from '@/lib/api'
import { Chat, Settings, DEFAULT_SETTINGS, AVAILABLE_MODELS, MODE_SYSTEM_PROMPTS } from '@/lib/types'
import { cn } from '@/lib/utils'

function getUIMessageText(msg: UIMessage): string {
  if (!msg.parts || !Array.isArray(msg.parts)) return ''
  return msg.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('')
}

function estimateTokens(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.ceil(words * 1.3)
}

export function ChatInterface() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isDetailsCollapsed, setIsDetailsCollapsed] = useState(true)
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [availableModels, setAvailableModels] = useState(AVAILABLE_MODELS)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const [mounted, setMounted] = useState(false)
  const pendingResend = useRef<string | null>(null)

  // Initialize data from backend and localStorage
  useEffect(() => {
    setMounted(true)

    fetchChats().then(setChats).catch(console.error)

    fetchModels()
      .then((models) => {
        if (models.length > 0) setAvailableModels(models)
      })
      .catch(console.error)

    const savedSettings = getSettings()
    setSettings(savedSettings)

    const savedSidebarState = localStorage.getItem('sidebar-collapsed')
    if (savedSidebarState) setIsSidebarCollapsed(savedSidebarState === 'true')

    const savedDetailsState = localStorage.getItem('details-collapsed')
    if (savedDetailsState) setIsDetailsCollapsed(savedDetailsState === 'true')

    document.documentElement.setAttribute('data-accent', savedSettings.accentColor)
    document.documentElement.setAttribute('data-font-size', savedSettings.fontSize)
  }, [])

  // Apply accent color and font size when settings change
  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-accent', settings.accentColor)
      document.documentElement.setAttribute('data-font-size', settings.fontSize)
    }
  }, [settings.accentColor, settings.fontSize, mounted])

  const {
    messages,
    sendMessage,
    setMessages,
    status,
    error,
    stop,
  } = useChat({
    id: currentChatId || undefined,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      prepareSendMessagesRequest: ({ messages, body }) => ({
        body: {
          messages,
          model: settings.model,
          chatId: currentChatId,
          systemPrompt: (body as { systemPrompt?: string })?.systemPrompt ?? '',
        },
      }),
    }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Auto-scroll to bottom
  useEffect(() => {
    if (shouldAutoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, shouldAutoScroll])

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
      setShouldAutoScroll(isAtBottom)
    }
  }, [])

  const handleNewChat = useCallback(() => {
    setCurrentChatId(null)
    setMessages([])
  }, [setMessages])

  const handleSelectChat = useCallback(
    async (id: string) => {
      setCurrentChatId(id)
      try {
        const backendMessages = await fetchMessages(id)
        setMessages(
          backendMessages.map((m) => ({
            id: m.id,
            role: m.role,
            parts: [{ type: 'text' as const, text: m.content }],
          }))
        )
      } catch (err) {
        console.error('Failed to fetch messages:', err)
        setMessages([])
      }
    },
    [setMessages]
  )

  const handleDeleteChat = useCallback(
    async (id: string) => {
      try {
        await apiDeleteChat(id)
        setChats((prev) => prev.filter((c) => c.id !== id))
        if (currentChatId === id) {
          handleNewChat()
        }
      } catch (err) {
        console.error('Failed to delete chat:', err)
      }
    },
    [currentChatId, handleNewChat]
  )

  const handleSend = useCallback(
    async (content: string, mode = 'chat') => {
      let chatId = currentChatId
      if (!chatId) {
        try {
          const newChat = await createChat(generateTitle(content))
          setChats((prev) => [newChat, ...prev])
          setCurrentChatId(newChat.id)
          chatId = newChat.id
        } catch (err) {
          console.error('Failed to create chat:', err)
          return
        }
      }
      setShouldAutoScroll(true)
      sendMessage(
        { text: content },
        { body: { systemPrompt: MODE_SYSTEM_PROMPTS[mode] ?? '' } }
      )
    },
    [currentChatId, sendMessage]
  )

  // Effect-based resend after message trim — avoids the setTimeout race condition
  useEffect(() => {
    if (pendingResend.current !== null) {
      const content = pendingResend.current
      pendingResend.current = null
      handleSend(content)
    }
  }, [messages, handleSend])

  const handleEditMessage = useCallback(
    (messageId: string, newContent: string) => {
      const messageIndex = messages.findIndex((m) => m.id === messageId)
      if (messageIndex === -1) return
      pendingResend.current = newContent
      setMessages(messages.slice(0, messageIndex))
    },
    [messages, setMessages]
  )

  const handleSaveSettings = useCallback((newSettings: Settings) => {
    saveSettings(newSettings)
    setSettings(newSettings)
  }, [])

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(!sidebarOpen)
    } else {
      const newState = !isSidebarCollapsed
      setIsSidebarCollapsed(newState)
      localStorage.setItem('sidebar-collapsed', String(newState))
    }
  }

  const toggleDetails = () => {
    const newState = !isDetailsCollapsed
    setIsDetailsCollapsed(newState)
    localStorage.setItem('details-collapsed', String(newState))
  }

  const getBackgroundClass = () => {
    if (!settings.animationsEnabled) return 'bg-background'
    switch (settings.backgroundStyle) {
      case 'aurora': return 'bg-aurora'
      case 'mesh': return 'bg-mesh'
      case 'gradient': return 'bg-gradient-to-br from-background via-background to-primary/5'
      default: return 'bg-background'
    }
  }

  if (!mounted) {
    return (
      <div className="flex h-[100svh] items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] animate-pulse">Initializing</p>
        </div>
      </div>
    )
  }

  const currentModel = availableModels.find(m => m.id === settings.model) ?? availableModels[0]
  const totalTokens = messages.reduce((acc, m) => acc + estimateTokens(getUIMessageText(m)), 0)

  return (
    <div className={cn('relative flex h-[100svh] overflow-hidden bg-background', getBackgroundClass())}>
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-noise pointer-events-none z-[1]" />

      {/* Dynamic Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none z-[2] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_2px,3px_100%] opacity-10" />

      <ChatSidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        isOpen={sidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={toggleSidebar}
      />

      <main className="relative flex flex-1 flex-col overflow-hidden z-[2]">
        <ChatHeader
          onToggleSidebar={toggleSidebar}
          isSidebarCollapsed={isSidebarCollapsed}
          settings={settings}
          onSaveSettings={handleSaveSettings}
        />

        <div className="flex-1 overflow-hidden flex">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto scrollbar-none scroll-smooth px-4 sm:px-8"
          >
            {messages.length === 0 ? (
              <EmptyState onSuggestionClick={(text) => handleSend(text)} />
            ) : (
              <div className="pb-40 pt-6 max-w-4xl mx-auto w-full space-y-2">
                {messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    role={message.role as 'user' | 'assistant'}
                    content={getUIMessageText(message)}
                    isStreaming={
                      isLoading &&
                      index === messages.length - 1 &&
                      message.role === 'assistant'
                    }
                    canEdit={message.role === 'user'}
                    onEdit={(newContent) => handleEditMessage(message.id, newContent)}
                    bubbleStyle={settings.bubbleStyle}
                    compactMode={settings.compactMode}
                  />
                ))}
              </div>
            )}
          </div>

          <ChatDetails
            isCollapsed={isDetailsCollapsed}
            onToggle={toggleDetails}
            model={currentModel?.name}
            tokens={totalTokens}
          />
        </div>

        {error && (
          <div className="absolute bottom-40 left-0 right-0 z-50 px-4 animate-in slide-in-from-bottom-8 duration-700">
            <Alert variant="destructive" className="mx-auto max-w-2xl glass-strong shadow-2xl border-destructive/20 rounded-2xl p-4 overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-destructive" />
              <AlertCircle className="h-5 w-5 text-destructive" />
              <AlertDescription className="flex items-center justify-between gap-6">
                <div className="flex flex-col gap-1">
                  <span className="font-black text-[10px] uppercase tracking-widest text-destructive/60">System Alert</span>
                  <span className="font-semibold text-sm">
                    {error.message || 'The neural link was interrupted.'}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')
                    if (lastUserMessage) handleSend(getUIMessageText(lastUserMessage))
                  }}
                  className="shrink-0 bg-destructive/5 hover:bg-destructive/10 border-destructive/20 gap-2 font-bold uppercase tracking-tighter text-[10px] h-9 rounded-xl px-4 transition-all"
                >
                  <RefreshCw className="h-3 w-3" />
                  Sync Neural Link
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="w-full max-w-4xl mx-auto px-4 sm:px-8 pt-4 pb-6 sm:pb-10 relative z-10">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-3xl -z-10 mask-gradient-to-t" />
          <ChatInput
            onSend={handleSend}
            onStop={stop}
            isLoading={isLoading}
            settings={settings}
            onSettingsChange={handleSaveSettings}
            availableModels={availableModels}
          />

          <div className="flex items-center justify-center gap-6 mt-6 opacity-20 hover:opacity-50 transition-all duration-1000">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-foreground/50 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[9px] font-black tracking-[0.4em] uppercase whitespace-nowrap text-foreground/60">
                Graviton Core OS // Neural v2.5.4
              </span>
            </div>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-foreground/50 to-transparent" />
          </div>
        </div>
      </main>
    </div>
  )
}
