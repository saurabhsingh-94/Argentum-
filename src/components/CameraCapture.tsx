"use client"

import { useState, useRef, useEffect } from 'react'
import { Camera, X, RefreshCw, ChevronRight, Check } from 'lucide-react'

interface CameraCaptureProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (blob: Blob) => void
}

export default function CameraCapture({ isOpen, onClose, onCapture }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [isOpen])

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser blocks camera on this connection. Use HTTPS/localhost.")
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setError(null)
    } catch (err: any) {
      console.error("Camera error:", err)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Camera access denied. Click the 🔒 lock icon in your URL bar to allow.")
      } else {
        setError(err.message || "Unable to access camera. Please check connections.")
      }
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setCapturedImage(null)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d')?.drawImage(video, 0, 0)
      
      const dataUrl = canvas.toDataURL('image/jpeg')
      setCapturedImage(dataUrl)
    }
  }

  const handleConfirm = () => {
    if (capturedImage && canvasRef.current) {
      canvasRef.current.toBlob((blob) => {
        if (blob) onCapture(blob)
        onClose()
      }, 'image/jpeg', 0.8)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
      <div className="bg-[#050505] border border-white/10 rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-3xl flex flex-col relative aspect-[3/4]">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-3 bg-black/50 hover:bg-white/10 rounded-full transition-all text-white z-20"
        >
          <X size={20} />
        </button>

        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="flex flex-col items-center gap-4 text-center px-10">
              <Camera size={48} className="text-gray-800" />
              <p className="text-sm text-gray-500 font-mono uppercase tracking-widest">{error}</p>
              <button onClick={startCamera} className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest">Retry</button>
            </div>
          ) : capturedImage ? (
            <img src={capturedImage} className="w-full h-full object-cover animate-scale-in" />
          ) : (
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          )}

          <canvas ref={canvasRef} className="hidden" />
          
          {/* Overlay Grid */}
          {!capturedImage && !error && (
            <div className="absolute inset-0 pointer-events-none border-[0.5px] border-white/5 grid grid-cols-3 grid-rows-3">
               {Array.from({ length: 9 }).map((_, i) => <div key={i} className="border-[0.5px] border-white/5" />)}
            </div>
          )}
        </div>

        <div className="p-8 bg-[#0a0a0a] flex items-center justify-center gap-8 border-t border-white/5">
          {capturedImage ? (
            <>
              <button 
                onClick={() => setCapturedImage(null)} 
                className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all hover:bg-white/10"
              >
                <RefreshCw size={24} />
              </button>
              <button 
                onClick={handleConfirm} 
                className="w-20 h-20 rounded-full silver-metallic flex items-center justify-center text-black shadow-glow hover:scale-105 active:scale-95 transition-all"
              >
                <Check size={32} />
              </button>
            </>
          ) : (
            <button 
              onClick={capturePhoto} 
              disabled={!stream}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center group active:scale-95 transition-all disabled:opacity-50"
            >
              <div className="w-16 h-16 rounded-full bg-white group-hover:scale-90 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
