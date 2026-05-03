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
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
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

      let category = 'General'
      const lowName = m.ollama_name.toLowerCase()
      if (lowName.includes('coder') || lowName.includes('code')) category = 'Coding'
      else if (lowName.includes('qwen') || lowName.includes('reasoning') || lowName.includes('phi')) category = 'Reasoning'
      else if (lowName.includes('mistral') || lowName.includes('haiku')) category = 'Fast'
      
      return { id: m.ollama_name, name: m.display_name, provider, badge, category, model_type: m.model_type }
    })

  const [messages, setMessages] = useState<Message[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
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
    if (!mounted) return
    const root = document.documentElement
    const s = settings

    // CSS variables
    root.style.setProperty('--primary', s.accentColor)
    root.style.setProperty('--glow-primary', `${s.accentColor}4d`)
    root.style.setProperty('--radius', `${s.borderRadius}px`)
    root.style.setProperty('--font-sans', s.fontFamily)
    root.style.setProperty('--font-family', s.fontFamily)
    document.body.style.fontFamily = s.fontFamily
    root.style.setProperty('--glass-opacity', String(s.glassOpacity / 100))
    root.style.setProperty('--glow-intensity', String(s.glowIntensity / 100))
    root.style.setProperty('--glass-blur', `${s.glassBlur}px`)
    root.style.setProperty('--border-width', `${s.borderWidth}px`)
    root.style.setProperty('--glow-radius', `${s.glowRadius}px`)
    root.style.setProperty('--sidebar-width', `${s.sidebarWidth}px`)
    root.style.setProperty('--sidebar-padding', `${s.sidebarPadding}px`)
    root.style.setProperty('--chat-max-width', `${s.chatMaxWidth}px`)
    root.style.setProperty('--message-spacing', `${s.messageSpacing}px`)
    root.style.setProperty('--sidebar-opacity', String(s.sidebarOpacity / 100))
    root.style.setProperty('--sidebar-blur', `${s.sidebarBlur}px`)
    root.style.setProperty('--accent-saturation', `${s.accentSaturation}%`)
    root.style.setProperty('--contrast', String(s.contrast / 100))
    root.style.setProperty('--noise-opacity', String(s.noiseOpacity / 100))
    root.style.setProperty('--line-height', String(s.lineHeight / 100))
    root.style.setProperty('--letter-spacing', `${s.letterSpacing}em`)
    root.style.setProperty('--bg-opacity', String(s.backgroundOpacity / 100))
    root.style.setProperty('--font-weight', String(s.fontWeight))
    root.style.setProperty('--glass-tint', s.glassTintColor)
    root.style.setProperty('--glass-saturation', `${s.glassSaturation}%`)
    root.style.setProperty('--glow-spread', `${s.glowSpread}px`)
    root.style.setProperty('--border-style', s.borderStyle)
    root.style.setProperty('--grid-opacity', String(s.gridOpacity / 100))

    // Data attributes
    root.setAttribute('data-font-size', s.fontSize)
    root.setAttribute('data-accent', s.accentColor)
    root.setAttribute('data-accent-mode', s.accentMode)
    root.setAttribute('data-content', s.contentWidth)
    root.setAttribute('data-sidebar', s.sidebarPosition)
    root.setAttribute('data-density', s.uiDensity)
    root.setAttribute('data-pattern', s.backgroundPattern)
    root.setAttribute('data-animations', s.animationsEnabled ? 'true' : 'false')
  }, [
    settings.accentColor, settings.fontSize, settings.borderRadius, settings.fontFamily,
    settings.glassOpacity, settings.glowIntensity, settings.glassBlur, settings.borderWidth,
    settings.glowRadius, settings.sidebarWidth, settings.sidebarPadding, settings.chatMaxWidth,
    settings.messageSpacing, settings.sidebarOpacity, settings.sidebarBlur, settings.accentSaturation,
    settings.noiseOpacity, settings.contrast, settings.lineHeight, settings.letterSpacing,
    settings.backgroundOpacity, settings.fontWeight, settings.glassTintColor, settings.glassSaturation,
    settings.uiDensity, settings.glowSpread, settings.borderStyle, settings.gridOpacity,
    settings.backgroundPattern, settings.contentWidth, settings.sidebarPosition, settings.accentMode,
    settings.animationsEnabled, mounted,
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
      setMessages(backendMessages.map((m) => ({ 
        id: m.id, 
        role: m.role, 
        content: m.content,
        prompt_tokens: m.prompt_tokens,
        completion_tokens: m.completion_tokens,
        total_tokens: m.total_tokens
      })))
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
    setSuggestions([])

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

    let allModels = registeredModels
    let modelType: string | undefined = allModels.find(m => m.ollama_name === settings.model)?.model_type
    if (!modelType) {
      // Store not loaded yet — fetch directly
      try {
        const { fetchRegisteredModels } = await import('@/lib/api')
        allModels = await fetchRegisteredModels()
        modelType = allModels.find(m => m.ollama_name === settings.model)?.model_type
      } catch { /* ignore */ }
    }

    // Detect image-generation intent when the selected model can't do it
    const imageIntent = /\b(generate|create|draw|make|render|paint|design|produce|show me)\b.{0,60}\b(image|picture|photo|illustration|artwork|painting|drawing|portrait|landscape|wallpaper)\b|\b(image|picture|photo|illustration|artwork)\b.{0,40}\b(of|showing|with|featuring)\b/i
    if (modelType !== 'image-generation' && imageIntent.test(content)) {
      const imageModels = allModels.filter(m => m.model_type === 'image-generation')
      const suggestion = imageModels.length > 0
        ? `I can't generate images with the current model (**${settings.model}**). To generate images, please switch to one of these models:\n\n${imageModels.map(m => `- **${m.display_name}** (\`${m.ollama_name}\`)`).join('\n')}\n\nYou can change the model from the selector at the top of the chat.`
        : `I can't generate images with the current model (**${settings.model}**). No image-generation models are registered yet — you can add one in **Settings → Models**.`
      setMessages((prev) => prev.map((m) =>
        m.id === assistantId ? { ...m, content: suggestion } : m
      ))
      setIsLoading(false)
      setStreamingId(null)
      return
    }

    if (modelType === 'image-generation') {
      // Warn if the user is asking a text/code question with an image model
      const textIntent = /\b(write|code|explain|summarize|translate|fix|debug|help me|how to|what is|why|when|who|calculate|list|compare)\b/i
      if (textIntent.test(content) && !imageIntent.test(content)) {
        const textModels = allModels.filter(m => m.model_type === 'text' || m.model_type === 'vision')
        const suggestion = textModels.length > 0
          ? `The current model (**${settings.model}**) is an image-generation model and can't answer text or coding questions.\n\nPlease switch to one of these models for text/code tasks:\n\n${textModels.map(m => `- **${m.display_name}** (\`${m.ollama_name}\`)`).join('\n')}\n\nYou can change the model from the selector at the top of the chat.`
          : `The current model (**${settings.model}**) is an image-generation model and can't answer text or coding questions. Please switch to a text model from the model selector.`
        setMessages((prev) => prev.map((m) =>
          m.id === assistantId ? { ...m, content: suggestion } : m
        ))
        setIsLoading(false)
        setStreamingId(null)
        return
      }
      startImageGen(allMsgs, assistantId, chatId)
    } else {
      startStream(allMsgs, assistantId, chatId, mode, fileIds, webSearch)
    }
  }, [isLoading, messages, setCurrentChatId, settings.model])

  async function startImageGen(allMessages: Message[], assistantId: string, chatId: string) {
    try {
      const res = await fetch('/api/chat/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages, model: settings.model, chatId }),
      })
      if (!res.ok) {
        const errText = await res.text().catch(() => `Server error (${res.status})`)
        throw new Error(errText)
      }
      const data = await res.json()
setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: data.content } : m))
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err)
        setMessages((prev) => prev.filter((m) => !(m.id === assistantId && m.content === '')))
      }
    } finally {
      setActiveStreamingIds(prev => { const next = new Set(prev); next.delete(chatId); return next })
      setIsLoading(false)
      setStreamingId(null)
    }
  }

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
      let currentText = ''
      const streamStart = Date.now()

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          // Final flush of anything remaining in accumulated (unless it's a marker)
          if (accumulated && !accumulated.startsWith('__USAGE') && !accumulated.startsWith('__IMAGE')) {
            currentText += accumulated
            setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: currentText } : m))
          }
          break
        }
        
        const chunk = decoder.decode(value, { stream: true })
        accumulated += chunk
        
        // 0. Image generation — detect __IMAGE__: prefix (may arrive across chunks)
        // If accumulated starts with or contains __IMAGE__, hold everything until parseable
        if (accumulated.startsWith('__IMAGE__:') || accumulated.includes('__IMAGE__:')) {
          const imgIdx = accumulated.indexOf('__IMAGE__:')
          const jsonPart = accumulated.slice(imgIdx + '__IMAGE__:'.length)
          if (jsonPart.length > 0) {
            try {
              const imgMarkdown = JSON.parse(jsonPart)
              currentText = imgMarkdown
              setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: currentText } : m))
              accumulated = ''
              reader.cancel().catch(() => {})
              break
            } catch {
              // JSON incomplete, keep accumulating — don't fall through
            }
          }
          // Don't process as regular text — wait for more chunks
          continue
        }
        // Guard: if accumulated might be the start of __IMAGE__ marker, hold it
        if ('__IMAGE__:'.startsWith(accumulated) && accumulated.startsWith('_')) {
          continue
        }

        // 1. If we have a full marker, process it
        if (accumulated.includes('__USAGE__:')) {
          const parts = accumulated.split('__USAGE__:')
          // The part before the marker is new text
          currentText += parts[0]
          
          const usagePart = parts[1]
          try {
            const usage = JSON.parse(usagePart)
            setMessages((prev) => prev.map((m) => m.id === assistantId ? { 
              ...m, 
              content: currentText,
              prompt_tokens: usage.prompt_tokens,
              completion_tokens: usage.completion_tokens,
              total_tokens: usage.total_tokens
            } : m))
            // Marker processed, clear accumulated
            accumulated = '' 
          } catch (e) {
            // Partial JSON after the marker, keep the marker and JSON for next chunk
            accumulated = '__USAGE__:' + usagePart
            // Update UI with the text found before the marker
            setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: currentText } : m))
          }
        } 
        // 2. Check for potential partial markers at the end
        else {
          const partialMatch = accumulated.match(/__U?S?A?G?E?:?$/)
          if (partialMatch) {
            // We have a partial marker at the end. 
            // Extract any text BEFORE the partial marker.
            const textBeforePartial = accumulated.slice(0, -partialMatch[0].length)
            if (textBeforePartial) {
              currentText += textBeforePartial
              accumulated = partialMatch[0] // Keep only the partial marker
              setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: currentText } : m))
            }
            // If no text before partial, just wait for next chunk
          } else {
            // No marker at all, whole accumulated is text
            currentText += accumulated
            accumulated = ''
            setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: currentText } : m))
          }
        }
      }

      setActiveStreamingIds(prev => {
        const next = new Set(prev)
        next.delete(chatId)
        return next
      })

      // Play notification sound if enabled
      if (settings.soundEnabled) {
        try {
          const ctx = new AudioContext()
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.frequency.setValueAtTime(880, ctx.currentTime)
          osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15)
          gain.gain.setValueAtTime(0.08, ctx.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
          osc.start(ctx.currentTime)
          osc.stop(ctx.currentTime + 0.2)
        } catch { /* audio blocked */ }
      }

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

  // Derive follow-up suggestions from the last assistant message
  useEffect(() => {
    if (isLoading) { setSuggestions([]); return }
    const last = [...messages].reverse().find(m => m.role === 'assistant')
    if (!last?.content) { setSuggestions([]); return }

    const text = last.content.slice(0, 1200)
    const chips: string[] = []

    // Extract question-like sentences the assistant asked
    const questions = text.match(/[^.!?\n]{10,120}\?/g) ?? []
    for (const q of questions) {
      const clean = q.replace(/\*\*/g, '').trim()
      if (clean.length > 8 && clean.length < 80) chips.push(clean)
      if (chips.length >= 2) break
    }

    // Pad with contextual follow-ups based on keywords
    const lower = text.toLowerCase()
    const extras: string[] = []
    if (lower.includes('code') || lower.includes('function') || lower.includes('implement'))
      extras.push('Show me the full code', 'Add error handling', 'Explain step by step')
    else if (lower.includes('design') || lower.includes('architecture') || lower.includes('system'))
      extras.push('Show a diagram', 'What are the trade-offs?', 'How does this scale?')
    else if (lower.includes('explain') || lower.includes('concept') || lower.includes('mean'))
      extras.push('Give me an example', 'Simplify further', 'What are the alternatives?')
    else
      extras.push('Tell me more', 'Give an example', 'What are the next steps?')

    for (const e of extras) {
      if (chips.length >= 3) break
      if (!chips.includes(e)) chips.push(e)
    }

    setSuggestions(chips.slice(0, 3))
  }, [messages, isLoading])

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
    switch (settings.backgroundStyle) {
      case 'aurora': return settings.animationsEnabled ? 'bg-aurora-animated' : 'bg-aurora'
      case 'gradient': return 'bg-gradient-to-br from-background via-background to-primary/5'
      case 'mesh': return 'bg-mesh'
      default: return 'bg-background'
    }
  }

  if (!mounted) {
    return <LayoutSkeleton />
  }

  const currentModel = availableModels.find((m) => m.id === settings.model) ?? availableModels[0]
  const totalTokens = messages.reduce((acc, m) => {
    if (m.total_tokens) return acc + m.total_tokens
    return acc + estimateTokens(m.content)
  }, 0)

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
          availableModels={availableModels}
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
              suggestions={messages.length > 0 ? suggestions : undefined}
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
