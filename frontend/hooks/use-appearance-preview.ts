import { useEffect } from "react";
import { Settings } from "@/lib/types";

export function useAppearancePreview(settings: Settings, setTheme: (theme: any) => void) {
  const updatePreview = (key: keyof Settings, value: any) => {
    const root = document.documentElement;
    
    switch (key) {
      case "accentColor":
        root.style.setProperty("--primary", value);
        root.style.setProperty("--glow-primary", `${value}4d`);
        root.setAttribute("data-accent", value);
        break;
      case "borderRadius":
        root.style.setProperty("--radius", `${value}px`);
        break;
      case "fontFamily": {
        // Map setting values to actual CSS font-family stacks
        const fontMap: Record<string, string> = {
          'Inter': 'var(--font-inter), system-ui, sans-serif',
          'inter': 'var(--font-inter), system-ui, sans-serif',
          'JetBrains Mono': 'var(--font-jetbrains-mono), ui-monospace, monospace',
          "'JetBrains Mono'": 'var(--font-jetbrains-mono), ui-monospace, monospace',
          'Fraunces': 'var(--font-fraunces), Georgia, serif',
          'System': 'system-ui, -apple-system, sans-serif',
        };
        const resolved = fontMap[value] ?? value;
        root.style.setProperty("--font-sans", resolved);
        root.style.setProperty("--font-family", resolved);
        document.body.style.fontFamily = resolved;
        break;
      }
      case "theme":
        setTheme(value);
        break;
      case "contrast":
        root.style.setProperty("--contrast", `${value / 100}`);
        break;
      case "sidebarPosition":
        root.setAttribute("data-sidebar", value);
        break;
      case "contentWidth":
        root.setAttribute("data-content", value);
        break;
      case "accentMode":
        root.setAttribute("data-accent-mode", value);
        break;
      case "lineHeight":
        root.style.setProperty("--line-height", `${value / 100}`);
        break;
      case "letterSpacing":
        root.style.setProperty("--letter-spacing", `${value}em`);
        break;
      case "backgroundOpacity":
        root.style.setProperty("--bg-opacity", `${value / 100}`);
        break;
      case "glassOpacity":
        root.style.setProperty("--glass-opacity", String(value / 100));
        break;
      case "glassBlur":
        root.style.setProperty("--glass-blur", `${value}px`);
        break;
      case "glowIntensity":
        root.style.setProperty("--glow-intensity", String(value / 100));
        break;
      case "glowRadius":
        root.style.setProperty("--glow-radius", `${value}px`);
        break;
      case "noiseOpacity":
        root.style.setProperty("--noise-opacity", String(value / 100));
        break;
      case "borderWidth":
        root.style.setProperty("--border-width", `${value}px`);
        break;
      case "sidebarOpacity":
        root.style.setProperty("--sidebar-opacity", String(value / 100));
        break;
      case "sidebarBlur":
        root.style.setProperty("--sidebar-blur", `${value}px`);
        break;
      case "sidebarWidth":
        root.style.setProperty("--sidebar-width", `${value}px`);
        break;
      case "sidebarPadding":
        root.style.setProperty("--sidebar-padding", `${value}px`);
        break;
      case "chatMaxWidth":
        root.style.setProperty("--chat-max-width", `${value}px`);
        break;
      case "messageSpacing":
        root.style.setProperty("--message-spacing", `${value}px`);
        break;
      case "accentSaturation":
        root.style.setProperty("--accent-saturation", `${value}%`);
        break;
      case "fontSize":
        root.setAttribute("data-font-size", value);
        break;
      case "fontWeight":
        root.style.setProperty("--font-weight", String(value));
        break;
      case "animationsEnabled":
        root.setAttribute("data-animations", value ? "true" : "false");
        break;
      case "glassTintColor":
        root.style.setProperty("--glass-tint", value);
        break;
      case "glassSaturation":
        root.style.setProperty("--glass-saturation", `${value}%`);
        break;
      case "uiDensity":
        root.setAttribute("data-density", value);
        break;
      case "glowSpread":
        root.style.setProperty("--glow-spread", `${value}px`);
        break;
      case "borderStyle":
        root.style.setProperty("--border-style", value);
        break;
      case "gridOpacity":
        root.style.setProperty("--grid-opacity", String(value / 100));
        break;
      case "backgroundPattern":
        root.setAttribute("data-pattern", value);
        break;
      case "themePreset":
        root.setAttribute("data-theme-preset", value);
        // Clear inline overrides so CSS preset block vars take effect
        root.style.removeProperty("--font-sans");
        root.style.removeProperty("--font-family");
        root.style.removeProperty("--font-weight");
        root.style.removeProperty("--letter-spacing");
        root.style.removeProperty("--line-height");
        root.style.removeProperty("--radius");
        document.body.style.fontFamily = "";
        break;
    }
  };

  const resetPreview = (originalSettings: Settings) => {
    Object.entries(originalSettings).forEach(([key, value]) => {
      updatePreview(key as keyof Settings, value);
    });
  };

  return { updatePreview, resetPreview };
}
