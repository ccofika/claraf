import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const Minimap = ({
  elements = [],
  canvasSize = { width: 100000, height: 100000 },
  viewport = { x: 0, y: 0, width: 0, height: 0, scale: 1 },
  onViewportChange
}) => {
  const minimapRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const { theme } = useTheme();

  // Minimap dimensions
  const MINIMAP_WIDTH = 150;
  const MINIMAP_HEIGHT = 112;
  const PADDING = 7;
  const ELEMENT_SCALE_FACTOR = 0.6; // Scale down elements to 60% of their actual size on minimap

  // Calculate bounds of all elements
  const getElementsBounds = () => {
    if (!elements || elements.length === 0) {
      // If no elements, show a centered region around the initial view
      const centerX = canvasSize.width / 2;
      const centerY = canvasSize.height / 2;
      const defaultSize = 10000;

      return {
        minX: centerX - defaultSize / 2,
        minY: centerY - defaultSize / 2,
        maxX: centerX + defaultSize / 2,
        maxY: centerY + defaultSize / 2,
        width: defaultSize,
        height: defaultSize
      };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    elements.forEach(element => {
      if (!element.position || !element.dimensions) return;

      const x = element.position.x || 0;
      const y = element.position.y || 0;
      const width = element.dimensions.width || 100;
      const height = element.dimensions.height || 50;

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });

    // Handle invalid bounds
    if (minX === Infinity || minY === Infinity || maxX === -Infinity || maxY === -Infinity) {
      const centerX = canvasSize.width / 2;
      const centerY = canvasSize.height / 2;
      const defaultSize = 10000;

      return {
        minX: centerX - defaultSize / 2,
        minY: centerY - defaultSize / 2,
        maxX: centerX + defaultSize / 2,
        maxY: centerY + defaultSize / 2,
        width: defaultSize,
        height: defaultSize
      };
    }

    // Add padding around elements
    const padding = 500;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(canvasSize.width, maxX + padding);
    maxY = Math.min(canvasSize.height, maxY + padding);

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  };

  const bounds = getElementsBounds();

  // Calculate scale factors based on bounds
  const scaleX = (MINIMAP_WIDTH - PADDING * 2) / bounds.width;
  const scaleY = (MINIMAP_HEIGHT - PADDING * 2) / bounds.height;
  const scale = Math.min(scaleX, scaleY);

  // Calculate offset to center content in minimap
  const contentWidth = bounds.width * scale;
  const contentHeight = bounds.height * scale;
  const offsetX = PADDING + (MINIMAP_WIDTH - PADDING * 2 - contentWidth) / 2;
  const offsetY = PADDING + (MINIMAP_HEIGHT - PADDING * 2 - contentHeight) / 2;

  // Convert canvas coordinates to minimap coordinates
  const toMinimapCoords = (canvasX, canvasY) => {
    return {
      x: offsetX + (canvasX - bounds.minX) * scale,
      y: offsetY + (canvasY - bounds.minY) * scale
    };
  };

  // Convert minimap coordinates to canvas coordinates
  const toCanvasCoords = (minimapX, minimapY) => {
    return {
      x: bounds.minX + (minimapX - offsetX) / scale,
      y: bounds.minY + (minimapY - offsetY) / scale
    };
  };

  // Calculate viewport rectangle in minimap coordinates
  const getViewportRect = () => {
    if (!viewport || viewport.scale <= 0) {
      return { x: PADDING, y: PADDING, width: 0, height: 0 };
    }

    const viewportWidth = viewport.width / viewport.scale;
    const viewportHeight = viewport.height / viewport.scale;

    // The viewport x,y represents the transform offset, so we need to convert it
    const canvasX = -viewport.x / viewport.scale;
    const canvasY = -viewport.y / viewport.scale;

    const topLeft = toMinimapCoords(canvasX, canvasY);
    const bottomRight = toMinimapCoords(
      Math.min(canvasX + viewportWidth, canvasSize.width),
      Math.min(canvasY + viewportHeight, canvasSize.height)
    );

    // Clamp to minimap bounds
    return {
      x: Math.max(PADDING, Math.min(topLeft.x, MINIMAP_WIDTH - PADDING)),
      y: Math.max(PADDING, Math.min(topLeft.y, MINIMAP_HEIGHT - PADDING)),
      width: Math.max(0, Math.min(bottomRight.x - topLeft.x, MINIMAP_WIDTH - PADDING * 2)),
      height: Math.max(0, Math.min(bottomRight.y - topLeft.y, MINIMAP_HEIGHT - PADDING * 2))
    };
  };

  const viewportRect = getViewportRect();

  // Handle minimap click/drag
  const handleMinimapInteraction = (e) => {
    if (!minimapRef.current) return;

    const rect = minimapRef.current.getBoundingClientRect();
    const minimapX = Math.max(0, Math.min(e.clientX - rect.left, MINIMAP_WIDTH));
    const minimapY = Math.max(0, Math.min(e.clientY - rect.top, MINIMAP_HEIGHT));

    const canvasCoords = toCanvasCoords(minimapX, minimapY);

    // Calculate new viewport position (center the clicked point)
    const viewportWidth = viewport.width / viewport.scale;
    const viewportHeight = viewport.height / viewport.scale;

    // Clamp to canvas bounds
    const clampedX = Math.max(0, Math.min(canvasCoords.x - viewportWidth / 2, canvasSize.width - viewportWidth));
    const clampedY = Math.max(0, Math.min(canvasCoords.y - viewportHeight / 2, canvasSize.height - viewportHeight));

    const newX = -clampedX * viewport.scale;
    const newY = -clampedY * viewport.scale;

    if (onViewportChange) {
      onViewportChange({ x: newX, y: newY, scale: viewport.scale });
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleMinimapInteraction(e);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      handleMinimapInteraction(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      const handleMove = (e) => handleMouseMove(e);
      const handleUp = () => handleMouseUp();

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);

  // Update viewport dimensions on window resize
  useEffect(() => {
    const handleResize = () => {
      if (viewport.width !== window.innerWidth || viewport.height !== window.innerHeight) {
        // Viewport dimensions are managed by InfiniteCanvas
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        ref={minimapRef}
        className={`
          relative rounded-xl
          bg-black/40 dark:bg-black/40 backdrop-blur-xl
          border border-white/10
          shadow-2xl
          cursor-pointer
          transition-all duration-300 ease-out
          hover:scale-105
        `}
        style={{
          width: `${MINIMAP_WIDTH}px`,
          height: `${MINIMAP_HEIGHT}px`
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Canvas elements */}
        <svg
          width={MINIMAP_WIDTH}
          height={MINIMAP_HEIGHT}
          className="absolute inset-0"
        >
          {/* Background area representing visible bounds */}
          <rect
            x={offsetX}
            y={offsetY}
            width={contentWidth}
            height={contentHeight}
            fill={theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}
            stroke={theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}
            strokeWidth="0.75"
            rx="3"
          />

          {/* Elements or Empty State */}
          {elements && elements.length > 0 ? (
            elements.map((element) => {
              const pos = toMinimapCoords(element.position.x, element.position.y);
              const width = (element.dimensions.width || 100) * scale * ELEMENT_SCALE_FACTOR;
              const height = (element.dimensions.height || 50) * scale * ELEMENT_SCALE_FACTOR;

              // Center the scaled element
              const centerOffsetX = ((element.dimensions.width || 100) * scale * (1 - ELEMENT_SCALE_FACTOR)) / 2;
              const centerOffsetY = ((element.dimensions.height || 50) * scale * (1 - ELEMENT_SCALE_FACTOR)) / 2;

              // Minimum size for visibility
              const minSize = 1.5;
              const displayWidth = Math.max(width, minSize);
              const displayHeight = Math.max(height, minSize);

              return (
                <rect
                  key={element._id}
                  x={pos.x + centerOffsetX}
                  y={pos.y + centerOffsetY}
                  width={displayWidth}
                  height={displayHeight}
                  fill={theme === 'dark' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.3)'}
                  stroke={theme === 'dark' ? 'rgba(59, 130, 246, 0.7)' : 'rgba(59, 130, 246, 0.6)'}
                  strokeWidth="0.75"
                  rx="1.5"
                />
              );
            })
          ) : (
            <>
              {/* Empty state - show a subtle center marker */}
              <circle
                cx={MINIMAP_WIDTH / 2}
                cy={MINIMAP_HEIGHT / 2}
                r="2"
                fill={theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
              />
              <circle
                cx={MINIMAP_WIDTH / 2}
                cy={MINIMAP_HEIGHT / 2}
                r="6"
                fill="none"
                stroke={theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}
                strokeWidth="0.75"
                strokeDasharray="1.5,1.5"
              />
            </>
          )}

          {/* Viewport indicator */}
          <rect
            x={Math.max(PADDING, Math.min(viewportRect.x, MINIMAP_WIDTH - PADDING))}
            y={Math.max(PADDING, Math.min(viewportRect.y, MINIMAP_HEIGHT - PADDING))}
            width={Math.min(viewportRect.width, MINIMAP_WIDTH - PADDING * 2)}
            height={Math.min(viewportRect.height, MINIMAP_HEIGHT - PADDING * 2)}
            fill="rgba(59, 130, 246, 0.15)"
            stroke="rgba(59, 130, 246, 0.7)"
            strokeWidth="1"
            rx="2"
            className="pointer-events-none"
          />
        </svg>

        {/* Label and Element Count */}
        <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between text-white/70 text-[9px] font-medium pointer-events-none">
          <span>Map</span>
          {elements && elements.length > 0 && (
            <span className="bg-white/10 px-1.5 py-0.5 rounded text-[8px]">
              {elements.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Minimap;
