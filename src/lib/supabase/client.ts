import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Resilient helper to fetch user with a timeout to prevent infinite loading.
 * Also handles the "AbortError: Lock broken" from Supabase's Web Locks usage.
 */
export async function getUserWithTimeout(timeoutMs = 8000) {
  const supabase = createClient()
  
  try {
    const userPromise = supabase.auth.getUser()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Auth timeout')), timeoutMs)
    )

    const result = await Promise.race([
      userPromise,
      timeoutPromise
    ]) as any

    return { user: result.data?.user || null, error: result.error || null }
  } catch (error: any) {
    // Supabase uses Web Locks for token refresh. If a service worker or
    // another tab steals the lock, we get an AbortError. Retry once with
    // getSession() which doesn't require a lock.
    if (error?.name === 'AbortError' || error?.message?.includes('Lock broken')) {
      try {
        const supabase2 = createClient()
        const { data: { session } } = await supabase2.auth.getSession()
        return { user: session?.user || null, error: null }
      } catch {
        return { user: null, error }
      }
    }
    console.warn('getUserWithTimeout: Request timed out or failed', error)
    return { user: null, error }
  }
}
