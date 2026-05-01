'use client'

import { useState, useEffect } from 'react'
import {
  Settings,
  Monitor,
  Moon,
  Sun,
  Key,
  Bot,
  Palette,
  Type,
  Sparkles,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  Zap,
  Check,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  AVAILABLE_MODELS,
  ACCENT_COLORS,
  Settings as SettingsType,
  AccentColor,
  ChatBubbleStyle,
  FontSize,
  BackgroundStyle,
} from '@/lib/types'
import { cn } from '@/lib/utils'

interface SettingsDialogProps {
  settings: SettingsType
  onSave: (settings: SettingsType) => void
}

export function SettingsDialog({ settings, onSave }: SettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [localSettings, setLocalSettings] = useState(settings)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleSave = () => {
    onSave(localSettings)
    setOpen(false)
  }

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    setLocalSettings((s) => ({ ...s, theme: newTheme }))
  }

  const updateSetting = <K extends keyof SettingsType>(
    key: K,
    value: SettingsType[K]
  ) => {
    setLocalSettings((s) => ({ ...s, [key]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-accent hover-lift"
        >
          <Settings className="h-5 w-5" />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px] glass-strong">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            Customize Your Experience
          </DialogTitle>
          <DialogDescription>
            Make Graviton yours with personalized themes, colors, and preferences
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="appearance" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <Type className="h-4 w-4" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">API</span>
            </TabsTrigger>
          </TabsList>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6 pt-4">
            {/* Theme Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Theme</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'light', label: 'Light', icon: Sun },
                  { value: 'dark', label: 'Dark', icon: Moon },
                  { value: 'system', label: 'System', icon: Monitor },
                ].map(({ value, label, icon: Icon }) => (
                  <Button
                    key={value}
                    variant="outline"
                    size="sm"
                    className={cn(
                      'h-20 flex-col gap-2 hover-lift',
                      theme === value &&
                        'border-primary bg-primary/10 ring-2 ring-primary/20'
                    )}
                    onClick={() =>
                      handleThemeChange(value as 'light' | 'dark' | 'system')
                    }
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs">{label}</span>
                    {theme === value && (
                      <Check className="absolute top-2 right-2 h-3 w-3 text-primary" />
                    )}
                  </Button>
                ))}
              </div>
            </div>

            {/* Accent Color */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Accent Color</Label>
              <div className="flex flex-wrap gap-2">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => updateSetting('accentColor', color.id)}
                    className={cn(
                      'group relative h-10 w-10 rounded-full transition-all hover:scale-110',
                      color.class,
                      localSettings.accentColor === color.id &&
                        'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110'
                    )}
                    title={color.name}
                  >
                    {localSettings.accentColor === color.id && (
                      <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-lg" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Background Style */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Background Effect</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[
                  { value: 'solid', label: 'Solid', preview: 'bg-background' },
                  {
                    value: 'gradient',
                    label: 'Gradient',
                    preview: 'bg-gradient-to-br from-primary/20 to-secondary',
                  },
                  { value: 'aurora', label: 'Aurora', preview: 'bg-aurora' },
                  { value: 'mesh', label: 'Mesh', preview: 'bg-mesh' },
                ].map(({ value, label, preview }) => (
                  <button
                    key={value}
                    onClick={() =>
                      updateSetting('backgroundStyle', value as BackgroundStyle)
                    }
                    className={cn(
                      'relative h-16 rounded-lg border-2 transition-all overflow-hidden hover-lift',
                      preview,
                      localSettings.backgroundStyle === value
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <span className="absolute inset-x-0 bottom-0 bg-background/80 py-1 text-xs font-medium backdrop-blur-sm">
                      {label}
                    </span>
                    {localSettings.backgroundStyle === value && (
                      <Check className="absolute top-1 right-1 h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Animations Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Animations</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable smooth transitions and effects
                  </p>
                </div>
              </div>
              <Switch
                checked={localSettings.animationsEnabled}
                onCheckedChange={(checked) =>
                  updateSetting('animationsEnabled', checked)
                }
              />
            </div>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-6 pt-4">
            {/* Model Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Bot className="h-4 w-4" />
                AI Model
              </Label>
              <Select
                value={localSettings.model}
                onValueChange={(value) => updateSetting('model', value)}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{model.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {model.provider}
                        </span>
                        {model.badge && (
                          <Badge variant="secondary" className="text-[10px]">
                            {model.badge}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bubble Style */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Message Style</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'modern', label: 'Modern', class: 'rounded-2xl' },
                  { value: 'classic', label: 'Classic', class: 'rounded-lg' },
                  { value: 'minimal', label: 'Minimal', class: 'rounded-md' },
                  { value: 'glass', label: 'Glass', class: 'rounded-2xl glass' },
                ].map(({ value, label, class: cls }) => (
                  <button
                    key={value}
                    onClick={() =>
                      updateSetting('bubbleStyle', value as ChatBubbleStyle)
                    }
                    className={cn(
                      'flex h-16 items-center justify-center border-2 transition-all hover-lift',
                      cls,
                      localSettings.bubbleStyle === value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Font Size</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'small', label: 'Small', size: 'text-sm' },
                  { value: 'medium', label: 'Medium', size: 'text-base' },
                  { value: 'large', label: 'Large', size: 'text-lg' },
                ].map(({ value, label, size }) => (
                  <Button
                    key={value}
                    variant="outline"
                    size="sm"
                    className={cn(
                      'h-12 hover-lift',
                      size,
                      localSettings.fontSize === value &&
                        'border-primary bg-primary/10 ring-2 ring-primary/20'
                    )}
                    onClick={() =>
                      updateSetting('fontSize', value as FontSize)
                    }
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Compact Mode */}
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  {localSettings.compactMode ? (
                    <Minimize2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Maximize2 className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium">Compact Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Reduce spacing for more content
                  </p>
                </div>
              </div>
              <Switch
                checked={localSettings.compactMode}
                onCheckedChange={(checked) =>
                  updateSetting('compactMode', checked)
                }
              />
            </div>

            {/* Sound Effects */}
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  {localSettings.soundEnabled ? (
                    <Volume2 className="h-5 w-5 text-primary" />
                  ) : (
                    <VolumeX className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium">Sound Effects</Label>
                  <p className="text-xs text-muted-foreground">
                    Play sounds for messages
                  </p>
                </div>
              </div>
              <Switch
                checked={localSettings.soundEnabled}
                onCheckedChange={(checked) =>
                  updateSetting('soundEnabled', checked)
                }
              />
            </div>
          </TabsContent>

          {/* API Tab */}
          <TabsContent value="api" className="space-y-6 pt-4">
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Using the Vercel AI Gateway - no API key required for default models.
                Add your own key for higher rate limits.
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="apiKey" className="flex items-center gap-2 text-sm font-medium">
                <Key className="h-4 w-4" />
                Custom API Key (Optional)
              </Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-..."
                value={localSettings.apiKey}
                onChange={(e) => updateSetting('apiKey', e.target.value)}
                className="h-12 input-glow"
              />
              <p className="text-xs text-muted-foreground">
                Your key is stored locally and never sent to our servers.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex gap-2 border-t border-border pt-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1 glow-sm">
            <Sparkles className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
