import React, { useState } from 'react';
import {
  Columns, Plus, Trash2, Pencil, Check, Type, Heading1, Heading2,
  List, Quote, Code, Image as ImageIcon, AlertCircle, Minus, ChevronRight,
  ListOrdered, Play, Music, FileText, Link, Table, MousePointer, FileType,
  ArrowUpRight, Unlink
} from 'lucide-react';
import BlockRenderer from '../BlockRenderer';

// Block types available inside columns
const columnBlockTypes = [
  { type: 'paragraph', label: 'Paragraph', icon: Type },
  { type: 'heading_1', label: 'Heading 1', icon: Heading1 },
  { type: 'heading_2', label: 'Heading 2', icon: Heading2 },
  { type: 'bulleted_list', label: 'Bullet List', icon: List },
  { type: 'numbered_list', label: 'Numbered List', icon: ListOrdered },
  { type: 'toggle', label: 'Toggle', icon: ChevronRight },
  { type: 'callout', label: 'Callout', icon: AlertCircle },
  { type: 'quote', label: 'Quote', icon: Quote },
  { type: 'divider', label: 'Divider', icon: Minus },
  { type: 'code', label: 'Code', icon: Code },
  { type: 'image', label: 'Image', icon: ImageIcon },
  { type: 'video', label: 'Video', icon: Play },
  { type: 'audio', label: 'Audio', icon: Music },
  { type: 'file', label: 'File', icon: FileText },
  { type: 'bookmark', label: 'Bookmark', icon: Link },
  { type: 'table', label: 'Table', icon: Table },
  { type: 'button', label: 'Button', icon: MousePointer },
  { type: 'pdf', label: 'PDF', icon: FileType },
];

const getBlockDefaultContent = (blockType) => {
  switch (blockType) {
    case 'table': return { headers: ['Column 1', 'Column 2'], rows: [['', '']] };
    case 'toggle': return { title: '', body: '' };
    case 'callout': return { text: '' };
    case 'code': return { code: '', language: 'javascript' };
    case 'image': return { url: '', alt: '', caption: '' };
    case 'video': return { url: '', caption: '' };
    case 'audio': return { url: '', title: '', caption: '' };
    case 'file': return { url: '', name: '', size: '', type: '' };
    case 'bookmark': return { url: '', title: '', description: '', image: '' };
    case 'button': return { label: 'Click me', action: 'link', url: '', copyText: '', style: 'primary', align: 'left' };
    case 'pdf': return { url: '', title: '', height: 600 };
    default: return '';
  }
};

const getBlockDefaultProperties = (blockType) => {
  switch (blockType) {
    case 'callout': return { variant: 'info' };
    case 'code': return { language: 'javascript' };
    default: return {};
  }
};

const ColumnsBlock = ({ block, content, isEditing, onUpdate, onExtractBlock, onDeleteBlockFromColumn, onDissolveColumns, onRemoveColumn }) => {
  const [dragCol, setDragCol] = useState(null);
  const [editingBlockId, setEditingBlockId] = useState(null);
  const [addingToColumn, setAddingToColumn] = useState(null);

  // Content structure: { columns: [{ id, width, blocks: [] }] }
  const columnsData = typeof content === 'object' && content !== null && content.columns
    ? content
    : { columns: [
        { id: 'col1', width: 50, blocks: [] },
        { id: 'col2', width: 50, blocks: [] }
      ] };

  const addColumn = () => {
    if (columnsData.columns.length >= 5) return;
    const updatedColumns = columnsData.columns.map(col => ({ ...col }));
    updatedColumns.push({
      id: `col_${Date.now()}`,
      width: 0,
      blocks: []
    });
    const evenWidth = Math.floor(100 / updatedColumns.length);
    const remainder = 100 - (evenWidth * updatedColumns.length);
    updatedColumns.forEach((col, i) => {
      col.width = evenWidth + (i === 0 ? remainder : 0);
    });
    onUpdate?.({ columns: updatedColumns });
  };

  const removeColumn = (colIndex) => {
    if (onRemoveColumn) {
      onRemoveColumn(colIndex);
    }
  };

  const presetLayouts = [
    { label: '50/50', widths: [50, 50] },
    { label: '33/33/33', widths: [33, 34, 33] },
    { label: '70/30', widths: [70, 30] },
    { label: '30/70', widths: [30, 70] },
    { label: '25/50/25', widths: [25, 50, 25] },
    { label: '25/25/25/25', widths: [25, 25, 25, 25] }
  ];

  const applyLayout = (widths) => {
    const columns = widths.map((w, i) => ({
      id: columnsData.columns[i]?.id || `col_${Date.now()}_${i}`,
      width: w,
      blocks: columnsData.columns[i]?.blocks || []
    }));
    onUpdate?.({ columns });
  };

  // --- Block management within columns ---

  const updateBlockInColumn = (colIndex, blockId, newContent) => {
    const newColumns = columnsData.columns.map((col, ci) => {
      if (ci !== colIndex) return col;
      return {
        ...col,
        blocks: (col.blocks || []).map(b =>
          b.id === blockId ? { ...b, defaultContent: newContent } : b
        )
      };
    });
    onUpdate?.({ columns: newColumns });
  };

  const removeBlockFromColumn = (colIndex, blockId) => {
    if (onDeleteBlockFromColumn) {
      onDeleteBlockFromColumn(blockId);
    } else {
      const newColumns = columnsData.columns.map((col, ci) => {
        if (ci !== colIndex) return col;
        return { ...col, blocks: (col.blocks || []).filter(b => b.id !== blockId) };
      });
      onUpdate?.({ columns: newColumns });
    }
    if (editingBlockId === blockId) setEditingBlockId(null);
  };

  const addBlockToColumn = (colIndex, type) => {
    const newBlock = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      defaultContent: getBlockDefaultContent(type),
      variants: {},
      properties: getBlockDefaultProperties(type)
    };

    const newColumns = columnsData.columns.map((col, ci) => {
      if (ci !== colIndex) return col;
      return { ...col, blocks: [...(col.blocks || []), newBlock] };
    });
    onUpdate?.({ columns: newColumns });
    setEditingBlockId(newBlock.id);
    setAddingToColumn(null);
  };

  if (isEditing) {
    return (
      <div className="space-y-4 p-5 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Columns size={16} className="text-blue-500" />
            <span className="text-[13px] font-medium text-gray-700 dark:text-neutral-300">
              Columns Layout ({columnsData.columns.length} columns)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDissolveColumns?.()}
              className="flex items-center gap-1 px-2 py-1 text-[12px] bg-orange-50 dark:bg-orange-900/20
                text-orange-600 dark:text-orange-400 rounded hover:bg-orange-100 dark:hover:bg-orange-900/30
                transition-colors"
              title="Dissolve columns layout and extract all blocks"
            >
              <Unlink size={12} />
              Dissolve
            </button>
            <button
              onClick={addColumn}
              disabled={columnsData.columns.length >= 5}
              className="flex items-center gap-1 px-2 py-1 text-[12px] bg-blue-50 dark:bg-blue-900/20
                text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={12} />
              Add Column
            </button>
          </div>
        </div>

        {/* Preset Layouts */}
        <div>
          <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            Layout Presets
          </label>
          <div className="flex flex-wrap gap-2">
            {presetLayouts.map(preset => (
              <button
                key={preset.label}
                onClick={() => applyLayout(preset.widths)}
                className="px-3 py-1.5 text-[12px] bg-white dark:bg-neutral-800 border border-gray-200
                  dark:border-neutral-700 rounded-lg hover:border-blue-500 hover:text-blue-600
                  dark:hover:text-blue-400 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Column Width Sliders */}
        <div>
          <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            Column Widths
          </label>
          <div className="space-y-2">
            {columnsData.columns.map((col, index) => (
              <div key={col.id} className="flex items-center gap-3">
                <span className="text-[12px] text-gray-500 w-16">Col {index + 1}</span>
                <input
                  type="range"
                  min="15"
                  max="85"
                  value={col.width}
                  onChange={(e) => {
                    const newWidth = parseInt(e.target.value);
                    const diff = newWidth - col.width;
                    const newColumns = [...columnsData.columns];
                    newColumns[index] = { ...col, width: newWidth };
                    const adjIndex = index < newColumns.length - 1 ? index + 1 : index - 1;
                    if (adjIndex >= 0) {
                      newColumns[adjIndex] = {
                        ...newColumns[adjIndex],
                        width: Math.max(15, newColumns[adjIndex].width - diff)
                      };
                    }
                    onUpdate?.({ columns: newColumns });
                  }}
                  className="flex-1"
                />
                <span className="text-[12px] text-gray-600 dark:text-neutral-400 w-10 text-right font-mono">
                  {col.width}%
                </span>
                <button
                  onClick={() => removeColumn(index)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title={columnsData.columns.length <= 2 ? 'Dissolve columns layout' : 'Remove column'}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Column Content Editor - editable blocks inside each column */}
        <div>
          <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            Column Content
          </label>
          <div className="flex flex-col md:flex-row gap-3">
            {columnsData.columns.map((col, colIndex) => (
              <div
                key={col.id}
                className="min-w-0 flex-1"
                style={{ flex: `0 0 calc(${col.width}% - ${(columnsData.columns.length - 1) * 12 / columnsData.columns.length}px)` }}
              >
                {/* Column label */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-wide">
                    Col {colIndex + 1} — {col.width}%
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-neutral-600">
                    {(col.blocks || []).length} block{(col.blocks || []).length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Blocks container */}
                <div className="space-y-2 min-h-[80px] border border-dashed border-gray-300 dark:border-neutral-700
                  rounded-lg p-2 bg-white/50 dark:bg-neutral-800/50">

                  {(col.blocks || []).map((childBlock) => {
                    const isBlockEditing = editingBlockId === childBlock.id;
                    return (
                      <div
                        key={childBlock.id}
                        className={`group/cb relative rounded-lg border transition-colors ${
                          isBlockEditing
                            ? 'border-blue-300 dark:border-blue-700 ring-1 ring-blue-200 dark:ring-blue-800 bg-white dark:bg-neutral-800'
                            : 'border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-gray-300 dark:hover:border-neutral-600'
                        }`}
                      >
                        {/* Block mini toolbar */}
                        <div className={`flex items-center justify-between px-2 py-1 border-b
                          ${isBlockEditing
                            ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30'
                            : 'border-gray-100 dark:border-neutral-700'
                          } rounded-t-lg`}>
                          <span className="text-[10px] font-medium text-gray-400 dark:text-neutral-500 capitalize">
                            {childBlock.type.replace(/_/g, ' ')}
                          </span>
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => onExtractBlock?.(childBlock.id)}
                              className="p-1 text-gray-400 hover:text-orange-500 rounded
                                hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                              title="Move out of columns"
                            >
                              <ArrowUpRight size={11} />
                            </button>
                            <button
                              onClick={() => setEditingBlockId(isBlockEditing ? null : childBlock.id)}
                              className={`p-1 rounded transition-colors ${
                                isBlockEditing
                                  ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'
                                  : 'text-gray-400 hover:text-blue-600 hover:bg-gray-50 dark:hover:bg-neutral-700'
                              }`}
                              title={isBlockEditing ? 'Done editing' : 'Edit block'}
                            >
                              {isBlockEditing ? <Check size={11} /> : <Pencil size={11} />}
                            </button>
                            <button
                              onClick={() => removeBlockFromColumn(colIndex, childBlock.id)}
                              className="p-1 text-gray-400 hover:text-red-500 rounded
                                hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Delete block"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>

                        {/* Block content */}
                        <div className="p-2">
                          <BlockRenderer
                            block={childBlock}
                            isEditing={isBlockEditing}
                            onUpdate={(newContent) => updateBlockInColumn(colIndex, childBlock.id, newContent)}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Empty state */}
                  {(!col.blocks || col.blocks.length === 0) && addingToColumn !== colIndex && (
                    <div className="flex items-center justify-center h-12 text-[11px] text-gray-300 dark:text-neutral-600">
                      No blocks yet
                    </div>
                  )}

                  {/* Add block to column */}
                  {addingToColumn === colIndex ? (
                    <div className="mt-1">
                      <div className="grid grid-cols-2 gap-1 p-2 bg-gray-50 dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700">
                        {columnBlockTypes.map(opt => (
                          <button
                            key={opt.type}
                            onClick={() => addBlockToColumn(colIndex, opt.type)}
                            className="flex items-center gap-1.5 px-2 py-1.5 text-[11px]
                              text-gray-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800
                              hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
                          >
                            <opt.icon size={12} />
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setAddingToColumn(null)}
                        className="w-full mt-1 py-1 text-[10px] text-gray-400 hover:text-gray-600
                          dark:hover:text-neutral-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingToColumn(colIndex)}
                      className="w-full flex items-center justify-center gap-1 py-1.5 mt-1
                        text-[11px] text-gray-400 hover:text-blue-600 dark:hover:text-blue-400
                        hover:bg-blue-50/50 dark:hover:bg-blue-950/20 rounded-md transition-colors"
                    >
                      <Plus size={12} />
                      Add block
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // View mode - responsive columns: stack on mobile, side-by-side on desktop
  return (
    <div className="flex flex-col md:flex-row gap-6" style={{ minHeight: '40px' }}>
      {columnsData.columns.map((col) => (
        <div
          key={col.id}
          className="min-h-[40px]"
          style={{ flex: `0 0 ${col.width}%` }}
        >
          {col.blocks && col.blocks.length > 0 ? (
            <div className="space-y-3">
              {col.blocks.map((childBlock) => (
                <BlockRenderer key={childBlock.id} block={childBlock} />
              ))}
            </div>
          ) : (
            <div className="h-full min-h-[40px] border border-dashed border-gray-200 dark:border-neutral-700 rounded-xl flex items-center justify-center">
              <span className="text-[12px] text-gray-300 dark:text-neutral-600">Empty column</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ColumnsBlock;
