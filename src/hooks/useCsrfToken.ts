"use client"

import { useEffect, useState } from 'react'

export function useCsrfToken() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshToken = async () => {
    try {
      const res = await fetch('/api/admin/csrf')
      if (res.ok) {
        const data = await res.json()
        setToken(data.token)
      }
    } catch (e) {
      console.error('Failed to fetch CSRF token')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshToken()
  }, [])

  return { token, loading, refreshToken }
}
