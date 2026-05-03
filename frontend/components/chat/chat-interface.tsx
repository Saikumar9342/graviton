'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { ChatHeader } from './chat-header'
import { ChatSidebar } from './chat-sidebar'
import { ChatMessage } from './chat-message'
import { ChatInput } from './chat-input'
import { EmptyState } from './empty-state'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { generateId, generateTitle } from '@/lib/chat-store'
import { 
  fetchChats, 
  fetchMessages, 
  createChat, 
  deleteChat as apiDeleteChat, 
  renameChat,
  generateChatTitle
} from '@/lib/api'
import { Chat, Settings, MODE_SYSTEM_PROMPTS } from '@/lib/types'
import { useSettingsStore, useModelsStore } from '@/lib/store'
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
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatIdState] = useState<string | null>(null)
  const currentChatIdRef = useRef<string | null>(null)
  const setCurrentChatId = useCallback((id: string | null) => {
    currentChatIdRef.current = id
    setCurrentChatIdState(id)
  }, [])

  const { settings, save: saveSettings, load: loadSettings } = useSettingsStore()
  const { models: registeredModels, load: loadModels } = useModelsStore()

  const availableModels = registeredModels
    .filter((m) => m.is_active)
    .map((m) => {
      let provider = m.provider === 'ollama' ? 'Ollama' : 'Cloud'
      let badge = undefined
      if (m.provider === 'openai-compat') {
        badge = 'Cloud'
        if (m.api_base_url?.includes('groq')) { provider = 'Groq'; badge = 'Fast'; }
        else if (m.api_base_url?.includes('openrouter')) { provider = 'OpenRouter'; badge = 'Pro'; }
        else if (m.api_base_url?.includes('together')) { provider = 'Together AI'; badge = 'Cloud'; }
        else if (m.api_base_url?.includes('nvidia')) { provider = 'NVIDIA'; badge = 'H100'; }
      }
      return { id: m.ollama_name, name: m.display_name, provider, badge }
    })

  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingMessages, setIsFetchingMessages] = useState(false)
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const [activeStreamingIds, setActiveStreamingIds] = useState<Set<string>>(new Set())
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
    const sc = localStorage.getItem('sidebar-collapsed')
    if (sc) setIsSidebarCollapsed(sc === 'true')

    Promise.all([loadSettings(), loadModels(), fetchChats()])
      .then(([, , chats]) => setChats(chats))
      .catch(console.error)
      .finally(() => setMounted(true))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-font-size', settings.fontSize)
      document.documentElement.style.setProperty('--primary', settings.accentColor)
      document.documentElement.style.setProperty('--glow-primary', `${settings.accentColor}4d`)
      document.documentElement.style.setProperty('--radius', `${settings.borderRadius}px`)
      document.documentElement.style.setProperty('--font-sans', settings.fontFamily)
      document.documentElement.style.setProperty('--glass-opacity', String(settings.glassOpacity / 100))
      document.documentElement.style.setProperty('--glow-intensity', String(settings.glowIntensity / 100))
      document.documentElement.style.setProperty('--glass-blur', `${settings.glassBlur}px`)
      document.documentElement.style.setProperty('--border-width', `${settings.borderWidth}px`)
      document.documentElement.style.setProperty('--glow-radius', `${settings.glowRadius}px`)
      document.documentElement.style.setProperty('--sidebar-width', `${settings.sidebarWidth}px`)
      document.documentElement.style.setProperty('--sidebar-padding', `${settings.sidebarPadding}px`)
      document.documentElement.style.setProperty('--chat-max-width', `${settings.chatMaxWidth}px`)
      document.documentElement.style.setProperty('--message-spacing', `${settings.messageSpacing}px`)
      document.documentElement.style.setProperty('--sidebar-opacity', String(settings.sidebarOpacity / 100))
      document.documentElement.style.setProperty('--sidebar-blur', `${settings.sidebarBlur}px`)
      document.documentElement.style.setProperty('--accent-saturation', `${settings.accentSaturation}%`)
      document.documentElement.style.setProperty('--contrast', String(settings.contrast / 100))
      document.documentElement.style.setProperty('--noise-opacity', String(settings.noiseOpacity / 100))
    }
  }, [
    settings.accentColor,
    settings.fontSize,
    settings.borderRadius,
    settings.fontFamily,
    settings.glassOpacity,
    settings.glowIntensity,
    settings.glassBlur,
    settings.borderWidth,
    settings.glowRadius,
    settings.sidebarWidth,
    settings.sidebarPadding,
    settings.chatMaxWidth,
    settings.messageSpacing,
    settings.sidebarOpacity,
    settings.sidebarBlur,
    settings.accentSaturation,
    settings.noiseOpacity,
    mounted
  ])

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
    setIsFetchingMessages(true)
    try {
      const backendMessages = await fetchMessages(id)
      setMessages(backendMessages.map((m) => ({ id: m.id, role: m.role, content: m.content })))
    } catch (err) {
      console.error('Failed to fetch messages:', err)
      setMessages([])
    } finally {
      setIsFetchingMessages(false)
    }
  }, [setCurrentChatId])

  const handleDeleteChat = useCallback(async (id: string) => {
    // Optimistic update
    const chatToDelete = chats.find(c => c.id === id)
    setChats((prev) => prev.filter((c) => c.id !== id))
    
    if (currentChatIdRef.current === id) {
      handleNewChat()
    }

    try {
      await apiDeleteChat(id)
    } catch (err) {
      console.error('Failed to delete chat:', err)
      // Revert if failed
      if (chatToDelete) {
        setChats(prev => {
          if (prev.find(c => c.id === id)) return prev
          return [chatToDelete, ...prev].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        })
      }
      setError(new Error('Failed to delete chat. Please try again.'))
    }
  }, [chats, handleNewChat])

  const handleSend = useCallback(async (
    content: string,
    mode = 'chat',
    fileIds: string[] = [],
    webSearch = false,
  ) => {
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
    const allMsgs = [...messages, userMsg]

    setMessages([...allMsgs, { id: assistantId, role: 'assistant', content: '' }])
    setIsLoading(true)
    setStreamingId(assistantId)

    startStream(allMsgs, assistantId, chatId, mode, fileIds, webSearch)
  }, [isLoading, messages, setCurrentChatId, settings.model])

  async function startStream(
    allMessages: Message[],
    assistantId: string,
    chatId: string,
    mode: string,
    fileIds: string[],
    webSearch: boolean,
  ) {
    const controller = new AbortController()
    abortRef.current = controller

    setActiveStreamingIds(prev => new Set(prev).add(chatId))

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages,
          model: settings.model,
          chatId,
          systemPrompt: MODE_SYSTEM_PROMPTS[mode] ?? '',
          fileIds,
          webSearch,
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

      setActiveStreamingIds(prev => {
        const next = new Set(prev)
        next.delete(chatId)
        return next
      })

      const elapsed = Date.now() - streamStart
      setLastResponseMs(elapsed)
      if (elapsed > 0 && accumulated.length > 0) {
        setStreamSpeed(Math.round(accumulated.length / (elapsed / 1000)))
      }

      // Automatically generate a better title after the first turn
      if (allMessages.length === 1) {
        try {
          const newTitle = await generateChatTitle(chatId, settings.model)
          setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: newTitle } : c))
        } catch (titleErr) {
          console.error('Title generation failed:', titleErr)
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err)
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
  }, [saveSettings])

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(!sidebarOpen)
    } else {
      const newState = !isSidebarCollapsed
      setIsSidebarCollapsed(newState)
      localStorage.setItem('sidebar-collapsed', String(newState))
    }
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
    return <LayoutSkeleton />
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
        activeStreamingIds={activeStreamingIds}
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
            {isFetchingMessages ? (
              <div 
                className="mx-auto space-y-12 pt-10 w-full"
                style={{ maxWidth: `${settings.chatMaxWidth}px` }}
              >
                <div className="flex justify-end pr-4">
                  <div className="space-y-3 max-w-[60%] flex flex-col items-end">
                    <Skeleton className="h-3 w-24 rounded-full opacity-40" />
                    <Skeleton className="h-14 w-64 rounded-[22px] rounded-tr-none" />
                  </div>
                </div>
                <div className="flex gap-4 pl-4">
                  <div className="space-y-4 flex-1 max-w-[80%]">
                    <Skeleton className="h-3 w-32 rounded-md opacity-30" />
                    <div className="space-y-2.5">
                      <Skeleton className="h-3.5 w-full rounded-md" />
                      <Skeleton className="h-3.5 w-[92%] rounded-md" />
                      <Skeleton className="h-3.5 w-[85%] rounded-md" />
                      <Skeleton className="h-3.5 w-[40%] rounded-md" />
                    </div>
                    <div className="pt-2 space-y-2.5">
                      <Skeleton className="h-3.5 w-[95%] rounded-md" />
                      <Skeleton className="h-3.5 w-[70%] rounded-md" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pr-4">
                  <Skeleton className="h-12 w-48 rounded-[20px] rounded-tr-none" />
                </div>
              </div>
            ) : messages.length === 0 ? (
              <EmptyState onSuggestionClick={(text) => handleSend(text)} />
            ) : (
              <div 
                className="flex flex-col py-4"
                style={{ gap: 'var(--message-spacing)' }}
              >
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    isStreaming={message.id === streamingId}
                    canEdit={message.role === 'user' && !isLoading}
                    onEdit={(newContent) => handleEditMessage(message.id, newContent)}
                    onSelectOption={(text) => handleSend(text)}
                    compactMode={settings.compactMode}
                    bubbleStyle={settings.bubbleStyle}
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
          <div className="mx-auto" style={{ maxWidth: 'var(--chat-max-width)' }}>
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
function LayoutSkeleton() {
  return (
    <div className="flex h-[100svh] overflow-hidden bg-background">
      {/* Sidebar Skeleton */}
      <div className="w-[var(--sidebar-width)] border-r border-border/20 flex flex-col p-4 space-y-6 bg-muted/5">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-5 w-20 rounded-md opacity-50" />
          <Skeleton className="h-8 w-8 rounded-xl opacity-40" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-2xl opacity-20" />
        </div>
        <div className="space-y-3 pt-4">
          <Skeleton className="h-3 w-12 rounded-md opacity-30" />
          <Skeleton className="h-9 w-full rounded-xl opacity-15" />
          <Skeleton className="h-9 w-full rounded-xl opacity-15" />
          <Skeleton className="h-9 w-full rounded-xl opacity-15" />
        </div>
      </div>
      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col relative">
        <div className="h-14 border-b border-border/20 flex items-center justify-between px-6">
          <Skeleton className="h-4 w-28 rounded-md opacity-40" />
          <div className="flex items-center gap-3">
             <Skeleton className="h-7 w-7 rounded-lg opacity-30" />
             <Skeleton className="h-7 w-7 rounded-lg opacity-30" />
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8">
           <div className="w-full max-w-2xl space-y-8 opacity-10">
              <div className="space-y-3">
                 <Skeleton className="h-3 w-full rounded-md" />
                 <Skeleton className="h-3 w-[90%] rounded-md" />
                 <Skeleton className="h-3 w-[40%] rounded-md" />
              </div>
              <div className="space-y-3">
                 <Skeleton className="h-3 w-[95%] rounded-md" />
                 <Skeleton className="h-3 w-[80%] rounded-md" />
              </div>
           </div>
        </div>
        <div className="p-6">
          <Skeleton className="h-20 w-full max-w-3xl mx-auto rounded-3xl opacity-10" />
        </div>
      </div>
    </div>
  )
}
