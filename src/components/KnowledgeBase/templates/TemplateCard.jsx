import React from 'react';
import { Trash2, BarChart3 } from 'lucide-react';

const TemplateCard = ({ template, onClick, isAdmin, onDelete }) => {
  return (
    <div
      onClick={onClick}
      className="group relative border border-gray-200 dark:border-gray-600 rounded-lg p-4 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all bg-white dark:bg-gray-800"
    >
      {/* Cover / Icon */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{template.icon || '📋'}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-gray-900 dark:text-white truncate">
            {template.title}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {template.category}
          </span>
        </div>
      </div>

      {/* Description */}
      {template.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
          {template.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <BarChart3 className="w-3 h-3" />
          <span>{template.usageCount || 0} uses</span>
        </div>
        {template.blocks?.length > 0 && (
          <span>{template.blocks.length} blocks</span>
        )}
      </div>

      {/* Admin delete */}
      {isAdmin && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(template._id);
          }}
          className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-500" />
        </button>
      )}
    </div>
  );
};

export default TemplateCard;
