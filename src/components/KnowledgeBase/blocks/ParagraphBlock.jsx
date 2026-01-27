import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ParagraphBlock = ({ content, isEditing, onUpdate }) => {
  if (isEditing) {
    return (
      <textarea
        value={content || ''}
        onChange={(e) => onUpdate?.(e.target.value)}
        className="w-full p-3 text-[17px] leading-[1.7] text-gray-900 dark:text-white bg-transparent
          border border-gray-200 dark:border-neutral-700 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-24"
        placeholder="Write something..."
      />
    );
  }

  if (!content) return null;

  return (
    <div className="prose prose-gray dark:prose-invert max-w-none
      text-[17px] leading-[1.7] text-gray-700 dark:text-neutral-300
      [&_p]:mb-4 [&_strong]:text-gray-900 [&_strong]:dark:text-white
      [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline
      [&_code]:text-[15px] [&_code]:bg-gray-100 [&_code]:dark:bg-neutral-800
      [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default ParagraphBlock;
