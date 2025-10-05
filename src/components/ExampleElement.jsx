import React, { useState, useRef, useEffect } from 'react';
import { Undo, Redo, Settings, X, ChevronDown, ChevronUp, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import RichTextEditor from './RichTextEditor';
import { useTheme } from '../context/ThemeContext';
import { getAdaptiveColor, getAdaptiveBackgroundColor } from '../utils/colorUtils';

const ExampleElement = ({ element, canEdit, onUpdate, onDelete, onSettingsClick }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  // Initialize examples with at least one example
  const initialExamples = element?.content?.examples?.length > 0
    ? element.content.examples
    : [{
        title: 'Example Conversation',
        messages: [
          {
            type: 'user',
            text: 'Hello, I need help with...',
            timestamp: new Date()
          }
        ],
        titleHistory: []
      }];

  const [isExpanded, setIsExpanded] = useState(element?.content?.isExpanded || false);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(element?.content?.currentExampleIndex || 0);
  const [examples, setExamples] = useState(initialExamples);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [titleHistory, setTitleHistory] = useState(examples[currentExampleIndex]?.titleHistory || []);
  const [currentTitleHistoryIndex, setCurrentTitleHistoryIndex] = useState(-1);
  const [currentTitleValue, setCurrentTitleValue] = useState(examples[currentExampleIndex]?.title || '');
  const [editingMessageIndex, setEditingMessageIndex] = useState(null);

  const currentExample = examples[currentExampleIndex] || examples[0];
  const [title, setTitle] = useState(currentExample?.title || '');

  const isEditing = isEditingTitle || editingMessageIndex !== null;

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

  // Update title when switching examples
  useEffect(() => {
    const newExample = examples[currentExampleIndex];
    if (newExample) {
      setTitle(newExample.title || '');
      setTitleHistory(newExample.titleHistory || []);
      setCurrentTitleHistoryIndex(-1);
      setCurrentTitleValue(newExample.title || '');
    }
  }, [currentExampleIndex, examples]);


  const handleCardDoubleClick = (e) => {
    if (isEditingTitle || editingMessageIndex !== null) {
      e.stopPropagation();
      return;
    }

    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);

    onUpdate?.({
      ...element,
      content: {
        ...element.content,
        isExpanded: newExpandedState,
        examples,
        currentExampleIndex
      }
    });
  };

  const handleTitleDoubleClick = (e) => {
    e.stopPropagation();
    if (canEdit) {
      setIsEditingTitle(true);
    }
  };

  const confirmTitleEdit = () => {
    setIsEditingTitle(false);

    if (title !== currentExample.title) {
      const newTitleHistory = [
        {
          value: currentExample.title,
          timestamp: new Date()
        },
        ...titleHistory
      ].slice(0, 3);

      const updatedExamples = [...examples];
      updatedExamples[currentExampleIndex] = {
        ...currentExample,
        title,
        titleHistory: newTitleHistory
      };

      setExamples(updatedExamples);
      setTitleHistory(newTitleHistory);
      setCurrentTitleHistoryIndex(-1);

      onUpdate?.({
        ...element,
        content: {
          ...element.content,
          examples: updatedExamples,
          currentExampleIndex
        }
      });
    }
  };

  const handleTitleBlur = () => {
    if (isEditingTitle) {
      confirmTitleEdit();
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setTitle(currentExample.title || '');
    }
  };

  const handleTitleUndo = () => {
    if (titleHistory.length > 0) {
      const newIndex = currentTitleHistoryIndex + 1;
      if (newIndex < titleHistory.length) {
        if (currentTitleHistoryIndex === -1) {
          setCurrentTitleValue(title);
        }

        const previousValue = titleHistory[newIndex].value;
        setTitle(previousValue);
        setCurrentTitleHistoryIndex(newIndex);

        const updatedExamples = [...examples];
        updatedExamples[currentExampleIndex] = {
          ...currentExample,
          title: previousValue
        };
        setExamples(updatedExamples);

        onUpdate?.({
          ...element,
          content: {
            ...element.content,
            examples: updatedExamples
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

      const updatedExamples = [...examples];
      updatedExamples[currentExampleIndex] = {
        ...currentExample,
        title: nextValue
      };
      setExamples(updatedExamples);

      onUpdate?.({
        ...element,
        content: {
          ...element.content,
          examples: updatedExamples
        }
      });
    } else if (currentTitleHistoryIndex === 0) {
      setTitle(currentTitleValue);
      setCurrentTitleHistoryIndex(-1);

      const updatedExamples = [...examples];
      updatedExamples[currentExampleIndex] = {
        ...currentExample,
        title: currentTitleValue
      };
      setExamples(updatedExamples);

      onUpdate?.({
        ...element,
        content: {
          ...element.content,
          examples: updatedExamples
        }
      });
    }
  };

  const addMessage = (type) => {
    const newMessage = {
      type,
      text: type === 'user' ? 'New user message' : 'New agent message',
      timestamp: new Date()
    };

    const updatedExamples = [...examples];
    updatedExamples[currentExampleIndex] = {
      ...currentExample,
      messages: [...(currentExample.messages || []), newMessage]
    };

    setExamples(updatedExamples);

    onUpdate?.({
      ...element,
      content: {
        ...element.content,
        examples: updatedExamples
      }
    });
  };

  const handleMessageDoubleClick = (index, e) => {
    e.stopPropagation();
    if (canEdit && isExpanded) {
      setEditingMessageIndex(index);
    }
  };

  const handleMessageChange = (index, newText) => {
    const updatedExamples = [...examples];
    const updatedMessages = [...currentExample.messages];
    updatedMessages[index] = {
      ...updatedMessages[index],
      text: newText
    };
    updatedExamples[currentExampleIndex] = {
      ...currentExample,
      messages: updatedMessages
    };

    setExamples(updatedExamples);
  };

  const confirmMessageEdit = (index) => {
    setEditingMessageIndex(null);

    onUpdate?.({
      ...element,
      content: {
        ...element.content,
        examples
      }
    });
  };

  const handleMessageBlur = (index) => {
    confirmMessageEdit(index);
  };

  const handleMessageKeyDown = (e, index) => {
    if (e.key === 'Escape') {
      setEditingMessageIndex(null);
    }
  };

  const deleteMessage = (index) => {
    const updatedExamples = [...examples];
    const updatedMessages = currentExample.messages.filter((_, i) => i !== index);
    updatedExamples[currentExampleIndex] = {
      ...currentExample,
      messages: updatedMessages
    };

    setExamples(updatedExamples);

    onUpdate?.({
      ...element,
      content: {
        ...element.content,
        examples: updatedExamples
      }
    });
  };

  const navigateExample = (direction) => {
    const newIndex = direction === 'prev'
      ? Math.max(0, currentExampleIndex - 1)
      : Math.min(examples.length - 1, currentExampleIndex + 1);

    setCurrentExampleIndex(newIndex);

    onUpdate?.({
      ...element,
      content: {
        ...element.content,
        currentExampleIndex: newIndex,
        examples
      }
    });
  };

  const addNewExample = () => {
    const newExample = {
      title: 'New Example',
      titleFormatting: {
        bold: false,
        italic: false,
        underline: false,
        hyperlink: ''
      },
      messages: [
        {
          type: 'user',
          text: 'New conversation',
          timestamp: new Date(),
          formatting: {
            bold: false,
            italic: false,
            underline: false,
            hyperlink: ''
          }
        }
      ],
      titleHistory: []
    };

    const updatedExamples = [...examples, newExample];
    setExamples(updatedExamples);
    setCurrentExampleIndex(updatedExamples.length - 1);

    onUpdate?.({
      ...element,
      content: {
        ...element.content,
        examples: updatedExamples,
        currentExampleIndex: updatedExamples.length - 1
      }
    });
  };

  const deleteCurrentExample = () => {
    if (examples.length <= 1) {
      // Don't delete the last example
      return;
    }

    const updatedExamples = examples.filter((_, i) => i !== currentExampleIndex);
    const newIndex = Math.max(0, currentExampleIndex - 1);

    setExamples(updatedExamples);
    setCurrentExampleIndex(newIndex);

    onUpdate?.({
      ...element,
      content: {
        ...element.content,
        examples: updatedExamples,
        currentExampleIndex: newIndex
      }
    });
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    onDelete?.(element._id);
  };

  const canTitleUndo = titleHistory.length > 0 && currentTitleHistoryIndex < titleHistory.length - 1;
  const canTitleRedo = currentTitleHistoryIndex >= 0;

  // Get text style for title based on formatting

  const getFirstUserMessage = () => {
    const firstUserMsg = currentExample?.messages?.find(m => m.type === 'user');
    if (!firstUserMsg) return 'No messages yet...';
    const words = firstUserMsg.text.split(' ');
    const preview = words.slice(0, 8).join(' ');
    return words.length > 8 ? `${preview}...` : preview;
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="group"
      >
        <div className="relative">
          {/* Action Buttons - Top Right */}
          {canEdit && (
            <div className="absolute -top-10 right-0 flex gap-1 bg-white dark:bg-black rounded-lg shadow-lg border border-gray-200 dark:border-neutral-800 p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
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
            </div>
          )}

          {/* Example Card */}
          <div
            onDoubleClick={handleCardDoubleClick}
            className={`
              w-[500px] rounded-lg border-2 border-t-4 border-t-purple-600 dark:border-t-purple-400
              ${isExpanded ? 'min-h-[400px]' : 'h-[120px]'}
              ${isEditingTitle || editingMessageIndex !== null
                ? 'border-blue-500 dark:border-blue-400 bg-white dark:bg-neutral-900'
                : 'bg-white dark:bg-black'
              }
              transition-all duration-200
              flex flex-col
            `}
            style={{
              borderTopColor: isDarkMode ? 'rgba(192, 132, 252, 0.6)' : 'rgba(147, 51, 234, 0.6)',
              borderLeftColor: (isEditingTitle || editingMessageIndex !== null) ? undefined : isDarkMode ? 'rgba(209, 213, 219, 0.6)' : 'rgba(209, 213, 219, 0.6)',
              borderRightColor: (isEditingTitle || editingMessageIndex !== null) ? undefined : isDarkMode ? 'rgba(209, 213, 219, 0.6)' : 'rgba(209, 213, 219, 0.6)',
              borderBottomColor: (isEditingTitle || editingMessageIndex !== null) ? undefined : isDarkMode ? 'rgba(209, 213, 219, 0.6)' : 'rgba(209, 213, 219, 0.6)',
              borderWidth: `${element?.style?.borderWidth || 2}px`,
              borderTopWidth: '4px',
              borderRadius: `${element?.style?.borderRadius || 8}px`,
              backgroundColor: element?.style?.backgroundColor === 'transparent' ? 'transparent' : getAdaptiveBackgroundColor(element?.style?.backgroundColor || 'white', isDarkMode),
              opacity: element?.style?.opacity || 1,
              boxShadow: element?.style?.shadowBlur > 0
                ? `${element.style.shadowOffsetX}px ${element.style.shadowOffsetY}px ${element.style.shadowBlur}px ${element.style.shadowColor}`
                : 'none',
              userSelect: isEditing ? 'text' : 'none',
              WebkitUserSelect: isEditing ? 'text' : 'none',
            }}
          >
            {/* Header with Title and Expand Icon */}
            <div className="flex items-start justify-between p-4 border-b border-gray-200 dark:border-neutral-800">
              <div
                className="flex-1"
                onDoubleClick={handleTitleDoubleClick}
              >
                {isEditingTitle ? (
                  <RichTextEditor
                    value={title}
                    onChange={setTitle}
                    onBlur={handleTitleBlur}
                    onKeyDown={handleTitleKeyDown}
                    placeholder="Enter example title..."
                    className="w-full text-gray-900 dark:text-neutral-100"
                    autoFocus={true}
                    style={{
                      fontSize: `${element?.style?.titleFontSize || 18}px`,
                      fontWeight: element?.style?.titleFontWeight || 'semibold',
                      color: getAdaptiveColor(element?.style?.titleColor || '#000000', isDarkMode),
                    }}
                  />
                ) : (
                  <h3
                    className="text-gray-900 dark:text-neutral-100"
                    style={{
                      fontSize: `${element?.style?.titleFontSize || 18}px`,
                      fontWeight: element?.style?.titleFontWeight || 'semibold',
                      color: getAdaptiveColor(element?.style?.titleColor || '#000000', isDarkMode),
                    }}
                    dangerouslySetInnerHTML={{ __html: title || 'Double-click to add title' }}
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

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardDoubleClick(e);
                }}
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
            <div className="flex-1 p-4 overflow-auto">
              {isExpanded ? (
                <div className="space-y-3">
                  {/* Add Message Buttons */}
                  {canEdit && (
                    <div className="flex justify-between gap-2 pb-3 border-b border-gray-200 dark:border-neutral-800">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addMessage('user');
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-md transition-colors"
                        title="Add User Message"
                      >
                        <Plus size={12} />
                        User
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addMessage('agent');
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-md transition-colors"
                        title="Add Agent Message"
                      >
                        <Plus size={12} />
                        Agent
                      </button>
                    </div>
                  )}

                  {/* Messages */}
                  <div className="space-y-3 min-h-[200px]">
                    {currentExample?.messages?.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.type === 'user' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`group/message max-w-[70%] relative text-white rounded-lg px-3 py-2`}
                          style={{
                            backgroundColor: message.type === 'user'
                              ? getAdaptiveBackgroundColor(element?.style?.userMessageColor || '#6b7280', isDarkMode)
                              : getAdaptiveBackgroundColor(element?.style?.agentMessageColor || '#3b82f6', isDarkMode)
                          }}
                        >
                          {editingMessageIndex === index ? (
                            <RichTextEditor
                              value={message.text}
                              onChange={(value) => handleMessageChange(index, value)}
                              onBlur={() => handleMessageBlur(index)}
                              onKeyDown={(e) => handleMessageKeyDown(e, index)}
                              placeholder="Enter message..."
                              className="w-full text-white"
                              multiline={true}
                              autoFocus={true}
                              style={{
                                fontSize: `${element?.style?.messageFontSize || 14}px`,
                                fontWeight: 'normal',
                              }}
                            />
                          ) : (
                            <div
                              className="whitespace-pre-wrap cursor-pointer"
                              style={{
                                fontSize: `${element?.style?.messageFontSize || 14}px`,
                                fontWeight: 'normal',
                              }}
                              onDoubleClick={(e) => handleMessageDoubleClick(index, e)}
                              dangerouslySetInnerHTML={{ __html: message.text || 'Double-click to edit' }}
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

                          {/* Delete Message Button */}
                          {canEdit && !editingMessageIndex && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMessage(index);
                              }}
                              className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full opacity-0 group-hover/message:opacity-100 transition-opacity"
                              title="Delete Message"
                            >
                              <X size={10} className="text-white" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  className="text-gray-600 dark:text-neutral-400"
                  style={{
                    fontSize: `${element?.style?.descriptionFontSize || 14}px`,
                    color: getAdaptiveColor(element?.style?.descriptionColor || '#6b7280', isDarkMode),
                  }}
                >
                  {getFirstUserMessage()}
                </div>
              )}
            </div>

            {/* Navigation Bar */}
            {isExpanded && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-neutral-800">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateExample('prev');
                  }}
                  disabled={currentExampleIndex === 0}
                  className={`p-1.5 rounded-md transition-colors ${
                    currentExampleIndex === 0
                      ? 'text-gray-300 dark:text-neutral-600 cursor-not-allowed'
                      : 'hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300'
                  }`}
                  title="Previous Example"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="flex items-center gap-2">
                  {canEdit && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCurrentExample();
                        }}
                        disabled={examples.length <= 1}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs transition-colors ${
                          examples.length <= 1
                            ? 'bg-gray-200 dark:bg-neutral-800 text-gray-400 dark:text-neutral-600 cursor-not-allowed'
                            : 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white'
                        }`}
                        title="Delete Current Example"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addNewExample();
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-md text-xs transition-colors"
                        title="Add New Example"
                      >
                        <Plus size={12} />
                        New
                      </button>
                    </>
                  )}

                  <span className="text-xs text-gray-600 dark:text-neutral-400">
                    {currentExampleIndex + 1} / {examples.length}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateExample('next');
                  }}
                  disabled={currentExampleIndex === examples.length - 1}
                  className={`p-1.5 rounded-md transition-colors ${
                    currentExampleIndex === examples.length - 1
                      ? 'text-gray-300 dark:text-neutral-600 cursor-not-allowed'
                      : 'hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300'
                  }`}
                  title="Next Example"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Helper text when editing */}
            {editingMessageIndex !== null && (
              <div className="px-4 pb-2 text-xs text-gray-500 dark:text-neutral-500">
                Ctrl+Enter to save, Esc to cancel
              </div>
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

export default ExampleElement;
