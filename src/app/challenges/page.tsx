import Link from 'next/link'
import { Target, Zap, Code2, Globe, Cpu, Gamepad2, Smartphone } from 'lucide-react'

const challenges = [
  {
    id: '1',
    title: 'Ship in 7 Days',
    description: 'Build and deploy a working product from scratch in 7 days. Document your progress daily.',
    difficulty: 'Beginner' as const,
    category: 'General',
    icon: Zap,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    tags: ['shipping', 'streak', 'build-in-public'],
  },
  {
    id: '2',
    title: 'Open Source Contribution',
    description: 'Make a meaningful contribution to an open source project and write a build log about what you learned.',
    difficulty: 'Intermediate' as const,
    category: 'DevTools',
    icon: Code2,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    tags: ['open-source', 'devtools', 'community'],
  },
  {
    id: '3',
    title: 'Web3 dApp in 48h',
    description: 'Build a decentralized application with a smart contract and frontend in 48 hours.',
    difficulty: 'Advanced' as const,
    category: 'Web3',
    icon: Globe,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    tags: ['web3', 'solidity', 'dapp'],
  },
  {
    id: '4',
    title: 'AI-Powered Tool',
    description: 'Integrate an LLM or ML model into a useful developer tool. Ship it and share the build log.',
    difficulty: 'Intermediate' as const,
    category: 'AI',
    icon: Cpu,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    tags: ['ai', 'llm', 'devtools'],
  },
  {
    id: '5',
    title: 'Mobile App MVP',
    description: 'Build a mobile app MVP using React Native or Flutter. Get at least one real user.',
    difficulty: 'Intermediate' as const,
    category: 'Mobile',
    icon: Smartphone,
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
    tags: ['mobile', 'react-native', 'mvp'],
  },
  {
    id: '6',
    title: 'Game Jam',
    description: 'Build a playable game in 72 hours. Any engine, any genre. Fun is the only requirement.',
    difficulty: 'Beginner' as const,
    category: 'Game',
    icon: Gamepad2,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    tags: ['game', 'jam', 'creative'],
  },
]

const difficultyColor = {
  Beginner: 'text-green-500 bg-green-500/10 border-green-500/20',
  Intermediate: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  Advanced: 'text-red-500 bg-red-500/10 border-red-500/20',
}

export default function ChallengesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <header className="mb-12">
          <div className="flex items-center gap-2 mb-3 text-foreground/40">
            <Target size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Build Challenges</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">Level Up Your Stack</h1>
          <p className="text-foreground/50 text-sm max-w-lg leading-relaxed">
            Structured challenges to push your skills. Pick one, build it, log it on Argentum.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {challenges.map((c) => {
            const Icon = c.icon
            return (
              <div key={c.id} className={`p-6 rounded-2xl bg-card border ${c.border} flex flex-col gap-4 hover:brightness-110 transition-all group`}>
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center`}>
                    <Icon size={18} className={c.color} />
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${difficultyColor[c.difficulty]}`}>
                    {c.difficulty}
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-lg tracking-tight mb-1">{c.title}</h3>
                  <p className="text-sm text-foreground/50 leading-relaxed">{c.description}</p>
                </div>

                <div className="flex flex-wrap gap-2 mt-auto">
                  {c.tags.map((tag) => (
                    <span key={tag} className="text-[9px] font-bold text-foreground/30 bg-foreground/5 px-2 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>

                <Link
                  href="/new"
                  className={`w-full py-3 rounded-xl ${c.bg} border ${c.border} ${c.color} text-[10px] font-black uppercase tracking-widest text-center hover:brightness-125 transition-all`}
                >
                  Accept Challenge →
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
