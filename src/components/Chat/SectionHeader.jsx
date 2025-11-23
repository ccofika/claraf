import React, { useState } from 'react';
import { ChevronDown, ChevronRight, MoreVertical, Edit2, Trash2 } from 'lucide-react';

const SectionHeader = ({
  section,
  isCollapsed,
  onToggleCollapse,
  onEdit,
  onDelete,
  channelCount
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="group px-2 py-1 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-neutral-900/50 transition-colors">
      <button
        onClick={onToggleCollapse}
        className="flex-1 flex items-center gap-2 text-left"
      >
        {isCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5 text-gray-500 dark:text-neutral-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-gray-500 dark:text-neutral-400" />
        )}

        <div className="flex items-center gap-1.5">
          {section.emoji && (
            <span className="text-[14px]">{section.emoji}</span>
          )}
          <span
            className="text-[13px] font-semibold text-gray-700 dark:text-neutral-300"
            style={section.color ? { color: section.color } : {}}
          >
            {section.name}
          </span>
          {channelCount > 0 && (
            <span className="text-[11px] text-gray-500 dark:text-neutral-500">
              ({channelCount})
            </span>
          )}
        </div>
      </button>

      {/* More menu */}
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-neutral-800 rounded transition-opacity"
        >
          <MoreVertical className="w-3.5 h-3.5 text-gray-500 dark:text-neutral-400" />
        </button>

        {showMenu && (
          <>
            {/* Backdrop to close menu */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />

            {/* Menu */}
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#1A1D21] border border-gray-200 dark:border-neutral-700 shadow-lg py-1 z-20">
              <button
                onClick={() => {
                  onEdit();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 flex items-center gap-3 text-[14px] text-gray-900 dark:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit section</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm(`Delete section "${section.name}"? Channels will not be deleted.`)) {
                    onDelete();
                  }
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 flex items-center gap-3 text-[14px] text-red-600 dark:text-red-500 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete section</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SectionHeader;
