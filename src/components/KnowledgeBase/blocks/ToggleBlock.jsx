import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ToggleBlock = ({ content, isEditing, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Content structure: { title: string, body: string }
  const toggleData = typeof content === 'object' && content !== null
    ? content
    : { title: content || 'Toggle', body: '' };

  if (isEditing) {
    return (
      <div className="space-y-3 p-4 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg">
        <input
          type="text"
          value={toggleData.title || ''}
          onChange={(e) => onUpdate?.({ ...toggleData, title: e.target.value })}
          className="w-full px-3 py-2 text-[17px] font-medium text-gray-900 dark:text-white bg-white dark:bg-neutral-800
            border border-gray-200 dark:border-neutral-700 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Toggle title..."
        />
        <textarea
          value={toggleData.body || ''}
          onChange={(e) => onUpdate?.({ ...toggleData, body: e.target.value })}
          className="w-full p-3 text-[15px] leading-[1.6] text-gray-700 dark:text-neutral-300 bg-white dark:bg-neutral-800
            border border-gray-200 dark:border-neutral-700 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-24"
          placeholder="Toggle content (supports markdown)..."
        />
      </div>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-neutral-900/50
          hover:bg-gray-100 dark:hover:bg-neutral-800/50 transition-colors text-left"
      >
        <ChevronRight
          size={18}
          className={`text-gray-400 dark:text-neutral-500 transition-transform duration-200
            ${isExpanded ? 'rotate-90' : ''}`}
        />
        <span className="text-[17px] font-medium text-gray-900 dark:text-white">
          {toggleData.title || 'Toggle'}
        </span>
      </button>

      {isExpanded && toggleData.body && (
        <div className="px-5 py-4 pl-11 border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-transparent">
          <div className="prose prose-gray dark:prose-invert max-w-none
            text-[15px] leading-[1.6] text-gray-700 dark:text-neutral-300
            [&_p]:mb-3 [&_p:last-child]:mb-0
            [&_code]:text-[13px] [&_code]:bg-gray-100 [&_code]:dark:bg-neutral-800
            [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {toggleData.body}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToggleBlock;
