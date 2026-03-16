"use client"

import { Plus } from 'lucide-react'
import Link from 'next/link'

export default function EmptyState({ 
  title = "No builds found", 
  description = "Start your first build log and prove your progress forever.",
  showAction = true
}: { 
  title?: string, 
  description?: string,
  showAction?: boolean
}) {
  return (
    <div className="glass-card py-20 px-6 flex flex-col items-center justify-center text-center gap-6 border-dashed border-white/10 bg-transparent">
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-silver group-hover:silver-glow transition-all">
        <span className="text-xl font-black italic">Ag</span>
      </div>
      
      <div className="flex flex-col gap-2 max-w-sm">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">
          {description}
        </p>
      </div>

      {showAction && (
        <Link 
          href="/new" 
          className="silver-metallic flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-glow"
        >
          <Plus size={16} />
          <span>Start building</span>
        </Link>
      )}
    </div>
  )
}
