import React, { useRef, useEffect, useState, useCallback } from 'react';
import { uploadTicketImage, generateImageId } from '../utils/imageUpload';
import { toast } from 'sonner';
import { X, ZoomIn } from 'lucide-react';

// Image Lightbox Component for fullscreen view
const ImageLightbox = ({ src, alt, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
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
        className="max-w-full max-h-full object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

const TicketRichTextEditor = ({
  value = '',
  onChange,
  placeholder = 'Enter text...',
  className = '',
  rows = 3,
  disabled = false
}) => {
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Initialize editor with HTML content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, []);

  // Update editor content when value changes externally
  useEffect(() => {
    if (editorRef.current && !isFocused && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value, isFocused]);

  const handleInput = useCallback((e) => {
    const html = e.target.innerHTML;
    onChange?.(html);
  }, [onChange]);

  const handlePaste = async (e) => {
    const clipboardData = e.clipboardData || window.clipboardData;
    const items = clipboardData.items;

    let hasImage = false;
    let imageFile = null;
    let hasText = false;
    let textContent = '';
    let htmlContent = '';

    // Check clipboard items
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        hasImage = true;
        imageFile = items[i].getAsFile();
      } else if (items[i].type === 'text/html') {
        hasText = true;
        htmlContent = await new Promise(resolve => items[i].getAsString(resolve));
      } else if (items[i].type === 'text/plain') {
        if (!hasText) {
          textContent = await new Promise(resolve => items[i].getAsString(resolve));
        }
      }
    }

    // If we have both image and text, handle them together
    if (hasImage && imageFile) {
      e.preventDefault();

      // First insert any text content if present
      if (htmlContent || textContent) {
        const selection = window.getSelection();
        if (selection.rangeCount) {
          const range = selection.getRangeAt(0);
          range.deleteContents();

          if (htmlContent) {
            // Parse HTML and insert
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;
            const fragment = document.createDocumentFragment();
            while (tempDiv.firstChild) {
              fragment.appendChild(tempDiv.firstChild);
            }
            range.insertNode(fragment);
          } else if (textContent) {
            const textNode = document.createTextNode(textContent);
            range.insertNode(textNode);
          }

          // Move cursor to end
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }

      // Then upload and insert image
      await handleImagePaste(imageFile);
      return;
    }

    // If only image, handle it
    if (hasImage && imageFile) {
      e.preventDefault();
      await handleImagePaste(imageFile);
      return;
    }

    // For text only, let default paste behavior happen
  };

  const handleImagePaste = async (imageFile) => {
    try {
      const loadingToast = toast.loading('Uploading image...');

      const imageData = await uploadTicketImage(imageFile);

      toast.dismiss(loadingToast);
      toast.success('Image uploaded!');

      const imageId = generateImageId();
      insertImageAtCursor(imageData, imageId);
    } catch (error) {
      console.error('Error pasting image:', error);
      toast.error('Failed to upload image');
    }
  };

  const insertImageAtCursor = (imageData, imageId) => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    // Create image container for thumbnail display
    const imgContainer = document.createElement('span');
    imgContainer.className = 'inline-image-container';
    imgContainer.style.cssText = 'display: inline-block; position: relative; margin: 4px 2px; vertical-align: middle;';

    // Create image element with thumbnail styling
    const img = document.createElement('img');
    img.src = imageData.url;
    img.alt = 'Uploaded image';
    img.className = 'ticket-inline-image';
    img.style.cssText = `
      max-width: 120px;
      max-height: 80px;
      width: auto;
      height: auto;
      border-radius: 4px;
      cursor: pointer;
      object-fit: cover;
      border: 1px solid rgba(0,0,0,0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    `;

    // Add data attributes
    img.setAttribute('data-image-id', imageId);
    img.setAttribute('data-public-id', imageData.publicId);
    img.setAttribute('data-full-url', imageData.url);
    img.setAttribute('data-width', imageData.width);
    img.setAttribute('data-height', imageData.height);
    img.setAttribute('data-format', imageData.format);
    img.setAttribute('data-bytes', imageData.bytes);

    // Create zoom indicator
    const zoomIndicator = document.createElement('span');
    zoomIndicator.className = 'zoom-indicator';
    zoomIndicator.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6M8 11h6"/></svg>`;
    zoomIndicator.style.cssText = `
      position: absolute;
      bottom: 4px;
      right: 4px;
      background: rgba(0,0,0,0.6);
      color: white;
      padding: 2px;
      border-radius: 4px;
      opacity: 0;
      transition: opacity 0.2s;
      pointer-events: none;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    imgContainer.appendChild(img);
    imgContainer.appendChild(zoomIndicator);

    // Insert at cursor
    range.deleteContents();
    range.insertNode(imgContainer);

    // Add space after image
    const space = document.createTextNode(' ');
    imgContainer.parentNode.insertBefore(space, imgContainer.nextSibling);

    // Move cursor after the space
    range.setStartAfter(space);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    // Trigger onChange
    onChange?.(editorRef.current.innerHTML);
  };

  const handleClick = (e) => {
    const target = e.target;

    // Check if clicked on an image
    if (target.tagName === 'IMG' && target.classList.contains('ticket-inline-image')) {
      e.preventDefault();
      e.stopPropagation();
      const fullUrl = target.getAttribute('data-full-url') || target.src;
      setLightboxImage({ src: fullUrl, alt: target.alt });
    }
  };

  const handleKeyDown = (e) => {
    // Ctrl+Enter or Cmd+Enter to blur (save)
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      editorRef.current?.blur();
    }
  };

  return (
    <>
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onInput={handleInput}
        onPaste={handlePaste}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`ticket-rich-editor ${className}`}
        style={{
          minHeight: `${rows * 24}px`,
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word',
          cursor: disabled ? 'not-allowed' : 'text',
          opacity: disabled ? 0.6 : 1
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

      {lightboxImage && (
        <ImageLightbox
          src={lightboxImage.src}
          alt={lightboxImage.alt}
          onClose={() => setLightboxImage(null)}
        />
      )}

      <style>{`
        .ticket-rich-editor {
          position: relative;
        }
        .ticket-rich-editor:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        .ticket-rich-editor:focus {
          outline: none;
        }
        .ticket-rich-editor .inline-image-container:hover img {
          transform: scale(1.02);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .ticket-rich-editor .inline-image-container:hover .zoom-indicator {
          opacity: 1;
        }
        .ticket-rich-editor img.ticket-inline-image {
          vertical-align: middle;
        }
      `}</style>
    </>
  );
};

// Display component for viewing content with images (read-only)
export const TicketContentDisplay = ({ content, className = '' }) => {
  const [lightboxImage, setLightboxImage] = useState(null);
  const containerRef = useRef(null);

  const handleClick = (e) => {
    const target = e.target;
    if (target.tagName === 'IMG') {
      e.preventDefault();
      const fullUrl = target.getAttribute('data-full-url') || target.src;
      setLightboxImage({ src: fullUrl, alt: target.alt || 'Image' });
    }
  };

  // Process content to add proper image styling
  const processedContent = React.useMemo(() => {
    if (!content) return '';

    // Parse HTML and update image styles for display
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const images = doc.querySelectorAll('img');

    images.forEach(img => {
      img.style.cssText = `
        max-width: 100px;
        max-height: 70px;
        width: auto;
        height: auto;
        border-radius: 4px;
        cursor: pointer;
        object-fit: cover;
        border: 1px solid rgba(0,0,0,0.1);
        vertical-align: middle;
        margin: 2px 4px;
        transition: transform 0.2s, box-shadow 0.2s;
      `;
      img.classList.add('ticket-display-image');
    });

    return doc.body.innerHTML;
  }, [content]);

  return (
    <>
      <div
        ref={containerRef}
        className={`ticket-content-display ${className}`}
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />

      {lightboxImage && (
        <ImageLightbox
          src={lightboxImage.src}
          alt={lightboxImage.alt}
          onClose={() => setLightboxImage(null)}
        />
      )}

      <style>{`
        .ticket-content-display img.ticket-display-image:hover {
          transform: scale(1.05);
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
      `}</style>
    </>
  );
};

export default TicketRichTextEditor;
