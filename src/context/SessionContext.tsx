"use client"

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SessionContextType {
  session: Session | null
  user: User | null
  isLoading: boolean
}

const SessionContext = createContext<SessionContextType>({
  session: null,
  user: null,
  isLoading: true,
})

export function SessionProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode
  initialSession: Session | null
}) {
  const [session, setSession] = useState<Session | null>(initialSession)
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null)
  const [isLoading, setIsLoading] = useState(!initialSession)
  const supabase = createClient() as any
  const router = useRouter()
  // Track whether we've ever had a confirmed session so we don't
  // treat transient SIGNED_OUT events (token refresh races) as real logouts
  const hasHadSession = useRef<boolean>(!!initialSession)
  const signOutTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // If no initial session, try to get it on the client
    if (!initialSession) {
      supabase.auth.getSession().then(({ data: { session: currentSession } }: any) => {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        setIsLoading(false)
        if (currentSession) hasHadSession.current = true
      })
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        hasHadSession.current = true
        // Cancel any pending sign-out refresh
        if (signOutTimer.current) {
          clearTimeout(signOutTimer.current)
          signOutTimer.current = null
        }
        // Only refresh server components on actual sign-in, not on every navigation
        if (event === 'SIGNED_IN') {
          router.refresh()
        }
      }

      if (event === 'SIGNED_OUT') {
        // Supabase fires SIGNED_OUT transiently during token refresh races on navigation.
        // Debounce: only treat it as a real logout if the session is still null after 1s.
        if (signOutTimer.current) clearTimeout(signOutTimer.current)
        signOutTimer.current = setTimeout(async () => {
          // Double-check: re-read the session from storage
          const { data: { session: recheck } } = await supabase.auth.getSession()
          if (!recheck) {
            // Genuinely signed out
            hasHadSession.current = false
            router.refresh()
          } else {
            // False alarm — session is still alive, restore state
            setSession(recheck)
            setUser(recheck.user)
          }
        }, 1000)
      }
    })

    return () => {
      subscription.unsubscribe()
      if (signOutTimer.current) clearTimeout(signOutTimer.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SessionContext.Provider value={{ session, user, isLoading }}>
      {children}
    </SessionContext.Provider>
  )
}

export const useSession = () => useContext(SessionContext)
