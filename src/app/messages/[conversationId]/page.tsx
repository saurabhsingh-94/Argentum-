"use client"

import { useEffect, useState, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Send, 
  ArrowLeft, 
  Loader2, 
  Lock, 
  ShieldCheck, 
  User, 
  AtSign, 
  CheckCircle2, 
  MoreVertical, 
  Volume2, 
  VolumeX, 
  UserCircle, 
  Ban, 
  X, 
  Copy, 
  Smile, 
  AlertTriangle, 
  Trash2,
  Pencil
} from 'lucide-react'
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
  
  // Rich Features State
  const [showMenu, setShowMenu] = useState(false)
  const [showProfilePanel, setShowProfilePanel] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [nickname, setNickname] = useState('')
  const [isEditingNickname, setIsEditingNickname] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, msgId: string, isOwn: boolean, content: string } | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

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
          participant_1_profile:users!conversations_participant_1_fkey(*),
          participant_2_profile:users!conversations_participant_2_fkey(*)
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

      const other = conv.participant_1 === user.id ? conv.participant_2_profile : conv.participant_1_profile
      setConversation(conv)
      setOtherParticipant(other)

      // Load LocalStorage Features
      const muted = localStorage.getItem(`muted_${conversationId}`) === 'true'
      setIsMuted(muted)
      const savedNickname = localStorage.getItem(`nickname_${other.id}`) || ''
      setNickname(savedNickname)

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
                setTimeout(scrollToBottom, 50)
                return
            }

            const senderProfile = conv.participant_1 === payload.new.sender_id 
              ? conv.participant_1_profile 
              : conv.participant_2_profile

            const decrypted = decryptMessage(payload.new.content, senderProfile.public_key, secretKey)
            setMessages(prev => [...prev, { ...payload.new, decryptedContent: decrypted || "Encrypted message" }])
            setTimeout(scrollToBottom, 50)
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    setup()

    // Global click listener to close menus
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
      setContextMenu(null)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
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

      // Trigger notification for recipient (using display_name or nickname if available)
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
    } finally {
      setSending(false)
    }
  }

  const toggleMute = () => {
    const newState = !isMuted
    setIsMuted(newState)
    localStorage.setItem(`muted_${conversationId}`, String(newState))
    setShowMenu(false)
  }

  const saveNickname = () => {
    localStorage.setItem(`nickname_${otherParticipant.id}`, nickname)
    setIsEditingNickname(false)
  }

  const handleContextMenu = (e: React.MouseEvent, msg: any, isOwn: boolean) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      msgId: msg.id,
      isOwn,
      content: msg.decryptedContent
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setContextMenu(null)
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
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden relative">
      <div className="noise-bg absolute inset-0 pointer-events-none opacity-[0.03]" />
      <div className="mesh-gradient-bg opacity-5 absolute inset-0 pointer-events-none" />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-[60]"
        >
          <div className="flex items-center gap-4">
            <Link href="/messages" className="md:hidden p-2 hover:bg-white/5 rounded-xl transition-all">
              <ArrowLeft size={18} className="text-gray-400" />
            </Link>
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => setShowProfilePanel(true)}
            >
              <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-[#111] flex items-center justify-center shadow-glow-sm group-hover:border-silver/40 transition-all">
                {otherParticipant.avatar_url ? (
                  <img src={otherParticipant.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-black text-silver">
                    {otherParticipant.display_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || otherParticipant.username?.[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <h2 className="font-bold text-sm tracking-tight text-white flex items-center gap-2 group-hover:text-silver transition-colors">
                  {nickname || otherParticipant.display_name || otherParticipant.username}
                  {isMuted && <VolumeX size={12} className="text-gray-500" />}
                  <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 flex items-center gap-1">
                    <Lock size={8} className="text-green-500" />
                    <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Encrypted</span>
                  </span>
                </h2>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">@{otherParticipant.username}</span>
              </div>
            </div>
          </div>

          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-white/5 rounded-xl transition-all text-gray-400 hover:text-white"
            >
              <MoreVertical size={20} />
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl p-2 z-[70] overflow-hidden"
                >
                  <button 
                    onClick={toggleMute}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-300 hover:bg-white/5 rounded-xl transition-all"
                  >
                    {isMuted ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    {isMuted ? 'Unmute' : 'Mute Notifications'}
                  </button>
                  <button 
                    onClick={() => { setShowProfilePanel(true); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-300 hover:bg-white/5 rounded-xl transition-all"
                  >
                    <UserCircle size={16} />
                    View Profile
                  </button>
                  <div className="h-px bg-white/5 my-1" />
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-500/80 hover:bg-red-500/10 rounded-xl transition-all">
                    <Ban size={16} />
                    Block User
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

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
            Object.entries(groupedMessages).map(([dateKey, msgs]: [string, any], groupIdx) => (
              <div key={dateKey} className="space-y-6">
                <div className="flex justify-center">
                  <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] bg-white/5 px-4 py-1.5 rounded-full">
                    {dateKey}
                  </span>
                </div>
                {msgs.map((msg: any, msgIdx: number) => {
                  const isOwn = msg.sender_id === currentUser.id
                  return (
                    <motion.div 
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: msgIdx * 0.05 }}
                      className={`flex items-end gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {!isOwn && (
                         <div className="w-8 h-8 rounded-full border border-white/5 overflow-hidden bg-[#111] flex-shrink-0 mb-5">
                            {otherParticipant.avatar_url ? (
                              <img src={otherParticipant.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-white/40">
                                {otherParticipant.username[0].toUpperCase()}
                              </div>
                            )}
                         </div>
                      )}
                      <div 
                        className={`max-w-[80%] md:max-w-[60%] group relative`}
                        onContextMenu={(e) => handleContextMenu(e, msg, isOwn)}
                      >
                        <div className={`px-5 py-3.5 text-sm leading-relaxed ${
                          isOwn 
                            ? 'silver-metallic text-[#050505] rounded-2xl rounded-br-none shadow-[0_4px_25px_rgba(255,255,255,0.05)]' 
                            : 'bg-[#1a1a1a] text-white rounded-2xl rounded-bl-none border border-white/5 shadow-xl'
                        }`}>
                          {msg.decryptedContent}
                        </div>
                        <div className={`mt-1.5 px-1 flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-1.5">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isOwn && <CheckCircle2 size={8} className="text-green-500/50" />}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="p-6 bg-[#111] border-t border-white/5 relative z-50"
        >
          <div className="max-w-4xl mx-auto flex flex-col gap-3">
            <form onSubmit={handleSendMessage} className="relative flex items-center gap-4">
              <div className={`absolute left-4 ${newMessage ? 'text-green-500' : 'text-gray-600'} transition-colors`}>
                 <Lock size={16} />
              </div>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={otherParticipant.public_key ? "Send a message..." : "Builder setup encryption required..."}
                disabled={!otherParticipant.public_key || encryptionStatus === 'missing_private_key'}
                className="flex-1 bg-[#1a1a1a] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-silver/40 focus:glow-silver transition-all placeholder:text-gray-600"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending || !otherParticipant.public_key || encryptionStatus === 'missing_private_key'}
                className="w-14 h-14 rounded-full bg-[#22c55e] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale shadow-[0_4px_20px_rgba(34,197,94,0.2)]"
              >
                {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </form>
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck size={10} className="text-gray-700" />
              <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em] text-center">
                End-to-end encrypted · Only you and {nickname || otherParticipant.display_name || otherParticipant.username} can read these messages
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Mini Profile Sidebar */}
      <AnimatePresence>
        {showProfilePanel && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfilePanel(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[360px] bg-[#0d0d0d] border-l border-white/10 shadow-2xl z-[110] flex flex-col p-8 overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-end mb-6">
                <button 
                  onClick={() => setShowProfilePanel(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-all text-gray-500 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex flex-col items-center gap-6 text-center">
                <div className="w-24 h-24 rounded-[2rem] border-2 border-white/10 bg-[#0a0a0a] flex items-center justify-center text-3xl font-black text-silver shadow-glow relative">
                  {otherParticipant.avatar_url ? (
                    <img src={otherParticipant.avatar_url} alt="avatar" className="w-full h-full object-cover rounded-[2rem]" />
                  ) : (
                    otherParticipant.username[0].toUpperCase()
                  )}
                </div>

                <div className="flex flex-col gap-1 w-full relative">
                  {isEditingNickname ? (
                    <div className="flex gap-2 relative z-10 w-full">
                      <input 
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="Set nickname..."
                        autoFocus
                        onBlur={saveNickname}
                        onKeyDown={(e) => e.key === 'Enter' && saveNickname()}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-center focus:outline-none focus:border-silver/40"
                      />
                    </div>
                  ) : (
                     <div className="flex items-center justify-center gap-2 group cursor-pointer" onClick={() => setIsEditingNickname(true)}>
                       <h3 className="text-xl font-black text-white">{nickname || otherParticipant.display_name || otherParticipant.username}</h3>
                       <Pencil size={12} className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                     </div>
                  )}
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">@{otherParticipant.username}</span>
                </div>

                {otherParticipant.bio && (
                  <p className="text-sm text-gray-400 leading-relaxed max-w-[280px]">
                    {otherParticipant.bio}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 w-full mt-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Streak</span>
                    <span className="text-sm font-black text-orange-500">{otherParticipant.streak_count || 0}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Builder</span>
                    <span className="text-[10px] font-black text-silver uppercase truncate w-full">{otherParticipant.currently_building || 'Chilling'}</span>
                  </div>
                </div>

                {otherParticipant.skills && otherParticipant.skills.length > 0 && (
                   <div className="w-full text-left">
                     <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3 block">Skills</span>
                     <div className="flex flex-wrap gap-2">
                       {otherParticipant.skills.map((skill: string) => (
                         <span key={skill} className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-silver">
                           {skill}
                         </span>
                       ))}
                     </div>
                   </div>
                )}

                <Link 
                  href={`/profile/${otherParticipant.username}`}
                  className="w-full mt-8 px-10 py-4 rounded-xl silver-metallic text-[#050505] text-[10px] font-black uppercase tracking-[0.2em] shadow-glow text-center hover:brightness-110 active:scale-95 transition-all"
                >
                  View Full Profile
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{ left: contextMenu.x, top: contextMenu.y }}
            className="fixed z-[100] w-40 bg-[#0d0d0d]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2 flex flex-col gap-1 overflow-hidden"
          >
            <button 
              onClick={() => copyToClipboard(contextMenu.content)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-300 hover:bg-white/10 rounded-xl transition-all"
            >
              <Copy size={14} />
              Copy
            </button>
            {contextMenu.isOwn ? (
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-red-500/80 hover:bg-red-500/10 rounded-xl transition-all">
                <Trash2 size={14} />
                Delete
              </button>
            ) : (
              <>
                 <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-green-500/80 hover:bg-green-500/10 rounded-xl transition-all">
                  <Smile size={14} />
                  React
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-orange-500/80 hover:bg-orange-500/10 rounded-xl transition-all">
                  <AlertTriangle size={14} />
                  Report
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .noise-bg {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3%3Cfilter id='noiseFilter'%3%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3%3C/filter%3%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3%3C/svg%3");
        }
        .glow-silver:focus {
          box-shadow: 0 0 15px rgba(192, 192, 192, 0.05);
        }
        @keyframes shrink-width {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-shrink-width {
          animation: shrink-width 4s linear forwards;
        }
      `}</style>
    </div>
  )
}
