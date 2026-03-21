"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'glass' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')

  const applyTheme = (newTheme: Theme, isPassiveSync = false) => {
    const targetClass = newTheme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : newTheme;

    const updateDOM = () => {
      document.documentElement.classList.remove('light', 'dark', 'glass')
      document.documentElement.classList.add(targetClass)
      // Optional fallback for legacy CSS animations
      document.documentElement.setAttribute('data-theme-changing', 'true')
      setTimeout(() => document.documentElement.removeAttribute('data-theme-changing'), 500)
    }

    if (!document.startViewTransition || isPassiveSync) {
      updateDOM()
    } else {
      document.startViewTransition(() => {
        updateDOM()
      })
    }

    setThemeState(newTheme)
    if (!isPassiveSync) {
      localStorage.setItem('ag_theme', newTheme)
    }
  }

  useEffect(() => {
    const savedTheme = (localStorage.getItem('ag_theme') as Theme) || 'system'
    applyTheme(savedTheme, true)

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (localStorage.getItem('ag_theme') === 'system') {
        applyTheme('system', true)
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const toggleTheme = () => {
    const nextTheme: Theme = 
      theme === 'light' ? 'dark' : 
      theme === 'dark' ? 'glass' : 
      theme === 'glass' ? 'system' : 'light'
    
    applyTheme(nextTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: applyTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
