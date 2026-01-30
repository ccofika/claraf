import React, { useState } from 'react';
import { Columns, Plus, Trash2, GripVertical } from 'lucide-react';
import BlockRenderer from '../BlockRenderer';

const ColumnsBlock = ({ block, content, isEditing, onUpdate }) => {
  const [dragCol, setDragCol] = useState(null);

  // Content structure: { columns: [{ id, width, blocks: [] }] }
  const columnsData = typeof content === 'object' && content !== null && content.columns
    ? content
    : { columns: [
        { id: 'col1', width: 50, blocks: [] },
        { id: 'col2', width: 50, blocks: [] }
      ] };

  const addColumn = () => {
    if (columnsData.columns.length >= 5) return;
    const newWidth = Math.floor(100 / (columnsData.columns.length + 1));
    const updatedColumns = columnsData.columns.map(col => ({
      ...col,
      width: newWidth
    }));
    updatedColumns.push({
      id: `col_${Date.now()}`,
      width: newWidth,
      blocks: []
    });
    // Redistribute widths evenly
    const evenWidth = Math.floor(100 / updatedColumns.length);
    const remainder = 100 - (evenWidth * updatedColumns.length);
    updatedColumns.forEach((col, i) => {
      col.width = evenWidth + (i === 0 ? remainder : 0);
    });
    onUpdate?.({ columns: updatedColumns });
  };

  const removeColumn = (colIndex) => {
    if (columnsData.columns.length <= 2) return;
    const newColumns = columnsData.columns.filter((_, i) => i !== colIndex);
    const evenWidth = Math.floor(100 / newColumns.length);
    const remainder = 100 - (evenWidth * newColumns.length);
    newColumns.forEach((col, i) => {
      col.width = evenWidth + (i === 0 ? remainder : 0);
    });
    onUpdate?.({ columns: newColumns });
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
                    // Adjust adjacent column
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
                {columnsData.columns.length > 2 && (
                  <button
                    onClick={() => removeColumn(index)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div>
          <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            Preview
          </label>
          <div className="flex gap-2 h-16">
            {columnsData.columns.map((col) => (
              <div
                key={col.id}
                className="bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center text-[12px] text-blue-600 dark:text-blue-400"
                style={{ width: `${col.width}%` }}
              >
                {col.width}%
              </div>
            ))}
          </div>
        </div>

        <p className="text-[12px] text-gray-400 dark:text-neutral-500">
          Column content is rendered in view mode. Add blocks to each column from the page editor.
        </p>
      </div>
    );
  }

  // View mode - responsive columns: stack on mobile, side-by-side on desktop
  return (
    <div className="flex flex-col md:flex-row gap-4 my-4" style={{ minHeight: '40px' }}>
      {columnsData.columns.map((col) => (
        <div
          key={col.id}
          className="min-h-[40px]"
          style={{ flex: `0 0 ${col.width}%` }}
        >
          {col.blocks && col.blocks.length > 0 ? (
            <div className="space-y-2">
              {col.blocks.map((childBlock) => (
                <BlockRenderer key={childBlock.id} block={childBlock} />
              ))}
            </div>
          ) : (
            <div className="h-full min-h-[40px] border border-dashed border-gray-200 dark:border-neutral-700 rounded-lg flex items-center justify-center">
              <span className="text-[12px] text-gray-300 dark:text-neutral-600">Empty column</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ColumnsBlock;
