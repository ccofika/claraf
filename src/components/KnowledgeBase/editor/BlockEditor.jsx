import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, GripVertical, Type, Heading1, Heading2, Heading3,
  List, ListOrdered, ChevronRight, AlertCircle, Quote, Code,
  Image as ImageIcon, Table, Minus, Settings, Pencil, Check, AlertTriangle,
  Play, Code2, Link, FileText, FunctionSquare, MousePointer, ListTree,
  Music, FileType, Navigation, RefreshCw, Columns, ChevronsDownUp, Palette, Copy,
  ArrowUp, ArrowDown, Replace, AlignCenter, AlignLeft, AlignRight, Maximize
} from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
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
      const navBarHeight = 140;

      const spaceAbove = triggerRect.top - navBarHeight;
      const spaceBelow = viewportHeight - triggerRect.bottom - 20;

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
  { type: 'synced_block', label: 'Synced Block', icon: RefreshCw, category: 'advanced' },
  { type: 'collapsible_heading', label: 'Collapsible Section', icon: ChevronsDownUp, category: 'advanced' },
  { type: 'expandable_content_list', label: 'Expandable List', icon: ListTree, category: 'advanced' }
];

// Side menu options - no nested columns
const sideBlockOptions = blockTypeOptions.filter(o => o.type !== 'columns' && o.type !== 'expandable_content_list');

// Block background color options
const blockBgColorOptions = [
  { key: '', label: 'None', swatch: 'bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-600' },
  { key: 'blue', label: 'Blue', swatch: 'bg-blue-200 dark:bg-blue-800 border-blue-300 dark:border-blue-700' },
  { key: 'green', label: 'Green', swatch: 'bg-emerald-200 dark:bg-emerald-800 border-emerald-300 dark:border-emerald-700' },
  { key: 'yellow', label: 'Yellow', swatch: 'bg-amber-200 dark:bg-amber-800 border-amber-300 dark:border-amber-700' },
  { key: 'red', label: 'Red', swatch: 'bg-red-200 dark:bg-red-800 border-red-300 dark:border-red-700' },
  { key: 'purple', label: 'Purple', swatch: 'bg-purple-200 dark:bg-purple-800 border-purple-300 dark:border-purple-700' },
  { key: 'gray', label: 'Gray', swatch: 'bg-gray-300 dark:bg-neutral-600 border-gray-400 dark:border-neutral-500' },
  { key: 'orange', label: 'Orange', swatch: 'bg-orange-200 dark:bg-orange-800 border-orange-300 dark:border-orange-700' },
  { key: 'pink', label: 'Pink', swatch: 'bg-pink-200 dark:bg-pink-800 border-pink-300 dark:border-pink-700' },
];

// Block width options
const blockWidthOptions = [
  { key: '', label: 'Default', icon: AlignCenter },
  { key: 'narrow', label: 'Narrow', icon: AlignLeft },
  { key: 'wide', label: 'Wide', icon: AlignRight },
  { key: 'full', label: 'Full', icon: Maximize },
];

// Extracted helpers for reuse
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
    case 'file': return { url: '', name: '', size: '', type: '' };
    case 'equation': return { latex: '', displayMode: true };
    case 'button': return { label: 'Click me', action: 'link', url: '', copyText: '', style: 'primary', align: 'left' };
    case 'table_of_contents': return { title: 'Table of Contents', maxDepth: 3, showNumbers: false };
    case 'audio': return { url: '', title: '', caption: '' };
    case 'pdf': return { url: '', title: '', height: 600 };
    case 'breadcrumbs': return {};
    case 'synced_block': return { sourcePageId: '', sourceBlockId: '' };
    case 'columns': return { columns: [
      { id: 'col1', width: 50, blocks: [] },
      { id: 'col2', width: 50, blocks: [] }
    ] };
    case 'collapsible_heading': return { title: '', blocks: [] };
    case 'expandable_content_list': return { entries: [{ id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, title: 'First Entry', blocks: [] }], sortMode: 'manual' };
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

// Side add menu rendered via portal for proper z-index and no overflow clipping
const SideAddMenu = ({ isOpen, blockId, side, anchorRef, onAdd, onClose }) => {
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (!isOpen || !anchorRef?.current) { setPos(null); return; }

    const calculate = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const menuW = 240;
      const menuH = 340;

      // Vertical: prefer below the button, fallback above
      const spaceBelow = vh - rect.bottom - 12;
      const goUp = spaceBelow < menuH && rect.top > spaceBelow;
      const top = goUp ? Math.max(8, rect.top - menuH - 4) : rect.bottom + 4;
      const maxH = goUp ? rect.top - 12 : spaceBelow;

      // Horizontal: center on button, clamp to viewport
      let left = rect.left + rect.width / 2 - menuW / 2;
      left = Math.max(8, Math.min(left, vw - menuW - 8));

      setPos({ top, left, maxH: Math.min(maxH, menuH) });
    };

    calculate();
    window.addEventListener('scroll', calculate, true);
    window.addEventListener('resize', calculate);
    return () => {
      window.removeEventListener('scroll', calculate, true);
      window.removeEventListener('resize', calculate);
    };
  }, [isOpen, anchorRef]);

  if (!isOpen || !pos) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.12 }}
      className="add-block-menu fixed z-[99990] bg-white dark:bg-neutral-900
        border border-gray-200 dark:border-neutral-700 rounded-lg shadow-xl p-2 w-60
        grid grid-cols-2 gap-1 overflow-y-auto"
      style={{ top: pos.top, left: pos.left, maxHeight: pos.maxH }}
    >
      <div className="col-span-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
        Add to {side}
      </div>
      {sideBlockOptions.map(opt => (
        <button
          key={opt.type}
          onClick={() => onAdd(opt.type)}
          className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 dark:text-neutral-300
            hover:bg-gray-100 dark:hover:bg-neutral-800 rounded"
        >
          <opt.icon size={14} />
          {opt.label}
        </button>
      ))}
    </motion.div>,
    document.body
  );
};

const SortableBlock = ({
  block, index, totalBlocks, editingBlockId, setEditingBlockId,
  onUpdateBlock, onRequestDelete, onOpenVariants, hasDropdowns,
  showAddMenu, setShowAddMenu, addBlock,
  activeId, sideDropTarget, onAddToSide,
  onExtractFromColumns, onDeleteFromColumns, onDissolveColumns, onRemoveColumnFromColumns,
  onDuplicateBlock, onUpdateProperties, onConvertBlock, onCreateBlockBelow, onDeleteEmptyBlock,
  onMoveBlock
}) => {
  const addButtonRef = useRef(null);
  const sideLeftRef = useRef(null);
  const sideRightRef = useRef(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTurnInto, setShowTurnInto] = useState(false);
  const [showWidthPicker, setShowWidthPicker] = useState(false);
  const [turnIntoFilter, setTurnIntoFilter] = useState('');
  const turnIntoRef = useRef(null);
  const menuPosition = useSmartPosition(showAddMenu === index, addButtonRef, 350);

  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    position: 'relative',
    zIndex: isDragging ? 0 : 1,
  };

  const isEditing = editingBlockId === block.id;
  const isDragActive = !!activeId;
  const isSideDropLeft = !isDragging && activeId && activeId !== block.id
    && sideDropTarget?.blockId === block.id && sideDropTarget?.side === 'left';
  const isSideDropRight = !isDragging && activeId && activeId !== block.id
    && sideDropTarget?.blockId === block.id && sideDropTarget?.side === 'right';

  return (
    <div ref={setNodeRef} style={style} data-block-id={block.id} className="group relative mb-3">
      {/* Block Actions - Floating toolbar above block */}
      <div className={`absolute -top-8 right-0 z-10 flex items-center gap-0.5 px-1 py-0.5
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
            <Settings size={11} />
            Variants
          </button>
        )}

        <button
          onClick={() => setEditingBlockId(isEditing ? null : block.id)}
          className={`flex items-center gap-1 px-1.5 py-1 text-[11px] font-medium rounded transition-colors
            ${isEditing
              ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50'
              : 'bg-gray-50 dark:bg-neutral-700 text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-600'
            }`}
          title={isEditing ? 'Done editing' : 'Edit block'}
        >
          {isEditing ? <Check size={11} /> : <Pencil size={11} />}
          {isEditing ? 'Done' : 'Edit'}
        </button>

        {/* Turn into... */}
        <div className="relative">
          <button
            onClick={() => { setShowTurnInto(!showTurnInto); setShowColorPicker(false); setShowWidthPicker(false); setTurnIntoFilter(''); }}
            className="p-1 text-[11px] font-medium rounded transition-colors
              bg-gray-50 dark:bg-neutral-700 text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-600"
            title="Turn into..."
          >
            <Replace size={11} />
          </button>
          {showTurnInto && (
            <div ref={turnIntoRef} className="absolute bottom-full mb-2 right-0 z-50 bg-white dark:bg-neutral-900
              border border-gray-200 dark:border-neutral-700 rounded-xl shadow-2xl w-[220px] overflow-hidden">
              <div className="p-2 border-b border-gray-100 dark:border-neutral-800">
                <input
                  autoFocus
                  value={turnIntoFilter}
                  onChange={(e) => setTurnIntoFilter(e.target.value)}
                  placeholder="Filter..."
                  className="w-full px-2 py-1 text-[12px] bg-gray-50 dark:bg-neutral-800
                    border border-gray-200 dark:border-neutral-700 rounded-md
                    focus:outline-none focus:ring-1 focus:ring-blue-500
                    text-gray-700 dark:text-neutral-300 placeholder-gray-400"
                />
              </div>
              <div className="max-h-[280px] overflow-y-auto py-1">
                {blockTypeOptions
                  .filter(opt => opt.type !== block.type)
                  .filter(opt => !turnIntoFilter || opt.label.toLowerCase().includes(turnIntoFilter.toLowerCase()))
                  .map(opt => (
                    <button
                      key={opt.type}
                      onClick={() => {
                        onConvertBlock(block.id, opt.type);
                        setShowTurnInto(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px]
                        text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <opt.icon size={13} className="shrink-0 text-gray-400 dark:text-neutral-500" />
                      <span>{opt.label}</span>
                    </button>
                  ))
                }
              </div>
            </div>
          )}
        </div>

        {/* Style (bg color) button */}
        <div className="relative">
          <button
            onClick={() => { setShowColorPicker(!showColorPicker); setShowTurnInto(false); setShowWidthPicker(false); }}
            className={`p-1 text-[11px] font-medium rounded transition-colors
              ${block.properties?.bgColor
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'bg-gray-50 dark:bg-neutral-700 text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-600'
              }`}
            title="Background color"
          >
            <Palette size={11} />
          </button>
          {showColorPicker && (
            <div className="absolute bottom-full mb-2 right-0 z-50 bg-white dark:bg-neutral-800
              border border-gray-200 dark:border-neutral-700 rounded-xl shadow-2xl p-3 w-[220px]">
              <div className="text-[10px] font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                Background
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {blockBgColorOptions.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => {
                      onUpdateProperties(block.id, { ...block.properties, bgColor: opt.key });
                      setShowColorPicker(false);
                    }}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all
                      ${(block.properties?.bgColor || '') === opt.key
                        ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-neutral-800 bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-neutral-700'
                      }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded border shrink-0 ${opt.swatch}`} />
                    <span className="text-gray-700 dark:text-neutral-300 truncate">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Block width */}
        <div className="relative">
          <button
            onClick={() => { setShowWidthPicker(!showWidthPicker); setShowColorPicker(false); setShowTurnInto(false); }}
            className={`p-1 text-[11px] font-medium rounded transition-colors
              ${block.properties?.width
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'bg-gray-50 dark:bg-neutral-700 text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-600'
              }`}
            title="Block width"
          >
            <Maximize size={11} />
          </button>
          {showWidthPicker && (
            <div className="absolute bottom-full mb-2 right-0 z-50 bg-white dark:bg-neutral-800
              border border-gray-200 dark:border-neutral-700 rounded-xl shadow-2xl p-2 w-[160px]">
              <div className="text-[10px] font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5 px-1">
                Width
              </div>
              {blockWidthOptions.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => {
                    onUpdateProperties(block.id, { ...block.properties, width: opt.key });
                    setShowWidthPicker(false);
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] font-medium transition-all
                    ${(block.properties?.width || '') === opt.key
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700'
                    }`}
                >
                  <opt.icon size={13} className="shrink-0" />
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-gray-200 dark:bg-neutral-700 mx-0.5" />

        {/* Move up/down */}
        <button
          onClick={() => onMoveBlock(index, -1)}
          disabled={index === 0}
          className="p-1 text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200
            disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
          title="Move up"
        >
          <ArrowUp size={11} />
        </button>
        <button
          onClick={() => onMoveBlock(index, 1)}
          disabled={index === totalBlocks - 1}
          className="p-1 text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200
            disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
          title="Move down"
        >
          <ArrowDown size={11} />
        </button>

        {/* Duplicate */}
        <button
          onClick={() => onDuplicateBlock(block, index)}
          className="p-1 text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200
            rounded hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
          title="Duplicate block"
        >
          <Copy size={11} />
        </button>

        {/* Delete */}
        <button
          onClick={() => onRequestDelete(block.id)}
          className="p-1 text-gray-500 dark:text-neutral-400
            rounded hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30
            dark:hover:text-red-400 transition-colors"
          title="Delete block"
        >
          <Trash2 size={11} />
        </button>
      </div>

      {/* Block Controls - Left Side (grip + add below) */}
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

      {/* Add Block Menu (below via left toolbar) */}
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

      {/* ===== LEFT SIDE ADD ZONE - visible on hover, md+ only, hidden during drag ===== */}
      {!isDragActive && (
        <div
          className="hidden md:flex absolute left-0 top-0 bottom-0 w-7 -ml-0.5 z-20
            items-center justify-center pointer-events-none"
        >
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
            <button
              ref={sideLeftRef}
              onClick={(e) => {
                e.stopPropagation();
                setShowAddMenu(showAddMenu === `side_left_${block.id}` ? null : `side_left_${block.id}`);
              }}
              className="add-block-trigger w-5 h-5 rounded-full bg-blue-500/80 hover:bg-blue-600
                text-white flex items-center justify-center shadow-md
                transition-all duration-150 hover:scale-110"
              title="Add block to the left"
            >
              <Plus size={10} />
            </button>
          </div>
        </div>
      )}

      {/* Left side menu (portal) */}
      <AnimatePresence>
        <SideAddMenu
          isOpen={showAddMenu === `side_left_${block.id}`}
          blockId={block.id}
          side="left"
          anchorRef={sideLeftRef}
          onAdd={(type) => { onAddToSide(type, block.id, 'left'); setShowAddMenu(null); }}
          onClose={() => setShowAddMenu(null)}
        />
      </AnimatePresence>

      {/* ===== RIGHT SIDE ADD ZONE - visible on hover, md+ only, hidden during drag ===== */}
      {!isDragActive && (
        <div
          className="hidden md:flex absolute right-0 top-0 bottom-0 w-7 -mr-0.5 z-20
            items-center justify-center pointer-events-none"
        >
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
            <button
              ref={sideRightRef}
              onClick={(e) => {
                e.stopPropagation();
                setShowAddMenu(showAddMenu === `side_right_${block.id}` ? null : `side_right_${block.id}`);
              }}
              className="add-block-trigger w-5 h-5 rounded-full bg-blue-500/80 hover:bg-blue-600
                text-white flex items-center justify-center shadow-md
                transition-all duration-150 hover:scale-110"
              title="Add block to the right"
            >
              <Plus size={10} />
            </button>
          </div>
        </div>
      )}

      {/* Right side menu (portal) */}
      <AnimatePresence>
        <SideAddMenu
          isOpen={showAddMenu === `side_right_${block.id}`}
          blockId={block.id}
          side="right"
          anchorRef={sideRightRef}
          onAdd={(type) => { onAddToSide(type, block.id, 'right'); setShowAddMenu(null); }}
          onClose={() => setShowAddMenu(null)}
        />
      </AnimatePresence>

      {/* ===== DRAG SIDE DROP INDICATORS ===== */}
      <AnimatePresence>
        {isSideDropLeft && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0.5 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.5 }}
            className="absolute left-0 top-1 bottom-1 w-1.5 bg-blue-500 rounded-full z-30
              shadow-[0_0_10px_rgba(59,130,246,0.6)]"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isSideDropRight && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0.5 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.5 }}
            className="absolute right-0 top-1 bottom-1 w-1.5 bg-blue-500 rounded-full z-30
              shadow-[0_0_10px_rgba(59,130,246,0.6)]"
          />
        )}
      </AnimatePresence>

      {/* Block Content */}
      <div className={`relative bg-gray-50 dark:bg-neutral-900 rounded-lg p-3 border transition-colors
        ${isEditing
          ? 'border-blue-300 dark:border-blue-700 ring-1 ring-blue-200 dark:ring-blue-800'
          : isSideDropLeft || isSideDropRight
            ? 'border-blue-400 dark:border-blue-600 bg-blue-50/30 dark:bg-blue-950/20'
            : 'border-transparent hover:border-gray-200 dark:hover:border-neutral-700'
        }`}>

        <BlockRenderer
          block={block}
          isEditing={isEditing}
          onUpdate={(content) => onUpdateBlock(block.id, 'defaultContent', content)}
          onExtractBlock={(childBlockId) => onExtractFromColumns?.(block.id, childBlockId)}
          onDeleteBlockFromColumn={(childBlockId) => onDeleteFromColumns?.(block.id, childBlockId)}
          onDissolveColumns={() => onDissolveColumns?.(block.id)}
          onRemoveColumn={(colIndex) => onRemoveColumnFromColumns?.(block.id, colIndex)}
          onConvertBlock={(type) => onConvertBlock?.(block.id, type)}
          onCreateBlockBelow={() => onCreateBlockBelow?.(block.id)}
          onDeleteEmptyBlock={() => onDeleteEmptyBlock?.(block.id)}
        />
      </div>
    </div>
  );
};

// Hover-activated insert line between blocks
const InsertBlockLine = ({ showMenu, onToggleMenu, onAdd }) => {
  const buttonRef = useRef(null);
  const menuPosition = useSmartPosition(showMenu, buttonRef, 350);

  return (
    <div className="relative group/insert py-0.5 flex items-center justify-center">
      {/* Line + Button - visible on hover */}
      <div className="opacity-0 group-hover/insert:opacity-100 transition-opacity duration-150 flex items-center w-full">
        <div className="flex-1 h-[1.5px] bg-blue-400/50 rounded-full" />
        <button
          ref={buttonRef}
          onClick={(e) => { e.stopPropagation(); onToggleMenu(); }}
          className="add-block-trigger flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 hover:bg-blue-600
            text-white flex items-center justify-center shadow-sm transition-all duration-150 hover:scale-110"
        >
          <Plus size={12} />
        </button>
        <div className="flex-1 h-[1.5px] bg-blue-400/50 rounded-full" />
      </div>

      {/* Block type menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: menuPosition.direction === 'down' ? -8 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: menuPosition.direction === 'down' ? -8 : 8 }}
            className={`add-block-menu absolute left-1/2 -translate-x-1/2 z-50
              bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700
              rounded-lg shadow-lg p-2 w-64 grid grid-cols-2 gap-1 overflow-y-auto
              ${menuPosition.direction === 'down' ? 'top-full mt-1' : 'bottom-full mb-1'}`}
            style={{ maxHeight: menuPosition.maxHeight }}
          >
            {blockTypeOptions.map(opt => (
              <button
                key={opt.type}
                onClick={() => onAdd(opt.type)}
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
  );
};

const BlockEditor = ({ blocks = [], onChange, dropdowns = [], onOpenVariants }) => {
  const [editingBlockId, setEditingBlockId] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [sideDropTarget, setSideDropTarget] = useState(null);
  const firstAddButtonRef = useRef(null);
  const bottomAddButtonRef = useRef(null);

  // ─── Undo / Redo history ────────────────────────
  const historyRef = useRef([JSON.stringify(blocks)]);
  const historyIndexRef = useRef(0);
  const isUndoRedoRef = useRef(false); // guard to skip pushing during undo/redo

  // Push state to history whenever blocks change (debounced to avoid flooding)
  const pushTimerRef = useRef(null);
  useEffect(() => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      const snapshot = JSON.stringify(blocks);
      const history = historyRef.current;
      const idx = historyIndexRef.current;
      if (snapshot !== history[idx]) {
        // Truncate any forward history
        historyRef.current = history.slice(0, idx + 1);
        historyRef.current.push(snapshot);
        // Cap at 50 entries
        if (historyRef.current.length > 50) historyRef.current.shift();
        historyIndexRef.current = historyRef.current.length - 1;
      }
    }, 500);
    return () => { if (pushTimerRef.current) clearTimeout(pushTimerRef.current); };
  }, [blocks]);

  // Keyboard handler for Ctrl+Z / Ctrl+Shift+Z
  useEffect(() => {
    const handleUndoRedo = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      if (e.key === 'z' || e.key === 'Z') {
        if (e.shiftKey) {
          // Redo
          e.preventDefault();
          const history = historyRef.current;
          const idx = historyIndexRef.current;
          if (idx < history.length - 1) {
            historyIndexRef.current = idx + 1;
            isUndoRedoRef.current = true;
            onChange(JSON.parse(history[idx + 1]));
          }
        } else {
          // Undo
          e.preventDefault();
          const history = historyRef.current;
          const idx = historyIndexRef.current;
          if (idx > 0) {
            historyIndexRef.current = idx - 1;
            isUndoRedoRef.current = true;
            onChange(JSON.parse(history[idx - 1]));
          }
        }
      }
    };
    document.addEventListener('keydown', handleUndoRedo);
    return () => document.removeEventListener('keydown', handleUndoRedo);
  }, [onChange]);

  const firstMenuPosition = useSmartPosition(showAddMenu === -1, firstAddButtonRef, 400);
  const bottomMenuPosition = useSmartPosition(showAddMenu === 'bottom', bottomAddButtonRef, 400);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }
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

  // Pointer tracking during drag for side-drop detection
  useEffect(() => {
    if (!activeId) {
      setSideDropTarget(null);
      return;
    }

    const handlePointerMove = (e) => {
      // Find the block element under the pointer (elementFromPoint sees through pointer-events:none overlay)
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const blockEl = target?.closest?.('[data-block-id]');

      if (!blockEl || blockEl.dataset.blockId === activeId) {
        setSideDropTarget(null);
        return;
      }

      const rect = blockEl.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const width = rect.width;
      // Edge zone: 18% of width, capped at 90px for very wide blocks
      const edgeZone = Math.min(width * 0.18, 90);

      if (relativeX < edgeZone) {
        setSideDropTarget({ blockId: blockEl.dataset.blockId, side: 'left' });
      } else if (relativeX > width - edgeZone) {
        setSideDropTarget({ blockId: blockEl.dataset.blockId, side: 'right' });
      } else {
        setSideDropTarget(null);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [activeId]);

  // Add a block below (existing behavior)
  const addBlock = useCallback((type, afterIndex) => {
    const newBlock = createNewBlock(type);
    const newBlocks = [...blocks];
    newBlocks.splice(afterIndex + 1, 0, newBlock);
    onChange(newBlocks);
    setEditingBlockId(newBlock.id);
  }, [blocks, onChange]);

  // Add a new block to the side of an existing block (creates/extends columns)
  const addBlockToSide = useCallback((type, targetBlockId, side) => {
    const targetBlock = blocks.find(b => b.id === targetBlockId);
    if (!targetBlock) return;

    const newBlock = createNewBlock(type);

    if (targetBlock.type === 'columns' && targetBlock.defaultContent?.columns) {
      // Add column to existing columns block
      const existingCols = targetBlock.defaultContent.columns.map(c => ({ ...c }));
      if (existingCols.length >= 5) return;

      const newCol = { id: `col_${Date.now()}`, width: 0, blocks: [newBlock] };
      if (side === 'left') {
        existingCols.unshift(newCol);
      } else {
        existingCols.push(newCol);
      }

      // Redistribute widths evenly
      const colWidth = Math.floor(100 / existingCols.length);
      const remainder = 100 - (colWidth * existingCols.length);
      existingCols.forEach((col, i) => { col.width = colWidth + (i === 0 ? remainder : 0); });

      const updatedBlock = { ...targetBlock, defaultContent: { columns: existingCols } };
      onChange(blocks.map(b => b.id === targetBlockId ? updatedBlock : b));
    } else {
      // Wrap target + new block in a columns block
      const leftBlock = side === 'left' ? newBlock : targetBlock;
      const rightBlock = side === 'left' ? targetBlock : newBlock;

      const columnsBlock = {
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'columns',
        defaultContent: {
          columns: [
            { id: `col_${Date.now()}_l`, width: 50, blocks: [leftBlock] },
            { id: `col_${Date.now()}_r`, width: 50, blocks: [rightBlock] }
          ]
        },
        variants: {},
        properties: {}
      };

      onChange(blocks.map(b => b.id === targetBlockId ? columnsBlock : b));
    }

    setEditingBlockId(newBlock.id);
  }, [blocks, onChange]);

  // Merge two existing blocks side by side (drag-to-side)
  const mergeBlocksSideBySide = useCallback((draggedBlockId, targetBlockId, side) => {
    const draggedBlock = blocks.find(b => b.id === draggedBlockId);
    const targetBlock = blocks.find(b => b.id === targetBlockId);
    if (!draggedBlock || !targetBlock || draggedBlockId === targetBlockId) return;

    let newColumnsBlock;

    if (targetBlock.type === 'columns' && targetBlock.defaultContent?.columns) {
      // Add to existing columns block
      const existingCols = targetBlock.defaultContent.columns.map(c => ({ ...c }));
      if (existingCols.length >= 5) return;

      const newCol = { id: `col_${Date.now()}`, width: 0, blocks: [draggedBlock] };
      if (side === 'left') {
        existingCols.unshift(newCol);
      } else {
        existingCols.push(newCol);
      }

      const colWidth = Math.floor(100 / existingCols.length);
      const remainder = 100 - (colWidth * existingCols.length);
      existingCols.forEach((col, i) => { col.width = colWidth + (i === 0 ? remainder : 0); });

      newColumnsBlock = { ...targetBlock, defaultContent: { columns: existingCols } };
    } else {
      const leftBlock = side === 'left' ? draggedBlock : targetBlock;
      const rightBlock = side === 'left' ? targetBlock : draggedBlock;

      newColumnsBlock = {
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'columns',
        defaultContent: {
          columns: [
            { id: `col_${Date.now()}_l`, width: 50, blocks: [leftBlock] },
            { id: `col_${Date.now()}_r`, width: 50, blocks: [rightBlock] }
          ]
        },
        variants: {},
        properties: {}
      };
    }

    // Remove dragged block and replace target with the columns block
    const newBlocks = blocks
      .filter(b => b.id !== draggedBlockId)
      .map(b => b.id === targetBlockId ? newColumnsBlock : b);

    onChange(newBlocks);
  }, [blocks, onChange]);

  // --- Columns block management callbacks ---

  const extractBlockFromColumns = useCallback((columnsBlockId, childBlockId) => {
    const columnsIndex = blocks.findIndex(b => b.id === columnsBlockId);
    if (columnsIndex === -1) return;
    const columnsBlock = blocks[columnsIndex];
    let extractedBlock = null;
    const updatedColumns = columnsBlock.defaultContent.columns.map(col => {
      const child = (col.blocks || []).find(b => b.id === childBlockId);
      if (child) extractedBlock = child;
      return { ...col, blocks: (col.blocks || []).filter(b => b.id !== childBlockId) };
    });
    if (!extractedBlock) return;
    const nonEmptyCols = updatedColumns.filter(c => (c.blocks || []).length > 0);
    const newBlocks = [...blocks];
    if (nonEmptyCols.length === 0) {
      newBlocks.splice(columnsIndex, 1, extractedBlock);
    } else if (nonEmptyCols.length === 1) {
      newBlocks.splice(columnsIndex, 1, ...nonEmptyCols[0].blocks, extractedBlock);
    } else {
      let finalColumns = updatedColumns;
      if (updatedColumns.length > 2 && nonEmptyCols.length < updatedColumns.length) {
        finalColumns = nonEmptyCols;
      }
      const evenWidth = Math.floor(100 / finalColumns.length);
      const remainder = 100 - (evenWidth * finalColumns.length);
      finalColumns = finalColumns.map((col, i) => ({
        ...col, width: evenWidth + (i === 0 ? remainder : 0)
      }));
      newBlocks[columnsIndex] = { ...columnsBlock, defaultContent: { columns: finalColumns } };
      newBlocks.splice(columnsIndex + 1, 0, extractedBlock);
    }
    onChange(newBlocks);
  }, [blocks, onChange]);

  const deleteBlockFromColumns = useCallback((columnsBlockId, childBlockId) => {
    const columnsIndex = blocks.findIndex(b => b.id === columnsBlockId);
    if (columnsIndex === -1) return;
    const columnsBlock = blocks[columnsIndex];
    const updatedColumns = columnsBlock.defaultContent.columns.map(col => ({
      ...col, blocks: (col.blocks || []).filter(b => b.id !== childBlockId)
    }));
    const nonEmptyCols = updatedColumns.filter(c => (c.blocks || []).length > 0);
    const newBlocks = [...blocks];
    if (nonEmptyCols.length === 0) {
      newBlocks.splice(columnsIndex, 1);
    } else if (nonEmptyCols.length === 1) {
      newBlocks.splice(columnsIndex, 1, ...nonEmptyCols[0].blocks);
    } else {
      let finalColumns = updatedColumns;
      if (updatedColumns.length > 2 && nonEmptyCols.length < updatedColumns.length) {
        finalColumns = nonEmptyCols;
      }
      const evenWidth = Math.floor(100 / finalColumns.length);
      const remainder = 100 - (evenWidth * finalColumns.length);
      finalColumns = finalColumns.map((col, i) => ({
        ...col, width: evenWidth + (i === 0 ? remainder : 0)
      }));
      newBlocks[columnsIndex] = { ...columnsBlock, defaultContent: { columns: finalColumns } };
    }
    onChange(newBlocks);
    if (editingBlockId === childBlockId) setEditingBlockId(null);
  }, [blocks, onChange, editingBlockId]);

  const dissolveColumnsBlock = useCallback((columnsBlockId) => {
    const columnsIndex = blocks.findIndex(b => b.id === columnsBlockId);
    if (columnsIndex === -1) return;
    const columnsBlock = blocks[columnsIndex];
    const allChildBlocks = (columnsBlock.defaultContent?.columns || []).flatMap(c => c.blocks || []);
    const newBlocks = [...blocks];
    newBlocks.splice(columnsIndex, 1, ...allChildBlocks);
    onChange(newBlocks);
  }, [blocks, onChange]);

  const removeColumnFromColumns = useCallback((columnsBlockId, colIndex) => {
    const columnsIndex = blocks.findIndex(b => b.id === columnsBlockId);
    if (columnsIndex === -1) return;
    const columnsBlock = blocks[columnsIndex];
    const columns = columnsBlock.defaultContent.columns;
    const removedCol = columns[colIndex];
    const extractedBlocks = removedCol.blocks || [];
    if (columns.length <= 2) {
      const allBlocks = columns.flatMap(c => c.blocks || []);
      const newBlocks = [...blocks];
      if (allBlocks.length > 0) {
        newBlocks.splice(columnsIndex, 1, ...allBlocks);
      } else {
        newBlocks.splice(columnsIndex, 1);
      }
      onChange(newBlocks);
      return;
    }
    const newColumns = columns.filter((_, i) => i !== colIndex).map(c => ({ ...c }));
    const evenWidth = Math.floor(100 / newColumns.length);
    const remainder = 100 - (evenWidth * newColumns.length);
    newColumns.forEach((col, i) => { col.width = evenWidth + (i === 0 ? remainder : 0); });
    const updatedColumnsBlock = { ...columnsBlock, defaultContent: { columns: newColumns } };
    const newBlocks = [...blocks];
    newBlocks[columnsIndex] = updatedColumnsBlock;
    if (extractedBlocks.length > 0) {
      newBlocks.splice(columnsIndex + 1, 0, ...extractedBlocks);
    }
    onChange(newBlocks);
  }, [blocks, onChange]);

  const updateBlock = (blockId, field, value) => {
    onChange(blocks.map(b => b.id === blockId ? { ...b, [field]: value } : b));
  };

  // Convert a block to a different type (used by slash commands)
  const convertBlock = useCallback((blockId, newType) => {
    onChange(blocks.map(b => {
      if (b.id !== blockId) return b;
      return {
        ...b,
        type: newType,
        defaultContent: getDefaultContent(newType),
        properties: getDefaultProperties(newType)
      };
    }));
  }, [blocks, onChange]);

  // Create a new empty paragraph block below the given block
  const createBlockBelow = useCallback((blockId) => {
    const index = blocks.findIndex(b => b.id === blockId);
    if (index === -1) return;
    const newBlock = createNewBlock('paragraph');
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    onChange(newBlocks);
    setEditingBlockId(newBlock.id);
    // Focus the new block's editor after React renders
    requestAnimationFrame(() => {
      const newBlockEl = document.querySelector(`[data-block-id="${newBlock.id}"] .kb-paragraph-editor`);
      if (newBlockEl) newBlockEl.focus();
    });
  }, [blocks, onChange]);

  // Delete an empty block and focus the previous one
  const deleteEmptyBlock = useCallback((blockId) => {
    const index = blocks.findIndex(b => b.id === blockId);
    if (index === -1 || blocks.length <= 1) return;
    const prevBlock = index > 0 ? blocks[index - 1] : null;
    onChange(blocks.filter(b => b.id !== blockId));
    if (prevBlock) {
      setEditingBlockId(prevBlock.id);
      requestAnimationFrame(() => {
        const prevEl = document.querySelector(`[data-block-id="${prevBlock.id}"] .kb-paragraph-editor`);
        if (prevEl) {
          prevEl.focus();
          // Move cursor to end
          const sel = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(prevEl);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      });
    }
  }, [blocks, onChange]);

  const updateBlockProperties = useCallback((blockId, properties) => {
    onChange(blocks.map(b => b.id === blockId ? { ...b, properties } : b));
  }, [blocks, onChange]);

  // Listen for property updates from child blocks (CustomEvent pattern)
  useEffect(() => {
    const handlePropertyUpdate = (e) => {
      const { blockId, properties } = e.detail;
      if (!blockId || !properties) return;
      // Only handle if blockId belongs to our top-level blocks
      const found = blocks.some(b => b.id === blockId);
      if (found) {
        updateBlockProperties(blockId, properties);
      }
    };
    document.addEventListener('kb-block-property-update', handlePropertyUpdate);
    return () => document.removeEventListener('kb-block-property-update', handlePropertyUpdate);
  }, [blocks, updateBlockProperties]);

  const duplicateBlock = useCallback((block, afterIndex) => {
    const newBlock = {
      ...block,
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      defaultContent: JSON.parse(JSON.stringify(block.defaultContent)),
      variants: JSON.parse(JSON.stringify(block.variants || {})),
      properties: JSON.parse(JSON.stringify(block.properties || {}))
    };
    const newBlocks = [...blocks];
    newBlocks.splice(afterIndex + 1, 0, newBlock);
    onChange(newBlocks);
  }, [blocks, onChange]);

  // Move a block up or down by 1 position
  const moveBlock = useCallback((fromIndex, direction) => {
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= blocks.length) return;
    onChange(arrayMove(blocks, fromIndex, toIndex));
  }, [blocks, onChange]);

  const deleteBlock = (blockId) => {
    onChange(blocks.filter(b => b.id !== blockId));
    if (editingBlockId === blockId) setEditingBlockId(null);
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
    setShowAddMenu(null);
    setSideDropTarget(null);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    // Side drop takes priority over reorder
    if (sideDropTarget && sideDropTarget.blockId !== active.id) {
      mergeBlocksSideBySide(active.id, sideDropTarget.blockId, sideDropTarget.side);
    } else if (active.id !== over?.id) {
      // Normal reorder
      const oldIndex = blocks.findIndex(b => b.id === active.id);
      const newIndex = blocks.findIndex(b => b.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onChange(arrayMove(blocks, oldIndex, newIndex));
      }
    }

    setActiveId(null);
    setSideDropTarget(null);
  };

  const hasDropdowns = dropdowns && dropdowns.length > 0;

  return (
    <div className="space-y-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
          {blocks.map((block, index) => (
            <React.Fragment key={block.id}>
              {/* Insert line before first block */}
              {index === 0 && !activeId && (
                <InsertBlockLine
                  showMenu={showAddMenu === 'between_-1'}
                  onToggleMenu={() => setShowAddMenu(showAddMenu === 'between_-1' ? null : 'between_-1')}
                  onAdd={(type) => { addBlock(type, -1); setShowAddMenu(null); }}
                />
              )}
              <SortableBlock
                block={block}
                index={index}
                totalBlocks={blocks.length}
                editingBlockId={editingBlockId}
                setEditingBlockId={setEditingBlockId}
                onUpdateBlock={updateBlock}
                onRequestDelete={setPendingDeleteId}
                onOpenVariants={onOpenVariants}
                hasDropdowns={hasDropdowns}
                showAddMenu={showAddMenu}
                setShowAddMenu={setShowAddMenu}
                addBlock={addBlock}
                activeId={activeId}
                sideDropTarget={sideDropTarget}
                onAddToSide={addBlockToSide}
                onExtractFromColumns={extractBlockFromColumns}
                onDeleteFromColumns={deleteBlockFromColumns}
                onDissolveColumns={dissolveColumnsBlock}
                onRemoveColumnFromColumns={removeColumnFromColumns}
                onDuplicateBlock={duplicateBlock}
                onUpdateProperties={updateBlockProperties}
                onConvertBlock={convertBlock}
                onCreateBlockBelow={createBlockBelow}
                onDeleteEmptyBlock={deleteEmptyBlock}
                onMoveBlock={moveBlock}
              />
              {/* Insert line between blocks */}
              {index < blocks.length - 1 && !activeId && (
                <InsertBlockLine
                  showMenu={showAddMenu === `between_${index}`}
                  onToggleMenu={() => setShowAddMenu(showAddMenu === `between_${index}` ? null : `between_${index}`)}
                  onAdd={(type) => { addBlock(type, index); setShowAddMenu(null); }}
                />
              )}
            </React.Fragment>
          ))}
        </SortableContext>

        {/* Drag Overlay - renders dragged block at cursor, pointer-events:none so elementFromPoint can see through */}
        <DragOverlay>
          {activeId ? (() => {
            const activeBlock = blocks.find(b => b.id === activeId);
            return activeBlock ? (
              <div
                style={{ pointerEvents: 'none' }}
                className="bg-gray-50 dark:bg-neutral-900 rounded-lg p-3 border-2
                  border-blue-400 dark:border-blue-600 shadow-xl cursor-grabbing max-w-full"
              >
                <BlockRenderer block={activeBlock} isEditing={false} />
              </div>
            ) : null;
          })() : null}
        </DragOverlay>
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

      {/* Delete Confirmation Modal */}
      {pendingDeleteId && createPortal(
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99998]"
          onClick={() => setPendingDeleteId(null)}
        >
          <div
            className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl p-6 w-[400px] max-w-[calc(100vw-2rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">
                  Delete Block
                </h3>
                <p className="text-[13px] text-gray-500 dark:text-neutral-400 mt-0.5">
                  Are you sure? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPendingDeleteId(null)}
                className="px-4 py-2 text-[13px] font-medium text-gray-700 dark:text-neutral-300
                  bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600
                  rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteBlock(pendingDeleteId);
                  setPendingDeleteId(null);
                }}
                className="px-4 py-2 text-[13px] font-medium text-white
                  bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default BlockEditor;
