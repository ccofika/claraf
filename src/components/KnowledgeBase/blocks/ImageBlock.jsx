import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Image as ImageIcon, ExternalLink, Upload, Clipboard, X } from 'lucide-react';
import { uploadKnowledgeBaseImage } from '../../../utils/imageUpload';
import { toast } from 'sonner';

// Image Lightbox Component
const ImageLightbox = ({ src, alt, onClose }) => {
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 cursor-pointer z-[99999]"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X className="w-6 h-6" />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-full object-contain rounded-lg cursor-default"
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
        Click outside or press ESC to close
      </div>
    </div>,
    document.body
  );
};

const ImageBlock = ({ block, content, isEditing, onUpdate }) => {
  const [error, setError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const dropZoneRef = useRef(null);

  // Content structure: { url: string, alt: string, caption: string, publicId?: string }
  const imageData = typeof content === 'object' && content !== null
    ? content
    : { url: content || '', alt: '', caption: '' };

  // Handle file upload
  const handleUpload = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setIsUploading(true);
    setError(false);

    try {
      const result = await uploadKnowledgeBaseImage(file);
      toast.success('Image uploaded successfully!');
      onUpdate?.({
        ...imageData,
        url: result.url,
        publicId: result.publicId,
        width: result.width,
        height: result.height
      });
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload image');
      setError(true);
    } finally {
      setIsUploading(false);
    }
  }, [imageData, onUpdate]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleUpload(files[0]);
    }
  }, [handleUpload]);

  // Paste from clipboard handler
  const handlePaste = useCallback(async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          await handleUpload(file);
        }
        break;
      }
    }
  }, [handleUpload]);

  // Handle paste button click
  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find(type => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], 'pasted-image.png', { type: imageType });
          await handleUpload(file);
          return;
        }
      }
      toast.error('No image found in clipboard');
    } catch (err) {
      // Fallback: listen for paste event
      toast.info('Press Ctrl+V to paste from clipboard');
    }
  }, [handleUpload]);

  // Remove image
  const handleRemoveImage = useCallback(() => {
    onUpdate?.({ url: '', alt: '', caption: '', publicId: '' });
  }, [onUpdate]);

  if (isEditing) {
    return (
      <div
        className="space-y-4 p-5 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg"
        onPaste={handlePaste}
      >
        {/* Upload Zone - only show when no image */}
        {!imageData.url && (
          <div
            ref={dropZoneRef}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed
              rounded-lg transition-all cursor-pointer
              ${isDragging
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-neutral-600 hover:border-blue-400 dark:hover:border-blue-500'
              }
              ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-500 dark:text-neutral-400">Uploading...</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-gray-100 dark:bg-neutral-800 rounded-full">
                    <Upload size={24} className="text-gray-400" />
                  </div>
                  <div className="p-3 bg-gray-100 dark:bg-neutral-800 rounded-full">
                    <Clipboard size={24} className="text-gray-400" />
                  </div>
                </div>

                <p className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                  Drag & drop an image here
                </p>
                <p className="text-xs text-gray-500 dark:text-neutral-400 mb-4">
                  or paste from clipboard (Ctrl+V)
                </p>

                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400
                    bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50
                    transition-colors"
                >
                  Paste from Clipboard
                </button>
              </>
            )}
          </div>
        )}

        {/* Image Preview */}
        {imageData.url && !error && (
          <div className="relative group">
            <img
              src={imageData.url}
              alt={imageData.alt || 'Preview'}
              className="max-h-64 rounded-lg object-contain mx-auto cursor-pointer"
              onError={() => setError(true)}
              onClick={() => setLightboxOpen(true)}
            />
            <button
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full
                opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              title="Remove image"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Caption Input - always show when there's an image */}
        {imageData.url && (
          <div>
            <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
              Caption (optional)
            </label>
            <input
              type="text"
              value={imageData.caption || ''}
              onChange={(e) => onUpdate?.({ ...imageData, caption: e.target.value })}
              className="w-full px-3 py-2 text-[14px] bg-white dark:bg-neutral-800
                border border-gray-200 dark:border-neutral-700 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add a caption for this image..."
            />
          </div>
        )}

        {error && (
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <span className="text-sm text-red-600 dark:text-red-400">Failed to load image</span>
          </div>
        )}

        {lightboxOpen && imageData.url && (
          <ImageLightbox
            src={imageData.url}
            alt={imageData.alt || 'Image'}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </div>
    );
  }

  // View mode
  if (!imageData.url) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-100 dark:bg-neutral-800 rounded-lg">
        <ImageIcon size={40} className="text-gray-300 dark:text-neutral-600" />
      </div>
    );
  }

  return (
    <figure>
      <div className="relative group">
        <img
          src={imageData.url}
          alt={imageData.alt || ''}
          className="max-w-full rounded-md mx-auto cursor-pointer hover:shadow-sm transition-shadow"
          onError={() => setError(true)}
          onClick={() => setLightboxOpen(true)}
        />
        {!error && (
          <a
            href={imageData.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-md
              opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>
      {imageData.caption && (
        <figcaption className="mt-2.5 text-center text-[13px] text-gray-400 dark:text-neutral-500">
          {imageData.caption}
        </figcaption>
      )}
      {error && (
        <div className="flex items-center justify-center h-40 bg-gray-100 dark:bg-neutral-800 rounded-lg">
          <span className="text-[14px] text-gray-500 dark:text-neutral-400">Failed to load image</span>
        </div>
      )}

      {lightboxOpen && (
        <ImageLightbox
          src={imageData.url}
          alt={imageData.alt || 'Image'}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </figure>
  );
};

export default ImageBlock;
