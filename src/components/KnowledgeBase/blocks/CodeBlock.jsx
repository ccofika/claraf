import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const CodeBlock = ({ block, content, isEditing, onUpdate }) => {
  const [copied, setCopied] = useState(false);
  const language = block.properties?.language || 'text';

  // Content structure: { code: string, language: string } or just string
  const codeData = typeof content === 'object' && content !== null
    ? content
    : { code: content || '', language };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeData.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (isEditing) {
    return (
      <div className="relative rounded-lg overflow-hidden border border-neutral-800">
        <div className="flex items-center justify-between px-4 py-2 bg-neutral-900 border-b border-neutral-800">
          <input
            type="text"
            value={codeData.language || ''}
            onChange={(e) => onUpdate?.({ ...codeData, language: e.target.value })}
            className="px-2 py-1 text-[12px] font-medium bg-neutral-800 text-neutral-400 rounded
              border border-neutral-700 focus:outline-none focus:border-blue-500 w-24"
            placeholder="language"
          />
        </div>
        <textarea
          value={codeData.code || ''}
          onChange={(e) => onUpdate?.({ ...codeData, code: e.target.value })}
          className="w-full p-4 bg-neutral-950 text-neutral-100 font-mono text-[14px] leading-[1.6]
            focus:outline-none resize-none min-h-40"
          placeholder="// Enter code here..."
          spellCheck={false}
        />
      </div>
    );
  }

  if (!codeData.code) return null;

  return (
    <div className="relative group rounded-xl overflow-hidden bg-[#1e1e1e] dark:bg-[#1a1a1a]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#252526] dark:bg-[#1f1f1f]
        border-b border-[#333] dark:border-[#2a2a2a]">
        {codeData.language && (
          <span className="text-[12px] font-medium text-neutral-400 uppercase tracking-wider">
            {codeData.language}
          </span>
        )}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[12px] text-neutral-400
            hover:text-neutral-200 hover:bg-white/10
            rounded transition-colors opacity-0 group-hover:opacity-100"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={14} className="text-green-400" />
              <span className="text-green-400">Copied</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code */}
      <pre className="p-5 overflow-x-auto">
        <code className="font-mono text-[13.5px] leading-[1.7] text-neutral-200 whitespace-pre">
          {codeData.code}
        </code>
      </pre>
    </div>
  );
};

export default CodeBlock;
