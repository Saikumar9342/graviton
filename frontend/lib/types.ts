export interface Chat {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

export type ChatBubbleStyle = 'modern' | 'glass' | 'minimal'
export type FontSize = 'small' | 'medium' | 'large'
export type BackgroundStyle = 'solid' | 'gradient' | 'aurora' | 'mesh'

export interface Settings {
  model: string
  theme: 'light' | 'dark' | 'system'
  accentColor: string
  bubbleStyle: ChatBubbleStyle
  fontSize: FontSize
  backgroundStyle: BackgroundStyle
  animationsEnabled: boolean
  soundEnabled: boolean
  compactMode: boolean
  borderRadius: number
  fontFamily: string
  glassOpacity: number
  glowIntensity: number
  glassBlur: number
  borderWidth: number
  glowRadius: number
  sidebarWidth: number
  sidebarPadding: number
  chatMaxWidth: number
  messageSpacing: number
  sidebarOpacity: number
  sidebarBlur: number
  accentSaturation: number
  noiseOpacity: number
  sidebarPosition: 'left' | 'right'
  contentWidth: 'centered' | 'full'
  contrast: number
  accentMode: 'vivid' | 'subtle'
  lineHeight: number
  letterSpacing: number
  backgroundOpacity: number
  fontWeight: number
  glassTintColor: string
  glassSaturation: number
  uiDensity: 'compact' | 'comfort' | 'spacious'
  glowSpread: number
  borderStyle: 'solid' | 'dashed' | 'dotted'
  gridOpacity: number
  backgroundPattern: 'none' | 'grid' | 'dots' | 'mesh'
}

export const DEFAULT_SETTINGS: Settings = {
  model: 'llama3:latest',
  theme: 'dark',
  accentColor: '#8b5cf6',
  bubbleStyle: 'modern',
  fontSize: 'medium',
  backgroundStyle: 'aurora',
  animationsEnabled: true,
  soundEnabled: false,
  compactMode: false,
  borderRadius: 12,
  fontFamily: 'Inter',
  glassOpacity: 30,
  glowIntensity: 100,
  glassBlur: 12,
  borderWidth: 1,
  glowRadius: 20,
  sidebarWidth: 280,
  sidebarPadding: 16,
  chatMaxWidth: 800,
  messageSpacing: 24,
  sidebarOpacity: 100,
  sidebarBlur: 12,
  accentSaturation: 100,
  noiseOpacity: 10,
  sidebarPosition: 'left',
  contentWidth: 'centered',
  contrast: 100,
  accentMode: 'vivid',
  lineHeight: 160,
  letterSpacing: 0,
  backgroundOpacity: 100,
  fontWeight: 500,
  glassTintColor: '#ffffff',
  glassSaturation: 100,
  uiDensity: 'comfort',
  glowSpread: 0,
  borderStyle: 'solid',
  gridOpacity: 0,
  backgroundPattern: 'none',
}

export const ACCENT_COLORS: { id: string; name: string; class: string; hex: string }[] = [
  { id: 'violet', name: 'Violet', class: 'bg-violet-500', hex: '#8b5cf6' },
  { id: 'blue', name: 'Blue', class: 'bg-blue-500', hex: '#3b82f6' },
  { id: 'cyan', name: 'Cyan', class: 'bg-cyan-500', hex: '#06b6d4' },
  { id: 'emerald', name: 'Emerald', class: 'bg-emerald-500', hex: '#10b981' },
  { id: 'amber', name: 'Amber', class: 'bg-amber-500', hex: '#f59e0b' },
  { id: 'rose', name: 'Rose', class: 'bg-rose-500', hex: '#f43f5e' },
  { id: 'orange', name: 'Orange', class: 'bg-orange-500', hex: '#f97316' },
]

export const MODE_SYSTEM_PROMPTS: Record<string, string> = {
  chat: '',
  code: 'You are an expert software engineer. Provide precise, production-quality code with brief explanations.',
  research: 'You are a research analyst. Synthesize information thoroughly, cite reasoning, and structure answers clearly.',
}

// Static fallback list — overridden at runtime by live Ollama models + provider keys
export const AVAILABLE_MODELS = [
  { id: 'llama3:latest', name: 'Llama 3', provider: 'Ollama', badge: 'Latest' },
  { id: 'mistral:latest', name: 'Mistral', provider: 'Ollama', badge: 'Balanced' },
  { id: 'deepseek-coder:latest', name: 'DeepSeek Coder', provider: 'Ollama', badge: 'Coding' },
  { id: 'phi3:latest', name: 'Phi-3', provider: 'Ollama', badge: 'Fast' },
]

export const OPENAI_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', badge: 'Latest' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', badge: 'Fast' },
  { id: 'o1-mini', name: 'o1 Mini', provider: 'OpenAI', badge: 'Reasoning' },
]

export const ANTHROPIC_MODELS = [
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', provider: 'Anthropic', badge: 'Latest' },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', provider: 'Anthropic', badge: 'Fast' },
]

export const FONT_FAMILIES = [
  { name: 'Inter', value: 'Inter' },
  { name: 'JetBrains Mono', value: "'JetBrains Mono'" },
  { name: 'Outfit', value: "'Outfit'" },
  { name: 'Roboto', value: "'Roboto'" },
  { name: 'System UI', value: 'system-ui' },
]
