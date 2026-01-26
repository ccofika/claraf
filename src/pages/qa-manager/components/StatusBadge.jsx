import React from 'react';

const StatusBadge = ({ status }) => {
  const statusConfig = {
    'Selected': { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400', label: 'Selected' },
    'Graded': { color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400', label: 'Graded' },
    'Draft': { color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400', label: 'Draft' },
    'Waiting on your input': { color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400', label: 'Waiting on your input' },
    'archived': { color: 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400', label: 'Archived' },
  };

  const config = statusConfig[status] || statusConfig['Selected'];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
