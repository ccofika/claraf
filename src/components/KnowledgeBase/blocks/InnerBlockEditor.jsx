import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, Trash2, Pencil, Check, GripVertical,
  Type, Heading1, Heading2, Heading3, List, ListOrdered,
  ChevronRight, AlertCircle, Quote, Code, Image as ImageIcon,
  Table, Minus, Play, Music, FileText, FileType, Code2, Link,
  FunctionSquare, MousePointer, ListTree, Navigation, RefreshCw,
  Columns, ChevronsDownUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import BlockRenderer from '../BlockRenderer';

// All block types (excludes expandable_content_list to prevent infinite nesting)
const allBlockTypes = [
  { type: 'paragraph', label: 'Paragraph', icon: Type },
  { type: 'heading_1', label: 'Heading 1', icon: Heading1 },
  { type: 'heading_2', label: 'Heading 2', icon: Heading2 },
  { type: 'heading_3', label: 'Heading 3', icon: Heading3 },
  { type: 'bulleted_list', label: 'Bullet List', icon: List },
  { type: 'numbered_list', label: 'Numbered List', icon: ListOrdered },
  { type: 'toggle', label: 'Toggle', icon: ChevronRight },
  { type: 'callout', label: 'Callout', icon: AlertCircle },
  { type: 'quote', label: 'Quote', icon: Quote },
  { type: 'divider', label: 'Divider', icon: Minus },
  { type: 'image', label: 'Image', icon: ImageIcon },
  { type: 'video', label: 'Video', icon: Play },
  { type: 'audio', label: 'Audio', icon: Music },
  { type: 'file', label: 'File', icon: FileText },
  { type: 'pdf', label: 'PDF', icon: FileType },
  { type: 'code', label: 'Code', icon: Code },
  { type: 'embed', label: 'Embed', icon: Code2 },
  { type: 'bookmark', label: 'Bookmark', icon: Link },
  { type: 'table', label: 'Table', icon: Table },
  { type: 'equation', label: 'Equation', icon: FunctionSquare },
  { type: 'button', label: 'Button', icon: MousePointer },
  { type: 'table_of_contents', label: 'Table of Contents', icon: ListTree },
  { type: 'columns', label: 'Columns', icon: Columns },
  { type: 'breadcrumbs', label: 'Breadcrumbs', icon: Navigation },
  { type: 'synced_block', label: 'Synced Block', icon: RefreshCw },
  { type: 'collapsible_heading', label: 'Collapsible Section', icon: ChevronsDownUp },
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
    case 'table_of_contents': return { title: 'Table of Contents', maxDepth: 3, showNumbers: false };
    case 'audio': return { url: '', title: '', caption: '' };
    case 'pdf': return { url: '', title: '', height: 600 };
    case 'file': return { url: '', name: '', size: '', type: '' };
    case 'breadcrumbs': return {};
    case 'synced_block': return { sourcePageId: '', sourceBlockId: '' };
    case 'columns': return { columns: [
      { id: 'col1', width: 50, blocks: [] },
      { id: 'col2', width: 50, blocks: [] }
    ] };
    case 'collapsible_heading': return { title: '', blocks: [] };
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

const createNewBlock = (type) => ({
  id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type,
  defaultContent: getDefaultContent(type),
  variants: {},
  properties: getDefaultProperties(type)
});

// ── Portal menu for adding blocks ──
const AddBlockPortalMenu = ({ anchorRect, onAdd, onClose }) => {
  const menuRef = useRef(null);
  const spaceBelow = window.innerHeight - anchorRect.bottom - 20;
  const spaceAbove = anchorRect.top - 140;
  const menuHeight = 320;
  const openDown = spaceBelow >= menuHeight || spaceBelow >= spaceAbove;

  useEffect(() => {
    const handle = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  const style = {
    position: 'fixed',
    left: anchorRect.left + anchorRect.width / 2,
    transform: 'translateX(-50%)',
    zIndex: 9999,
    ...(openDown
      ? { top: anchorRect.bottom + 8 }
      : { bottom: window.innerHeight - anchorRect.top + 8 }
    ),
  };

  return createPortal(
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, y: openDown ? 8 : -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: openDown ? 8 : -8 }}
      style={style}
      className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700
        rounded-lg shadow-xl p-2 w-64 grid grid-cols-2 gap-1 max-h-[320px] overflow-y-auto"
    >
      {allBlockTypes.map(opt => (
        <button
          key={opt.type}
          onClick={() => onAdd(opt.type)}
          className="flex items-center gap-2 px-2 py-1.5 text-[12px]
            text-gray-700 dark:text-neutral-300 hover:bg-gray-100
            dark:hover:bg-neutral-800 rounded transition-colors text-left"
        >
          <opt.icon size={13} className="flex-shrink-0 text-gray-400 dark:text-neutral-500" />
          {opt.label}
        </button>
      ))}
    </motion.div>,
    document.body
  );
};

// ── Insert line between blocks ──
const InsertLine = ({ onAdd }) => {
  const [menuRect, setMenuRect] = useState(null);

  return (
    <div className="relative group/insert py-0.5 flex items-center justify-center">
      <div className="opacity-0 group-hover/insert:opacity-100 transition-opacity duration-150 flex items-center w-full">
        <div className="flex-1 h-[1.5px] bg-blue-400/50 rounded-full" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            setMenuRect(menuRect ? null : rect);
          }}
          className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 hover:bg-blue-600
            text-white flex items-center justify-center shadow-sm transition-all duration-150 hover:scale-110"
        >
          <Plus size={12} />
        </button>
        <div className="flex-1 h-[1.5px] bg-blue-400/50 rounded-full" />
      </div>
      <AnimatePresence>
        {menuRect && (
          <AddBlockPortalMenu
            anchorRect={menuRect}
            onAdd={(type) => { onAdd(type); setMenuRect(null); }}
            onClose={() => setMenuRect(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Sortable child block ──
const SortableChildBlock = ({ block, isEditing, onToggleEdit, onDelete, onUpdate,
  onExtractBlock, onDeleteBlockFromColumn, onDissolveColumns, onRemoveColumn }) => {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group/child relative">
      {/* Toolbar */}
      <div className={`absolute -top-7 right-0 z-10 flex items-center gap-1 px-1.5 py-0.5
        bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700
        rounded shadow-sm transition-all duration-200
        ${isEditing ? 'opacity-100' : 'opacity-0 group-hover/child:opacity-100'}`}>
        <button
          onClick={onToggleEdit}
          className={`flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium rounded transition-colors
            ${isEditing
              ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
              : 'bg-gray-50 dark:bg-neutral-700 text-gray-600 dark:text-neutral-300'
            }`}
        >
          {isEditing ? <Check size={11} /> : <Pencil size={11} />}
          {isEditing ? 'Done' : 'Edit'}
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium
            bg-gray-50 dark:bg-neutral-700 text-gray-600 dark:text-neutral-300
            rounded hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30
            dark:hover:text-red-400 transition-colors"
        >
          <Trash2 size={11} />
        </button>
      </div>

      {/* Drag handle + content */}
      <div className="flex gap-1 items-start">
        <button
          {...attributes}
          {...listeners}
          className="mt-2 p-0.5 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500
            dark:text-neutral-600 dark:hover:text-neutral-400 opacity-0 group-hover/child:opacity-100
            transition-opacity flex-shrink-0"
        >
          <GripVertical size={14} />
        </button>
        <div className={`flex-1 min-w-0 bg-white dark:bg-neutral-800/50 rounded-lg p-2.5 border transition-colors
          ${isEditing
            ? 'border-blue-300 dark:border-blue-700 ring-1 ring-blue-200 dark:ring-blue-800'
            : 'border-gray-100 dark:border-neutral-700/50 hover:border-gray-200 dark:hover:border-neutral-700'
          }`}>
          <BlockRenderer
            block={block}
            isEditing={isEditing}
            onUpdate={onUpdate}
            onExtractBlock={onExtractBlock}
            onDeleteBlockFromColumn={onDeleteBlockFromColumn}
            onDissolveColumns={onDissolveColumns}
            onRemoveColumn={onRemoveColumn}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Reusable inner block editor with drag-and-drop and insert lines.
 * Used inside CollapsibleHeadingBlock and ExpandableContentListBlock.
 *
 * @param {Array} blocks - Array of child block objects
 * @param {Function} onBlocksChange - Called with the new blocks array on any change
 * @param {string} addButtonLabel - Label for the bottom "add block" button
 */
const InnerBlockEditor = ({ blocks, onBlocksChange, addButtonLabel = 'Add block inside section' }) => {
  const [editingChildId, setEditingChildId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [addMenuRect, setAddMenuRect] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = blocks.findIndex(b => b.id === active.id);
      const newIndex = blocks.findIndex(b => b.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onBlocksChange(arrayMove(blocks, oldIndex, newIndex));
      }
    }
    setActiveId(null);
  }, [blocks, onBlocksChange]);

  const addBlockAt = useCallback((type, afterIndex) => {
    const newBlock = createNewBlock(type);
    const newBlocks = [...blocks];
    newBlocks.splice(afterIndex + 1, 0, newBlock);
    onBlocksChange(newBlocks);
    setEditingChildId(newBlock.id);
  }, [blocks, onBlocksChange]);

  const addBlockAtEnd = useCallback((type) => {
    const newBlock = createNewBlock(type);
    onBlocksChange([...blocks, newBlock]);
    setEditingChildId(newBlock.id);
    setAddMenuRect(null);
  }, [blocks, onBlocksChange]);

  const updateBlock = useCallback((blockId, newContent) => {
    onBlocksChange(blocks.map(b => b.id === blockId ? { ...b, defaultContent: newContent } : b));
  }, [blocks, onBlocksChange]);

  const deleteBlock = useCallback((blockId) => {
    onBlocksChange(blocks.filter(b => b.id !== blockId));
    if (editingChildId === blockId) setEditingChildId(null);
  }, [blocks, onBlocksChange, editingChildId]);

  // ── Columns block management ──

  const extractBlockFromColumns = useCallback((columnsBlockId, childBlockId) => {
    const colsIdx = blocks.findIndex(b => b.id === columnsBlockId);
    if (colsIdx === -1) return;
    const colsBlock = blocks[colsIdx];
    if (!colsBlock.defaultContent?.columns) return;
    let extracted = null;
    const updatedCols = colsBlock.defaultContent.columns.map(col => {
      const child = (col.blocks || []).find(b => b.id === childBlockId);
      if (child) extracted = child;
      return { ...col, blocks: (col.blocks || []).filter(b => b.id !== childBlockId) };
    });
    if (!extracted) return;
    const nonEmpty = updatedCols.filter(c => (c.blocks || []).length > 0);
    const newBlocks = [...blocks];
    if (nonEmpty.length === 0) {
      newBlocks.splice(colsIdx, 1, extracted);
    } else if (nonEmpty.length === 1) {
      newBlocks.splice(colsIdx, 1, ...nonEmpty[0].blocks, extracted);
    } else {
      let finalCols = updatedCols;
      if (updatedCols.length > 2 && nonEmpty.length < updatedCols.length) finalCols = nonEmpty;
      const w = Math.floor(100 / finalCols.length);
      const r = 100 - (w * finalCols.length);
      finalCols = finalCols.map((c, i) => ({ ...c, width: w + (i === 0 ? r : 0) }));
      newBlocks[colsIdx] = { ...colsBlock, defaultContent: { columns: finalCols } };
      newBlocks.splice(colsIdx + 1, 0, extracted);
    }
    onBlocksChange(newBlocks);
  }, [blocks, onBlocksChange]);

  const deleteBlockFromColumns = useCallback((columnsBlockId, childBlockId) => {
    const colsIdx = blocks.findIndex(b => b.id === columnsBlockId);
    if (colsIdx === -1) return;
    const colsBlock = blocks[colsIdx];
    if (!colsBlock.defaultContent?.columns) return;
    const updatedCols = colsBlock.defaultContent.columns.map(col => ({
      ...col, blocks: (col.blocks || []).filter(b => b.id !== childBlockId)
    }));
    const nonEmpty = updatedCols.filter(c => (c.blocks || []).length > 0);
    const newBlocks = [...blocks];
    if (nonEmpty.length === 0) {
      newBlocks.splice(colsIdx, 1);
    } else if (nonEmpty.length === 1) {
      newBlocks.splice(colsIdx, 1, ...nonEmpty[0].blocks);
    } else {
      let finalCols = updatedCols;
      if (updatedCols.length > 2 && nonEmpty.length < updatedCols.length) finalCols = nonEmpty;
      const w = Math.floor(100 / finalCols.length);
      const r = 100 - (w * finalCols.length);
      finalCols = finalCols.map((c, i) => ({ ...c, width: w + (i === 0 ? r : 0) }));
      newBlocks[colsIdx] = { ...colsBlock, defaultContent: { columns: finalCols } };
    }
    onBlocksChange(newBlocks);
    if (editingChildId === childBlockId) setEditingChildId(null);
  }, [blocks, onBlocksChange, editingChildId]);

  const dissolveColumns = useCallback((columnsBlockId) => {
    const colsIdx = blocks.findIndex(b => b.id === columnsBlockId);
    if (colsIdx === -1) return;
    const colsBlock = blocks[colsIdx];
    const allChildren = (colsBlock.defaultContent?.columns || []).flatMap(c => c.blocks || []);
    const newBlocks = [...blocks];
    newBlocks.splice(colsIdx, 1, ...allChildren);
    onBlocksChange(newBlocks);
  }, [blocks, onBlocksChange]);

  const removeColumnFromColumns = useCallback((columnsBlockId, colIndex) => {
    const colsIdx = blocks.findIndex(b => b.id === columnsBlockId);
    if (colsIdx === -1) return;
    const colsBlock = blocks[colsIdx];
    const columns = colsBlock.defaultContent?.columns;
    if (!columns) return;
    const removedCol = columns[colIndex];
    const extractedBlocks = removedCol?.blocks || [];
    if (columns.length <= 2) {
      const allBlocks = columns.flatMap(c => c.blocks || []);
      const newBlocks = [...blocks];
      if (allBlocks.length > 0) {
        newBlocks.splice(colsIdx, 1, ...allBlocks);
      } else {
        newBlocks.splice(colsIdx, 1);
      }
      onBlocksChange(newBlocks);
      return;
    }
    const newCols = columns.filter((_, i) => i !== colIndex).map(c => ({ ...c }));
    const w = Math.floor(100 / newCols.length);
    const r = 100 - (w * newCols.length);
    newCols.forEach((col, i) => { col.width = w + (i === 0 ? r : 0); });
    const newBlocks = [...blocks];
    newBlocks[colsIdx] = { ...colsBlock, defaultContent: { columns: newCols } };
    if (extractedBlocks.length > 0) {
      newBlocks.splice(colsIdx + 1, 0, ...extractedBlocks);
    }
    onBlocksChange(newBlocks);
  }, [blocks, onBlocksChange]);

  return (
    <div className="space-y-1">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
          {blocks.map((child, index) => (
            <React.Fragment key={child.id}>
              {/* Insert line before first block */}
              {index === 0 && !activeId && (
                <InsertLine onAdd={(type) => addBlockAt(type, -1)} />
              )}
              <SortableChildBlock
                block={child}
                isEditing={editingChildId === child.id}
                onToggleEdit={() => setEditingChildId(editingChildId === child.id ? null : child.id)}
                onDelete={() => deleteBlock(child.id)}
                onUpdate={(newContent) => updateBlock(child.id, newContent)}
                onExtractBlock={(childBlockId) => extractBlockFromColumns(child.id, childBlockId)}
                onDeleteBlockFromColumn={(childBlockId) => deleteBlockFromColumns(child.id, childBlockId)}
                onDissolveColumns={() => dissolveColumns(child.id)}
                onRemoveColumn={(colIndex) => removeColumnFromColumns(child.id, colIndex)}
              />
              {/* Insert line between blocks */}
              {index < blocks.length - 1 && !activeId && (
                <InsertLine onAdd={(type) => addBlockAt(type, index)} />
              )}
            </React.Fragment>
          ))}
        </SortableContext>
      </DndContext>

      {/* Add block at end */}
      <button
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setAddMenuRect(addMenuRect ? null : rect);
        }}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-3
          border-2 border-dashed border-gray-300 dark:border-neutral-600
          rounded-lg text-[13px] text-gray-500 dark:text-neutral-400
          hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-600
          dark:hover:text-blue-400 transition-colors"
      >
        <Plus size={14} />
        {addButtonLabel}
      </button>
      <AnimatePresence>
        {addMenuRect && (
          <AddBlockPortalMenu
            anchorRect={addMenuRect}
            onAdd={addBlockAtEnd}
            onClose={() => setAddMenuRect(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default InnerBlockEditor;
