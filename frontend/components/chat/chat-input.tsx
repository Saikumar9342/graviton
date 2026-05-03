'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowUp, Square, Paperclip, Globe, ChevronDown, Cpu, Search, MessageSquare, Terminal, X, FileText, Loader2, Brain, Zap, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Settings, AVAILABLE_MODELS } from '@/lib/types'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { uploadFile, UploadedFile } from '@/lib/api'

interface ChatInputProps {
  onSend: (message: string, mode: string, fileIds: string[], webSearch: boolean) => void
  onStop?: () => void
  isLoading?: boolean
  disabled?: boolean
  settings: Settings
  onSettingsChange: (settings: Settings) => void
  availableModels?: { id: string; name: string; provider: string; badge?: string }[]
  suggestions?: string[]
}

const MODES = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'code', label: 'Dev', icon: Terminal },
  { id: 'research', label: 'Research', icon: Search },
]

const ALLOWED_TYPES = [
  'text/', 'application/json', 'application/xml',
  'application/javascript', 'application/typescript',
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp', 'image/gif'
]

function isAllowedFile(file: File) {
  return ALLOWED_TYPES.some((t) => file.type.startsWith(t)) || 
    file.name.match(/\.(txt|md|csv|json|xml|js|ts|tsx|jsx|py|go|rs|java|c|cpp|h|css|html|yaml|yml|toml|sh|sql|jpg|jpeg|png|webp|gif)$/i)
}

export function ChatInput({
  onSend,
  onStop,
  isLoading = false,
  disabled = false,
  settings,
  onSettingsChange,
  availableModels,
  suggestions,
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [mode, setMode] = useState('chat')
  const [attachments, setAttachments] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [webSearch, setWebSearch] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const models = availableModels ?? AVAILABLE_MODELS

  // Group models by provider for the dropdown
  const modelsByProvider = models.reduce<Record<string, typeof models>>((acc, m) => {
    if (!acc[m.provider]) acc[m.provider] = []
    acc[m.provider].push(m)
    return acc
  }, {})

  const currentModel = models.find((m) => m.id === settings.model) ?? models[0]
  // @ts-ignore - model_type might be present if it's a RegisteredModel
  const isImageGen = (currentModel as any)?.model_type === 'image-generation'
  // @ts-ignore
  const isVision = (currentModel as any)?.model_type === 'vision'

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 240)}px`
    }
  }, [input])

  const handleSubmit = () => {
    if (!input.trim() || disabled || isUploading) return
    onSend(input.trim(), mode, attachments.map((a) => a.file_id), webSearch)
    setInput('')
    setAttachments([])
    setWebSearch(false)
    setUploadError(null)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (isLoading && onStop) onStop()
      else handleSubmit()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    e.target.value = ''

    setUploadError(null)
    setIsUploading(true)
    try {
      for (const file of files) {
        if (!isAllowedFile(file)) {
          setUploadError(`"${file.name}" is not a supported file type`)
          continue
        }
        const uploaded = await uploadFile(file)
        setAttachments((prev) => [...prev, uploaded])
      }
    } catch (err: any) {
      setUploadError(err.message ?? 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const removeAttachment = (fileId: string) => {
    setAttachments((prev) => prev.filter((a) => a.file_id !== fileId))
  }

  const hasContent = input.trim().length > 0

  return (
    <div className="relative w-full">
      {/* Follow-up suggestion chips */}
      {suggestions && suggestions.length > 0 && !isLoading && (
        <div className="flex gap-2 mb-2 overflow-x-auto scrollbar-none pb-0.5">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => { onSend(s, mode, [], false) }}
              className="shrink-0 text-xs px-3 py-1.5 transition-colors duration-150 whitespace-nowrap"
              style={{
                border: '1px solid var(--ed-rule)',
                background: 'var(--background)',
                color: 'var(--ed-ink-3)',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--foreground)'
                e.currentTarget.style.color = 'var(--foreground)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--ed-rule)'
                e.currentTarget.style.color = 'var(--ed-ink-3)'
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div
        className="relative overflow-hidden transition-all duration-150"
        style={{
          border: `1px solid ${isFocused ? 'var(--foreground)' : 'var(--ed-rule)'}`,
          background: 'var(--background)',
          boxShadow: isFocused ? '4px 4px 0 var(--ed-rule)' : 'none',
        }}
      >

        {/* Toolbar */}
        <div className="flex items-center gap-1.5 px-4 pt-3 pb-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                style={{
                  appearance: 'none', border: 'none', background: 'transparent',
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 8px', cursor: 'pointer',
                  fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11,
                  fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase',
                  color: 'var(--ed-ink-3)',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--foreground)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--ed-ink-3)')}
              >
                <Cpu className="h-3 w-3" style={{ color: 'var(--ed-accent)' }} />
                {currentModel?.name ?? settings.model}
                <ChevronDown className="h-2.5 w-2.5 opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="start" 
              className="w-48 rounded-md p-1 shadow-[0_15px_50px_rgba(0,0,0,0.25)] border-border/50 bg-background/98 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200"
            >
              {Object.entries(modelsByProvider)
                .sort(([a], [b]) => {
                  if (a === 'Ollama') return -1
                  if (b === 'Ollama') return 1
                  return a.localeCompare(b)
                })
                .map(([provider, providerModels], i) => {
                  const ProviderIcon = 
                    provider === 'Ollama' ? Brain : 
                    provider === 'Groq' ? Zap : 
                    provider === 'OpenRouter' ? Globe : 
                    provider === 'NVIDIA' ? Cpu : Bot

                  return (
                    <div key={provider}>
                      {i > 0 && <div className="h-px border-t border-dashed border-border/40 my-1 mx-1" />}
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 mb-0.5 opacity-40">
                        <ProviderIcon className="h-3 w-3 text-primary/70" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{provider}</span>
                      </div>
                      
                      {providerModels.map((model) => (
                        <DropdownMenuItem
                          key={model.id}
                          onClick={() => onSettingsChange({ ...settings, model: model.id })}
                          className={cn(
                            'relative flex items-center justify-between py-2 pl-3 pr-2 rounded-sm cursor-pointer transition-all duration-75 group',
                            settings.model === model.id 
                              ? 'bg-primary/[0.08] text-primary' 
                              : 'hover:bg-muted/70 text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {settings.model === model.id && (
                            <>
                              <div className="absolute left-0 top-0 bottom-0 w-[2.5px] bg-primary" />
                              <div className="absolute right-0 top-0 w-1.5 h-1.5 border-t border-r border-primary/30" />
                              <div className="absolute right-0 bottom-0 w-1.5 h-1.5 border-b border-r border-primary/30" />
                            </>
                          )}
                          <span className="text-xs font-semibold truncate tracking-tight">{model.name}</span>
                          
                          {model.badge && (
                            <span className={cn(
                              "text-[8px] font-bold px-1.5 py-0.5 border tracking-tight uppercase transition-colors",
                              settings.model === model.id
                                ? "bg-primary/10 border-primary/30 text-primary"
                                : "bg-muted/50 border-border text-muted-foreground/50 group-hover:border-border/80"
                            )}>
                              {model.badge}
                            </span>
                          )}
                        </DropdownMenuItem>
                      ))}
                    </div>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-3.5 w-px bg-border/40 mx-0.5" />

          {/* Mode tabs */}
          <div className="flex items-center gap-0.5">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={cn(
                  'flex items-center gap-1.5 text-[11px] font-medium h-6 px-2.5 rounded-2xl transition-all duration-150',
                  mode === m.id
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground/45 hover:text-muted-foreground hover:bg-muted/40'
                )}
              >
                <m.icon className="h-2.5 w-2.5" />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Attachment chips */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-4 pb-1">
            {attachments.map((a) => (
              <div
                key={a.file_id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[11px] font-medium"
              >
                <FileText className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[140px]">{a.filename}</span>
                <button
                  onClick={() => removeAttachment(a.file_id)}
                  className="ml-0.5 text-primary/60 hover:text-primary transition-colors"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Textarea */}
        <div className="px-4 py-1">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={
              mode === 'chat'
                ? 'Ask anything…'
                : mode === 'code'
                  ? 'Describe what you want to build or debug…'
                  : 'What would you like to research?'
            }
            className="w-full resize-none bg-transparent border-none focus-visible:ring-0 p-0 text-sm leading-relaxed placeholder:text-muted-foreground/35 scrollbar-none min-h-[44px]"
          />
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-4 pb-3 pt-1">
          <div className="flex items-center gap-0.5">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept=".txt,.md,.csv,.json,.xml,.js,.ts,.tsx,.jsx,.py,.go,.rs,.java,.c,.cpp,.h,.css,.html,.yaml,.yml,.toml,.sh,.sql,.pdf,.jpg,.jpeg,.png,.webp,.gif"
              onChange={handleFileChange}
            />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className={cn(
                    'h-7 w-7 rounded-2xl transition-colors',
                    attachments.length > 0
                      ? 'text-primary bg-primary/10 hover:bg-primary/15'
                      : 'text-muted-foreground/35 hover:text-muted-foreground/70 hover:bg-muted/40'
                  )}
                >
                  {isUploading
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Paperclip className="h-3.5 w-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {isUploading ? 'Uploading…' : isVision ? 'Attach file or image' : 'Attach file'}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setWebSearch((v) => !v)}
                  disabled={isImageGen}
                  className={cn(
                    'h-7 w-7 rounded-2xl transition-colors hidden sm:flex',
                    isImageGen && 'opacity-0 pointer-events-none',
                    webSearch
                      ? 'text-sky-400 bg-sky-400/10 hover:bg-sky-400/15'
                      : 'text-muted-foreground/35 hover:text-muted-foreground/70 hover:bg-muted/40'
                  )}
                >
                  <Globe className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {webSearch ? 'Web search on — click to disable' : 'Enable web search'}
              </TooltipContent>
            </Tooltip>

            {webSearch && (
              <span className="text-[10px] text-sky-400/80 ml-1 hidden sm:block">Web</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {uploadError && (
              <span className="text-[11px] text-destructive/80 max-w-[160px] truncate">{uploadError}</span>
            )}
            {input.length > 0 && !uploadError && (
              <span className="text-[11px] text-muted-foreground/25 tabular-nums select-none">
                {input.length}
              </span>
            )}

            {isLoading ? (
              <button
                onClick={onStop}
                style={{
                  appearance: 'none', border: '1px solid var(--ed-rule)', background: 'var(--ed-paper-2)',
                  width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--ed-ink-3)',
                }}
              >
                <Square className="h-3 w-3 fill-current" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!hasContent || disabled || isUploading}
                style={{
                  appearance: 'none',
                  border: 'none',
                  background: hasContent && !isUploading ? 'var(--foreground)' : 'var(--ed-paper-3)',
                  color: hasContent && !isUploading ? 'var(--background)' : 'var(--ed-ink-4)',
                  padding: '6px 14px', height: 30,
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11,
                  fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
                  cursor: hasContent && !isUploading ? 'pointer' : 'not-allowed',
                  opacity: disabled ? 0.5 : 1,
                }}
                onMouseEnter={e => { if (hasContent) (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
              >
                Send <ArrowUp className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
