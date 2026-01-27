import React from 'react';

const DividerBlock = () => {
  return (
    <div className="my-10 flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-neutral-600" />
        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-neutral-600" />
        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-neutral-600" />
      </div>
    </div>
  );
};

export default DividerBlock;
