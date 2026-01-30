import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

const RestoreConfirmModal = ({ version, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[420px] overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Restore Version {version.version}?
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            This will replace the current page content with the content from version {version.version}.
          </p>
          <p className="text-xs text-gray-400 mb-1">
            {version.changesSummary}
          </p>
          <p className="text-xs text-gray-400">
            Created: {new Date(version.createdAt).toLocaleString()}
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
            A new version will be created with the current content before restoring.
          </p>
        </div>
        <div className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Restore
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestoreConfirmModal;
