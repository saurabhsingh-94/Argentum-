"use client"

import { useEffect, useRef, useState } from 'react'

export default function ScrollReveal({ 
  children, 
  direction = 'up',
  delay = 0 
}: { 
  children: React.ReactNode, 
  direction?: 'up' | 'down' | 'left' | 'right',
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const directions = {
    up: 'translate-y-10',
    down: '-translate-y-10',
    left: 'translate-x-10',
    right: '-translate-x-10'
  }

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] ${isVisible ? 'opacity-100 translate-x-0 translate-y-0' : `opacity-0 ${directions[direction]}`}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
