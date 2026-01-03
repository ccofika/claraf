import React from 'react';
import { Calendar, Check } from 'lucide-react';

const DateRangePicker = ({ value, options, onChange, onClose }) => {
  const currentType = value?.type || 'last30days';

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute left-0 top-full mt-1 z-20 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-gray-200 dark:border-neutral-700 py-1 min-w-[200px]">
        {options.map(option => (
          <button
            key={option.value}
            onClick={() => onChange({ type: option.value })}
            className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-gray-100 dark:hover:bg-neutral-700 ${
              currentType === option.value
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <span>{option.label}</span>
            {currentType === option.value && <Check className="w-4 h-4" />}
          </button>
        ))}
      </div>
    </>
  );
};

export default DateRangePicker;
