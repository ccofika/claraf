import React, { useRef, useEffect, useState, useCallback } from 'react';
import { uploadTicketImage, generateImageId } from '../utils/imageUpload';
import { toast } from 'sonner';
import { X, ZoomIn } from 'lucide-react';
import MacroTriggerDropdown from './MacroTriggerDropdown';

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
  disabled = false,
  enableMacros = false,
  onMacroSelect = null
}) => {
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [macroTrigger, setMacroTrigger] = useState({
    active: false,
    text: '',
    position: null
  });

  // Undo/Redo history with debouncing
  // History saves on: pause in typing (500ms), word boundaries (space/enter), paste, blur
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const isUndoRedoRef = useRef(false);
  const debounceTimerRef = useRef(null);
  const lastSavedContentRef = useRef('');
  const MAX_HISTORY = 50;
  const DEBOUNCE_DELAY = 500; // ms to wait before saving after typing stops

  // Save state to history (internal function)
  const saveToHistoryInternal = useCallback((html) => {
    if (isUndoRedoRef.current) {
      return;
    }

    // Don't save if it's the same as the last saved state
    if (html === lastSavedContentRef.current) {
      return;
    }

    const history = historyRef.current;
    const currentIndex = historyIndexRef.current;

    // Remove any redo states if we're not at the end
    if (currentIndex < history.length - 1) {
      history.splice(currentIndex + 1);
    }

    // Add new state
    history.push(html);
    lastSavedContentRef.current = html;

    // Limit history size
    if (history.length > MAX_HISTORY) {
      history.shift();
    }

    historyIndexRef.current = history.length - 1;
  }, []);

  // Debounced save - called on every input, but only saves after pause
  const saveToHistoryDebounced = useCallback((html) => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer - save after pause in typing
    debounceTimerRef.current = setTimeout(() => {
      saveToHistoryInternal(html);
    }, DEBOUNCE_DELAY);
  }, [saveToHistoryInternal]);

  // Immediate save - for boundaries like space, enter, paste
  const saveToHistoryImmediate = useCallback((html) => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    // Clear any pending debounced save
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    saveToHistoryInternal(html);
  }, [saveToHistoryInternal]);

  // Undo function
  const handleUndo = useCallback(() => {
    // First, save current state if there are unsaved changes
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      if (currentHtml !== lastSavedContentRef.current) {
        saveToHistoryInternal(currentHtml);
      }
    }

    const history = historyRef.current;
    const currentIndex = historyIndexRef.current;

    if (currentIndex > 0) {
      isUndoRedoRef.current = true;
      historyIndexRef.current = currentIndex - 1;
      const previousState = history[historyIndexRef.current];
      lastSavedContentRef.current = previousState;

      if (editorRef.current) {
        // Save cursor position
        const selection = window.getSelection();
        const hadSelection = selection.rangeCount > 0;

        editorRef.current.innerHTML = previousState;
        onChange?.(previousState);

        // Move cursor to end
        if (hadSelection) {
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }
  }, [onChange, saveToHistoryInternal]);

  // Redo function
  const handleRedo = useCallback(() => {
    const history = historyRef.current;
    const currentIndex = historyIndexRef.current;

    if (currentIndex < history.length - 1) {
      isUndoRedoRef.current = true;
      historyIndexRef.current = currentIndex + 1;
      const nextState = history[historyIndexRef.current];
      lastSavedContentRef.current = nextState;

      if (editorRef.current) {
        // Save cursor position
        const selection = window.getSelection();
        const hadSelection = selection.rangeCount > 0;

        editorRef.current.innerHTML = nextState;
        onChange?.(nextState);

        // Move cursor to end
        if (hadSelection) {
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }
  }, [onChange]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Initialize editor with HTML content and history
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
      // Initialize history with the initial value
      historyRef.current = [value || ''];
      historyIndexRef.current = 0;
    }
  }, []);

  // Update editor content when value changes externally
  useEffect(() => {
    if (editorRef.current && !isFocused && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value, isFocused]);

  // Get text content before cursor
  const getTextBeforeCursor = useCallback(() => {
    const selection = window.getSelection();
    if (!selection.rangeCount || !editorRef.current) return '';

    const range = selection.getRangeAt(0);

    // Create a range from start of editor to cursor
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editorRef.current);
    preCaretRange.setEnd(range.startContainer, range.startOffset);

    // Get text content
    return preCaretRange.toString();
  }, []);

  // Check for macro trigger (#)
  const checkMacroTrigger = useCallback(() => {
    if (!enableMacros) return;

    const textBeforeCursor = getTextBeforeCursor();

    // Match # followed by word characters (no space after #)
    const match = textBeforeCursor.match(/#(\w*)$/);

    if (match) {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const editorRect = editorRef.current.getBoundingClientRect();

        setMacroTrigger({
          active: true,
          text: match[1], // Text after #
          position: {
            top: rect.bottom - editorRect.top + 5,
            left: rect.left - editorRect.left
          }
        });
      }
    } else {
      if (macroTrigger.active) {
        setMacroTrigger({ active: false, text: '', position: null });
      }
    }
  }, [enableMacros, getTextBeforeCursor, macroTrigger.active]);

  // Handle macro selection - update DOM directly since useEffect won't run while focused
  const handleMacroSelection = useCallback((macro) => {
    if (!editorRef.current) return;

    // Get current HTML content
    let currentHtml = editorRef.current.innerHTML;

    // Find and remove the #text trigger from the HTML
    const textBeforeCursor = getTextBeforeCursor();
    const match = textBeforeCursor.match(/#(\w*)$/);

    if (match) {
      // Find the trigger text in the HTML and remove it
      const triggerText = match[0]; // e.g., "#test" or "#"
      const lastIndex = currentHtml.lastIndexOf(triggerText);
      if (lastIndex !== -1) {
        currentHtml = currentHtml.substring(0, lastIndex) + currentHtml.substring(lastIndex + triggerText.length);
      }
    }

    // Append macro content
    const newHtml = currentHtml + macro.feedback;

    // Update DOM directly - the useEffect won't update innerHTML while editor is focused
    editorRef.current.innerHTML = newHtml;

    // Also update parent state via onChange
    onChange?.(newHtml);

    // Close trigger dropdown
    setMacroTrigger({ active: false, text: '', position: null });

    // Notify parent if callback provided
    if (onMacroSelect) {
      onMacroSelect(macro);
    }
  }, [getTextBeforeCursor, onChange, onMacroSelect]);

  // Close macro trigger
  const closeMacroTrigger = useCallback(() => {
    setMacroTrigger({ active: false, text: '', position: null });
  }, []);

  const handleInput = useCallback((e) => {
    const html = e.target.innerHTML;
    onChange?.(html);

    // Save to history for undo/redo (debounced - saves after typing pause)
    saveToHistoryDebounced(html);

    // Check for macro trigger after input
    setTimeout(() => checkMacroTrigger(), 0);
  }, [onChange, checkMacroTrigger, saveToHistoryDebounced]);

  const handlePaste = async (e) => {
    // CRITICAL: Prevent default IMMEDIATELY before any async operations
    // Otherwise browser will perform default paste while we're collecting clipboard data
    e.preventDefault();

    // Save current state to history before paste (for proper undo)
    if (editorRef.current) {
      saveToHistoryImmediate(editorRef.current.innerHTML);
    }

    const clipboardData = e.clipboardData || window.clipboardData;
    const items = clipboardData.items;

    let imageFiles = [];
    let textContent = '';
    let htmlContent = '';

    // Collect all clipboard items
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      } else if (items[i].type === 'text/plain') {
        textContent = await new Promise(resolve => items[i].getAsString(resolve));
      } else if (items[i].type === 'text/html') {
        htmlContent = await new Promise(resolve => items[i].getAsString(resolve));
      }
    }

    // Normalize text: remove excessive line breaks but keep single line breaks
    const normalizeText = (text) => {
      if (!text) return '';
      // Replace multiple consecutive newlines with double newline (paragraph break)
      // Replace single \r\n or \r with \n
      return text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\n{3,}/g, '\n\n')  // Max 2 newlines in a row
        .trim();
    };

    // Extract images from HTML content (for when images are embedded in copied content)
    // Returns array of { type: 'file', file: File } or { type: 'url', url: string }
    const extractImagesFromHtml = async (html) => {
      if (!html) return [];
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const images = doc.querySelectorAll('img');
      const extractedImages = [];

      for (const img of images) {
        const src = img.src;
        if (src && src.startsWith('data:image')) {
          // Convert data URL to blob/file
          try {
            const response = await fetch(src);
            const blob = await response.blob();
            const file = new File([blob], 'pasted-image.png', { type: blob.type });
            extractedImages.push({ type: 'file', file });
          } catch (err) {
            console.error('Error converting data URL to file:', err);
          }
        } else if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
          // External URLs - try to fetch and convert to file, fallback to direct URL
          try {
            const response = await fetch(src);
            if (response.ok) {
              const blob = await response.blob();
              if (blob.type.startsWith('image/')) {
                const file = new File([blob], 'pasted-image.png', { type: blob.type });
                extractedImages.push({ type: 'file', file });
              } else {
                // Not an image blob, use URL directly
                extractedImages.push({ type: 'url', url: src });
              }
            } else {
              // Fetch failed, use URL directly
              extractedImages.push({ type: 'url', url: src });
            }
          } catch (err) {
            // CORS or other error - use URL directly as fallback
            console.log('Could not fetch external image, using URL directly:', src);
            extractedImages.push({ type: 'url', url: src });
          }
        }
      }

      return extractedImages;
    };

    // If we have direct image files from clipboard (e.g., screenshots)
    if (imageFiles.length > 0) {
      // First insert normalized plain text if present
      if (textContent) {
        const normalized = normalizeText(textContent);
        insertPlainText(normalized);
      }

      // Then upload and insert all images
      for (const imageFile of imageFiles) {
        await handleImagePaste(imageFile);
      }
      onChange?.(editorRef.current.innerHTML);
      return;
    }

    // Check for images embedded in HTML content
    if (htmlContent) {
      const embeddedImages = await extractImagesFromHtml(htmlContent);

      if (embeddedImages.length > 0) {
        // We have images in HTML - insert text first, then images
        if (textContent) {
          const normalized = normalizeText(textContent);
          insertPlainText(normalized);
        }

        for (const imgData of embeddedImages) {
          if (imgData.type === 'file') {
            await handleImagePaste(imgData.file);
          } else if (imgData.type === 'url') {
            // Insert external URL image directly
            insertExternalImage(imgData.url);
          }
        }
        onChange?.(editorRef.current.innerHTML);
        return;
      }
    }

    // For text only - insert as plain text (no styles, no formatting)
    if (textContent) {
      const normalized = normalizeText(textContent);
      insertPlainText(normalized);
      onChange?.(editorRef.current.innerHTML);
    }
  };

  // URL regex pattern for detecting links
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi;

  // Create a clickable link element
  const createLinkElement = (url) => {
    const link = document.createElement('a');
    link.href = url;
    link.textContent = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'editor-link';
    link.style.cssText = 'color: #2563eb; text-decoration: underline; cursor: pointer;';
    return link;
  };

  // Parse text and create elements with links converted
  const parseTextWithLinks = (text) => {
    const fragment = document.createDocumentFragment();
    const parts = text.split(urlRegex);

    parts.forEach(part => {
      if (!part) return;

      if (urlRegex.test(part)) {
        // Reset regex lastIndex since we're using 'g' flag
        urlRegex.lastIndex = 0;
        fragment.appendChild(createLinkElement(part));
      } else {
        fragment.appendChild(document.createTextNode(part));
      }
    });

    return fragment;
  };

  const insertPlainText = (text) => {
    if (!text || !editorRef.current) return;

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();

    // Split text by newlines and insert with proper line breaks
    const lines = text.split('\n');
    const fragment = document.createDocumentFragment();

    lines.forEach((line, index) => {
      if (index > 0) {
        // Add line break before each line except the first
        fragment.appendChild(document.createElement('br'));
      }
      if (line) {
        // Parse line for links and create appropriate elements
        const lineFragment = parseTextWithLinks(line);
        fragment.appendChild(lineFragment);
      }
    });

    range.insertNode(fragment);

    // Move cursor to end
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
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

  // Insert external image URL directly (for images that can't be uploaded due to CORS)
  const insertExternalImage = (url) => {
    if (!editorRef.current || !url) return;

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    // Create image container for thumbnail display
    const imgContainer = document.createElement('span');
    imgContainer.className = 'inline-image-container';
    imgContainer.style.cssText = 'display: inline-block; position: relative; margin: 4px 2px; vertical-align: middle;';

    // Create image element with thumbnail styling
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'External image';
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

    // Add data attributes for lightbox
    img.setAttribute('data-full-url', url);
    img.setAttribute('data-external', 'true');

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
  };

  const handleClick = (e) => {
    const target = e.target;

    // Check if clicked on a link
    if (target.tagName === 'A' && target.href) {
      e.preventDefault();
      e.stopPropagation();
      window.open(target.href, '_blank', 'noopener,noreferrer');
      return;
    }

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
      return;
    }

    // Ctrl+Z for undo
    if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
      e.preventDefault();
      handleUndo();
      return;
    }

    // Ctrl+Shift+Z or Ctrl+Y for redo
    if ((e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) ||
        (e.key === 'y' && (e.ctrlKey || e.metaKey))) {
      e.preventDefault();
      handleRedo();
      return;
    }

    // Save to history immediately on word/line boundaries (space, enter)
    // This creates natural undo points at word and line boundaries
    if (e.key === ' ' || e.key === 'Enter') {
      if (editorRef.current) {
        saveToHistoryImmediate(editorRef.current.innerHTML);
      }
    }
  };

  return (
    <>
      <div style={{ position: 'relative' }}>
        <div
          ref={editorRef}
          contentEditable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            // Save any pending changes to history on blur
            if (editorRef.current) {
              saveToHistoryImmediate(editorRef.current.innerHTML);
            }
            // Delay closing macro trigger to allow click on dropdown
            setTimeout(() => {
              if (!document.activeElement?.closest('.macro-trigger-dropdown')) {
                closeMacroTrigger();
              }
            }, 150);
          }}
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
            opacity: disabled ? 0.6 : 1,
            color: 'inherit'
          }}
          data-placeholder={placeholder}
          suppressContentEditableWarning
        />

        {/* Macro Trigger Dropdown */}
        {enableMacros && macroTrigger.active && macroTrigger.position && (
          <MacroTriggerDropdown
            triggerText={macroTrigger.text}
            position={macroTrigger.position}
            onSelect={handleMacroSelection}
            onClose={closeMacroTrigger}
            editorRef={editorRef}
          />
        )}
      </div>

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
          color: inherit;
        }
        .ticket-rich-editor * {
          color: inherit;
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
        .ticket-rich-editor a,
        .ticket-rich-editor a.editor-link {
          color: #2563eb !important;
          text-decoration: underline !important;
          cursor: pointer;
        }
        .ticket-rich-editor a:hover {
          color: #1d4ed8 !important;
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

    // Handle link clicks
    if (target.tagName === 'A' && target.href) {
      e.preventDefault();
      e.stopPropagation();
      window.open(target.href, '_blank', 'noopener,noreferrer');
      return;
    }

    // Handle image clicks
    if (target.tagName === 'IMG') {
      e.preventDefault();
      const fullUrl = target.getAttribute('data-full-url') || target.src;
      setLightboxImage({ src: fullUrl, alt: target.alt || 'Image' });
    }
  };

  // Process content to add proper image and link styling
  const processedContent = React.useMemo(() => {
    if (!content) return '';

    // Parse HTML and update styles for display
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');

    // Style images
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

    // Style links
    const links = doc.querySelectorAll('a');
    links.forEach(link => {
      link.style.cssText = 'color: #2563eb; text-decoration: underline; cursor: pointer;';
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
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
        .ticket-content-display a {
          color: #2563eb !important;
          text-decoration: underline !important;
          cursor: pointer;
        }
        .ticket-content-display a:hover {
          color: #1d4ed8 !important;
        }
      `}</style>
    </>
  );
};

export default TicketRichTextEditor;
