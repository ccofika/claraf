import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, GripVertical, Type, Heading1, Heading2, Heading3,
  List, ListOrdered, ChevronRight, AlertCircle, Quote, Code,
  Image as ImageIcon, Table, Minus, Settings
} from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import BlockRenderer from '../BlockRenderer';

const blockTypeOptions = [
  { type: 'paragraph', label: 'Paragraph', icon: Type },
  { type: 'heading_1', label: 'Heading 1', icon: Heading1 },
  { type: 'heading_2', label: 'Heading 2', icon: Heading2 },
  { type: 'heading_3', label: 'Heading 3', icon: Heading3 },
  { type: 'bulleted_list', label: 'Bullet List', icon: List },
  { type: 'numbered_list', label: 'Numbered List', icon: ListOrdered },
  { type: 'toggle', label: 'Toggle', icon: ChevronRight },
  { type: 'callout', label: 'Callout', icon: AlertCircle },
  { type: 'quote', label: 'Quote', icon: Quote },
  { type: 'code', label: 'Code', icon: Code },
  { type: 'image', label: 'Image', icon: ImageIcon },
  { type: 'table', label: 'Table', icon: Table },
  { type: 'divider', label: 'Divider', icon: Minus }
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

  return (
    <div ref={setNodeRef} style={style} className="group relative mb-2">
      {/* Block Controls - Left Side */}
      <div className="absolute -left-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
        <button
          {...attributes}
          {...listeners}
          className="p-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <GripVertical size={14} />
        </button>
        <button
          onClick={() => setShowAddMenu(showAddMenu === index ? null : index)}
          className="p-1 text-gray-400 hover:text-blue-600"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Add Block Menu */}
      <AnimatePresence>
        {showAddMenu === index && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 top-full mt-1 z-50 bg-white dark:bg-neutral-900
              border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg p-1 w-48"
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
      <div className="relative bg-gray-50 dark:bg-neutral-900 rounded-lg p-3 border border-transparent
        hover:border-gray-200 dark:hover:border-neutral-700 transition-colors">

        <BlockRenderer
          block={block}
          isEditing={editingBlockId === block.id}
          onUpdate={(content) => onUpdateBlock(block.id, 'defaultContent', content)}
        />

        {/* Block Actions - Right Side */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100
          transition-opacity flex items-center gap-1">

          {hasDropdowns && (
            <button
              onClick={() => onOpenVariants(block)}
              className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30
                text-purple-600 dark:text-purple-400 rounded hover:bg-purple-200
                dark:hover:bg-purple-900/50"
              title="Edit variants"
            >
              Variants
            </button>
          )}

          <button
            onClick={() => setEditingBlockId(editingBlockId === block.id ? null : block.id)}
            className="p-1 text-gray-400 hover:text-blue-600"
            title={editingBlockId === block.id ? 'Done editing' : 'Edit'}
          >
            {editingBlockId === block.id ? 'Done' : 'Edit'}
          </button>

          <button
            onClick={() => onDeleteBlock(block.id)}
            className="p-1 text-gray-400 hover:text-red-600"
            title="Delete block"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

const BlockEditor = ({ blocks = [], onChange, dropdowns = [], onOpenVariants }) => {
  const [editingBlockId, setEditingBlockId] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5
      }
    })
  );

  const addBlock = (type, afterIndex) => {
    const newBlock = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      defaultContent: type === 'table' ? { headers: ['Column 1', 'Column 2'], rows: [['', '']] } :
                       type === 'toggle' ? { title: '', body: '' } :
                       type === 'callout' ? { text: '' } :
                       type === 'code' ? { code: '', language: '' } :
                       type === 'image' ? { url: '', alt: '', caption: '' } :
                       '',
      variants: {},
      properties: type === 'callout' ? { variant: 'info' } :
                  type === 'code' ? { language: 'javascript' } :
                  {}
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
            onClick={() => setShowAddMenu(-1)}
            className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-neutral-700
              rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
          >
            <Plus size={24} className="mx-auto mb-2" />
            Add your first block
          </button>

          <AnimatePresence>
            {showAddMenu === -1 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50
                  bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700
                  rounded-lg shadow-lg p-2 w-56 grid grid-cols-2 gap-1"
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
            onClick={() => setShowAddMenu('bottom')}
            className="w-full p-2 text-sm text-gray-500 hover:text-blue-600
              hover:bg-gray-50 dark:hover:bg-neutral-900 rounded-lg transition-colors"
          >
            + Add block
          </button>

          <AnimatePresence>
            {showAddMenu === 'bottom' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50
                  bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700
                  rounded-lg shadow-lg p-2 w-56 grid grid-cols-2 gap-1"
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
