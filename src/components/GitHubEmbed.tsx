"use client"

import { Star, GitFork, Book } from 'lucide-react'

interface GitHubEmbedProps {
  repoName: string
  stars: number
  forks: number
  language: string
  description?: string
}

export default function GitHubEmbed({ repoName, stars, forks, language, description }: GitHubEmbedProps) {
  return (
    <a 
      href={`https://github.com/${repoName}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block group mt-3 bg-[#0a0a0a] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all hover:bg-white/[0.02]"
    >
      <div className="flex items-center gap-2 mb-2">
        <Book size={16} className="text-gray-400 group-hover:text-white transition-colors" />
        <span className="text-sm font-bold text-blue-400 group-hover:underline truncate">{repoName}</span>
      </div>
      
      {description && (
        <p className="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed">
          {description}
        </p>
      )}
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span className="text-[10px] font-bold text-gray-500">{language}</span>
        </div>
        
        <div className="flex items-center gap-1.5 text-gray-500">
          <Star size={12} />
          <span className="text-[10px] font-black">{stars}</span>
        </div>
        
        <div className="flex items-center gap-1.5 text-gray-500">
          <GitFork size={12} />
          <span className="text-[10px] font-black">{forks}</span>
        </div>
      </div>
    </a>
  )
}
