"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Eye, 
  EyeOff, 
  MessageSquare, 
  LogOut, 
  Trash2, 
  ChevronRight, 
  Github, 
  Chrome, 
  Download, 
  RefreshCw, 
  Layout, 
  CheckCircle2, 
  ShieldAlert,
  Moon,
  Smartphone,
  CheckCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type SettingsSection = 'account' | 'privacy' | 'notifications' | 'messaging' | 'security' | 'appearance' | 'danger'

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<SettingsSection>('account')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  
  // Local Settings States
  const [compactMode, setCompactMode] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  useEffect(() => {
    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)

      const { data: prof } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setProfile(prof)
      setLoading(false)

      const savedCompact = localStorage.getItem('appearance_compact') === 'true'
      setCompactMode(savedCompact)
    }

    setup()
  }, [])

  const updateProfile = async (updates: any) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
      
      if (error) throw error
      setProfile({ ...profile, ...updates })
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const toggleCompactMode = () => {
    const newState = !compactMode
    setCompactMode(newState)
    localStorage.setItem('appearance_compact', String(newState))
    // In a real app, this would update a global context/provider
    window.location.reload() // Quick way to apply global change for now
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-silver animate-spin" />
      </div>
    )
  }

  const sections = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'messaging', label: 'Messaging', icon: MessageSquare },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Layout },
    { id: 'danger', label: 'Danger Zone', icon: ShieldAlert },
  ]

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col pt-16">
      <div className="container mx-auto max-w-6xl flex-1 flex gap-8 px-4 py-8">
        
        {/* Sidebar Nav */}
        <div className="w-64 hidden md:flex flex-col gap-2">
          <h1 className="text-2xl font-black mb-6 px-4 tracking-tighter">Settings</h1>
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id as SettingsSection)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeSection === s.id 
                  ? 'bg-white/10 text-white silver-glow shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
                  : 'text-gray-500 hover:bg-white/5 hover:text-silver'
              }`}
            >
              <s.icon size={18} />
              {s.label}
              {activeSection === s.id && <ChevronRight size={14} className="ml-auto opacity-50" />}
            </button>
          ))}
        </div>

        {/* Content Panel */}
        <div className="flex-1 glass-card border border-white/5 rounded-[2rem] overflow-hidden flex flex-col bg-[#0a0a0a]/50">
          <div className="p-8 md:p-12 max-w-3xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeSection === 'account' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-xl font-black mb-2">Account</h2>
                      <p className="text-sm text-gray-500">Manage your profile and linked accounts.</p>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-6 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                         <div className="w-16 h-16 rounded-2xl border border-white/10 bg-[#111] overflow-hidden flex items-center justify-center text-xl font-black text-silver">
                            {profile.avatar_url ? (
                              <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                              profile.username[0].toUpperCase()
                            )}
                         </div>
                         <div className="flex-1">
                            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Display Name</p>
                            <h3 className="text-lg font-bold">{profile.display_name || profile.username}</h3>
                         </div>
                         <button 
                            onClick={() => router.push(`/profile/${profile.username}`)}
                            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                          >
                           Edit Profile
                         </button>
                      </div>

                      <div className="grid gap-4">
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                           <div>
                             <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Username</p>
                             <p className="text-sm text-silver">@{profile.username}</p>
                           </div>
                           <button className="text-[10px] font-black text-silver border-b border-white/20 hover:border-white transition-all uppercase tracking-widest p-1">Change</button>
                        </div>

                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                           <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Connected Accounts</p>
                           <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Github size={18} className="text-gray-400" />
                                  <span className="text-sm">GitHub</span>
                                </div>
                                <span className="text-[10px] font-black text-green-500 uppercase tracking-widest bg-green-500/10 px-2 py-1 rounded-md">Connected</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Chrome size={18} className="text-gray-400" />
                                  <span className="text-sm">Google</span>
                                </div>
                                <button className="text-[10px] font-black text-silver border-b border-white/20 hover:border-white transition-all uppercase tracking-widest p-1">Connect</button>
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'privacy' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-xl font-black mb-2">Privacy</h2>
                      <p className="text-sm text-gray-500">Control who can see your activity and profile.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                         <div>
                            <p className="text-sm font-bold text-white mb-1">Profile Visibility</p>
                            <p className="text-xs text-gray-500">Make your profile visible to everyone.</p>
                         </div>
                         <button 
                          onClick={() => updateProfile({ is_public: !profile.is_public })}
                          className={`w-12 h-6 rounded-full relative transition-all ${profile.is_public ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-white/10'}`}
                         >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${profile.is_public ? 'left-7' : 'left-1'}`} />
                         </button>
                      </div>

                      <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl border-l-2 border-l-green-500/30">
                         <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Messaging & Presence</p>
                         <div className="space-y-6">
                            <div className="flex items-center justify-between">
                               <p className="text-sm">Show online status</p>
                               <button className="w-12 h-6 rounded-full bg-green-500 relative shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                                  <div className="absolute top-1 left-7 w-4 h-4 bg-white rounded-full transition-all" />
                               </button>
                            </div>
                            <div className="flex items-center justify-between">
                               <p className="text-sm">Show read receipts</p>
                               <button className="w-12 h-6 rounded-full bg-green-500 relative shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                                  <div className="absolute top-1 left-7 w-4 h-4 bg-white rounded-full transition-all" />
                               </button>
                            </div>
                         </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'notifications' && (
                  <div className="space-y-8">
                     <div>
                      <h2 className="text-xl font-black mb-2">Notifications</h2>
                      <p className="text-sm text-gray-500">Stay updated on your activity.</p>
                    </div>

                    <div className="space-y-3">
                       {['Upvotes on my posts', 'Comments on my posts', 'New followers', 'Direct messages', 'Post verified'].map((item) => (
                         <div key={item} className="p-5 bg-white/[0.01] border border-white/5 rounded-2xl flex items-center justify-between group hover:bg-white/[0.03] transition-all">
                            <span className="text-sm text-gray-200">{item}</span>
                            <button className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-green-500">
                               <CheckCircle size={18} />
                            </button>
                         </div>
                       ))}
                    </div>

                    <button className="w-full mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-silver hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                       <Smartphone size={16} />
                       Enable Browser Push Notifications
                    </button>
                  </div>
                )}

                {activeSection === 'messaging' && (
                   <div className="space-y-8">
                      <div>
                        <h2 className="text-xl font-black mb-2">Messaging</h2>
                        <p className="text-sm text-gray-500">Advanced security for your conversations.</p>
                      </div>

                      <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-6">
                         <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Default Disappearing Messages</p>
                            <div className="grid grid-cols-4 gap-2">
                               {['Off', '24h', '1 Week', 'Lifetime'].map((opt) => (
                                 <button 
                                  key={opt}
                                  className={`p-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                                    opt === 'Off' ? 'bg-white/10 border-white/20 text-white' : 'border-white/5 text-gray-500 hover:border-white/20'
                                  }`}
                                 >
                                   {opt}
                                 </button>
                               ))}
                            </div>
                         </div>
                      </div>

                      <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                         <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Blocked Users</p>
                         <div className="flex flex-col items-center justify-center py-8 opacity-20 gap-4">
                            <Trash2 size={24} />
                            <p className="text-xs font-black uppercase tracking-widest">No one is blocked</p>
                         </div>
                      </div>
                   </div>
                )}

                {activeSection === 'security' && (
                  <div className="space-y-8">
                     <div>
                      <h2 className="text-xl font-black mb-2">Security</h2>
                      <p className="text-sm text-gray-500">Protect your data and encryption keys.</p>
                    </div>

                    <div className="space-y-4">
                       <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Device Sessions</p>
                          <div className="flex items-center justify-between">
                             <div className="flex flex-col">
                                <span className="text-sm font-bold">Chrome on Windows</span>
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Active now</span>
                             </div>
                             <span className="w-2 h-2 rounded-full bg-green-500" />
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                          <button className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex flex-col items-center gap-3 text-center group">
                             <RefreshCw size={24} className="text-orange-500 group-hover:rotate-180 transition-transform duration-500" />
                             <div>
                                <p className="text-xs font-black uppercase tracking-widest text-silver">Regenerate Keys</p>
                                <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-widest">Old messages will be unreadable</p>
                             </div>
                          </button>
                          <button className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex flex-col items-center gap-3 text-center group">
                             <Download size={24} className="text-blue-500 group-hover:translate-y-1 transition-transform" />
                             <div>
                                <p className="text-xs font-black uppercase tracking-widest text-silver">Download Data</p>
                                <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-widest">Export profile as JSON</p>
                             </div>
                          </button>
                       </div>
                    </div>
                  </div>
                )}

                {activeSection === 'appearance' && (
                  <div className="space-y-8">
                     <div>
                      <h2 className="text-xl font-black mb-2">Appearance</h2>
                      <p className="text-sm text-gray-500">Customize your visual experience.</p>
                    </div>

                    <div className="space-y-4">
                       <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <Moon size={18} className="text-silver" />
                             <span className="text-sm font-bold">Theme</span>
                          </div>
                          <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest">Dark</div>
                       </div>

                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-white mb-1">Compact Mode</p>
                            <p className="text-xs text-gray-500">Reduces padding across the application.</p>
                          </div>
                          <button 
                            onClick={toggleCompactMode}
                            className={`w-12 h-6 rounded-full relative transition-all ${compactMode ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-white/10'}`}
                          >
                             <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${compactMode ? 'left-7' : 'left-1'}`} />
                          </button>
                       </div>
                    </div>
                  </div>
                )}

                {activeSection === 'danger' && (
                  <div className="space-y-8">
                     <div className="p-8 border-2 border-red-500/20 bg-red-500/5 rounded-[2rem] space-y-8">
                        <div>
                          <h2 className="text-xl font-black text-red-500 mb-2">Danger Zone</h2>
                          <p className="text-sm text-red-500/60 font-medium">Irreversible actions on your account.</p>
                        </div>

                        <div className="space-y-4">
                           <button 
                            onClick={handleLogout}
                            className="w-full p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all flex items-center justify-between group"
                           >
                              <div className="flex items-center gap-4">
                                 <LogOut size={24} className="text-gray-400" />
                                 <span className="text-sm font-bold">Sign Out</span>
                              </div>
                              <ChevronRight size={18} className="text-gray-600 group-hover:translate-x-1 transition-all" />
                           </button>

                           <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-6">
                              <div className="flex items-center gap-4">
                                 <Trash2 size={24} className="text-red-500" />
                                 <div className="flex flex-col">
                                    <span className="text-sm font-bold">Delete Account</span>
                                    <span className="text-xs text-red-500/60">This will permanently erase all your data.</span>
                                 </div>
                              </div>
                              
                              <div className="space-y-3">
                                 <p className="text-[10px] font-black text-red-500/80 uppercase tracking-widest uppercase">Type "DELETE" to confirm</p>
                                 <input 
                                  value={deleteConfirm}
                                  onChange={(e) => setDeleteConfirm(e.target.value)}
                                  className="w-full bg-[#111] border border-red-500/30 rounded-xl px-4 py-3 text-red-500 font-black placeholder:text-red-500/20 focus:outline-none" 
                                  placeholder="DELETE"
                                 />
                                 <button 
                                  disabled={deleteConfirm !== 'DELETE'}
                                  className="w-full py-4 rounded-xl bg-red-500 text-black text-xs font-black uppercase tracking-widest disabled:opacity-20 hover:brightness-110 transition-all shadow-glow-red"
                                 >
                                    Confirm Account Deletion
                                 </button>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Mobile Nav Overlay */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-white/5 flex p-2 z-[100]">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id as SettingsSection)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${
              activeSection === s.id ? 'text-white' : 'text-gray-500'
            }`}
          >
            <s.icon size={18} />
          </button>
        ))}
      </div>

      <style jsx global>{`
        .silver-glow {
          box-shadow: 0 0 15px rgba(192, 192, 192, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .shadow-glow-red {
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.2);
        }
      `}</style>
    </div>
  )
}

function Loader2({ className }: { className?: string }) {
  return (
    <div className={className}>
      <RefreshCw className="animate-spin" />
    </div>
  )
}
