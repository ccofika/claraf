import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BlockRenderer from '../BlockRenderer';
import InnerBlockEditor from './InnerBlockEditor';

const CollapsibleHeadingBlock = ({ block, content, isEditing, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const data = typeof content === 'object' && content !== null
    ? content
    : { title: content || '', blocks: [] };

  const childBlocks = data.blocks || [];

  // ── EDIT MODE ──
  if (isEditing) {
    return (
      <div className="space-y-3 p-4 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg">
        {/* Title input */}
        <input
          type="text"
          value={data.title || ''}
          onChange={(e) => onUpdate?.({ ...data, title: e.target.value })}
          className="w-full px-3 py-2 text-[22px] font-semibold text-gray-900 dark:text-white
            bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Collapsible section title..."
        />

        {/* Child blocks area */}
        <div className="ml-2 pl-4 border-l-2 border-blue-200 dark:border-blue-800">
          <InnerBlockEditor
            blocks={childBlocks}
            onBlocksChange={(newBlocks) => onUpdate?.({ ...data, blocks: newBlocks })}
            addButtonLabel="Add block inside section"
          />
        </div>
      </div>
    );
  }

  // ── VIEW MODE ──
  if (!data.title && childBlocks.length === 0) return null;

  return (
    <div>
      {/* Title row with collapse/expand arrow */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 group/title text-left py-2 -ml-1
          hover:bg-gray-50 dark:hover:bg-neutral-900/50 rounded-lg px-2 transition-colors"
      >
        <ChevronRight
          size={18}
          className={`text-gray-400 dark:text-neutral-500 transition-transform duration-200 flex-shrink-0
            ${isExpanded ? 'rotate-90' : ''}`}
        />
        <h2 className="text-[22px] font-semibold tracking-[-0.01em] leading-[1.25]
          text-gray-800 dark:text-neutral-200">
          {data.title || 'Untitled Section'}
        </h2>
      </button>

      {/* Collapsible content */}
      <AnimatePresence initial={false}>
        {isExpanded && childBlocks.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pl-7 mt-2 space-y-3">
              {childBlocks.map((child) => (
                <BlockRenderer key={child.id} block={child} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CollapsibleHeadingBlock;
