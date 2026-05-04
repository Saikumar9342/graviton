import {
  Sun,
  Moon,
  Monitor,
  Check,
  Plus,
  Palette,
  Layers,
  Layout,
  Type,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  ACCENT_COLORS,
  FONT_FAMILIES,
} from "@/lib/types";
import { SLabel } from "./shared";

interface AppearanceSettingsProps {
  local: Settings;
  theme: string;
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  onThemeChange: (t: "light" | "dark" | "system") => void;
}

export function AppearanceSettings({
  local,
  theme,
  update,
  onThemeChange,
}: AppearanceSettingsProps) {
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
              onClick={() => onThemeChange(v)}
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
            <h3 className="text-sm font-semibold tracking-tight"> Visual DNA </h3>
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
                  onChange={(e) => update("glassTintColor", e.target.value)}
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
              <SLabel className="mb-0 text-[10px]">Pattern Intensity</SLabel>
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
            <h3 className="text-sm font-semibold tracking-tight">Sidebar</h3>
            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">
              Panel Configuration
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <SLabel className="mb-0 text-[10px]">Sidebar Opacity</SLabel>
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
            <h3 className="text-sm font-semibold tracking-tight">Typography</h3>
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
              <span className="text-[11px] font-medium">Motion Effects</span>
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
            <h3 className="text-sm font-semibold tracking-tight">Structure</h3>
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
        </div>
      </div>
    </div>
  );
}
