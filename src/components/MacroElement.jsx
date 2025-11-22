import React, { useState, useEffect, useRef } from 'react';
import { Undo, Redo, Settings, X, ChevronDown, ChevronUp, Copy, Share2, Bookmark, Pencil } from 'lucide-react';
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
import ImageLightbox from './ImageLightbox';
import { extractImageMetadata } from '../utils/imageUpload';

const MacroElement = ({ element, canEdit, workspaceId, onUpdate, onDelete, onSettingsClick, isHighlighted = false, onBookmarkCreated, onMouseEnter, onMouseLeave }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const navigate = useNavigate();

  const [isExpanded, setIsExpanded] = useState(element?.content?.isExpanded || false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [title, setTitle] = useState(element?.content?.title || '');
  const [description, setDescription] = useState(element?.content?.description || '');
  const [titleHistory, setTitleHistory] = useState(element?.content?.titleHistory || []);
  const [descriptionHistory, setDescriptionHistory] = useState(element?.content?.descriptionHistory || []);
  const [currentTitleHistoryIndex, setCurrentTitleHistoryIndex] = useState(-1);
  const [currentDescriptionHistoryIndex, setCurrentDescriptionHistoryIndex] = useState(-1);
  const [currentTitleValue, setCurrentTitleValue] = useState(element?.content?.title || '');
  const [currentDescriptionValue, setCurrentDescriptionValue] = useState(element?.content?.description || '');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Sync external updates when not editing
  useEffect(() => {
    if (!isEditingTitle && element?.content?.title !== title) {
      setTitle(element?.content?.title || '');
      setTitleHistory(element?.content?.titleHistory || []);
    }
    if (!isEditingDescription && element?.content?.description !== description) {
      setDescription(element?.content?.description || '');
      setDescriptionHistory(element?.content?.descriptionHistory || []);
    }
    if (element?.content?.isExpanded !== undefined && element?.content?.isExpanded !== isExpanded) {
      setIsExpanded(element?.content?.isExpanded);
    }
  }, [element?.content?.title, element?.content?.description, element?.content?.titleHistory, element?.content?.descriptionHistory, element?.content?.isExpanded, isEditingTitle, isEditingDescription]);

  // Real-time collaboration - debounced updates for title and description
  const updateTimeoutRef = useRef(null);
  useEffect(() => {
    // Clear existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Only update if editing
    if (!isEditingTitle && !isEditingDescription) {
      return;
    }

    // Don't update if values haven't changed
    if (title === element?.content?.title && description === element?.content?.description) {
      return;
    }

    // Set debounced update
    updateTimeoutRef.current = setTimeout(() => {
      if (onUpdate && element) {
        onUpdate({
          ...element,
          content: {
            ...element.content,
            title,
            description
          }
        });
      }
    }, 800);

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [title, description, isEditingTitle, isEditingDescription, onUpdate, element]);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: element._id,
    disabled: !canEdit || isEditingTitle || isEditingDescription,
  });

  const isEditing = isEditingTitle || isEditingDescription;

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


  const toggleExpand = (e) => {
    e.stopPropagation();

    // Toggle expansion
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);

    // Save expansion state
    onUpdate?.({
      ...element,
      content: {
        ...element.content,
        isExpanded: newExpandedState
      }
    });
  };

  const handleTitleBlur = () => {
    if (isEditingTitle) {
      confirmTitleEdit();
    }
  };

  const handleDescriptionBlur = () => {
    if (isEditingDescription) {
      confirmDescriptionEdit();
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setTitle(element?.content?.title || '');
    }
  };

  const handleDescriptionKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsEditingDescription(false);
      setDescription(element?.content?.description || '');
    }
  };

  const confirmTitleEdit = () => {
    setIsEditingTitle(false);

    if (title !== element?.content?.title) {
      const newTitleHistory = [
        {
          value: element?.content?.title,
          timestamp: new Date()
        },
        ...titleHistory
      ].slice(0, 3);

      setTitleHistory(newTitleHistory);
      setCurrentTitleHistoryIndex(-1);

      onUpdate?.({
        ...element,
        content: {
          ...element.content,
          title,
          titleHistory: newTitleHistory
        }
      });
    }
  };

  const confirmDescriptionEdit = () => {
    setIsEditingDescription(false);

    if (description !== element?.content?.description) {
      // Extract current images from HTML content
      const currentImages = extractImageMetadata(description);

      const newDescriptionHistory = [
        {
          value: element?.content?.description,
          timestamp: new Date()
        },
        ...descriptionHistory
      ].slice(0, 3);

      setDescriptionHistory(newDescriptionHistory);
      setCurrentDescriptionHistoryIndex(-1);

      onUpdate?.({
        ...element,
        content: {
          ...element.content,
          description,
          descriptionHistory: newDescriptionHistory,
          inlineImages: currentImages
        }
      });
    }
  };

  const handleImagePaste = () => {
    // Images are automatically extracted and stored in content when saving
  };

  const handleTitleUndo = () => {
    if (titleHistory.length > 0) {
      const newIndex = currentTitleHistoryIndex + 1;
      if (newIndex < titleHistory.length) {
        // Save current value if this is first undo
        if (currentTitleHistoryIndex === -1) {
          setCurrentTitleValue(title);
        }

        const previousValue = titleHistory[newIndex].value;
        setTitle(previousValue);
        setCurrentTitleHistoryIndex(newIndex);

        onUpdate?.({
          ...element,
          content: {
            ...element.content,
            title: previousValue
          }
        });
      }
    }
  };

  const handleTitleRedo = () => {
    if (currentTitleHistoryIndex > 0) {
      const newIndex = currentTitleHistoryIndex - 1;
      const nextValue = titleHistory[newIndex].value;
      setTitle(nextValue);
      setCurrentTitleHistoryIndex(newIndex);

      onUpdate?.({
        ...element,
        content: {
          ...element.content,
          title: nextValue
        }
      });
    } else if (currentTitleHistoryIndex === 0) {
      setTitle(currentTitleValue);
      setCurrentTitleHistoryIndex(-1);

      onUpdate?.({
        ...element,
        content: {
          ...element.content,
          title: currentTitleValue
        }
      });
    }
  };

  const handleDescriptionUndo = () => {
    if (descriptionHistory.length > 0) {
      const newIndex = currentDescriptionHistoryIndex + 1;
      if (newIndex < descriptionHistory.length) {
        // Save current value if this is first undo
        if (currentDescriptionHistoryIndex === -1) {
          setCurrentDescriptionValue(description);
        }

        const previousValue = descriptionHistory[newIndex].value;
        setDescription(previousValue);
        setCurrentDescriptionHistoryIndex(newIndex);

        onUpdate?.({
          ...element,
          content: {
            ...element.content,
            description: previousValue
          }
        });
      }
    }
  };

  const handleDescriptionRedo = () => {
    if (currentDescriptionHistoryIndex > 0) {
      const newIndex = currentDescriptionHistoryIndex - 1;
      const nextValue = descriptionHistory[newIndex].value;
      setDescription(nextValue);
      setCurrentDescriptionHistoryIndex(newIndex);

      onUpdate?.({
        ...element,
        content: {
          ...element.content,
          description: nextValue
        }
      });
    } else if (currentDescriptionHistoryIndex === 0) {
      setDescription(currentDescriptionValue);
      setCurrentDescriptionHistoryIndex(-1);

      onUpdate?.({
        ...element,
        content: {
          ...element.content,
          description: currentDescriptionValue
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

  const canTitleUndo = titleHistory.length > 0 && currentTitleHistoryIndex < titleHistory.length - 1;
  const canTitleRedo = currentTitleHistoryIndex >= 0;
  const canDescriptionUndo = descriptionHistory.length > 0 && currentDescriptionHistoryIndex < descriptionHistory.length - 1;
  const canDescriptionRedo = currentDescriptionHistoryIndex >= 0;

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
      const event = new CustomEvent('zoomToElement', {
        detail: { _id: linkData.elementId }
      });
      window.dispatchEvent(event);
    } else {
      // Different workspace - navigate
      navigate(`/workspace/${linkData.workspaceId}?element=${linkData.elementId}`);
    }
  };

  // Get preview text (first few words of description)
  const getPreviewText = () => {
    if (!description) return 'No description yet...';
    // Strip HTML tags for preview
    const textOnly = description.replace(/<[^>]*>/g, '');
    const words = textOnly.split(' ');
    const preview = words.slice(0, 5).join(' ');
    return words.length > 5 ? `${preview}...` : preview;
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
          <div className="absolute -top-10 right-0 flex gap-1 bg-white dark:bg-black rounded-lg shadow-lg border border-gray-200 dark:border-neutral-800 p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            {canEdit ? (
              <>
                {/* Title History Controls */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTitleUndo();
                  }}
                  disabled={!canTitleUndo}
                  className={`p-1.5 rounded-md transition-colors ${
                    canTitleUndo
                      ? 'hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300'
                      : 'text-gray-300 dark:text-neutral-600 cursor-not-allowed'
                  }`}
                  title="Undo Title"
                >
                  <Undo size={14} />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTitleRedo();
                  }}
                  disabled={!canTitleRedo}
                  className={`p-1.5 rounded-md transition-colors ${
                    canTitleRedo
                      ? 'hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300'
                      : 'text-gray-300 dark:text-neutral-600 cursor-not-allowed'
                  }`}
                  title="Redo Title"
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
              </>
            )}
          </div>

          {/* Macro Card */}
          <div
            className={`
              w-[450px] rounded-lg border-2 border-t-4 border-t-green-600 dark:border-t-[#5FD3A3]
              ${isExpanded ? 'min-h-[300px]' : 'h-[150px]'}
              ${isEditingTitle || isEditingDescription
                ? 'border-blue-500 dark:border-blue-400 bg-white dark:bg-neutral-900'
                : 'bg-white dark:bg-black'
              }
              ${isHighlighted ? 'animate-pulse ring-4 ring-blue-500 ring-opacity-75' : ''}
              transition-all duration-200
              flex flex-col
            `}
            style={{
              borderTopColor: isDarkMode ? 'rgba(95, 211, 163, 0.6)' : 'rgba(22, 163, 74, 0.6)',
              borderLeftColor: (isEditingTitle || isEditingDescription) ? undefined : isDarkMode ? 'rgba(209, 213, 219, 0.6)' : 'rgba(209, 213, 219, 0.6)',
              borderRightColor: (isEditingTitle || isEditingDescription) ? undefined : isDarkMode ? 'rgba(209, 213, 219, 0.6)' : 'rgba(209, 213, 219, 0.6)',
              borderBottomColor: (isEditingTitle || isEditingDescription) ? undefined : isDarkMode ? 'rgba(209, 213, 219, 0.6)' : 'rgba(209, 213, 219, 0.6)',
              borderWidth: `${element?.style?.borderWidth || 2}px`,
              borderTopWidth: '4px',
              borderRadius: `${element?.style?.borderRadius || 8}px`,
              backgroundColor: element?.style?.backgroundColor === 'transparent' ? 'transparent' : getAdaptiveBackgroundColor(element?.style?.backgroundColor || 'white', isDarkMode),
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
            {/* Header with Title and Expand Icon */}
            <div className="flex items-start justify-between p-4 border-b border-gray-200 dark:border-neutral-800">
              <div className="flex-1 group/title relative">
                {isEditingTitle ? (
                  <RichTextEditor
                    value={title}
                    onChange={setTitle}
                    onBlur={handleTitleBlur}
                    onKeyDown={handleTitleKeyDown}
                    placeholder="Enter macro title..."
                    className="w-full text-gray-900 dark:text-neutral-100"
                    autoFocus={true}
                    workspaceId={workspaceId}
                    onElementLinkClick={handleElementLinkClick}
                    style={{
                      fontSize: `${element?.style?.titleFontSize || 18}px`,
                      fontWeight: element?.style?.titleFontWeight || 'semibold',
                      color: getAdaptiveColor(element?.style?.titleColor || '#000000', isDarkMode),
                    }}
                  />
                ) : (
                  <>
                    <h3
                      className="text-gray-900 dark:text-neutral-100 pr-8"
                      style={{
                        fontSize: `${element?.style?.titleFontSize || 18}px`,
                        fontWeight: element?.style?.titleFontWeight || 'semibold',
                        color: getAdaptiveColor(element?.style?.titleColor || '#000000', isDarkMode),
                        cursor: canEdit ? 'text' : 'text',
                        pointerEvents: 'auto',
                      }}
                      dangerouslySetInnerHTML={{ __html: title || 'Macro title' }}
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
                            // Element link - navigate only with Ctrl/Cmd + click (like share function)
                            if (e.ctrlKey || e.metaKey) {
                              handleElementLinkClick({
                                elementId,
                                workspaceId: elementWorkspaceId,
                                elementType: linkElement.getAttribute('data-element-type'),
                                elementTitle: linkElement.getAttribute('data-element-title')
                              });
                            }
                          } else {
                            // Regular hyperlink - only open with Ctrl/Cmd
                            if (e.ctrlKey || e.metaKey) {
                              window.open(linkElement.href, '_blank', 'noopener,noreferrer');
                            }
                          }
                        }
                      }}
                    />
                    {canEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditingTitle(true);
                        }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-600 dark:text-neutral-400 opacity-0 group-hover/title:opacity-100 transition-opacity"
                        title="Edit title"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                  </>
                )}
              </div>

              <button
                onClick={toggleExpand}
                className="ml-2 p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp size={20} className="text-gray-600 dark:text-neutral-400" />
                ) : (
                  <ChevronDown size={20} className="text-gray-600 dark:text-neutral-400" />
                )}
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-4 overflow-y-auto overflow-x-hidden">
              {isExpanded ? (
                <div className="group/description relative">
                  {isEditingDescription ? (
                    <RichTextEditor
                      value={description}
                      onChange={setDescription}
                      onBlur={handleDescriptionBlur}
                      onKeyDown={handleDescriptionKeyDown}
                      placeholder="Enter macro description..."
                      className="w-full text-gray-900 dark:text-neutral-100"
                      multiline={true}
                      autoFocus={true}
                      workspaceId={workspaceId}
                      onElementLinkClick={handleElementLinkClick}
                      onImagePaste={handleImagePaste}
                      style={{
                        fontSize: `${element?.style?.descriptionFontSize || 14}px`,
                        fontWeight: 'normal',
                        color: getAdaptiveColor(element?.style?.descriptionColor || '#000000', isDarkMode),
                      }}
                    />
                  ) : (
                    <>
                      <div
                        className="text-gray-900 dark:text-neutral-100 whitespace-pre-wrap min-h-[200px] pr-8"
                        style={{
                          fontSize: `${element?.style?.descriptionFontSize || 14}px`,
                          fontWeight: 'normal',
                          color: getAdaptiveColor(element?.style?.descriptionColor || '#000000', isDarkMode),
                          cursor: canEdit ? 'text' : 'text',
                          pointerEvents: 'auto',
                          overflowWrap: 'break-word',
                          wordWrap: 'break-word',
                          maxWidth: '100%',
                        }}
                        dangerouslySetInnerHTML={{ __html: description || 'Macro description' }}
                        onMouseDown={(e) => {
                          if (!canEdit) {
                            // Don't stop propagation for images
                            if (e.target.tagName !== 'IMG') {
                              e.stopPropagation();
                            }
                          }
                        }}
                        onClick={(e) => {
                          // Handle image clicks FIRST - highest priority
                          if (e.target.tagName === 'IMG' && e.target.classList.contains('inline-image')) {
                            // Only open lightbox with Ctrl/Cmd+click
                            if (e.ctrlKey || e.metaKey) {
                              e.preventDefault();
                              e.stopPropagation();
                              setLightboxImage(e.target.src);
                              return; // Stop further processing
                            }
                          }

                          if (!canEdit) {
                            e.stopPropagation();
                          }

                          // Handle link clicks - walk up DOM tree to find anchor tag
                          let target = e.target;
                          let linkElement = null;

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
                              // Element link - navigate on click
                              handleElementLinkClick({
                                elementId,
                                workspaceId: elementWorkspaceId,
                                elementType: linkElement.getAttribute('data-element-type'),
                                elementTitle: linkElement.getAttribute('data-element-title')
                              });
                            } else {
                              // Regular hyperlink - only open with Ctrl/Cmd
                              if (e.ctrlKey || e.metaKey) {
                                window.open(linkElement.href, '_blank', 'noopener,noreferrer');
                              }
                            }
                          }
                        }}
                      />
                      {canEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsEditingDescription(true);
                          }}
                          className="absolute right-0 top-0 p-1.5 rounded-md bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-600 dark:text-neutral-400 opacity-0 group-hover/description:opacity-100 transition-opacity"
                          title="Edit description"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                    </>
                  )}

                  {/* Description History Controls - Bottom */}
                  {isExpanded && canEdit && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-neutral-800">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDescriptionUndo();
                        }}
                        disabled={!canDescriptionUndo}
                        className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                          canDescriptionUndo
                            ? 'hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300'
                            : 'text-gray-300 dark:text-neutral-600 cursor-not-allowed'
                        }`}
                        title="Undo Description"
                      >
                        <Undo size={14} className="inline mr-1" />
                        Undo
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDescriptionRedo();
                        }}
                        disabled={!canDescriptionRedo}
                        className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                          canDescriptionRedo
                            ? 'hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300'
                            : 'text-gray-300 dark:text-neutral-600 cursor-not-allowed'
                        }`}
                        title="Redo Description"
                      >
                        <Redo size={14} className="inline mr-1" />
                        Redo
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="text-gray-600 dark:text-neutral-400"
                  style={{
                    fontSize: `${element?.style?.descriptionFontSize || 14}px`,
                    color: getAdaptiveColor(element?.style?.descriptionColor || '#6b7280', isDarkMode),
                    cursor: 'default',
                  }}
                >
                  {getPreviewText()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        elementType={element.type}
      />

      {lightboxImage && (
        <ImageLightbox
          imageUrl={lightboxImage}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </>
  );
};

export default MacroElement;
