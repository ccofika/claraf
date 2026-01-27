import React from 'react';

const QuoteBlock = ({ content, isEditing, onUpdate }) => {
  if (isEditing) {
    return (
      <div className="border-l-4 border-gray-300 dark:border-neutral-600 pl-6 py-2">
        <textarea
          value={content || ''}
          onChange={(e) => onUpdate?.(e.target.value)}
          className="w-full bg-transparent text-[19px] leading-[1.6] text-gray-600 dark:text-neutral-400 italic
            focus:outline-none resize-none min-h-16 placeholder-gray-400"
          placeholder="Quote text..."
        />
      </div>
    );
  }

  if (!content) return null;

  return (
    <blockquote className="border-l-4 border-gray-300 dark:border-neutral-600 pl-6 py-2 my-6">
      <p className="text-[19px] leading-[1.6] text-gray-600 dark:text-neutral-400 italic">
        {content}
      </p>
    </blockquote>
  );
};

export default QuoteBlock;
