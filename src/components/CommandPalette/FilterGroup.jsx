import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FilterGroup = ({ title, children, defaultExpanded = true }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border-b border-gray-200 dark:border-neutral-800 last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {title}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-500 dark:text-neutral-400 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isExpanded && (
        <div className="px-4 pb-2 space-y-1.5">
          {children}
        </div>
      )}
    </div>
  );
};

export default FilterGroup;
