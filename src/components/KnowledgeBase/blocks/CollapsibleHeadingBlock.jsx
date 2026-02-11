import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, Plus, Trash2, Pencil, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BlockRenderer from '../BlockRenderer';

// Block types available inside collapsible heading (excludes collapsible_heading itself)
const innerBlockTypes = [
  { type: 'paragraph', label: 'Paragraph' },
  { type: 'heading_1', label: 'Heading 1' },
  { type: 'heading_2', label: 'Heading 2' },
  { type: 'heading_3', label: 'Heading 3' },
  { type: 'bulleted_list', label: 'Bullet List' },
  { type: 'numbered_list', label: 'Numbered List' },
  { type: 'toggle', label: 'Toggle' },
  { type: 'callout', label: 'Callout' },
  { type: 'quote', label: 'Quote' },
  { type: 'divider', label: 'Divider' },
  { type: 'code', label: 'Code' },
  { type: 'image', label: 'Image' },
  { type: 'video', label: 'Video' },
  { type: 'table', label: 'Table' },
  { type: 'bookmark', label: 'Bookmark' },
  { type: 'equation', label: 'Equation' },
  { type: 'button', label: 'Button' },
];

const getDefaultContent = (blockType) => {
  switch (blockType) {
    case 'table': return { headers: ['Column 1', 'Column 2'], rows: [['', '']] };
    case 'toggle': return { title: '', body: '' };
    case 'callout': return { text: '' };
    case 'code': return { code: '', language: 'javascript' };
    case 'image': return { url: '', alt: '', caption: '' };
    case 'video': return { url: '', caption: '' };
    case 'embed': return { url: '', height: 400, caption: '' };
    case 'bookmark': return { url: '', title: '', description: '', image: '' };
    case 'equation': return { latex: '', displayMode: true };
    case 'button': return { label: 'Click me', action: 'link', url: '', style: 'primary' };
    default: return '';
  }
};

const getDefaultProperties = (blockType) => {
  switch (blockType) {
    case 'callout': return { variant: 'info' };
    case 'code': return { language: 'javascript' };
    default: return {};
  }
};

const CollapsibleHeadingBlock = ({ block, content, isEditing, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingChildId, setEditingChildId] = useState(null);
  const menuRef = useRef(null);

  const data = typeof content === 'object' && content !== null
    ? content
    : { title: content || '', blocks: [] };

  const childBlocks = data.blocks || [];

  // Close add menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showAddMenu && menuRef.current && !menuRef.current.contains(e.target)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAddMenu]);

  const addChildBlock = (type) => {
    const newBlock = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      defaultContent: getDefaultContent(type),
      variants: {},
      properties: getDefaultProperties(type)
    };
    onUpdate?.({ ...data, blocks: [...childBlocks, newBlock] });
    setEditingChildId(newBlock.id);
    setShowAddMenu(false);
  };

  const updateChildBlock = (blockId, newContent) => {
    const updatedBlocks = childBlocks.map(b =>
      b.id === blockId ? { ...b, defaultContent: newContent } : b
    );
    onUpdate?.({ ...data, blocks: updatedBlocks });
  };

  const deleteChildBlock = (blockId) => {
    const updatedBlocks = childBlocks.filter(b => b.id !== blockId);
    onUpdate?.({ ...data, blocks: updatedBlocks });
    if (editingChildId === blockId) setEditingChildId(null);
  };

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
        <div className="ml-2 pl-4 border-l-2 border-blue-200 dark:border-blue-800 space-y-2">
          {childBlocks.length > 0 && childBlocks.map((child) => {
            const isChildEditing = editingChildId === child.id;
            return (
              <div key={child.id} className="group/child relative">
                {/* Child block toolbar */}
                <div className={`absolute -top-7 right-0 z-10 flex items-center gap-1 px-1.5 py-0.5
                  bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700
                  rounded shadow-sm transition-all duration-200
                  ${isChildEditing ? 'opacity-100' : 'opacity-0 group-hover/child:opacity-100'}`}>
                  <button
                    onClick={() => setEditingChildId(isChildEditing ? null : child.id)}
                    className={`flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium rounded transition-colors
                      ${isChildEditing
                        ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        : 'bg-gray-50 dark:bg-neutral-700 text-gray-600 dark:text-neutral-300'
                      }`}
                  >
                    {isChildEditing ? <Check size={11} /> : <Pencil size={11} />}
                    {isChildEditing ? 'Done' : 'Edit'}
                  </button>
                  <button
                    onClick={() => deleteChildBlock(child.id)}
                    className="flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium
                      bg-gray-50 dark:bg-neutral-700 text-gray-600 dark:text-neutral-300
                      rounded hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30
                      dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>

                {/* Child block content */}
                <div className={`bg-white dark:bg-neutral-800/50 rounded-lg p-2.5 border transition-colors
                  ${isChildEditing
                    ? 'border-blue-300 dark:border-blue-700 ring-1 ring-blue-200 dark:ring-blue-800'
                    : 'border-gray-100 dark:border-neutral-700/50 hover:border-gray-200 dark:hover:border-neutral-700'
                  }`}>
                  <BlockRenderer
                    block={child}
                    isEditing={isChildEditing}
                    onUpdate={(newContent) => updateChildBlock(child.id, newContent)}
                  />
                </div>
              </div>
            );
          })}

          {/* Add block inside collapsible heading */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3
                border-2 border-dashed border-gray-300 dark:border-neutral-600
                rounded-lg text-[13px] text-gray-500 dark:text-neutral-400
                hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-600
                dark:hover:text-blue-400 transition-colors"
            >
              <Plus size={14} />
              Add block inside section
            </button>

            <AnimatePresence>
              {showAddMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
                    bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700
                    rounded-lg shadow-lg p-2 w-56 grid grid-cols-2 gap-1 max-h-64 overflow-y-auto"
                >
                  {innerBlockTypes.map(opt => (
                    <button
                      key={opt.type}
                      onClick={() => addChildBlock(opt.type)}
                      className="flex items-center gap-2 px-2 py-1.5 text-[12px]
                        text-gray-700 dark:text-neutral-300 hover:bg-gray-100
                        dark:hover:bg-neutral-800 rounded transition-colors"
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
        className="w-full flex items-center gap-2 group/title text-left py-1"
      >
        <ChevronRight
          size={20}
          className={`text-gray-400 dark:text-neutral-500 transition-transform duration-200 flex-shrink-0
            ${isExpanded ? 'rotate-90' : ''}`}
        />
        <h2 className="text-[24px] font-semibold tracking-[-0.01em] leading-[1.2]
          text-gray-900 dark:text-white group-hover/title:text-blue-600 dark:group-hover/title:text-blue-400
          transition-colors">
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
            <div className="ml-3 pl-4 border-l-2 border-gray-200 dark:border-neutral-700 mt-2 space-y-3">
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
