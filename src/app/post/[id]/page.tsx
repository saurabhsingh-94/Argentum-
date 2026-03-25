"use client"

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import ReactionButton from '@/components/ReactionButton'
import CommentsSection from '@/components/CommentsSection'
import ReportModal from '@/components/ReportModal'
import { Calendar, ShieldCheck, Tag, Flag, ArrowLeft, Zap, Activity, ClipboardCheck, AlertCircle, Check } from 'lucide-react'
import { hashContent } from '@/lib/utils/hash'
import Link from 'next/link'
import { useState, useEffect, use } from 'react'
import VerificationBadge from '@/components/VerificationBadge'
import CollabApplyButton from '@/components/CollabApplyButton'
import CollabRequestsPanel from '@/components/CollabRequestsPanel'

export default function PostDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient() as any
  const [post, setPost] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const topicId = process.env.NEXT_PUBLIC_HEDERA_TOPIC_ID

  const handleVerifyOnChain = async () => {
    if (!post) return
    setVerifying(true)
    try {
      // Generate hash only when applying for verification
      const hash = await hashContent(post.content)

      const res = await fetch('/api/blockchain/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, contentHash: hash }), // Pass hash to API
      })
      const data = await res.json()
      if (data.status === 'verified' || data.status === 'already_verified') {
        // Update post with hash and status
        await supabase
          .from('posts')
          .update({ 
            content_hash: hash,
            verification_status: 'verified',
            verified_at: new Date().toISOString()
          })
          .eq('id', post.id)

        setPost((prev: any) => ({
          ...prev,
          content_hash: hash,
          verification_status: 'verified',
          hcs_sequence_num: data.hcs_sequence_num ?? prev.hcs_sequence_num,
          nft_token_id: data.nft_token_id ?? prev.nft_token_id,
        }))
      } else if (data.status === 'unverified') {
        setPost((prev: any) => ({ ...prev, verification_status: 'unverified' }))
      }
    } catch (err) {
      console.error('Verify on chain failed:', err)
    } finally {
      setVerifying(false)
    }
  }

  const canVerify =
    currentUser &&
    post &&
    currentUser.id === post.user_id &&
    post.status === 'published' &&
    post.verification_status === 'unverified'
  
  useEffect(() => {
    const fetchData = async () => {
      const [{ data: postData }, { data: { user } }] = await Promise.all([
        supabase
          .from('posts')
          .select('*, users!posts_user_id_fkey(id, username, display_name, avatar_url, bio, currently_building, created_at)')
          .eq('id', id)
          .single(),
        supabase.auth.getUser()
      ])

      if (!postData) {
        router.replace('/feed')
        return
      }
      
      if (postData) {
        setPost(postData)
        // Increment view count (fire and forget)
        supabase.rpc('increment_post_views', { post_id_input: id }).catch(() => {})
      }
      setCurrentUser(user)
      setLoading(false)
    }

    fetchData()
  }, [id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
    </div>
  )

  if (!post) return null

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
       <div className="mb-8">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest"
        >
          <ArrowLeft size={14} />
          Back to Feed
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1.5 font-mono">
                <Calendar size={14} />
                <span>{new Date(post.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <Activity size={14} />
                <span>{post.views || 0} views</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Tag size={14} />
                <span className="text-accent font-bold uppercase tracking-wider text-[10px]">{post.category}</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 bg-[#0d0d0d] relative group">
             {!currentUser || currentUser.id !== post.user_id ? (
                <button 
                  onClick={() => setIsReportModalOpen(true)}
                  className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 border border-white/5 text-gray-600 hover:text-red-500 hover:border-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                  title="Report Post"
                >
                  <Flag size={16} />
                </button>
             ) : null}
            <MarkdownRenderer source={post.content} />
          </div>

          {/* Comments Section */}
          <CommentsSection 
            postId={post.id} 
            postOwnerId={post.user_id} 
            currentUserId={currentUser?.id} 
          />
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Action Card */}
          <div className="glass-card p-8 flex flex-col gap-6 bg-gradient-to-br from-white/[0.03] to-transparent border-white/10">
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Support this Build</span>
              <ReactionButton 
                postId={post.id} 
                currentUserId={currentUser?.id} 
              />
            </div>
            {post.is_collab && (
              <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Collaboration</span>
                <CollabApplyButton
                  postId={post.id}
                  isCollab={post.is_collab}
                  postAuthorId={post.user_id}
                  currentUserId={currentUser?.id ?? null}
                />
              </div>
            )}
          </div>

          {/* Collab Requests Panel (visible to post author only) */}
          {post.is_collab && (
            <CollabRequestsPanel
              postId={post.id}
              currentUserId={currentUser?.id ?? null}
              postAuthorId={post.user_id}
            />
          )}

          {/* Verification Panel */}
          <div className="glass-card p-6 border-accent/20 bg-accent/[0.02]">
            <div className="flex items-center gap-2 mb-6">
              <ShieldCheck className="text-accent" size={20} />
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-accent">Verification</h3>
            </div>

            <VerificationBadge
              verificationStatus={post.verification_status}
              hcsSequenceNum={post.hcs_sequence_num}
              nftTokenId={post.nft_token_id}
              contentHash={post.content_hash}
              verifiedAt={post.verified_at}
              topicId={topicId}
            />

            {canVerify && (
              <div className="mt-6 pt-4 border-t border-white/5">
                <button
                  onClick={handleVerifyOnChain}
                  disabled={verifying}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-wider hover:bg-accent/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifying ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-accent" />
                      Anchoring…
                    </>
                  ) : (
                    <>
                      <Zap size={14} />
                      Verify on Chain
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Author Card */}
          <div className="glass-card p-6">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 block">Builder</span>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border border-silver/20 bg-[#111] overflow-hidden flex items-center justify-center font-bold text-white">
                {post.users.avatar_url ? (
                  <img src={post.users.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  post.users.username[0].toUpperCase()
                )}
              </div>
              <div className="flex flex-col">
                <Link href={`/profile/${post.users.username}`} className="font-bold text-white hover:text-accent transition-colors">
                  {post.users.display_name || post.users.username}
                </Link>
                <span className="text-xs text-gray-500 font-mono">@{post.users.username}</span>
              </div>
            </div>
            {post.users.bio && (
                <p className="text-xs text-gray-400 mt-4 leading-relaxed line-clamp-3 italic">
                    "{post.users.bio}"
                </p>
            )}
            {post.users.currently_building && (
                <div className="mt-4 pt-4 border-t border-white/5">
                    <span className="text-[10px] font-bold text-gray-600 uppercase block mb-1">Building</span>
                    <span className="text-xs text-accent italic">"{post.users.currently_building}"</span>
                </div>
            )}
          </div>
        </div>
      </div>

      <ReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)}
        postId={post.id}
        currentUserId={currentUser?.id}
      />

      {/* Manual Hash Verifier */}
      {post.verification_status === 'verified' && (
        <div className="mt-20 border-t border-border pt-20">
            <ManualHashVerifier storedHash={post.content_hash} />
        </div>
      )}
    </div>
  )
}

function ManualHashVerifier({ storedHash }: { storedHash: string }) {
  const [inputText, setInputText] = useState('')
  const [result, setResult] = useState<'idle' | 'matching' | 'mismatch'>('idle')
  const [isVerifying, setIsVerifying] = useState(false)

  const handleVerify = async () => {
    setIsVerifying(true)
    const hash = await hashContent(inputText)
    setResult(hash === storedHash ? 'matching' : 'mismatch')
    setIsVerifying(false)
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col gap-2">
            <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                <ClipboardCheck size={20} className="text-accent" />
                Manual Integrity Check
            </h3>
            <p className="text-xs text-foreground/40 leading-relaxed font-medium">
                Verify the integrity of this post by pasting the raw content below. Our algorithm will recalculate the SHA-256 hash and compare it with the immutable record on the network.
            </p>
        </div>

        <div className="glass-card p-8 flex flex-col gap-6">
            <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste the raw markdown content here to verify..."
                className="w-full bg-background border border-border rounded-2xl p-6 text-sm focus:outline-none focus:border-accent/40 transition-all min-h-[200px] font-mono resize-none"
            />
            
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleVerify}
                        disabled={!inputText.trim() || isVerifying}
                        className="px-8 py-3 silver-metallic rounded-xl text-[10px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all disabled:opacity-30"
                    >
                        {isVerifying ? 'Recalculating...' : 'Verify Content Integrity'}
                    </button>
                    {result !== 'idle' && (
                        <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-left-2 ${result === 'matching' ? 'text-green-500' : 'text-red-500'}`}>
                            {result === 'matching' ? (
                                <><Check size={14} /> Hash Confirmed: Match Found</>
                            ) : (
                                <><AlertCircle size={14} /> Integrity Warning: No Match</>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className="text-[8px] font-black text-foreground/20 uppercase tracking-widest">Post Anchor Hash</span>
                    <span className="text-[10px] font-mono text-foreground/60 break-all max-w-[200px]">{storedHash}</span>
                </div>
            </div>
        </div>
    </div>
  )
}
