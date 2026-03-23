"use client"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, Loader2, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default function ContactPage() {
  const supabase = createClient() as any
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return

    setLoading(true)
    setStatus('idle')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { error } = await supabase.from('issue_reports').insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        status: 'open',
      })

      if (error) throw error

      setStatus('success')
      setTitle('')
      setDescription('')
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong')
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
            <MessageSquare size={18} className="text-foreground/60" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Report an Issue</h1>
            <p className="text-xs text-foreground/40 uppercase tracking-widest font-bold">Help us improve Argentum</p>
          </div>
        </div>

        {status === 'success' ? (
          <div className="p-8 bg-green-500/5 border border-green-500/20 rounded-2xl flex flex-col items-center gap-4 text-center">
            <CheckCircle2 size={40} className="text-green-500" />
            <div>
              <p className="font-black text-lg">Report submitted</p>
              <p className="text-sm text-foreground/50 mt-1">We'll look into it. Thanks for helping make Argentum better.</p>
            </div>
            <Link href="/feed" className="mt-2 px-6 py-2 rounded-xl bg-card border border-border text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all">
              Back to Feed
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">Issue Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of the issue"
                required
                className="bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-foreground/40 transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened, steps to reproduce, expected vs actual behavior..."
                required
                rows={6}
                className="bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-foreground/40 transition-all resize-none"
              />
            </div>

            {status === 'error' && (
              <div className="flex items-center gap-2 text-red-500 text-xs bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3">
                <AlertCircle size={14} />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !title.trim() || !description.trim()}
              className="w-full py-4 rounded-xl bg-foreground text-background text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : 'Submit Report'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
