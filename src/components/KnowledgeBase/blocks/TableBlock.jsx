import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Plus, X, Merge, SplitSquareHorizontal } from 'lucide-react';
import { useKnowledgeBase } from '../../../context/KnowledgeBaseContext';
import useRichTextEditor, { textColorStyles } from '../../../hooks/useRichTextEditor';
import RichTextToolbar from './RichTextToolbar';

// Normalize a cell to { content, colspan } format
const normalizeCell = (cell) => {
  if (typeof cell === 'string') return { content: cell, colspan: 1 };
  if (cell && typeof cell === 'object' && 'content' in cell) {
    return { content: cell.content || '', colspan: cell.colspan || 1 };
  }
  return { content: '', colspan: 1 };
};

// Normalize a full row
const normalizeRow = (row, headerCount) => {
  if (!Array.isArray(row)) return new Array(headerCount).fill(null).map(() => ({ content: '', colspan: 1 }));

  const cells = row.map(normalizeCell);

  // Verify total colspan matches header count; if not, fix it
  const totalColspan = cells.reduce((sum, c) => sum + c.colspan, 0);
  if (totalColspan < headerCount) {
    const diff = headerCount - totalColspan;
    for (let i = 0; i < diff; i++) {
      cells.push({ content: '', colspan: 1 });
    }
  }

  return cells;
};

// Rich text cell editor component
const CellEditor = ({ cell, onUpdate, isActive, onActivate }) => {
  const { pageTree } = useKnowledgeBase();
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

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

  const handleInput = useCallback((e) => {
    onUpdate(e.target.innerHTML);
  }, [onUpdate]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onActivate();
  }, [onActivate]);

  return (
    <div ref={richText.wrapperRef} style={{ position: 'relative' }}>
      <div
        ref={editorRef}
        contentEditable
        onFocus={handleFocus}
        onBlur={() => setIsFocused(false)}
        onInput={handleInput}
        onMouseUp={richText.handleSelectionChange}
        onKeyUp={richText.handleSelectionChange}
        className="kb-table-cell-editor w-full px-4 py-3 bg-transparent text-[14px]
          text-gray-700 dark:text-neutral-300
          focus:outline-none focus:bg-gray-50 dark:focus:bg-neutral-800
          [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline"
        style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word', minHeight: '44px' }}
        suppressContentEditableWarning
      />
      {isActive && <RichTextToolbar {...richText} pageTree={pageTree} />}
    </div>
  );
};

const TableBlock = ({ content, isEditing, onUpdate }) => {
  const tableData = typeof content === 'object' && content !== null
    ? content
    : { headers: ['Column 1', 'Column 2'], rows: [['', '']] };

  const headers = tableData.headers || [];
  const rawRows = tableData.rows || [];
  const rows = rawRows.map(row => normalizeRow(row, headers.length));

  // Cell selection for merging
  const [selectedCells, setSelectedCells] = useState(null); // { rowIndex, startCol, endCol }
  const [activeCell, setActiveCell] = useState(null); // { rowIndex, colIndex } for toolbar

  const emitUpdate = useCallback((newHeaders, newRows) => {
    onUpdate?.({ headers: newHeaders, rows: newRows });
  }, [onUpdate]);

  const addColumn = () => {
    const newHeaders = [...headers, `Column ${headers.length + 1}`];
    const newRows = rows.map(row => [...row, { content: '', colspan: 1 }]);
    emitUpdate(newHeaders, newRows);
  };

  const addRow = () => {
    const newRow = new Array(headers.length).fill(null).map(() => ({ content: '', colspan: 1 }));
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

    // For each row, rebuild cells accounting for colspan
    const newRows = rows.map(row => {
      const result = [];
      let colPos = 0;
      for (const cell of row) {
        const cellEnd = colPos + cell.colspan;
        if (index >= colPos && index < cellEnd) {
          // This cell spans the removed column
          if (cell.colspan > 1) {
            result.push({ ...cell, colspan: cell.colspan - 1 });
          }
          // If colspan was 1, skip entirely (remove the cell)
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

  // Merge selected cells in a row
  const mergeCells = () => {
    if (!selectedCells) return;
    const { rowIndex, startCol, endCol } = selectedCells;
    const row = rows[rowIndex];

    // Find cell indices that cover startCol..endCol
    let colPos = 0;
    let startCellIdx = -1;
    let endCellIdx = -1;

    for (let i = 0; i < row.length; i++) {
      const cellEnd = colPos + row[i].colspan;
      if (colPos <= startCol && startCol < cellEnd) startCellIdx = i;
      if (colPos <= endCol && endCol < cellEnd) endCellIdx = i;
      colPos = cellEnd;
    }

    if (startCellIdx === -1 || endCellIdx === -1 || startCellIdx === endCellIdx) return;

    // Merge: combine content, sum colspan
    const mergedContent = row.slice(startCellIdx, endCellIdx + 1)
      .map(c => c.content).filter(Boolean).join(' ');
    const mergedColspan = row.slice(startCellIdx, endCellIdx + 1)
      .reduce((sum, c) => sum + c.colspan, 0);

    const newRow = [
      ...row.slice(0, startCellIdx),
      { content: mergedContent, colspan: mergedColspan },
      ...row.slice(endCellIdx + 1)
    ];

    const newRows = rows.map((r, i) => i === rowIndex ? newRow : r);
    setSelectedCells(null);
    emitUpdate(headers, newRows);
  };

  // Unmerge a cell back to individual cells
  const unmergeCells = (rowIndex, colIndex) => {
    const row = rows[rowIndex];
    const cell = row[colIndex];
    if (!cell || cell.colspan <= 1) return;

    const newCells = [];
    newCells.push({ content: cell.content, colspan: 1 });
    for (let i = 1; i < cell.colspan; i++) {
      newCells.push({ content: '', colspan: 1 });
    }

    const newRow = [
      ...row.slice(0, colIndex),
      ...newCells,
      ...row.slice(colIndex + 1)
    ];

    const newRows = rows.map((r, i) => i === rowIndex ? newRow : r);
    emitUpdate(headers, newRows);
  };

  // Handle cell click for selection (shift+click to extend)
  const handleCellClick = (rowIndex, colPos, e) => {
    if (e.shiftKey && selectedCells && selectedCells.rowIndex === rowIndex) {
      // Extend selection
      const newStart = Math.min(selectedCells.startCol, colPos);
      const newEnd = Math.max(selectedCells.endCol, colPos);
      if (newStart !== newEnd) {
        setSelectedCells({ rowIndex, startCol: newStart, endCol: newEnd });
      }
    } else {
      // Start new selection
      setSelectedCells({ rowIndex, startCol: colPos, endCol: colPos });
    }
  };

  // Check if a column position is within the selection
  const isCellSelected = (rowIndex, colPos, colspan) => {
    if (!selectedCells || selectedCells.rowIndex !== rowIndex) return false;
    const cellEnd = colPos + colspan - 1;
    return colPos <= selectedCells.endCol && cellEnd >= selectedCells.startCol;
  };

  // Check if merge is possible (2+ cells selected)
  const canMerge = () => {
    if (!selectedCells) return false;
    const { rowIndex, startCol, endCol } = selectedCells;
    if (startCol === endCol) return false;
    const row = rows[rowIndex];
    let colPos = 0;
    let cellCount = 0;
    for (const cell of row) {
      const cellEnd = colPos + cell.colspan;
      if (colPos <= endCol && cellEnd - 1 >= startCol) cellCount++;
      colPos = cellEnd;
    }
    return cellCount >= 2;
  };

  if (isEditing) {
    return (
      <div className="overflow-x-auto">
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

        <table className="min-w-full border border-gray-200 dark:border-neutral-700 rounded-lg overflow-hidden">
          <thead className="bg-gray-100 dark:bg-neutral-800">
            <tr>
              {headers.map((header, index) => (
                <th key={index} className="relative group">
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
                <tr key={rowIndex} className="group border-t border-gray-200 dark:border-neutral-700">
                  {row.map((cell, colIndex) => {
                    const currentColPos = colPos;
                    colPos += cell.colspan;
                    const selected = isCellSelected(rowIndex, currentColPos, cell.colspan);

                    return (
                      <td
                        key={colIndex}
                        colSpan={cell.colspan}
                        className={`border-r border-gray-200 dark:border-neutral-700 last:border-r-0 relative
                          ${selected ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
                        onClick={(e) => handleCellClick(rowIndex, currentColPos, e)}
                      >
                        <CellEditor
                          cell={cell}
                          onUpdate={(val) => updateCell(rowIndex, colIndex, val)}
                          isActive={activeCell?.rowIndex === rowIndex && activeCell?.colIndex === colIndex}
                          onActivate={() => setActiveCell({ rowIndex, colIndex })}
                        />
                        {/* Unmerge button for merged cells */}
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
                  <td className="w-12 px-2">
                    <button
                      onClick={() => removeRow(rowIndex)}
                      className="p-1.5 text-gray-400 hover:text-red-500
                        opacity-0 group-hover:opacity-100 transition-opacity rounded"
                    >
                      <X size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
      </div>
    );
  }

  if (!headers.length) return null;

  return (
    <>
      <div className="overflow-x-auto my-6">
        <table className="min-w-full border border-gray-200 dark:border-neutral-700 rounded-lg overflow-hidden">
          <thead className="bg-gray-100 dark:bg-neutral-800">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-5 py-3 text-left text-[13px] font-semibold uppercase tracking-wide
                    text-gray-600 dark:text-neutral-300
                    border-r border-gray-200 dark:border-neutral-700 last:border-r-0"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-neutral-900/50">
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-t border-gray-200 dark:border-neutral-700"
              >
                {row.map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    colSpan={cell.colspan}
                    className="px-5 py-3 text-[15px] text-gray-700 dark:text-neutral-300
                      border-r border-gray-200 dark:border-neutral-700 last:border-r-0
                      [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline"
                    style={{ whiteSpace: 'pre-wrap' }}
                    dangerouslySetInnerHTML={{ __html: cell.content }}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style>{textColorStyles}</style>
    </>
  );
};

export default TableBlock;
