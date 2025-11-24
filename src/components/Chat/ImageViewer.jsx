import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Minimize2 } from 'lucide-react';

const ImageViewer = ({ imageUrl, imageName, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const rafRef = useRef(null);
  const lastPositionRef = useRef({ x: 0, y: 0 });

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent body scroll when viewer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleImageClick = () => {
    // Only zoom if user didn't drag
    if (!hasMoved) {
      if (!isZoomedIn) {
        // Zoom in - higher initial zoom
        setZoom(3);
        setIsZoomedIn(true);
      } else {
        // Zoom out and reset position
        setZoom(1);
        setPosition({ x: 0, y: 0 });
        setIsZoomedIn(false);
      }
    }
  };

  const handleMouseDown = (e) => {
    if (isZoomedIn && zoom > 1) {
      e.preventDefault();
      setIsDragging(true);
      setHasMoved(false); // Reset moved flag
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    } else {
      setHasMoved(false); // Reset for non-zoomed click
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && isZoomedIn) {
      setHasMoved(true); // Mark that user has moved

      // Store the new position
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Cancel any pending RAF
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      // Use RAF for smooth updates
      rafRef.current = requestAnimationFrame(() => {
        setPosition({ x: newX, y: newY });
        lastPositionRef.current = { x: newX, y: newY };
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // Cancel any pending RAF
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    // Keep hasMoved state for click handler
  };

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleSliderChange = (e) => {
    const newZoom = parseFloat(e.target.value);
    setZoom(newZoom);
    setIsZoomedIn(newZoom > 1);

    // Reset position when zooming out to 1x
    if (newZoom === 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 0.5, 5);
    setZoom(newZoom);
    setIsZoomedIn(true);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.5, 1);
    setZoom(newZoom);
    setIsZoomedIn(newZoom > 1);

    if (newZoom === 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setIsZoomedIn(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => {
        // Close when clicking backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10 w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/50 backdrop-blur-md">
          <div className="flex-1 min-w-0">
            <h3 className="text-white text-base font-medium truncate">
              {imageName || 'Image'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Container */}
        <div
          ref={containerRef}
          className="flex-1 flex items-center justify-center overflow-hidden p-4"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            ref={imageRef}
            className={`relative ${
              isZoomedIn && !isDragging ? 'cursor-zoom-out' : isZoomedIn ? 'cursor-grabbing' : 'cursor-zoom-in'
            }`}
            style={{
              transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.3s ease-out',
              willChange: isDragging ? 'transform' : 'auto'
            }}
            onClick={handleImageClick}
            onMouseDown={handleMouseDown}
          >
            <img
              src={imageUrl}
              alt={imageName || 'Image'}
              className="max-w-full max-h-[85vh] object-contain select-none"
              draggable={false}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 px-4 py-3 bg-black/50 backdrop-blur-md">
          {/* Zoom Out Button */}
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 1}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Zoom Slider */}
          <div className="flex items-center gap-2.5 min-w-[180px]">
            <span className="text-white/60 text-xs font-medium w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <input
              type="range"
              min="1"
              max="5"
              step="0.1"
              value={zoom}
              onChange={handleSliderChange}
              className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-3.5
                [&::-webkit-slider-thumb]:h-3.5
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-white
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:hover:bg-white/90
                [&::-webkit-slider-thumb]:transition-colors
                [&::-moz-range-thumb]:w-3.5
                [&::-moz-range-thumb]:h-3.5
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-white
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:cursor-pointer
                [&::-moz-range-thumb]:hover:bg-white/90
                [&::-moz-range-thumb]:transition-colors"
            />
          </div>

          {/* Zoom In Button */}
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 5}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Reset Zoom Button */}
          {zoom !== 1 && (
            <button
              onClick={handleResetZoom}
              className="ml-1.5 p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
              aria-label="Reset zoom"
              title="Reset to 100%"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageViewer;
