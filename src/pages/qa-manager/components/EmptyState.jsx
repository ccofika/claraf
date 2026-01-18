import React from 'react';

const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="w-12 h-12 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-gray-400 dark:text-neutral-500" />
    </div>
    <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">{title}</h3>
    <p className="text-sm text-gray-500 dark:text-neutral-400 mb-6 text-center max-w-sm">{description}</p>
    {action}
  </div>
);

export default EmptyState;
