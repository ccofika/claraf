import React, { useState, useRef, useEffect } from 'react';
import { Undo, Redo, Settings, X } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import RichTextEditor from './RichTextEditor';
import { useTheme } from '../context/ThemeContext';
import { getAdaptiveColor, getAdaptiveBackgroundColor } from '../utils/colorUtils';

const DescriptionElement = ({ element, canEdit, onUpdate, onDelete, onSettingsClick }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(element?.content?.value || '');
  const [history, setHistory] = useState(element?.content?.history || []);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const [currentValue, setCurrentValue] = useState(element?.content?.value || '');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: element._id,
    disabled: !canEdit || isEditing,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    position: 'absolute',
    left: `${element.position.x}px`,
    top: `${element.position.y}px`,
    zIndex: element.position.z || 999,
    cursor: isDragging ? 'grabbing' : isEditing ? 'text' : canEdit ? 'grab' : 'default',
    pointerEvents: 'auto',
    touchAction: isEditing ? 'auto' : 'none',
    userSelect: isEditing ? 'text' : 'none',
  };


  const handleDoubleClick = () => {
    if (canEdit) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    if (isEditing) {
      confirmEdit();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      setValue(element?.content?.value || '');
    }
  };

  const confirmEdit = () => {
    setIsEditing(false);

    if (value !== element?.content?.value) {
      // Add to history (keep last 3)
      const newHistory = [
        {
          value: element?.content?.value,
          timestamp: new Date()
        },
        ...history
      ].slice(0, 3);

      setHistory(newHistory);
      setCurrentHistoryIndex(-1);

      // Update element
      onUpdate?.({
        ...element,
        content: {
          ...element.content,
          value,
          history: newHistory
        }
      });
    }
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const newIndex = currentHistoryIndex + 1;
      if (newIndex < history.length) {
        // Save current value if this is first undo
        if (currentHistoryIndex === -1) {
          setCurrentValue(value);
        }

        const previousValue = history[newIndex].value;
        setValue(previousValue);
        setCurrentHistoryIndex(newIndex);

        onUpdate?.({
          ...element,
          content: {
            ...element.content,
            value: previousValue
          }
        });
      }
    }
  };

  const handleRedo = () => {
    if (currentHistoryIndex > 0) {
      const newIndex = currentHistoryIndex - 1;
      const nextValue = history[newIndex].value;
      setValue(nextValue);
      setCurrentHistoryIndex(newIndex);

      onUpdate?.({
        ...element,
        content: {
          ...element.content,
          value: nextValue
        }
      });
    } else if (currentHistoryIndex === 0) {
      // Redo to current value
      setValue(currentValue);
      setCurrentHistoryIndex(-1);

      onUpdate?.({
        ...element,
        content: {
          ...element.content,
          value: currentValue
        }
      });
    }
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    onDelete?.(element._id);
  };

  const canUndo = history.length > 0 && currentHistoryIndex < history.length - 1;
  const canRedo = currentHistoryIndex >= 0;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="group canvas-draggable-element"
      >
        <div className="relative">
        {/* Action Buttons - Top Right */}
        {canEdit && (
          <div className="absolute -top-10 right-0 flex gap-1 bg-white dark:bg-black rounded-lg shadow-lg border border-gray-200 dark:border-neutral-800 p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUndo();
              }}
              disabled={!canUndo}
              className={`p-1.5 rounded-md transition-colors ${
                canUndo
                  ? 'hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300'
                  : 'text-gray-300 dark:text-neutral-600 cursor-not-allowed'
              }`}
              title="Undo"
            >
              <Undo size={14} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRedo();
              }}
              disabled={!canRedo}
              className={`p-1.5 rounded-md transition-colors ${
                canRedo
                  ? 'hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300'
                  : 'text-gray-300 dark:text-neutral-600 cursor-not-allowed'
              }`}
              title="Redo"
            >
              <Redo size={14} />
            </button>

            <div className="w-px bg-gray-300 dark:bg-neutral-700" />

            <button
              onClick={(e) => {
                e.stopPropagation();
                onSettingsClick?.(element);
              }}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors text-gray-700 dark:text-neutral-300"
              title="Settings"
            >
              <Settings size={14} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-md transition-colors text-red-600 dark:text-red-400"
              title="Delete"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Description Input/Display */}
        <div
          onDoubleClick={handleDoubleClick}
          className={`
            min-w-[500px] max-w-[700px] rounded-lg border-2 border-t-4 border-t-gray-500 dark:border-t-[#B8B8B8]
            ${isEditing
              ? 'border-blue-500 dark:border-blue-400 bg-white dark:bg-neutral-900'
              : 'bg-white dark:bg-black'
            }
            transition-all duration-200
          `}
          style={{
            borderTopColor: isDarkMode ? 'rgba(184, 184, 184, 0.12)' : 'rgba(107, 114, 128, 0.12)',
            borderLeftColor: isEditing ? undefined : isDarkMode ? 'rgba(209, 213, 219, 0.08)' : 'rgba(209, 213, 219, 0.08)',
            borderRightColor: isEditing ? undefined : isDarkMode ? 'rgba(209, 213, 219, 0.08)' : 'rgba(209, 213, 219, 0.08)',
            borderBottomColor: isEditing ? undefined : isDarkMode ? 'rgba(209, 213, 219, 0.08)' : 'rgba(209, 213, 219, 0.08)',
            borderWidth: `${element?.style?.borderWidth || 2}px`,
            borderTopWidth: '4px',
            borderRadius: `${element?.style?.borderRadius || 8}px`,
            backgroundColor: element?.style?.backgroundColor === 'transparent' ? 'transparent' : getAdaptiveBackgroundColor(element?.style?.backgroundColor || 'white', isDarkMode),
            padding: `${element?.style?.padding || 12}px`,
            opacity: element?.style?.opacity || 1,
            boxShadow: element?.style?.shadowBlur > 0
              ? `${element.style.shadowOffsetX}px ${element.style.shadowOffsetY}px ${element.style.shadowBlur}px ${element.style.shadowColor}`
              : 'none',
            userSelect: isEditing ? 'text' : 'none',
            WebkitUserSelect: isEditing ? 'text' : 'none',
          }}
        >
          {isEditing ? (
            <RichTextEditor
              value={value}
              onChange={setValue}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="Enter description..."
              className="w-full text-gray-900 dark:text-neutral-100"
              multiline={true}
              autoFocus={true}
              style={{
                fontSize: `${element?.style?.fontSize || 16}px`,
                fontWeight: element?.style?.fontWeight || 'normal',
                fontFamily: element?.style?.fontFamily || 'system-ui',
                color: getAdaptiveColor(element?.style?.textColor || '#000000', isDarkMode),
                textAlign: element?.style?.textAlign || 'left',
                lineHeight: element?.style?.lineHeight || 1.5,
                letterSpacing: `${element?.style?.letterSpacing || 0}px`,
              }}
            />
          ) : (
            <div
              className="text-gray-900 dark:text-neutral-100 whitespace-pre-wrap min-h-[80px]"
              style={{
                fontSize: `${element?.style?.fontSize || 16}px`,
                fontWeight: element?.style?.fontWeight || 'normal',
                fontFamily: element?.style?.fontFamily || 'system-ui',
                color: getAdaptiveColor(element?.style?.textColor || '#000000', isDarkMode),
                textAlign: element?.style?.textAlign || 'left',
                lineHeight: element?.style?.lineHeight || 1.5,
                letterSpacing: `${element?.style?.letterSpacing || 0}px`,
              }}
              dangerouslySetInnerHTML={{ __html: value || 'Double-click to edit' }}
              onClick={(e) => {
                // Handle link clicks - only open with Ctrl/Cmd
                if (e.target.tagName === 'A') {
                  e.preventDefault();
                  if (e.ctrlKey || e.metaKey) {
                    window.open(e.target.href, '_blank', 'noopener,noreferrer');
                  }
                }
              }}
            />
          )}
        </div>
      </div>
      </div>

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        elementType={element.type}
      />
    </>
  );
};

export default DescriptionElement;
