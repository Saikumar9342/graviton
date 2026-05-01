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

export type AccentColor = 
  | 'violet'
  | 'blue'
  | 'cyan'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'orange'

export type ChatBubbleStyle = 'modern' | 'classic' | 'minimal' | 'glass'
export type FontSize = 'small' | 'medium' | 'large'
export type BackgroundStyle = 'solid' | 'gradient' | 'mesh' | 'aurora' | 'particles'

export interface Settings {
  model: string
  apiKey: string
  theme: 'light' | 'dark' | 'system'
  accentColor: AccentColor
  bubbleStyle: ChatBubbleStyle
  fontSize: FontSize
  backgroundStyle: BackgroundStyle
  animationsEnabled: boolean
  soundEnabled: boolean
  compactMode: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  model: 'openai/gpt-4o',
  apiKey: '',
  theme: 'dark',
  accentColor: 'violet',
  bubbleStyle: 'modern',
  fontSize: 'medium',
  backgroundStyle: 'aurora',
  animationsEnabled: true,
  soundEnabled: false,
  compactMode: false,
}

export const ACCENT_COLORS: { id: AccentColor; name: string; class: string; hex: string }[] = [
  { id: 'violet', name: 'Violet', class: 'bg-violet-500', hex: '#8b5cf6' },
  { id: 'blue', name: 'Blue', class: 'bg-blue-500', hex: '#3b82f6' },
  { id: 'cyan', name: 'Cyan', class: 'bg-cyan-500', hex: '#06b6d4' },
  { id: 'emerald', name: 'Emerald', class: 'bg-emerald-500', hex: '#10b981' },
  { id: 'amber', name: 'Amber', class: 'bg-amber-500', hex: '#f59e0b' },
  { id: 'rose', name: 'Rose', class: 'bg-rose-500', hex: '#f43f5e' },
  { id: 'orange', name: 'Orange', class: 'bg-orange-500', hex: '#f97316' },
]

export const AVAILABLE_MODELS = [
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', badge: 'Popular' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', badge: 'Fast' },
  { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', provider: 'OpenAI', badge: 'Latest' },
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'Anthropic', badge: null },
  { id: 'anthropic/claude-opus-4.6', name: 'Claude Opus 4.6', provider: 'Anthropic', badge: 'Powerful' },
  { id: 'google/gemini-3-flash', name: 'Gemini 3 Flash', provider: 'Google', badge: 'Fast' },
] as const
