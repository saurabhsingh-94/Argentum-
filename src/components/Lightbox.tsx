"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react'
import { useState } from 'react'

interface LightboxProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string | null
}

export default function Lightbox({ isOpen, onClose, imageUrl }: LightboxProps) {
  const [scale, setScale] = useState(1)

  if (!imageUrl) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 md:p-10"
        >
          {/* Controls */}
          <div className="absolute top-6 right-6 flex items-center gap-4 z-[510]">
            <a 
              href={imageUrl} 
              download 
              className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-all backdrop-blur-xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <Download size={20} />
            </a>
            <button 
              onClick={onClose}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-all backdrop-blur-xl border border-white/10"
            >
              <X size={20} />
            </button>
          </div>

          <div className="absolute top-6 left-6 flex items-center gap-2 z-[510]">
              <button 
                onClick={() => setScale(prev => Math.min(prev + 0.5, 3))}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-all"
              >
                  <ZoomIn size={18} />
              </button>
              <button 
                onClick={() => setScale(prev => Math.max(prev - 0.5, 0.5))}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-all"
              >
                  <ZoomOut size={18} />
              </button>
          </div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: scale, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative max-w-full max-h-full flex items-center justify-center cursor-zoom-out"
            onClick={onClose}
          >
            <img
              src={imageUrl}
              alt="Lightbox"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-4xl select-none"
              draggable={false}
            />
          </motion.div>
          
          <div className="absolute bottom-10 px-8 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
              End-to-End Encrypted Secure View
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
