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
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  getSettings,
  saveSettings,
  generateId,
  generateTitle,
} from '@/lib/chat-store'
import { fetchChats, createChat, deleteChat as apiDeleteChat, fetchMessages } from '@/lib/api'
import { Chat, Settings, DEFAULT_SETTINGS } from '@/lib/types'
import { cn } from '@/lib/utils'

function getUIMessageText(msg: UIMessage): string {
  if (!msg.parts || !Array.isArray(msg.parts)) return ''
  return msg.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('')
}

export function ChatInterface() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Initialize data from backend and localStorage
  useEffect(() => {
    setMounted(true)
    
    // Fetch chats from backend
    fetchChats().then(setChats).catch(console.error)

    const savedSettings = getSettings()
    setSettings(savedSettings)
    
    // Load sidebar state
    const savedSidebarState = localStorage.getItem('sidebar-collapsed')
    if (savedSidebarState) {
      setIsSidebarCollapsed(savedSidebarState === 'true')
    }
    
    // Apply settings to document
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
      prepareSendMessagesRequest: ({ messages }) => ({
        body: {
          messages,
          model: settings.model,
          chatId: currentChatId,
        },
      }),
    }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Note: We'll rely on the backend to persist messages eventually.
  // For now, we still keep the UI updated.
  useEffect(() => {
    if (currentChatId && messages.length > 0) {
      setChats((prev) =>
        prev.map((c) => 
          c.id === currentChatId 
            ? { ...c, updatedAt: new Date() } 
            : c
        )
      )
    }
  }, [messages, currentChatId])

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
      const chat = chats.find((c) => c.id === id)
      if (chat) {
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
          // Fallback to empty messages or existing local messages if any
          setMessages([])
        }
      }
    },
    [chats, setMessages]
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
    async (content: string) => {
      let chatId = currentChatId

      // Create new chat in backend if needed
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
      sendMessage({ text: content })
    },
    [currentChatId, sendMessage]
  )

  const handleEditMessage = useCallback(
    (messageId: string, newContent: string) => {
      // Find the message index
      const messageIndex = messages.findIndex((m) => m.id === messageId)
      if (messageIndex === -1) return

      // Remove all messages from this point forward
      const newMessages = messages.slice(0, messageIndex)
      setMessages(newMessages)

      // Send the edited message
      setTimeout(() => {
        handleSend(newContent)
      }, 100)
    },
    [messages, setMessages, handleSend]
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

  const toggleCollapse = () => {
    const newState = !isSidebarCollapsed
    setIsSidebarCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', String(newState))
  }

  const getBackgroundClass = () => {
    if (!settings.animationsEnabled) return 'bg-background'
    
    switch (settings.backgroundStyle) {
      case 'aurora':
        return 'bg-aurora'
      case 'mesh':
        return 'bg-mesh'
      case 'gradient':
        return 'bg-gradient-to-br from-background via-background to-primary/5'
      default:
        return 'bg-background'
    }
  }

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-xl bg-primary/20 animate-pulse" />
            <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">Loading Graviton AI...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex h-screen overflow-hidden', getBackgroundClass())}>
      {/* Sidebar */}
      <ChatSidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        isOpen={sidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={toggleCollapse}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <ChatHeader
          onToggleSidebar={toggleSidebar}
          settings={settings}
          onSaveSettings={handleSaveSettings}
        />

        {/* Messages */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto scrollbar-thin"
        >
          {messages.length === 0 ? (
            <EmptyState onSuggestionClick={handleSend} />
          ) : (
            <div className="pb-32">
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

        {/* Error display */}
        {error && (
          <div className="border-t border-border bg-card/80 backdrop-blur-sm p-4">
            <Alert variant="destructive" className="mx-auto max-w-3xl glass">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>
                  {error.message || 'Something went wrong. Please try again.'}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const lastUserMessage = [...messages]
                      .reverse()
                      .find((m) => m.role === 'user')
                    if (lastUserMessage) {
                      handleSend(getUIMessageText(lastUserMessage))
                    }
                  }}
                  className="ml-4 gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border/50 bg-background/80 backdrop-blur-xl p-4">
          <div className="mx-auto max-w-3xl">
            <ChatInput
              onSend={handleSend}
              onStop={stop}
              isLoading={isLoading}
              settings={settings}
              onSettingsChange={handleSaveSettings}
            />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Graviton AI can make mistakes. Please verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
