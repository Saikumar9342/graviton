import { Palette, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRESET_THEMES, type Settings } from "@/lib/types";

interface ThemesSettingsProps {
  local: Settings;
  onApplyPreset: (preset: typeof PRESET_THEMES[number]) => void;
  onSetSection: (section: any) => void;
}

export function ThemesSettings({
  local,
  onApplyPreset,
  onSetSection,
}: ThemesSettingsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
          <Palette className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold tracking-tight">Theme Presets</h3>
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">
            One-click looks · fine-tune in Appearance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {PRESET_THEMES.map((preset) => {
          const isActive =
            local.accentColor === preset.vars.accentColor &&
            local.theme === preset.vars.theme &&
            (preset.vars.borderRadius === undefined ||
              local.borderRadius === preset.vars.borderRadius);
          return (
            <button
              key={preset.id}
              onClick={() => onApplyPreset(preset)}
              className={cn(
                "relative text-left p-4 rounded-xl border transition-all duration-200 group",
                isActive
                  ? "border-primary bg-primary/8 shadow-sm"
                  : "border-border/40 hover:border-border bg-muted/10 hover:bg-muted/20",
              )}
            >
              {isActive && (
                <span className="absolute top-2.5 right-2.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-2.5 w-2.5 text-primary-foreground" />
                </span>
              )}
              <div className="flex items-start gap-3">
                <span className="text-2xl leading-none mt-0.5">
                  {preset.emoji}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight">
                    {preset.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5 leading-tight">
                    {preset.description}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span
                      className="h-3 w-3 rounded-full border border-white/20 shrink-0"
                      style={{ background: preset.vars.accentColor }}
                    />
                    <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-mono">
                      {preset.vars.theme} · r{preset.vars.borderRadius ?? "—"}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="pt-2 border-t border-border/30">
        <p className="text-[11px] text-muted-foreground/40 leading-relaxed">
          Applying a preset updates your live settings. Fine-tune any value in
          the{" "}
          <button
            className="underline text-muted-foreground/60 hover:text-foreground"
            onClick={() => onSetSection("appearance")}
          >
            Appearance
          </button>{" "}
          tab. Changes save when you click <strong>Save Changes</strong>.
        </p>
      </div>
    </div>
  );
}
