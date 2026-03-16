"use client"

export default function Skeleton({ className }: { className?: string }) {
  return (
    <div 
      className={`bg-white/5 animate-pulse rounded-lg relative overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer-fast" />
      <style jsx>{`
        @keyframes shimmer-fast {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer-fast {
          animation: shimmer-fast 1.5s infinite;
        }
      `}</style>
    </div>
  )
}

export function PostSkeleton() {
    return (
        <div className="glass-card p-6 flex flex-col gap-5 h-full">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <div className="flex flex-col gap-1">
                        <Skeleton className="w-20 h-2" />
                        <Skeleton className="w-12 h-1.5" />
                    </div>
                </div>
                <Skeleton className="w-16 h-4 rounded-md" />
            </div>
            <div className="flex flex-col gap-3">
                <Skeleton className="w-3/4 h-5" />
                <div className="flex flex-col gap-2">
                    <Skeleton className="w-full h-3" />
                    <Skeleton className="w-5/6 h-3" />
                </div>
            </div>
            <div className="mt-auto pt-6 flex items-center justify-between border-t border-white/5">
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-16 h-6 rounded-full" />
            </div>
        </div>
    )
}
