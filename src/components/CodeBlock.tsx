import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  maxHeight?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'text',
  title,
  maxHeight = 'max-h-[500px]'
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const lines = code.trim().split('\n');

  return (
    <div className="relative rounded-lg border border-slate-800 bg-slate-950 font-mono text-xs overflow-hidden shadow-2xl">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          {title && <span className="ml-2 font-medium text-slate-300 text-xs tracking-tight">{title}</span>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider">{language}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
            title="Copiar código"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code body with line numbers */}
      <div className={`overflow-x-auto overflow-y-auto p-4 ${maxHeight} text-slate-200 leading-relaxed font-mono`}>
        <pre className="grid grid-cols-[auto_1fr] gap-x-4">
          <span className="select-none text-slate-600 text-right pr-2 border-r border-slate-800/70">
            {lines.map((_, i) => (
              <span key={i} className="block text-[11px] leading-[22px]">
                {i + 1}
              </span>
            ))}
          </span>
          <code className="text-slate-100 block text-[11px] leading-[22px]">
            {lines.map((line, i) => (
              <span key={i} className="block whitespace-pre">
                {line || ' '}
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
};
