"use client"

import { useEffect, useState, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Send, ArrowLeft, Loader2, Lock, ShieldCheck, User, AtSign, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { decryptMessage, encryptMessage, getStoredSecretKey, initializeEncryption } from '@/lib/crypto'
import { motion, AnimatePresence } from 'framer-motion'

export default function ChatPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = use(params)
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<any[]>([])
  const [conversation, setConversation] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [otherParticipant, setOtherParticipant] = useState<any>(null)
  const [encryptionStatus, setEncryptionStatus] = useState<string>('loading')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setCurrentUser(user)

      const status = await initializeEncryption()
      setEncryptionStatus(status?.status || 'ready')

      // Fetch conversation details
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .select(`
          *,
          participant_1_profile:users!conversations_participant_1_fkey(id, username, display_name, avatar_url, public_key),
          participant_2_profile:users!conversations_participant_2_fkey(id, username, display_name, avatar_url, public_key)
        `)
        .eq('id', conversationId)
        .single()

      if (convError || !conv) {
        console.error('Conversation not found')
        router.push('/messages')
        return
      }

      if (conv.participant_1 !== user.id && conv.participant_2 !== user.id) {
        console.error('Unauthorized access')
        router.push('/messages')
        return
      }

      setConversation(conv)
      setOtherParticipant(conv.participant_1 === user.id ? conv.participant_2_profile : conv.participant_1_profile)

      // Initial messages fetch
      await fetchMessages(conv, user.id)
      setLoading(false)
      setTimeout(scrollToBottom, 100)

      // Subscribe to real-time updates
      const channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          async (payload: any) => {
            const secretKey = getStoredSecretKey()
            if (!secretKey) {
                setMessages(prev => [...prev, { ...payload.new, decryptedContent: "Encrypted message" }])
                setTimeout(scrollToBottom, 100)
                return
            }

            const senderProfile = conv.participant_1 === payload.new.sender_id 
              ? conv.participant_1_profile 
              : conv.participant_2_profile

            const decrypted = decryptMessage(payload.new.content, senderProfile.public_key, secretKey)
            setMessages(prev => [...prev, { ...payload.new, decryptedContent: decrypted || "Encrypted message" }])
            setTimeout(scrollToBottom, 100)
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    setup()
  }, [conversationId])

  const fetchMessages = async (conv: any, userId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
      return
    }

    const secretKey = getStoredSecretKey()
    const processedMessages = data.map((msg: any) => {
      if (!secretKey) return { ...msg, decryptedContent: "Encrypted message" }

      const senderProfile = conv.participant_1 === msg.sender_id 
        ? conv.participant_1_profile 
        : conv.participant_2_profile

      const decrypted = decryptMessage(msg.content, senderProfile.public_key, secretKey)
      return {
        ...msg,
        decryptedContent: decrypted || "Encrypted message"
      }
    })

    setMessages(processedMessages)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !otherParticipant || !conversation) return

    if (!otherParticipant.public_key) {
      alert("This user hasn't set up encryption yet. They need to log in to generate their keys.")
      return
    }

    const secretKey = getStoredSecretKey()
    if (!secretKey) {
      alert("Encryption keys are not set up on this device. You cannot send messages.")
      return
    }

    setSending(true)

    try {
      const encryptedContent = encryptMessage(
        newMessage,
        otherParticipant.public_key,
        secretKey
      )

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUser.id,
          content: encryptedContent
        })

      if (error) throw error

      // Trigger notification for recipient
      await supabase.from('notifications').insert({
        user_id: otherParticipant.id,
        from_user_id: currentUser.id,
        type: 'message',
        content: `${currentUser.display_name || currentUser.user_metadata?.username || 'Someone'} sent you a message`,
        link: `/messages/${conversationId}`
      })

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      alert("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const formatMessageDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    
    return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined })
  }

  if (loading) {
    return (
      <div className="h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-silver animate-spin" />
      </div>
    )
  }

  const groupedMessages = messages.reduce((groups: any, message) => {
    const dateKey = formatMessageDate(message.created_at)
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(message)
    return groups
  }, {})

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-screen bg-[#050505] text-white overflow-hidden relative"
    >
      <div className="mesh-gradient-bg opacity-5 absolute inset-0 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/messages" className="md:hidden p-2 hover:bg-white/5 rounded-xl transition-all">
            <ArrowLeft size={18} className="text-gray-400" />
          </Link>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-[#111] flex items-center justify-center shadow-glow-sm">
              {otherParticipant.avatar_url ? (
                <img src={otherParticipant.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-black text-silver">
                  {otherParticipant.display_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || otherParticipant.username?.[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <h2 className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
                {otherParticipant.display_name || otherParticipant.username}
                <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 flex items-center gap-1">
                  <Lock size={8} className="text-green-500" />
                  <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Encrypted</span>
                </span>
              </h2>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">@{otherParticipant.username}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
            <div className="w-16 h-16 rounded-[2rem] border border-white/10 flex items-center justify-center text-gray-600">
              <Lock size={24} />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Send your first encrypted message</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([dateKey, msgs]: [string, any]) => (
            <div key={dateKey} className="space-y-6">
              <div className="flex justify-center">
                <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] bg-white/5 px-4 py-1.5 rounded-full">
                  {dateKey}
                </span>
              </div>
              {msgs.map((msg: any) => {
                const isOwn = msg.sender_id === currentUser.id
                return (
                  <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[80%] md:max-w-[60%] group`}>
                      <div className={`px-5 py-3.5 text-sm leading-relaxed ${
                        isOwn 
                          ? 'bg-[#22c55e] text-black rounded-2xl rounded-br-sm font-medium shadow-[0_4px_20px_rgba(34,197,94,0.15)]' 
                          : 'bg-[#1a1a1a] text-white rounded-2xl rounded-bl-sm border border-white/5 shadow-xl'
                      }`}>
                        {msg.decryptedContent === "Encrypted message" && !isOwn && (
                           <div className="flex items-center gap-2 text-orange-500/70 mb-1">
                              <Lock size={12} />
                              <span className="text-[10px] font-bold uppercase tracking-widest">Encrypted</span>
                           </div>
                        )}
                        {msg.decryptedContent}
                      </div>
                      <div className={`mt-1.5 px-1 flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-1.5">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isOwn && <CheckCircle2 size={8} className="text-green-500/50" />}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 bg-[#0a0a0a] border-t border-white/5">
        <div className="max-w-4xl mx-auto flex flex-col gap-3">
          <form onSubmit={handleSendMessage} className="relative flex items-center gap-4">
            <div className="absolute left-4 text-gray-600">
               <Lock size={16} />
            </div>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={otherParticipant.public_key ? "Send a message..." : "Waiting for builder to set up encryption..."}
              disabled={!otherParticipant.public_key || encryptionStatus === 'missing_private_key'}
              className="flex-1 bg-[#111] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-silver/30 transition-all placeholder:text-gray-600 shadow-inner"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending || !otherParticipant.public_key || encryptionStatus === 'missing_private_key'}
              className="w-14 h-14 rounded-2xl bg-[#22c55e] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale shadow-[0_4px_20px_rgba(34,197,94,0.2)]"
            >
              {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </form>
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck size={10} className="text-gray-600" />
            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em]">
              Messages are end-to-end encrypted
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
