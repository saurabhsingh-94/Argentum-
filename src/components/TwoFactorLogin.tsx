"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'

interface TwoFactorLoginProps {
  onVerify: (otp: string) => Promise<void>
  onCancel: () => void
  loading: boolean
  error: string | null
}

export default function TwoFactorLogin({ onVerify, onCancel, loading, error }: TwoFactorLoginProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0]
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5) {
      const nextInput = document.getElementById(`login-otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`login-otp-${index - 1}`)
      prevInput?.focus()
    } else if (e.key === 'Enter' && otp.every(digit => digit)) {
      onVerify(otp.join(''))
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col items-center gap-8"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-silver/10 border border-primary-silver/20 flex items-center justify-center shadow-premium silver-glow">
          <Shield className="text-primary-silver" size={32} />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black uppercase tracking-widest">Security Check</h2>
          <p className="text-xs text-muted font-bold uppercase tracking-widest">Enter authentication code</p>
        </div>
      </div>

      <div className="flex gap-2.5 justify-center">
        {otp.map((digit, i) => (
          <input
            key={i}
            id={`login-otp-${i}`}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            autoFocus={i === 0}
            disabled={loading}
            className="w-12 h-16 bg-card/30 border border-border rounded-xl text-center text-2xl font-black text-foreground transition-all focus:border-primary-silver focus:ring-2 focus:ring-primary-silver/20 outline-none glass-card"
          />
        ))}
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-500/5 px-4 py-2.5 rounded-xl border border-red-500/20 shadow-glow-red"
        >
          <AlertCircle size={14} />
          <span>{error}</span>
        </motion.div>
      )}

      <div className="w-full flex flex-col gap-4">
        <button 
          onClick={() => onVerify(otp.join(''))}
          disabled={loading || otp.some(d => !d)}
          className="w-full py-4 rounded-2xl glass-button-3d text-foreground text-xs font-black uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-premium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Verifying Protocol...</span>
            </>
          ) : (
            <span>Authenticate</span>
          )}
        </button>
        
        <button 
          onClick={onCancel}
          disabled={loading}
          className="flex items-center justify-center gap-2 text-[10px] font-black text-muted uppercase tracking-widest hover:text-foreground transition-colors"
        >
          <ArrowLeft size={12} />
          Back to Login
        </button>
      </div>
      
      <p className="text-[9px] text-muted/50 font-medium max-w-xs text-center leading-relaxed">
        If you've lost access to your authenticator app, please contact your Protocol administrator for recovery options.
      </p>
    </motion.div>
  )
}
