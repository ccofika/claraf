import React from 'react';

const ListBlock = ({ block, content, isEditing, onUpdate }) => {
  const isNumbered = block.type === 'numbered_list';

  // Parse content as array of items (one per line)
  const items = Array.isArray(content)
    ? content
    : (content || '').split('\n').filter(item => item.trim());

  if (isEditing) {
    return (
      <textarea
        value={items.join('\n')}
        onChange={(e) => onUpdate?.(e.target.value.split('\n'))}
        className="w-full p-3 text-[17px] leading-[1.7] text-gray-900 dark:text-white bg-transparent
          border border-gray-200 dark:border-neutral-700 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-24"
        placeholder="Enter each item on a new line..."
      />
    );
  }

  if (!items.length) return null;

  const ListTag = isNumbered ? 'ol' : 'ul';

  return (
    <ListTag className={`space-y-2 pl-6 ${isNumbered ? 'list-decimal' : 'list-disc'}`}>
      {items.map((item, index) => (
        <li
          key={index}
          className="text-[17px] leading-[1.6] text-gray-700 dark:text-neutral-300
            pl-2 marker:text-gray-400 dark:marker:text-neutral-500"
        >
          {typeof item === 'string' ? item : item.text || item}
        </li>
      ))}
    </ListTag>
  );
};

export default ListBlock;
