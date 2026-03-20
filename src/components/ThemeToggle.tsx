"use client"

import { useTheme } from '@/context/ThemeContext'
import { Sun, Moon, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const themes = [
    { id: 'light', icon: <Sun size={14} />, label: 'Light' },
    { id: 'dark', icon: <Moon size={14} />, label: 'Dark' },
    { id: 'glass', icon: <Sparkles size={14} />, label: 'Glass' }
  ] as const

  return (
    <div className="flex items-center gap-1.5 p-1 bg-foreground/5 border border-border rounded-full backdrop-blur-xl">
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className={`
            relative p-2 rounded-full transition-all duration-300 group
            ${theme === t.id ? 'bg-background text-primary shadow-lg border border-border/50' : 'text-muted hover:text-primary'}
          `}
          title={t.label}
        >
          <div className="relative z-10 transition-transform group-hover:scale-110 active:scale-95">
            {t.icon}
          </div>
          
          {theme === t.id && (
            <motion.div
              layoutId="theme-active-pill"
              className="absolute inset-0 rounded-full bg-background"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}

          {/* Theme-specific Hover Effects */}
          <div className={`
             absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-md
             ${t.id === 'dark' ? 'bg-silver/10' : t.id === 'glass' ? 'bg-primary-silver/20' : 'bg-soft-silver/40'}
          `} />
        </button>
      ))}
    </div>
  )
}
