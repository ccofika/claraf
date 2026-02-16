import React, { useState, useMemo } from 'react';
import { Copy, Check, Hash, FileCode } from 'lucide-react';

const CodeBlock = ({ block, content, isEditing, onUpdate }) => {
  const [copied, setCopied] = useState(false);
  const language = block.properties?.language || 'text';
  const showLineNumbers = block.properties?.lineNumbers !== false; // default true
  const filename = block.properties?.filename || '';

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

  // Diff highlighting: detect + / - lines
  const isDiff = (codeData.language || '').toLowerCase() === 'diff';

  const codeLines = useMemo(() => {
    if (!codeData.code) return [];
    return codeData.code.split('\n');
  }, [codeData.code]);

  if (isEditing) {
    return (
      <div className="relative rounded-lg overflow-hidden border border-neutral-800">
        <div className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border-b border-neutral-800">
          <input
            type="text"
            value={codeData.language || ''}
            onChange={(e) => onUpdate?.({ ...codeData, language: e.target.value })}
            className="px-2 py-1 text-[12px] font-medium bg-neutral-800 text-neutral-400 rounded
              border border-neutral-700 focus:outline-none focus:border-blue-500 w-24"
            placeholder="language"
          />
          <input
            type="text"
            value={filename}
            onChange={(e) => {
              const event = new CustomEvent('kb-block-property-update', {
                detail: { blockId: block.id, properties: { ...block.properties, filename: e.target.value } }
              });
              document.dispatchEvent(event);
            }}
            className="px-2 py-1 text-[12px] font-medium bg-neutral-800 text-neutral-400 rounded
              border border-neutral-700 focus:outline-none focus:border-blue-500 flex-1"
            placeholder="filename (optional)"
          />
          <button
            onClick={() => {
              const event = new CustomEvent('kb-block-property-update', {
                detail: { blockId: block.id, properties: { ...block.properties, lineNumbers: !showLineNumbers } }
              });
              document.dispatchEvent(event);
            }}
            className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded transition-colors
              ${showLineNumbers
                ? 'bg-blue-900/40 text-blue-400 border border-blue-700'
                : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
              }`}
            title="Toggle line numbers"
          >
            <Hash size={11} />
            Lines
          </button>
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
      <div className="flex items-center justify-between px-5 py-2.5 bg-[#252526] dark:bg-[#1f1f1f]
        border-b border-[#333] dark:border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          {filename && (
            <div className="flex items-center gap-1.5 text-[12px] text-neutral-300">
              <FileCode size={13} className="text-neutral-500" />
              <span className="font-medium">{filename}</span>
            </div>
          )}
          {codeData.language && !filename && (
            <span className="text-[12px] font-medium text-neutral-400 uppercase tracking-wider">
              {codeData.language}
            </span>
          )}
          {codeData.language && filename && (
            <span className="text-[11px] text-neutral-500 ml-1">
              {codeData.language}
            </span>
          )}
        </div>
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

      {/* Code with optional line numbers */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <tbody>
            {codeLines.map((line, i) => {
              // Diff highlighting
              let lineBg = '';
              let lineTextColor = 'text-neutral-200';
              if (isDiff) {
                if (line.startsWith('+') && !line.startsWith('+++')) {
                  lineBg = 'bg-green-900/30';
                  lineTextColor = 'text-green-300';
                } else if (line.startsWith('-') && !line.startsWith('---')) {
                  lineBg = 'bg-red-900/30';
                  lineTextColor = 'text-red-300';
                } else if (line.startsWith('@@')) {
                  lineBg = 'bg-blue-900/20';
                  lineTextColor = 'text-blue-300';
                }
              }

              return (
                <tr key={i} className={lineBg}>
                  {showLineNumbers && (
                    <td className="text-right pr-4 pl-4 py-0 select-none align-top
                      text-[12px] text-neutral-600 font-mono w-[1%] whitespace-nowrap border-r border-[#333]">
                      {i + 1}
                    </td>
                  )}
                  <td className={`px-4 py-0 font-mono text-[13.5px] leading-[1.7] whitespace-pre ${lineTextColor}`}>
                    {line || '\n'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CodeBlock;
