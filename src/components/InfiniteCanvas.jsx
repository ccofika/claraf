import React, { useState, useCallback, useRef } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { DndContext, useSensor, useSensors, PointerSensor, DragOverlay } from '@dnd-kit/core';
import CanvasElement from './CanvasElement';
import DockBar from './DockBar';
import Minimap from './Minimap';
import ElementSettingsModal from './ElementSettingsModal';
import TextFormattingDock from './TextFormattingDock';
import CanvasSearchBar from './CanvasSearchBar';
import ViewModeSwitch from './ViewModeSwitch';
import { useTheme } from '../context/ThemeContext';
import { useTextFormatting } from '../context/TextFormattingContext';

const InfiniteCanvas = ({ workspaceId, elements = [], onElementUpdate, onElementCreate, onElementDelete, canEditContent = true, isViewMode = false, onViewModeToggle, workspaces = [], onElementNavigate, onBookmarkCreated }) => {
  const [canvasElements, setCanvasElements] = useState(elements);
  const transformWrapperRef = useRef(null);
  const { theme } = useTheme();
  const { isEditing } = useTextFormatting();
  const [highlightedElement, setHighlightedElement] = useState(null);

  // Determine if user is actually in edit mode (has permission AND not in view mode)
  const isInEditMode = canEditContent && !isViewMode;
  const [viewport, setViewport] = useState({
    x: -50000 + (window.innerWidth / 2),
    y: -50000 + (window.innerHeight / 2),
    width: window.innerWidth,
    height: window.innerHeight,
    scale: 1
  });

  // Update viewport dimensions on window resize
  React.useEffect(() => {
    const handleResize = () => {
      setViewport(prev => ({
        ...prev,
        width: window.innerWidth,
        height: window.innerHeight
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track previous workspace ID to detect workspace changes
  const prevWorkspaceId = React.useRef(workspaceId);

  // Update canvas elements when elements prop changes (e.g., workspace switch)
  React.useEffect(() => {
    setCanvasElements(elements);

    // Only reset viewport when switching workspaces, not when elements change
    if (workspaceId !== prevWorkspaceId.current) {
      prevWorkspaceId.current = workspaceId;

      if (transformWrapperRef.current) {
        const initialX = -50000 + (window.innerWidth / 2);
        const initialY = -50000 + (window.innerHeight / 2);
        transformWrapperRef.current.setTransform(initialX, initialY, 1);
        setViewport({
          x: initialX,
          y: initialY,
          width: window.innerWidth,
          height: window.innerHeight,
          scale: 1
        });
      }
    }
  }, [elements, workspaceId]);

  // Handle viewport updates from transform changes
  const handleTransformChange = useCallback((ref) => {
    if (ref && ref.state) {
      setViewport({
        x: ref.state.positionX,
        y: ref.state.positionY,
        width: window.innerWidth,
        height: window.innerHeight,
        scale: ref.state.scale
      });
    }
  }, []);

  // Handle viewport change from minimap
  const handleMinimapViewportChange = useCallback((newViewport) => {
    if (transformWrapperRef.current) {
      transformWrapperRef.current.setTransform(
        newViewport.x,
        newViewport.y,
        newViewport.scale
      );
    }
  }, []);

  const handleDockItemClick = async (itemId) => {
    if (!isInEditMode) return;

    // Set dimensions based on element type
    let dimensions = { width: 400, height: 50 };
    let content = { value: '', history: [] };

    if (itemId === 'description') {
      dimensions = { width: 500, height: 100 };
    } else if (itemId === 'macro') {
      dimensions = { width: 450, height: 150 };
      content = {
        title: '',
        description: '',
        titleHistory: [],
        descriptionHistory: [],
        isExpanded: false
      };
    } else if (itemId === 'example') {
      dimensions = { width: 500, height: 120 };
      content = {
        examples: [{
          title: 'Example Conversation',
          messages: [
            { type: 'user', text: 'Hello, I need help with...', timestamp: new Date() }
          ],
          titleHistory: []
        }],
        currentExampleIndex: 0,
        isExpanded: false
      };
    }

    // Calculate center of current viewport in canvas coordinates
    const currentScale = viewport.scale || 1;
    const viewportCenterX = (-viewport.x / currentScale) + (viewport.width / (2 * currentScale));
    const viewportCenterY = (-viewport.y / currentScale) + (viewport.height / (2 * currentScale));

    // Create new element at center of current viewport
    const newElement = {
      type: itemId,
      position: {
        x: viewportCenterX - (dimensions.width / 2),
        y: viewportCenterY - (dimensions.height / 2),
        z: canvasElements.length
      },
      dimensions,
      content,
      style: {
        backgroundColor: '#ffffff',
        borderColor: '#d1d5db',
        borderWidth: 2,
        borderRadius: 8,
        fontSize: itemId === 'description' ? 16 : 18,
        fontWeight: itemId === 'title' ? 'medium' : 'normal',
        textColor: theme === 'dark' ? '#f5f5f5' : '#171717',
        padding: 12
      }
    };

    // Add element to local state optimistically with temporary ID
    const tempElement = { ...newElement, _id: `temp-${Date.now()}` };
    setCanvasElements(prev => [...prev, tempElement]);

    // Call onElementCreate to save to backend and get real ID
    if (onElementCreate) {
      const createdElement = await onElementCreate(newElement);
      if (createdElement) {
        // Replace temp element with real one
        setCanvasElements(prev =>
          prev.map(el => el._id === tempElement._id ? createdElement : el)
        );
      }
    }
  };

  const handleElementUpdate = (updatedElement) => {
    // Update local state
    setCanvasElements(prev =>
      prev.map(el => el._id === updatedElement._id ? updatedElement : el)
    );

    // Call parent update handler
    if (onElementUpdate) {
      onElementUpdate(updatedElement);
    }
  };

  const handleElementDelete = async (elementId) => {
    // Update local state immediately for responsive UI
    setCanvasElements(prev => prev.filter(el => el._id !== elementId));

    // Call parent delete handler to update main state and backend
    if (onElementDelete) {
      await onElementDelete(elementId);
    }
  };

  const [settingsModalOpen, setSettingsModalOpen] = React.useState(false);
  const [selectedElement, setSelectedElement] = React.useState(null);

  const handleSettingsClick = (element) => {
    setSelectedElement(element);
    setSettingsModalOpen(true);
  };

  const handleSettingsSave = (updatedElement) => {
    handleElementUpdate(updatedElement);
    setSettingsModalOpen(false);
    setSelectedElement(null);
  };

  const [isDraggingElement, setIsDraggingElement] = React.useState(false);
  const [activeId, setActiveId] = React.useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  const handleDragStart = useCallback((event) => {
    event.preventDefault?.();
    setIsDraggingElement(true);
    setActiveId(event.active.id);

    // Force disable panning immediately
    if (transformWrapperRef.current?.instance?.setup?.panning) {
      transformWrapperRef.current.instance.setup.panning.disabled = true;
    }
  }, []);

  const handleDragMove = useCallback((event) => {
    // Keep panning disabled during entire drag operation
    if (transformWrapperRef.current?.instance?.setup?.panning) {
      transformWrapperRef.current.instance.setup.panning.disabled = true;
    }
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, delta } = event;

    setIsDraggingElement(false);
    setActiveId(null);

    // Re-enable panning after a small delay to prevent accidental panning
    setTimeout(() => {
      if (transformWrapperRef.current?.instance?.setup?.panning) {
        transformWrapperRef.current.instance.setup.panning.disabled = false;
      }
    }, 50);

    if (!isInEditMode) return;

    const draggedElement = canvasElements.find((el) => el._id === active.id);
    if (!draggedElement) return;

    // Get current scale from viewport to adjust delta
    const currentScale = viewport.scale || 1;
    const scaledDeltaX = delta.x / currentScale;
    const scaledDeltaY = delta.y / currentScale;

    // Calculate new position
    const newPosition = {
      ...draggedElement.position,
      x: draggedElement.position.x + scaledDeltaX,
      y: draggedElement.position.y + scaledDeltaY,
    };

    // Update local state
    setCanvasElements((elements) =>
      elements.map((element) =>
        element._id === active.id
          ? {
              ...element,
              position: newPosition,
            }
          : element
      )
    );

    // Notify parent component about the update
    if (onElementUpdate) {
      onElementUpdate({
        ...draggedElement,
        position: newPosition,
      });
    }
  }, [canvasElements, onElementUpdate, isInEditMode, viewport.scale]);


  const handleElementSelect = useCallback((element) => {
    // Check if element is in current workspace
    if (element.workspaceId && element.workspaceId !== workspaceId) {
      // Navigate to different workspace
      if (onElementNavigate) {
        onElementNavigate(element);
      }
    } else {
      // Element is in current workspace - zoom to it
      if (transformWrapperRef.current && element.position) {
        const targetScale = 1.5;

        // Calculate element center position
        const elementCenterX = element.position.x + (element.dimensions?.width || 0) / 2;
        const elementCenterY = element.position.y + (element.dimensions?.height || 0) / 2;

        // Calculate transform position to center the element
        // Formula: -elementPos * scale + viewportCenter
        const targetX = -elementCenterX * targetScale + (window.innerWidth / 2);
        const targetY = -elementCenterY * targetScale + (window.innerHeight / 2);

        transformWrapperRef.current.setTransform(targetX, targetY, targetScale, 500);
      }
    }
  }, [workspaceId, onElementNavigate]);

  // Listen for zoom to element events
  React.useEffect(() => {
    const handleZoomToElement = (event) => {
      const element = event.detail;
      if (element && transformWrapperRef.current && element.position) {
        const targetScale = 1.5;

        // Calculate element center position
        const elementCenterX = element.position.x + (element.dimensions?.width || 0) / 2;
        const elementCenterY = element.position.y + (element.dimensions?.height || 0) / 2;

        // Calculate transform position to center the element
        // Formula: -elementPos * scale + viewportCenter
        const targetX = -elementCenterX * targetScale + (window.innerWidth / 2);
        const targetY = -elementCenterY * targetScale + (window.innerHeight / 2);

        transformWrapperRef.current.setTransform(targetX, targetY, targetScale, 500);
      }
    };

    window.addEventListener('zoomToElement', handleZoomToElement);
    return () => window.removeEventListener('zoomToElement', handleZoomToElement);
  }, []);

  // Handle share link URL parameters
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const elementId = params.get('element');

    if (elementId && canvasElements.length > 0 && transformWrapperRef.current) {
      const targetElement = canvasElements.find(el => el._id === elementId);
      if (targetElement && targetElement.position) {
        // Wait for canvas to be ready, then zoom to element
        setTimeout(() => {
          const targetScale = 1.5;

          // Calculate element center position
          const elementCenterX = targetElement.position.x + (targetElement.dimensions?.width || 0) / 2;
          const elementCenterY = targetElement.position.y + (targetElement.dimensions?.height || 0) / 2;

          // Calculate transform position to center the element
          const targetX = -elementCenterX * targetScale + (window.innerWidth / 2);
          const targetY = -elementCenterY * targetScale + (window.innerHeight / 2);

          // Set transform
          if (transformWrapperRef.current) {
            transformWrapperRef.current.setTransform(targetX, targetY, targetScale, 500);
          }

          // Highlight element
          setHighlightedElement(elementId);

          // Remove highlight after 3 seconds
          setTimeout(() => setHighlightedElement(null), 3000);

          // Clean URL after zoom animation completes
          setTimeout(() => {
            window.history.replaceState({}, '', window.location.pathname);
          }, 600);
        }, 300);
      }
    }
  }, [canvasElements]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* View Mode Switch - shown only if user has edit permission */}
      {canEditContent && (
        <div className="absolute top-6 right-6 z-50">
          <ViewModeSwitch
            isViewMode={isViewMode}
            onToggle={onViewModeToggle}
          />
        </div>
      )}

      {/* Only show DockBar if user can edit AND is in edit mode */}
      {isInEditMode && <DockBar onItemClick={handleDockItemClick} />}

      {/* Search Bar with fade animation - shown when NOT editing */}
      <div
        className={`
          absolute top-0 left-0 right-0 z-50
          transition-all duration-300 ease-out
          ${isEditing
            ? 'opacity-0 -translate-y-full pointer-events-none'
            : 'opacity-100 translate-y-0'
          }
        `}
      >
        <CanvasSearchBar
          currentWorkspaceId={workspaceId}
          workspaces={workspaces}
          onElementSelect={handleElementSelect}
        />
      </div>

      {/* Text Formatting Dock with fade animation - shown when editing AND user is in edit mode */}
      {isInEditMode && (
        <div
          className={`
            absolute top-0 left-0 right-0 z-50
            transition-all duration-300 ease-out
            ${isEditing
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 -translate-y-full pointer-events-none'
            }
          `}
        >
          <TextFormattingDock />
        </div>
      )}

      <TransformWrapper
        ref={transformWrapperRef}
        initialScale={1}
        minScale={0.1}
        maxScale={5}
        limitToBounds={false}
        centerOnInit={true}
        initialPositionX={-50000 + (window.innerWidth / 2)}
        initialPositionY={-50000 + (window.innerHeight / 2)}
        panning={{
          disabled: isDraggingElement,
          excluded: ['input', 'textarea', 'button', 'svg', 'path'],
          excludedClass: 'canvas-draggable-element'
        }}
        wheel={{ step: 0.1 }}
        doubleClick={{ disabled: true }}
        onTransformed={handleTransformChange}
        onPanning={handleTransformChange}
        onZoom={handleTransformChange}
        disablePadding={true}
      >
        {({ zoomIn, zoomOut, resetTransform, state, ...rest }) => (
          <>
            <TransformComponent
              wrapperStyle={{ width: '100%', height: '100%', overflow: 'hidden' }}
              contentStyle={{ width: '100%', height: '100%', cursor: 'grab' }}
            >
              <div
                className="relative cursor-grab active:cursor-grabbing"
                style={{
                  width: '100000px',
                  height: '100000px',
                  minWidth: '100000px',
                  minHeight: '100000px',
                  backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
                  backgroundImage: theme === 'dark'
                    ? `repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.06) 0px, rgba(255, 255, 255, 0.06) 1px, transparent 1px, transparent 50px),
                       repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.06) 0px, rgba(255, 255, 255, 0.06) 1px, transparent 1px, transparent 50px)`
                    : `repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.06) 0px, rgba(0, 0, 0, 0.06) 1px, transparent 1px, transparent 50px),
                       repeating-linear-gradient(90deg, rgba(0, 0, 0, 0.06) 0px, rgba(0, 0, 0, 0.06) 1px, transparent 1px, transparent 50px)`,
                }}
              >
              <DndContext
                sensors={isInEditMode ? sensors : []}
                onDragStart={handleDragStart}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
              >
                {canvasElements.map((element) => (
                  <CanvasElement
                    key={element._id}
                    element={element}
                    canEdit={isInEditMode}
                    workspaceId={workspaceId}
                    onUpdate={handleElementUpdate}
                    onDelete={handleElementDelete}
                    onSettingsClick={handleSettingsClick}
                    isHighlighted={highlightedElement === element._id}
                    onBookmarkCreated={onBookmarkCreated}
                  />
                ))}
              </DndContext>
            </div>
          </TransformComponent>
        </>
        )}
      </TransformWrapper>

      <Minimap
        elements={canvasElements}
        canvasSize={{ width: 100000, height: 100000 }}
        viewport={viewport}
        onViewportChange={handleMinimapViewportChange}
      />

      <ElementSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => {
          setSettingsModalOpen(false);
          setSelectedElement(null);
        }}
        element={selectedElement}
        onSave={handleSettingsSave}
      />
    </div>
  );
};

export default InfiniteCanvas;
