import React from 'react';

const HeadingBlock = ({ block, content, isEditing, onUpdate }) => {
  const level = block.type.split('_')[1]; // heading_1 -> 1

  // Type scale with 1.4 ratio: 48px, 34px, 24px
  // Tight letter-spacing for headings (-0.02em)
  // Reduced line-height for headings (1.2)
  const headingStyles = {
    1: 'text-[48px] font-bold tracking-tight leading-[1.1] mt-12 mb-6',
    2: 'text-[34px] font-semibold tracking-tight leading-[1.15] mt-10 mb-5',
    3: 'text-[24px] font-semibold tracking-[-0.01em] leading-[1.2] mt-8 mb-4'
  };

  if (isEditing) {
    return (
      <input
        type="text"
        value={content || ''}
        onChange={(e) => onUpdate?.(e.target.value)}
        className={`w-full bg-transparent border-b-2 border-gray-200 dark:border-neutral-700
          focus:outline-none focus:border-blue-500 ${headingStyles[level]}
          text-gray-900 dark:text-white`}
        placeholder={`Heading ${level}`}
      />
    );
  }

  if (!content) return null;

  const Tag = `h${level}`;

  return (
    <Tag className={`${headingStyles[level]} text-gray-900 dark:text-white`}>
      {content}
    </Tag>
  );
};

export default HeadingBlock;
