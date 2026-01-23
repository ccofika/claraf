import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const ImageLightbox = ({ imageUrl, onClose }) => {
  // Close on Escape key - use capture phase to intercept before other handlers
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        onClose();
      }
    };

    // Use capture phase to intercept event before it reaches other handlers
    window.addEventListener('keydown', handleEscape, { capture: true });
    return () => window.removeEventListener('keydown', handleEscape, { capture: true });
  }, [onClose]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleBackdropClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const handleButtonClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  // Use portal to render at document body level, outside of any modal containers
  return createPortal(
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
      style={{ zIndex: 999999, pointerEvents: 'auto' }}
      onClick={handleBackdropClick}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={handleButtonClick}
        onMouseDown={(e) => e.stopPropagation()}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
        style={{ zIndex: 1000000, pointerEvents: 'auto' }}
      >
        <X className="w-6 h-6" />
      </button>

      {/* Image */}
      <img
        src={imageUrl}
        alt="Enlarged view"
        className="max-w-full max-h-full object-contain rounded-lg cursor-default"
        style={{ maxHeight: '90vh', pointerEvents: 'auto' }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        draggable={false}
      />

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full pointer-events-none select-none">
        Click outside or press ESC to close
      </div>
    </div>,
    document.body
  );
};

export default ImageLightbox;
