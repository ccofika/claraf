import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, List, FolderOpen, Tag } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import WrapperElementList from './WrapperElementList';
import CategoryPicker, { CategoryIcon } from './CategoryPicker';
import { getElementsInsideWrapper } from '../utils/wrapperUtils';

const API_URL = process.env.REACT_APP_API_URL;

const WrapperElement = ({
  element,
  canEdit,
  onUpdate,
  onDelete,
  onSettingsClick,
  isHighlighted = false,
  onMouseEnter,
  onMouseLeave,
  allElements = [],
  viewportScale = 1
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showElementList, setShowElementList] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dimensions, setDimensions] = useState({
    width: element.dimensions.width || 400,
    height: element.dimensions.height || 300
  });
  const [position, setPosition] = useState({
    x: element.position.x || 0,
    y: element.position.y || 0
  });
  const wrapperRef = useRef(null);
  const resizeStartRef = useRef(null);
  const viewportScaleRef = useRef(viewportScale);
  const positionRef = useRef(position);
  const dimensionsRef = useRef(dimensions);
  const BORDER_ZONE = 10; // 10px border zone for dragging

  // Update refs when they change
  useEffect(() => {
    viewportScaleRef.current = viewportScale;
  }, [viewportScale]);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    dimensionsRef.current = dimensions;
  }, [dimensions]);

  // Handle resize move - memoized to ensure stable event listener reference
  const handleResizeMove = useCallback((e) => {
    if (!resizeStartRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const { startX, startY, startWidth, startHeight, startPosX, startPosY, direction } = resizeStartRef.current;

    // Apply viewport scale to mouse delta to get canvas coordinates
    const currentScale = viewportScaleRef.current;
    const deltaX = (e.clientX - startX) / currentScale;
    const deltaY = (e.clientY - startY) / currentScale;

    let newWidth = startWidth;
    let newHeight = startHeight;
    let newPosX = startPosX;
    let newPosY = startPosY;

    // East: expand right
    if (direction.includes('e')) {
      newWidth = Math.max(200, startWidth + deltaX);
    }

    // West: expand left (move position and increase width)
    if (direction.includes('w')) {
      newWidth = Math.max(200, startWidth - deltaX);
      newPosX = startPosX + (startWidth - newWidth); // Move position to keep right edge fixed
    }

    // South: expand down
    if (direction.includes('s')) {
      newHeight = Math.max(150, startHeight + deltaY);
    }

    // North: expand up (move position and increase height)
    if (direction.includes('n')) {
      newHeight = Math.max(150, startHeight - deltaY);
      newPosY = startPosY + (startHeight - newHeight); // Move position to keep bottom edge fixed
    }

    setDimensions({ width: newWidth, height: newHeight });
    setPosition({ x: newPosX, y: newPosY });
  }, []); // Empty deps because we use refs for all dynamic values

  // Handle resize end - memoized to ensure stable event listener reference
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    resizeStartRef.current = null;

    // Re-enable canvas panning
    const event = new CustomEvent('disablePanning', { detail: false });
    window.dispatchEvent(event);

    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);

    // Use refs to get the latest values
    const currentPosition = positionRef.current;
    const currentDimensions = dimensionsRef.current;

    // Calculate which elements are now inside the wrapper
    const updatedWrapper = {
      ...element,
      position: { ...element.position, x: currentPosition.x, y: currentPosition.y },
      dimensions: currentDimensions
    };
    const childElementIds = getElementsInsideWrapper(updatedWrapper, allElements);

    // Save updated position, dimensions, and child elements
    if (onUpdate) {
      onUpdate({
        ...updatedWrapper,
        content: {
          ...element.content,
          childElements: childElementIds
        }
      });
    }
  }, [handleResizeMove, element, allElements, onUpdate]);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: element._id,
    disabled: true, // Dragging is now handled by border zone divs
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: `${dimensions.width}px`,
    height: `${dimensions.height}px`,
    zIndex: element.position.z || 1,
    pointerEvents: 'none', // Allow clicks to pass through to elements inside wrapper
    touchAction: isResizing ? 'none' : 'auto',
    userSelect: 'none',
  };

  // Handle resize start
  const handleResizeStart = (e, direction) => {
    if (!canEdit) return;
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);

    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: dimensions.width,
      startHeight: dimensions.height,
      startPosX: position.x,
      startPosY: position.y,
      direction
    };

    // Disable canvas panning during resize
    const event = new CustomEvent('disablePanning', { detail: true });
    window.dispatchEvent(event);

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  // Sync state with element props when they change externally (e.g., from drag)
  // BUT NOT during resize to avoid overwriting local state
  useEffect(() => {
    if (!isResizing) {
      setPosition({ x: element.position.x, y: element.position.y });
      setDimensions({ width: element.dimensions.width, height: element.dimensions.height });
    }
  }, [element.position.x, element.position.y, element.dimensions.width, element.dimensions.height, isResizing]);

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [handleResizeMove, handleResizeEnd]);

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    onDelete?.(element._id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`
          group
          ${isHighlighted ? 'ring-2 ring-blue-500' : ''}
        `}
      >
        <div
          ref={wrapperRef}
          className={`
            relative
            w-full h-full
            border-2 border-dashed
            rounded-lg
            transition-all duration-200
            ${isDarkMode
              ? 'border-blue-400/60'
              : 'border-blue-500/60'
            }
            ${isHighlighted || isDragging || isResizing ? 'border-blue-500 border-solid' : ''}
            ${isResizing ? 'bg-blue-500/10' : 'bg-transparent'}
          `}
          style={{
            opacity: isDragging ? 0.5 : 1,
            pointerEvents: 'none', // Allow clicks to pass through to elements inside
          }}
        >
          {/* Top label with category */}
          <div
            className={`
              absolute -top-6 left-0
              flex items-center gap-1.5
              px-2 py-0.5
              text-xs font-medium
              rounded-t
              group/label
              ${isDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-500/20 text-blue-700'}
            `}
            style={{ pointerEvents: 'auto' }}
          >
            {element.category ? (
              <>
                <span className="text-sm">
                  <CategoryIcon name={element.category.icon || 'folder'} size={12} />
                </span>
                <span className="truncate max-w-[120px]">
                  {element.category.name || 'Wrapper'}
                </span>
                {/* Remove category button - shows on hover */}
                {canEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Update local state immediately for instant feedback
                      if (onUpdate) {
                        onUpdate({
                          ...element,
                          category: null
                        });
                      }
                      // Then make API call to persist and update post counts
                      const token = localStorage.getItem('token');
                      axios.put(
                        `${API_URL}/api/categories/assign`,
                        { elementId: element._id, categoryId: null },
                        { headers: { Authorization: `Bearer ${token}` } }
                      ).catch(error => {
                        console.error('Error removing category:', error);
                      });
                    }}
                    className={`
                      ml-1 p-0.5 rounded opacity-0 group-hover/label:opacity-100
                      transition-opacity
                      ${isDarkMode ? 'hover:bg-red-500/30 text-red-400' : 'hover:bg-red-100 text-red-500'}
                    `}
                    title="Remove from category"
                  >
                    <X size={12} />
                  </button>
                )}
              </>
            ) : (
              'Wrapper'
            )}
          </div>

          {/* Action buttons - only show when hovering and can edit */}
          {canEdit && (
            <div className={`
              absolute -top-6 right-0
              flex gap-1
              opacity-0 group-hover:opacity-100
              transition-opacity duration-200
            `}
            style={{ pointerEvents: 'auto' }}
            onMouseEnter={() => onMouseEnter?.(element._id)}
            onMouseLeave={() => onMouseLeave?.()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCategoryPicker(true);
                }}
                className={`
                  p-1 rounded
                  ${isDarkMode
                    ? 'bg-purple-900/50 hover:bg-purple-900/70 text-purple-300'
                    : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                  }
                  transition-colors
                `}
                title="Set Category"
              >
                <Tag size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowElementList(true);
                }}
                className={`
                  p-1 rounded
                  ${isDarkMode
                    ? 'bg-blue-900/50 hover:bg-blue-900/70 text-blue-300'
                    : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                  }
                  transition-colors
                `}
                title="Manage Elements"
              >
                <List size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className={`
                  p-1 rounded
                  ${isDarkMode
                    ? 'bg-red-900/50 hover:bg-red-900/70 text-red-300'
                    : 'bg-red-100 hover:bg-red-200 text-red-700'
                  }
                  transition-colors
                `}
                title="Delete Wrapper"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Resize handles */}
          {canEdit && !isDragging && (
            <>
              {/* Corner handles - larger for easier grabbing */}
              <div
                className="absolute -bottom-2 -right-2 w-6 h-6 bg-blue-500 rounded-full cursor-se-resize hover:scale-125 transition-transform"
                style={{ pointerEvents: 'auto', zIndex: 10 }}
                onMouseDown={(e) => handleResizeStart(e, 'se')}
                onMouseEnter={() => onMouseEnter?.(element._id)}
                onMouseLeave={() => onMouseLeave?.()}
              />
              <div
                className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full cursor-ne-resize hover:scale-125 transition-transform"
                style={{ pointerEvents: 'auto', zIndex: 10 }}
                onMouseDown={(e) => handleResizeStart(e, 'ne')}
                onMouseEnter={() => onMouseEnter?.(element._id)}
                onMouseLeave={() => onMouseLeave?.()}
              />
              <div
                className="absolute -bottom-2 -left-2 w-6 h-6 bg-blue-500 rounded-full cursor-sw-resize hover:scale-125 transition-transform"
                style={{ pointerEvents: 'auto', zIndex: 10 }}
                onMouseDown={(e) => handleResizeStart(e, 'sw')}
                onMouseEnter={() => onMouseEnter?.(element._id)}
                onMouseLeave={() => onMouseLeave?.()}
              />
              <div
                className="absolute -top-2 -left-2 w-6 h-6 bg-blue-500 rounded-full cursor-nw-resize hover:scale-125 transition-transform"
                style={{ pointerEvents: 'auto', zIndex: 10 }}
                onMouseDown={(e) => handleResizeStart(e, 'nw')}
                onMouseEnter={() => onMouseEnter?.(element._id)}
                onMouseLeave={() => onMouseLeave?.()}
              />

              {/* Edge handles - wider for easier grabbing */}
              <div
                className="absolute top-0 right-0 w-3 h-full cursor-e-resize hover:bg-blue-500/20 transition-colors"
                style={{ pointerEvents: 'auto', zIndex: 9 }}
                onMouseDown={(e) => handleResizeStart(e, 'e')}
                onMouseEnter={() => onMouseEnter?.(element._id)}
                onMouseLeave={() => onMouseLeave?.()}
              />
              <div
                className="absolute top-0 left-0 w-3 h-full cursor-w-resize hover:bg-blue-500/20 transition-colors"
                style={{ pointerEvents: 'auto', zIndex: 9 }}
                onMouseDown={(e) => handleResizeStart(e, 'w')}
                onMouseEnter={() => onMouseEnter?.(element._id)}
                onMouseLeave={() => onMouseLeave?.()}
              />
              <div
                className="absolute bottom-0 left-0 w-full h-3 cursor-s-resize hover:bg-blue-500/20 transition-colors"
                style={{ pointerEvents: 'auto', zIndex: 9 }}
                onMouseDown={(e) => handleResizeStart(e, 's')}
                onMouseEnter={() => onMouseEnter?.(element._id)}
                onMouseLeave={() => onMouseLeave?.()}
              />
              <div
                className="absolute top-0 left-0 w-full h-3 cursor-n-resize hover:bg-blue-500/20 transition-colors"
                style={{ pointerEvents: 'auto', zIndex: 9 }}
                onMouseDown={(e) => handleResizeStart(e, 'n')}
                onMouseEnter={() => onMouseEnter?.(element._id)}
                onMouseLeave={() => onMouseLeave?.()}
              />
            </>
          )}

          {/* Border zones for dragging - transparent interactive areas on edges */}
          {canEdit && !isDragging && !isResizing && (
            <>
              {/* Top border zone */}
              <div
                className="absolute top-0 left-0 right-0 cursor-grab hover:bg-blue-500/5"
                style={{
                  height: `${BORDER_ZONE}px`,
                  pointerEvents: 'auto',
                  zIndex: 11
                }}
                {...attributes}
                {...listeners}
                onMouseEnter={() => onMouseEnter?.(element._id)}
                onMouseLeave={() => onMouseLeave?.()}
              />
              {/* Bottom border zone */}
              <div
                className="absolute bottom-0 left-0 right-0 cursor-grab hover:bg-blue-500/5"
                style={{
                  height: `${BORDER_ZONE}px`,
                  pointerEvents: 'auto',
                  zIndex: 11
                }}
                {...attributes}
                {...listeners}
                onMouseEnter={() => onMouseEnter?.(element._id)}
                onMouseLeave={() => onMouseLeave?.()}
              />
              {/* Left border zone */}
              <div
                className="absolute top-0 left-0 bottom-0 cursor-grab hover:bg-blue-500/5"
                style={{
                  width: `${BORDER_ZONE}px`,
                  pointerEvents: 'auto',
                  zIndex: 11
                }}
                {...attributes}
                {...listeners}
                onMouseEnter={() => onMouseEnter?.(element._id)}
                onMouseLeave={() => onMouseLeave?.()}
              />
              {/* Right border zone */}
              <div
                className="absolute top-0 right-0 bottom-0 cursor-grab hover:bg-blue-500/5"
                style={{
                  width: `${BORDER_ZONE}px`,
                  pointerEvents: 'auto',
                  zIndex: 11
                }}
                {...attributes}
                {...listeners}
                onMouseEnter={() => onMouseEnter?.(element._id)}
                onMouseLeave={() => onMouseLeave?.()}
              />
            </>
          )}

          {/* Center info */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`
              px-2 py-1 rounded
              text-xs font-medium
              ${isResizing
                ? 'bg-blue-500 text-white opacity-100'
                : `opacity-30 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`
              }
              transition-all duration-200
            `}>
              {Math.round(dimensions.width)} × {Math.round(dimensions.height)}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        elementType="wrapper"
      />

      {/* Element List Modal */}
      <WrapperElementList
        isOpen={showElementList}
        onClose={() => setShowElementList(false)}
        wrapper={element}
        allElements={allElements}
        onUpdate={onUpdate}
      />

      {/* Category Picker Modal */}
      <CategoryPicker
        isOpen={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        onSelect={(category) => {
          // Update the element with the new category
          if (onUpdate) {
            onUpdate({
              ...element,
              category: category ? { _id: category._id, name: category.name, icon: category.icon, color: category.color } : null
            });
          }
        }}
        currentCategoryId={element.category?._id}
        elementId={element._id}
      />
    </>
  );
};

export default WrapperElement;
