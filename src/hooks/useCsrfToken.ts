"use client"

import { useEffect, useState } from 'react'

export function useCsrfToken() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshToken = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/csrf')
      if (res.ok) {
        const data = await res.json()
        setToken(data.token)
      } else {
        setToken(null)
      }
    } catch (e) {
      console.error('Failed to fetch CSRF token')
      setToken(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshToken()
    // Refresh token every 2 hours to avoid "today's date" boundary issues
    const interval = setInterval(refreshToken, 1000 * 60 * 60 * 2)
    return () => clearInterval(interval)
  }, [])

  return { token, loading, refreshToken }
}
