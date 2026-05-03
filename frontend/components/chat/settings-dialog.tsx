'use client'

import { useState, useEffect } from 'react'
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Monitor,
  Check,
  Plus,
  RefreshCw,
  Trash2,
  Activity,
  Server,
  HardDrive,
  Sparkles,
  Lock,
  X,
  Layout,
  Type,
  Palette,
  Layers,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  pullModel,
  getAdminStatus,
  testDbConnection,
  syncRegisteredModels,
  createRegisteredModel,
  updateRegisteredModel,
  deleteRegisteredModel,
  fetchGlobalUsage,
  fetchModelUsage,
  type ModelUsage,
  type AdminStatus,
} from '@/lib/api'
import {
  type Settings,
  type ChatBubbleStyle,
  type FontSize,
  type BackgroundStyle,
  ACCENT_COLORS,
  FONT_FAMILIES,
  MODEL_CATEGORIES,
} from '@/lib/types'
import { useModelsStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export interface SessionStats {
  model: string
  tokens: number
  userMessages: number
  assistantMessages: number
  lastResponseMs?: number
  streamSpeed?: number
}

interface SettingsDialogProps {
  settings: Settings
  onSave: (settings: Settings) => void
  session?: SessionStats
  children?: React.ReactNode
}

function SLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Label className={cn('text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-3 block', className)}>
      {children}
    </Label>
  )
}

function Row({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="space-y-0.5">
        <p className="text-sm font-medium leading-none">{title}</p>
        {desc && <p className="text-xs text-muted-foreground/60">{desc}</p>}
      </div>
      {children}
    </div>
  )
}

function PinGate({
  authenticated,
  pinInput,
  onPinChange,
  onSubmit,
  hasError,
  children,
}: {
  authenticated: boolean
  pinInput: string
  onPinChange: (v: string) => void
  onSubmit: (pin?: string) => void
  hasError: boolean
  children: React.ReactNode
}) {
  if (authenticated) return <>{children}</>

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
        <Lock className="h-6 w-6" />
      </div>
      <div className="text-center space-y-1.5">
        <h3 className="text-base font-semibold">Admin Area Protected</h3>
        <p className="text-xs text-muted-foreground/60">Enter your PIN to access system configurations</p>
      </div>
      <div className="flex flex-col items-center gap-4">
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          placeholder="Enter PIN"
          value={pinInput}
          autoFocus
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '')
            onPinChange(v)
            if (v.length === 4) onSubmit(v)
          }}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          className={cn(
            'w-32 h-9 text-center text-sm tracking-widest rounded-xl border bg-muted/20 px-3 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all',
            hasError ? 'border-destructive text-destructive' : 'border-border/40'
          )}
        />
        {hasError && <p className="text-xs text-destructive -mt-2">Incorrect PIN</p>}
        <Button variant="ghost" size="sm" onClick={() => onSubmit()} className="text-xs font-medium text-primary hover:text-primary hover:bg-primary/5">
          Unlock Panel
        </Button>
      </div>
    </div>
  )
}

const CLOUD_PROVIDERS = [
  {
    id: 'nvidia', label: 'NVIDIA NIM', url: 'https://integrate.api.nvidia.com/v1', needsKey: true,
    models: ['meta/llama-3.1-8b-instruct', 'meta/llama-3.1-70b-instruct', 'meta/llama-3.3-70b-instruct', 'mistralai/mistral-7b-instruct-v0.3', 'microsoft/phi-3-mini-4k-instruct', 'google/gemma-2-9b-it'],
  },
  {
    id: 'groq', label: 'Groq', url: 'https://api.groq.com/openai/v1', needsKey: true,
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'llama-4-scout', 'qwen-3-32b', 'gpt-oss-120b', 'deepseek-r1-distill-llama-70b'],
  },
  {
    id: 'openrouter', label: 'OpenRouter', url: 'https://openrouter.ai/api/v1', needsKey: true,
    models: ['anthropic/claude-sonnet-4-5', 'anthropic/claude-3-5-haiku', 'openai/gpt-4o', 'openai/gpt-4o-mini', 'google/gemini-2.0-flash-001', 'meta-llama/llama-3.3-70b-instruct', 'deepseek/deepseek-r1'],
  },
  {
    id: 'together', label: 'Together AI', url: 'https://api.together.xyz/v1', needsKey: true,
    models: ['meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', 'mistralai/Mixtral-8x7B-Instruct-v0.1', 'deepseek-ai/DeepSeek-R1'],
  },
  {
    id: 'fireworks', label: 'Fireworks AI', url: 'https://api.fireworks.ai/inference/v1', needsKey: true,
    models: ['accounts/fireworks/models/llama-v3p1-8b-instruct', 'accounts/fireworks/models/llama-v3p1-70b-instruct', 'accounts/fireworks/models/mixtral-8x7b-instruct'],
  },
  {
    id: 'lmstudio', label: 'LM Studio', url: 'http://localhost:1234/v1', needsKey: false,
    models: [],
  },
  {
    id: 'custom', label: 'Custom', url: '', needsKey: true,
    models: [],
  },
] as const

type Section = 'appearance' | 'chat' | 'models' | 'lab' | 'session' | 'database' | 'admin'

export function SettingsDialog({ settings, onSave, session, children }: SettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [section, setSection] = useState<Section>('appearance')
  const [local, setLocal] = useState<Settings>(settings)
  const { theme, setTheme } = useTheme()
  const isMobile = useIsMobile()

  // Admin / Models State
  const [adminOk, setAdminOk] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)

  const { models, load: reloadModels, setModels } = useModelsStore()
  const [modelsLoading, setModelsLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [addName, setAddName] = useState('')
  const [addDisplay, setAddDisplay] = useState('')
  const [addError, setAddError] = useState('')
  const [pullName, setPullName] = useState('')
  const [pullStatus, setPullStatus] = useState('')
  const [isPulling, setIsPulling] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [status, setStatus] = useState<AdminStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)

  const [dbUrl, setDbUrl] = useState('')
  const [dbTesting, setDbTesting] = useState(false)
  const [dbResult, setDbResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinMsg, setPinMsg] = useState('')

  // Cloud provider state
  const [cloudProvider, setCloudProvider] = useState('nvidia')
  const [cloudModelId, setCloudModelId] = useState('')
  const [cloudDisplayName, setCloudDisplayName] = useState('')
  const [cloudApiKey, setCloudApiKey] = useState('')
  const [cloudBaseUrl, setCloudBaseUrl] = useState('')
  const [cloudError, setCloudError] = useState('')
  const [cloudAdding, setCloudAdding] = useState(false)
 
  // Lab Pagination
  const [labPage, setLabPage] = useState(0)
  const LAB_PAGE_SIZE = 5

  const [globalUsage, setGlobalUsage] = useState<{ prompt_tokens: number; completion_tokens: number; total_tokens: number } | null>(null)
  const [modelUsage, setModelUsage] = useState<ModelUsage[]>([])
  const [usageLoading, setUsageLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setLocal(settings)
      if (section === 'models') { setModelsLoading(true); reloadModels().finally(() => setModelsLoading(false)) }
      if (section === 'admin') loadStatus()
    }
  }, [open, settings]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (section === 'models' && open) { setModelsLoading(true); reloadModels().finally(() => setModelsLoading(false)) }
    if (section === 'admin' && open) loadStatus()
    if (section === 'session' && open) {
      setUsageLoading(true)
      Promise.all([
        fetchGlobalUsage().then(setGlobalUsage),
        fetchModelUsage().then(setModelUsage)
      ]).finally(() => setUsageLoading(false))
    }
  }, [section, open]) // eslint-disable-line react-hooks/exhaustive-deps

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const next = { ...local, [key]: value }
    setLocal(next)
    
    // Real-time preview for visual settings
    const root = document.documentElement
    if (key === 'accentColor') {
      root.style.setProperty('--primary', value as string)
      root.style.setProperty('--glow-primary', `${value}4d`)
      root.setAttribute('data-accent', value as string)
    }
    if (key === 'borderRadius') {
      root.style.setProperty('--radius', `${value}px`)
    }
    if (key === 'fontFamily') {
      root.style.setProperty('--font-sans', value as string)
    }
    if (key === 'theme') {
      setTheme(value as 'light' | 'dark' | 'system')
    }
    if (key === 'contrast') {
      root.style.setProperty('--contrast', `${(value as number) / 100}`)
    }
    if (key === 'sidebarPosition') {
      root.setAttribute('data-sidebar', value as string)
    }
    if (key === 'contentWidth') {
      root.setAttribute('data-content', value as string)
    }
    if (key === 'accentMode') {
      root.setAttribute('data-accent-mode', value as string)
    }
    if (key === 'lineHeight') {
      root.style.setProperty('--line-height', `${(value as number) / 100}`)
    }
    if (key === 'letterSpacing') {
      root.style.setProperty('--letter-spacing', `${value}em`)
    }
    if (key === 'backgroundOpacity') {
      root.style.setProperty('--bg-opacity', `${(value as number) / 100}`)
    }
    if (key === 'glassOpacity') {
      root.style.setProperty('--glass-opacity', String((value as number) / 100))
    }
    if (key === 'glassBlur') {
      root.style.setProperty('--glass-blur', `${value}px`)
    }
    if (key === 'glowIntensity') {
      root.style.setProperty('--glow-intensity', String((value as number) / 100))
    }
    if (key === 'glowRadius') {
      root.style.setProperty('--glow-radius', `${value}px`)
    }
    if (key === 'noiseOpacity') {
      root.style.setProperty('--noise-opacity', String((value as number) / 100))
    }
    if (key === 'borderWidth') {
      root.style.setProperty('--border-width', `${value}px`)
    }
    if (key === 'sidebarOpacity') {
      root.style.setProperty('--sidebar-opacity', String((value as number) / 100))
    }
    if (key === 'sidebarBlur') {
      root.style.setProperty('--sidebar-blur', `${value}px`)
    }
    if (key === 'sidebarWidth') {
      root.style.setProperty('--sidebar-width', `${value}px`)
    }
    if (key === 'sidebarPadding') {
      root.style.setProperty('--sidebar-padding', `${value}px`)
    }
    if (key === 'chatMaxWidth') {
      root.style.setProperty('--chat-max-width', `${value}px`)
    }
    if (key === 'messageSpacing') {
      root.style.setProperty('--message-spacing', `${value}px`)
    }
    if (key === 'accentSaturation') {
      root.style.setProperty('--accent-saturation', `${value}%`)
    }
    if (key === 'fontSize') {
      root.setAttribute('data-font-size', value as string)
    }
    if (key === 'fontWeight') {
      root.style.setProperty('--font-weight', String(value))
    }
    if (key === 'animationsEnabled') {
      root.setAttribute('data-animations', value ? 'true' : 'false')
    }
    if (key === 'glassTintColor') {
      root.style.setProperty('--glass-tint', value as string)
    }
    if (key === 'glassSaturation') {
      root.style.setProperty('--glass-saturation', `${value}%`)
    }
    if (key === 'uiDensity') {
      root.setAttribute('data-density', value as string)
    }
    if (key === 'glowSpread') {
      root.style.setProperty('--glow-spread', `${value}px`)
    }
    if (key === 'borderStyle') {
      root.style.setProperty('--border-style', value as string)
    }
    if (key === 'gridOpacity') {
      root.style.setProperty('--grid-opacity', String((value as number) / 100))
    }
    if (key === 'backgroundPattern') {
      root.setAttribute('data-pattern', value as string)
    }
  }

  const handleSave = () => {
    onSave(local)
    setOpen(false)
  }

  const handleClose = () => {
    setLocal(settings)
    setOpen(false)
    // Reset preview
    const root = document.documentElement
    root.setAttribute('data-accent', settings.accentColor)
    root.setAttribute('data-font-size', settings.fontSize)
    root.style.setProperty('--primary', settings.accentColor)
    root.style.setProperty('--glow-primary', `${settings.accentColor}4d`)
    root.style.setProperty('--radius', `${settings.borderRadius}px`)
    root.style.setProperty('--font-sans', settings.fontFamily)
    root.style.setProperty('--contrast', `${settings.contrast / 100}`)
    root.setAttribute('data-sidebar', settings.sidebarPosition)
    root.setAttribute('data-content', settings.contentWidth)
    root.setAttribute('data-accent-mode', settings.accentMode)
    root.style.setProperty('--line-height', `${settings.lineHeight / 100}`)
    root.style.setProperty('--letter-spacing', `${settings.letterSpacing}em`)
    root.style.setProperty('--bg-opacity', `${settings.backgroundOpacity / 100}`)
    root.style.setProperty('--glass-opacity', String(settings.glassOpacity / 100))
    root.style.setProperty('--glass-blur', `${settings.glassBlur}px`)
    root.style.setProperty('--glow-intensity', String(settings.glowIntensity / 100))
    root.style.setProperty('--glow-radius', `${settings.glowRadius}px`)
    root.style.setProperty('--noise-opacity', String(settings.noiseOpacity / 100))
    root.style.setProperty('--border-width', `${settings.borderWidth}px`)
    root.style.setProperty('--sidebar-opacity', String(settings.sidebarOpacity / 100))
    root.style.setProperty('--sidebar-blur', `${settings.sidebarBlur}px`)
    root.style.setProperty('--sidebar-width', `${settings.sidebarWidth}px`)
    root.style.setProperty('--sidebar-padding', `${settings.sidebarPadding}px`)
    root.style.setProperty('--chat-max-width', `${settings.chatMaxWidth}px`)
    root.style.setProperty('--message-spacing', `${settings.messageSpacing}px`)
    root.style.setProperty('--accent-saturation', `${settings.accentSaturation}%`)
    root.style.setProperty('--font-weight', String(settings.fontWeight))
    root.setAttribute('data-animations', settings.animationsEnabled ? 'true' : 'false')
    root.style.setProperty('--glass-tint', settings.glassTintColor)
    root.style.setProperty('--glass-saturation', `${settings.glassSaturation}%`)
    root.setAttribute('data-density', settings.uiDensity)
    root.style.setProperty('--glow-spread', `${settings.glowSpread}px`)
    root.style.setProperty('--border-style', settings.borderStyle)
    root.style.setProperty('--grid-opacity', String(settings.gridOpacity / 100))
    root.setAttribute('data-pattern', settings.backgroundPattern)
    setTheme(settings.theme)
  }

  const handleTheme = (t: 'light' | 'dark' | 'system') => {
    update('theme', t)
  }

  const checkPin = (pin?: string) => {
    const p = pin ?? pinInput
    if (p === '1234' || localStorage.getItem('admin-unlocked') === 'true') {
      setAdminOk(true)
      localStorage.setItem('admin-unlocked', 'true')
    } else {
      setPinError(true)
      setPinInput('')
      setTimeout(() => setPinError(false), 500)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      await syncRegisteredModels()
      await reloadModels()
    } finally {
      setSyncing(false)
    }
  }

  const handleAddModel = async () => {
    if (!addName.trim()) return
    setAddError('')
    try {
      const display = addDisplay.trim() || addName.split(':')[0].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      const created = await createRegisteredModel({ ollama_name: addName.trim(), display_name: display })
      setModels([...models, created])
      setAddName('')
      setAddDisplay('')
    } catch (e: any) {
      setAddError(e.message)
    }
  }

  const handleToggleActive = async (id: string, current: boolean) => {
    const updated = await updateRegisteredModel(id, { is_active: !current })
    setModels(models.map(m => m.id === id ? updated : m))
  }

  const handleDeleteRegistered = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteRegisteredModel(id)
      setModels(models.filter(m => m.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  const handleAddCloudModel = async () => {
    if (!cloudModelId.trim()) { setCloudError('Model ID is required'); return }
    const providerMeta = CLOUD_PROVIDERS.find(p => p.id === cloudProvider)
    const baseUrl = cloudBaseUrl.trim() || providerMeta?.url || ''
    if (!baseUrl) { setCloudError('Base URL is required'); return }
    if (providerMeta?.needsKey && !cloudApiKey.trim()) { setCloudError('API key is required for this provider'); return }
    setCloudError('')
    setCloudAdding(true)
    try {
      const display = cloudDisplayName.trim() || cloudModelId.split('/').pop()!.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      const created = await createRegisteredModel({
        ollama_name: cloudModelId.trim(),
        display_name: display,
        provider: 'openai-compat',
        api_base_url: baseUrl,
        api_key: cloudApiKey.trim() || undefined,
      })
      setModels([...models, created])
      setCloudModelId('')
      setCloudDisplayName('')
      setCloudApiKey('')
    } catch (e: any) {
      setCloudError(e.message)
    } finally {
      setCloudAdding(false)
    }
  }

  const handlePull = async () => {
    if (!pullName.trim()) return
    setIsPulling(true)
    setPullStatus('Starting...')
    try {
      await pullModel(pullName, setPullStatus)
      setPullStatus('✓ Model ready — click Sync to register it')
      setPullName('')
    } catch (e: any) {
      setPullStatus(`Error: ${e.message}`)
    } finally {
      setIsPulling(false)
    }
  }

  const loadStatus = async () => {
    setStatusLoading(true)
    try {
      const data = await getAdminStatus()
      setStatus(data)
    } catch {
      setStatus(null)
    } finally {
      setStatusLoading(false)
    }
  }

  const handleTestDb = async () => {
    setDbTesting(true)
    setDbResult(null)
    try {
      const res = await testDbConnection(dbUrl)
      setDbResult({ ok: res.status === 'ok', msg: res.message })
    } catch (e: any) {
      setDbResult({ ok: false, msg: e.message })
    } finally {
      setDbTesting(false)
    }
  }

  const handleChangePin = () => {
    if (!newPin || newPin !== confirmPin) {
      setPinMsg('PINs do not match')
      return
    }
    setPinMsg('✓ PIN updated (simulated)')
    setTimeout(() => setPinMsg(''), 2000)
  }

  const mainNav = [
    { id: 'appearance', label: 'Appearance', icon: Sun },
    { id: 'chat', label: 'Chat Settings', icon: Sparkles },
    { id: 'models', label: 'Local Models', icon: Server },
    { id: 'lab', label: 'Model Lab', icon: Sparkles },
    { id: 'session', label: 'Session Info', icon: Activity },
  ] as const

  const adminNav = [
    { id: 'database', label: 'Database', icon: HardDrive },
    { id: 'admin', label: 'System Admin', icon: Lock },
  ] as const

  const renderContent = () => {
    switch (section) {

      case 'appearance':
        return (
          <div className="space-y-10 max-h-[550px] overflow-y-auto pr-4 scrollbar-none pb-8">
            {/* ── 01. THEME & ACCENT ─────────────────────────────────────── */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <Palette className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight">Theme & Accent</h3>
                  <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">Core Aesthetics</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {([
                  { v: 'light', label: 'Light', Icon: Sun },
                  { v: 'dark', label: 'Dark', Icon: Moon },
                  { v: 'system', label: 'System', Icon: Monitor },
                ] as const).map(({ v, label, Icon }) => (
                  <button
                    key={v}
                    onClick={() => handleTheme(v)}
                    className={cn(
                      'flex flex-col items-center gap-2 py-3.5 rounded-2xl border text-[11px] font-medium transition-all group relative overflow-hidden',
                      theme === v
                        ? 'border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10'
                        : 'border-border/40 text-muted-foreground hover:border-border hover:bg-muted/30',
                    )}
                  >
                    <Icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                    {label}
                  </button>
                ))}
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <SLabel className="mb-0">Accent Color</SLabel>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_var(--primary)]" style={{ backgroundColor: local.accentColor }} />
                    <code className="text-[11px] font-mono font-bold text-primary uppercase">{local.accentColor}</code>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2.5">
                  {ACCENT_COLORS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => update('accentColor', c.hex)}
                      className={cn(
                        'h-10 w-10 rounded-2xl transition-all hover:scale-110 flex items-center justify-center relative shadow-sm ring-offset-2 ring-offset-background group',
                        local.accentColor === c.hex && 'ring-2 ring-primary scale-105',
                      )}
                      style={{ backgroundColor: c.hex }}
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity rounded-2xl" />
                      {local.accentColor === c.hex && <Check className="h-4 w-4 text-white drop-shadow-md" />}
                    </button>
                  ))}
                  
                  <div className="relative h-10 w-10 group">
                    <input
                      type="color"
                      value={local.accentColor}
                      onChange={(e) => update('accentColor', e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    />
                    <div className={cn(
                      'h-full w-full rounded-2xl border-2 border-dashed flex items-center justify-center transition-all bg-muted/20 group-hover:bg-muted/40 ring-offset-2 ring-offset-background overflow-hidden relative',
                      !ACCENT_COLORS.some(c => c.hex === local.accentColor)
                        ? 'border-primary ring-2 ring-primary scale-105 shadow-[0_0_12px_var(--primary)]'
                        : 'border-border/40 text-muted-foreground/40'
                    )}
                    style={{ backgroundColor: !ACCENT_COLORS.some(c => c.hex === local.accentColor) ? local.accentColor : undefined }}
                    >
                      {!ACCENT_COLORS.some(c => c.hex === local.accentColor) ? (
                        <Check className="h-4 w-4 text-white drop-shadow-md" />
                      ) : (
                        <div className="flex flex-col items-center gap-0.5">
                          <Plus className="h-3 w-3" />
                          <span className="text-[7px] font-bold uppercase tracking-tighter">HEX</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-2">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <SLabel className="mb-0 text-[10px]">Saturation</SLabel>
                      <span className="text-[10px] font-mono text-primary/60">{local.accentSaturation}%</span>
                    </div>
                    <Slider
                      value={[local.accentSaturation]}
                      min={0}
                      max={150}
                      step={1}
                      onValueChange={([v]) => update('accentSaturation', v)}
                    />
                  </div>
                  <div className="space-y-3">
                    <SLabel className="mb-0 text-[10px]">Accent Mode</SLabel>
                    <div className="flex gap-1.5 p-1 rounded-xl bg-muted/30 border border-border/40">
                      {(['vivid', 'subtle'] as const).map((v) => (
                        <button
                          key={v}
                          onClick={() => update('accentMode', v)}
                          className={cn(
                            'flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all',
                            local.accentMode === v
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'text-muted-foreground hover:bg-muted/50'
                          )}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 02. VISUAL DNA ─────────────────────────────────────────── */}
            <div className="space-y-6 pt-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight">Visual DNA</h3>
                  <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">Glass & Environment</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0 text-[10px]">Glass Opacity</SLabel>
                    <span className="text-[10px] font-mono text-primary/60">{local.glassOpacity}%</span>
                  </div>
                  <Slider
                    value={[local.glassOpacity]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([v]) => update('glassOpacity', v)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0 text-[10px]">Glass Blur</SLabel>
                    <span className="text-[10px] font-mono text-primary/60">{local.glassBlur}px</span>
                  </div>
                  <Slider
                    value={[local.glassBlur]}
                    min={0}
                    max={40}
                    step={1}
                    onValueChange={([v]) => update('glassBlur', v)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0 text-[10px]">Glow Intensity</SLabel>
                    <span className="text-[10px] font-mono text-primary/60">{local.glowIntensity}%</span>
                  </div>
                  <Slider
                    value={[local.glowIntensity]}
                    min={0}
                    max={200}
                    step={5}
                    onValueChange={([v]) => update('glowIntensity', v)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0 text-[10px]">Noise Density</SLabel>
                    <span className="text-[10px] font-mono text-primary/60">{local.noiseOpacity}%</span>
                  </div>
                  <Slider
                    value={[local.noiseOpacity]}
                    min={0}
                    max={50}
                    step={1}
                    onValueChange={([v]) => update('noiseOpacity', v)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0 text-[10px]">Glow Spread</SLabel>
                    <span className="text-[10px] font-mono text-primary/60">{local.glowSpread}px</span>
                  </div>
                  <Slider
                    value={[local.glowSpread]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([v]) => update('glowSpread', v)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0 text-[10px]">Glow Radius</SLabel>
                    <span className="text-[10px] font-mono text-primary/60">{local.glowRadius}px</span>
                  </div>
                  <Slider
                    value={[local.glowRadius]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([v]) => update('glowRadius', v)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0 text-[10px]">Glass Tint</SLabel>
                    <div className="relative h-6 w-12 rounded-lg border border-border/40 overflow-hidden">
                      <input
                        type="color"
                        value={local.glassTintColor}
                        onChange={(e) => update('glassTintColor', e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      />
                      <div className="h-full w-full" style={{ backgroundColor: local.glassTintColor }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground/60">Tint Saturation</span>
                    <span className="text-[10px] font-mono text-primary/60">{local.glassSaturation}%</span>
                  </div>
                  <Slider
                    value={[local.glassSaturation]}
                    min={0}
                    max={200}
                    step={5}
                    onValueChange={([v]) => update('glassSaturation', v)}
                  />
                </div>

                <div className="space-y-3">
                  <SLabel className="text-[10px]">UI Density</SLabel>
                  <div className="flex gap-1.5 p-1.5 rounded-xl bg-muted/30 border border-border/40">
                    {(['compact', 'comfort', 'spacious'] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => update('uiDensity', v)}
                        className={cn(
                          'flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all',
                          local.uiDensity === v
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-muted/50'
                        )}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <SLabel className="text-[10px]">Background Pattern</SLabel>
                  <div className="flex gap-1.5 p-1 rounded-xl bg-muted/30 border border-border/40">
                    {(['none', 'grid', 'dots', 'mesh'] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => update('backgroundPattern', v)}
                        className={cn(
                          'flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all',
                          local.backgroundPattern === v
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-muted/50'
                        )}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-6 pt-2">
                <div className="space-y-3">
                  <SLabel className="text-[10px]">Background Brightness</SLabel>
                  <Slider
                    value={[local.backgroundOpacity]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([v]) => update('backgroundOpacity', v)}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0 text-[10px]">Pattern Intensity</SLabel>
                    <span className="text-[10px] font-mono text-primary/60">{local.gridOpacity}%</span>
                  </div>
                  <Slider
                    value={[local.gridOpacity]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([v]) => update('gridOpacity', v)}
                  />
                </div>
              </div>
            </div>

            {/* ── 03. SIDEBAR ─────────────────────────────────────────────── */}
            <div className="space-y-6 pt-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <Layout className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight">Sidebar</h3>
                  <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">Panel Configuration</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0 text-[10px]">Sidebar Opacity</SLabel>
                    <span className="text-[10px] font-mono text-primary/60">{local.sidebarOpacity}%</span>
                  </div>
                  <Slider
                    value={[local.sidebarOpacity]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([v]) => update('sidebarOpacity', v)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0 text-[10px]">Sidebar Blur</SLabel>
                    <span className="text-[10px] font-mono text-primary/60">{local.sidebarBlur}px</span>
                  </div>
                  <Slider
                    value={[local.sidebarBlur]}
                    min={0}
                    max={40}
                    step={1}
                    onValueChange={([v]) => update('sidebarBlur', v)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0 text-[10px]">Sidebar Width</SLabel>
                    <span className="text-[10px] font-mono text-primary/60">{local.sidebarWidth}px</span>
                  </div>
                  <Slider
                    value={[local.sidebarWidth]}
                    min={200}
                    max={450}
                    step={10}
                    onValueChange={([v]) => update('sidebarWidth', v)}
                  />
                </div>

                <div className="space-y-3">
                  <SLabel className="text-[10px]">Position</SLabel>
                  <div className="flex gap-1.5 p-1 rounded-xl bg-muted/30 border border-border/40">
                    {(['left', 'right'] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => update('sidebarPosition', v)}
                        className={cn(
                          'flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all',
                          local.sidebarPosition === v
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-muted/50'
                        )}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── 04. TYPOGRAPHY ─────────────────────────────────────────── */}
            <div className="space-y-6 pt-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <Type className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight">Typography</h3>
                  <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">Text Styles</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <SLabel className="text-[10px]">Font Family</SLabel>
                  <Select value={local.fontFamily} onValueChange={(v) => update('fontFamily', v)}>
                    <SelectTrigger className="h-10 rounded-xl border-border/40 bg-card/20 text-xs">
                      <SelectValue placeholder="Select font" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/40">
                      {FONT_FAMILIES.map((f) => (
                        <SelectItem key={f.value} value={f.value} className="rounded-lg text-xs">
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <SLabel className="text-[10px]">Contrast</SLabel>
                  <div className="px-3 pt-2">
                    <Slider
                      value={[local.contrast]}
                      min={50}
                      max={150}
                      step={5}
                      onValueChange={([v]) => update('contrast', v)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-3">
                  <SLabel className="text-[10px]">Animations</SLabel>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20 border border-border/40">
                    <span className="text-[11px] font-medium">Motion Effects</span>
                    <Switch
                      checked={local.animationsEnabled}
                      onCheckedChange={(v) => update('animationsEnabled', v)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <SLabel className="text-[10px]">Layout Style</SLabel>
                  <div className="flex gap-1.5 p-1 rounded-xl bg-muted/30 border border-border/40">
                    {(['centered', 'full'] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => update('contentWidth', v)}
                        className={cn(
                          'flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all',
                          local.contentWidth === v
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-muted/50'
                        )}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0 text-[10px]">Line Height</SLabel>
                    <span className="text-[10px] font-mono text-primary/60">{(local.lineHeight / 100).toFixed(1)}</span>
                  </div>
                  <Slider
                    value={[local.lineHeight]}
                    min={100}
                    max={250}
                    step={10}
                    onValueChange={([v]) => update('lineHeight', v)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0 text-[10px]">Letter Spacing</SLabel>
                    <span className="text-[10px] font-mono text-primary/60">{local.letterSpacing}em</span>
                  </div>
                  <Slider
                    value={[local.letterSpacing]}
                    min={-0.05}
                    max={0.15}
                    step={0.01}
                    onValueChange={([v]) => update('letterSpacing', v)}
                  />
                </div>
              </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0 text-[10px]">Font Weight</SLabel>
                    <span className="text-[10px] font-mono text-primary/60">{local.fontWeight}</span>
                  </div>
                  <Slider
                    value={[local.fontWeight]}
                    min={100}
                    max={900}
                    step={100}
                    onValueChange={([v]) => update('fontWeight', v)}
                  />
                </div>
              </div>

            {/* ── 05. STRUCTURE ──────────────────────────────────────────── */}
            <div className="space-y-6 pt-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <Layout className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight">Structure</h3>
                  <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">Layout & Borders</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0 text-[10px]">Border Radius</SLabel>
                    <span className="text-[10px] font-mono text-primary/60">{local.borderRadius}px</span>
                  </div>
                  <Slider
                    value={[local.borderRadius]}
                    min={0}
                    max={32}
                    step={2}
                    onValueChange={([v]) => update('borderRadius', v)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0 text-[10px]">Border Width</SLabel>
                    <span className="text-[10px] font-mono text-primary/60">{local.borderWidth}px</span>
                  </div>
                  <Slider
                    value={[local.borderWidth]}
                    min={0}
                    max={4}
                    step={0.5}
                    onValueChange={([v]) => update('borderWidth', v)}
                  />
                </div>

                <div className="space-y-3">
                  <SLabel className="text-[10px]">Border Style</SLabel>
                  <div className="flex gap-1.5 p-1 rounded-xl bg-muted/30 border border-border/40">
                    {(['solid', 'dashed', 'dotted'] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => update('borderStyle', v)}
                        className={cn(
                          'flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all',
                          local.borderStyle === v
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-muted/50'
                        )}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0 text-[10px]">Max Chat Width</SLabel>
                    <span className="text-[10px] font-mono text-primary/60">{local.chatMaxWidth}px</span>
                  </div>
                  <Slider
                    value={[local.chatMaxWidth]}
                    min={600}
                    max={1200}
                    step={50}
                    onValueChange={([v]) => update('chatMaxWidth', v)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0 text-[10px]">Message Spacing</SLabel>
                    <span className="text-[10px] font-mono text-primary/60">{local.messageSpacing}px</span>
                  </div>
                  <Slider
                    value={[local.messageSpacing]}
                    min={8}
                    max={64}
                    step={4}
                    onValueChange={([v]) => update('messageSpacing', v)}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <Row title="Smooth Animations" desc="Enable high-fidelity motion effects">
                  <Switch checked={local.animationsEnabled} onCheckedChange={(v) => update('animationsEnabled', v)} />
                </Row>
                <Row title="Glass Interface" desc="Apply depth and translucency effects">
                  <Switch 
                    checked={local.bubbleStyle === 'glass'} 
                    onCheckedChange={(v) => update('bubbleStyle', v ? 'glass' : 'modern')} 
                  />
                </Row>
              </div>
            </div>
          </div>
        )

      // ── Chat ──────────────────────────────────────────────────────────
      case 'chat':
        return (
          <div className="space-y-6">
            <div>
              <SLabel>Font Size</SLabel>
              <div className="grid grid-cols-3 gap-2">
                {(['small', 'medium', 'large'] as FontSize[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => update('fontSize', v)}
                    className={cn(
                      'py-3 rounded-xl border text-sm font-medium capitalize transition-all',
                      local.fontSize === v
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/40 text-muted-foreground hover:border-border hover:bg-muted/20',
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Row title="Compact Mode" desc="Reduce message spacing">
                <Switch checked={local.compactMode} onCheckedChange={(v) => update('compactMode', v)} />
              </Row>
              <Row title="Sound Effects" desc="Notification sounds">
                <Switch checked={local.soundEnabled} onCheckedChange={(v) => update('soundEnabled', v)} />
              </Row>
            </div>
          </div>
        )

      // ── Models ────────────────────────────────────────────────────────
      case 'models':
        return (
          <div className="space-y-6">
            {/* Registered models list */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <SLabel className="mb-0">Registered Models{models.length ? ` (${models.length})` : ''}</SLabel>
                <button
                  onClick={handleSync}
                  title="Sync from Ollama"
                  className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  <RefreshCw className={cn('h-3 w-3', (modelsLoading || syncing) && 'animate-spin')} />
                  Sync
                </button>
              </div>

              {modelsLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-3">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Loading...
                </div>
              ) : models.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground/40 rounded-xl border border-dashed border-border/40">
                  No models registered — click Sync to import from Ollama
                </div>
              ) : (
                <div className="space-y-1">
                  {models.map((m) => {
                    const providerLabel = m.provider === 'ollama' ? 'Ollama'
                      : CLOUD_PROVIDERS.find(p => m.api_base_url?.includes(p.url.replace('https://','').replace('http://','').split('/')[0]))?.label
                        ?? 'Cloud'
                    const isCloud = m.provider === 'openai-compat'
                    return (
                      <div key={m.id} className="group flex items-center gap-2 px-3 py-2 rounded-xl border border-border/40 bg-card/20 hover:bg-card/40 transition-colors">
                        <div className={cn('h-1.5 w-1.5 rounded-full shrink-0', m.is_active ? 'bg-emerald-500' : 'bg-muted-foreground/30')} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium truncate">{m.display_name}</p>
                            <span className={cn(
                              'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md shrink-0',
                              isCloud
                                ? 'bg-violet-500/15 text-violet-400 border border-violet-500/20'
                                : 'bg-primary/10 text-primary/60 border border-primary/15'
                            )}>
                              {providerLabel}
                            </span>
                            {isCloud && !m.has_api_key && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-[10px]">API Key missing</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground/40 truncate">{m.ollama_name}</p>
                        </div>
                        <Switch
                          checked={m.is_active}
                          onCheckedChange={() => handleToggleActive(m.id, m.is_active)}
                          className="shrink-0 scale-75"
                        />
                        <button
                          onClick={() => handleDeleteRegistered(m.id)}
                          disabled={deletingId === m.id}
                          className="opacity-0 group-hover:opacity-100 h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
                        >
                          {deletingId === m.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Register model manually */}
            <div>
              <SLabel>Register Model</SLabel>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ollama name (e.g. llama3:latest)"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddModel()}
                    className="flex-1 h-9 text-sm font-mono"
                  />
                  <Input
                    placeholder="Display name (optional)"
                    value={addDisplay}
                    onChange={(e) => setAddDisplay(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddModel()}
                    className="flex-1 h-9 text-sm"
                  />
                  <Button size="sm" onClick={handleAddModel} disabled={!addName.trim()} className="h-9 px-3 shrink-0">
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {addError && <p className="text-xs text-destructive">{addError}</p>}
              </div>
            </div>

            {/* Cloud / External Providers */}
            <div>
              <SLabel>Add Cloud Provider</SLabel>
              <div className="space-y-2.5">
                {/* Provider selector */}
                <div className="flex gap-1.5 flex-wrap">
                  {CLOUD_PROVIDERS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setCloudProvider(p.id)
                        if (p.id !== 'custom') setCloudBaseUrl(p.url)
                        else setCloudBaseUrl('')
                      }}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-[11px] font-medium border transition-all',
                        cloudProvider === p.id
                          ? 'bg-primary/15 border-primary/40 text-primary'
                          : 'border-border/40 text-muted-foreground hover:border-border hover:bg-muted/30'
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Base URL (editable, pre-filled) */}
                <Input
                  placeholder="API base URL"
                  value={cloudBaseUrl}
                  onChange={(e) => setCloudBaseUrl(e.target.value)}
                  className="h-9 text-xs font-mono"
                />

                {/* Model ID with suggestions */}
                {(() => {
                  const suggestions = CLOUD_PROVIDERS.find(p => p.id === cloudProvider)?.models ?? []
                  return (
                    <>
                      <Input
                        placeholder="Model ID (sent to the API)"
                        value={cloudModelId}
                        onChange={(e) => setCloudModelId(e.target.value)}
                        className="h-9 text-sm font-mono"
                      />
                      {suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {suggestions.map((s) => (
                            <button
                              key={s}
                              onClick={() => setCloudModelId(s)}
                              className={cn(
                                'px-2 py-1 rounded-lg text-[10px] font-mono border transition-all',
                                cloudModelId === s
                                  ? 'bg-primary/15 border-primary/40 text-primary'
                                  : 'border-border/30 text-muted-foreground/50 hover:border-border hover:text-foreground hover:bg-muted/20'
                              )}
                            >
                              {s.split('/').pop()}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )
                })()}

                {/* Display name */}
                <Input
                  placeholder="Display name (optional)"
                  value={cloudDisplayName}
                  onChange={(e) => setCloudDisplayName(e.target.value)}
                  className="h-9 text-sm"
                />

                {/* API key (hidden if not needed) */}
                {CLOUD_PROVIDERS.find(p => p.id === cloudProvider)?.needsKey && (
                  <Input
                    type="password"
                    placeholder="API key"
                    value={cloudApiKey}
                    onChange={(e) => setCloudApiKey(e.target.value)}
                    className="h-9 text-sm font-mono"
                  />
                )}

                {cloudError && <p className="text-xs text-destructive">{cloudError}</p>}

                <Button
                  size="sm"
                  onClick={handleAddCloudModel}
                  disabled={cloudAdding || !cloudModelId.trim()}
                  className="w-full h-9 gap-1.5"
                >
                  {cloudAdding
                    ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Adding…</>
                    : <><Plus className="h-3.5 w-3.5" /> Add Provider Model</>
                  }
                </Button>
              </div>
            </div>

            {/* Pull from Ollama */}
            <div>
              <SLabel>Pull from Ollama</SLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. llama3.2, codellama:7b"
                  value={pullName}
                  onChange={(e) => setPullName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePull()}
                  className="flex-1 h-9 text-sm"
                  disabled={isPulling}
                />
                <Button size="sm" onClick={handlePull} disabled={!pullName.trim() || isPulling} className="h-9 px-3 gap-1.5 shrink-0">
                  {isPulling ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Pull
                </Button>
              </div>
              {pullStatus && (
                <p className={cn('mt-2 text-xs px-3 py-2 rounded-xl border',
                  pullStatus.startsWith('✓') ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' :
                  pullStatus.startsWith('Error') ? 'text-destructive bg-destructive/10 border-destructive/20' :
                  'text-muted-foreground bg-muted/20 border-border/30',
                )}>
                  {pullStatus}
                </p>
              )}
            </div>
          </div>
        )

      // ── Model Lab ───────────────────────────────────────────────────
      case 'lab':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                    <Sparkles className="h-4 w-4 text-primary" />
                 </div>
                 <div>
                    <h3 className="text-[13px] font-bold">Model Intelligence Lab</h3>
                    <p className="text-[10.5px] text-muted-foreground/50">Compare capabilities and select the best intelligence for your task.</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {MODEL_CATEGORIES.map((cat) => (
                  <div key={cat.id} className="p-4 rounded-2xl border border-border/40 bg-card/20 hover:border-primary/30 transition-all group">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">{cat.id}</span>
                       <div className="h-1.5 w-1.5 rounded-full bg-primary/20 group-hover:bg-primary/60 transition-colors" />
                    </div>
                    <h4 className="text-[13px] font-bold mb-1">{cat.name}</h4>
                    <p className="text-[11px] text-muted-foreground/50 leading-relaxed">{cat.desc}</p>
                    
                    <div className="mt-4 flex flex-wrap gap-1.5">
                       {models.filter(m => {
                          const lowName = m.ollama_name.toLowerCase()
                          if (cat.id === 'Coding') return lowName.includes('coder') || lowName.includes('code')
                          if (cat.id === 'Reasoning') return lowName.includes('qwen') || lowName.includes('reasoning') || lowName.includes('phi')
                          if (cat.id === 'Fast') return lowName.includes('mistral') || lowName.includes('haiku')
                          return !lowName.includes('coder') && !lowName.includes('code') && !lowName.includes('qwen') && !lowName.includes('reasoning') && !lowName.includes('phi') && !lowName.includes('mistral') && !lowName.includes('haiku')
                       }).map(m => (
                         <span key={m.id} className="px-2 py-0.5 rounded-lg bg-background/50 border border-border/40 text-[9px] font-medium opacity-60">
                            {m.display_name}
                         </span>
                       ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <SLabel>Performance Comparison</SLabel>
              <div className="rounded-2xl border border-border/40 bg-card/20 overflow-hidden">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="bg-muted/30 border-b border-border/20">
                          <th className="px-4 py-3 text-[9px] uppercase font-bold text-muted-foreground/50 text-left">Model</th>
                          <th className="px-4 py-3 text-[9px] uppercase font-bold text-muted-foreground/50 text-left">Category</th>
                          <th className="px-4 py-3 text-[9px] uppercase font-bold text-muted-foreground/50 text-left">Speed</th>
                          <th className="px-4 py-3 text-[9px] uppercase font-bold text-muted-foreground/50 text-left">Reasoning</th>
                          <th className="px-4 py-3 text-[9px] uppercase font-bold text-muted-foreground/50 text-center">Action</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-border/10">
                        {models.slice(labPage * LAB_PAGE_SIZE, (labPage + 1) * LAB_PAGE_SIZE).map(m => {
                          const lowName = m.ollama_name.toLowerCase()
                          const usage = modelUsage.find(u => u.model === m.ollama_name)
                          
                          // Dynamic Speed Logic
                          let speedLevel = 1 // Low
                          const tps = usage?.tokens_per_sec ?? 0
                          if (tps > 40 || lowName.includes('mistral') || lowName.includes('haiku') || lowName.includes('phi')) speedLevel = 3
                          else if (tps > 15 || lowName.includes('llama3')) speedLevel = 2
                          
                          // Dynamic Reasoning Logic
                          let reasoningLabel = 'Standard'
                          if (lowName.includes('reasoning') || lowName.includes('qwen') || lowName.includes('llama3.1') || lowName.includes('pro')) reasoningLabel = 'Expert'
                          else if (lowName.includes('coder') || lowName.includes('phi')) reasoningLabel = 'Technical'
                          
                          return (
                            <tr key={m.id} className="hover:bg-primary/5 transition-colors group">
                               <td className="px-4 py-4 text-left">
                                  <div className="flex flex-col">
                                     <span className="text-[13px] font-bold">{m.display_name}</span>
                                     <span className="text-[9px] font-mono opacity-30">{m.ollama_name}</span>
                                  </div>
                               </td>
                               <td className="px-4 py-4 text-left">
                                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-muted/30 border border-border/40 font-bold uppercase tracking-wider">
                                     {lowName.includes('coder') ? 'Coding' : lowName.includes('phi') || lowName.includes('qwen') ? 'Reasoning' : 'General'}
                                  </span>
                               </td>
                               <td className="px-4 py-4 text-left">
                                  <div className="flex flex-col items-start gap-1.5">
                                    <div className="flex items-center gap-1">
                                       <div className={cn("h-1 w-3 rounded-full", speedLevel >= 1 ? 'bg-emerald-500' : 'bg-muted-foreground/20')} />
                                       <div className={cn("h-1 w-3 rounded-full", speedLevel >= 2 ? 'bg-emerald-500' : 'bg-muted-foreground/20')} />
                                       <div className={cn("h-1 w-3 rounded-full", speedLevel >= 3 ? 'bg-emerald-500' : 'bg-muted-foreground/20')} />
                                    </div>
                                    {tps > 0 && <span className="text-[8px] font-mono opacity-40">{tps.toFixed(1)} t/s</span>}
                                  </div>
                               </td>
                               <td className="px-4 py-4 text-left">
                                  <span className={cn("text-[10px] font-bold uppercase tracking-tight", reasoningLabel === 'Expert' ? 'text-primary' : reasoningLabel === 'Technical' ? 'text-emerald-500/70' : 'text-muted-foreground/60')}>
                                     {reasoningLabel}
                                  </span>
                               </td>
                               <td className="px-4 py-4 text-center">
                                  <Button 
                                    size="sm" 
                                    variant={local.model === m.ollama_name ? 'secondary' : 'outline'}
                                    disabled={local.model === m.ollama_name}
                                    onClick={() => update('model', m.ollama_name)}
                                    className="h-7 text-[10px] rounded-lg px-3 uppercase tracking-wider font-bold"
                                  >
                                     {local.model === m.ollama_name ? 'Active' : 'Switch'}
                                  </Button>
                               </td>
                            </tr>
                          )
                       })}
                    </tbody>
                 </table>
              </div>
              
              {/* Pagination */}
              {models.length > LAB_PAGE_SIZE && (
                 <div className="mt-4 flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground/40">
                       Showing {labPage * LAB_PAGE_SIZE + 1} to {Math.min((labPage + 1) * LAB_PAGE_SIZE, models.length)} of {models.length} models
                    </p>
                    <div className="flex items-center gap-1">
                       <Button 
                         variant="outline" 
                         size="sm" 
                         disabled={labPage === 0}
                         onClick={() => setLabPage(p => p - 1)}
                         className="h-7 w-7 p-0 rounded-lg"
                       >
                          <ChevronLeft className="h-3 w-3" />
                       </Button>
                       <Button 
                         variant="outline" 
                         size="sm" 
                         disabled={(labPage + 1) * LAB_PAGE_SIZE >= models.length}
                         onClick={() => setLabPage(p => p + 1)}
                         className="h-7 w-7 p-0 rounded-lg"
                       >
                          <ChevronRight className="h-3 w-3" />
                       </Button>
                    </div>
                 </div>
              )}
            </div>
          </div>
        )
      case 'session': {
        const totalMsgs = (session?.userMessages ?? 0) + (session?.assistantMessages ?? 0)
        const rows: { label: string; value: string; sub?: string }[] = [
          { label: 'Model', value: session?.model ?? '-' },
          { label: 'Backend', value: 'Local | Ollama' },
          { label: 'Total messages', value: String(totalMsgs) },
          { label: 'Your messages', value: String(session?.userMessages ?? 0) },
          { label: 'AI responses', value: String(session?.assistantMessages ?? 0) },
          { label: 'Est. tokens', value: session?.tokens ? session?.tokens.toLocaleString() : '—' },
          {
            label: 'Last response',
            value: session?.lastResponseMs != null ? (session?.lastResponseMs / 1000).toFixed(1) : '-',
            sub: session?.lastResponseMs != null ? 's' : undefined,
          },
          {
            label: 'Stream speed',
            value: session?.streamSpeed != null ? session?.streamSpeed.toLocaleString() : '-',
            sub: session?.streamSpeed != null ? ' ch/s' : undefined,
          },
        ]
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <SLabel className="mb-0">Current Session</SLabel>
                {usageLoading && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground/30" />}
              </div>
              <div className="rounded-xl border border-border/40 bg-card/20 divide-y divide-border/20">
                {rows.map(({ label, value, sub }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3">
                    <span className="text-[13px] text-muted-foreground/60">{label}</span>
                    <span className="text-[13px] font-medium text-foreground/80">
                      {value}{sub && <span className="text-muted-foreground/40 ml-0.5">{sub}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <SLabel>Global Usage (Lifetime)</SLabel>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-border/40 bg-card/20 space-y-1">
                  <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold">Total Tokens</p>
                  <p className="text-xl font-bold tracking-tight">
                    {globalUsage?.total_tokens ? globalUsage.total_tokens.toLocaleString() : '0'}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-border/40 bg-card/20 space-y-1">
                  <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold">Messages</p>
                  <p className="text-xl font-bold tracking-tight">
                    {globalUsage ? '—' : '0'}
                  </p>
                  <p className="text-[10px] text-muted-foreground/30 italic">Aggregate data</p>
                </div>
              </div>
              <div className="mt-3 rounded-xl border border-border/40 bg-card/20 divide-y divide-border/20">
                 <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-[12px] text-muted-foreground/60">Input (Prompt)</span>
                    <span className="text-[12px] font-mono text-primary/80">{globalUsage?.prompt_tokens?.toLocaleString() ?? 0}</span>
                 </div>
                 <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-[12px] text-muted-foreground/60">Output (Completion)</span>
                    <span className="text-[12px] font-mono text-emerald-500/80">{globalUsage?.completion_tokens?.toLocaleString() ?? 0}</span>
                 </div>
              </div>
            </div>

            <div>
              <SLabel>Model Activity (Lifetime)</SLabel>
              <div className="space-y-3">
                {modelUsage.length === 0 ? (
                   <div className="p-8 rounded-2xl border border-dashed border-border/40 text-center">
                      <p className="text-xs text-muted-foreground/40 italic">No model activity tracked yet</p>
                   </div>
                ) : (
                  modelUsage.map((m) => (
                    <div key={m.model} className="p-4 rounded-2xl border border-border/40 bg-card/20 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold">{m.display_name}</h4>
                          <div className="flex items-center gap-2">
                             <span className="px-1.5 py-0.5 rounded bg-primary/10 text-[9px] font-bold text-primary uppercase tracking-wider border border-primary/20">
                                {m.provider}
                             </span>
                             <span className="text-[10px] text-muted-foreground/40 font-medium">
                                {m.requests} requests
                             </span>
                          </div>
                        </div>
                        
                        {m.credits && (
                           <div className="text-right">
                              <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold">Credits</p>
                              <p className="text-xs font-mono font-bold text-primary">
                                 ${(m.credits.remaining * 1).toFixed(4)}
                              </p>
                              <p className="text-[9px] text-muted-foreground/30 italic">Provider Balance</p>
                           </div>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                           <p className="text-[9px] text-muted-foreground/40 uppercase font-bold tracking-tighter">Tokens</p>
                           <p className="text-sm font-mono font-bold">{(m.total_tokens / 1000).toFixed(1)}k</p>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[9px] text-muted-foreground/40 uppercase font-bold tracking-tighter">Input</p>
                           <p className="text-sm font-mono text-muted-foreground/60">{(m.prompt_tokens / 1000).toFixed(1)}k</p>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[9px] text-muted-foreground/40 uppercase font-bold tracking-tighter">Output</p>
                           <p className="text-sm font-mono text-emerald-500/60">{(m.completion_tokens / 1000).toFixed(1)}k</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {totalMsgs === 0 && modelUsage.length === 0 && (
              <p className="text-[12px] text-muted-foreground/40 text-center py-4">
                No active conversation. Start a chat to see live stats.
              </p>
            )}
          </div>
        )
      }

      // ── Database ──────────────────────────────────────────────────────
      case 'database':
        return (
          <PinGate
            authenticated={adminOk}
            pinInput={pinInput}
            onPinChange={setPinInput}
            onSubmit={checkPin}
            hasError={pinError}
          >
            <div className="space-y-6">
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                <p className="text-xs text-amber-400/80 leading-relaxed">
                  Database config is set in <code className="font-mono bg-black/20 px-1 rounded">backend/.env</code>. Use this panel to test a connection URL before updating the file.
                </p>
              </div>

              <div>
                <SLabel>Test Connection</SLabel>
                <div className="space-y-2">
                  <Input
                    placeholder="postgresql://user:pass@host:5432/db"
                    value={dbUrl}
                    onChange={(e) => { setDbUrl(e.target.value); setDbResult(null) }}
                    className="h-9 text-sm font-mono"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTestDb}
                    disabled={!dbUrl.trim() || dbTesting}
                    className="h-9 gap-1.5"
                  >
                    {dbTesting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}
                    Test Connection
                  </Button>
                  {dbResult && (
                    <div className={cn(
                      'px-3 py-2.5 rounded-xl border text-xs',
                      dbResult?.ok
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-destructive/10 border-destructive/20 text-destructive',
                    )}>
                      {dbResult?.ok ? '✓' : '✗'} {dbResult?.msg}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <SLabel>Environment Variables</SLabel>
                <div className="rounded-xl border border-border/40 bg-muted/15 px-4 py-3 space-y-1.5">
                  {[
                    { key: 'DATABASE_URL', desc: 'PostgreSQL connection string' },
                    { key: 'OLLAMA_URL', desc: 'Ollama API endpoint' },
                    { key: 'FRONTEND_URL', desc: 'CORS allowed origin' },
                  ].map(({ key, desc }) => (
                    <div key={key}>
                      <code className="text-[11px] font-mono text-primary/70">{key}</code>
                      <span className="text-[11px] text-muted-foreground/40 ml-2">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PinGate>
        )

      // ── Admin ─────────────────────────────────────────────────────────
      case 'admin':
        return (
          <PinGate
            authenticated={adminOk}
            pinInput={pinInput}
            onPinChange={setPinInput}
            onSubmit={checkPin}
            hasError={pinError}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <SLabel>System Status</SLabel>
                <button
                  onClick={loadStatus}
                  className="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted/40 transition-all mb-2"
                >
                  <RefreshCw className={cn('h-3 w-3', statusLoading && 'animate-spin')} />
                </button>
              </div>

              {status ? (
                <div className="space-y-1.5">
                  {[
                    {
                      label: 'Ollama',
                      icon: Server,
                      ok: status?.ollama?.status === 'ok',
                      detail: status?.ollama?.status === 'ok'
                        ? `${status?.ollama?.models} model${status?.ollama?.models !== 1 ? 's' : ''} | ${status?.ollama?.url}`
                        : 'Not reachable',
                    },
                    {
                      label: 'Database',
                      icon: HardDrive,
                      ok: status?.database?.status === 'ok',
                      detail: status?.database?.status === 'ok'
                        ? status?.database?.url
                        : 'Not connected',
                    },
                    {
                      label: 'Version',
                      icon: Activity,
                      ok: true,
                      detail: status?.version,
                    },
                  ].map(({ label, icon: Icon, ok, detail }) => (
                    <div key={label} className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-border/40 bg-card/20">
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground/50" />
                        <span className="text-sm font-medium">{label}</span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[11px] text-muted-foreground/50 truncate max-w-[180px]">{detail}</span>
                        <div className={cn(
                          'h-1.5 w-1.5 rounded-full shrink-0',
                          ok ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-destructive',
                        )} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <Button size="sm" variant="outline" onClick={loadStatus} className="gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" /> Load status
                  </Button>
                </div>
              )}

              <div>
                <SLabel>Change Admin PIN</SLabel>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="New PIN"
                    maxLength={8}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="flex-1 h-9 text-sm"
                  />
                  <Input
                    type="password"
                    placeholder="Confirm"
                    maxLength={8}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    className="flex-1 h-9 text-sm"
                  />
                  <Button size="sm" variant="outline" onClick={handleChangePin} className="h-9 px-3 shrink-0">
                    Set
                  </Button>
                </div>
                {pinMsg && (
                  <p className={cn(
                    'mt-1.5 text-xs',
                    pinMsg.startsWith('✓') ? 'text-emerald-500' : 'text-destructive',
                  )}>
                    {pinMsg}
                  </p>
                )}
              </div>
            </div>
          </PinGate>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); else setOpen(true) }}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
            <SettingsIcon className="h-4 w-4" />
            <span className="sr-only">Settings</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="p-0 gap-0 w-full max-w-[1000px] sm:max-w-[1000px] rounded-2xl overflow-hidden [&>button]:hidden">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">Customize your Graviton experience</DialogDescription>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40">
          <div>
            <p className="text-sm font-semibold">Settings</p>
            <p className="text-xs text-muted-foreground/60">Customize your Graviton experience</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
            onClick={handleClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex" style={{ height: '580px' }}>
          {/* Left nav */}
          <nav className="w-52 border-r border-border/40 bg-muted/15 p-2 flex flex-col gap-0.5 shrink-0">
            {mainNav.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSection(id)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium w-full text-left transition-all',
                  section === id
                    ? 'bg-background text-foreground shadow-sm border border-border/40'
                    : 'text-muted-foreground/60 hover:text-foreground hover:bg-background/50',
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </button>
            ))}

            {!isMobile && (
              <>
                <div className="my-1.5 mx-2 border-t border-border/30" />
                <p className="px-3 text-[10px] text-muted-foreground/30 mb-0.5">Admin</p>
                {adminNav.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setSection(id)}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium w-full text-left transition-all',
                      section === id
                        ? 'bg-background text-foreground shadow-sm border border-border/40'
                        : 'text-muted-foreground/60 hover:text-foreground hover:bg-background/50',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {label}
                    {!adminOk && <Lock className="h-2.5 w-2.5 ml-auto text-muted-foreground/25" />}
                  </button>
                ))}
              </>
            )}

            <div className="mt-auto pt-2 px-3">
              <p className="text-[10px] text-muted-foreground/25">Graviton v1.0</p>
            </div>
          </nav>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-none">
            {renderContent()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border/40 bg-muted/10">
          <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 text-xs px-3">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} className="h-8 text-xs px-4 gap-1.5">
            <Check className="h-3.5 w-3.5" />
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
