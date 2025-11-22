import React, { useState, useEffect, useRef } from 'react';
import { X, Save } from 'lucide-react';

const SaveSearchDialog = ({ isOpen, onClose, onSave, currentQuery, currentFilters }) => {
  const [name, setName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      // Generate default name
      const filterCount = (currentFilters.elementTypes?.length || 0) + (currentFilters.workspaceIds?.length || 0);
      const defaultName = currentQuery ?
        `"${currentQuery.substring(0, 20)}${currentQuery.length > 20 ? '...' : ''}"` :
        `Search ${filterCount > 0 ? `with ${filterCount} filters` : ''}`;
      setName(defaultName);
    }
  }, [isOpen, currentQuery, currentFilters]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), currentQuery, currentFilters);
      setName('');
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md mx-4 bg-white dark:bg-neutral-900 rounded-lg shadow-2xl animate-scaleIn border border-gray-200 dark:border-neutral-800">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Save size={18} className="text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Save Search
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={16} className="text-gray-500 dark:text-neutral-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-2">
            Search Name
          </label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter a name for this search..."
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />

          {/* Preview */}
          <div className="mt-3 p-3 bg-gray-50 dark:bg-neutral-800/50 rounded-md">
            <div className="text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">
              Preview:
            </div>
            <div className="text-xs text-gray-600 dark:text-neutral-400">
              Query: <span className="font-medium">{currentQuery || '(empty)'}</span>
            </div>
            {((currentFilters.elementTypes?.length || 0) + (currentFilters.workspaceIds?.length || 0)) > 0 && (
              <div className="text-xs text-gray-600 dark:text-neutral-400 mt-1">
                Filters: <span className="font-medium">
                  {(currentFilters.elementTypes?.length || 0) + (currentFilters.workspaceIds?.length || 0)} active
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors"
          >
            Save Search
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveSearchDialog;
