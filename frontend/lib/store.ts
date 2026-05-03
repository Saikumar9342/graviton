'use client'

import { create } from 'zustand'
import { Settings, DEFAULT_SETTINGS } from './types'
import { fetchSettings, saveSettingsToDb, fetchRegisteredModels, RegisteredModel } from './api'

// ── Settings store ────────────────────────────────────────────────────────────

interface SettingsStore {
  settings: Settings
  loaded: boolean
  load: () => Promise<void>
  save: (s: Settings) => void
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,

  load: async () => {
    try {
      const data = await fetchSettings()
      set({ settings: { ...DEFAULT_SETTINGS, ...data }, loaded: true })
    } catch {
      // Backend unreachable — fall back to localStorage for resilience
      try {
        const raw = localStorage.getItem('nova-settings')
        const parsed = raw ? JSON.parse(raw) : {}
        set({ settings: { ...DEFAULT_SETTINGS, ...parsed }, loaded: true })
      } catch {
        set({ loaded: true })
      }
    }
  },

  save: (s: Settings) => {
    set({ settings: s })
    saveSettingsToDb(s as unknown as Record<string, unknown>).catch(console.error)
  },
}))

// ── Registered models store ───────────────────────────────────────────────────

interface ModelsStore {
  models: RegisteredModel[]
  loaded: boolean
  load: () => Promise<void>
  setModels: (m: RegisteredModel[]) => void
}

export const useModelsStore = create<ModelsStore>((set) => ({
  models: [],
  loaded: false,

  load: async () => {
    try {
      const models = await fetchRegisteredModels()
      set({ models, loaded: true })
    } catch {
      set({ loaded: true })
    }
  },

  setModels: (models) => set({ models }),
}))
