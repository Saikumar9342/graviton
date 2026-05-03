import { Chat, ChatMessage } from './types'

const API_BASE = '/api'

// ── Chats ────────────────────────────────────────────────────────────────────

export async function fetchChats(): Promise<Chat[]> {
  const response = await fetch(`${API_BASE}/chats`)
  if (!response.ok) throw new Error('Failed to fetch chats')
  const data = await response.json()
  return data.map((chat: any) => ({
    id: chat.id,
    title: chat.title,
    createdAt: new Date(chat.created_at),
    updatedAt: new Date(chat.updated_at),
    messages: [],
  }))
}

export async function createChat(title: string): Promise<Chat> {
  const response = await fetch(`${API_BASE}/chats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
  if (!response.ok) throw new Error('Failed to create chat')
  const chat = await response.json()
  return {
    id: chat.id,
    title: chat.title,
    createdAt: new Date(chat.created_at),
    updatedAt: new Date(chat.updated_at),
    messages: [],
  }
}

export async function renameChat(id: string, title: string): Promise<void> {
  const response = await fetch(`${API_BASE}/chats/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
  if (!response.ok) throw new Error('Failed to rename chat')
}

export async function generateChatTitle(id: string, model?: string): Promise<string> {
  const response = await fetch(`${API_BASE}/chats/${id}/generate-title`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model }),
  })
  if (!response.ok) throw new Error('Failed to generate title')
  const data = await response.json()
  return data.title
}

export async function deleteChat(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/chats/${id}`, { method: 'DELETE' })
  if (!response.ok) throw new Error('Failed to delete chat')
}

export async function fetchMessages(chatId: string): Promise<ChatMessage[]> {
  const response = await fetch(`${API_BASE}/chats/${chatId}/messages`)
  if (!response.ok) throw new Error('Failed to fetch messages')
  const data = await response.json()
  return data.map((msg: any) => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    createdAt: new Date(msg.created_at),
    prompt_tokens: msg.prompt_tokens,
    completion_tokens: msg.completion_tokens,
    total_tokens: msg.total_tokens,
  }))
}

// ── Models ───────────────────────────────────────────────────────────────────

export interface ModelInfo {
  id: string
  name: string
  provider: string
  badge?: string
}

export async function fetchModels(): Promise<ModelInfo[]> {
  try {
    const response = await fetch(`${API_BASE}/models`)
    if (!response.ok) return []
    const data = await response.json()
    const names: string[] = data.models || []
    return names.map((id) => ({ id, name: id, provider: 'Ollama' }))
  } catch {
    return []
  }
}

export async function pullModel(
  name: string,
  onProgress: (status: string) => void
): Promise<void> {
  const response = await fetch(`${API_BASE}/models/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: name }),
  })
  if (!response.ok || !response.body) throw new Error('Pull request failed')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const text = decoder.decode(value)
    for (const line of text.split('\n').filter(Boolean)) {
      try {
        const data = JSON.parse(line)
        if (data.error) throw new Error(data.error)
        if (data.status) {
          const pct = data.completed && data.total
            ? ` (${Math.round((data.completed / data.total) * 100)}%)`
            : ''
          onProgress(data.status + pct)
        }
      } catch (e: any) {
        if (e.message && !e.message.startsWith('JSON')) throw e
      }
    }
  }
}

export async function deleteModel(name: string): Promise<void> {
  const response = await fetch(`${API_BASE}/models/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  })
  if (!response.ok) throw new Error('Failed to delete model')
}

// ── File Upload ──────────────────────────────────────────────────────────────

export interface UploadedFile {
  file_id: string
  filename: string
  size: number
}

export async function uploadFile(file: File): Promise<UploadedFile> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch('/api/upload', { method: 'POST', body: formData })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.detail || data.error || 'Upload failed')
  }
  return response.json()
}

// ── Settings ─────────────────────────────────────────────────────────────────

export async function fetchSettings(): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/settings`)
  if (!res.ok) throw new Error('Failed to fetch settings')
  const { data } = await res.json()
  return data
}

export async function saveSettingsToDb(data: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  })
  if (!res.ok) throw new Error('Failed to save settings')
}

// ── Registered Models ─────────────────────────────────────────────────────────

export interface RegisteredModel {
  id: string
  ollama_name: string
  display_name: string
  is_active: boolean
  provider: string
  api_base_url?: string | null
  has_api_key: boolean
  created_at: string
}

export interface CreateModelPayload {
  ollama_name: string
  display_name: string
  provider?: string
  api_base_url?: string
  api_key?: string
}

export async function fetchRegisteredModels(): Promise<RegisteredModel[]> {
  const res = await fetch(`${API_BASE}/registered-models`)
  if (!res.ok) throw new Error('Failed to fetch registered models')
  return res.json()
}

export async function createRegisteredModel(payload: CreateModelPayload): Promise<RegisteredModel> {
  const res = await fetch(`${API_BASE}/registered-models`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to register model')
  }
  return res.json()
}

export async function updateRegisteredModel(id: string, data: { display_name?: string; is_active?: boolean; api_key?: string }): Promise<RegisteredModel> {
  const res = await fetch(`${API_BASE}/registered-models/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update model')
  return res.json()
}

export async function deleteRegisteredModel(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/registered-models/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete model')
}

export async function syncRegisteredModels(): Promise<{ synced: number; added: string[] }> {
  const res = await fetch(`${API_BASE}/registered-models/sync`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to sync models')
  return res.json()
}

// ── Admin ────────────────────────────────────────────────────────────────────

export interface AdminStatus {
  ollama: { status: string; url: string; models: number }
  database: { status: string; url: string }
  version: string
}

export async function getAdminStatus(): Promise<AdminStatus> {
  const response = await fetch(`${API_BASE}/admin/status`)
  if (!response.ok) throw new Error('Failed to get admin status')
  return response.json()
}

export async function testDbConnection(url: string): Promise<{ status: string; message: string }> {
  const response = await fetch(`${API_BASE}/admin/db-test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || 'Connection failed')
  return data
}

export async function fetchGlobalUsage(): Promise<{ prompt_tokens: number; completion_tokens: number; total_tokens: number }> {
  const response = await fetch(`${API_BASE}/admin/usage`)
  if (!response.ok) throw new Error('Failed to fetch usage')
  return response.json()
}

export interface ModelUsage {
  model: string
  display_name: string
  provider: string
  requests: number
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  credits?: {
    limit: number
    usage: number
    remaining: number
    is_free: boolean
  }
}

export async function fetchModelUsage(): Promise<ModelUsage[]> {
  const response = await fetch(`${API_BASE}/admin/model-usage`)
  if (!response.ok) throw new Error('Failed to fetch model usage')
  return response.json()
}
