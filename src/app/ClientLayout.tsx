"use client"

import { usePathname } from 'next/navigation'
import BootLoader from '@/components/BootLoader'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CommandPalette from '@/components/CommandPalette'
import PresenceHandler from '@/components/PresenceHandler'
import { useEffect, useState } from 'react'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isPageMounted, setIsPageMounted] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  useEffect(() => {
    setIsPageMounted(true)
    return () => setIsPageMounted(false)
  }, [pathname])

  return (
    <>
      <BootLoader />
      <Navbar onSearchClick={() => setIsSearchOpen(true)} />
      <main className={`min-h-screen pt-4 transition-all duration-700 ease-out ${isPageMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {children}
      </main>
      <Footer />
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <PresenceHandler />
    </>
  )
}
