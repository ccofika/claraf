import React, { useState, useCallback, useRef, useMemo } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { DndContext, useSensor, useSensors, PointerSensor, DragOverlay } from '@dnd-kit/core';
import CanvasElement from './CanvasElement';
import DockBar from './DockBar';
import Minimap from './Minimap';
import ElementSettingsModal from './ElementSettingsModal';
import TextFormattingDock from './TextFormattingDock';
import CanvasSearchBar from './CanvasSearchBar';
import ViewModeDropdown from './ViewModeDropdown';
import DynamicGrid from './DynamicGrid';
import PostView from './PostView';
import { useTheme } from '../context/ThemeContext';
import { useTextFormatting } from '../context/TextFormattingContext';
import { getElementsInsideWrapper } from '../utils/wrapperUtils';

const InfiniteCanvas = ({ workspaceId, elements = [], onElementUpdate, onElementCreate, onElementDelete, canEditContent = true, viewMode = 'view', onViewModeChange, workspaces = [], onElementNavigate, onBookmarkCreated }) => {
  const [canvasElements, setCanvasElements] = useState(elements);
  const transformWrapperRef = useRef(null);
  const { theme } = useTheme();
  const { isEditing } = useTextFormatting();
  const [highlightedElement, setHighlightedElement] = useState(null);
  const [isHoveringElement, setIsHoveringElement] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const zoomTimeoutRef = useRef(null);
  const panningTimeoutRef = useRef(null);
  const rafRef = useRef(null);
  const frozenCanvasBoundsRef = useRef(null);

  // Determine if user is actually in edit mode (has permission AND in edit mode)
  const isInEditMode = canEditContent && viewMode === 'edit';
  const [isDraggingElement, setIsDraggingElement] = React.useState(false);
  const [activeId, setActiveId] = React.useState(null);
  const [viewport, setViewport] = useState({
    x: 0,
    y: 0,
    width: window.innerWidth,
    height: window.innerHeight,
    scale: 1
  });

  // Calculate dynamic canvas bounds based on elements and viewport
  const canvasBounds = useMemo(() => {
    // During dragging, return frozen bounds to prevent viewport shift
    if (isDraggingElement && frozenCanvasBoundsRef.current) {
      return frozenCanvasBoundsRef.current;
    }
    const padding = 3000; // Padding around content
    const minCanvasExtent = 20000; // Minimum extent in each direction from origin

    // Start with viewport bounds
    const scale = viewport.scale || 1;
    const viewportLeft = (-viewport.x / scale);
    const viewportTop = (-viewport.y / scale);
    const viewportRight = viewportLeft + (viewport.width / scale);
    const viewportBottom = viewportTop + (viewport.height / scale);

    // Calculate bounds that include both viewport and all elements
    let minX = Math.min(0, viewportLeft - padding);
    let minY = Math.min(0, viewportTop - padding);
    let maxX = Math.max(0, viewportRight + padding);
    let maxY = Math.max(0, viewportBottom + padding);

    // Expand bounds to include all elements
    canvasElements.forEach(element => {
      if (element.position && element.dimensions) {
        const elementLeft = element.position.x;
        const elementTop = element.position.y;
        const elementRight = elementLeft + (element.dimensions.width || 0);
        const elementBottom = elementTop + (element.dimensions.height || 0);

        minX = Math.min(minX, elementLeft - padding);
        minY = Math.min(minY, elementTop - padding);
        maxX = Math.max(maxX, elementRight + padding);
        maxY = Math.max(maxY, elementBottom + padding);
      }
    });

    // Ensure minimum extent from origin
    minX = Math.min(minX, -minCanvasExtent);
    minY = Math.min(minY, -minCanvasExtent);
    maxX = Math.max(maxX, minCanvasExtent);
    maxY = Math.max(maxY, minCanvasExtent);

    const bounds = {
      left: minX,
      top: minY,
      width: maxX - minX,
      height: maxY - minY
    };

    // Store the calculated bounds for potential freezing during drag
    if (!isDraggingElement) {
      frozenCanvasBoundsRef.current = bounds;
    }

    return bounds;
  }, [canvasElements, viewport.x, viewport.y, viewport.width, viewport.height, viewport.scale, isDraggingElement]);

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

  // Cleanup timeouts and RAF on unmount
  React.useEffect(() => {
    return () => {
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }
      if (panningTimeoutRef.current) {
        clearTimeout(panningTimeoutRef.current);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Track previous workspace ID to detect workspace changes
  const prevWorkspaceId = React.useRef(workspaceId);
  const [isPanningDisabled, setIsPanningDisabled] = React.useState(false);

  // Listen for disable panning events from wrapper resize
  React.useEffect(() => {
    const handleDisablePanning = (event) => {
      setIsPanningDisabled(event.detail);
    };

    window.addEventListener('disablePanning', handleDisablePanning);
    return () => window.removeEventListener('disablePanning', handleDisablePanning);
  }, []);

  // Reset viewport when switching workspaces
  React.useEffect(() => {
    if (workspaceId !== prevWorkspaceId.current) {
      prevWorkspaceId.current = workspaceId;

      if (transformWrapperRef.current) {
        const initialX = 0;
        const initialY = 0;
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
  }, [workspaceId]);

  // Update canvas elements when elements prop changes
  React.useEffect(() => {
    setCanvasElements(elements);
  }, [elements]);

  // Virtualization: Only render elements visible in viewport (disabled during panning to prevent flicker)
  const visibleElements = useMemo(() => {
    // First, filter out wrapper elements if not in edit mode
    let filteredElements = canvasElements;
    if (!isInEditMode) {
      filteredElements = canvasElements.filter(element => element.type !== 'wrapper');
    }

    // Disable virtualization while panning to prevent flickering
    if (isPanning) return filteredElements;

    if (!viewport.scale || filteredElements.length === 0) return filteredElements;

    // If there are fewer than 50 elements, don't virtualize (no performance benefit)
    if (filteredElements.length < 50) return filteredElements;

    // Use larger padding for smoother experience
    const padding = 2000; // Increased padding to reduce pop-in
    const scale = viewport.scale;

    // Calculate viewport bounds in canvas coordinates
    const viewportLeft = (-viewport.x / scale) - padding;
    const viewportTop = (-viewport.y / scale) - padding;
    const viewportRight = viewportLeft + (viewport.width / scale) + (padding * 2);
    const viewportBottom = viewportTop + (viewport.height / scale) + (padding * 2);

    // Filter elements that intersect with viewport
    return filteredElements.filter(element => {
      if (!element.position || !element.dimensions) return true; // Always render if no position/dimensions

      const elementLeft = element.position.x;
      const elementTop = element.position.y;
      const elementRight = elementLeft + (element.dimensions.width || 0);
      const elementBottom = elementTop + (element.dimensions.height || 0);

      // Check if element intersects with viewport
      return !(
        elementRight < viewportLeft ||
        elementLeft > viewportRight ||
        elementBottom < viewportTop ||
        elementTop > viewportBottom
      );
    });
  }, [canvasElements, viewport.x, viewport.y, viewport.scale, viewport.width, viewport.height, isPanning, isInEditMode]);

  // Handle viewport updates from transform changes with RAF for smooth updates
  const handleTransformChange = useCallback((ref) => {
    if (ref && ref.state) {
      // Cancel any pending RAF
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      // Use RAF to batch viewport updates
      rafRef.current = requestAnimationFrame(() => {
        setViewport({
          x: ref.state.positionX,
          y: ref.state.positionY,
          width: window.innerWidth,
          height: window.innerHeight,
          scale: ref.state.scale
        });
      });
    }
  }, []);

  // Handle panning start/end to control virtualization
  const handlePanningStart = useCallback(() => {
    setIsPanning(true);

    // Clear any existing timeout
    if (panningTimeoutRef.current) {
      clearTimeout(panningTimeoutRef.current);
    }
  }, []);

  const handlePanningEnd = useCallback(() => {
    // Clear any existing timeout
    if (panningTimeoutRef.current) {
      clearTimeout(panningTimeoutRef.current);
    }

    // Delay re-enabling virtualization slightly after panning stops
    panningTimeoutRef.current = setTimeout(() => {
      setIsPanning(false);
    }, 150);
  }, []);

  // Handle zoom events to prevent hover state reset during zooming
  const handleZoom = useCallback((ref) => {
    setIsZooming(true);
    handleTransformChange(ref);

    // Clear existing timeout
    if (zoomTimeoutRef.current) {
      clearTimeout(zoomTimeoutRef.current);
    }

    // Reset zooming state after a short delay
    zoomTimeoutRef.current = setTimeout(() => {
      setIsZooming(false);
    }, 150);
  }, [handleTransformChange]);

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

  const handleDockItemClick = useCallback(async (itemId) => {
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
    } else if (itemId === 'wrapper') {
      dimensions = { width: 600, height: 400 };
      content = {
        childElements: [] // Will be populated automatically based on element positions
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
  }, [isInEditMode, viewport, canvasElements.length, theme, onElementCreate]);

  const handleElementUpdate = useCallback((updatedElement) => {
    // Update local state
    setCanvasElements(prev =>
      prev.map(el => el._id === updatedElement._id ? updatedElement : el)
    );

    // Call parent update handler
    if (onElementUpdate) {
      onElementUpdate(updatedElement);
    }
  }, [onElementUpdate]);

  const handleElementDelete = useCallback(async (elementId) => {
    // Update local state immediately for responsive UI
    setCanvasElements(prev => prev.filter(el => el._id !== elementId));

    // Call parent delete handler to update main state and backend
    if (onElementDelete) {
      await onElementDelete(elementId);
    }
  }, [onElementDelete]);

  const [settingsModalOpen, setSettingsModalOpen] = React.useState(false);
  const [selectedElement, setSelectedElement] = React.useState(null);

  const handleSettingsClick = useCallback((element) => {
    setSelectedElement(element);
    setSettingsModalOpen(true);
  }, []);

  const handleSettingsSave = useCallback((updatedElement) => {
    handleElementUpdate(updatedElement);
    setSettingsModalOpen(false);
    setSelectedElement(null);
  }, [handleElementUpdate]);

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

    // If dragged element is a wrapper, update its childElements
    let updatedElement = {
      ...draggedElement,
      position: newPosition,
    };

    if (draggedElement.type === 'wrapper') {
      const childElementIds = getElementsInsideWrapper(updatedElement, canvasElements);
      updatedElement = {
        ...updatedElement,
        content: {
          ...updatedElement.content,
          childElements: childElementIds
        }
      };
    }

    // Notify parent component about the update
    if (onElementUpdate) {
      onElementUpdate(updatedElement);
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
        const targetScale = 0.375;

        // Calculate element center position
        const elementCenterX = element.position.x + (element.dimensions?.width || 0) / 2;
        const elementCenterY = element.position.y + (element.dimensions?.height || 0) / 2;

        // Calculate transform position to center the element
        // Formula: -elementPos * scale + viewportCenter
        let targetX = -elementCenterX * targetScale + (window.innerWidth / 2);
        let targetY = -elementCenterY * targetScale + (window.innerHeight / 2);

        // Shift view right and down
        const shiftRight = window.innerWidth * 0.25;  // 25% desno
        const shiftDown = window.innerHeight * 0.075; // 7.5% dole
        targetX -= shiftRight;
        targetY -= shiftDown;

        transformWrapperRef.current.setTransform(targetX, targetY, targetScale, 500);
      }
    }
  }, [workspaceId, onElementNavigate]);

  // Handle mouse enter/leave on elements to disable panning in view mode
  const handleElementMouseEnter = useCallback(() => {
    if (!isInEditMode) {
      setIsHoveringElement(true);
    }
  }, [isInEditMode]);

  const handleElementMouseLeave = useCallback(() => {
    if (!isInEditMode) {
      // Check if there's an active text selection
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) {
        // Don't reset hover state if there's a selection
        return;
      }

      // Don't reset hover state if currently zooming
      if (isZooming) {
        return;
      }

      setIsHoveringElement(false);
    }
  }, [isInEditMode, isZooming]);

  // Handle clicks outside elements to reset hover state
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (!isInEditMode && isHoveringElement) {
        // Don't reset hover state if Ctrl/Cmd+clicking on a link (for element link navigation)
        if (e.ctrlKey || e.metaKey) {
          let target = e.target;
          while (target && target !== document.body) {
            if (target.tagName === 'A') {
              // Clicking on a link with Ctrl/Cmd - don't reset hover state
              return;
            }
            target = target.parentElement;
          }
        }

        // Check if click is on canvas background (not on an element)
        if (e.target.classList.contains('cursor-grab') ||
            e.target.classList.contains('cursor-grabbing') ||
            !e.target.closest('.canvas-draggable-element')) {
          setIsHoveringElement(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isInEditMode, isHoveringElement]);

  // Listen for zoom to element events
  React.useEffect(() => {
    const handleZoomToElement = (event) => {
      console.log('=== InfiniteCanvas handleZoomToElement START ===');
      console.log('Event received:', event);
      console.log('Event detail:', event.detail);

      const eventData = event.detail;
      if (!eventData) {
        console.log('❌ No event data');
        return;
      }
      if (!transformWrapperRef.current) {
        console.log('❌ No transformWrapperRef');
        return;
      }

      console.log('✓ Event data and transformWrapperRef exist');
      console.log('Event data:', eventData);
      console.log('Canvas elements count:', canvasElements.length);

      // Extract instant flag (for no animation)
      const instant = eventData.instant || false;

      // Find the element in canvasElements if only _id is provided
      let targetElement = eventData;
      if (eventData._id && !eventData.position) {
        console.log('Looking for element with _id:', eventData._id);
        targetElement = canvasElements.find(el => el._id === eventData._id);
        console.log('Found element:', targetElement);
      }

      if (!targetElement) {
        console.log('❌ Target element not found');
        return;
      }
      if (!targetElement.position) {
        console.log('❌ Target element has no position');
        return;
      }

      console.log('✓ Target element found with position:', targetElement.position);

      const targetScale = 0.375;

      // Calculate element center position
      const elementCenterX = targetElement.position.x + (targetElement.dimensions?.width || 0) / 2;
      const elementCenterY = targetElement.position.y + (targetElement.dimensions?.height || 0) / 2;

      console.log('Element center:', { x: elementCenterX, y: elementCenterY });

      // Calculate transform position to center the element
      let targetX = -elementCenterX * targetScale + (window.innerWidth / 2);
      let targetY = -elementCenterY * targetScale + (window.innerHeight / 2);

      // Shift view right and down
      const shiftRight = window.innerWidth * 0.25;  // 25% desno
      const shiftDown = window.innerHeight * 0.075; // 7.5% dole
      targetX -= shiftRight; // Shift view right
      targetY -= shiftDown;  // Shift view down

      console.log('Transform target (with shift):', { x: targetX, y: targetY, scale: targetScale });

      // Use duration 0 for instant (no animation), 500ms for smooth animation
      const duration = instant ? 0 : 500;
      transformWrapperRef.current.setTransform(targetX, targetY, targetScale, duration);
      console.log(`✓ setTransform called with duration: ${duration}ms`);

      // Highlight element
      setHighlightedElement(targetElement._id);
      console.log('✓ Element highlighted');

      // Remove highlight after 3 seconds
      setTimeout(() => setHighlightedElement(null), 3000);
      console.log('=== InfiniteCanvas handleZoomToElement END ===');
    };

    console.log('InfiniteCanvas: Adding zoomToElement event listener');
    window.addEventListener('zoomToElement', handleZoomToElement);
    return () => {
      console.log('InfiniteCanvas: Removing zoomToElement event listener');
      window.removeEventListener('zoomToElement', handleZoomToElement);
    };
  }, [canvasElements]);

  // Handle share link URL parameters
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const elementId = params.get('element');

    if (elementId && canvasElements.length > 0 && transformWrapperRef.current) {
      const targetElement = canvasElements.find(el => el._id === elementId);
      if (targetElement && targetElement.position) {
        // Wait for canvas to be ready, then zoom to element
        setTimeout(() => {
          const targetScale = 0.375;

          // Calculate element center position
          const elementCenterX = targetElement.position.x + (targetElement.dimensions?.width || 0) / 2;
          const elementCenterY = targetElement.position.y + (targetElement.dimensions?.height || 0) / 2;

          // Calculate transform position to center the element
          let targetX = -elementCenterX * targetScale + (window.innerWidth / 2);
          let targetY = -elementCenterY * targetScale + (window.innerHeight / 2);

          // Shift view right and down
          const shiftRight = window.innerWidth * 0.25;  // 25% desno
          const shiftDown = window.innerHeight * 0.075; // 7.5% dole
          targetX -= shiftRight;
          targetY -= shiftDown;

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

  // If in post-view mode, render PostView instead of canvas
  if (viewMode === 'post-view') {
    const wrappers = canvasElements.filter(el => el.type === 'wrapper');
    return (
      <PostView
        wrappers={wrappers}
        allElements={canvasElements}
        currentWorkspace={{ _id: workspaceId }}
        onModeChange={onViewModeChange}
        canEditContent={canEditContent}
      />
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* View Mode Dropdown - always shown, but edit option only visible if user has edit permission */}
      <div className="absolute top-6 right-6 z-50">
        <ViewModeDropdown
          currentMode={viewMode}
          onModeChange={onViewModeChange}
          canEditContent={canEditContent}
        />
      </div>

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
          <TextFormattingDock currentWorkspaceId={workspaceId} />
        </div>
      )}

      <TransformWrapper
        ref={transformWrapperRef}
        initialScale={1}
        minScale={0.1}
        maxScale={5}
        limitToBounds={false}
        centerOnInit={true}
        initialPositionX={0}
        initialPositionY={0}
        panning={{
          disabled: isDraggingElement || (isHoveringElement && !isInEditMode) || isPanningDisabled,
          excluded: ['input', 'textarea', 'button', 'svg', 'path', 'a'],
          excludedClass: 'canvas-draggable-element'
        }}
        wheel={{ step: 0.1 }}
        doubleClick={{ disabled: true }}
        onTransformed={handleTransformChange}
        onPanningStart={handlePanningStart}
        onPanning={handleTransformChange}
        onPanningStop={handlePanningEnd}
        onZoom={handleZoom}
        disablePadding={true}
      >
        {({ zoomIn, zoomOut, resetTransform, state, ...rest }) => (
          <>
            <TransformComponent
              wrapperStyle={{
                width: '100%',
                height: '100%',
                overflow: 'hidden'
              }}
              contentStyle={{
                width: '100%',
                height: '100%',
                cursor: 'grab'
              }}
            >
              <div
                className="relative cursor-grab active:cursor-grabbing"
                style={{
                  width: `${canvasBounds.width}px`,
                  height: `${canvasBounds.height}px`,
                  minWidth: `${canvasBounds.width}px`,
                  minHeight: `${canvasBounds.height}px`,
                  backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
                  transform: `translate(${canvasBounds.left}px, ${canvasBounds.top}px)`
                }}
              >
                {/* Container for grid and elements with offset positioning */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    transform: `translate(${-canvasBounds.left}px, ${-canvasBounds.top}px)`
                  }}
                >
                  {/* Dynamic infinite grid */}
                  <DynamicGrid viewport={viewport} gridSize={50} />
                  <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragMove={handleDragMove}
                    onDragEnd={handleDragEnd}
                  >
                    {visibleElements.map((element) => (
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
                        onMouseEnter={handleElementMouseEnter}
                        onMouseLeave={handleElementMouseLeave}
                        allElements={canvasElements}
                        viewportScale={viewport.scale || 1}
                      />
                    ))}
                  </DndContext>
                  </div>
              </div>
          </TransformComponent>
        </>
        )}
      </TransformWrapper>

      <Minimap
        elements={canvasElements}
        canvasSize={{ width: canvasBounds.width, height: canvasBounds.height }}
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
