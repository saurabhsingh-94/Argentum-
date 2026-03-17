import { createClient } from '@/lib/supabase/server'
import FeedWithFilter from '@/components/FeedWithFilter'
import { CheckCircle2, Users, Zap, Activity, ArrowRight, Star, Trophy, ShieldCheck, Github } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default async function Home() {
  const supabase = await createClient()

  if (!supabase) return null

  // Parallel fetching of stats and featured content
  const [
    { count: postCount },
    { count: userCount },
    { count: verifiedCount },
    { data: eliteBuilders },
    { data: recentPosts }
  ] = await Promise.all([
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified'),
    supabase.from('users').select('*').order('streak_count', { ascending: false }).limit(6),
    supabase.from('posts').select('*, users(id, username, display_name, avatar_url, bio, currently_building, twitter_username, skills)').eq('status', 'published').order('created_at', { ascending: false }).limit(6)
  ])

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden pb-20">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 px-4 lg:px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
           <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-green-500/10 blur-[120px] rounded-full animate-pulse-slow" />
           <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full animate-pulse-slow delay-700" />
        </div>

        <div className="container mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-8 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Proof of Work Social Protocol
          </div>
          
          <h1 className="text-6xl md:text-8xl lg:text-[120px] font-black tracking-tighter leading-[0.9] mb-8">
            Build in Public. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-blue-500 to-purple-600">Prove it forever.</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-gray-500 text-lg md:text-xl leading-relaxed mb-12 font-medium">
            The social network for the world's most ambitious builders. 
            Log your daily progress, verify your shipping history on-chain, 
            and build a legacy that lasts.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
             <Link href="/new" className="px-10 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all shadow-2xl shadow-white/10 active:scale-95">
                Start Building Now
             </Link>
             <Link href="/explore" className="px-10 py-5 bg-white/5 border border-white/10 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all backdrop-blur-xl">
                Explore Network
             </Link>
          </div>
        </div>
      </section>

      {/* Builder Spotlight Marquee */}
      <section className="py-20 border-y border-white/5 bg-white/[0.01]">
         <div className="container mx-auto px-4 lg:px-6">
            <div className="flex items-center justify-between mb-12">
               <div className="flex flex-col gap-1">
                  <h2 className="text-xs font-black uppercase tracking-[0.4em] text-green-500">Elite Cadre</h2>
                  <h3 className="text-2xl font-bold">Builder Spotlight</h3>
               </div>
               <Link href="/explore" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">View All Builders</Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {eliteBuilders?.map((builder: any, i: number) => (
                 <div key={builder.id} className="bg-[#111] border border-white/5 rounded-2xl p-6 flex items-center gap-4 hover:border-white/20 transition-all group cursor-pointer">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-800 to-black border border-white/10 overflow-hidden shrink-0">
                       {builder.avatar_url && <img src={builder.avatar_url} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-sm font-bold text-white group-hover:text-green-400 transition-colors">{builder.display_name || builder.username}</span>
                       <span className="text-[10px] text-gray-500 font-mono">@{builder.username}</span>
                       <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-black uppercase text-orange-500 flex items-center gap-1">
                             <Zap size={8} /> {builder.streak_count} Day Streak
                          </span>
                       </div>
                    </div>
                    <div className="ml-auto text-white/5 group-hover:text-white/20 transition-colors">
                       <ArrowRight size={24} />
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* Stats Row */}
      <section className="py-32">
         <div className="container mx-auto px-4 lg:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
               <StatItem icon={<Trophy className="text-yellow-500" />} label="Verified Logs" value={verifiedCount || 0} color="from-yellow-500/20" />
               <StatItem icon={<Users className="text-blue-500" />} label="Total Builders" value={userCount || 0} color="from-blue-500/20" />
               <StatItem icon={<Activity className="text-green-500" />} label="Live Builds" value={postCount || 0} color="from-green-500/20" />
               <StatItem icon={<ShieldCheck className="text-purple-500" />} label="Avg Reputation" value={840} color="from-purple-500/20" />
            </div>
         </div>
      </section>

      {/* Featured Feed */}
      <section className="py-20 bg-[#080808] border-y border-white/5">
         <div className="container mx-auto px-4 lg:px-6">
            <header className="flex flex-col mb-12">
               <h2 className="text-xs font-black uppercase tracking-[0.4em] text-green-500 mb-2">The Signal</h2>
               <h3 className="text-4xl font-black tracking-tight">Recent Build Drops</h3>
            </header>

            <FeedWithFilter initialPosts={recentPosts || []} />
         </div>
      </section>

      {/* Final CTA */}
      <section className="py-40 relative">
         <div className="container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto p-12 lg:p-20 rounded-[3rem] bg-gradient-to-b from-white/[0.03] to-transparent border border-white/10 relative overflow-hidden group">
               <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity blur-[100px]" />
               
               <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 relative z-10">Ready to secure <br /> your build legacy?</h2>
               <p className="text-gray-500 text-lg mb-12 max-w-lg mx-auto relative z-10">
                  Join the builders shipping the future. Verified, eternal, and community-driven.
               </p>
               
               <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                  <Link href="/auth/login" className="px-10 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all">
                     Get Your Invite
                  </Link>
                  <Link href="https://github.com" className="flex items-center gap-3 px-10 py-5 bg-white/5 border border-white/10 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all">
                     <Github size={18} /> Import from GitHub
                  </Link>
               </div>
            </div>
         </div>
      </section>
    </div>
  )
}

function StatItem({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) {
  return (
    <div className={`p-8 rounded-[2rem] bg-gradient-to-br ${color} to-transparent border border-white/5 relative group hover:border-white/20 transition-all`}>
      <div className="bg-white/5 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-4xl font-black tracking-tighter mb-1">{value.toLocaleString()}</span>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{label}</span>
      </div>
    </div>
  )
}
