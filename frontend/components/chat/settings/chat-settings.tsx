import { Type, Layout, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Settings } from "@/lib/types";
import { SLabel } from "./shared";

interface ChatSettingsProps {
  local: Settings;
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

export function ChatSettings({ local, update }: ChatSettingsProps) {
  return (
    <div className="space-y-8 max-h-[550px] overflow-y-auto pr-2 scrollbar-none pb-8">
      {/* ── Message Style ── */}
      <div className="space-y-5">
        <div className="flex items-center gap-3 pb-1 border-b border-border/30">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
            <Type className="h-3.5 w-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight">
              Message Style
            </h3>
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
              Bubbles & Typography
            </p>
          </div>
        </div>

        <div>
          <SLabel>Bubble Style</SLabel>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { v: "modern", label: "Modern", desc: "Clean cards" },
                { v: "glass", label: "Glass", desc: "Frosted blur" },
                { v: "minimal", label: "Minimal", desc: "No border" },
              ] as const
            ).map(({ v, label, desc }) => (
              <button
                key={v}
                onClick={() => update("bubbleStyle", v)}
                className={cn(
                  "py-3 px-3 rounded-xl border text-left transition-all group",
                  local.bubbleStyle === v
                    ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10"
                    : "border-border/40 text-muted-foreground hover:border-border hover:bg-muted/20",
                )}
              >
                <p className="text-xs font-semibold">{label}</p>
                <p className="text-[10px] opacity-60 mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <SLabel>Font Size</SLabel>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { v: "small", label: "Small", size: "text-xs" },
                { v: "medium", label: "Medium", size: "text-sm" },
                { v: "large", label: "Large", size: "text-base" },
              ] as const
            ).map(({ v, label, size }) => (
              <button
                key={v}
                onClick={() => update("fontSize", v)}
                className={cn(
                  "py-3 rounded-xl border transition-all flex flex-col items-center gap-1",
                  local.fontSize === v
                    ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10"
                    : "border-border/40 text-muted-foreground hover:border-border hover:bg-muted/20",
                )}
              >
                <span className={cn("font-bold", size)}>Aa</span>
                <span className="text-[10px] font-medium capitalize">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <SLabel className="mb-0">Line Height</SLabel>
              <span className="text-[10px] font-mono text-primary/60">
                {local.lineHeight}%
              </span>
            </div>
            <Slider
              value={[local.lineHeight]}
              min={120}
              max={200}
              step={5}
              onValueChange={([v]) => update("lineHeight", v)}
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <SLabel className="mb-0">Letter Spacing</SLabel>
              <span className="text-[10px] font-mono text-primary/60">
                {local.letterSpacing}px
              </span>
            </div>
            <Slider
              value={[local.letterSpacing]}
              min={-1}
              max={4}
              step={0.5}
              onValueChange={([v]) => update("letterSpacing", v)}
            />
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
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
              Width & Spacing
            </p>
          </div>
        </div>

        <div>
          <SLabel>Content Width</SLabel>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                {
                  v: "centered",
                  label: "Centered",
                  desc: "Max-width container",
                },
                { v: "full", label: "Full Width", desc: "Edge to edge" },
              ] as const
            ).map(({ v, label, desc }) => (
              <button
                key={v}
                onClick={() => update("contentWidth", v)}
                className={cn(
                  "py-3 px-3 rounded-xl border text-left transition-all",
                  local.contentWidth === v
                    ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10"
                    : "border-border/40 text-muted-foreground hover:border-border hover:bg-muted/20",
                )}
              >
                <p className="text-xs font-semibold">{label}</p>
                <p className="text-[10px] opacity-60 mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <SLabel>UI Density</SLabel>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { v: "compact", label: "Compact", desc: "Dense" },
                { v: "comfort", label: "Comfort", desc: "Default" },
                { v: "spacious", label: "Spacious", desc: "Airy" },
              ] as const
            ).map(({ v, label, desc }) => (
              <button
                key={v}
                onClick={() => update("uiDensity", v)}
                className={cn(
                  "py-3 px-2 rounded-xl border text-left transition-all",
                  local.uiDensity === v
                    ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10"
                    : "border-border/40 text-muted-foreground hover:border-border hover:bg-muted/20",
                )}
              >
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
              <SLabel className="mb-0">Message Spacing</SLabel>
              <span className="text-[10px] font-mono text-primary/60">
                {local.messageSpacing}px
              </span>
            </div>
            <Slider
              value={[local.messageSpacing]}
              min={8}
              max={48}
              step={4}
              onValueChange={([v]) => update("messageSpacing", v)}
            />
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
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
              Interactions & Effects
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border/40 bg-card/20 divide-y divide-border/20">
          <div className="flex items-center justify-between px-4 py-3.5">
            <div>
              <p className="text-sm font-medium">Compact Mode</p>
              <p className="text-xs text-muted-foreground/50 mt-0.5">
                Denser message layout with reduced padding
              </p>
            </div>
            <Switch
              checked={local.compactMode}
              onCheckedChange={(v) => update("compactMode", v)}
            />
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <div>
              <p className="text-sm font-medium">Animations</p>
              <p className="text-xs text-muted-foreground/50 mt-0.5">
                Smooth transitions and slide-in effects
              </p>
            </div>
            <Switch
              checked={local.animationsEnabled}
              onCheckedChange={(v) => update("animationsEnabled", v)}
            />
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <div>
              <p className="text-sm font-medium">Sound Effects</p>
              <p className="text-xs text-muted-foreground/50 mt-0.5">
                Notification sounds on new messages
              </p>
            </div>
            <Switch
              checked={local.soundEnabled}
              onCheckedChange={(v) => update("soundEnabled", v)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
