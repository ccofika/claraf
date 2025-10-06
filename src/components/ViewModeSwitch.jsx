import React from 'react';
import { Switch } from './ui/switch';
import { Edit3, Eye } from 'lucide-react';

const ViewModeSwitch = ({ isViewMode, onToggle }) => {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-gray-200 dark:border-neutral-800 rounded-xl shadow-lg">
      <div className="flex items-center gap-2">
        <Edit3
          size={16}
          className={`transition-colors ${
            !isViewMode
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-400 dark:text-neutral-600'
          }`}
        />
        <span className={`text-sm font-medium transition-colors ${
          !isViewMode
            ? 'text-gray-900 dark:text-neutral-100'
            : 'text-gray-500 dark:text-neutral-500'
        }`}>
          Edit
        </span>
      </div>

      <Switch
        checked={isViewMode}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-blue-600 dark:data-[state=checked]:bg-blue-500"
      />

      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium transition-colors ${
          isViewMode
            ? 'text-gray-900 dark:text-neutral-100'
            : 'text-gray-500 dark:text-neutral-500'
        }`}>
          View
        </span>
        <Eye
          size={16}
          className={`transition-colors ${
            isViewMode
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-400 dark:text-neutral-600'
          }`}
        />
      </div>
    </div>
  );
};

export default ViewModeSwitch;
