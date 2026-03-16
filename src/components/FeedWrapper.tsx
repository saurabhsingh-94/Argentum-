"use client"

import { useState } from 'react'
import PostCard from './PostCard'
import CategoryFilter from './CategoryFilter'
import ShipCard from './ShipCard'
import Skeleton from './Skeleton'

export default function FeedWrapper({ initialPosts }: { initialPosts: any[] }) {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [posts, setPosts] = useState(initialPosts)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const filteredPosts = selectedCategory === 'All' 
    ? posts 
    : posts.filter(post => post.category === selectedCategory)

  const handleCategoryChange = (category: string) => {
    setIsTransitioning(true)
    setTimeout(() => {
      setSelectedCategory(category)
      setIsTransitioning(false)
    }, 400)
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-8">
        <CategoryFilter 
          selected={selectedCategory} 
          onSelect={handleCategoryChange} 
        />
        
        {/* Quick Ship Area for Social UX */}
        <div className="max-w-2xl">
            <ShipCard />
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-500 ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <div className="col-span-full py-20 text-center flex flex-col items-center gap-4 animate-fade-in text-gray-600 font-mono text-sm uppercase tracking-widest">
            <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center opacity-20">
                //
            </div>
            No data found in sector: {selectedCategory}
          </div>
        )}
      </div>
    </div>
  )
}
