'use client'

import { Chat, Settings, DEFAULT_SETTINGS } from './types'

const CHATS_KEY = 'nova-chats'
const SETTINGS_KEY = 'nova-settings'

export function getChats(): Chat[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(CHATS_KEY)
  if (!data) return []
  try {
    const parsed = JSON.parse(data)
    return parsed.map((chat: Chat) => ({
      ...chat,
      createdAt: new Date(chat.createdAt),
      updatedAt: new Date(chat.updatedAt),
      messages: chat.messages.map((msg) => ({
        ...msg,
        createdAt: new Date(msg.createdAt),
      })),
    }))
  } catch {
    return []
  }
}

export function saveChats(chats: Chat[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats))
}

export function getChat(id: string): Chat | undefined {
  const chats = getChats()
  return chats.find((c) => c.id === id)
}

export function saveChat(chat: Chat): void {
  const chats = getChats()
  const index = chats.findIndex((c) => c.id === chat.id)
  if (index >= 0) {
    chats[index] = chat
  } else {
    chats.unshift(chat)
  }
  saveChats(chats)
}

export function deleteChat(id: string): void {
  const chats = getChats()
  const filtered = chats.filter((c) => c.id !== id)
  saveChats(filtered)
}

export function getSettings(): Settings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS
  }
  const data = localStorage.getItem(SETTINGS_KEY)
  if (!data) {
    return DEFAULT_SETTINGS
  }
  try {
    const parsed = JSON.parse(data)
    // Merge with defaults to ensure all new fields are present
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

export function generateTitle(content: string): string {
  const cleaned = content.replace(/\n/g, ' ').trim()
  if (cleaned.length <= 40) return cleaned
  return cleaned.substring(0, 40) + '...'
}
