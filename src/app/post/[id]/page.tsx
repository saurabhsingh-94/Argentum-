import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import UpvoteButton from '@/components/UpvoteButton'
import { Calendar, Hash, ShieldCheck, Tag, User } from 'lucide-react'
import Link from 'next/link'

export default async function PostDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: post, error } = await supabase
    .from('posts')
    .select('*, users(id, username, display_name, avatar_url, bio, currently_building, x_handle)')
    .eq('id', id)
    .single()

  if (error || !post) {
    notFound()
  }

  const { data: { user: currentUser } } = await supabase.auth.getUser()
  
  // Check if current user upvoted
  let isUpvoted = false
  if (currentUser) {
    const { data: upvote } = await supabase
      .from('upvotes')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', currentUser.id)
      .single()
    
    isUpvoted = !!upvote
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} />
                <span>{new Date(post.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Tag size={14} />
                <span className="text-accent font-bold uppercase tracking-wider text-[10px]">{post.category}</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 bg-[#0d0d0d]">
            <MarkdownRenderer source={post.content} />
          </div>

          {/* Comments Placeholder */}
          <div className="flex flex-col gap-6 mt-8">
            <h3 className="text-xl font-bold">Comments</h3>
            <div className="glass-card p-12 flex flex-col items-center justify-center text-center gap-2 border-dashed">
                <p className="text-sm text-gray-500">Discussion for this build is currently restricted.</p>
                <span className="text-[10px] text-gray-700 font-mono italic">Coming in Week 2</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Action Card */}
          <div className="glass-card p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Support Build</span>
              <UpvoteButton postId={post.id} initialUpvotes={post.upvotes || 0} isUpvoted={isUpvoted} />
            </div>
          </div>

          {/* Verification Panel */}
          <div className="glass-card p-6 border-accent/20 bg-accent/[0.02]">
            <div className="flex items-center gap-2 mb-6">
              <ShieldCheck className="text-accent" size={20} />
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-accent">Verification</h3>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5 font-mono">
                <span className="text-[10px] text-gray-500 uppercase flex items-center gap-1.5">
                    <Hash size={10} />
                    Content Hash (SHA-256)
                </span>
                <span className="text-xs text-white break-all p-2 bg-white/5 rounded-lg border border-white/5">
                  {post.content_hash || 'UNHASHED'}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">HCS Sequence</span>
                <span className="text-gray-700 italic">Coming Soon</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">NFT Token</span>
                <span className="text-gray-700 italic">Coming Soon</span>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Status</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  post.verification_status === 'verified' 
                    ? 'bg-accent/20 text-accent' 
                    : 'bg-white/5 text-gray-500'
                }`}>
                  {post.verification_status}
                </span>
              </div>
            </div>
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
                <span className="text-xs text-gray-500">@{post.users.username}</span>
              </div>
            </div>
            {post.users.bio && (
                <p className="text-xs text-gray-500 mt-4 leading-relaxed line-clamp-3">
                    {post.users.bio}
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
    </div>
  )
}
