import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Settings } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useTheme } from '../context/ThemeContext';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { getElementsInsideWrapper } from '../utils/wrapperUtils';

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
  const [isResizing, setIsResizing] = useState(false);
  const [isInBorderZone, setIsInBorderZone] = useState(false);
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

    console.log('📐 Resize move:', {
      mousePos: { x: e.clientX, y: e.clientY },
      delta: { x: deltaX, y: deltaY },
      currentScale
    });

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
      const widthChange = Math.min(deltaX, startWidth - 200); // Don't shrink below 200
      newWidth = Math.max(200, startWidth - deltaX);
      newPosX = startPosX + (startWidth - newWidth); // Move position to keep right edge fixed
    }

    // South: expand down
    if (direction.includes('s')) {
      newHeight = Math.max(150, startHeight + deltaY);
    }

    // North: expand up (move position and increase height)
    if (direction.includes('n')) {
      const heightChange = Math.min(deltaY, startHeight - 150); // Don't shrink below 150
      newHeight = Math.max(150, startHeight - deltaY);
      newPosY = startPosY + (startHeight - newHeight); // Move position to keep bottom edge fixed
    }

    console.log('📊 New dimensions:', { newWidth, newHeight, newPosX, newPosY });

    setDimensions({ width: newWidth, height: newHeight });
    setPosition({ x: newPosX, y: newPosY });

    console.log('✅ State updated with new dimensions');
  }, []); // Empty deps because we use refs for all dynamic values

  // Handle resize end - memoized to ensure stable event listener reference
  const handleResizeEnd = useCallback(() => {
    console.log('🏁 Resize ended');

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

    console.log('📦 Wrapper updated:', {
      position: currentPosition,
      dimensions: currentDimensions,
      childElements: childElementIds.length
    });

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
    disabled: !canEdit || isResizing || !isInBorderZone, // Only drag from border zone
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: `${dimensions.width}px`,
    height: `${dimensions.height}px`,
    zIndex: element.position.z || 1,
    cursor: isDragging ? 'grabbing' : (isInBorderZone && canEdit ? 'grab' : 'default'),
    pointerEvents: 'auto',
    touchAction: isResizing ? 'none' : 'auto',
    userSelect: 'none',
  };

  // Handle resize start
  const handleResizeStart = (e, direction) => {
    if (!canEdit) return;
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);

    console.log('🎯 Resize started:', {
      direction,
      viewportScale,
      startDimensions: dimensions,
      startPosition: position
    });

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

    console.log('🎬 Event listeners attached - ready for resize');
  };

  // Sync state with element props when they change externally (e.g., from drag)
  // BUT NOT during resize to avoid overwriting local state
  useEffect(() => {
    if (!isResizing) {
      setPosition({ x: element.position.x, y: element.position.y });
      setDimensions({ width: element.dimensions.width, height: element.dimensions.height });
    }
  }, [element.position.x, element.position.y, element.dimensions.width, element.dimensions.height, isResizing]);

  // Detect if mouse is in border zone for dragging
  const handleMouseMove = (e) => {
    if (!canEdit || isResizing) return;

    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const inBorder = (
      mouseX < BORDER_ZONE ||
      mouseX > rect.width - BORDER_ZONE ||
      mouseY < BORDER_ZONE ||
      mouseY > rect.height - BORDER_ZONE
    );

    setIsInBorderZone(inBorder);
  };

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
        {...attributes}
        {...listeners}
        onMouseEnter={() => onMouseEnter?.(element._id)}
        onMouseLeave={() => {
          onMouseLeave?.();
          setIsInBorderZone(false);
        }}
        onMouseMove={handleMouseMove}
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
            ${isInBorderZone && canEdit && !isResizing ? 'bg-blue-500/5' : 'bg-transparent'}
            ${isResizing ? 'bg-blue-500/10' : ''}
          `}
          style={{
            opacity: isDragging ? 0.5 : 1,
            pointerEvents: 'none', // Allow clicks to pass through to elements inside
          }}
        >
          {/* Top label */}
          <div className={`
            absolute -top-6 left-0
            px-2 py-0.5
            text-xs font-medium
            rounded-t
            ${isDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-500/20 text-blue-700'}
          `}
          style={{ pointerEvents: 'auto' }}
          >
            Wrapper
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
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSettingsClick?.(element);
                }}
                className={`
                  p-1 rounded
                  ${isDarkMode
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    : 'bg-white hover:bg-gray-100 text-gray-700'
                  }
                  transition-colors
                `}
                title="Wrapper Settings"
              >
                <Settings size={14} />
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
              />
              <div
                className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full cursor-ne-resize hover:scale-125 transition-transform"
                style={{ pointerEvents: 'auto', zIndex: 10 }}
                onMouseDown={(e) => handleResizeStart(e, 'ne')}
              />
              <div
                className="absolute -bottom-2 -left-2 w-6 h-6 bg-blue-500 rounded-full cursor-sw-resize hover:scale-125 transition-transform"
                style={{ pointerEvents: 'auto', zIndex: 10 }}
                onMouseDown={(e) => handleResizeStart(e, 'sw')}
              />
              <div
                className="absolute -top-2 -left-2 w-6 h-6 bg-blue-500 rounded-full cursor-nw-resize hover:scale-125 transition-transform"
                style={{ pointerEvents: 'auto', zIndex: 10 }}
                onMouseDown={(e) => handleResizeStart(e, 'nw')}
              />

              {/* Edge handles - wider for easier grabbing */}
              <div
                className="absolute top-0 right-0 w-3 h-full cursor-e-resize hover:bg-blue-500/20 transition-colors"
                style={{ pointerEvents: 'auto', zIndex: 9 }}
                onMouseDown={(e) => handleResizeStart(e, 'e')}
              />
              <div
                className="absolute top-0 left-0 w-3 h-full cursor-w-resize hover:bg-blue-500/20 transition-colors"
                style={{ pointerEvents: 'auto', zIndex: 9 }}
                onMouseDown={(e) => handleResizeStart(e, 'w')}
              />
              <div
                className="absolute bottom-0 left-0 w-full h-3 cursor-s-resize hover:bg-blue-500/20 transition-colors"
                style={{ pointerEvents: 'auto', zIndex: 9 }}
                onMouseDown={(e) => handleResizeStart(e, 's')}
              />
              <div
                className="absolute top-0 left-0 w-full h-3 cursor-n-resize hover:bg-blue-500/20 transition-colors"
                style={{ pointerEvents: 'auto', zIndex: 9 }}
                onMouseDown={(e) => handleResizeStart(e, 'n')}
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
    </>
  );
};

export default WrapperElement;
