import React from 'react';
import { Clock, X } from 'lucide-react';

const RecentSearches = ({ history, onSearchClick, onRemoveClick, onClearAll }) => {
  if (history.length === 0) return null;

  return (
    <div className="border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/50">
      {/* Header */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-gray-500 dark:text-neutral-400" />
          <span className="text-xs font-medium text-gray-600 dark:text-neutral-400">
            Recent Searches
          </span>
        </div>
        <button
          onClick={onClearAll}
          className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
        >
          Clear all
        </button>
      </div>

      {/* Recent Search Items */}
      <div className="p-2 space-y-1">
        {history.map((item, index) => (
          <div
            key={`${item.query}-${index}`}
            className="group flex items-center justify-between gap-2 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <button
              onClick={() => onSearchClick(item.query)}
              className="flex-1 text-left text-sm text-gray-700 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white truncate"
            >
              {item.query}
            </button>

            <button
              onClick={() => onRemoveClick(item.query)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 dark:hover:bg-neutral-700 transition-all"
              title="Remove from history"
            >
              <X size={14} className="text-gray-500 dark:text-neutral-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentSearches;
