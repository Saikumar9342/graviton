'use client'

import { Settings, DEFAULT_SETTINGS } from './types'

const SETTINGS_KEY = 'nova-settings'

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
