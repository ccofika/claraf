import React from 'react';
import { Trash2, X } from 'lucide-react';
import { Badge } from '../ui/badge';

const BulkActionsToolbar = ({ selectedCount, onDelete, onCancel }) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-card border-2 border-border shadow-lg rounded-lg px-6 py-4 flex items-center gap-4 animate-in slide-in-from-bottom-2">
        {/* Selection Count */}
        <div className="flex items-center gap-2">
          <Badge variant="default" className="px-2 py-1">
            {selectedCount}
          </Badge>
          <span className="text-sm font-medium text-foreground">
            {selectedCount === 1 ? 'item' : 'items'} selected
          </span>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-border" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>

          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 border border-input rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsToolbar;
