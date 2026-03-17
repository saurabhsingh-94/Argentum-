"use client"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Flag, X, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'

const REPORT_REASONS = [
  { id: 'spam', label: '🚫 Spam' },
  { id: 'inappropriate', label: '⚠️ Inappropriate content' },
  { id: 'harassment', label: '😤 Harassment' },
  { id: 'misinformation', label: '❌ Misinformation' },
  { id: 'other', label: '📝 Other' },
]

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  postId: string
  currentUserId: string
}

export default function ReportModal({ isOpen, onClose, postId, currentUserId }: ReportModalProps) {
  const supabase = createClient()
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason) return
    setLoading(true)
    setError('')

    try {
      const { error: submitError } = await supabase.from('reports').insert({
        reporter_id: currentUserId,
        post_id: postId,
        reason,
        details,
        status: 'pending'
      })

      if (submitError) {
        if (submitError.code === '23505') {
          setError("You've already reported this post.")
        } else {
          throw submitError
        }
      } else {
        setSuccess(true)
        setTimeout(() => {
          onClose()
          setSuccess(false)
          setReason('')
          setDetails('')
        }, 2000)
      }
    } catch (err: any) {
      setError("Failed to submit report. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0d0d0d] border border-white/10 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-3xl">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
              <Flag size={20} />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tighter">Report Build</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">
          {success ? (
            <div className="py-12 flex flex-col items-center text-center gap-4 animate-scale-in">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                <CheckCircle2 size={32} />
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="text-xl font-bold">Report Submitted</h4>
                <p className="text-gray-500 text-sm">We'll review this shortly. Thank you for keeping Argentum safe.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Reason for reporting</label>
                <div className="grid grid-cols-1 gap-2">
                  {REPORT_REASONS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setReason(r.id)}
                      className={`
                        flex items-center gap-3 p-4 rounded-2xl border transition-all text-left
                        ${reason === r.id 
                          ? 'bg-white/10 border-white/20 text-white' 
                          : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/10'
                        }
                      `}
                    >
                      <span className="text-sm font-bold">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Additional Details (Optional)</label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Tell us more about why you're reporting this..."
                  className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm focus:outline-none focus:border-white/20 transition-all min-h-[100px] resize-none"
                />
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-xs font-bold uppercase tracking-widest">
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}

              <div className="flex gap-4 mt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!reason || loading}
                  className="flex-1 silver-metallic px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Submit Report'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
