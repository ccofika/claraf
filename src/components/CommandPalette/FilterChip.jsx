import React from 'react';
import { X } from 'lucide-react';

const FilterChip = ({ label, onRemove, icon: Icon }) => {
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-medium">
      {Icon && <Icon size={12} />}
      <span>{label}</span>
      <button
        onClick={onRemove}
        className="ml-0.5 hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded p-0.5 transition-colors"
        title="Remove filter"
      >
        <X size={12} />
      </button>
    </div>
  );
};

export default FilterChip;
