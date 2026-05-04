"use client";

import { useState, useEffect, useRef } from "react";
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
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useTheme } from "@/components/theme-provider";
import { useAppearancePreview } from "@/hooks/use-appearance-preview";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
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
} from "@/lib/api";
import {
  type Settings,
  type ChatBubbleStyle,
  type FontSize,
  type BackgroundStyle,
  ACCENT_COLORS,
  FONT_FAMILIES,
  MODEL_CATEGORIES,
  PRESET_THEMES,
  TOPIC_REGISTRY,
  CITY_SUGGESTIONS,
} from "@/lib/types";
import { useModelsStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { AppearanceSettings } from "./settings/appearance-settings";
import { ThemesSettings } from "./settings/themes-settings";
import { SLabel, Row } from "./settings/shared";

export interface SessionStats {
  model: string;
  tokens: number;
  userMessages: number;
  assistantMessages: number;
  lastResponseMs?: number;
  streamSpeed?: number;
}

interface SettingsDialogProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
  session?: SessionStats;
  children?: React.ReactNode;
}



function PinGate({
  authenticated,
  pinInput,
  onPinChange,
  onSubmit,
  hasError,
  children,
}: {
  authenticated: boolean;
  pinInput: string;
  onPinChange: (v: string) => void;
  onSubmit: (pin?: string) => void;
  hasError: boolean;
  children: React.ReactNode;
}) {
  if (authenticated) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
        <Lock className="h-6 w-6" />
      </div>
      <div className="text-center space-y-1.5">
        <h3 className="text-base font-semibold">Admin Area Protected</h3>
        <p className="text-xs text-muted-foreground/60">
          Enter your PIN to access system configurations
        </p>
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
            const v = e.target.value.replace(/\D/g, "");
            onPinChange(v);
            if (v.length === 4) onSubmit(v);
          }}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          className={cn(
            "w-32 h-9 text-center text-sm tracking-widest rounded-xl border bg-muted/20 px-3 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all",
            hasError
              ? "border-destructive text-destructive"
              : "border-border/40",
          )}
        />
        {hasError && (
          <p className="text-xs text-destructive -mt-2">Incorrect PIN</p>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSubmit()}
          className="text-xs font-medium text-primary hover:text-primary hover:bg-primary/5"
        >
          Unlock Panel
        </Button>
      </div>
    </div>
  );
}

const CLOUD_PROVIDERS = [
  {
    id: "nvidia",
    label: "NVIDIA NIM",
    url: "https://integrate.api.nvidia.com/v1",
    needsKey: true,
    models: [
      "meta/llama-3.1-8b-instruct",
      "meta/llama-3.1-70b-instruct",
      "meta/llama-3.3-70b-instruct",
      "mistralai/mistral-7b-instruct-v0.3",
      "microsoft/phi-3-mini-4k-instruct",
      "google/gemma-2-9b-it",
    ],
  },
  {
    id: "groq",
    label: "Groq",
    url: "https://api.groq.com/openai/v1",
    needsKey: true,
    models: [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "llama-4-scout",
      "qwen-3-32b",
      "gpt-oss-120b",
      "deepseek-r1-distill-llama-70b",
    ],
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    url: "https://openrouter.ai/api/v1",
    needsKey: true,
    models: [
      "anthropic/claude-sonnet-4-5",
      "anthropic/claude-3-5-haiku",
      "openai/gpt-4o",
      "openai/gpt-4o-mini",
      "google/gemini-2.0-flash-001",
      "meta-llama/llama-3.3-70b-instruct",
      "deepseek/deepseek-r1",
    ],
  },
  {
    id: "together",
    label: "Together AI",
    url: "https://api.together.xyz/v1",
    needsKey: true,
    models: [
      "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
      "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
      "mistralai/Mixtral-8x7B-Instruct-v0.1",
      "deepseek-ai/DeepSeek-R1",
    ],
  },
  {
    id: "fireworks",
    label: "Fireworks AI",
    url: "https://api.fireworks.ai/inference/v1",
    needsKey: true,
    models: [
      "accounts/fireworks/models/llama-v3p1-8b-instruct",
      "accounts/fireworks/models/llama-v3p1-70b-instruct",
      "accounts/fireworks/models/mixtral-8x7b-instruct",
    ],
  },
  {
    id: "lmstudio",
    label: "LM Studio",
    url: "http://localhost:1234/v1",
    needsKey: false,
    models: [],
  },
  {
    id: "custom",
    label: "Custom",
    url: "",
    needsKey: true,
    models: [],
  },
] as const;

type Section =
  | "themes"
  | "appearance"
  | "chat"
  | "models"
  | "lab"
  | "session"
  | "database"
  | "admin"
  | "dashboard";

export function SettingsDialog({
  settings,
  onSave,
  session,
  children,
}: SettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<Section>("themes");
  const [local, setLocal] = useState<Settings>(settings);
  const { theme, setTheme } = useTheme();
  const { updatePreview, resetPreview } = useAppearancePreview(local, setTheme);
  const isMobile = useIsMobile();

  // Admin / Models State
  const [adminOk, setAdminOk] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  const { models, load: reloadModels, setModels } = useModelsStore();
  const [modelsLoading, setModelsLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [modelSearch, setModelSearch] = useState("");
  const [modelPage, setModelPage] = useState(0);
  const MODELS_PER_PAGE = 5;
  const [addName, setAddName] = useState("");
  const [addDisplay, setAddDisplay] = useState("");
  const [addError, setAddError] = useState("");
  const [pullName, setPullName] = useState("");
  const [pullStatus, setPullStatus] = useState("");
  const [isPulling, setIsPulling] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [status, setStatus] = useState<AdminStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [dbUrl, setDbUrl] = useState("");
  const [dbTesting, setDbTesting] = useState(false);
  const [dbResult, setDbResult] = useState<{ ok: boolean; msg: string } | null>(
    null,
  );

  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinMsg, setPinMsg] = useState("");

  // Cloud provider state
  const [cloudProvider, setCloudProvider] = useState("nvidia");
  const [cloudModelId, setCloudModelId] = useState("");
  const [cloudDisplayName, setCloudDisplayName] = useState("");
  const [cloudApiKey, setCloudApiKey] = useState("");
  const [cloudBaseUrl, setCloudBaseUrl] = useState("");
  const [cloudError, setCloudError] = useState("");
  const [cloudAdding, setCloudAdding] = useState(false);

  // Lab Pagination
  const [labPage, setLabPage] = useState(0);
  const LAB_PAGE_SIZE = 5;

  // Dashboard
  const [expandedDashCat, setExpandedDashCat] = useState<string | null>(null);
  const [cityOpen, setCityOpen] = useState(false);
  const cityRef = useRef<HTMLDivElement>(null);

  const [addModelType, setAddModelType] = useState<
    "text" | "vision" | "image-generation"
  >("text");
  const [cloudModelType, setCloudModelType] = useState<
    "text" | "vision" | "image-generation"
  >("text");

  const [globalUsage, setGlobalUsage] = useState<{
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  } | null>(null);
  const [modelUsage, setModelUsage] = useState<ModelUsage[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLocal(settings);
      if (section === "models") {
        setModelsLoading(true);
        reloadModels().finally(() => setModelsLoading(false));
      }
      if (section === "admin") loadStatus();
    }
  }, [open, settings]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (section === "models" && open) {
      setModelsLoading(true);
      reloadModels().finally(() => setModelsLoading(false));
    }
    if (section === "admin" && open) loadStatus();
    if ((section === "session" || section === "lab") && open) {
      setUsageLoading(true);
      Promise.all([
        fetchGlobalUsage().then(setGlobalUsage),
        fetchModelUsage().then(setModelUsage),
      ]).finally(() => setUsageLoading(false));
    }
  }, [section, open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh usage stats periodically
  useEffect(() => {
    if (!open || (section !== "session" && section !== "lab")) return;
    const interval = setInterval(() => {
      fetchGlobalUsage().then(setGlobalUsage);
      fetchModelUsage().then(setModelUsage);
    }, 3000);
    return () => clearInterval(interval);
  }, [open, section]);

  // Refresh relative timestamps every minute
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, [open]);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const next = { ...local, [key]: value };
    setLocal(next);
    updatePreview(key, value);
  };

  const handleSave = () => {
    onSave(local);
    setOpen(false);
  };

  const handleClose = () => {
    setLocal(settings);
    setOpen(false);
    resetPreview(settings);
  };

  const handleTheme = (t: "light" | "dark" | "system") => {
    update("theme", t);
  };

  const checkPin = (pin?: string) => {
    const p = pin ?? pinInput;
    if (p === "1234" || localStorage.getItem("admin-unlocked") === "true") {
      setAdminOk(true);
      localStorage.setItem("admin-unlocked", "true");
    } else {
      setPinError(true);
      setPinInput("");
      setTimeout(() => setPinError(false), 500);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncRegisteredModels();
      await reloadModels();
    } finally {
      setSyncing(false);
    }
  };

  const handleAddModel = async () => {
    if (!addName.trim()) return;
    setAddError("");
    try {
      const display =
        addDisplay.trim() ||
        addName
          .split(":")[0]
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
      const created = await createRegisteredModel({
        ollama_name: addName.trim(),
        display_name: display,
        model_type: addModelType,
      });
      setModels([...models, created]);
      setAddName("");
      setAddDisplay("");
    } catch (e: any) {
      setAddError(e.message);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    const updated = await updateRegisteredModel(id, { is_active: !current });
    setModels(models.map((m) => (m.id === id ? updated : m)));
  };

  const handleDeleteRegistered = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteRegisteredModel(id);
      setModels(models.filter((m) => m.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddCloudModel = async () => {
    if (!cloudModelId.trim()) {
      setCloudError("Model ID is required");
      return;
    }
    const providerMeta = CLOUD_PROVIDERS.find((p) => p.id === cloudProvider);
    const baseUrl = cloudBaseUrl.trim() || providerMeta?.url || "";
    if (!baseUrl) {
      setCloudError("Base URL is required");
      return;
    }
    if (providerMeta?.needsKey && !cloudApiKey.trim()) {
      setCloudError("API key is required for this provider");
      return;
    }
    setCloudError("");
    setCloudAdding(true);
    try {
      const display =
        cloudDisplayName.trim() ||
        cloudModelId
          .split("/")
          .pop()!
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
      const created = await createRegisteredModel({
        ollama_name: cloudModelId.trim(),
        display_name: display,
        provider: "openai-compat",
        model_type: cloudModelType,
        api_base_url: baseUrl,
        api_key: cloudApiKey.trim() || undefined,
      });
      setModels([...models, created]);
      setCloudModelId("");
      setCloudDisplayName("");
      setCloudApiKey("");
    } catch (e: any) {
      setCloudError(e.message);
    } finally {
      setCloudAdding(false);
    }
  };

  const handlePull = async () => {
    if (!pullName.trim()) return;
    setIsPulling(true);
    setPullStatus("Starting...");
    try {
      await pullModel(pullName, setPullStatus);
      setPullStatus("✓ Model ready — click Sync to register it");
      setPullName("");
    } catch (e: any) {
      setPullStatus(`Error: ${e.message}`);
    } finally {
      setIsPulling(false);
    }
  };

  const loadStatus = async () => {
    setStatusLoading(true);
    try {
      const data = await getAdminStatus();
      setStatus(data);
    } catch {
      setStatus(null);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleTestDb = async () => {
    setDbTesting(true);
    setDbResult(null);
    try {
      const res = await testDbConnection(dbUrl);
      setDbResult({ ok: res.status === "ok", msg: res.message });
    } catch (e: any) {
      setDbResult({ ok: false, msg: e.message });
    } finally {
      setDbTesting(false);
    }
  };

  const handleChangePin = () => {
    if (!newPin || newPin !== confirmPin) {
      setPinMsg("PINs do not match");
      return;
    }
    setPinMsg("✓ PIN updated (simulated)");
    setTimeout(() => setPinMsg(""), 2000);
  };

  const mainNav = [
    { id: "themes", label: "Themes", icon: Palette },
    { id: "appearance", label: "Appearance", icon: Sun },
    { id: "chat", label: "Chat Settings", icon: Sparkles },
    { id: "dashboard", label: "Dashboard", icon: Layout },
    { id: "models", label: "Local Models", icon: Server },
    { id: "lab", label: "Model Lab", icon: Sparkles },
    { id: "session", label: "Session Info", icon: Activity },
  ] as const;

  const adminNav = [
    { id: "database", label: "Database", icon: HardDrive },
    { id: "admin", label: "System Admin", icon: Lock },
  ] as const;

  const applyPreset = (preset: typeof PRESET_THEMES[number]) => {
    const next = { ...local, ...preset.vars, themePreset: preset.id } as Settings;
    setLocal(next);
    // Set the preset attribute first — CSS block vars take effect, inline overrides cleared
    updatePreview('themePreset' as any, preset.id);
    // Then apply the preset's explicit vars on top (e.g. accentColor, borderRadius)
    Object.entries(preset.vars).forEach(([key, value]) => {
      updatePreview(key as keyof Settings, value);
    });
  };

  const renderContent = () => {
    switch (section) {
      case "themes": {
        const activePresetId = PRESET_THEMES.find(p =>
          p.vars.accentColor === local.accentColor &&
          p.vars.theme === local.theme &&
          (p.vars.borderRadius === undefined || p.vars.borderRadius === local.borderRadius)
        )?.id ?? null;

        return (
          <div className="space-y-5 max-h-[540px] overflow-y-auto pr-2 scrollbar-none pb-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <Palette className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-tight">Theme Presets</h3>
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">One-click complete looks</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {PRESET_THEMES.map((preset) => {
                const isActive = activePresetId === preset.id;
                const isDark = preset.vars.theme === 'dark';
                const accent = preset.vars.accentColor ?? '#888';
                const radius = preset.vars.borderRadius ?? 12;
                const isMono = preset.vars.fontFamily?.includes('Mono');
                // Simulated bg/fg tones per preset for the mini-preview
                const previewBg: Record<string, string> = {
                  'editorial-dark':  '#222018',
                  'editorial-light': '#f9f6f0',
                  'midnight-violet': '#0e0b18',
                  'ocean-glass':     '#0b1220',
                  'forest-mono':     '#0a100a',
                  'rose-dawn':       '#fff8f7',
                  'amber-tech':      '#100d07',
                  'sky-clean':       '#f5f8ff',
                };
                const previewFg: Record<string, string> = {
                  'editorial-dark':  '#e8e0d0',
                  'editorial-light': '#1a1410',
                  'midnight-violet': '#ede8ff',
                  'ocean-glass':     '#e0f4ff',
                  'forest-mono':     '#80ffb0',
                  'rose-dawn':       '#2a1015',
                  'amber-tech':      '#f0c060',
                  'sky-clean':       '#1a2840',
                };
                const bg = previewBg[preset.id] ?? (isDark ? '#1a1a1a' : '#f8f8f8');
                const fg = previewFg[preset.id] ?? (isDark ? '#e8e8e8' : '#1a1a1a');
                const rule = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';

                return (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className={cn(
                      "relative text-left border transition-all duration-200 overflow-hidden group",
                      isActive
                        ? "border-primary shadow-md shadow-primary/20"
                        : "border-border/40 hover:border-border/80"
                    )}
                    style={{ borderRadius: 10 }}
                  >
                    {/* Mini UI preview */}
                    <div
                      className="relative overflow-hidden"
                      style={{ background: bg, height: 88, borderBottom: `1px solid ${rule}` }}
                    >
                      {/* Fake sidebar strip */}
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 28, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', borderRight: `1px solid ${rule}` }} />
                      {/* Fake header */}
                      <div style={{ position: 'absolute', left: 28, right: 0, top: 0, height: 18, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderBottom: `1px solid ${rule}`, display: 'flex', alignItems: 'center', paddingLeft: 8, gap: 4 }}>
                        <div style={{ width: 28, height: 5, background: fg, opacity: 0.7, borderRadius: radius / 4 }} />
                        <div style={{ flex: 1 }} />
                        <div style={{ width: 14, height: 5, background: accent, opacity: 0.8, borderRadius: radius / 4 }} />
                      </div>
                      {/* Fake message bubbles */}
                      <div style={{ position: 'absolute', left: 38, right: 8, top: 26, display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <div style={{ alignSelf: 'flex-end', width: '55%', height: 10, background: accent, opacity: 0.85, borderRadius: radius / 3 }} />
                        <div style={{ alignSelf: 'flex-start', width: '70%', height: 10, background: fg, opacity: 0.18, borderRadius: radius / 3 }} />
                        <div style={{ alignSelf: 'flex-start', width: '50%', height: 10, background: fg, opacity: 0.12, borderRadius: radius / 3 }} />
                      </div>
                      {/* Fake input bar */}
                      <div style={{ position: 'absolute', left: 32, right: 8, bottom: 8, height: 14, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', border: `1px solid ${rule}`, borderRadius: radius / 3, display: 'flex', alignItems: 'center', paddingRight: 4, gap: 4 }}>
                        <div style={{ flex: 1, height: 4, background: fg, opacity: 0.08, marginLeft: 6, borderRadius: 2 }} />
                        <div style={{ width: 14, height: 9, background: accent, opacity: 0.9, borderRadius: radius / 4 }} />
                      </div>
                      {/* Active checkmark */}
                      {isActive && (
                        <div style={{ position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check style={{ width: 9, height: 9, color: isDark ? '#000' : '#fff' }} />
                        </div>
                      )}
                    </div>

                    {/* Label row */}
                    <div className="px-3 py-2.5 bg-muted/10">
                      <div className="flex items-center gap-2">
                        <span className="text-base leading-none">{preset.emoji}</span>
                        <span className="text-[13px] font-semibold leading-tight flex-1">{preset.name}</span>
                        {isActive && <span className="text-[9px] font-bold uppercase tracking-wider text-primary">Active</span>}
                      </div>
                      <p className="text-[10px] text-muted-foreground/55 mt-1 leading-snug">{preset.description}</p>
                      {/* Tags */}
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        <span className="text-[9px] px-1.5 py-0.5 rounded border border-border/40 text-muted-foreground/50 font-mono uppercase">
                          {preset.vars.theme}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded border border-border/40 text-muted-foreground/50 font-mono uppercase">
                          r{radius}
                        </span>
                        {isMono && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded border border-border/40 text-muted-foreground/50 font-mono uppercase">
                            mono
                          </span>
                        )}
                        {(preset.vars.glowIntensity ?? 0) > 0 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded border border-border/40 text-muted-foreground/50 font-mono uppercase">
                            glow
                          </span>
                        )}
                        {(preset.vars.glassBlur ?? 0) > 0 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded border border-border/40 text-muted-foreground/50 font-mono uppercase">
                            glass
                          </span>
                        )}
                        {preset.vars.backgroundPattern && preset.vars.backgroundPattern !== 'none' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded border border-border/40 text-muted-foreground/50 font-mono uppercase">
                            {preset.vars.backgroundPattern}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-border/30">
              <p className="text-[11px] text-muted-foreground/40 leading-relaxed">
                Each preset changes colour, radius, font, glow & density in one click. Fine-tune in{' '}
                <button className="underline text-muted-foreground/60 hover:text-foreground" onClick={() => setSection("appearance")}>Appearance</button>.
                {' '}All changes save when you click <strong>Save Changes</strong>.
              </p>
            </div>
          </div>
        );
      }

      case "appearance":
        return (
          <div className="space-y-10 max-h-[550px] overflow-y-auto pr-4 scrollbar-none pb-8">
            {/* ── 01. THEME & ACCENT ─────────────────────────────────────── */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <Palette className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight">
                    Theme & Accent
                  </h3>
                  <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">
                    Core Aesthetics
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { v: "light", label: "Light", Icon: Sun },
                    { v: "dark", label: "Dark", Icon: Moon },
                    { v: "system", label: "System", Icon: Monitor },
                  ] as const
                ).map(({ v, label, Icon }) => (
                  <button
                    key={v}
                    onClick={() => handleTheme(v)}
                    className={cn(
                      "flex flex-col items-center gap-2 py-3.5 rounded-2xl border text-[11px] font-medium transition-all group relative overflow-hidden",
                      theme === v
                        ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10"
                        : "border-border/40 text-muted-foreground hover:border-border hover:bg-muted/30",
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
                    <div
                      className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_var(--primary)]"
                      style={{ backgroundColor: local.accentColor }}
                    />
                    <code className="text-[11px] font-mono font-bold text-primary uppercase">
                      {local.accentColor}
                    </code>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {ACCENT_COLORS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => update("accentColor", c.hex)}
                      className={cn(
                        "h-10 w-10 rounded-2xl transition-all hover:scale-110 flex items-center justify-center relative shadow-sm ring-offset-2 ring-offset-background group",
                        local.accentColor === c.hex &&
                          "ring-2 ring-primary scale-105",
                      )}
                      style={{ backgroundColor: c.hex }}
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity rounded-2xl" />
                      {local.accentColor === c.hex && (
                        <Check className="h-4 w-4 text-white drop-shadow-md" />
                      )}
                    </button>
                  ))}

                  <div className="relative h-10 w-10 group">
                    <input
                      type="color"
                      value={local.accentColor}
                      onChange={(e) => update("accentColor", e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    />
                    <div
                      className={cn(
                        "h-full w-full rounded-2xl border-2 border-dashed flex items-center justify-center transition-all bg-muted/20 group-hover:bg-muted/40 ring-offset-2 ring-offset-background overflow-hidden relative",
                        !ACCENT_COLORS.some((c) => c.hex === local.accentColor)
                          ? "border-primary ring-2 ring-primary scale-105 shadow-[0_0_12px_var(--primary)]"
                          : "border-border/40 text-muted-foreground/40",
                      )}
                      style={{
                        backgroundColor: !ACCENT_COLORS.some(
                          (c) => c.hex === local.accentColor,
                        )
                          ? local.accentColor
                          : undefined,
                      }}
                    >
                      {!ACCENT_COLORS.some(
                        (c) => c.hex === local.accentColor,
                      ) ? (
                        <Check className="h-4 w-4 text-white drop-shadow-md" />
                      ) : (
                        <div className="flex flex-col items-center gap-0.5">
                          <Plus className="h-3 w-3" />
                          <span className="text-[7px] font-bold uppercase tracking-tighter">
                            HEX
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-2">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <SLabel className="mb-0 text-[10px]">Saturation</SLabel>
                      <span className="text-[10px] font-mono text-primary/60">
                        {local.accentSaturation}%
                      </span>
                    </div>
                    <Slider
                      value={[local.accentSaturation]}
                      min={0}
                      max={150}
                      step={1}
                      onValueChange={([v]) => update("accentSaturation", v)}
                    />
                  </div>
                  <div className="space-y-3">
                    <SLabel className="mb-0 text-[10px]">Accent Mode</SLabel>
                    <div className="flex gap-1.5 p-1 rounded-xl bg-muted/30 border border-border/40">
                      {(["vivid", "subtle"] as const).map((v) => (
                        <button
                          key={v}
                          onClick={() => update("accentMode", v)}
                          className={cn(
                            "flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                            local.accentMode === v
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:bg-muted/50",
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
                  <h3 className="text-sm font-semibold tracking-tight">
                    Visual DNA
                  </h3>
                  <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">
                    Glass & Environment
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0 text-[10px]">Glass Opacity</SLabel>
                    <span className="text-[10px] font-mono text-primary/60">
                      {local.glassOpacity}%
                    </span>
                  </div>
                  <Slider
                    value={[local.glassOpacity]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([v]) => update("glassOpacity", v)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0 text-[10px]">Glass Blur</SLabel>
                    <span className="text-[10px] font-mono text-primary/60">
                      {local.glassBlur}px
                    </span>
                  </div>
                  <Slider
                    value={[local.glassBlur]}
                    min={0}
                    max={40}
                    step={1}
                    onValueChange={([v]) => update("glassBlur", v)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0 text-[10px]">Glow Intensity</SLabel>
                    <span className="text-[10px] font-mono text-primary/60">
                      {local.glowIntensity}%
                    </span>
                  </div>
                  <Slider
                    value={[local.glowIntensity]}
                    min={0}
                    max={200}
                    step={5}
                    onValueChange={([v]) => update("glowIntensity", v)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0 text-[10px]">Noise Density</SLabel>
                    <span className="text-[10px] font-mono text-primary/60">
                      {local.noiseOpacity}%
                    </span>
                  </div>
                  <Slider
                    value={[local.noiseOpacity]}
                    min={0}
                    max={50}
                    step={1}
                    onValueChange={([v]) => update("noiseOpacity", v)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0 text-[10px]">Glow Spread</SLabel>
                    <span className="text-[10px] font-mono text-primary/60">
                      {local.glowSpread}px
                    </span>
                  </div>
                  <Slider
                    value={[local.glowSpread]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([v]) => update("glowSpread", v)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0 text-[10px]">Glow Radius</SLabel>
                    <span className="text-[10px] font-mono text-primary/60">
                      {local.glowRadius}px
                    </span>
                  </div>
                  <Slider
                    value={[local.glowRadius]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([v]) => update("glowRadius", v)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0 text-[10px]">Glass Tint</SLabel>
                    <div className="relative h-6 w-12 rounded-lg border border-border/40 overflow-hidden">
                      <input
                        type="color"
                        value={local.glassTintColor}
                        onChange={(e) =>
                          update("glassTintColor", e.target.value)
                        }
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      />
                      <div
                        className="h-full w-full"
                        style={{ backgroundColor: local.glassTintColor }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground/60">
                      Tint Saturation
                    </span>
                    <span className="text-[10px] font-mono text-primary/60">
                      {local.glassSaturation}%
                    </span>
                  </div>
                  <Slider
                    value={[local.glassSaturation]}
                    min={0}
                    max={200}
                    step={5}
                    onValueChange={([v]) => update("glassSaturation", v)}
                  />
                </div>

                <div className="space-y-3">
                  <SLabel className="text-[10px]">UI Density</SLabel>
                  <div className="flex gap-1.5 p-1.5 rounded-xl bg-muted/30 border border-border/40">
                    {(["compact", "comfort", "spacious"] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => update("uiDensity", v)}
                        className={cn(
                          "flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                          local.uiDensity === v
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted/50",
                        )}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <SLabel className="text-[10px]">Background Style</SLabel>
                  <div className="flex gap-1.5 p-1 rounded-xl bg-muted/30 border border-border/40">
                    {(["solid", "gradient", "aurora", "mesh"] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => update("backgroundStyle", v)}
                        className={cn(
                          "flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                          local.backgroundStyle === v
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted/50",
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
                    {(["none", "grid", "dots", "mesh"] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => update("backgroundPattern", v)}
                        className={cn(
                          "flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                          local.backgroundPattern === v
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted/50",
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
                    onValueChange={([v]) => update("backgroundOpacity", v)}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0 text-[10px]">
                      Pattern Intensity
                    </SLabel>
                    <span className="text-[10px] font-mono text-primary/60">
                      {local.gridOpacity}%
                    </span>
                  </div>
                  <Slider
                    value={[local.gridOpacity]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([v]) => update("gridOpacity", v)}
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
                  <h3 className="text-sm font-semibold tracking-tight">
                    Sidebar
                  </h3>
                  <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">
                    Panel Configuration
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0 text-[10px]">
                      Sidebar Opacity
                    </SLabel>
                    <span className="text-[10px] font-mono text-primary/60">
                      {local.sidebarOpacity}%
                    </span>
                  </div>
                  <Slider
                    value={[local.sidebarOpacity]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([v]) => update("sidebarOpacity", v)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0 text-[10px]">Sidebar Blur</SLabel>
                    <span className="text-[10px] font-mono text-primary/60">
                      {local.sidebarBlur}px
                    </span>
                  </div>
                  <Slider
                    value={[local.sidebarBlur]}
                    min={0}
                    max={40}
                    step={1}
                    onValueChange={([v]) => update("sidebarBlur", v)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0 text-[10px]">Sidebar Width</SLabel>
                    <span className="text-[10px] font-mono text-primary/60">
                      {local.sidebarWidth}px
                    </span>
                  </div>
                  <Slider
                    value={[local.sidebarWidth]}
                    min={200}
                    max={450}
                    step={10}
                    onValueChange={([v]) => update("sidebarWidth", v)}
                  />
                </div>

                <div className="space-y-3">
                  <SLabel className="text-[10px]">Position</SLabel>
                  <div className="flex gap-1.5 p-1 rounded-xl bg-muted/30 border border-border/40">
                    {(["left", "right"] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => update("sidebarPosition", v)}
                        className={cn(
                          "flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                          local.sidebarPosition === v
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted/50",
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
                  <h3 className="text-sm font-semibold tracking-tight">
                    Typography
                  </h3>
                  <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">
                    Text Styles
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <SLabel className="text-[10px]">Font Family</SLabel>
                  <Select
                    value={local.fontFamily}
                    onValueChange={(v) => update("fontFamily", v)}
                  >
                    <SelectTrigger className="h-10 rounded-xl border-border/40 bg-card/20 text-xs">
                      <SelectValue placeholder="Select font" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/40">
                      {FONT_FAMILIES.map((f) => (
                        <SelectItem
                          key={f.value}
                          value={f.value}
                          className="rounded-lg text-xs"
                        >
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
                      onValueChange={([v]) => update("contrast", v)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-3">
                  <SLabel className="text-[10px]">Animations</SLabel>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20 border border-border/40">
                    <span className="text-[11px] font-medium">
                      Motion Effects
                    </span>
                    <Switch
                      checked={local.animationsEnabled}
                      onCheckedChange={(v) => update("animationsEnabled", v)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <SLabel className="text-[10px]">Layout Style</SLabel>
                  <div className="flex gap-1.5 p-1 rounded-xl bg-muted/30 border border-border/40">
                    {(["centered", "full"] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => update("contentWidth", v)}
                        className={cn(
                          "flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                          local.contentWidth === v
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted/50",
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
                    <span className="text-[10px] font-mono text-primary/60">
                      {(local.lineHeight / 100).toFixed(1)}
                    </span>
                  </div>
                  <Slider
                    value={[local.lineHeight]}
                    min={100}
                    max={250}
                    step={10}
                    onValueChange={([v]) => update("lineHeight", v)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0 text-[10px]">Letter Spacing</SLabel>
                    <span className="text-[10px] font-mono text-primary/60">
                      {local.letterSpacing}em
                    </span>
                  </div>
                  <Slider
                    value={[local.letterSpacing]}
                    min={-0.05}
                    max={0.15}
                    step={0.01}
                    onValueChange={([v]) => update("letterSpacing", v)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <SLabel className="mb-0 text-[10px]">Font Weight</SLabel>
                  <span className="text-[10px] font-mono text-primary/60">
                    {local.fontWeight}
                  </span>
                </div>
                <Slider
                  value={[local.fontWeight]}
                  min={100}
                  max={900}
                  step={100}
                  onValueChange={([v]) => update("fontWeight", v)}
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
                  <h3 className="text-sm font-semibold tracking-tight">
                    Structure
                  </h3>
                  <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">
                    Layout & Borders
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0 text-[10px]">Border Radius</SLabel>
                    <span className="text-[10px] font-mono text-primary/60">
                      {local.borderRadius}px
                    </span>
                  </div>
                  <Slider
                    value={[local.borderRadius]}
                    min={0}
                    max={32}
                    step={2}
                    onValueChange={([v]) => update("borderRadius", v)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0 text-[10px]">Border Width</SLabel>
                    <span className="text-[10px] font-mono text-primary/60">
                      {local.borderWidth}px
                    </span>
                  </div>
                  <Slider
                    value={[local.borderWidth]}
                    min={0}
                    max={4}
                    step={0.5}
                    onValueChange={([v]) => update("borderWidth", v)}
                  />
                </div>

                <div className="space-y-3">
                  <SLabel className="text-[10px]">Border Style</SLabel>
                  <div className="flex gap-1.5 p-1 rounded-xl bg-muted/30 border border-border/40">
                    {(["solid", "dashed", "dotted"] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => update("borderStyle", v)}
                        className={cn(
                          "flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                          local.borderStyle === v
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted/50",
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
                    <span className="text-[10px] font-mono text-primary/60">
                      {local.chatMaxWidth}px
                    </span>
                  </div>
                  <Slider
                    value={[local.chatMaxWidth]}
                    min={600}
                    max={1200}
                    step={50}
                    onValueChange={([v]) => update("chatMaxWidth", v)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0 text-[10px]">
                      Message Spacing
                    </SLabel>
                    <span className="text-[10px] font-mono text-primary/60">
                      {local.messageSpacing}px
                    </span>
                  </div>
                  <Slider
                    value={[local.messageSpacing]}
                    min={8}
                    max={64}
                    step={4}
                    onValueChange={([v]) => update("messageSpacing", v)}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <Row
                  title="Smooth Animations"
                  desc="Enable high-fidelity motion effects"
                >
                  <Switch
                    checked={local.animationsEnabled}
                    onCheckedChange={(v) => update("animationsEnabled", v)}
                  />
                </Row>
                <Row
                  title="Glass Interface"
                  desc="Apply depth and translucency effects"
                >
                  <Switch
                    checked={local.bubbleStyle === "glass"}
                    onCheckedChange={(v) =>
                      update("bubbleStyle", v ? "glass" : "modern")
                    }
                  />
                </Row>
              </div>
            </div>
          </div>
        );

      // ── Chat ──────────────────────────────────────────────────────────
      case "chat":
        return (
          <div className="space-y-8 max-h-[550px] overflow-y-auto pr-2 scrollbar-none pb-8">

            {/* ── Message Style ── */}
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-1 border-b border-border/30">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                  <Type className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight">Message Style</h3>
                  <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">Bubbles & Typography</p>
                </div>
              </div>

              <div>
                <SLabel>Bubble Style</SLabel>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { v: "modern", label: "Modern", desc: "Clean cards" },
                    { v: "glass", label: "Glass", desc: "Frosted blur" },
                    { v: "minimal", label: "Minimal", desc: "No border" },
                  ] as const).map(({ v, label, desc }) => (
                    <button key={v} onClick={() => update("bubbleStyle", v)}
                      className={cn(
                        "py-3 px-3 rounded-xl border text-left transition-all group",
                        local.bubbleStyle === v
                          ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10"
                          : "border-border/40 text-muted-foreground hover:border-border hover:bg-muted/20"
                      )}>
                      <p className="text-xs font-semibold">{label}</p>
                      <p className="text-[10px] opacity-60 mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <SLabel>Font Size</SLabel>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { v: "small", label: "Small", size: "text-xs" },
                    { v: "medium", label: "Medium", size: "text-sm" },
                    { v: "large", label: "Large", size: "text-base" },
                  ] as const).map(({ v, label, size }) => (
                    <button key={v} onClick={() => update("fontSize", v)}
                      className={cn(
                        "py-3 rounded-xl border transition-all flex flex-col items-center gap-1",
                        local.fontSize === v
                          ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10"
                          : "border-border/40 text-muted-foreground hover:border-border hover:bg-muted/20"
                      )}>
                      <span className={cn("font-bold", size)}>Aa</span>
                      <span className="text-[10px] font-medium capitalize">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0">Line Height</SLabel>
                    <span className="text-[10px] font-mono text-primary/60">{local.lineHeight}%</span>
                  </div>
                  <Slider value={[local.lineHeight]} min={120} max={200} step={5}
                    onValueChange={([v]) => update("lineHeight", v)} />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0">Letter Spacing</SLabel>
                    <span className="text-[10px] font-mono text-primary/60">{local.letterSpacing}px</span>
                  </div>
                  <Slider value={[local.letterSpacing]} min={-1} max={4} step={0.5}
                    onValueChange={([v]) => update("letterSpacing", v)} />
                </div>
              </div>
            </div>

            {/* ── Layout ── */}
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-1 border-b border-border/30">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                  <Layout className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight">Layout</h3>
                  <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">Width & Spacing</p>
                </div>
              </div>

              <div>
                <SLabel>Content Width</SLabel>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { v: "centered", label: "Centered", desc: "Max-width container" },
                    { v: "full", label: "Full Width", desc: "Edge to edge" },
                  ] as const).map(({ v, label, desc }) => (
                    <button key={v} onClick={() => update("contentWidth", v)}
                      className={cn(
                        "py-3 px-3 rounded-xl border text-left transition-all",
                        local.contentWidth === v
                          ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10"
                          : "border-border/40 text-muted-foreground hover:border-border hover:bg-muted/20"
                      )}>
                      <p className="text-xs font-semibold">{label}</p>
                      <p className="text-[10px] opacity-60 mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <SLabel>UI Density</SLabel>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { v: "compact", label: "Compact", desc: "Dense" },
                    { v: "comfort", label: "Comfort", desc: "Default" },
                    { v: "spacious", label: "Spacious", desc: "Airy" },
                  ] as const).map(({ v, label, desc }) => (
                    <button key={v} onClick={() => update("uiDensity", v)}
                      className={cn(
                        "py-3 px-2 rounded-xl border text-left transition-all",
                        local.uiDensity === v
                          ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10"
                          : "border-border/40 text-muted-foreground hover:border-border hover:bg-muted/20"
                      )}>
                      <p className="text-xs font-semibold">{label}</p>
                      <p className="text-[10px] opacity-60 mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0">Chat Max Width</SLabel>
                    <span className="text-[10px] font-mono text-primary/60">{local.chatMaxWidth}px</span>
                  </div>
                  <Slider value={[local.chatMaxWidth]} min={600} max={1200} step={50}
                    onValueChange={([v]) => update("chatMaxWidth", v)} />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SLabel className="mb-0">Message Spacing</SLabel>
                    <span className="text-[10px] font-mono text-primary/60">{local.messageSpacing}px</span>
                  </div>
                  <Slider value={[local.messageSpacing]} min={8} max={48} step={4}
                    onValueChange={([v]) => update("messageSpacing", v)} />
                </div>
              </div>
            </div>

            {/* ── Behaviour ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-1 border-b border-border/30">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight">Behaviour</h3>
                  <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">Interactions & Effects</p>
                </div>
              </div>

              <div className="rounded-xl border border-border/40 bg-card/20 divide-y divide-border/20">
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div>
                    <p className="text-sm font-medium">Compact Mode</p>
                    <p className="text-xs text-muted-foreground/50 mt-0.5">Denser message layout with reduced padding</p>
                  </div>
                  <Switch checked={local.compactMode} onCheckedChange={(v) => update("compactMode", v)} />
                </div>
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div>
                    <p className="text-sm font-medium">Animations</p>
                    <p className="text-xs text-muted-foreground/50 mt-0.5">Smooth transitions and slide-in effects</p>
                  </div>
                  <Switch checked={local.animationsEnabled} onCheckedChange={(v) => update("animationsEnabled", v)} />
                </div>
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div>
                    <p className="text-sm font-medium">Sound Effects</p>
                    <p className="text-xs text-muted-foreground/50 mt-0.5">Notification sounds on new messages</p>
                  </div>
                  <Switch checked={local.soundEnabled} onCheckedChange={(v) => update("soundEnabled", v)} />
                </div>
              </div>
            </div>
          </div>
        );

      // ── Models ────────────────────────────────────────────────────────
      case "models":
        return (
          <div className="space-y-6">
            {/* Registered models list */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <SLabel className="mb-0">
                  Registered Models{models.length ? ` (${models.length})` : ""}
                </SLabel>
                <button
                  onClick={handleSync}
                  title="Sync from Ollama"
                  className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  <RefreshCw className={cn("h-3 w-3", (modelsLoading || syncing) && "animate-spin")} />
                  Sync
                </button>
              </div>

              {/* Search */}
              {models.length > 0 && (
                <div className="relative mb-2">
                  <input
                    type="text"
                    placeholder="Search models..."
                    value={modelSearch}
                    onChange={(e) => { setModelSearch(e.target.value); setModelPage(0); }}
                    className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-border/40 bg-muted/20 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/40 transition-all placeholder:text-muted-foreground/40"
                  />
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {modelSearch && (
                    <button onClick={() => { setModelSearch(""); setModelPage(0); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}

              {modelsLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-3">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Loading...
                </div>
              ) : models.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground/40 rounded-xl border border-dashed border-border/40">
                  No models registered — click Sync to import from Ollama
                </div>
              ) : (() => {
                const filtered = models.filter(m =>
                  m.display_name.toLowerCase().includes(modelSearch.toLowerCase()) ||
                  m.ollama_name.toLowerCase().includes(modelSearch.toLowerCase())
                )
                const totalPages = Math.ceil(filtered.length / MODELS_PER_PAGE)
                const paginated = filtered.slice(modelPage * MODELS_PER_PAGE, (modelPage + 1) * MODELS_PER_PAGE)
                return (
                <>
                <div className="space-y-1">
                  {paginated.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground/40 rounded-xl border border-dashed border-border/40">
                      No models match "{modelSearch}"
                    </div>
                  ) : paginated.map((m) => {
                    const providerLabel =
                      m.provider === "ollama"
                        ? "Ollama"
                        : (CLOUD_PROVIDERS.find((p) =>
                            m.api_base_url?.includes(
                              p.url
                                .replace("https://", "")
                                .replace("http://", "")
                                .split("/")[0],
                            ),
                          )?.label ?? "Cloud");
                    const isCloud = m.provider === "openai-compat";
                    return (
                      <div
                        key={m.id}
                        className="group flex items-center gap-3 px-3 py-2 rounded-xl border border-border/40 bg-card/20 hover:bg-card/40 transition-colors"
                      >
                        <div
                          className={cn(
                            "h-1.5 w-1.5 rounded-full shrink-0",
                            m.is_active
                              ? "bg-emerald-500"
                              : "bg-muted-foreground/30",
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium truncate">
                              {m.display_name}
                            </p>
                            <span
                              className={cn(
                                "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md shrink-0",
                                isCloud
                                  ? "bg-violet-500/15 text-violet-400 border border-violet-500/20"
                                  : "bg-primary/10 text-primary/60 border border-primary/15",
                              )}
                            >
                              {providerLabel}
                            </span>
                            <button
                              onClick={async () => {
                                const types: (
                                  | "text"
                                  | "vision"
                                  | "image-generation"
                                )[] = ["text", "vision", "image-generation"];
                                const next =
                                  types[
                                    (types.indexOf(m.model_type as any) + 1) %
                                      types.length
                                  ];
                                const updated = await updateRegisteredModel(
                                  m.id,
                                  { model_type: next },
                                );
                                setModels(
                                  models.map((rm) =>
                                    rm.id === m.id ? updated : rm,
                                  ),
                                );
                              }}
                              className={cn(
                                "text-[8px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded-md border transition-all hover:scale-105 active:scale-95",
                                m.model_type === "text"
                                  ? "bg-muted/30 text-muted-foreground/40 border-border/40"
                                  : m.model_type === "vision"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-orange-500/10 text-orange-400 border-orange-500/20",
                              )}
                            >
                              {m.model_type === "image-generation"
                                ? "Image Gen"
                                : m.model_type}
                            </button>
                            {isCloud && !m.has_api_key && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                                </TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  className="text-[10px]"
                                >
                                  API Key missing
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[10px] text-muted-foreground/40 truncate max-w-[150px]">
                              {m.ollama_name}
                            </p>
                            {m.updated_at && (
                              <div className="flex items-center gap-1 text-[9px] text-muted-foreground/30 shrink-0">
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
                                <Clock className="h-2.5 w-2.5" />
                                <span>
                                  {formatDistanceToNow(new Date(m.updated_at), {
                                    addSuffix: true,
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Switch
                          checked={m.is_active}
                          onCheckedChange={() =>
                            handleToggleActive(m.id, m.is_active)
                          }
                          className="shrink-0 scale-75"
                        />
                        <button
                          onClick={() => handleDeleteRegistered(m.id)}
                          disabled={deletingId === m.id}
                          className="opacity-0 group-hover:opacity-100 h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
                        >
                          {deletingId === m.id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
                    <span className="text-[10px] text-muted-foreground/40">
                      {modelPage * MODELS_PER_PAGE + 1}–{Math.min((modelPage + 1) * MODELS_PER_PAGE, filtered.length)} of {filtered.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setModelPage(p => p - 1)}
                        disabled={modelPage === 0}
                        className="h-6 w-6 rounded-lg border border-border/40 flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button key={i} onClick={() => setModelPage(i)}
                          className={cn("h-6 w-6 rounded-lg text-[10px] font-medium transition-all",
                            i === modelPage ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground/40 hover:text-foreground hover:bg-muted/40")}>
                          {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => setModelPage(p => p + 1)}
                        disabled={modelPage >= totalPages - 1}
                        className="h-6 w-6 rounded-lg border border-border/40 flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
                </>
                )
              })()}
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
                    onKeyDown={(e) => e.key === "Enter" && handleAddModel()}
                    className="flex-1 h-9 text-sm font-mono"
                  />
                  <Input
                    placeholder="Display name (optional)"
                    value={addDisplay}
                    onChange={(e) => setAddDisplay(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddModel()}
                    className="flex-1 h-9 text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddModel}
                    disabled={!addName.trim()}
                    className="h-9 px-3 shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex gap-1.5">
                  {(["text", "vision", "image-generation"] as const).map(
                    (t) => (
                      <button
                        key={t}
                        onClick={() => setAddModelType(t)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all",
                          addModelType === t
                            ? "bg-primary/20 border-primary/40 text-primary"
                            : "border-border/30 text-muted-foreground/40 hover:border-border/60",
                        )}
                      >
                        {t === "image-generation" ? "Image Gen" : t}
                      </button>
                    ),
                  )}
                </div>
                {addError && (
                  <p className="text-xs text-destructive">{addError}</p>
                )}
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
                        setCloudProvider(p.id);
                        if (p.id !== "custom") setCloudBaseUrl(p.url);
                        else setCloudBaseUrl("");
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-[11px] font-medium border transition-all",
                        cloudProvider === p.id
                          ? "bg-primary/15 border-primary/40 text-primary"
                          : "border-border/40 text-muted-foreground hover:border-border hover:bg-muted/30",
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
                  const suggestions =
                    CLOUD_PROVIDERS.find((p) => p.id === cloudProvider)
                      ?.models ?? [];
                  return (
                    <div className="space-y-2">
                      <Input
                        placeholder="Model ID (sent to the API)"
                        value={cloudModelId}
                        onChange={(e) => setCloudModelId(e.target.value)}
                        className="h-9 text-sm font-mono"
                      />

                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest mr-1">
                          Capability:
                        </span>
                        {(["text", "vision", "image-generation"] as const).map(
                          (t) => (
                            <button
                              key={t}
                              onClick={() => setCloudModelType(t)}
                              className={cn(
                                "px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-wider border transition-all",
                                cloudModelType === t
                                  ? "bg-primary/10 border-primary/30 text-primary"
                                  : "border-border/30 text-muted-foreground/30 hover:border-border/60",
                              )}
                            >
                              {t === "image-generation" ? "Image Gen" : t}
                            </button>
                          ),
                        )}
                      </div>

                      {suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {suggestions.map((s) => (
                            <button
                              key={s}
                              onClick={() => setCloudModelId(s)}
                              className={cn(
                                "px-2 py-1 rounded-lg text-[10px] font-mono border transition-all",
                                cloudModelId === s
                                  ? "bg-primary/15 border-primary/40 text-primary"
                                  : "border-border/30 text-muted-foreground/50 hover:border-border hover:text-foreground hover:bg-muted/20",
                              )}
                            >
                              {s.split("/").pop()}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Display name */}
                <Input
                  placeholder="Display name (optional)"
                  value={cloudDisplayName}
                  onChange={(e) => setCloudDisplayName(e.target.value)}
                  className="h-9 text-sm"
                />

                {/* API key (hidden if not needed) */}
                {CLOUD_PROVIDERS.find((p) => p.id === cloudProvider)
                  ?.needsKey && (
                  <Input
                    type="password"
                    placeholder="API key"
                    value={cloudApiKey}
                    onChange={(e) => setCloudApiKey(e.target.value)}
                    className="h-9 text-sm font-mono"
                  />
                )}

                <div className="flex gap-1.5 pt-1">
                  {(["text", "vision", "image-generation"] as const).map(
                    (t) => (
                      <button
                        key={t}
                        onClick={() => setCloudModelType(t)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all",
                          cloudModelType === t
                            ? "bg-violet-500/20 border-violet-500/40 text-violet-400"
                            : "border-border/30 text-muted-foreground/40 hover:border-border/60",
                        )}
                      >
                        {t === "image-generation" ? "Image Gen" : t}
                      </button>
                    ),
                  )}
                </div>

                {cloudError && (
                  <p className="text-xs text-destructive">{cloudError}</p>
                )}

                <Button
                  size="sm"
                  onClick={handleAddCloudModel}
                  disabled={cloudAdding || !cloudModelId.trim()}
                  className="w-full h-9 gap-1.5"
                >
                  {cloudAdding ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Adding…
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" /> Add Provider Model
                    </>
                  )}
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
                  onKeyDown={(e) => e.key === "Enter" && handlePull()}
                  className="flex-1 h-9 text-sm"
                  disabled={isPulling}
                />
                <Button
                  size="sm"
                  onClick={handlePull}
                  disabled={!pullName.trim() || isPulling}
                  className="h-9 px-3 gap-1.5 shrink-0"
                >
                  {isPulling ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  Pull
                </Button>
              </div>
              {pullStatus && (
                <p
                  className={cn(
                    "mt-2 text-xs px-3 py-2 rounded-xl border",
                    pullStatus.startsWith("✓")
                      ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
                      : pullStatus.startsWith("Error")
                        ? "text-destructive bg-destructive/10 border-destructive/20"
                        : "text-muted-foreground bg-muted/20 border-border/30",
                  )}
                >
                  {pullStatus}
                </p>
              )}
            </div>
          </div>
        );

      // ── Model Lab ───────────────────────────────────────────────────
      case "lab":
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">

                  <div>
                    <h3 className="text-[13px] font-bold tracking-tight">
                      Model Intelligence Lab
                    </h3>
                    <p className="text-[10.5px] text-muted-foreground/50">
                      Compare capabilities and select the best intelligence for
                      your task.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {MODEL_CATEGORIES.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-4 rounded-2xl border border-border/40 bg-card/20 hover:border-primary/30 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute -right-2 -top-2 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                      {cat.id === "Coding" && (
                        <Layers className="h-16 w-16 rotate-12" />
                      )}
                      {cat.id === "Reasoning" && (
                        <Activity className="h-16 w-16 rotate-12" />
                      )}
                      {cat.id === "Vision" && (
                        <Monitor className="h-16 w-16 rotate-12" />
                      )}
                      {cat.id === "ImageGeneration" && (
                        <Sparkles className="h-16 w-16 rotate-12" />
                      )}
                      {cat.id === "General" && (
                        <Server className="h-16 w-16 rotate-12" />
                      )}
                      {cat.id === "Fast" && (
                        <HardDrive className="h-16 w-16 rotate-12" />
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary/60">
                        {cat.id}
                      </span>
                      <div className="h-1.5 w-1.5 rounded-full bg-primary/20 group-hover:bg-primary/60 transition-colors" />
                    </div>
                    <h4 className="text-[12px] font-bold mb-1">{cat.name}</h4>
                    <p className="text-[10px] text-muted-foreground/50 leading-tight mb-4">
                      {cat.desc}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {models
                        .filter((m) => {
                          const lowName = m.ollama_name.toLowerCase();
                          const type = m.model_type;
                          if (cat.id === "Vision")
                            return (
                              type === "vision" ||
                              lowName.includes("llava") ||
                              lowName.includes("vision")
                            );
                          if (cat.id === "ImageGeneration")
                            return (
                              type === "image-generation" ||
                              lowName.includes("stable-diffusion") ||
                              lowName.includes("flux")
                            );
                          if (cat.id === "Coding")
                            return (
                              lowName.includes("coder") ||
                              lowName.includes("code")
                            );
                          if (cat.id === "Reasoning")
                            return (
                              lowName.includes("qwen") ||
                              lowName.includes("reasoning") ||
                              lowName.includes("phi")
                            );
                          if (cat.id === "Fast")
                            return (
                              lowName.includes("mistral") ||
                              lowName.includes("haiku")
                            );
                          return (
                            !lowName.includes("coder") &&
                            !lowName.includes("code") &&
                            !lowName.includes("qwen") &&
                            !lowName.includes("reasoning") &&
                            !lowName.includes("phi") &&
                            !lowName.includes("mistral") &&
                            !lowName.includes("haiku") &&
                            type === "text"
                          );
                        })
                        .slice(0, 3)
                        .map((m) => (
                          <span
                            key={m.id}
                            className="px-2 py-0.5 rounded-lg bg-background/50 border border-border/40 text-[8px] font-medium opacity-60"
                          >
                            {m.display_name}
                          </span>
                        ))}
                      {models.filter((m) => {
                        const lowName = m.ollama_name.toLowerCase();
                        const type = m.model_type;
                        if (cat.id === "Vision")
                          return (
                            type === "vision" ||
                            lowName.includes("llava") ||
                            lowName.includes("vision")
                          );
                        if (cat.id === "ImageGeneration")
                          return (
                            type === "image-generation" ||
                            lowName.includes("stable-diffusion") ||
                            lowName.includes("flux")
                          );
                        if (cat.id === "Coding")
                          return (
                            lowName.includes("coder") ||
                            lowName.includes("code")
                          );
                        if (cat.id === "Reasoning")
                          return (
                            lowName.includes("qwen") ||
                            lowName.includes("reasoning") ||
                            lowName.includes("phi")
                          );
                        if (cat.id === "Fast")
                          return (
                            lowName.includes("mistral") ||
                            lowName.includes("haiku")
                          );
                        return (
                          !lowName.includes("coder") &&
                          !lowName.includes("code") &&
                          !lowName.includes("qwen") &&
                          !lowName.includes("reasoning") &&
                          !lowName.includes("phi") &&
                          !lowName.includes("mistral") &&
                          !lowName.includes("haiku") &&
                          type === "text"
                        );
                      }).length > 3 && (
                        <span className="text-[8px] text-muted-foreground/40 font-bold self-center ml-1">
                          ...
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Latest Update Highlight */}

            <div>
              <SLabel>Performance Comparison</SLabel>
              <div className="rounded-2xl border border-border/40 bg-card/20 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/30 backdrop-blur-sm">
                      <th className="px-4 py-3 text-[10px] uppercase font-black text-muted-foreground text-left w-[180px] tracking-tighter">
                        Model
                      </th>
                      <th className="px-4 py-3 text-[10px] uppercase font-black text-muted-foreground text-center tracking-tighter">
                        Capability
                      </th>
                      <th className="px-4 py-3 text-[10px] uppercase font-black text-muted-foreground text-center tracking-tighter">
                        Speed
                      </th>
                      <th className="px-4 py-3 text-[10px] uppercase font-black text-muted-foreground text-center tracking-tighter">
                        Reasoning
                      </th>
                      <th className="px-4 py-3 text-[10px] uppercase font-black text-muted-foreground text-center whitespace-nowrap tracking-tighter">
                        Last Update
                      </th>
                      <th className="px-6 py-3 text-[10px] uppercase font-black text-muted-foreground text-right tracking-tighter">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10">
                    {models
                      .slice(
                        labPage * LAB_PAGE_SIZE,
                        (labPage + 1) * LAB_PAGE_SIZE,
                      )
                      .map((m) => {
                        const lowName = m.ollama_name.toLowerCase();
                        const usage = modelUsage.find(
                          (u) => u.model === m.ollama_name,
                        );

                        // Dynamic Speed Logic
                        let speedLevel = 1; // Low
                        const tps = usage?.tokens_per_sec ?? 0;
                        if (
                          tps > 40 ||
                          lowName.includes("mistral") ||
                          lowName.includes("haiku") ||
                          lowName.includes("phi")
                        )
                          speedLevel = 3;
                        else if (tps > 15 || lowName.includes("llama3"))
                          speedLevel = 2;

                        // Dynamic Reasoning Logic
                        let reasoningLabel = "Standard";
                        if (
                          lowName.includes("reasoning") ||
                          lowName.includes("qwen") ||
                          lowName.includes("llama3.1") ||
                          lowName.includes("pro")
                        )
                          reasoningLabel = "Expert";
                        else if (
                          lowName.includes("coder") ||
                          lowName.includes("phi")
                        )
                          reasoningLabel = "Technical";

                        return (
                          <tr
                            key={m.id}
                            className="hover:bg-primary/5 transition-colors group"
                          >
                            <td className="px-4 py-3.5 text-left">
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold truncate max-w-[160px]">
                                  {m.display_name}
                                </span>
                                <span className="text-[7px] font-mono opacity-30 truncate max-w-[160px]">
                                  {m.ollama_name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <span
                                  className={cn(
                                    "text-[7.5px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider border",
                                    lowName.includes("coder")
                                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                      : lowName.includes("phi") ||
                                          lowName.includes("qwen")
                                        ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                        : "bg-muted/30 text-muted-foreground/60 border-border/40",
                                  )}
                                >
                                  {lowName.includes("coder")
                                    ? "Code"
                                    : lowName.includes("phi") ||
                                        lowName.includes("qwen")
                                      ? "Logic"
                                      : "General"}
                                </span>
                                {m.model_type === "vision" && (
                                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]">
                                    <div className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-[7.5px] font-bold uppercase tracking-wider">
                                      Vision
                                    </span>
                                  </div>
                                )}
                                {m.model_type === "image-generation" && (
                                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-[0_0_8px_rgba(249,115,22,0.1)]">
                                    <Sparkles className="h-2 w-2" />
                                    <span className="text-[7.5px] font-bold uppercase tracking-wider">
                                      Image
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-0.5">
                                  <div
                                    className={cn(
                                      "h-1 w-2.5 rounded-full transition-colors",
                                      speedLevel >= 1
                                        ? "bg-emerald-500"
                                        : "bg-muted-foreground/10",
                                    )}
                                  />
                                  <div
                                    className={cn(
                                      "h-1 w-2.5 rounded-full transition-colors",
                                      speedLevel >= 2
                                        ? "bg-emerald-500"
                                        : "bg-muted-foreground/10",
                                    )}
                                  />
                                  <div
                                    className={cn(
                                      "h-1 w-2.5 rounded-full transition-colors",
                                      speedLevel >= 3
                                        ? "bg-emerald-500"
                                        : "bg-muted-foreground/10",
                                    )}
                                  />
                                </div>
                                {/* <span className="text-[7.5px] font-mono opacity-40">
                                  {tps > 0 ? `${tps.toFixed(1)} t/s` : "—"}
                                </span> */}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <span
                                className={cn(
                                  "text-[9px] font-bold uppercase tracking-tight",
                                  reasoningLabel === "Expert"
                                    ? "text-primary"
                                    : reasoningLabel === "Technical"
                                      ? "text-emerald-500/70"
                                      : "text-muted-foreground/30",
                                )}
                              >
                                {reasoningLabel}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              {m.updated_at ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className="text-[8.5px] text-muted-foreground/80 whitespace-nowrap font-bold tracking-tight">
                                    {formatDistanceToNow(
                                      new Date(m.updated_at),
                                      { addSuffix: true },
                                    )}
                                  </span>
                                  <span className="text-[7px] opacity-30 uppercase font-mono tracking-tighter">
                                    {new Date(
                                      m.updated_at,
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[8px] text-muted-foreground/20">
                                  —
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-3.5 text-right">
                              <Button
                                size="sm"
                                variant={
                                  local.model === m.ollama_name
                                    ? "secondary"
                                    : "outline"
                                }
                                disabled={local.model === m.ollama_name}
                                onClick={() => update("model", m.ollama_name)}
                                className={cn(
                                  "h-5 text-[8.5px] rounded-lg px-3 uppercase tracking-widest font-bold transition-all",
                                  local.model === m.ollama_name
                                    ? "bg-primary/20 text-primary border-primary/30 shadow-[0_0_12px_rgba(var(--primary-rgb),0.3)]"
                                    : "hover:bg-primary/10 hover:border-primary/40 hover:text-primary",
                                )}
                              >
                                {local.model === m.ollama_name ? (
                                  <span className="flex items-center gap-1">
                                    <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                                    Active
                                  </span>
                                ) : (
                                  "Select"
                                )}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {models.length > LAB_PAGE_SIZE && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground/40">
                    Showing {labPage * LAB_PAGE_SIZE + 1} to{" "}
                    {Math.min((labPage + 1) * LAB_PAGE_SIZE, models.length)} of{" "}
                    {models.length} models
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={labPage === 0}
                      onClick={() => setLabPage((p) => p - 1)}
                      className="h-7 w-7 p-0 rounded-lg"
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={(labPage + 1) * LAB_PAGE_SIZE >= models.length}
                      onClick={() => setLabPage((p) => p + 1)}
                      className="h-7 w-7 p-0 rounded-lg"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case "session": {
        const totalMsgs =
          (session?.userMessages ?? 0) + (session?.assistantMessages ?? 0);
        const rows: { label: string; value: string; sub?: string }[] = [
          { label: "Model", value: session?.model ?? "-" },
          { label: "Backend", value: "Local | Ollama" },
          { label: "Total messages", value: String(totalMsgs) },
          { label: "Your messages", value: String(session?.userMessages ?? 0) },
          {
            label: "AI responses",
            value: String(session?.assistantMessages ?? 0),
          },
          {
            label: "Est. tokens",
            value: session?.tokens ? session?.tokens.toLocaleString() : "—",
          },
          {
            label: "Last response",
            value:
              session?.lastResponseMs != null
                ? (session?.lastResponseMs / 1000).toFixed(1)
                : "-",
            sub: session?.lastResponseMs != null ? "s" : undefined,
          },
          {
            label: "Stream speed",
            value:
              session?.streamSpeed != null
                ? session?.streamSpeed.toLocaleString()
                : "-",
            sub: session?.streamSpeed != null ? " ch/s" : undefined,
          },
        ];
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <SLabel className="mb-0">Current Session</SLabel>
                {usageLoading && (
                  <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground/30" />
                )}
              </div>
              <div className="rounded-xl border border-border/40 bg-card/20 divide-y divide-border/20">
                {rows.map(({ label, value, sub }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <span className="text-[13px] text-muted-foreground/60">
                      {label}
                    </span>
                    <span className="text-[13px] font-medium text-foreground/80">
                      {value}
                      {sub && (
                        <span className="text-muted-foreground/40 ml-0.5">
                          {sub}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <SLabel>Global Usage (Lifetime)</SLabel>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-border/40 bg-card/20 space-y-1">
                  <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold">
                    Total Tokens
                  </p>
                  <p className="text-xl font-bold tracking-tight">
                    {globalUsage?.total_tokens
                      ? globalUsage.total_tokens.toLocaleString()
                      : "0"}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-border/40 bg-card/20 space-y-1">
                  <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold">
                    Messages
                  </p>
                  <p className="text-xl font-bold tracking-tight">
                    {globalUsage ? "—" : "0"}
                  </p>
                  <p className="text-[10px] text-muted-foreground/30 italic">
                    Aggregate data
                  </p>
                </div>
              </div>
              <div className="mt-3 rounded-xl border border-border/40 bg-card/20 divide-y divide-border/20">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[12px] text-muted-foreground/60">
                    Input (Prompt)
                  </span>
                  <span className="text-[12px] font-mono text-primary/80">
                    {globalUsage?.prompt_tokens?.toLocaleString() ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[12px] text-muted-foreground/60">
                    Output (Completion)
                  </span>
                  <span className="text-[12px] font-mono text-emerald-500/80">
                    {globalUsage?.completion_tokens?.toLocaleString() ?? 0}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <SLabel>Model Activity (Lifetime)</SLabel>
              <div className="space-y-3">
                {modelUsage.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-border/40 text-center">
                    <p className="text-xs text-muted-foreground/40 italic">
                      No model activity tracked yet
                    </p>
                  </div>
                ) : (
                  modelUsage.map((m) => (
                    <div
                      key={m.model}
                      className="p-4 rounded-2xl border border-border/40 bg-card/20 space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold">
                            {m.display_name}
                          </h4>
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
                            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold">
                              Credits
                            </p>
                            <p className="text-xs font-mono font-bold text-primary">
                              ${(m.credits.remaining * 1).toFixed(4)}
                            </p>
                            <p className="text-[9px] text-muted-foreground/30 italic">
                              Provider Balance
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <p className="text-[9px] text-muted-foreground/40 uppercase font-bold tracking-tighter">
                            Tokens
                          </p>
                          <p className="text-sm font-mono font-bold">
                            {(m.total_tokens / 1000).toFixed(1)}k
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] text-muted-foreground/40 uppercase font-bold tracking-tighter">
                            Input
                          </p>
                          <p className="text-sm font-mono text-muted-foreground/60">
                            {(m.prompt_tokens / 1000).toFixed(1)}k
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] text-muted-foreground/40 uppercase font-bold tracking-tighter">
                            Output
                          </p>
                          <p className="text-sm font-mono text-emerald-500/60">
                            {(m.completion_tokens / 1000).toFixed(1)}k
                          </p>
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
        );
      }

      // ── Dashboard ─────────────────────────────────────────────────────
      case "dashboard": {
        const topics: string[] = (local as any).dashboardTopics ?? ['world', 'tech', 'weather'];
        const subTopics: string[] = (local as any).dashboardSubTopics ?? [];
        const expandedCat = expandedDashCat;
        const setExpandedCat = setExpandedDashCat;

        const toggleTopic = (id: string, required?: boolean) => {
          if (required) return;
          const next = topics.includes(id) ? topics.filter((t) => t !== id) : [...topics, id];
          // When disabling a category, also remove its sub-topics
          const cleanedSubs = next.includes(id) ? subTopics : subTopics.filter(st => !st.startsWith(`${id}_`));
          update("dashboardTopics" as any, next);
          update("dashboardSubTopics" as any, cleanedSubs);
        };

        const toggleSubTopic = (catId: string, subId: string) => {
          // Enabling a sub-topic also enables its parent category
          let newTopics = topics;
          if (!topics.includes(catId)) {
            newTopics = [...topics, catId];
            update("dashboardTopics" as any, newTopics);
          }
          const next = subTopics.includes(subId)
            ? subTopics.filter(s => s !== subId)
            : [...subTopics, subId];
          update("dashboardSubTopics" as any, next);
        };

        return (
          <div className="space-y-6 max-h-[520px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <Layout className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-tight">Dashboard Preferences</h3>
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">Personalise your briefing</p>
              </div>
            </div>

            {/* Location — custom combobox */}
            <div className="space-y-2">
              <SLabel>Your Location</SLabel>
              <p className="text-xs text-muted-foreground/60 -mt-1 mb-2">Used for live weather. Type a city name or leave blank for auto-detect.</p>
              <div className="relative" ref={cityRef}>
                <Input
                  placeholder="e.g. London, Mumbai, New York"
                  value={(local as any).dashboardCity ?? ''}
                  autoComplete="off"
                  onFocus={() => setCityOpen(true)}
                  onChange={(e) => {
                    update("dashboardCity" as any, e.target.value);
                    setCityOpen(true);
                  }}
                  onBlur={() => setTimeout(() => setCityOpen(false), 150)}
                  className="text-sm pr-8"
                />
                {/* chevron */}
                <ChevronRight
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 rotate-90 pointer-events-none"
                />
                {/* dropdown */}
                {cityOpen && (() => {
                  const q = ((local as any).dashboardCity ?? '').toLowerCase();
                  const matches = CITY_SUGGESTIONS.filter(c =>
                    q.length === 0 || c.toLowerCase().includes(q)
                  ).slice(0, 8);
                  if (matches.length === 0) return null;
                  return (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 border border-border/60 bg-popover shadow-xl overflow-hidden"
                      style={{ borderRadius: 'var(--radius)' }}>
                      {matches.map((city) => (
                        <button
                          key={city}
                          type="button"
                          onMouseDown={() => {
                            update("dashboardCity" as any, city);
                            setCityOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors",
                            (local as any).dashboardCity === city
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted/60 text-foreground"
                          )}
                        >
                          <span className="text-base leading-none">🌍</span>
                          <span className="flex-1">{city}</span>
                          {(local as any).dashboardCity === city && (
                            <Check className="h-3 w-3 text-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Hierarchical topic + sub-topic picker */}
            <div className="space-y-2">
              <SLabel>Feed Topics & Sources</SLabel>
              <p className="text-xs text-muted-foreground/60 -mt-1 mb-3">
                Toggle categories on/off. Expand any category to pick specific sources — useful for Sports (Cricket vs Football) or Tech (Hacker News vs Wired).
              </p>
              <div className="space-y-1">
                {TOPIC_REGISTRY.map((cat) => {
                  const catOn = topics.includes(cat.id);
                  const isExpanded = expandedCat === cat.id;
                  const activeSubs = subTopics.filter(s => s.startsWith(`${cat.id}_`));
                  return (
                    <div key={cat.id} className="border border-border/30 rounded-lg overflow-hidden">
                      {/* Category row */}
                      <div className="flex items-center gap-3 px-3 py-2.5 bg-muted/10">
                        <span className="text-base leading-none w-5 shrink-0">{cat.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium leading-tight">{cat.label}</p>
                            {cat.required && (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">Always on</span>
                            )}
                            {activeSubs.length > 0 && (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">{activeSubs.length} source{activeSubs.length > 1 ? 's' : ''}</span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground/50 mt-0.5">{cat.desc}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {cat.subtopics.length > 0 && catOn && (
                            <button
                              onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                              className="text-[10px] text-muted-foreground/50 hover:text-foreground uppercase tracking-wider font-mono border border-border/30 rounded px-2 py-0.5 transition-colors"
                            >
                              {isExpanded ? 'Close' : 'Sources'}
                            </button>
                          )}
                          <Switch
                            checked={catOn || !!cat.required}
                            onCheckedChange={() => toggleTopic(cat.id, cat.required)}
                            disabled={!!cat.required}
                          />
                        </div>
                      </div>

                      {/* Sub-topics (expanded) */}
                      {isExpanded && cat.subtopics.length > 0 && (
                        <div className="border-t border-border/20 bg-background/40 divide-y divide-border/10">
                          {cat.subtopics.map((sub) => {
                            const subOn = subTopics.includes(sub.id);
                            return (
                              <button
                                key={sub.id}
                                onClick={() => toggleSubTopic(cat.id, sub.id)}
                                className={cn(
                                  "w-full flex items-center gap-3 px-4 py-2 text-left transition-colors",
                                  subOn ? "bg-primary/5" : "hover:bg-muted/20"
                                )}
                              >
                                <span className="text-sm w-4 shrink-0">{sub.emoji}</span>
                                <span className="flex-1 text-[13px]">{sub.label}</span>
                                <div className={cn(
                                  "h-4 w-4 rounded border flex items-center justify-center shrink-0",
                                  subOn ? "bg-primary border-primary" : "border-border/40"
                                )}>
                                  {subOn && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                                </div>
                              </button>
                            );
                          })}
                          <div className="px-4 py-2 bg-muted/5">
                            <p className="text-[10px] text-muted-foreground/40 font-mono">
                              {activeSubs.length === 0 ? 'No sources selected — showing default feed for this category' : `${activeSubs.length} source${activeSubs.length > 1 ? 's' : ''} selected — these will be merged and deduplicated`}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }

      // ── Database ──────────────────────────────────────────────────────
      case "database":
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
                  Database config is set in{" "}
                  <code className="font-mono bg-black/20 px-1 rounded">
                    backend/.env
                  </code>
                  . Use this panel to test a connection URL before updating the
                  file.
                </p>
              </div>

              <div>
                <SLabel>Test Connection</SLabel>
                <div className="space-y-2">
                  <Input
                    placeholder="postgresql://user:pass@host:5432/db"
                    value={dbUrl}
                    onChange={(e) => {
                      setDbUrl(e.target.value);
                      setDbResult(null);
                    }}
                    className="h-9 text-sm font-mono"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTestDb}
                    disabled={!dbUrl.trim() || dbTesting}
                    className="h-9 gap-1.5"
                  >
                    {dbTesting ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Activity className="h-3.5 w-3.5" />
                    )}
                    Test Connection
                  </Button>
                  {dbResult && (
                    <div
                      className={cn(
                        "px-3 py-2.5 rounded-xl border text-xs",
                        dbResult?.ok
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-destructive/10 border-destructive/20 text-destructive",
                      )}
                    >
                      {dbResult?.ok ? "✓" : "✗"} {dbResult?.msg}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <SLabel>Environment Variables</SLabel>
                <div className="rounded-xl border border-border/40 bg-muted/15 px-4 py-3 space-y-1.5">
                  {[
                    {
                      key: "DATABASE_URL",
                      desc: "PostgreSQL connection string",
                    },
                    { key: "OLLAMA_URL", desc: "Ollama API endpoint" },
                    { key: "FRONTEND_URL", desc: "CORS allowed origin" },
                  ].map(({ key, desc }) => (
                    <div key={key}>
                      <code className="text-[11px] font-mono text-primary/70">
                        {key}
                      </code>
                      <span className="text-[11px] text-muted-foreground/40 ml-2">
                        {desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PinGate>
        );

      // ── Admin ─────────────────────────────────────────────────────────
      case "admin":
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
                  <RefreshCw
                    className={cn("h-3 w-3", statusLoading && "animate-spin")}
                  />
                </button>
              </div>

              {status ? (
                <div className="space-y-1.5">
                  {[
                    {
                      label: "Ollama",
                      icon: Server,
                      ok: status?.ollama?.status === "ok",
                      detail:
                        status?.ollama?.status === "ok"
                          ? `${status?.ollama?.models} model${status?.ollama?.models !== 1 ? "s" : ""} | ${status?.ollama?.url}`
                          : "Not reachable",
                    },
                    {
                      label: "Database",
                      icon: HardDrive,
                      ok: status?.database?.status === "ok",
                      detail:
                        status?.database?.status === "ok"
                          ? status?.database?.url
                          : "Not connected",
                    },
                    {
                      label: "Version",
                      icon: Activity,
                      ok: true,
                      detail: status?.version,
                    },
                  ].map(({ label, icon: Icon, ok, detail }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-border/40 bg-card/20"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground/50" />
                        <span className="text-sm font-medium">{label}</span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[11px] text-muted-foreground/50 truncate max-w-[180px]">
                          {detail}
                        </span>
                        <div
                          className={cn(
                            "h-1.5 w-1.5 rounded-full shrink-0",
                            ok
                              ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                              : "bg-destructive",
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={loadStatus}
                    className="gap-1.5"
                  >
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleChangePin}
                    className="h-9 px-3 shrink-0"
                  >
                    Set
                  </Button>
                </div>
                {pinMsg && (
                  <p
                    className={cn(
                      "mt-1.5 text-xs",
                      pinMsg.startsWith("✓")
                        ? "text-emerald-500"
                        : "text-destructive",
                    )}
                  >
                    {pinMsg}
                  </p>
                )}
              </div>
            </div>
          </PinGate>
        );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
        else setOpen(true);
      }}
    >
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <SettingsIcon className="h-4 w-4" />
            <span className="sr-only">Settings</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="p-0 gap-0 w-full max-w-[1000px] sm:max-w-[1000px] rounded-2xl overflow-hidden [&>button]:hidden border border-border/50 shadow-2xl">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">Customize your Graviton experience</DialogDescription>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-muted/10">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <SettingsIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight">Settings</p>
              <p className="text-[11px] text-muted-foreground/50">Customize your Graviton experience</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-all"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex" style={{ height: "580px" }}>
          {/* Left nav */}
          <nav className="w-52 border-r border-border/40 bg-muted/10 p-2.5 flex flex-col gap-0.5 shrink-0">
            <p className="px-2.5 text-[9px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em] mb-1 mt-1">General</p>
            {mainNav.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSection(id)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium w-full text-left transition-all",
                  section === id
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                    : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/40",
                )}
              >
                <Icon className={cn("h-3.5 w-3.5 shrink-0", section === id ? "text-primary" : "")} />
                {label}
              </button>
            ))}

            {!isMobile && (
              <>
                <div className="my-2 mx-1 border-t border-border/30" />
                <p className="px-2.5 text-[9px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em] mb-1">Admin</p>
                {adminNav.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setSection(id)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium w-full text-left transition-all",
                      section === id
                        ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                        : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/40",
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5 shrink-0", section === id ? "text-primary" : "")} />
                    {label}
                    {!adminOk && (
                      <Lock className="h-2.5 w-2.5 ml-auto text-muted-foreground/25" />
                    )}
                  </button>
                ))}
              </>
            )}

            <div className="mt-auto pt-2 px-2.5">
              <div className="flex items-center gap-1.5 py-2 border-t border-border/20">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/60 animate-pulse" />
                <p className="text-[10px] text-muted-foreground/30 font-medium">Graviton v1.0</p>
              </div>
            </div>
          </nav>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-none bg-background/30">
            {renderContent()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border/40 bg-muted/10">
          <p className="text-[11px] text-muted-foreground/30">Changes are applied immediately · Saved to database</p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground/70 hover:text-foreground hover:bg-muted/50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
            >
              <Check className="h-3.5 w-3.5" />
              Save Changes
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
