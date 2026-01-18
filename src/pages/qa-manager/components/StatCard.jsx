import React from 'react';

const StatCard = ({ icon: Icon, label, value, trend, accent = 'gray' }) => {
  const accentColors = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    purple: 'text-purple-600 dark:text-purple-400',
    gray: 'text-gray-600 dark:text-gray-400'
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-4 hover:shadow-md dark:hover:shadow-neutral-900/50 transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
          {trend && <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">{trend}</p>}
        </div>
        <div className={`${accentColors[accent]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
