'use client'

import * as React from 'react'
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
  resolvedTheme: 'dark',
})

export interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  attribute?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  attribute = 'class',
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark')

  // On mount: read saved theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('graviton-theme') as Theme | null
    const initial = saved ?? defaultTheme
    setThemeState(initial)
  }, [defaultTheme])

  // Apply theme to DOM whenever it changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const apply = (t: Theme) => {
      const resolved = t === 'system'
        ? (mediaQuery.matches ? 'dark' : 'light')
        : t

      setResolvedTheme(resolved)

      if (disableTransitionOnChange) {
        document.documentElement.style.setProperty('--transition-duration', '0ms')
        setTimeout(() => document.documentElement.style.removeProperty('--transition-duration'), 0)
      }

      if (attribute === 'class') {
        document.documentElement.classList.remove('light', 'dark')
        document.documentElement.classList.add(resolved)
      } else {
        document.documentElement.setAttribute(attribute, resolved)
      }
    }

    apply(theme)

    const handleSystemChange = () => {
      if (theme === 'system') apply('system')
    }
    mediaQuery.addEventListener('change', handleSystemChange)
    return () => mediaQuery.removeEventListener('change', handleSystemChange)
  }, [theme, attribute, disableTransitionOnChange])

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('graviton-theme', newTheme)
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
