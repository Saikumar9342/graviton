'use client'

import { useState, useEffect } from 'react'
import {
  Palette, MessageSquare, Cpu, Database, Shield, Sun, Moon, Monitor,
  Check, Zap, Minimize2, Volume2, Plus, Trash2, RefreshCw,
  Lock, Unlock, Server, HardDrive, Activity, Settings, X, BarChart2, KeyRound, Eye, EyeOff,
} from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import {
  ACCENT_COLORS,
  OPENAI_MODELS,
  ANTHROPIC_MODELS,
  Settings as SettingsType,
  FontSize,
  BackgroundStyle,
} from '@/lib/types'
import {
  ModelInfo,
  AdminStatus,
  fetchModels,
  getAdminStatus,
  testDbConnection,
  pullModel,
  deleteModel,
} from '@/lib/api'

type Section = 'appearance' | 'chat' | 'models' | 'providers' | 'session' | 'database' | 'admin'

export interface SessionStats {
  model?: string
  userMessages: number
  assistantMessages: number
  tokens: number
  lastResponseMs?: number
  streamSpeed?: number
}

const ADMIN_PIN_KEY = 'graviton_admin_pin'
const DEFAULT_PIN = '0000'

interface SettingsDialogProps {
  settings: SettingsType
  onSave: (settings: SettingsType) => void
  session?: SessionStats
}

// ── PIN gate ────────────────────────────────────────────────────────────────
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
  onSubmit: () => void
  hasError: boolean
  children: React.ReactNode
}) {
  if (authenticated) return <>{children}</>
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 py-10">
      <div className="h-12 w-12 rounded-2xl bg-muted/40 border border-border/40 flex items-center justify-center">
        <Lock className="h-5 w-5 text-muted-foreground/60" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold">Admin access required</p>
        <p className="text-xs text-muted-foreground/60">Enter your PIN to continue</p>
      </div>
      <div className="flex gap-2">
        <Input
          type="password"
          placeholder="PIN"
          maxLength={8}
          value={pinInput}
          onChange={(e) => onPinChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          className={cn(
            'w-28 text-center tracking-widest h-9 text-sm',
            hasError && 'border-destructive focus-visible:ring-destructive/30',
          )}
        />
        <Button size="sm" onClick={onSubmit} className="h-9 px-3">
          <Unlock className="h-3.5 w-3.5" />
        </Button>
      </div>
      {hasError && <p className="text-xs text-destructive">Incorrect PIN</p>}
      <p className="text-[11px] text-muted-foreground/30">Default PIN: 0000</p>
    </div>
  )
}

function Row({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3.5 px-4 rounded-xl border border-border/40 bg-card/20">
      <div>
        <p className="text-sm font-medium">{title}</p>
        {desc && <p className="text-xs text-muted-foreground/60 mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  )
}

function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40 mb-3">
      {children}
    </p>
  )
}

export function SettingsDialog({ settings, onSave, session }: SettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [section, setSection] = useState<Section>('appearance')
  const [local, setLocal] = useState<SettingsType>(settings)
  const { theme, setTheme } = useTheme()
  const [isMobile, setIsMobile] = useState(false)

  // Admin auth
  const [adminOk, setAdminOk] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinMsg, setPinMsg] = useState('')

  // Providers tab
  const [showOpenAiKey, setShowOpenAiKey] = useState(false)
  const [showAnthropicKey, setShowAnthropicKey] = useState(false)

  // Models tab
  const [models, setModels] = useState<ModelInfo[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [pullName, setPullName] = useState('')
  const [pullStatus, setPullStatus] = useState('')
  const [isPulling, setIsPulling] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Database tab
  const [dbUrl, setDbUrl] = useState('')
  const [dbResult, setDbResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [dbTesting, setDbTesting] = useState(false)

  // Admin tab
  const [status, setStatus] = useState<AdminStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => { setLocal(settings) }, [settings])

  useEffect(() => {
    if (!open) return
    if (section === 'models') loadModels()
    if (section === 'admin' && adminOk) loadStatus()
  }, [section, open, adminOk])

  const update = <K extends keyof SettingsType>(k: K, v: SettingsType[K]) =>
    setLocal((s) => ({ ...s, [k]: v }))

  const handleTheme = (t: 'light' | 'dark' | 'system') => {
    setTheme(t)
    update('theme', t)
  }

  const handleSave = () => { onSave(local); setOpen(false) }

  const handleClose = () => {
    setOpen(false)
    setSection('appearance')
    setAdminOk(false)
    setPinInput('')
    setPinError(false)
  }

  const checkPin = () => {
    const stored = localStorage.getItem(ADMIN_PIN_KEY) || DEFAULT_PIN
    if (pinInput === stored) { setAdminOk(true); setPinError(false); setPinInput('') }
    else setPinError(true)
  }

  const handleChangePin = () => {
    if (newPin.length < 4) { setPinMsg('PIN must be at least 4 digits'); return }
    if (newPin !== confirmPin) { setPinMsg('PINs do not match'); return }
    localStorage.setItem(ADMIN_PIN_KEY, newPin)
    setNewPin(''); setConfirmPin('')
    setPinMsg('✓ PIN updated')
    setTimeout(() => setPinMsg(''), 3000)
  }

  const loadModels = async () => {
    setModelsLoading(true)
    try { setModels(await fetchModels()) }
    finally { setModelsLoading(false) }
  }

  const loadStatus = async () => {
    setStatusLoading(true)
    try { setStatus(await getAdminStatus()) }
    catch { setStatus(null) }
    finally { setStatusLoading(false) }
  }

  const handlePull = async () => {
    if (!pullName.trim() || isPulling) return
    setIsPulling(true)
    setPullStatus('Starting…')
    try {
      await pullModel(pullName.trim(), setPullStatus)
      setPullStatus('✓ Download complete')
      setPullName('')
      await loadModels()
      setTimeout(() => setPullStatus(''), 4000)
    } catch (e: any) {
      setPullStatus(`Error: ${e.message}`)
    } finally {
      setIsPulling(false)
    }
  }

  const handleDeleteModel = async (id: string) => {
    if (!window.confirm(`Delete "${id}"? This will remove it from Ollama.`)) return
    setDeletingId(id)
    try { await deleteModel(id); await loadModels() }
    catch { /* ignore */ }
    finally { setDeletingId(null) }
  }

  const handleTestDb = async () => {
    if (!dbUrl.trim()) return
    setDbTesting(true); setDbResult(null)
    try {
      const r = await testDbConnection(dbUrl.trim())
      setDbResult({ ok: true, msg: r.message })
    } catch (e: any) {
      setDbResult({ ok: false, msg: e.message })
    } finally {
      setDbTesting(false)
    }
  }

  // ── Nav items ────────────────────────────────────────────────────────────
  const mainNav: { id: Section; label: string; icon: React.ElementType }[] = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'models', label: 'Models', icon: Cpu },
    { id: 'providers', label: 'Providers', icon: KeyRound },
    { id: 'session', label: 'Session', icon: BarChart2 },
  ]
  const adminNav: { id: Section; label: string; icon: React.ElementType }[] = [
    { id: 'database', label: 'Database', icon: Database },
    { id: 'admin', label: 'Admin', icon: Shield },
  ]

  // ── Section content ──────────────────────────────────────────────────────
  const renderContent = () => {
    switch (section) {

      // ── Appearance ────────────────────────────────────────────────────
      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <SLabel>Theme</SLabel>
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
                      'flex flex-col items-center gap-2 py-3.5 rounded-xl border text-xs font-medium transition-all',
                      theme === v
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/40 text-muted-foreground hover:border-border hover:bg-muted/30',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <SLabel>Accent Color</SLabel>
              <div className="flex flex-wrap gap-2">
                {ACCENT_COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => update('accentColor', c.id)}
                    title={c.name}
                    className={cn(
                      'h-9 w-9 rounded-full transition-all hover:scale-110 flex items-center justify-center',
                      c.class,
                      local.accentColor === c.id && 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110',
                    )}
                  >
                    {local.accentColor === c.id && <Check className="h-4 w-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <SLabel>Background</SLabel>
              <div className="grid grid-cols-2 gap-2">
                {(['solid', 'gradient', 'aurora', 'mesh'] as BackgroundStyle[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => update('backgroundStyle', v)}
                    className={cn(
                      'relative h-14 rounded-xl border-2 text-xs font-medium capitalize transition-all',
                      local.backgroundStyle === v
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-border/40 text-muted-foreground/60 hover:border-border hover:bg-muted/20',
                    )}
                  >
                    {v}
                    {local.backgroundStyle === v && (
                      <Check className="absolute top-1.5 right-1.5 h-3 w-3 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Row title="Animations" desc="Smooth transitions and effects">
              <Switch checked={local.animationsEnabled} onCheckedChange={(v) => update('animationsEnabled', v)} />
            </Row>
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
            <div className="flex items-center justify-between">
              <SLabel>Installed Models{models.length ? ` (${models.length})` : ''}</SLabel>
              <button
                onClick={loadModels}
                className="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted/40 transition-all mb-2"
              >
                <RefreshCw className={cn('h-3 w-3', modelsLoading && 'animate-spin')} />
              </button>
            </div>

            {modelsLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-3">
                <RefreshCw className="h-3 w-3 animate-spin" /> Loading…
              </div>
            ) : models.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground/40 rounded-xl border border-dashed border-border/40">
                No models found — is Ollama running?
              </div>
            ) : (
              <div className="space-y-1">
                {models.map((m) => (
                  <div
                    key={m.id}
                    className="group flex items-center justify-between px-3 py-2.5 rounded-xl border border-border/40 bg-card/20 hover:bg-card/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 shrink-0" />
                      <span className="text-sm font-medium">{m.name}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteModel(m.id)}
                      disabled={deletingId === m.id}
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
                    >
                      {deletingId === m.id
                        ? <RefreshCw className="h-3 w-3 animate-spin" />
                        : <Trash2 className="h-3 w-3" />}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div>
              <SLabel>Pull New Model</SLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. llama3.2, codellama:7b"
                  value={pullName}
                  onChange={(e) => setPullName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePull()}
                  className="flex-1 h-9 text-sm"
                  disabled={isPulling}
                />
                <Button
                  size="sm"
                  onClick={handlePull}
                  disabled={!pullName.trim() || isPulling}
                  className="h-9 px-3 gap-1.5 shrink-0"
                >
                  {isPulling ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Pull
                </Button>
              </div>
              {pullStatus && (
                <p className={cn(
                  'mt-2 text-xs px-3 py-2 rounded-xl border',
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

      // ── Providers ────────────────────────────────────────────────────
      case 'providers': {
        const providerConfig = [
          {
            id: 'openai' as const,
            name: 'OpenAI',
            keyField: 'openaiApiKey' as const,
            placeholder: 'sk-…',
            show: showOpenAiKey,
            onToggle: () => setShowOpenAiKey((v) => !v),
            models: OPENAI_MODELS,
            docsHref: 'https://platform.openai.com/api-keys',
            color: 'text-emerald-400',
          },
          {
            id: 'anthropic' as const,
            name: 'Anthropic',
            keyField: 'anthropicApiKey' as const,
            placeholder: 'sk-ant-…',
            show: showAnthropicKey,
            onToggle: () => setShowAnthropicKey((v) => !v),
            models: ANTHROPIC_MODELS,
            docsHref: 'https://console.anthropic.com/account/keys',
            color: 'text-amber-400',
          },
        ]
        return (
          <div className="space-y-6">
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
              <p className="text-xs text-blue-400/80 leading-relaxed">
                API keys are stored locally in your browser and sent only to the respective provider. Ollama models work without any key.
              </p>
            </div>

            {providerConfig.map((p) => (
              <div key={p.id}>
                <SLabel>{p.name}</SLabel>
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type={p.show ? 'text' : 'password'}
                      placeholder={p.placeholder}
                      value={local[p.keyField]}
                      onChange={(e) => update(p.keyField, e.target.value)}
                      className="h-9 text-sm font-mono pr-9"
                    />
                    <button
                      type="button"
                      onClick={p.onToggle}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                    >
                      {p.show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  {local[p.keyField] ? (
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                      <p className="text-[11px] text-emerald-400/80 font-medium mb-1">Unlocked models:</p>
                      <div className="flex flex-wrap gap-1">
                        {p.models.map((m) => (
                          <span key={m.id} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400/80 font-medium">
                            {m.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground/40">
                      No key set. Models: {p.models.map((m) => m.name).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            ))}

            <div>
              <SLabel>Ollama (Local)</SLabel>
              <div className="rounded-xl border border-border/40 bg-card/20 px-4 py-3 flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Always available</p>
                  <p className="text-[11px] text-muted-foreground/50 mt-0.5">No API key required — runs on your machine</p>
                </div>
              </div>
            </div>
          </div>
        )
      }

      // ── Session ───────────────────────────────────────────────────────
      case 'session': {
        const totalMsgs = (session?.userMessages ?? 0) + (session?.assistantMessages ?? 0)
        const rows: { label: string; value: string; sub?: string }[] = [
          { label: 'Model', value: session?.model ?? '—' },
          { label: 'Backend', value: 'Local · Ollama' },
          { label: 'Total messages', value: String(totalMsgs) },
          { label: 'Your messages', value: String(session?.userMessages ?? 0) },
          { label: 'AI responses', value: String(session?.assistantMessages ?? 0) },
          { label: 'Est. tokens', value: session?.tokens ? session.tokens.toLocaleString() : '—' },
          {
            label: 'Last response',
            value: session?.lastResponseMs != null ? (session.lastResponseMs / 1000).toFixed(1) : '—',
            sub: session?.lastResponseMs != null ? 's' : undefined,
          },
          {
            label: 'Stream speed',
            value: session?.streamSpeed != null ? session.streamSpeed.toLocaleString() : '—',
            sub: session?.streamSpeed != null ? ' ch/s' : undefined,
          },
        ]
        return (
          <div className="space-y-6">
            <div>
              <SLabel>Current Session</SLabel>
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
            {totalMsgs === 0 && (
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
                      dbResult.ok
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-destructive/10 border-destructive/20 text-destructive',
                    )}>
                      {dbResult.ok ? '✓' : '✗'} {dbResult.msg}
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
                      ok: status.ollama.status === 'ok',
                      detail: status.ollama.status === 'ok'
                        ? `${status.ollama.models} model${status.ollama.models !== 1 ? 's' : ''} · ${status.ollama.url}`
                        : 'Not reachable',
                    },
                    {
                      label: 'Database',
                      icon: HardDrive,
                      ok: status.database.status === 'ok',
                      detail: status.database.status === 'ok'
                        ? status.database.url
                        : 'Not connected',
                    },
                    {
                      label: 'Version',
                      icon: Activity,
                      ok: true,
                      detail: status.version,
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
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="p-0 gap-0 w-full max-w-[800px] sm:max-w-[800px] rounded-2xl overflow-hidden [&>button]:hidden">
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
