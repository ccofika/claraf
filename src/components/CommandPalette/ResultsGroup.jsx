import React from 'react';

const ResultsGroup = ({ title, count, children, icon: Icon }) => {
  if (!children || count === 0) return null;

  return (
    <div className="mb-4 last:mb-0">
      {/* Group Header */}
      <div className="sticky top-0 z-10 px-4 py-2 bg-gray-100 dark:bg-neutral-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={14} className="text-gray-600 dark:text-neutral-400" />}
          <span className="text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wide">
            {title}
          </span>
          <span className="ml-auto text-xs text-gray-500 dark:text-neutral-500">
            {count} {count === 1 ? 'result' : 'results'}
          </span>
        </div>
      </div>

      {/* Group Items */}
      <div>
        {children}
      </div>
    </div>
  );
};

export default ResultsGroup;
