"use client"

import dynamic from 'next/dynamic'
import '@uiw/react-markdown-preview/markdown.css'

const MarkdownPreview = dynamic(
  () => import('@uiw/react-markdown-preview'),
  { ssr: false }
)

export default function MarkdownRenderer({ source }: { source: string }) {
  return (
    <div className="markdown-renderer" data-color-mode="dark">
      <MarkdownPreview 
        source={source} 
        style={{ 
          backgroundColor: 'transparent',
          color: '#d1d5db',
          fontSize: '0.875rem',
          lineHeight: '1.6',
        }} 
      />
      <style jsx global>{`
        .wmde-markdown {
          font-family: inherit !important;
        }
        .wmde-markdown h1, .wmde-markdown h2, .wmde-markdown h3 {
          color: white !important;
          border-bottom: 1px solid rgba(255,255,255,0.05) !important;
          margin-top: 2rem !important;
          padding-bottom: 0.5rem !important;
        }
        .wmde-markdown pre {
          background-color: #111 !important;
          border: 1px solid rgba(255,255,255,0.05) !important;
          border-radius: 0.5rem !important;
        }
        .wmde-markdown code {
          background-color: rgba(255,255,255,0.05) !important;
          border-radius: 0.25rem !important;
          padding: 0.2rem 0.4rem !important;
          font-size: 0.8em !important;
        }
      `}</style>
    </div>
  )
}
