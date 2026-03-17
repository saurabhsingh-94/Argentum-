// Build trigger: standardized routing and visibility updates
import { createClient } from '@/lib/supabase/server'
import FeedWithFilter from '@/components/FeedWithFilter'
import SpeakHighlights from '@/components/SpeakHighlights'
import { Flame, TrendingUp, Users, Target } from 'lucide-react'

export default async function FeedPage() {
  const supabase = await createClient()

  const [
    { data: posts, count },
    { data: trendingData },
    { data: highlights }
  ] = await Promise.all([
    supabase
      .from('posts')
      .select('*, users(id, username, display_name, avatar_url, bio, currently_building)', { count: 'exact' })
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('posts')
      .select('category')
      .eq('status', 'published')
      .is('category', 'not.null'),
    supabase
      .from('posts')
      .select('*, users(id, username, display_name, avatar_url, bio, currently_building)')
      .eq('status', 'published')
      .eq('category', 'Speak')
      .order('created_at', { ascending: false })
      .limit(5)
  ])
  
  const tagCounts: Record<string, number> = {}
  trendingData?.forEach((p: { category: string | null }) => {
    if (p.category) {
      tagCounts[p.category] = (tagCounts[p.category] || 0) + 1
    }
  })

  const trendingTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="container mx-auto px-4 lg:px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Main Feed */}
          <main className="flex-1 max-w-4xl">
            <header className="mb-10">
               <div className="flex items-center gap-2 mb-2 text-green-500">
                  <Flame size={16} />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em]">Live Network</span>
               </div>
               <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
                  The Build Feed
               </h1>
               <p className="text-gray-500 text-sm max-w-lg leading-relaxed">
                  Real-time intelligence from the world's most innovative builders. 
                  Collective progress, logged on-chain.
               </p>
            </header>

            {/* Speak Highlights / Broadcasts */}
            <SpeakHighlights highlights={highlights as any || []} />

            <section>
              <FeedWithFilter initialPosts={posts || []} />
            </section>
          </main>

          {/* Sidebar */}
          <aside className="w-full lg:w-80 flex flex-col gap-8">
            {/* Stats Overview */}
            <div className="bg-[#111] border border-white/5 rounded-2xl p-6 shadow-2xl">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Network Stats</h3>
                  <Target size={14} className="text-green-500" />
               </div>
               <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-end">
                     <span className="text-xs text-gray-400">Total Build Logs</span>
                     <span className="text-2xl font-black">{count || 0}</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-green-500 w-[65%]" />
                  </div>
               </div>
            </div>

            {/* Trending Tags */}
            <div className="bg-[#111] border border-white/5 rounded-2xl p-6 shadow-2xl">
               <div className="flex items-center gap-2 mb-6 text-white">
                  <TrendingUp size={16} className="text-blue-500" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Trending Tags</h3>
               </div>
               <div className="flex flex-col gap-4">
                  {trendingTags.length > 0 ? trendingTags.map(({ tag, count }) => (
                    <div key={tag} className="flex items-center justify-between group cursor-pointer">
                       <span className="text-sm text-gray-400 group-hover:text-white transition-colors">#{tag}</span>
                       <span className="text-[10px] font-mono text-gray-600">{count} posts</span>
                    </div>
                  )) : (
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center py-4">No trending tags yet</p>
                  )}
               </div>
            </div>

            {/* Top Builders */}
            <div className="bg-[#111] border border-white/5 rounded-2xl p-6 shadow-2xl">
               <div className="flex items-center gap-2 mb-6 text-white">
                  <Users size={16} className="text-purple-500" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Top Builders</h3>
               </div>
               <div className="flex flex-col gap-6">
                  {[1, 2, 3].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10" />
                       <div className="flex flex-col">
                          <span className="text-xs font-bold text-white">Builder #{i+1}</span>
                          <span className="text-[10px] text-gray-500">@{['satoshi', 'vitalik', 'builder'][i]}</span>
                       </div>
                       <button className="ml-auto px-3 py-1 rounded-full border border-white/10 text-[8px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">Follow</button>
                    </div>
                  ))}
               </div>
               <button className="w-full mt-8 py-2 text-[8px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-white transition-all border-t border-white/5">
                  View Leaderboard
               </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
