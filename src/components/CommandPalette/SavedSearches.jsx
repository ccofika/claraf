import React from 'react';
import { Star, X } from 'lucide-react';

const SavedSearches = ({ savedSearches, onSearchClick, onRemoveClick, onClearAll }) => {
  if (savedSearches.length === 0) return null;

  return (
    <div className="border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/50">
      {/* Header */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star size={14} className="text-yellow-500 dark:text-yellow-400 fill-yellow-500 dark:fill-yellow-400" />
          <span className="text-xs font-medium text-gray-600 dark:text-neutral-400">
            Saved Searches
          </span>
        </div>
        <button
          onClick={onClearAll}
          className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
        >
          Clear all
        </button>
      </div>

      {/* Saved Search Items */}
      <div className="p-2 space-y-1">
        {savedSearches.map((search) => (
          <div
            key={search.id}
            className="group flex items-center justify-between gap-2 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <button
              onClick={() => onSearchClick(search)}
              className="flex-1 text-left"
            >
              <div className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">
                {search.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-neutral-400 truncate">
                {search.query || 'No query'}
                {search.filters && (search.filters.elementTypes?.length > 0 || search.filters.workspaceIds?.length > 0) && (
                  <span className="ml-2 text-blue-600 dark:text-blue-400">
                    • {(search.filters.elementTypes?.length || 0) + (search.filters.workspaceIds?.length || 0)} filters
                  </span>
                )}
              </div>
            </button>

            <button
              onClick={() => onRemoveClick(search.id)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 dark:hover:bg-neutral-700 transition-all"
              title="Remove saved search"
            >
              <X size={14} className="text-gray-500 dark:text-neutral-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedSearches;
