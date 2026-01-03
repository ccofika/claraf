import React from 'react';

const DimensionSelector = ({
  viewBy,
  segmentBy,
  topN,
  sortBy,
  sortOrder,
  options,
  onChange
}) => {
  return (
    <div className="space-y-4">
      {/* View By (Primary dimension) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          View By (X-axis / Grouping)
        </label>
        <select
          value={viewBy}
          onChange={(e) => onChange({ viewBy: e.target.value })}
          className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          How to group or display data on the chart
        </p>
      </div>

      {/* Segment By (Secondary dimension) - only for certain chart types */}
      {viewBy !== 'none' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Segment By (Color / Series)
          </label>
          <select
            value={segmentBy || ''}
            onChange={(e) => onChange({ segmentBy: e.target.value || null })}
            className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No segmentation</option>
            {options
              .filter(opt => opt.value !== 'none' && opt.value !== viewBy)
              .map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Add a second dimension for stacked/grouped charts
          </p>
        </div>
      )}

      {/* Sorting and limiting */}
      {viewBy !== 'none' && (
        <div className="grid grid-cols-2 gap-4">
          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sort By
            </label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => onChange({ sortBy: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="value">Value</option>
                <option value="label">Label</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => onChange({ sortOrder: e.target.value })}
                className="w-20 px-2 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
          </div>

          {/* Top N */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Limit Results
            </label>
            <select
              value={topN || ''}
              onChange={(e) => onChange({ topN: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="">Show all</option>
              <option value="5">Top 5</option>
              <option value="10">Top 10</option>
              <option value="15">Top 15</option>
              <option value="20">Top 20</option>
              <option value="50">Top 50</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default DimensionSelector;
