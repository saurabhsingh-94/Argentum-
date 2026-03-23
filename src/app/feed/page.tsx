// Build trigger: standardized routing and visibility updates
import { createClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'
import { redirect } from 'next/navigation'
import FeedWithFilter from '@/components/FeedWithFilter'
import SpeakHighlights from '@/components/SpeakHighlights'
import { Flame, TrendingUp, Users, Target } from 'lucide-react'

export const revalidate = 60

export default async function FeedPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  if (!supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
        <div className="text-center">
          <h1 className="text-2xl font-black mb-4">Configuration Required</h1>
          <p className="text-foreground/50 text-sm">Please ensure Supabase environment variables are configured in Vercel.</p>
        </div>
      </div>
    )
  }


  const getTrendingTags = unstable_cache(
    async () => {
      const supabaseInner = await createClient()
      const { data } = await supabaseInner
        .from('posts')
        .select('category')
        .eq('status', 'published')
        .not('category', 'is', null)
      return data
    },
    ['trending-tags'],
    { revalidate: 300 }
  )

  const [
    // @ts-ignore
    { data: posts, count },
    trendingData,
    // @ts-ignore
    { data: highlights },
    // @ts-ignore
    { data: topBuilders }
  ] = await Promise.all([
    supabase
      .from('posts')
      .select('*, users(id, username, display_name, avatar_url, bio, currently_building)', { count: 'exact' })
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(10),
    getTrendingTags(),
    supabase
      .from('posts')
      .select('*, users(id, username, display_name, avatar_url, bio, currently_building)')
      .eq('status', 'published')
      .eq('category', 'Speak')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('users')
      .select('id, username, display_name, avatar_url, streak_count')
      .gt('streak_count', 0)
      .order('streak_count', { ascending: false })
      .limit(3)
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="w-full px-4 lg:px-12 py-10">
        <div className="flex flex-col lg:flex-row gap-10 justify-between">
          {/* Main Feed */}
          <main className="flex-1 max-w-4xl">
            <header className="mb-10">
               <div className="flex items-center gap-2 mb-2 text-green-500">
                  <Flame size={16} />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em]">Live Network</span>
               </div>
               <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 glass:glass-text">
                  The Build Feed
               </h1>
               <p className="text-foreground/50 text-sm max-w-lg leading-relaxed">
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
          <aside className="w-full lg:w-80 flex flex-col gap-8 lg:sticky lg:top-24 lg:self-start">
            {/* Stats Overview */}
            <div className="bg-card glass-card border border-border rounded-2xl p-6 shadow-2xl">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Network Stats</h3>
                  <Target size={14} className="text-green-500" />
               </div>
               <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-end">
                     <span className="text-xs text-foreground/40">Total Build Logs</span>
                     <span className="text-2xl font-black">{count || 0}</span>
                  </div>
                  <div className="h-1 w-full bg-foreground/5 rounded-full overflow-hidden">
                     <div className="h-full bg-green-500 w-[65%]" />
                  </div>
               </div>
            </div>

            {/* Trending Tags */}
            <div className="bg-card glass-card border border-border rounded-2xl p-6 shadow-2xl">
               <div className="flex items-center gap-2 mb-6">
                  <TrendingUp size={16} className="text-blue-500" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Trending Tags</h3>
               </div>
               <div className="flex flex-col gap-4">
                  {trendingTags.length > 0 ? trendingTags.map(({ tag, count }) => (
                    <div key={tag} className="flex items-center justify-between group cursor-pointer">
                       <span className="text-sm text-foreground/40 group-hover:text-foreground transition-colors">#{tag}</span>
                       <span className="text-[10px] font-mono text-foreground/20">{count} posts</span>
                    </div>
                  )) : (
                    <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest text-center py-4">No trending tags yet</p>
                  )}
               </div>
            </div>

          {/* Top Builders */}
            <div className="bg-card glass-card border border-border rounded-2xl p-6 shadow-2xl">
               <div className="flex items-center gap-2 mb-6">
                  <Users size={16} className="text-purple-500" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Top Builders</h3>
               </div>
               <div className="flex flex-col gap-6">
                  {topBuilders && topBuilders.length > 0 ? topBuilders.map((builder: any, i: number) => (
                    <div key={builder.id} className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-foreground/5 border border-border overflow-hidden flex items-center justify-center text-xs font-black">
                         {builder.avatar_url ? <img src={builder.avatar_url} alt="" className="w-full h-full object-cover" /> : (builder.username?.[0] || '?').toUpperCase()}
                       </div>
                       <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground">{builder.display_name || builder.username}</span>
                          <span className="text-[10px] text-foreground/40">🔥 {builder.streak_count} day streak</span>
                       </div>
                    </div>
                  )) : [1,2,3].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                       <div className="w-8 h-8 rounded-full bg-foreground/5 border border-border" />
                       <div className="flex flex-col gap-1">
                          <div className="h-2 w-20 bg-foreground/5 rounded" />
                          <div className="h-2 w-14 bg-foreground/5 rounded" />
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
