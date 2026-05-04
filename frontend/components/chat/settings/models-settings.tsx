import { useState } from "react";
import {
  Server,
  RefreshCw,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useModelsStore } from "@/lib/store";
import {
  pullModel,
  syncRegisteredModels,
  createRegisteredModel,
  updateRegisteredModel,
  deleteRegisteredModel,
} from "@/lib/api";
import { SLabel } from "./shared";

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

const MODELS_PER_PAGE = 5;

export function ModelsSettings() {
  const { models, load: reloadModels, setModels } = useModelsStore();
  const [modelsLoading, setModelsLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [modelSearch, setModelSearch] = useState("");
  const [modelPage, setModelPage] = useState(0);

  const [addName, setAddName] = useState("");
  const [addDisplay, setAddDisplay] = useState("");
  const [addError, setAddError] = useState("");
  const [addModelType, setAddModelType] = useState<
    "text" | "vision" | "image-generation"
  >("text");

  const [pullName, setPullName] = useState("");
  const [pullStatus, setPullStatus] = useState("");
  const [isPulling, setIsPulling] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Cloud provider state
  const [cloudProvider, setCloudProvider] = useState("nvidia");
  const [cloudModelId, setCloudModelId] = useState("");
  const [cloudDisplayName, setCloudDisplayName] = useState("");
  const [cloudApiKey, setCloudApiKey] = useState("");
  const [cloudBaseUrl, setCloudBaseUrl] = useState<string>(CLOUD_PROVIDERS[0].url);
  const [cloudError, setCloudError] = useState("");
  const [cloudAdding, setCloudAdding] = useState(false);
  const [cloudModelType, setCloudModelType] = useState<
    "text" | "vision" | "image-generation"
  >("text");

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

  const filtered = models.filter(
    (m) =>
      m.display_name.toLowerCase().includes(modelSearch.toLowerCase()) ||
      m.ollama_name.toLowerCase().includes(modelSearch.toLowerCase()),
  );
  const totalPages = Math.ceil(filtered.length / MODELS_PER_PAGE);
  const pageModels = filtered.slice(
    modelPage * MODELS_PER_PAGE,
    (modelPage + 1) * MODELS_PER_PAGE,
  );

  return (
    <div className="space-y-8 max-h-[550px] overflow-y-auto pr-2 scrollbar-none pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Registered Models */}
      <div className="space-y-5">
        <div className="flex items-center justify-between pb-1 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
              <Server className="h-3.5 w-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight">
                Registered Models
              </h3>
              <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
                Active: {models.filter((m) => m.is_active).length} /{" "}
                {models.length}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            className="h-8 text-[11px] font-bold uppercase tracking-wider text-primary hover:text-primary hover:bg-primary/5 gap-2"
          >
            <RefreshCw className={cn("h-3 w-3", syncing && "animate-spin")} />
            Sync Models
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
          <Input
            placeholder="Search models..."
            value={modelSearch}
            onChange={(e) => {
              setModelSearch(e.target.value);
              setModelPage(0);
            }}
            className="h-9 pl-9 text-xs bg-muted/20 border-border/40 rounded-xl"
          />
        </div>

        <div className="space-y-2">
          {pageModels.map((m) => (
            <div
              key={m.id}
              className={cn(
                "group flex items-center gap-3 p-3 rounded-2xl border transition-all",
                m.is_active
                  ? "bg-card/40 border-primary/20 shadow-sm"
                  : "bg-muted/5 border-border/40 opacity-60",
              )}
            >
              <div
                className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center text-lg border",
                  m.is_active
                    ? "bg-primary/10 border-primary/20 text-primary"
                    : "bg-muted border-border/40 text-muted-foreground",
                )}
              >
                {m.model_type === "vision" ? "👁️" : m.model_type === "image-generation" ? "🎨" : "💬"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold truncate">
                    {m.display_name}
                  </p>
                  {m.provider === "openai-compat" && (
                    <span className="px-1.5 py-0.5 rounded-md bg-violet-500/10 text-violet-400 text-[8px] font-black uppercase tracking-tighter border border-violet-500/20">
                      Cloud
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-mono text-muted-foreground/50 truncate">
                  {m.ollama_name}
                </p>
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
                {deletingId === m.id ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </button>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-2 border-t border-border/20">
              <span className="text-[10px] text-muted-foreground/40">
                {modelPage * MODELS_PER_PAGE + 1}–
                {Math.min((modelPage + 1) * MODELS_PER_PAGE, filtered.length)}{" "}
                of {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setModelPage((p) => p - 1)}
                  disabled={modelPage === 0}
                  className="h-6 w-6 rounded-lg border border-border/40 flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setModelPage(i)}
                    className={cn(
                      "h-6 w-6 rounded-lg text-[10px] font-medium transition-all",
                      i === modelPage
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "text-muted-foreground/40 hover:text-foreground hover:bg-muted/40",
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setModelPage((p) => p + 1)}
                  disabled={modelPage >= totalPages - 1}
                  className="h-6 w-6 rounded-lg border border-border/40 flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Register Model */}
      <div className="space-y-4">
        <SLabel>Register Model Manually</SLabel>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Ollama name (e.g. llama3:latest)"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddModel()}
              className="flex-1 h-9 text-xs font-mono rounded-xl"
            />
            <Input
              placeholder="Display name (optional)"
              value={addDisplay}
              onChange={(e) => setAddDisplay(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddModel()}
              className="flex-1 h-9 text-xs rounded-xl"
            />
            <Button
              size="sm"
              onClick={handleAddModel}
              disabled={!addName.trim()}
              className="h-9 px-4 shrink-0 rounded-xl"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex gap-1.5">
            {(["text", "vision", "image-generation"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setAddModelType(t)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all",
                  addModelType === t
                    ? "bg-primary/20 border-primary/40 text-primary"
                    : "border-border/30 text-muted-foreground/40 hover:border-border/60",
                )}
              >
                {t === "image-generation" ? "Image Gen" : t}
              </button>
            ))}
          </div>
          {addError && <p className="text-xs text-destructive">{addError}</p>}
        </div>
      </div>

      {/* Cloud Providers */}
      <div className="space-y-4">
        <SLabel>Add Cloud Provider</SLabel>
        <div className="space-y-4 rounded-2xl border border-border/40 bg-card/20 p-4">
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

          <div className="space-y-3">
            <Input
              placeholder="API base URL"
              value={cloudBaseUrl}
              onChange={(e) => setCloudBaseUrl(e.target.value)}
              className="h-9 text-xs font-mono rounded-xl bg-background/50"
            />

            <div className="space-y-2">
              <Input
                placeholder="Model ID (sent to the API)"
                value={cloudModelId}
                onChange={(e) => setCloudModelId(e.target.value)}
                className="h-9 text-xs font-mono rounded-xl bg-background/50"
              />

              {(() => {
                const suggestions =
                  CLOUD_PROVIDERS.find((p) => p.id === cloudProvider)
                    ?.models ?? [];
                if (suggestions.length === 0) return null;
                return (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => setCloudModelId(s)}
                        className={cn(
                          "px-2 py-1 rounded-lg text-[9px] font-mono border transition-all",
                          cloudModelId === s
                            ? "bg-primary/15 border-primary/40 text-primary"
                            : "border-border/30 text-muted-foreground/50 hover:border-border hover:text-foreground hover:bg-muted/20",
                        )}
                      >
                        {s.split("/").pop()}
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>

            <Input
              placeholder="Display name (optional)"
              value={cloudDisplayName}
              onChange={(e) => setCloudDisplayName(e.target.value)}
              className="h-9 text-xs rounded-xl bg-background/50"
            />

            {CLOUD_PROVIDERS.find((p) => p.id === cloudProvider)?.needsKey && (
              <Input
                type="password"
                placeholder="API key"
                value={cloudApiKey}
                onChange={(e) => setCloudApiKey(e.target.value)}
                className="h-9 text-xs font-mono rounded-xl bg-background/50"
              />
            )}

            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest mr-1">
                Capability:
              </span>
              {(["text", "vision", "image-generation"] as const).map((t) => (
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
              ))}
            </div>

            {cloudError && <p className="text-xs text-destructive">{cloudError}</p>}

            <Button
              size="sm"
              onClick={handleAddCloudModel}
              disabled={cloudAdding || !cloudModelId.trim()}
              className="w-full h-9 gap-1.5 rounded-xl bg-primary/90 hover:bg-primary"
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
      </div>

      {/* Pull from Ollama */}
      <div className="space-y-4">
        <SLabel>Pull from Ollama</SLabel>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. llama3.2, codellama:7b"
            value={pullName}
            onChange={(e) => setPullName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePull()}
            className="flex-1 h-9 text-xs rounded-xl"
            disabled={isPulling}
          />
          <Button
            size="sm"
            onClick={handlePull}
            disabled={!pullName.trim() || isPulling}
            className="h-9 px-4 gap-1.5 shrink-0 rounded-xl"
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
              "mt-2 text-[11px] px-3 py-2 rounded-xl border leading-relaxed",
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
}
