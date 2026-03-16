"use client"

import { useEffect, useState } from "react"

const SCIENTIFIC_ELEMENTS = [
  { text: "Ag", sub: "47", label: "Argentum", type: "chem" },
  { text: "107.87", label: "Atomic Mass", type: "chem" },
  { text: "e^iπ + 1 = 0", label: "Euler's Identity", type: "math" },
  { text: "c = 299,792,458 m/s", label: "Speed of Light", type: "phys" },
  { text: "G = 6.674×10⁻¹¹", label: "Gravitational constant", type: "phys" },
  { text: "Φ = 1.618", label: "Golden Ratio", type: "math" },
  { text: "[Kr] 4d¹⁰ 5s¹", label: "Electronic Config", type: "chem" }
]

export default function BootLoader() {
  const [show, setShow] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("Initializing Core")

  useEffect(() => {
    const isBooted = sessionStorage.getItem("argentum_booted")
    if (!isBooted) {
      setShow(true)
      
      const timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer)
            setTimeout(() => {
              setShow(false)
              sessionStorage.setItem("argentum_booted", "true")
            }, 1000)
            return 100
          }
          const next = prev + Math.random() * 8
          if (next > 20) setStatus("Computing Proofs")
          if (next > 45) setStatus("Verifying Atomic State")
          if (next > 75) setStatus("Finalizing Argentum")
          return next
        })
      }, 100)

      return () => clearInterval(timer)
    }
  }, [])

  if (!show) return null

  const brand = "ARGENTUM"

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center gap-16 overflow-hidden transition-all duration-1000">
      {/* Background Scientific Ambient Layer */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        {SCIENTIFIC_ELEMENTS.map((el, i) => (
          <div 
            key={i}
            className="absolute text-[10px] font-mono font-bold tracking-widest text-silver whitespace-nowrap animate-float-scientific"
            style={{ 
              top: `${Math.random() * 100}%`, 
              left: `${Math.random() * 100}%`,
              animationDelay: `${i * 1.5}s`,
              animationDuration: `${15 + Math.random() * 10}s`
            }}
          >
            {el.text} <span className="text-[8px] opacity-40 ml-2">// {el.label}</span>
          </div>
        ))}
      </div>

      {/* Center Brand Block */}
      <div className="relative flex flex-col items-center gap-8 z-10">
        <div className="relative group">
          {/* Blueprint Crosshair */}
          <div className="absolute -inset-10 border border-white/5 pointer-events-none" />
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[1px] h-20 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
          <div className="absolute top-1/2 -left-10 -translate-y-1/2 h-[1px] w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="w-24 h-24 rounded-2xl border-2 border-silver/40 flex items-center justify-center bg-[#0d0d0d] silver-glow relative overflow-hidden">
            <div className="absolute top-1 left-2 text-[8px] font-bold text-silver/40">47</div>
            <div className="absolute bottom-1 right-2 text-[8px] font-bold text-silver/40">107.87</div>
            <span className="text-3xl font-black text-white tracking-widest selection:bg-transparent">Ag</span>
            
            {/* Laboratory Scanning Line */}
            <div className="absolute inset-0 w-full h-[2px] bg-white opacity-20 blur-[1px] animate-scan-y top-0" />
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 overflow-hidden">
          {brand.split("").map((char, i) => (
            <span 
              key={i} 
              className="text-sm font-black text-silver tracking-[0.8em] animate-slide-up-char"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {char}
            </span>
          ))}
        </div>
      </div>

      {/* Progress Block */}
      <div className="w-72 flex flex-col gap-4 items-center z-10">
        <div className="w-full h-[4px] bg-white/5 rounded-full overflow-hidden relative border border-white/5">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-silver via-white to-silver transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
          <div 
            className="absolute top-0 left-0 h-full bg-blue-500 opacity-40 blur-md transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between w-full font-mono">
            <div className="flex flex-col">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Operation Status</span>
                <span className="text-[10px] font-bold text-silver uppercase animate-pulse">
                    {status}
                </span>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Progress</span>
                <span className="text-[10px] font-bold text-silver">
                    {Math.round(progress)}%
                </span>
            </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float-scientific {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          20% { opacity: 0.8; }
          80% { opacity: 0.8; }
          100% { transform: translate(40px, -60px) scale(1.1); opacity: 0; }
        }
        @keyframes scan-y {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); } /* Scan past frame */
        }
        .animate-scan-y {
          animation: scan-y 3s linear infinite;
        }
        @keyframes slide-up-char {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up-char {
          animation: slide-up-char 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  )
}
