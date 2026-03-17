"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Lock, 
  Key, 
  FileUp, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Trash2,
  ChevronRight,
  ShieldCheck
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { decryptPrivateKey, saveSecretKey } from '@/lib/crypto'
import { encodeBase64 } from 'tweetnacl-util'

interface KeyRecoveryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type Mode = 'pin' | 'password' | 'file' | 'locked' | 'lost'

export default function KeyRecoveryModal({ isOpen, onClose, onSuccess }: KeyRecoveryModalProps) {
  const [mode, setMode] = useState<Mode>('pin')
  const [input, setInput] = useState('')
  const [pin, setPin] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null)
  const [remainingTime, setRemainingTime] = useState(0)
  const [hint, setHint] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      checkLockout()
      fetchHint()
    }
  }, [isOpen])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (lockoutUntil) {
      interval = setInterval(() => {
        const now = Date.now()
        if (now >= lockoutUntil) {
          setLockoutUntil(null)
          setAttempts(0)
          setMode('pin')
          localStorage.removeItem('ag_lockout_until')
          localStorage.removeItem('ag_recovery_attempts')
        } else {
          setRemainingTime(Math.ceil((lockoutUntil - now) / 1000))
        }
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [lockoutUntil])

  const checkLockout = () => {
    const storedLockout = localStorage.getItem('ag_lockout_until')
    const storedAttempts = localStorage.getItem('ag_recovery_attempts')
    
    if (storedLockout) {
      const until = parseInt(storedLockout)
      if (Date.now() < until) {
        setLockoutUntil(until)
        setMode('locked')
      } else {
        localStorage.removeItem('ag_lockout_until')
        localStorage.removeItem('ag_recovery_attempts')
      }
    }
    
    if (storedAttempts) {
      setAttempts(parseInt(storedAttempts))
    }
  }

  const fetchHint = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('users').select('key_backup_hint, key_backup_method').eq('id', user.id).single()
    if (data) {
      setHint(data.key_backup_hint)
      if (data.key_backup_method === 'password') setMode('password')
    }
  }

  const handleAttemptFailed = () => {
    const newAttempts = attempts + 1
    setAttempts(newAttempts)
    localStorage.setItem('ag_recovery_attempts', newAttempts.toString())
    
    if (newAttempts >= 5) {
      const until = Date.now() + 30 * 60 * 1000 // 30 mins
      setLockoutUntil(until)
      localStorage.setItem('ag_lockout_until', until.toString())
      setMode('locked')
      setError('Too many attempts. Locked for 30 minutes.')
    } else {
      setError(`Incorrect ${mode === 'pin' ? 'PIN' : 'password'}. ${5 - newAttempts} attempts remaining.`)
    }
  }

  const handleRecover = async (secret: string, customEncryptedKey?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('users')
        .select('encrypted_private_key')
        .eq('id', user.id)
        .single()

      const targetEncrypted = customEncryptedKey || profile?.encrypted_private_key
      if (!targetEncrypted) throw new Error('No backup found')

      const decrypted = await decryptPrivateKey(targetEncrypted, secret)
      
      // Success!
      saveSecretKey(encodeBase64(decrypted))
      localStorage.removeItem('ag_recovery_attempts')
      localStorage.removeItem('ag_lockout_until')
      onSuccess()
    } catch (err: any) {
      handleAttemptFailed()
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const content = JSON.parse(event.target?.result as string)
        if (!content.encrypted_key) throw new Error('Invalid backup file')
        
        const pw = prompt('Enter the password for this backup file:')
        if (pw) {
          await handleRecover(pw, content.encrypted_key)
        }
      } catch (err) {
        setError('Invalid file format')
      }
    }
    reader.readAsText(file)
  }

  const handlePinChange = (val: string, index: number) => {
    const newPin = [...pin]
    if (val.length <= 1 && /^\d*$/.test(val)) {
      newPin[index] = val
      setPin(newPin)
      if (val && index < 5) {
        document.getElementById(`recover-pin-${index + 1}`)?.focus()
      }
    }
  }

  const handleDeleteAll = async () => {
    if (!confirm('EXTREMELY IMPORTANT: This will delete ALL your messages and currently stored keys forever. This cannot be undone. Are you sure?')) return
    
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Delete user's messages and reset keys
      await supabase.from('messages').delete().or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      await supabase.from('users').update({ 
        public_key: null, 
        encrypted_private_key: null,
        key_backup_method: 'none',
        key_backup_hint: null
      }).eq('id', user.id)
      
      localStorage.clear()
      window.location.reload()
    } catch (err) {
      setError('Failed to reset data')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#050505]/95 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[3rem] overflow-hidden shadow-3xl"
          >
            <div className="p-10">
              <div className="text-center mb-10">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-silver/10 border border-silver/20 text-[8px] font-black uppercase tracking-widest text-silver mb-6">
                    <ShieldCheck size={10} /> Argentum Shield Recovery
                 </div>
                 <h2 className="text-4xl font-black text-white tracking-tighter mb-4">Restore Messages</h2>
                 <p className="text-gray-500 text-sm font-medium">Your identity is protected. Enter your backup secret to access your conversations on this device.</p>
              </div>

              {mode === 'locked' ? (
                <div className="text-center py-6 space-y-6">
                   <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500">
                      <Clock size={32} />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-xl font-black text-white">Recovery Locked</h3>
                      <p className="text-sm text-gray-500">Too many incorrect attempts.</p>
                      <p className="text-2xl font-black text-silver tabular-nums mt-4">
                        {Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')}
                      </p>
                   </div>
                </div>
              ) : mode === 'lost' ? (
                <div className="space-y-8 py-4">
                   <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 space-y-4">
                      <div className="flex gap-4">
                         <AlertCircle size={24} className="text-red-500 shrink-0" />
                         <div className="space-y-2">
                           <h4 className="text-xs font-black uppercase tracking-widest text-red-500">Irreversible Action</h4>
                           <p className="text-[11px] text-red-500/60 leading-relaxed font-medium">
                             Without your backup, your past messages are permanently unreadable. To start fresh, you must reset your identity.
                           </p>
                         </div>
                      </div>
                   </div>
                   <button
                     onClick={handleDeleteAll}
                     disabled={isLoading}
                     className="w-full py-5 bg-red-600 hover:bg-red-500 text-white rounded-3xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/20"
                   >
                     <Trash2 size={16} /> Reset Identity & Messages
                   </button>
                   <button onClick={() => setMode('pin')} className="w-full text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">I found my PIN</button>
                </div>
              ) : (
                <div className="space-y-8">
                   {mode === 'pin' ? (
                     <div className="flex justify-center gap-3">
                        {[0,1,2,3,4,5].map(i => (
                          <input
                            key={i}
                            id={`recover-pin-${i}`}
                            type="password"
                            inputMode="numeric"
                            maxLength={1}
                            value={pin[i]}
                            onChange={(e) => handlePinChange(e.target.value, i)}
                            className="w-12 h-16 bg-[#111] border border-white/5 rounded-2xl text-center text-2xl font-black focus:border-silver/40 focus:ring-4 focus:ring-silver/5 outline-none transition-all"
                          />
                        ))}
                     </div>
                   ) : (
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Enter Password</label>
                        <input 
                          type="password"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          className="w-full p-5 bg-[#111] border border-white/5 rounded-3xl text-sm silver-focus transition-all"
                        />
                     </div>
                   )}

                   {hint && (
                     <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Backup Hint</p>
                        <p className="text-xs text-silver mt-1 font-medium">{hint}</p>
                     </div>
                   )}

                   {error && (
                     <div className="flex items-center justify-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest italic animate-shake">
                        <AlertCircle size={14} /> {error}
                     </div>
                   )}

                   <div className="grid gap-3">
                      <button
                        onClick={() => mode === 'pin' ? handleRecover(pin.join('')) : handleRecover(input)}
                        disabled={isLoading || (mode === 'pin' ? pin.some(d => !d) : !input)}
                        className="w-full py-5 silver-metallic text-[#050505] rounded-3xl font-black uppercase tracking-widest text-xs shadow-glow-silver/20 transition-all font-bold"
                      >
                        {isLoading ? 'Decrypting Space...' : 'Restore Conversations'}
                      </button>

                      <div className="flex items-center gap-2 mt-4">
                         <div className="h-px bg-white/5 flex-1" />
                         <span className="text-[9px] font-black text-white/10 uppercase tracking-widest">Other Methods</span>
                         <div className="h-px bg-white/5 flex-1" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                         <button 
                           onClick={() => setMode(mode === 'pin' ? 'password' : 'pin')}
                           className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all"
                         >
                            {mode === 'pin' ? <Key size={14} /> : <Lock size={14} />}
                            {mode === 'pin' ? 'Password' : 'PIN'}
                         </button>
                         <label className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all cursor-pointer">
                            <FileUp size={14} /> File Backup
                            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                         </label>
                      </div>
                   </div>

                   <button 
                     onClick={() => setMode('lost')}
                     className="w-full text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-red-500/60 transition-colors mt-4"
                   >
                     I lost my backup secret
                   </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
