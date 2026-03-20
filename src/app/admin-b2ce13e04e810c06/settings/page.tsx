"use client"

import { useState, useEffect } from 'react'
import { 
  Shield, 
  Lock, 
  Globe, 
  RefreshCcw,
  Zap,
  UserPlus,
  Loader2
} from 'lucide-react'
import { useCsrfToken } from '@/hooks/useCsrfToken'

export default function AdminSettings() {
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<any>({})
  const [fetching, setFetching] = useState(true)
  const { token: csrfToken } = useCsrfToken()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings')
        const data = await res.json()
        setSettings(data)
      } catch (e) {
        console.error('Failed to fetch settings')
      } finally {
        setFetching(false)
      }
    }
    fetchSettings()
  }, [])

  const handleToggle = async (key: string, currentValue: any) => {
    if (!csrfToken) return alert('CSRF token missing. Please refresh.')
    
    const newValue = !currentValue
    setSaving(true)
    
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: newValue, token: csrfToken })
      })
      
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to update setting')
      
      setSettings((prev: any) => ({ ...prev, [key]: newValue }))
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-red-500" size={32} />
      </div>
    )
  }

  const controllers = [
    { key: 'maintenance_mode', label: 'Maintenance Mode', desc: 'Seal the platform for development.', icon: Lock },
    { key: 'registration_enabled', label: 'Registration Gate', desc: 'Disable new builder signups.', icon: UserPlus },
    { key: 'broadcast_enabled', label: 'Speak Broadcasts', desc: 'Toggle global premium broadcasts.', icon: Zap },
    { key: 'network_visibility', label: 'Network Visibility', desc: 'Toggle public profile discovery.', icon: Globe },
  ]

  return (
    <div className="space-y-10 max-w-4xl">
      <header>
         <h1 className="text-4xl font-black tracking-tighter mb-2 text-foreground uppercase">Global Settings</h1>
         <p className="text-foreground/40 text-sm font-medium tracking-tight">Platform-wide configurations and security parameters.</p>
      </header>

      <div className="space-y-8">
        <section className="space-y-6">
           <h2 className="text-xs font-black uppercase tracking-[0.3em] text-red-500 flex items-center gap-2">
             <Shield size={14} /> Security Controllers
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {controllers.map((item) => {
                const isEnabled = settings[item.key] === true
                return (
                  <div key={item.key} className="bg-card border border-border p-6 rounded-3xl flex items-center justify-between transition-all">
                     <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isEnabled ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-gray-400'}`}>
                           <item.icon size={20} />
                        </div>
                        <div>
                           <p className="text-xs font-black uppercase tracking-widest text-foreground">{item.label}</p>
                           <p className="text-[10px] text-gray-500 font-medium">{item.desc}</p>
                        </div>
                     </div>
                     <button 
                       disabled={saving}
                       onClick={() => handleToggle(item.key, !!settings[item.key])}
                       className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isEnabled ? 'bg-red-500 text-black shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-foreground/5 text-foreground/40 border border-border hover:bg-foreground/10'}`}
                     >
                       {isEnabled ? 'ENABLED' : 'DISABLED'}
                     </button>
                  </div>
                )
              })}
           </div>
        </section>
      </div>
    </div>
  )
}
