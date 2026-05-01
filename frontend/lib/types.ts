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
  model: 'llama3',
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
  { id: 'llama3', name: 'Llama 3', provider: 'Ollama', badge: 'Balanced' },
  { id: 'mistral', name: 'Mistral', provider: 'Ollama', badge: 'Versatile' },
  { id: 'phi3', name: 'Phi-3', provider: 'Ollama', badge: 'Reasoning' },
  { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'Ollama', badge: 'Coding' },
  { id: 'gemma:2b', name: 'Gemma (2B)', provider: 'Ollama', badge: 'Efficient' },
  { id: 'qwen:0.5b', name: 'Qwen (0.5B)', provider: 'Ollama', badge: 'Ultralight' },
  { id: 'moondream', name: 'Moondream', provider: 'Ollama', badge: 'Vision-Lite' },
  { id: 'llava', name: 'LLaVA', provider: 'Ollama', badge: 'Multimodal' },
]
