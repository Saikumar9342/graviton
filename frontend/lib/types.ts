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
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
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
  dashboardCity: string
  dashboardTopics: string[]
  dashboardSubTopics: string[]
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
  dashboardCity: '',
  dashboardTopics: ['world', 'tech', 'weather'],
  dashboardSubTopics: [],
}

// ── Dashboard topic registry ──────────────────────────────────────────────────

export interface SubTopic {
  id: string
  label: string
  emoji: string
  rss?: string          // RSS feed URL
  note?: string         // short note shown in settings
}

export interface TopicCategory {
  id: string
  label: string
  emoji: string
  desc: string
  required?: boolean
  subtopics: SubTopic[]
}

export const TOPIC_REGISTRY: TopicCategory[] = [
  {
    id: 'weather',
    label: 'Weather',
    emoji: '🌤️',
    desc: 'Live conditions for your saved location',
    required: true,
    subtopics: [],
  },
  {
    id: 'world',
    label: 'World News',
    emoji: '🌍',
    desc: 'Top global headlines',
    required: true,
    subtopics: [
      { id: 'world_bbc',     label: 'BBC World',      emoji: '📡', rss: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
      { id: 'world_reuters', label: 'Reuters',         emoji: '📰', rss: 'https://feeds.reuters.com/reuters/topNews' },
      { id: 'world_ap',      label: 'AP News',         emoji: '🗞️', rss: 'https://rsshub.app/apnews/topics/apf-topnews' },
    ],
  },
  {
    id: 'tech',
    label: 'Technology',
    emoji: '💻',
    desc: 'Latest in tech, AI, and software',
    subtopics: [
      { id: 'tech_bbc',    label: 'BBC Tech',       emoji: '📡', rss: 'https://feeds.bbci.co.uk/news/technology/rss.xml' },
      { id: 'tech_hn',     label: 'Hacker News',    emoji: '🧡', rss: 'https://hnrss.org/frontpage' },
      { id: 'tech_verge',  label: 'The Verge',      emoji: '⚡', rss: 'https://www.theverge.com/rss/index.xml' },
      { id: 'tech_wired',  label: 'Wired',          emoji: '🔬', rss: 'https://www.wired.com/feed/rss' },
    ],
  },
  {
    id: 'sports',
    label: 'Sports',
    emoji: '⚽',
    desc: 'Scores, fixtures, and sports news',
    subtopics: [
      { id: 'sports_bbc',      label: 'BBC Sport',       emoji: '📡', rss: 'https://feeds.bbci.co.uk/sport/rss.xml' },
      { id: 'sports_football', label: 'Football (Soccer)',emoji: '⚽', rss: 'https://feeds.bbci.co.uk/sport/football/rss.xml' },
      { id: 'sports_cricket',  label: 'Cricket',          emoji: '🏏', rss: 'https://feeds.bbci.co.uk/sport/cricket/rss.xml' },
      { id: 'sports_tennis',   label: 'Tennis',           emoji: '🎾', rss: 'https://feeds.bbci.co.uk/sport/tennis/rss.xml' },
      { id: 'sports_f1',       label: 'Formula 1',        emoji: '🏎️', rss: 'https://feeds.bbci.co.uk/sport/formula1/rss.xml' },
      { id: 'sports_nba',      label: 'Basketball / NBA', emoji: '🏀', rss: 'https://feeds.bbci.co.uk/sport/basketball/rss.xml' },
      { id: 'sports_golf',     label: 'Golf',             emoji: '⛳', rss: 'https://feeds.bbci.co.uk/sport/golf/rss.xml' },
    ],
  },
  {
    id: 'science',
    label: 'Science',
    emoji: '🔭',
    desc: 'Research, space, biology, climate',
    subtopics: [
      { id: 'science_bbc',   label: 'BBC Science',  emoji: '📡', rss: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml' },
      { id: 'science_nasa',  label: 'NASA',         emoji: '🚀', rss: 'https://www.nasa.gov/rss/dyn/breaking_news.rss' },
      { id: 'science_nature',label: 'Nature',       emoji: '🧬', rss: 'https://www.nature.com/nature.rss' },
      { id: 'science_astro', label: 'Astronomy',    emoji: '🌌', rss: 'https://www.skyandtelescope.com/astronomy-news/feed/' },
    ],
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    emoji: '🎬',
    desc: 'Film, TV, celebrities, and culture',
    subtopics: [
      { id: 'ent_bbc',     label: 'BBC Entertainment', emoji: '📡', rss: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml' },
      { id: 'ent_variety', label: 'Variety',            emoji: '🎭', rss: 'https://variety.com/feed/' },
      { id: 'ent_imdb',    label: 'Movies (IMDB News)', emoji: '🍿', rss: 'https://www.imdb.com/news/top' },
    ],
  },
  {
    id: 'music',
    label: 'Music',
    emoji: '🎵',
    desc: 'Charts, new releases, and music news',
    subtopics: [
      { id: 'music_billboard', label: 'Billboard',        emoji: '📊', rss: 'https://www.billboard.com/feed/' },
      { id: 'music_pitchfork', label: 'Pitchfork',        emoji: '🎸', rss: 'https://pitchfork.com/rss/news/feed.xml' },
      { id: 'music_nme',       label: 'NME',              emoji: '🎤', rss: 'https://www.nme.com/news/music/feed' },
    ],
  },
  {
    id: 'gaming',
    label: 'Gaming',
    emoji: '🎮',
    desc: 'Game releases, reviews, and eSports',
    subtopics: [
      { id: 'gaming_ign',       label: 'IGN',           emoji: '🕹️', rss: 'https://feeds.ign.com/ign/all' },
      { id: 'gaming_eurogamer', label: 'Eurogamer',     emoji: '🇪🇺', rss: 'https://www.eurogamer.net/?format=rss' },
      { id: 'gaming_pcgamer',   label: 'PC Gamer',      emoji: '🖥️', rss: 'https://www.pcgamer.com/rss/' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    emoji: '📈',
    desc: 'Markets, stocks, crypto, and economy',
    subtopics: [
      { id: 'finance_reuters', label: 'Reuters Finance', emoji: '💹', rss: 'https://feeds.reuters.com/reuters/businessNews' },
      { id: 'finance_cnbc',    label: 'CNBC',            emoji: '📊', rss: 'https://www.cnbc.com/id/100003114/device/rss/rss.html' },
      { id: 'finance_crypto',  label: 'CoinDesk (Crypto)',emoji: '₿', rss: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
    ],
  },
  {
    id: 'health',
    label: 'Health',
    emoji: '🏥',
    desc: 'Medical research, fitness, and wellness',
    subtopics: [
      { id: 'health_bbc',     label: 'BBC Health',    emoji: '📡', rss: 'https://feeds.bbci.co.uk/news/health/rss.xml' },
      { id: 'health_who',     label: 'WHO News',      emoji: '🌐', rss: 'https://www.who.int/rss-feeds/news-english.xml' },
    ],
  },
  {
    id: 'politics',
    label: 'Politics',
    emoji: '🏛️',
    desc: 'Government, elections, and policy',
    subtopics: [
      { id: 'politics_bbc',      label: 'BBC Politics',  emoji: '📡', rss: 'https://feeds.bbci.co.uk/news/politics/rss.xml' },
      { id: 'politics_guardian', label: 'The Guardian',  emoji: '🗞️', rss: 'https://www.theguardian.com/politics/rss' },
    ],
  },
]

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
  { id: 'llama3.1:latest', name: 'Llama 3.1', provider: 'Ollama', badge: 'Latest', category: 'General' },
  { id: 'llama3:latest', name: 'Llama 3', provider: 'Ollama', badge: 'Stable', category: 'General' },
  { id: 'mistral:latest', name: 'Mistral', provider: 'Ollama', badge: 'Balanced', category: 'Fast' },
  { id: 'deepseek-coder-v2:latest', name: 'DeepSeek Coder V2', provider: 'Ollama', badge: 'Coding', category: 'Coding' },
  { id: 'phi3:latest', name: 'Phi-3', provider: 'Ollama', badge: 'Small', category: 'Fast' },
  { id: 'qwen2.5:latest', name: 'Qwen 2.5', provider: 'Ollama', badge: 'Smart', category: 'Reasoning' },
]

export const MODEL_CATEGORIES = [
  { id: 'General', name: 'General Purpose', desc: 'Balanced for conversation and knowledge.' },
  { id: 'Coding', name: 'Coding & Technical', desc: 'Optimized for software development and logic.' },
  { id: 'Reasoning', name: 'Advanced Reasoning', desc: 'Best for complex logic and step-by-step thinking.' },
  { id: 'Fast', name: 'High Speed', desc: 'Optimized for low-latency, quick responses.' },
  { id: 'Vision', name: 'Vision Systems', desc: 'Capable of analyzing and understanding images.' },
  { id: 'ImageGeneration', name: 'Image Synthesis', desc: 'Generate visual assets from text prompts.' },
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

export interface ThemePreset {
  id: string
  name: string
  description: string
  emoji: string
  vars: Partial<Settings>
}

export const PRESET_THEMES: ThemePreset[] = [
  {
    id: 'editorial-dark',
    name: 'Editorial Dark',
    description: 'Warm paper tones, sharp borders, newspaper feel',
    emoji: '📰',
    vars: { theme: 'dark', accentColor: '#e07a40', borderRadius: 4, fontFamily: 'Inter', glowIntensity: 0, glassBlur: 0, backgroundPattern: 'none' },
  },
  {
    id: 'editorial-light',
    name: 'Editorial Light',
    description: 'Clean paper, high contrast, minimal chrome',
    emoji: '🗞️',
    vars: { theme: 'light', accentColor: '#e07a40', borderRadius: 4, fontFamily: 'Inter', glowIntensity: 0, glassBlur: 0, backgroundPattern: 'none' },
  },
  {
    id: 'midnight-violet',
    name: 'Midnight Violet',
    description: 'Deep dark with vivid violet glow',
    emoji: '🌌',
    vars: { theme: 'dark', accentColor: '#8b5cf6', borderRadius: 12, glowIntensity: 80, glassBlur: 12, glowRadius: 24, backgroundPattern: 'none' },
  },
  {
    id: 'ocean-glass',
    name: 'Ocean Glass',
    description: 'Frosted glass with cyan ocean accent',
    emoji: '🌊',
    vars: { theme: 'dark', accentColor: '#06b6d4', borderRadius: 16, glowIntensity: 60, glassBlur: 16, glassOpacity: 25, backgroundPattern: 'none' },
  },
  {
    id: 'forest-mono',
    name: 'Forest Mono',
    description: 'Earthy greens, monospaced, terminal feel',
    emoji: '🌿',
    vars: { theme: 'dark', accentColor: '#10b981', borderRadius: 2, fontFamily: "'JetBrains Mono'", glowIntensity: 40, glassBlur: 0, backgroundPattern: 'grid', gridOpacity: 15 },
  },
  {
    id: 'rose-dawn',
    name: 'Rose Dawn',
    description: 'Soft light mode with warm rose accent',
    emoji: '🌸',
    vars: { theme: 'light', accentColor: '#f43f5e', borderRadius: 20, glowIntensity: 0, glassBlur: 0, backgroundPattern: 'none' },
  },
  {
    id: 'amber-tech',
    name: 'Amber Tech',
    description: 'Amber on dark, retro-terminal aesthetic',
    emoji: '🟡',
    vars: { theme: 'dark', accentColor: '#f59e0b', borderRadius: 6, fontFamily: "'JetBrains Mono'", glowIntensity: 50, glassBlur: 0, backgroundPattern: 'dots', gridOpacity: 20 },
  },
  {
    id: 'sky-clean',
    name: 'Sky Clean',
    description: 'Light, airy, blue-sky productivity',
    emoji: '☁️',
    vars: { theme: 'light', accentColor: '#3b82f6', borderRadius: 14, glowIntensity: 0, glassBlur: 0, backgroundPattern: 'none' },
  },
]

export const FONT_FAMILIES = [
  { name: 'Inter', value: 'Inter' },
  { name: 'JetBrains Mono', value: "'JetBrains Mono'" },
  { name: 'Outfit', value: "'Outfit'" },
  { name: 'Roboto', value: "'Roboto'" },
  { name: 'System UI', value: 'system-ui' },
]
