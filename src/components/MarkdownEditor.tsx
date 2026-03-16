"use client"

import dynamic from 'next/dynamic'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { ssr: false }
)

export default function MarkdownEditor({ 
  value, 
  onChange 
}: { 
  value: string, 
  onChange: (val?: string) => void 
}) {
  return (
    <div className="md-editor-container" data-color-mode="dark">
      <MDEditor
        value={value}
        onChange={onChange}
        preview="edit"
        height={400}
        style={{
          backgroundColor: '#111',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '0.75rem',
          padding: '1rem',
        }}
      />
      <style jsx global>{`
        .w-md-editor {
          box-shadow: none !important;
        }
        .w-md-editor-toolbar {
          background-color: transparent !important;
          border-bottom: 1px solid rgba(255,255,255,0.05) !important;
          padding-bottom: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        .w-md-editor-content {
          background-color: transparent !important;
        }
        .w-md-editor-text-input {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
        }
      `}</style>
    </div>
  )
}
