import React from 'react';
import { X, Play, Clock, User } from 'lucide-react';
import BlockRenderer from '../BlockRenderer';

const TemplatePreview = ({ template, onUse, onClose, isAdmin }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[700px] max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{template.icon || '📋'}</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{template.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{template.category}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Description */}
        {template.description && (
          <div className="px-4 pt-3">
            <p className="text-sm text-gray-600 dark:text-gray-300">{template.description}</p>
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 px-4 py-2 text-xs text-gray-400">
          {template.createdBy && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {template.createdBy.name || template.createdBy.email}
            </span>
          )}
          {template.createdAt && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(template.createdAt).toLocaleDateString()}
            </span>
          )}
          <span>{template.blocks?.length || 0} blocks</span>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 border-t border-gray-100 dark:border-gray-700">
          {template.blocks && template.blocks.length > 0 ? (
            <div className="space-y-2">
              {template.blocks.map((block, idx) => (
                <BlockRenderer
                  key={block.id || idx}
                  block={block}
                  content={block.defaultContent}
                  isEditing={false}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic text-center py-8">Empty template</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onUse}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Play className="w-4 h-4" />
            Use Template
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview;
