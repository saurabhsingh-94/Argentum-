"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, AtSign, FileText, Rocket, CheckCircle2, AlertCircle } from 'lucide-react'

export default function Onboarding() {
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [currentlyBuilding, setCurrentlyBuilding] = useState('')
  const [user, setUser] = useState<any>(null)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [usernameMessage, setUsernameMessage] = useState('')
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!supabase) return

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }
      setUser(user)
      
      // Auto-fill from GitHub/Google if available
      setDisplayName(user.user_metadata.full_name || user.user_metadata.name || '')
      const rawUsername = user.user_metadata.user_name || user.user_metadata.preferred_username || ''
      if (rawUsername) {
        setUsername(rawUsername.toLowerCase())
      }
    }
    checkUser()
  }, [supabase, router])

  // Real-time username check
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameStatus('idle')
      setUsernameMessage('')
      return
    }

    const checkAvailability = async () => {
      setUsernameStatus('checking')
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', username.toLowerCase())
        .single()

      if (error && error.code === 'PGRST116') { // Not found -> Available
        setUsernameStatus('available')
        setUsernameMessage('Username is available')
      } else {
        setUsernameStatus('taken')
        setUsernameMessage('Username already taken')
      }
    }

    const timer = setTimeout(checkAvailability, 500)
    return () => clearTimeout(timer)
  }, [username, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || loading || usernameStatus !== 'available') return

    setLoading(true)
    try {
      const { error } = await supabase.from('users').insert({
        id: user.id,
        username: username.toLowerCase(),
        display_name: displayName,
        bio,
        currently_building: currentlyBuilding,
        avatar_url: user.user_metadata.avatar_url,
        github_username: user.user_metadata.user_name,
      })

      if (error) throw error
      
      router.push('/')
      router.refresh()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-20 flex justify-center">
      <div className="w-full max-w-md glass-card p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl border border-silver flex items-center justify-center bg-[#111] mb-4 silver-glow">
            <span className="text-sm font-bold text-silver">Ag</span>
          </div>
          <h1 className="text-2xl font-bold">Welcome to Argentum</h1>
          <p className="text-sm text-gray-500 mt-2">Let's set up your builder profile.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <AtSign size={14} />
              <span>Username</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                className={`w-full bg-[#1a1a1a] border rounded-lg px-4 py-3 text-sm focus:outline-none transition-all ${
                  usernameStatus === 'available' ? 'border-green-500/50 focus:border-green-500' : 
                  usernameStatus === 'taken' ? 'border-red-500/50 focus:border-red-500' : 
                  'border-white/5 focus:border-accent'
                }`}
                placeholder="johndoe"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {usernameStatus === 'checking' && <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                {usernameStatus === 'available' && <CheckCircle2 className="text-green-500" size={16} />}
                {usernameStatus === 'taken' && <AlertCircle className="text-red-500" size={16} />}
              </div>
            </div>
            {usernameMessage && (
              <span className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${usernameStatus === 'available' ? 'text-green-500' : 'text-red-500'}`}>
                {usernameMessage}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <User size={14} />
              <span>Display Name</span>
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-[#1a1a1a] border border-white/5 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent transition-colors"
              placeholder="John Doe"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <FileText size={14} />
              <span>Bio</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="bg-[#1a1a1a] border border-white/5 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent transition-colors min-h-[80px]"
              placeholder="Building the future of..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Rocket size={14} />
              <span>Currently Building</span>
            </label>
            <input
              type="text"
              value={currentlyBuilding}
              onChange={(e) => setCurrentlyBuilding(e.target.value)}
              className="bg-[#1a1a1a] border border-white/5 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent transition-colors"
              placeholder="Argentum, a proof-of-work protocol"
            />
          </div>

          <button
            type="submit"
            disabled={loading || usernameStatus !== 'available'}
            className={`
              w-full font-bold py-4 rounded-xl transition-all shadow-lg mt-4 active:scale-95 disabled:opacity-50 disabled:grayscale
              ${usernameStatus === 'available' ? 'silver-metallic shadow-glow' : 'bg-white/5 text-gray-500 border border-white/5'}
            `}
          >
            {loading ? 'Setting up...' : 'Get Started'}
          </button>
        </form>
      </div>
    </div>
  )
}
