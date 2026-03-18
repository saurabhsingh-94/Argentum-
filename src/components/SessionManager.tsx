"use client"

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SessionManager() {
  const supabase = createClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (event === 'SIGNED_IN' && session) {
        // Get user profile for metadata
        const { data: profile } = await supabase
          .from('users')
          .select('id, username, display_name, avatar_url')
          .eq('id', session.user.id)
          .single()

        const saved = localStorage.getItem('saved_accounts')
        let accounts = saved ? JSON.parse(saved) : []

        const newAccount = {
          id: session.user.id,
          email: session.user.email,
          username: profile?.username || session.user.email?.split('@')[0],
          display_name: profile?.display_name,
          avatar_url: profile?.avatar_url,
          session: {
            access_token: session.access_token,
            refresh_token: session.refresh_token
          }
        }

        // Update or add
        const index = accounts.findIndex((a: any) => a.id === newAccount.id)
        if (index > -1) {
          accounts[index] = newAccount
        } else {
          accounts.push(newAccount)
        }

        localStorage.setItem('saved_accounts', JSON.stringify(accounts))
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return null
}
