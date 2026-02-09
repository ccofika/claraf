import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, GripVertical, Type, Heading1, Heading2, Heading3,
  List, ListOrdered, ChevronRight, AlertCircle, Quote, Code,
  Image as ImageIcon, Table, Minus, Settings, Pencil, Check,
  // New icons for new block types
  Play, Code2, Link, FileText, FunctionSquare, MousePointer, ListTree,
  Music, FileType, Navigation, RefreshCw, Columns
} from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import BlockRenderer from '../BlockRenderer';

// Hook to calculate smart positioning for dropdowns/modals
const useSmartPosition = (isOpen, triggerRef, menuHeight = 400) => {
  const [position, setPosition] = useState({ direction: 'down', maxHeight: 400 });

  useEffect(() => {
    if (!isOpen || !triggerRef?.current) return;

    const calculatePosition = () => {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const navBarHeight = 140; // Approximate height of navigation bars

      const spaceAbove = triggerRect.top - navBarHeight;
      const spaceBelow = viewportHeight - triggerRect.bottom - 20;

      // Prefer going down if there's enough space
      if (spaceBelow >= menuHeight || spaceBelow >= spaceAbove) {
        setPosition({
          direction: 'down',
          maxHeight: Math.min(spaceBelow, menuHeight)
        });
      } else {
        setPosition({
          direction: 'up',
          maxHeight: Math.min(spaceAbove, menuHeight)
        });
      }
    };

    calculatePosition();
    window.addEventListener('scroll', calculatePosition, true);
    window.addEventListener('resize', calculatePosition);

    return () => {
      window.removeEventListener('scroll', calculatePosition, true);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [isOpen, triggerRef, menuHeight]);

  return position;
};

const blockTypeOptions = [
  // Basic
  { type: 'paragraph', label: 'Paragraph', icon: Type, category: 'basic' },
  { type: 'heading_1', label: 'Heading 1', icon: Heading1, category: 'basic' },
  { type: 'heading_2', label: 'Heading 2', icon: Heading2, category: 'basic' },
  { type: 'heading_3', label: 'Heading 3', icon: Heading3, category: 'basic' },
  { type: 'bulleted_list', label: 'Bullet List', icon: List, category: 'basic' },
  { type: 'numbered_list', label: 'Numbered List', icon: ListOrdered, category: 'basic' },
  { type: 'toggle', label: 'Toggle', icon: ChevronRight, category: 'basic' },
  { type: 'callout', label: 'Callout', icon: AlertCircle, category: 'basic' },
  { type: 'quote', label: 'Quote', icon: Quote, category: 'basic' },
  { type: 'divider', label: 'Divider', icon: Minus, category: 'basic' },
  // Media
  { type: 'image', label: 'Image', icon: ImageIcon, category: 'media' },
  { type: 'video', label: 'Video', icon: Play, category: 'media' },
  { type: 'audio', label: 'Audio', icon: Music, category: 'media' },
  { type: 'file', label: 'File', icon: FileText, category: 'media' },
  { type: 'pdf', label: 'PDF', icon: FileType, category: 'media' },
  // Embeds
  { type: 'code', label: 'Code', icon: Code, category: 'embed' },
  { type: 'embed', label: 'Embed', icon: Code2, category: 'embed' },
  { type: 'bookmark', label: 'Bookmark', icon: Link, category: 'embed' },
  // Advanced
  { type: 'table', label: 'Table', icon: Table, category: 'advanced' },
  { type: 'equation', label: 'Equation', icon: FunctionSquare, category: 'advanced' },
  { type: 'button', label: 'Button', icon: MousePointer, category: 'advanced' },
  { type: 'table_of_contents', label: 'Table of Contents', icon: ListTree, category: 'advanced' },
  { type: 'columns', label: 'Columns', icon: Columns, category: 'advanced' },
  { type: 'breadcrumbs', label: 'Breadcrumbs', icon: Navigation, category: 'advanced' },
  { type: 'synced_block', label: 'Synced Block', icon: RefreshCw, category: 'advanced' }
];

const SortableBlock = ({
  block,
  index,
  editingBlockId,
  setEditingBlockId,
  onUpdateBlock,
  onDeleteBlock,
  onOpenVariants,
  hasDropdowns,
  showAddMenu,
  setShowAddMenu,
  addBlock
}) => {
  const addButtonRef = useRef(null);
  const menuPosition = useSmartPosition(showAddMenu === index, addButtonRef, 350);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const isEditing = editingBlockId === block.id;

  return (
    <div ref={setNodeRef} style={style} className="group relative mb-3">
      {/* Block Actions - Floating toolbar above block */}
      <div className={`absolute -top-8 right-0 z-10 flex items-center gap-1 px-1.5 py-1
        bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700
        rounded-lg shadow-sm transition-all duration-200
        ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>

        {hasDropdowns && (
          <button
            onClick={() => onOpenVariants(block)}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium
              bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400
              rounded hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
            title="Edit variants"
          >
            <Settings size={12} />
            Variants
          </button>
        )}

        <button
          onClick={() => setEditingBlockId(isEditing ? null : block.id)}
          className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded transition-colors
            ${isEditing
              ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50'
              : 'bg-gray-50 dark:bg-neutral-700 text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-600'
            }`}
          title={isEditing ? 'Done editing' : 'Edit block'}
        >
          {isEditing ? <Check size={12} /> : <Pencil size={12} />}
          {isEditing ? 'Done' : 'Edit'}
        </button>

        <button
          onClick={() => onDeleteBlock(block.id)}
          className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium
            bg-gray-50 dark:bg-neutral-700 text-gray-600 dark:text-neutral-300
            rounded hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30
            dark:hover:text-red-400 transition-colors"
          title="Delete block"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Block Controls - Left Side */}
      <div className="absolute -left-8 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
        <button
          {...attributes}
          {...listeners}
          className="p-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <GripVertical size={14} />
        </button>
        <button
          ref={addButtonRef}
          onClick={() => setShowAddMenu(showAddMenu === index ? null : index)}
          className="p-1 text-gray-400 hover:text-blue-600"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Add Block Menu - Smart Positioned */}
      <AnimatePresence>
        {showAddMenu === index && (
          <motion.div
            initial={{ opacity: 0, y: menuPosition.direction === 'down' ? -10 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: menuPosition.direction === 'down' ? -10 : 10 }}
            className={`absolute left-0 z-50 bg-white dark:bg-neutral-900
              border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg p-1 w-48 overflow-y-auto
              ${menuPosition.direction === 'down' ? 'top-full mt-1' : 'bottom-full mb-1'}`}
            style={{ maxHeight: menuPosition.maxHeight }}
          >
            {blockTypeOptions.map(opt => (
              <button
                key={opt.type}
                onClick={() => {
                  addBlock(opt.type, index);
                  setShowAddMenu(null);
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm
                  text-gray-700 dark:text-neutral-300 hover:bg-gray-100
                  dark:hover:bg-neutral-800 rounded"
              >
                <opt.icon size={14} />
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Block Content */}
      <div className={`relative bg-gray-50 dark:bg-neutral-900 rounded-lg p-3 border transition-colors
        ${isEditing
          ? 'border-blue-300 dark:border-blue-700 ring-1 ring-blue-200 dark:ring-blue-800'
          : 'border-transparent hover:border-gray-200 dark:hover:border-neutral-700'
        }`}>

        <BlockRenderer
          block={block}
          isEditing={isEditing}
          onUpdate={(content) => onUpdateBlock(block.id, 'defaultContent', content)}
        />
      </div>
    </div>
  );
};

const BlockEditor = ({ blocks = [], onChange, dropdowns = [], onOpenVariants }) => {
  const [editingBlockId, setEditingBlockId] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(null);
  const firstAddButtonRef = useRef(null);
  const bottomAddButtonRef = useRef(null);

  const firstMenuPosition = useSmartPosition(showAddMenu === -1, firstAddButtonRef, 400);
  const bottomMenuPosition = useSmartPosition(showAddMenu === 'bottom', bottomAddButtonRef, 400);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5
      }
    })
  );

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showAddMenu !== null && !e.target.closest('.add-block-menu') && !e.target.closest('.add-block-trigger')) {
        setShowAddMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAddMenu]);

  const addBlock = (type, afterIndex) => {
    // Default content based on block type
    const getDefaultContent = (blockType) => {
      switch (blockType) {
        case 'table':
          return { headers: ['Column 1', 'Column 2'], rows: [['', '']] };
        case 'toggle':
          return { title: '', body: '' };
        case 'callout':
          return { text: '' };
        case 'code':
          return { code: '', language: 'javascript' };
        case 'image':
          return { url: '', alt: '', caption: '' };
        case 'video':
          return { url: '', caption: '' };
        case 'embed':
          return { url: '', height: 400, caption: '' };
        case 'bookmark':
          return { url: '', title: '', description: '', image: '' };
        case 'file':
          return { url: '', name: '', size: '', type: '' };
        case 'equation':
          return { latex: '', displayMode: true };
        case 'button':
          return { label: 'Click me', action: 'link', url: '', copyText: '', style: 'primary', align: 'left' };
        case 'table_of_contents':
          return { title: 'Table of Contents', maxDepth: 3, showNumbers: false };
        case 'audio':
          return { url: '', title: '', caption: '' };
        case 'pdf':
          return { url: '', title: '', height: 600 };
        case 'breadcrumbs':
          return {};
        case 'synced_block':
          return { sourcePageId: '', sourceBlockId: '' };
        case 'columns':
          return { columns: [
            { id: 'col1', width: 50, blocks: [] },
            { id: 'col2', width: 50, blocks: [] }
          ] };
        default:
          return '';
      }
    };

    // Default properties based on block type
    const getDefaultProperties = (blockType) => {
      switch (blockType) {
        case 'callout':
          return { variant: 'info' };
        case 'code':
          return { language: 'javascript' };
        default:
          return {};
      }
    };

    const newBlock = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      defaultContent: getDefaultContent(type),
      variants: {},
      properties: getDefaultProperties(type)
    };

    const newBlocks = [...blocks];
    newBlocks.splice(afterIndex + 1, 0, newBlock);
    onChange(newBlocks);
    setEditingBlockId(newBlock.id);
  };

  const updateBlock = (blockId, field, value) => {
    const newBlocks = blocks.map(b =>
      b.id === blockId ? { ...b, [field]: value } : b
    );
    onChange(newBlocks);
  };

  const deleteBlock = (blockId) => {
    const newBlocks = blocks.filter(b => b.id !== blockId);
    onChange(newBlocks);
    if (editingBlockId === blockId) {
      setEditingBlockId(null);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = blocks.findIndex(b => b.id === active.id);
      const newIndex = blocks.findIndex(b => b.id === over.id);
      onChange(arrayMove(blocks, oldIndex, newIndex));
    }
  };

  const hasDropdowns = dropdowns && dropdowns.length > 0;

  return (
    <div className="space-y-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
          {blocks.map((block, index) => (
            <SortableBlock
              key={block.id}
              block={block}
              index={index}
              editingBlockId={editingBlockId}
              setEditingBlockId={setEditingBlockId}
              onUpdateBlock={updateBlock}
              onDeleteBlock={deleteBlock}
              onOpenVariants={onOpenVariants}
              hasDropdowns={hasDropdowns}
              showAddMenu={showAddMenu}
              setShowAddMenu={setShowAddMenu}
              addBlock={addBlock}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Add First Block Button */}
      {blocks.length === 0 && (
        <div className="relative">
          <button
            ref={firstAddButtonRef}
            onClick={() => setShowAddMenu(-1)}
            className="add-block-trigger w-full p-6 border-2 border-dashed border-gray-300 dark:border-neutral-700
              rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
          >
            <Plus size={24} className="mx-auto mb-2" />
            Add your first block
          </button>

          <AnimatePresence>
            {showAddMenu === -1 && (
              <motion.div
                initial={{ opacity: 0, y: firstMenuPosition.direction === 'down' ? -10 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: firstMenuPosition.direction === 'down' ? -10 : 10 }}
                className={`add-block-menu absolute left-1/2 -translate-x-1/2 z-50
                  bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700
                  rounded-lg shadow-lg p-2 w-64 grid grid-cols-2 gap-1 overflow-y-auto
                  ${firstMenuPosition.direction === 'down' ? 'top-full mt-2' : 'bottom-full mb-2'}`}
                style={{ maxHeight: firstMenuPosition.maxHeight }}
              >
                {blockTypeOptions.map(opt => (
                  <button
                    key={opt.type}
                    onClick={() => {
                      addBlock(opt.type, -1);
                      setShowAddMenu(null);
                    }}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm
                      text-gray-700 dark:text-neutral-300 hover:bg-gray-100
                      dark:hover:bg-neutral-800 rounded"
                  >
                    <opt.icon size={14} />
                    {opt.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Quick Add Button at Bottom */}
      {blocks.length > 0 && (
        <div className="relative">
          <button
            ref={bottomAddButtonRef}
            onClick={() => setShowAddMenu('bottom')}
            className="add-block-trigger w-full p-2 text-sm text-gray-500 hover:text-blue-600
              hover:bg-gray-50 dark:hover:bg-neutral-900 rounded-lg transition-colors"
          >
            + Add block
          </button>

          <AnimatePresence>
            {showAddMenu === 'bottom' && (
              <motion.div
                initial={{ opacity: 0, y: bottomMenuPosition.direction === 'down' ? -10 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: bottomMenuPosition.direction === 'down' ? -10 : 10 }}
                className={`add-block-menu absolute left-1/2 -translate-x-1/2 z-50
                  bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700
                  rounded-lg shadow-lg p-2 w-64 grid grid-cols-2 gap-1 overflow-y-auto
                  ${bottomMenuPosition.direction === 'down' ? 'top-full mt-2' : 'bottom-full mb-2'}`}
                style={{ maxHeight: bottomMenuPosition.maxHeight }}
              >
                {blockTypeOptions.map(opt => (
                  <button
                    key={opt.type}
                    onClick={() => {
                      addBlock(opt.type, blocks.length - 1);
                      setShowAddMenu(null);
                    }}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm
                      text-gray-700 dark:text-neutral-300 hover:bg-gray-100
                      dark:hover:bg-neutral-800 rounded"
                  >
                    <opt.icon size={14} />
                    {opt.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default BlockEditor;
