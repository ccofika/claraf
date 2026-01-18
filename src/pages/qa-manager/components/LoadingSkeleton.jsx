import React from 'react';

const LoadingSkeleton = () => (
  <div className="space-y-4">
    <div className="h-32 bg-gray-100 dark:bg-neutral-800 rounded-lg animate-pulse"></div>
    <div className="h-32 bg-gray-100 dark:bg-neutral-800 rounded-lg animate-pulse"></div>
    <div className="h-32 bg-gray-100 dark:bg-neutral-800 rounded-lg animate-pulse"></div>
  </div>
);

export default LoadingSkeleton;
