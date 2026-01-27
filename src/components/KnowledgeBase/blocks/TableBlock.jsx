import React from 'react';
import { Plus, X } from 'lucide-react';

const TableBlock = ({ content, isEditing, onUpdate }) => {
  // Content structure: { headers: string[], rows: string[][] }
  const tableData = typeof content === 'object' && content !== null
    ? content
    : { headers: ['Column 1', 'Column 2'], rows: [['', '']] };

  const headers = tableData.headers || [];
  const rows = tableData.rows || [];

  const addColumn = () => {
    const newHeaders = [...headers, `Column ${headers.length + 1}`];
    const newRows = rows.map(row => [...row, '']);
    onUpdate?.({ headers: newHeaders, rows: newRows });
  };

  const addRow = () => {
    const newRow = new Array(headers.length).fill('');
    onUpdate?.({ headers, rows: [...rows, newRow] });
  };

  const updateHeader = (index, value) => {
    const newHeaders = [...headers];
    newHeaders[index] = value;
    onUpdate?.({ headers: newHeaders, rows });
  };

  const updateCell = (rowIndex, colIndex, value) => {
    const newRows = rows.map((row, ri) =>
      ri === rowIndex
        ? row.map((cell, ci) => (ci === colIndex ? value : cell))
        : row
    );
    onUpdate?.({ headers, rows: newRows });
  };

  const removeColumn = (index) => {
    if (headers.length <= 1) return;
    const newHeaders = headers.filter((_, i) => i !== index);
    const newRows = rows.map(row => row.filter((_, i) => i !== index));
    onUpdate?.({ headers: newHeaders, rows: newRows });
  };

  const removeRow = (index) => {
    const newRows = rows.filter((_, i) => i !== index);
    onUpdate?.({ headers, rows: newRows });
  };

  if (isEditing) {
    return (
      <div className="overflow-x-auto">
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
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="group border-t border-gray-200 dark:border-neutral-700">
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="border-r border-gray-200 dark:border-neutral-700 last:border-r-0">
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                      className="w-full px-4 py-3 bg-transparent text-[14px]
                        text-gray-700 dark:text-neutral-300
                        focus:outline-none focus:bg-gray-50 dark:focus:bg-neutral-800"
                    />
                  </td>
                ))}
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
            ))}
          </tbody>
        </table>
        <button
          onClick={addRow}
          className="mt-3 flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-blue-600 dark:text-blue-400
            hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
        >
          <Plus size={14} />
          Add row
        </button>
      </div>
    );
  }

  if (!headers.length) return null;

  return (
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
                  className="px-5 py-3 text-[15px] text-gray-700 dark:text-neutral-300
                    border-r border-gray-200 dark:border-neutral-700 last:border-r-0"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableBlock;
