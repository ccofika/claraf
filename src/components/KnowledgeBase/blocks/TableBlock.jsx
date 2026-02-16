import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, Merge, SplitSquareHorizontal, ChevronUp, ChevronDown,
  AlignLeft, AlignCenter, AlignRight, ArrowUpDown, ArrowUp, ArrowDown,
  Image as ImageIcon, Upload } from 'lucide-react';
import { useKnowledgeBase } from '../../../context/KnowledgeBaseContext';
import useRichTextEditor, { textColorStyles } from '../../../hooks/useRichTextEditor';
import RichTextToolbar from './RichTextToolbar';
import { uploadKnowledgeBaseImage } from '../../../utils/imageUpload';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════
// Cell background color options
// ═══════════════════════════════════════════════════

const cellBgOptions = [
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

const cellBgClasses = {
  '': '',
  'blue': 'bg-blue-50 dark:bg-blue-900/20',
  'green': 'bg-emerald-50 dark:bg-emerald-900/20',
  'yellow': 'bg-amber-50 dark:bg-amber-900/20',
  'red': 'bg-red-50 dark:bg-red-900/20',
  'purple': 'bg-purple-50 dark:bg-purple-900/20',
  'gray': 'bg-gray-100 dark:bg-neutral-700/30',
  'orange': 'bg-orange-50 dark:bg-orange-900/20',
  'pink': 'bg-pink-50 dark:bg-pink-900/20',
};

const alignClassMap = {
  '': 'text-left',
  'left': 'text-left',
  'center': 'text-center',
  'right': 'text-right',
};

// ═══════════════════════════════════════════════════
// Image Lightbox (reused from ImageBlock pattern)
// ═══════════════════════════════════════════════════

const TableImageLightbox = ({ src, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 cursor-pointer z-[99999]" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
        <X className="w-6 h-6" />
      </button>
      <img src={src} alt="" className="max-w-full max-h-full object-contain rounded-lg cursor-default" onClick={(e) => e.stopPropagation()} draggable={false} />
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
        Click outside or press ESC to close
      </div>
    </div>,
    document.body
  );
};

// ═══════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════

const EMPTY_CELL = { content: '', colspan: 1, bgColor: '', align: '', image: null };

const normalizeCell = (cell) => {
  if (typeof cell === 'string') return { ...EMPTY_CELL, content: cell };
  if (cell && typeof cell === 'object' && 'content' in cell) {
    return {
      content: cell.content || '',
      colspan: cell.colspan || 1,
      bgColor: cell.bgColor || '',
      align: cell.align || '',
      image: cell.image || null
    };
  }
  return { ...EMPTY_CELL };
};

const normalizeRow = (row, headerCount) => {
  if (!Array.isArray(row)) return new Array(headerCount).fill(null).map(() => ({ ...EMPTY_CELL }));
  const cells = row.map(normalizeCell);
  const totalColspan = cells.reduce((sum, c) => sum + c.colspan, 0);
  if (totalColspan < headerCount) {
    const diff = headerCount - totalColspan;
    for (let i = 0; i < diff; i++) cells.push({ ...EMPTY_CELL });
  }
  return cells;
};

const stripHtml = (html) => {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || '').trim();
};

// ═══════════════════════════════════════════════════
// CellEditor Component
// ═══════════════════════════════════════════════════

const CellEditor = ({ cell, onUpdate, onSetBgColor, onSetAlign, onSetImage, isActive, onActivate, onOpenLightbox }) => {
  const { pageTree } = useKnowledgeBase();
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  const richText = useRichTextEditor({ onUpdate, externalEditorRef: editorRef });

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (cell.content || '')) {
      editorRef.current.innerHTML = cell.content || '';
    }
  }, []);

  useEffect(() => {
    if (editorRef.current && !isFocused && editorRef.current.innerHTML !== (cell.content || '')) {
      editorRef.current.innerHTML = cell.content || '';
    }
  }, [cell.content, isFocused]);

  const handleInput = useCallback((e) => { onUpdate(e.target.innerHTML); }, [onUpdate]);
  const handleFocus = useCallback(() => { setIsFocused(true); onActivate(); }, [onActivate]);

  // Image upload handler
  const handleImageUpload = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setIsUploading(true);
    try {
      const result = await uploadKnowledgeBaseImage(file);
      onSetImage({ url: result.url, publicId: result.publicId });
      toast.success('Image uploaded');
    } catch (err) {
      console.error('Cell image upload error:', err);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  }, [onSetImage]);

  // Paste handler: intercept image pastes
  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) handleImageUpload(file);
        return;
      }
    }
  }, [handleImageUpload]);

  // Drag-drop handlers for image
  const handleDragOver = useCallback((e) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingImage(true);
    }
  }, []);
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDraggingImage(false);
  }, []);
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0 && files[0].type.startsWith('image/')) {
      handleImageUpload(files[0]);
    }
  }, [handleImageUpload]);

  return (
    <div
      ref={richText.wrapperRef}
      style={{ position: 'relative' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      {/* Drag overlay */}
      {isDraggingImage && (
        <div className="absolute inset-0 z-20 bg-blue-50/80 dark:bg-blue-900/30 border-2 border-dashed border-blue-400 rounded flex items-center justify-center">
          <span className="text-[12px] font-medium text-blue-600 dark:text-blue-400">Drop image here</span>
        </div>
      )}

      {/* Cell format bar - alignment + bg color + image */}
      {isActive && (
        <div className="flex items-center gap-0.5 px-2 py-1 border-b border-gray-100 dark:border-neutral-700/50 bg-gray-50/50 dark:bg-neutral-800/30 flex-wrap">
          <button
            onMouseDown={(e) => { e.preventDefault(); onSetAlign(''); }}
            className={`p-1 rounded transition-colors ${!cell.align || cell.align === 'left'
              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300'}`}
            title="Align left"
          >
            <AlignLeft size={12} />
          </button>
          <button
            onMouseDown={(e) => { e.preventDefault(); onSetAlign('center'); }}
            className={`p-1 rounded transition-colors ${cell.align === 'center'
              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300'}`}
            title="Align center"
          >
            <AlignCenter size={12} />
          </button>
          <button
            onMouseDown={(e) => { e.preventDefault(); onSetAlign('right'); }}
            className={`p-1 rounded transition-colors ${cell.align === 'right'
              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300'}`}
            title="Align right"
          >
            <AlignRight size={12} />
          </button>
          <div className="w-px h-4 bg-gray-200 dark:bg-neutral-600 mx-1" />
          {cellBgOptions.map((opt) => (
            <button
              key={opt.key}
              onMouseDown={(e) => { e.preventDefault(); onSetBgColor(opt.key); }}
              className={`w-4 h-4 rounded-sm border ${opt.swatch} ${cell.bgColor === opt.key
                ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-neutral-900'
                : ''} transition-all hover:scale-110`}
              title={opt.label}
            />
          ))}
          <div className="w-px h-4 bg-gray-200 dark:bg-neutral-600 mx-1" />
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              if (cell.image?.url) {
                onSetImage(null);
              } else {
                fileInputRef.current?.click();
              }
            }}
            className={`p-1 rounded transition-colors ${cell.image?.url
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700'}`}
            title={cell.image?.url ? 'Remove image' : 'Add image'}
          >
            {cell.image?.url ? <X size={12} /> : <ImageIcon size={12} />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleImageUpload(e.target.files[0]);
              e.target.value = '';
            }}
          />
        </div>
      )}

      {/* Uploading indicator */}
      {isUploading && (
        <div className="flex items-center justify-center py-2">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-[11px] text-gray-400">Uploading...</span>
        </div>
      )}

      {/* Cell image thumbnail */}
      {cell.image?.url && !isUploading && (
        <div className="relative group/cellimg px-3 pt-2">
          <img
            src={cell.image.url}
            alt=""
            className="max-h-32 rounded cursor-pointer hover:opacity-90 transition-opacity object-contain"
            onClick={(e) => { e.stopPropagation(); onOpenLightbox(cell.image.url); }}
          />
          <button
            onClick={(e) => { e.stopPropagation(); onSetImage(null); }}
            className="absolute top-3 right-4 p-1 bg-red-500 text-white rounded-full
              opacity-0 group-hover/cellimg:opacity-100 transition-opacity hover:bg-red-600"
            title="Remove image"
          >
            <X size={10} />
          </button>
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable
        onFocus={handleFocus}
        onBlur={() => setIsFocused(false)}
        onInput={handleInput}
        onMouseUp={richText.handleSelectionChange}
        onKeyUp={richText.handleSelectionChange}
        className={`kb-table-cell-editor w-full px-4 py-3 bg-transparent text-[14px]
          text-gray-700 dark:text-neutral-300
          focus:outline-none focus:bg-gray-50/50 dark:focus:bg-neutral-800/50
          [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline
          ${alignClassMap[cell.align] || 'text-left'}`}
        style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word', minHeight: '44px' }}
        suppressContentEditableWarning
      />
      {isActive && <RichTextToolbar {...richText} pageTree={pageTree} />}
    </div>
  );
};

// ═══════════════════════════════════════════════════
// Main TableBlock Component
// ═══════════════════════════════════════════════════

const TableBlock = ({ content, isEditing, onUpdate }) => {
  const tableData = typeof content === 'object' && content !== null
    ? content
    : { headers: ['Column 1', 'Column 2'], rows: [['', '']] };

  const headers = tableData.headers || [];
  const rawRows = tableData.rows || [];
  const rows = rawRows.map(row => normalizeRow(row, headers.length));

  // Cell selection for merging
  const [selectedCells, setSelectedCells] = useState(null);
  const [activeCell, setActiveCell] = useState(null);

  // Insert line tracking
  const tableWrapperRef = useRef(null);
  const [rowInsertIndex, setRowInsertIndex] = useState(null);
  const [rowInsertTop, setRowInsertTop] = useState(0);
  const [colInsertIndex, setColInsertIndex] = useState(null);
  const [colInsertLeft, setColInsertLeft] = useState(0);

  // View mode sorting
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);

  // Lightbox for cell images
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const emitUpdate = useCallback((newHeaders, newRows) => {
    onUpdate?.({ headers: newHeaders, rows: newRows });
  }, [onUpdate]);

  // ─── CRUD Operations ──────────────────────────

  const addColumn = () => {
    const newHeaders = [...headers, `Column ${headers.length + 1}`];
    const newRows = rows.map(row => [...row, { ...EMPTY_CELL }]);
    emitUpdate(newHeaders, newRows);
  };

  const addRow = () => {
    const newRow = new Array(headers.length).fill(null).map(() => ({ ...EMPTY_CELL }));
    emitUpdate(headers, [...rows, newRow]);
  };

  const updateHeader = (index, value) => {
    const newHeaders = [...headers];
    newHeaders[index] = value;
    emitUpdate(newHeaders, rows);
  };

  const updateCell = (rowIndex, colIndex, value) => {
    const newRows = rows.map((row, ri) =>
      ri === rowIndex
        ? row.map((cell, ci) => ci === colIndex ? { ...cell, content: value } : cell)
        : row
    );
    emitUpdate(headers, newRows);
  };

  const removeColumn = (index) => {
    if (headers.length <= 1) return;
    const newHeaders = headers.filter((_, i) => i !== index);
    const newRows = rows.map(row => {
      const result = [];
      let colPos = 0;
      for (const cell of row) {
        const cellEnd = colPos + cell.colspan;
        if (index >= colPos && index < cellEnd) {
          if (cell.colspan > 1) result.push({ ...cell, colspan: cell.colspan - 1 });
        } else {
          result.push(cell);
        }
        colPos = cellEnd;
      }
      return result;
    });
    setSelectedCells(null);
    emitUpdate(newHeaders, newRows);
  };

  const removeRow = (index) => {
    const newRows = rows.filter((_, i) => i !== index);
    setSelectedCells(null);
    emitUpdate(headers, newRows);
  };

  const mergeCells = () => {
    if (!selectedCells) return;
    const { rowIndex, startCol, endCol } = selectedCells;
    const row = rows[rowIndex];
    let colPos = 0, startCellIdx = -1, endCellIdx = -1;
    for (let i = 0; i < row.length; i++) {
      const cellEnd = colPos + row[i].colspan;
      if (colPos <= startCol && startCol < cellEnd) startCellIdx = i;
      if (colPos <= endCol && endCol < cellEnd) endCellIdx = i;
      colPos = cellEnd;
    }
    if (startCellIdx === -1 || endCellIdx === -1 || startCellIdx === endCellIdx) return;
    const mergedContent = row.slice(startCellIdx, endCellIdx + 1).map(c => c.content).filter(Boolean).join(' ');
    const mergedColspan = row.slice(startCellIdx, endCellIdx + 1).reduce((sum, c) => sum + c.colspan, 0);
    const firstMergedImage = row.slice(startCellIdx, endCellIdx + 1).find(c => c.image)?.image || null;
    const newRow = [
      ...row.slice(0, startCellIdx),
      { content: mergedContent, colspan: mergedColspan, bgColor: row[startCellIdx].bgColor, align: row[startCellIdx].align, image: firstMergedImage },
      ...row.slice(endCellIdx + 1)
    ];
    const newRows = rows.map((r, i) => i === rowIndex ? newRow : r);
    setSelectedCells(null);
    emitUpdate(headers, newRows);
  };

  const unmergeCells = (rowIndex, colIndex) => {
    const row = rows[rowIndex];
    const cell = row[colIndex];
    if (!cell || cell.colspan <= 1) return;
    const newCells = [{ content: cell.content, colspan: 1, bgColor: cell.bgColor, align: cell.align, image: cell.image }];
    for (let i = 1; i < cell.colspan; i++) newCells.push({ ...EMPTY_CELL });
    const newRow = [...row.slice(0, colIndex), ...newCells, ...row.slice(colIndex + 1)];
    const newRows = rows.map((r, i) => i === rowIndex ? newRow : r);
    emitUpdate(headers, newRows);
  };

  // ─── Insert Between ───────────────────────────

  const insertRowAt = useCallback((afterIndex) => {
    const newRow = new Array(headers.length).fill(null).map(() => ({ ...EMPTY_CELL }));
    const newRows = [...rows];
    newRows.splice(afterIndex + 1, 0, newRow);
    emitUpdate(headers, newRows);
    setRowInsertIndex(null);
  }, [headers, rows, emitUpdate]);

  const insertColumnAt = useCallback((afterIndex) => {
    const insertPos = afterIndex + 1;
    const newHeaders = [...headers];
    newHeaders.splice(insertPos, 0, `Column ${headers.length + 1}`);

    const newRows = rows.map(row => {
      const newRow = [];
      let colPos = 0;
      for (const cell of row) {
        const cellStart = colPos;
        const cellEnd = colPos + cell.colspan - 1;

        if (insertPos > cellStart && insertPos <= cellEnd) {
          // Insert point inside merged cell - expand colspan
          newRow.push({ ...cell, colspan: cell.colspan + 1 });
        } else {
          if (cellStart === insertPos) {
            // Insert new empty cell before this cell
            newRow.push({ ...EMPTY_CELL });
          }
          newRow.push(cell);
        }
        colPos += cell.colspan;
      }
      // Insert at the very end
      if (insertPos >= colPos) {
        newRow.push({ ...EMPTY_CELL });
      }
      return newRow;
    });

    emitUpdate(newHeaders, newRows);
    setColInsertIndex(null);
  }, [headers, rows, emitUpdate]);

  // ─── Row Reorder ──────────────────────────────

  const moveRow = useCallback((fromIndex, direction) => {
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= rows.length) return;
    const newRows = [...rows];
    [newRows[fromIndex], newRows[toIndex]] = [newRows[toIndex], newRows[fromIndex]];
    emitUpdate(headers, newRows);
  }, [rows, headers, emitUpdate]);

  // ─── Cell Formatting ──────────────────────────

  const setCellBgColor = useCallback((rowIndex, colIndex, colorKey) => {
    const newRows = rows.map((row, ri) =>
      ri === rowIndex
        ? row.map((cell, ci) => ci === colIndex ? { ...cell, bgColor: colorKey } : cell)
        : row
    );
    emitUpdate(headers, newRows);
  }, [rows, headers, emitUpdate]);

  const setCellAlign = useCallback((rowIndex, colIndex, align) => {
    const newRows = rows.map((row, ri) =>
      ri === rowIndex
        ? row.map((cell, ci) => ci === colIndex ? { ...cell, align } : cell)
        : row
    );
    emitUpdate(headers, newRows);
  }, [rows, headers, emitUpdate]);

  const setCellImage = useCallback((rowIndex, colIndex, imageData) => {
    const newRows = rows.map((row, ri) =>
      ri === rowIndex
        ? row.map((cell, ci) => ci === colIndex ? { ...cell, image: imageData } : cell)
        : row
    );
    emitUpdate(headers, newRows);
  }, [rows, headers, emitUpdate]);

  // ─── Mouse Tracking for Insert Lines ──────────

  const handleTableMouseMove = useCallback((e) => {
    if (!tableWrapperRef.current) return;
    const wrapper = tableWrapperRef.current;
    const wrapperRect = wrapper.getBoundingClientRect();
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const zone = 10;

    // Column detection - works across full table height using header th positions as reference
    const ths = wrapper.querySelectorAll('th[data-col-index]');
    if (ths.length > 0) {
      // Left edge of first column
      const firstRect = ths[0].getBoundingClientRect();
      if (Math.abs(mouseX - firstRect.left) <= zone) {
        setColInsertIndex(-1);
        setColInsertLeft(firstRect.left - wrapperRect.left);
        setRowInsertIndex(null);
        return;
      }
      // Right edge of each column
      for (let i = 0; i < ths.length; i++) {
        const thRect = ths[i].getBoundingClientRect();
        if (Math.abs(mouseX - thRect.right) <= zone) {
          setColInsertIndex(parseInt(ths[i].dataset.colIndex));
          setColInsertLeft(thRect.right - wrapperRect.left);
          setRowInsertIndex(null);
          return;
        }
      }
    }
    setColInsertIndex(null);

    // Row detection (body area)
    const trs = wrapper.querySelectorAll('tr[data-row-index]');
    // Top edge of first row
    if (trs.length > 0) {
      const firstRect = trs[0].getBoundingClientRect();
      if (Math.abs(mouseY - firstRect.top) <= zone) {
        setRowInsertIndex(-1);
        setRowInsertTop(firstRect.top - wrapperRect.top);
        return;
      }
    }
    // Bottom edge of each row
    for (let i = 0; i < trs.length; i++) {
      const trRect = trs[i].getBoundingClientRect();
      if (Math.abs(mouseY - trRect.bottom) <= zone) {
        setRowInsertIndex(parseInt(trs[i].dataset.rowIndex));
        setRowInsertTop(trRect.bottom - wrapperRect.top);
        return;
      }
    }
    setRowInsertIndex(null);
  }, []);

  const handleTableMouseLeave = useCallback(() => {
    setRowInsertIndex(null);
    setColInsertIndex(null);
  }, []);

  // ─── CSV/TSV Paste ────────────────────────────

  const handleTablePaste = useCallback((e) => {
    const text = e.clipboardData?.getData('text/plain') || '';
    if (!text.includes('\t')) return; // Not TSV, let normal paste happen

    e.preventDefault();
    e.stopPropagation();

    const parsedRows = text.trim().split(/\r?\n/).map(line => line.split('\t'));
    if (parsedRows.length === 0) return;

    const startRow = activeCell?.rowIndex ?? 0;
    const startCol = activeCell?.colIndex ?? 0;
    const maxPasteCols = Math.max(...parsedRows.map(r => r.length));

    let newHeaders = [...headers];
    while (newHeaders.length < startCol + maxPasteCols) {
      newHeaders.push(`Column ${newHeaders.length + 1}`);
    }

    let newRows = rows.map(r => r.map(c => ({ ...c })));
    while (newRows.length < startRow + parsedRows.length) {
      newRows.push(new Array(newHeaders.length).fill(null).map(() => ({ ...EMPTY_CELL })));
    }
    // Ensure all rows have enough cells
    newRows = newRows.map(r => {
      const total = r.reduce((s, c) => s + c.colspan, 0);
      const row = [...r];
      for (let i = total; i < newHeaders.length; i++) {
        row.push({ ...EMPTY_CELL });
      }
      return row;
    });

    // Fill cells with pasted data
    for (let pr = 0; pr < parsedRows.length; pr++) {
      for (let pc = 0; pc < parsedRows[pr].length; pc++) {
        const targetRow = startRow + pr;
        const targetCol = startCol + pc;
        if (targetRow < newRows.length && targetCol < newRows[targetRow].length) {
          newRows[targetRow][targetCol] = { ...newRows[targetRow][targetCol], content: parsedRows[pr][pc] };
        }
      }
    }

    emitUpdate(newHeaders, newRows);
  }, [activeCell, headers, rows, emitUpdate]);

  // ─── Selection ────────────────────────────────

  const handleCellClick = (rowIndex, colPos, e) => {
    if (e.shiftKey && selectedCells && selectedCells.rowIndex === rowIndex) {
      const newStart = Math.min(selectedCells.startCol, colPos);
      const newEnd = Math.max(selectedCells.endCol, colPos);
      if (newStart !== newEnd) setSelectedCells({ rowIndex, startCol: newStart, endCol: newEnd });
    } else {
      setSelectedCells({ rowIndex, startCol: colPos, endCol: colPos });
    }
  };

  const isCellSelected = (rowIndex, colPos, colspan) => {
    if (!selectedCells || selectedCells.rowIndex !== rowIndex) return false;
    const cellEnd = colPos + colspan - 1;
    return colPos <= selectedCells.endCol && cellEnd >= selectedCells.startCol;
  };

  const canMerge = () => {
    if (!selectedCells) return false;
    const { rowIndex, startCol, endCol } = selectedCells;
    if (startCol === endCol) return false;
    const row = rows[rowIndex];
    let colPos = 0, cellCount = 0;
    for (const cell of row) {
      const cellEnd = colPos + cell.colspan;
      if (colPos <= endCol && cellEnd - 1 >= startCol) cellCount++;
      colPos = cellEnd;
    }
    return cellCount >= 2;
  };

  // ═══════════════════════════════════════════════
  // EDIT MODE
  // ═══════════════════════════════════════════════

  if (isEditing) {
    return (
      <div className="overflow-x-auto" onPaste={handleTablePaste}>
        {/* Merge controls */}
        {canMerge() && (
          <div className="mb-2 flex items-center gap-2">
            <button
              onClick={mergeCells}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium
                text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30
                hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
            >
              <Merge size={14} />
              Merge cells
            </button>
            <span className="text-[12px] text-gray-400">
              {selectedCells.endCol - selectedCells.startCol + 1} columns selected
            </span>
          </div>
        )}

        {/* Table wrapper with insert line tracking */}
        <div
          ref={tableWrapperRef}
          className="relative"
          onMouseMove={handleTableMouseMove}
          onMouseLeave={handleTableMouseLeave}
        >
          <table className="min-w-full border border-gray-200 dark:border-neutral-700 rounded-lg overflow-hidden">
            <thead className="bg-gray-100 dark:bg-neutral-800">
              <tr>
                {headers.map((header, index) => (
                  <th key={index} data-col-index={index} className="relative group">
                    <input
                      type="text"
                      value={header}
                      onChange={(e) => updateHeader(index, e.target.value)}
                      className="w-full px-4 py-3 bg-transparent text-[14px] font-semibold
                        text-gray-800 dark:text-neutral-200
                        focus:outline-none focus:bg-gray-50 dark:focus:bg-neutral-700"
                    />
                    {headers.length > 1 && (
                      <button
                        onClick={() => removeColumn(index)}
                        className="absolute top-1/2 -translate-y-1/2 right-1 p-1 text-gray-400
                          hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </th>
                ))}
                <th className="w-12 px-2">
                  <button
                    onClick={addColumn}
                    className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50
                      dark:hover:bg-blue-900/30 rounded"
                    title="Add column at end"
                  >
                    <Plus size={16} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-neutral-900">
              {rows.map((row, rowIndex) => {
                let colPos = 0;
                return (
                  <tr key={rowIndex} data-row-index={rowIndex} className="group border-t border-gray-200 dark:border-neutral-700">
                    {row.map((cell, colIndex) => {
                      const currentColPos = colPos;
                      colPos += cell.colspan;
                      const selected = isCellSelected(rowIndex, currentColPos, cell.colspan);
                      const isActiveCellHere = activeCell?.rowIndex === rowIndex && activeCell?.colIndex === colIndex;

                      return (
                        <td
                          key={colIndex}
                          colSpan={cell.colspan}
                          className={`border-r border-gray-200 dark:border-neutral-700 last:border-r-0 relative
                            ${cellBgClasses[cell.bgColor] || ''}
                            ${selected ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
                          onClick={(e) => handleCellClick(rowIndex, currentColPos, e)}
                        >
                          <CellEditor
                            cell={cell}
                            onUpdate={(val) => updateCell(rowIndex, colIndex, val)}
                            onSetBgColor={(colorKey) => setCellBgColor(rowIndex, colIndex, colorKey)}
                            onSetAlign={(align) => setCellAlign(rowIndex, colIndex, align)}
                            onSetImage={(imageData) => setCellImage(rowIndex, colIndex, imageData)}
                            isActive={isActiveCellHere}
                            onActivate={() => setActiveCell({ rowIndex, colIndex })}
                            onOpenLightbox={setLightboxSrc}
                          />
                          {/* Unmerge button */}
                          {cell.colspan > 1 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); unmergeCells(rowIndex, colIndex); }}
                              className="absolute top-1 right-1 p-1 text-gray-400
                                hover:text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                              title="Unmerge cells"
                            >
                              <SplitSquareHorizontal size={14} />
                            </button>
                          )}
                        </td>
                      );
                    })}
                    {/* Row actions: reorder + delete */}
                    <td className="w-16 px-1">
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {rowIndex > 0 && (
                          <button
                            onClick={() => moveRow(rowIndex, -1)}
                            className="p-1 text-gray-400 hover:text-blue-500 rounded"
                            title="Move row up"
                          >
                            <ChevronUp size={14} />
                          </button>
                        )}
                        {rowIndex < rows.length - 1 && (
                          <button
                            onClick={() => moveRow(rowIndex, 1)}
                            className="p-1 text-gray-400 hover:text-blue-500 rounded"
                            title="Move row down"
                          >
                            <ChevronDown size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => removeRow(rowIndex)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded"
                          title="Delete row"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Row insert line */}
          {rowInsertIndex !== null && (
            <div
              className="absolute left-0 right-0 z-30 flex items-center pointer-events-none"
              style={{ top: rowInsertTop - 2 }}
            >
              <div className="flex items-center w-full pointer-events-auto">
                <div className="flex-1 h-[2px] bg-blue-500/60 rounded-full" />
                <button
                  onClick={() => insertRowAt(rowInsertIndex)}
                  className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 hover:bg-blue-600
                    text-white flex items-center justify-center shadow-md transition-transform hover:scale-110"
                  title="Insert row here"
                >
                  <Plus size={12} />
                </button>
                <div className="flex-1 h-[2px] bg-blue-500/60 rounded-full" />
              </div>
            </div>
          )}

          {/* Column insert line */}
          {colInsertIndex !== null && (
            <div
              className="absolute top-0 bottom-0 z-30 flex flex-col items-center pointer-events-none"
              style={{ left: colInsertLeft - 2 }}
            >
              <div className="flex flex-col items-center h-full pointer-events-auto">
                <div className="flex-1 w-[2px] bg-blue-500/60 rounded-full" />
                <button
                  onClick={() => insertColumnAt(colInsertIndex)}
                  className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 hover:bg-blue-600
                    text-white flex items-center justify-center shadow-md transition-transform hover:scale-110"
                  title="Insert column here"
                >
                  <Plus size={12} />
                </button>
                <div className="flex-1 w-[2px] bg-blue-500/60 rounded-full" />
              </div>
            </div>
          )}
        </div>

        {/* Add row button */}
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-blue-600 dark:text-blue-400
              hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
          >
            <Plus size={14} />
            Add row
          </button>
        </div>
        <style>{`
          .kb-table-cell-editor:empty:before {
            content: '\\00a0';
            color: transparent;
          }
          ${textColorStyles}
        `}</style>
        {lightboxSrc && <TableImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // VIEW MODE
  // ═══════════════════════════════════════════════

  if (!headers.length) return null;

  // Sort logic
  const handleSort = (colIndex) => {
    if (sortColumn === colIndex) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else if (sortDirection === 'desc') { setSortColumn(null); setSortDirection(null); }
      else setSortDirection('asc');
    } else {
      setSortColumn(colIndex);
      setSortDirection('asc');
    }
  };

  const getCellAtCol = (row, colIdx) => {
    let pos = 0;
    for (const cell of row) {
      if (colIdx >= pos && colIdx < pos + cell.colspan) return cell;
      pos += cell.colspan;
    }
    return null;
  };

  const sortedRows = (() => {
    if (sortColumn === null || sortDirection === null) return rows;
    return [...rows].sort((a, b) => {
      const cellA = getCellAtCol(a, sortColumn);
      const cellB = getCellAtCol(b, sortColumn);
      const valA = stripHtml(cellA?.content || '');
      const valB = stripHtml(cellB?.content || '');
      const numA = parseFloat(valA);
      const numB = parseFloat(valB);
      let cmp;
      if (!isNaN(numA) && !isNaN(numB)) cmp = numA - numB;
      else cmp = valA.localeCompare(valB, undefined, { sensitivity: 'base' });
      return sortDirection === 'desc' ? -cmp : cmp;
    });
  })();

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-neutral-700">
        <table className="min-w-full">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50/95 dark:bg-neutral-800/95 backdrop-blur-sm">
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-5 py-3.5 text-left text-[13px] font-semibold
                    text-gray-500 dark:text-neutral-400
                    border-b border-gray-200 dark:border-neutral-700
                    border-r border-r-gray-100 dark:border-r-neutral-700/50 last:border-r-0
                    cursor-pointer hover:bg-gray-100/50 dark:hover:bg-neutral-700/30 transition-colors select-none"
                  onClick={() => handleSort(index)}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{header}</span>
                    {sortColumn === index ? (
                      sortDirection === 'asc' ? <ArrowUp size={12} className="text-blue-500" />
                        : <ArrowDown size={12} className="text-blue-500" />
                    ) : (
                      <ArrowUpDown size={11} className="text-gray-300 dark:text-neutral-600" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-gray-100 dark:border-neutral-800 last:border-b-0
                  hover:bg-gray-50/50 dark:hover:bg-neutral-800/30 transition-colors"
              >
                {row.map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    colSpan={cell.colspan}
                    className={`px-5 py-3.5 text-[15px] text-gray-600 dark:text-neutral-400
                      border-r border-gray-100 dark:border-neutral-800 last:border-r-0
                      [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline
                      ${cellBgClasses[cell.bgColor] || ''}
                      ${alignClassMap[cell.align] || 'text-left'}`}
                    style={{ whiteSpace: 'pre-wrap' }}
                  >
                    {cell.image?.url && (
                      <img
                        src={cell.image.url}
                        alt=""
                        className="max-h-40 rounded cursor-pointer hover:opacity-90 transition-opacity object-contain mb-2"
                        onClick={() => setLightboxSrc(cell.image.url)}
                      />
                    )}
                    {cell.content && (
                      <div dangerouslySetInnerHTML={{ __html: cell.content }} />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style>{textColorStyles}</style>
      {lightboxSrc && <TableImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </>
  );
};

export default TableBlock;
