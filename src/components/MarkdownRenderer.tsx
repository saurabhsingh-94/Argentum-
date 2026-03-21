"use client"

import { useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import '@uiw/react-markdown-preview/markdown.css'
import Editor from '@monaco-editor/react'

const MarkdownPreview = dynamic(
  () => import('@uiw/react-markdown-preview'),
  { ssr: false }
)

const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : '';
  const isInteractive = ['javascript', 'js', 'typescript', 'ts', 'html', 'css', 'json'].includes(language);
  const [code, setCode] = useState(String(children).replace(/\n$/, ''));
  const [output, setOutput] = useState<string | null>(null);

  if (!inline && isInteractive) {
    const runCode = () => {
      try {
        let loggedOutput: string[] = [];
        const originalLog = console.log;
        console.log = (...args) => loggedOutput.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        // Simple unsafe browser eval for playground fun
        const result = new Function(code)();
        console.log = originalLog;
        if (result !== undefined) loggedOutput.push(`Returned: ${String(result)}`);
        setOutput(loggedOutput.join('\n') || 'Executed successfully (no output).');
      } catch (err: any) {
        setOutput(`Error: ${err.message}`);
      }
    };

    return (
      <div className="flex flex-col gap-0 my-8">
        <div className="flex justify-between items-center bg-[#1e1e1e] rounded-t-xl px-4 py-2 border border-white/10 border-b-0">
           <span className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa]">{language}</span>
           {(language === 'javascript' || language === 'js') && (
             <button onClick={runCode} className="text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded hover:bg-blue-500/20 transition-all shadow-[0_0_15px_rgba(59,130,246,0.1)] active:scale-95">
               Run Sandbox
             </button>
           )}
        </div>
        <div className="h-[350px] border border-white/10 border-t-0 rounded-b-xl overflow-hidden shadow-2xl relative bg-[#1e1e1e]">
            <Editor
                height="100%"
                language={language === 'js' ? 'javascript' : language === 'ts' ? 'typescript' : language}
                theme="vs-dark"
                value={code}
                onChange={(val) => setCode(val || '')}
                options={{ 
                  minimap: { enabled: false }, 
                  fontSize: 13, 
                  scrollBeyondLastLine: false, 
                  padding: { top: 16, bottom: 16 },
                  fontFamily: 'var(--font-mono, monospace)'
                }}
            />
        </div>
        {output && (
            <div className="bg-black/50 border border-white/10 border-t-[3px] border-t-blue-500/50 p-4 rounded-xl mt-4 text-xs font-mono text-gray-300 whitespace-pre-wrap max-h-[200px] overflow-auto shadow-xl">
                <div className="text-[9px] font-black uppercase tracking-widest text-blue-400/50 mb-2">Sandbox Output</div>
                {output}
            </div>
        )}
      </div>
    );
  }
  return <code className={className} {...props}>{children}</code>;
};

export default function MarkdownRenderer({ source }: { source: string }) {
  return (
    <div className="markdown-renderer" data-color-mode="dark">
      <MarkdownPreview 
        source={source} 
        components={{ code: CodeBlock as any }}
        style={{ 
          backgroundColor: 'transparent',
          color: '#e5e7eb',
          fontSize: '0.9rem',
          lineHeight: '1.7',
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
        /* Make standard pre blocks (non-interactive) look nice */
        .wmde-markdown pre:not(:has(.monaco-editor)) {
          background-color: rgba(0,0,0,0.3) !important;
          border: 1px solid rgba(255,255,255,0.05) !important;
          border-radius: 0.75rem !important;
          padding: 1rem !important;
        }
        .wmde-markdown code:not(.monaco-editor *) {
          background-color: rgba(255,255,255,0.05) !important;
          border-radius: 0.35rem !important;
          padding: 0.2rem 0.4rem !important;
          font-size: 0.85em !important;
          color: #bfdbfe !important;
        }
      `}</style>
    </div>
  )
}
