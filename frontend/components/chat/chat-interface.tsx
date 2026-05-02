'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AlertCircle, RefreshCw, Sparkles } from 'lucide-react'
import { ChatHeader } from './chat-header'
import { ChatSidebar } from './chat-sidebar'
import { ChatMessage } from './chat-message'
import { ChatInput } from './chat-input'
import { EmptyState } from './empty-state'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getSettings, saveSettings, generateId, generateTitle } from '@/lib/chat-store'
import { fetchChats, createChat, deleteChat as apiDeleteChat, fetchMessages, fetchModels, ModelInfo } from '@/lib/api'
import { Chat, Settings, DEFAULT_SETTINGS, AVAILABLE_MODELS, MODE_SYSTEM_PROMPTS } from '@/lib/types'
import { cn } from '@/lib/utils'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

function estimateTokens(text: string): number {
  return Math.ceil(text.trim().split(/\s+/).filter(Boolean).length * 1.3)
}

export function ChatInterface() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isDetailsCollapsed, setIsDetailsCollapsed] = useState(true)
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatIdState] = useState<string | null>(null)
  const currentChatIdRef = useRef<string | null>(null)
  const setCurrentChatId = useCallback((id: string | null) => {
    currentChatIdRef.current = id
    setCurrentChatIdState(id)
  }, [])

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>(AVAILABLE_MODELS)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [mounted, setMounted] = useState(false)
  const [lastResponseMs, setLastResponseMs] = useState<number | null>(null)
  const [streamSpeed, setStreamSpeed] = useState<number | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const abortRef = useRef<AbortController | null>(null)
  const pendingResend = useRef<{ content: string; mode: string } | null>(null)

  // Init
  useEffect(() => {
    setMounted(true)
    fetchChats().then(setChats).catch(console.error)
    fetchModels().then((m) => { if (m.length > 0) setAvailableModels(m) }).catch(console.error)
    const saved = getSettings()
    setSettings(saved)
    const sc = localStorage.getItem('sidebar-collapsed')
    if (sc) setIsSidebarCollapsed(sc === 'true')
    const dc = localStorage.getItem('details-collapsed')
    if (dc) setIsDetailsCollapsed(dc === 'true')
    document.documentElement.setAttribute('data-accent', saved.accentColor)
    document.documentElement.setAttribute('data-font-size', saved.fontSize)
  }, [])

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-accent', settings.accentColor)
      document.documentElement.setAttribute('data-font-size', settings.fontSize)
    }
  }, [settings.accentColor, settings.fontSize, mounted])

  // Auto-scroll
  useEffect(() => {
    if (shouldAutoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, shouldAutoScroll])

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
      setShouldAutoScroll(scrollHeight - scrollTop - clientHeight < 100)
    }
  }, [])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    setIsLoading(false)
    setStreamingId(null)
  }, [])

  const handleNewChat = useCallback(() => {
    setCurrentChatId(null)
    setMessages([])
    setError(null)
  }, [setCurrentChatId])

  const handleSelectChat = useCallback(async (id: string) => {
    setCurrentChatId(id)
    setError(null)
    try {
      const backendMessages = await fetchMessages(id)
      setMessages(backendMessages.map((m) => ({ id: m.id, role: m.role, content: m.content })))
    } catch (err) {
      console.error('Failed to fetch messages:', err)
      setMessages([])
    }
  }, [setCurrentChatId])

  const handleDeleteChat = useCallback(async (id: string) => {
    try {
      await apiDeleteChat(id)
      setChats((prev) => prev.filter((c) => c.id !== id))
      if (currentChatIdRef.current === id) handleNewChat()
    } catch (err) {
      console.error('Failed to delete chat:', err)
    }
  }, [handleNewChat])

  const handleSend = useCallback(async (content: string, mode = 'chat') => {
    if (isLoading || !content.trim()) return

    let chatId = currentChatIdRef.current
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

    setError(null)
    setShouldAutoScroll(true)

    const userMsg: Message = { id: generateId(), role: 'user', content }
    const assistantId = generateId()

    // Compute the full message list BEFORE updating state
    const allMsgs = [...messages, userMsg]

    // Update state — add user msg + empty assistant placeholder (shows typing dots)
    setMessages([...allMsgs, { id: assistantId, role: 'assistant', content: '' }])
    setIsLoading(true)
    setStreamingId(assistantId)

    // Start streaming directly — NOT inside setState or setTimeout
    startStream(allMsgs, assistantId, chatId, mode)
  }, [isLoading, messages, setCurrentChatId, settings.model])

  async function startStream(
    allMessages: Message[],
    assistantId: string,
    chatId: string,
    mode: string
  ) {
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages,
          model: settings.model,
          chatId,
          systemPrompt: MODE_SYSTEM_PROMPTS[mode] ?? '',
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const errText = await res.text().catch(() => `Server error (${res.status})`)
        throw new Error(errText)
      }
      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      const streamStart = Date.now()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        const snap = accumulated
        setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: snap } : m))
      }

      const elapsed = Date.now() - streamStart
      setLastResponseMs(elapsed)
      if (elapsed > 0 && accumulated.length > 0) {
        setStreamSpeed(Math.round(accumulated.length / (elapsed / 1000)))
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err)
        // Remove the empty assistant placeholder on error
        setMessages((prev) => prev.filter((m) => !(m.id === assistantId && m.content === '')))
      }
    } finally {
      setIsLoading(false)
      setStreamingId(null)
    }
  }

  // Edit-and-resend via pending ref
  useEffect(() => {
    if (pendingResend.current) {
      const { content, mode } = pendingResend.current
      pendingResend.current = null
      handleSend(content, mode)
    }
  }, [messages, handleSend])

  const handleEditMessage = useCallback((messageId: string, newContent: string) => {
    const idx = messages.findIndex((m) => m.id === messageId)
    if (idx === -1) return
    pendingResend.current = { content: newContent, mode: 'chat' }
    setMessages(messages.slice(0, idx))
  }, [messages])

  const handleRenameChat = useCallback((id: string, title: string) => {
    setChats((prev) => prev.map((c) => c.id === id ? { ...c, title } : c))
  }, [])

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
          <p className="text-xs text-muted-foreground animate-pulse">Loading…</p>
        </div>
      </div>
    )
  }

  const currentModel = availableModels.find((m) => m.id === settings.model) ?? availableModels[0]
  const totalTokens = messages.reduce((acc, m) => acc + estimateTokens(m.content), 0)

  return (
    <div className={cn('relative flex h-[100svh] overflow-hidden bg-background', getBackgroundClass())}>
      {settings.backgroundStyle === 'mesh' && (
        <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" />
      )}

      <ChatSidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
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
          session={{
            model: currentModel?.name,
            userMessages: messages.filter((m) => m.role === 'user').length,
            assistantMessages: messages.filter((m) => m.role === 'assistant').length,
            tokens: totalTokens,
            lastResponseMs: lastResponseMs ?? undefined,
            streamSpeed: streamSpeed ?? undefined,
          }}
        />

        <div className="flex-1 overflow-hidden flex">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex flex-col flex-1 overflow-y-auto scrollbar-none scroll-smooth px-4 sm:px-6"
          >
            {messages.length === 0 ? (
              <EmptyState onSuggestionClick={(text) => handleSend(text)} />
            ) : (
              <div className="pb-36 pt-6 max-w-3xl mx-auto w-full space-y-1">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    isStreaming={message.id === streamingId}
                    canEdit={message.role === 'user' && !isLoading}
                    onEdit={(newContent) => handleEditMessage(message.id, newContent)}
                    compactMode={settings.compactMode}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="absolute bottom-40 left-0 right-0 z-50 px-4 animate-in slide-in-from-bottom-8 duration-700">
            <Alert variant="destructive" className="mx-auto max-w-2xl glass-strong shadow-2xl border-destructive/20 rounded-2xl p-4 overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-destructive" />
              <AlertCircle className="h-5 w-5 text-destructive" />
              <AlertDescription className="flex items-center justify-between gap-6">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">Connection error</span>
                  <span className="text-sm">{error.message || 'Something went wrong. Please try again.'}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setError(null)
                    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
                    if (lastUser) handleSend(lastUser.content)
                  }}
                  className="shrink-0 gap-2 text-xs h-8 rounded-lg px-3"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="relative z-10 px-4 sm:px-6 pt-2 pb-6">
          <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
          <div className="max-w-3xl mx-auto">
            <ChatInput
              onSend={handleSend}
              onStop={stop}
              isLoading={isLoading}
              settings={settings}
              onSettingsChange={handleSaveSettings}
              availableModels={availableModels}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
