import React from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

const CanvasToolbar = ({ onZoomIn, onZoomOut, onReset }) => {
  return (
    <div className="absolute top-4 right-4 z-50 flex gap-2 bg-white dark:bg-black rounded-lg shadow-lg p-2 border border-gray-200 dark:border-neutral-800">
      <button
        onClick={onZoomIn}
        className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors duration-200"
        title="Zoom In"
      >
        <ZoomIn className="w-5 h-5 text-gray-700 dark:text-neutral-300" />
      </button>

      <button
        onClick={onZoomOut}
        className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors duration-200"
        title="Zoom Out"
      >
        <ZoomOut className="w-5 h-5 text-gray-700 dark:text-neutral-300" />
      </button>

      <div className="w-px bg-gray-300 dark:bg-neutral-700" />

      <button
        onClick={onReset}
        className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors duration-200"
        title="Reset View"
      >
        <Maximize2 className="w-5 h-5 text-gray-700 dark:text-neutral-300" />
      </button>
    </div>
  );
};

export default CanvasToolbar;
