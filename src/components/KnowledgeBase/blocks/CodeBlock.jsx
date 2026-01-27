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
    <div className="relative group rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-100 dark:bg-neutral-900
        border-b border-neutral-200 dark:border-neutral-800">
        {codeData.language && (
          <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
            {codeData.language}
          </span>
        )}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-[12px] text-neutral-500 dark:text-neutral-400
            hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-800
            rounded transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={14} />
              Copied
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
      <pre className="p-4 bg-neutral-50 dark:bg-neutral-950 overflow-x-auto">
        <code className="font-mono text-[14px] leading-[1.6] text-neutral-800 dark:text-neutral-200 whitespace-pre">
          {codeData.code}
        </code>
      </pre>
    </div>
  );
};

export default CodeBlock;
