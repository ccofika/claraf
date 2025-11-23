import React, { useState } from 'react';
import { Undo, Redo, Settings, X, Copy, Share2, Bookmark, Pencil, Send } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import RichTextEditor from './RichTextEditor';
import { useTheme } from '../context/ThemeContext';
import { getAdaptiveColor, getAdaptiveBackgroundColor } from '../utils/colorUtils';
import { copyElementContent, shareElement } from '../utils/clipboard';
import { useDebouncedUpdate } from '../hooks/useDebouncedUpdate';
import ShareButton from './Chat/ShareButton';

const TitleElement = ({ element, canEdit, workspaceId, workspaceName, onUpdate, onDelete, onSettingsClick, isHighlighted = false, onBookmarkCreated, onMouseEnter, onMouseLeave }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(element?.content?.value || '');
  const [history, setHistory] = useState(element?.content?.history || []);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const [currentValue, setCurrentValue] = useState(element?.content?.value || '');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Enable real-time collaboration - debounced updates while editing
  useDebouncedUpdate(value, isEditing ? onUpdate : null, element, 800);

  // Sync external updates when not editing
  React.useEffect(() => {
    if (!isEditing && element?.content?.value !== value) {
      setValue(element?.content?.value || '');
      setHistory(element?.content?.history || []);
    }
  }, [element?.content?.value, element?.content?.history, isEditing]);

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
    userSelect: isEditing || !canEdit ? 'text' : 'none',
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

  const handleCopy = async (e) => {
    e.stopPropagation();
    await copyElementContent(element);
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    await shareElement(workspaceId, element._id);
  };

  const handleBookmark = async (e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/bookmarks`,
        {
          elementId: element._id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Bookmark saved!');

      // Call the callback to update bookmarks list
      if (onBookmarkCreated) {
        onBookmarkCreated(response.data);
      }
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error('Bookmark already exists');
      } else {
        toast.error('Failed to save bookmark');
      }
    }
  };

  const handleElementLinkClick = (linkData) => {

    if (linkData.workspaceId === workspaceId) {
      // Same workspace - zoom to element
      const eventDetail = { _id: linkData.elementId };

      const event = new CustomEvent('zoomToElement', {
        detail: eventDetail
      });

      window.dispatchEvent(event);
    } else {
      // Different workspace - navigate
      const path = `/workspace/${linkData.workspaceId}?element=${linkData.elementId}`;
      navigate(path);
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...(canEdit ? attributes : {})}
        {...(canEdit ? listeners : {})}
        className="group canvas-draggable-element"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="relative">
        {/* Action Buttons - Top Right */}
        <div className="absolute -top-10 right-0 flex gap-1 bg-white dark:bg-black rounded-lg shadow-lg border border-gray-200 dark:border-neutral-800 p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {canEdit ? (
            <>
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
            </>
          ) : (
            <>
              <button
                onClick={handleCopy}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors text-gray-700 dark:text-neutral-300"
                title="Copy"
              >
                <Copy size={14} />
              </button>

              <button
                onClick={handleShare}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors text-gray-700 dark:text-neutral-300"
                title="Share"
              >
                <Share2 size={14} />
              </button>

              <button
                onClick={handleBookmark}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors text-gray-700 dark:text-neutral-300"
                title="Bookmark"
              >
                <Bookmark size={14} />
              </button>

              <div className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors text-gray-700 dark:text-neutral-300">
                <ShareButton
                  item={{
                    _id: element._id,
                    workspaceId: workspaceId,
                    workspaceName: workspaceName || 'Workspace',
                    type: element.type,
                    title: element.content?.value || 'Untitled',
                    content: element.content?.value
                  }}
                  type="element"
                  variant="icon"
                />
              </div>
            </>
          )}
        </div>

        {/* Title Input/Display */}
        <div
          className={`
            group/content min-w-[400px] rounded-lg border-2 border-t-4 border-t-blue-800 dark:border-t-[#6B9BD1] relative
            ${isEditing
              ? 'border-blue-500 dark:border-blue-400 bg-white dark:bg-neutral-900'
              : 'bg-white dark:bg-black'
            }
            ${isHighlighted ? 'animate-pulse ring-4 ring-blue-500 ring-opacity-75' : ''}
            transition-all duration-200
          `}
          style={{
            borderTopColor: isDarkMode ? 'rgba(107, 155, 209, 0.2)' : 'rgba(30, 64, 175, 0.2)',
            borderLeftColor: isEditing ? undefined : isDarkMode ? 'rgba(209, 213, 219, 0.15)' : 'rgba(209, 213, 219, 0.15)',
            borderRightColor: isEditing ? undefined : isDarkMode ? 'rgba(209, 213, 219, 0.15)' : 'rgba(209, 213, 219, 0.15)',
            borderBottomColor: isEditing ? undefined : isDarkMode ? 'rgba(209, 213, 219, 0.15)' : 'rgba(209, 213, 219, 0.15)',
            borderWidth: `${element?.style?.borderWidth || 2}px`,
            borderTopWidth: '4px',
            borderRadius: `${element?.style?.borderRadius || 8}px`,
            backgroundColor: element?.style?.backgroundColor === 'transparent' ? 'transparent' : getAdaptiveBackgroundColor(element?.style?.backgroundColor || 'white', isDarkMode),
            padding: `${element?.style?.padding || 12}px`,
            paddingRight: canEdit && !isEditing ? `${(element?.style?.padding || 12) + 32}px` : `${element?.style?.padding || 12}px`,
            opacity: element?.style?.opacity || 1,
            boxShadow: isHighlighted
              ? '0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)'
              : element?.style?.shadowBlur > 0
              ? `${element.style.shadowOffsetX}px ${element.style.shadowOffsetY}px ${element.style.shadowBlur}px ${element.style.shadowColor}`
              : 'none',
            userSelect: isEditing || !canEdit ? 'text' : 'none',
            WebkitUserSelect: isEditing || !canEdit ? 'text' : 'none',
            MozUserSelect: isEditing || !canEdit ? 'text' : 'none',
            cursor: !canEdit ? 'text' : 'default',
          }}
        >
          {isEditing ? (
            <RichTextEditor
              value={value}
              onChange={setValue}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="Enter title..."
              className="w-full text-gray-900 dark:text-neutral-100"
              autoFocus={true}
              workspaceId={workspaceId}
              onElementLinkClick={handleElementLinkClick}
              style={{
                fontSize: `${element?.style?.fontSize || 18}px`,
                fontWeight: element?.style?.fontWeight || 'medium',
                fontFamily: element?.style?.fontFamily || 'system-ui',
                color: getAdaptiveColor(element?.style?.textColor || '#000000', isDarkMode),
                textAlign: element?.style?.textAlign || 'left',
                lineHeight: element?.style?.lineHeight || 1.5,
                letterSpacing: `${element?.style?.letterSpacing || 0}px`,
              }}
            />
          ) : (
            <>
              <div
                className="text-gray-900 dark:text-neutral-100"
                style={{
                  fontSize: `${element?.style?.fontSize || 18}px`,
                  fontWeight: element?.style?.fontWeight || 'medium',
                  fontFamily: element?.style?.fontFamily || 'system-ui',
                  color: getAdaptiveColor(element?.style?.textColor || '#000000', isDarkMode),
                  textAlign: element?.style?.textAlign || 'left',
                  lineHeight: element?.style?.lineHeight || 1.5,
                  letterSpacing: `${element?.style?.letterSpacing || 0}px`,
                  cursor: canEdit ? 'text' : 'text',
                  pointerEvents: 'auto',
                }}
                dangerouslySetInnerHTML={{ __html: value || 'Click edit to start' }}
                onMouseDown={(e) => {
                  if (!canEdit) {
                    e.stopPropagation();
                  }
                }}
                onClick={(e) => {

                  if (!canEdit) {
                    e.stopPropagation();
                  }

                  // Handle link clicks - walk up DOM tree to find anchor tag
                  let target = e.target;
                  let linkElement = null;

                  // Walk up the DOM to find an anchor tag
                  while (target && target !== e.currentTarget) {
                    if (target.tagName === 'A') {
                      linkElement = target;
                      break;
                    }
                    target = target.parentElement;
                  }

                  if (linkElement) {
                    e.preventDefault();
                    e.stopPropagation();

                    // Check if it's an element link
                    const elementId = linkElement.getAttribute('data-element-id');
                    const elementWorkspaceId = linkElement.getAttribute('data-workspace-id');


                    if (elementId && elementWorkspaceId) {
                      // Element link - navigate only with Ctrl/Cmd + click
                      if (e.ctrlKey || e.metaKey) {
                        handleElementLinkClick({
                          elementId,
                          workspaceId: elementWorkspaceId,
                          elementType: linkElement.getAttribute('data-element-type'),
                          elementTitle: linkElement.getAttribute('data-element-title')
                        });
                      } else {
                      }
                    } else {
                      // Regular hyperlink - only open with Ctrl/Cmd
                      if (e.ctrlKey || e.metaKey) {
                        window.open(linkElement.href, '_blank', 'noopener,noreferrer');
                      } else {
                      }
                    }
                  }
                }}
              />
              {canEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-600 dark:text-neutral-400 opacity-0 group-hover/content:opacity-100 transition-opacity"
                  title="Edit"
                >
                  <Pencil size={14} />
                </button>
              )}
            </>
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

export default TitleElement;
