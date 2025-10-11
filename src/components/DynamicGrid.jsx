import React, { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * DynamicGrid - Renders an infinite grid that expands dynamically based on viewport
 * Only renders grid lines visible in the current viewport for optimal performance
 */
const DynamicGrid = ({ viewport, gridSize = 50, style = {} }) => {
  const { theme } = useTheme();

  const gridLines = useMemo(() => {
    if (!viewport.scale) return { vertical: [], horizontal: [] };

    const scale = viewport.scale;

    // Calculate viewport bounds in canvas coordinates with extra padding for smooth scrolling
    const padding = 2000;
    const viewportLeft = (-viewport.x / scale) - padding;
    const viewportTop = (-viewport.y / scale) - padding;
    const viewportRight = viewportLeft + (viewport.width / scale) + (padding * 2);
    const viewportBottom = viewportTop + (viewport.height / scale) + (padding * 2);

    // Calculate which grid lines to draw
    const startX = Math.floor(viewportLeft / gridSize) * gridSize;
    const endX = Math.ceil(viewportRight / gridSize) * gridSize;
    const startY = Math.floor(viewportTop / gridSize) * gridSize;
    const endY = Math.ceil(viewportBottom / gridSize) * gridSize;

    const vertical = [];
    const horizontal = [];

    // Generate vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
      vertical.push({
        x1: x,
        y1: viewportTop,
        x2: x,
        y2: viewportBottom,
        key: `v-${x}`
      });
    }

    // Generate horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
      horizontal.push({
        x1: viewportLeft,
        y1: y,
        x2: viewportRight,
        y2: y,
        key: `h-${y}`
      });
    }

    return { vertical, horizontal };
  }, [viewport.x, viewport.y, viewport.width, viewport.height, viewport.scale, gridSize]);

  const strokeColor = theme === 'dark'
    ? 'rgba(255, 255, 255, 0.06)'
    : 'rgba(0, 0, 0, 0.06)';

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
        ...style
      }}
    >
      {/* Vertical lines */}
      {gridLines.vertical.map(line => (
        <line
          key={line.key}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={strokeColor}
          strokeWidth={1}
        />
      ))}

      {/* Horizontal lines */}
      {gridLines.horizontal.map(line => (
        <line
          key={line.key}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={strokeColor}
          strokeWidth={1}
        />
      ))}
    </svg>
  );
};

export default DynamicGrid;
