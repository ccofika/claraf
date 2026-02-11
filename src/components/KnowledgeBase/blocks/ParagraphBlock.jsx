import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { uploadKnowledgeBaseImage, generateImageId } from '../../../utils/imageUpload';
import { toast } from 'sonner';
import { X, Link, Unlink, FileText, Search, Check, Bold, Italic, Underline, Palette, RotateCcw } from 'lucide-react';
import { useKnowledgeBase } from '../../../context/KnowledgeBaseContext';

// Image Lightbox Component
const ImageLightbox = ({ src, alt, onClose }) => {
  useEffect(() => {
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

// Caption Input Modal for images
const CaptionModal = ({ onSave, onCancel, initialCaption = '' }) => {
  const [caption, setCaption] = useState(initialCaption);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSave(caption);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99998]"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-4 w-80"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Add Image Caption (optional)
        </h3>
        <input
          ref={inputRef}
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-neutral-700
            border border-gray-200 dark:border-neutral-600 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter caption..."
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-neutral-400
              hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            Skip
          </button>
          <button
            onClick={() => onSave(caption)}
            className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700
              rounded-lg transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Page Picker Modal for linking to KB pages
const PagePickerModal = ({ pageTree, onSelect, onCancel }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [onCancel]);

  const flattenTree = useCallback((tree, depth = 0) => {
    const result = [];
    if (!tree) return result;
    for (const page of tree) {
      result.push({ ...page, depth });
      if (page.children?.length) {
        result.push(...flattenTree(page.children, depth + 1));
      }
    }
    return result;
  }, []);

  const allPages = useMemo(() => flattenTree(pageTree), [pageTree, flattenTree]);

  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return allPages;
    const q = searchQuery.toLowerCase();
    return allPages.filter(p =>
      p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
    );
  }, [allPages, searchQuery]);

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99998]"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-[480px] max-h-[60vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-neutral-700">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pages..."
            className="flex-1 bg-transparent text-gray-900 dark:text-white
              placeholder-gray-400 focus:outline-none text-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {filteredPages.map((page) => (
            <button
              key={page._id}
              onClick={() => onSelect(page)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left
                hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <span className="text-base shrink-0" style={{ paddingLeft: page.depth * 16 }}>
                {page.icon || '\u{1F4C4}'}
              </span>
              <span className="text-sm text-gray-900 dark:text-white truncate">
                {page.title}
              </span>
              <span className="text-[11px] text-gray-400 ml-auto shrink-0">
                /{page.slug}
              </span>
            </button>
          ))}
          {filteredPages.length === 0 && (
            <div className="py-8 text-center text-gray-400 text-sm">
              No pages found
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-gray-100 dark:border-neutral-700 flex items-center justify-between">
          <span className="text-[11px] text-gray-400">
            {filteredPages.length} page{filteredPages.length !== 1 ? 's' : ''}
          </span>
          <span className="text-[11px] text-gray-400">
            <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-neutral-700 rounded text-[10px]">Esc</kbd> to cancel
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Theme-aware color palette: each color has light and dark variants
const textColors = [
  { name: 'red',    light: '#dc2626', dark: '#f87171', swatch: '#ef4444' },
  { name: 'orange', light: '#ea580c', dark: '#fb923c', swatch: '#f97316' },
  { name: 'yellow', light: '#ca8a04', dark: '#facc15', swatch: '#eab308' },
  { name: 'green',  light: '#16a34a', dark: '#4ade80', swatch: '#22c55e' },
  { name: 'blue',   light: '#2563eb', dark: '#60a5fa', swatch: '#3b82f6' },
  { name: 'purple', light: '#9333ea', dark: '#a78bfa', swatch: '#8b5cf6' },
  { name: 'pink',   light: '#db2777', dark: '#f472b6', swatch: '#ec4899' },
  { name: 'gray',   light: '#4b5563', dark: '#9ca3af', swatch: '#6b7280' },
];

// Generate CSS for theme-aware text colors (used in both editor and view)
const textColorStyles = textColors.map(c => `
  [data-text-color="${c.name}"] { color: ${c.light}; }
  .dark [data-text-color="${c.name}"] { color: ${c.dark}; }
`).join('');

const ParagraphBlock = ({ content, isEditing, onUpdate }) => {
  const { pageTree } = useKnowledgeBase();
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [pendingImage, setPendingImage] = useState(null); // For caption modal
  const savedSelectionRef = useRef(null); // Save selection before modal opens

  // Link toolbar state
  const [selectionToolbar, setSelectionToolbar] = useState(null); // { top, left } or null
  const [toolbarMode, setToolbarMode] = useState(null); // null | 'addLink'
  const [linkUrl, setLinkUrl] = useState('');
  const [showPagePicker, setShowPagePicker] = useState(false);
  const [selectionHasLink, setSelectionHasLink] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const toolbarRef = useRef(null);
  const linkInputRef = useRef(null);
  const wrapperRef = useRef(null);
  const toolbarModeRef = useRef(null); // ref mirror for reliable access in listeners

  // Initialize editor with HTML content
  useEffect(() => {
    if (editorRef.current && isEditing && editorRef.current.innerHTML !== (content || '')) {
      editorRef.current.innerHTML = content || '';
    }
  }, [isEditing]);

  // Update editor content when value changes externally
  useEffect(() => {
    if (editorRef.current && !isFocused && editorRef.current.innerHTML !== (content || '')) {
      editorRef.current.innerHTML = content || '';
    }
  }, [content, isFocused]);

  // Handle image upload
  const handleImageUpload = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return null;
    }

    try {
      const loadingToast = toast.loading('Uploading image...');
      const result = await uploadKnowledgeBaseImage(file);
      toast.dismiss(loadingToast);
      toast.success('Image uploaded!');
      return result;
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload image');
      return null;
    }
  }, []);

  // Save current selection
  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
    }
  }, []);

  // Restore saved selection
  const restoreSelection = useCallback(() => {
    if (savedSelectionRef.current && editorRef.current) {
      editorRef.current.focus();
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(savedSelectionRef.current);
      return true;
    }
    return false;
  }, []);

  // Insert image at cursor position
  const insertImageAtCursor = useCallback((imageData, caption = '') => {
    if (!editorRef.current) return;

    // Try to restore saved selection first
    if (!restoreSelection()) {
      // If no saved selection, try current selection
      const selection = window.getSelection();
      if (!selection.rangeCount) {
        // If still no selection, append to end
        editorRef.current.focus();
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    // Create line break before image
    const brBefore = document.createElement('br');
    range.insertNode(brBefore);
    range.setStartAfter(brBefore);

    // Create image container
    const imgContainer = document.createElement('span');
    imgContainer.className = 'kb-inline-image-container';
    imgContainer.style.cssText = 'display: block; position: relative; margin: 12px 0; text-align: center;';

    // Create image element
    const img = document.createElement('img');
    img.src = imageData.url;
    img.alt = caption || 'Uploaded image';
    img.className = 'kb-inline-image';
    img.style.cssText = `
      max-width: 100%;
      max-height: 400px;
      width: auto;
      height: auto;
      border-radius: 8px;
      cursor: pointer;
      object-fit: contain;
      border: 1px solid rgba(0,0,0,0.1);
    `;

    // Add data attributes
    const imageId = generateImageId();
    img.setAttribute('data-image-id', imageId);
    img.setAttribute('data-public-id', imageData.publicId || '');
    img.setAttribute('data-full-url', imageData.url);
    img.setAttribute('data-width', imageData.width || '');
    img.setAttribute('data-height', imageData.height || '');

    imgContainer.appendChild(img);

    // Add caption if provided
    if (caption) {
      const captionEl = document.createElement('p');
      captionEl.className = 'kb-image-caption';
      captionEl.textContent = caption;
      captionEl.style.cssText = `
        margin: 8px 0 0 0;
        font-size: 13px;
        color: #6b7280;
        font-style: italic;
        text-align: center;
      `;
      imgContainer.appendChild(captionEl);
    }

    range.insertNode(imgContainer);

    // Create line break after image
    const brAfter = document.createElement('br');
    imgContainer.parentNode.insertBefore(brAfter, imgContainer.nextSibling);

    // Move cursor after the line break
    range.setStartAfter(brAfter);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    // Clear saved selection
    savedSelectionRef.current = null;

    // Trigger onChange
    onUpdate?.(editorRef.current.innerHTML);
  }, [onUpdate, restoreSelection]);

  // Handle caption save
  const handleCaptionSave = useCallback((caption) => {
    if (pendingImage) {
      insertImageAtCursor(pendingImage, caption);
      setPendingImage(null);
    }
  }, [pendingImage, insertImageAtCursor]);

  // Handle caption cancel (insert without caption)
  const handleCaptionCancel = useCallback(() => {
    if (pendingImage) {
      insertImageAtCursor(pendingImage, '');
      setPendingImage(null);
    }
  }, [pendingImage, insertImageAtCursor]);

  // Handle paste
  const handlePaste = useCallback(async (e) => {
    const clipboardData = e.clipboardData || window.clipboardData;
    const items = clipboardData.items;

    let imageFile = null;

    // Check for images in clipboard
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        imageFile = items[i].getAsFile();
        break;
      }
    }

    if (imageFile) {
      e.preventDefault();
      // Save selection before async upload and modal
      saveSelection();
      const imageData = await handleImageUpload(imageFile);
      if (imageData) {
        // Show caption modal
        setPendingImage(imageData);
      }
    }
    // If no image, let default paste behavior handle text
  }, [handleImageUpload, saveSelection]);

  // Handle input change
  const handleInput = useCallback((e) => {
    onUpdate?.(e.target.innerHTML);
  }, [onUpdate]);

  // Handle click on images
  const handleClick = useCallback((e) => {
    const target = e.target;
    if (target.tagName === 'IMG' && target.classList.contains('kb-inline-image')) {
      e.preventDefault();
      const fullUrl = target.getAttribute('data-full-url') || target.src;
      setLightboxImage({ src: fullUrl, alt: target.alt });
    }
  }, []);

  // ── Link Toolbar Functions ──

  // Keep ref in sync with state for reliable access in event listeners
  useEffect(() => {
    toolbarModeRef.current = toolbarMode;
  }, [toolbarMode]);

  // Auto-focus link input when entering addLink mode
  useEffect(() => {
    if (toolbarMode === 'addLink') {
      // Small delay to ensure DOM is ready after render
      requestAnimationFrame(() => {
        linkInputRef.current?.focus();
      });
    }
  }, [toolbarMode]);

  const handleCancelToolbar = useCallback(() => {
    setSelectionToolbar(null);
    setToolbarMode(null);
    setLinkUrl('');
    setShowPagePicker(false);
    setShowColorPicker(false);
    savedSelectionRef.current = null;
  }, []);

  // Apply link to saved selection
  const applyLink = useCallback((href, options = {}) => {
    if (!restoreSelection()) return;

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    if (!selectedText.trim()) return;

    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.textContent = selectedText;

    if (options.external) {
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
    }
    if (options.internal) {
      anchor.setAttribute('data-kb-link', 'true');
    }

    range.deleteContents();
    range.insertNode(anchor);

    // Move cursor after the link
    range.setStartAfter(anchor);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    // Clear state
    savedSelectionRef.current = null;
    setSelectionToolbar(null);
    setToolbarMode(null);
    setLinkUrl('');
    setShowPagePicker(false);

    onUpdate?.(editorRef.current.innerHTML);
  }, [restoreSelection, onUpdate]);

  // Find the closest <a> ancestor of a node within the editor
  const findAnchorInSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    // Walk up from anchor node to find <a>
    let node = selection.anchorNode;
    while (node && node !== editorRef.current) {
      if (node.nodeName === 'A') return node;
      node = node.parentNode;
    }
    return null;
  }, []);

  // Show/hide toolbar on text selection
  const handleSelectionChange = useCallback(() => {
    // Don't recompute position if we're in a sub-mode (URL input or page picker)
    if (toolbarModeRef.current) return;

    const selection = window.getSelection();

    if (
      !selection ||
      selection.isCollapsed ||
      selection.rangeCount === 0 ||
      !editorRef.current?.contains(selection.anchorNode)
    ) {
      setSelectionToolbar(null);
      setSelectionHasLink(false);
      return;
    }

    // Check if selection is inside a link
    setSelectionHasLink(!!findAnchorInSelection());

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const wrapperRect = wrapperRef.current?.getBoundingClientRect();
    if (!wrapperRect) return;

    const toolbarHeight = 40;
    const gap = 8;
    const topAbove = rect.top - wrapperRect.top - toolbarHeight - gap;
    const topBelow = rect.bottom - wrapperRect.top + gap;

    setSelectionToolbar({
      top: topAbove >= 0 ? topAbove : topBelow,
      left: rect.left - wrapperRect.left + rect.width / 2,
    });
  }, [findAnchorInSelection]);

  const handleAddLinkClick = useCallback(() => {
    saveSelection();
    setToolbarMode('addLink');
    setLinkUrl('');
  }, [saveSelection]);

  const handleLinkPageClick = useCallback(() => {
    saveSelection();
    setToolbarMode('linkPage');
    setShowPagePicker(true);
  }, [saveSelection]);

  const handleConfirmLink = useCallback(() => {
    if (!linkUrl.trim()) return;
    let normalizedUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    applyLink(normalizedUrl, { external: true });
  }, [linkUrl, applyLink]);

  const handleRemoveLink = useCallback(() => {
    const anchor = findAnchorInSelection();
    if (!anchor || !editorRef.current) return;

    // Create a fragment from the anchor's children, stripping link styles
    const fragment = document.createDocumentFragment();
    while (anchor.firstChild) {
      const child = anchor.firstChild;
      // Clean link-like styles from element children
      if (child.nodeType === Node.ELEMENT_NODE) {
        child.style.removeProperty('color');
        child.style.removeProperty('text-decoration');
        child.style.removeProperty('text-decoration-line');
        // Also clean nested elements
        child.querySelectorAll('*').forEach(el => {
          el.style.removeProperty('color');
          el.style.removeProperty('text-decoration');
          el.style.removeProperty('text-decoration-line');
        });
      }
      fragment.appendChild(child);
    }
    anchor.parentNode.replaceChild(fragment, anchor);

    setSelectionToolbar(null);
    setSelectionHasLink(false);
    onUpdate?.(editorRef.current.innerHTML);
  }, [findAnchorInSelection, onUpdate]);

  // ── Text Formatting Functions ──

  const applyFormat = useCallback((command) => {
    document.execCommand(command, false, null);
    onUpdate?.(editorRef.current.innerHTML);
  }, [onUpdate]);

  const applyColor = useCallback((colorName) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    if (!selectedText.trim()) return;

    // Create colored span
    const span = document.createElement('span');
    span.setAttribute('data-text-color', colorName);
    span.textContent = selectedText;

    range.deleteContents();
    range.insertNode(span);

    // Move cursor after span
    range.setStartAfter(span);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    setShowColorPicker(false);
    onUpdate?.(editorRef.current.innerHTML);
  }, [onUpdate]);

  const removeColor = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    // Find a color span around the selection
    let node = selection.anchorNode;
    while (node && node !== editorRef.current) {
      if (node.nodeType === 1 && node.hasAttribute?.('data-text-color')) {
        const textNode = document.createTextNode(node.textContent);
        node.parentNode.replaceChild(textNode, node);
        setShowColorPicker(false);
        onUpdate?.(editorRef.current.innerHTML);
        return;
      }
      node = node.parentNode;
    }
    setShowColorPicker(false);
  }, [onUpdate]);

  const handleSelectPage = useCallback((page) => {
    applyLink(`/knowledge-base/${page.slug}`, { internal: true });
  }, [applyLink]);

  // Click-outside to dismiss toolbar
  useEffect(() => {
    if (!selectionToolbar) return;

    const handleClickOutside = (e) => {
      if (toolbarRef.current?.contains(e.target)) return;
      if (editorRef.current?.contains(e.target)) return;
      // Don't dismiss if in a sub-mode
      if (toolbarModeRef.current) return;

      handleCancelToolbar();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectionToolbar, handleCancelToolbar]);

  if (isEditing) {
    return (
      <>
        <div ref={wrapperRef} style={{ position: 'relative' }}>
          <div
            ref={editorRef}
            contentEditable
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onInput={handleInput}
            onPaste={handlePaste}
            onClick={handleClick}
            onMouseUp={handleSelectionChange}
            onKeyUp={handleSelectionChange}
            className="kb-paragraph-editor w-full p-3 text-[17px] leading-[1.7] text-gray-900 dark:text-white
              bg-transparent border border-gray-200 dark:border-neutral-700 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-24
              [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline"
            style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}
            data-placeholder="Write something... (Paste images with Ctrl+V)"
            suppressContentEditableWarning
          />

          {/* Floating Selection Toolbar */}
          {selectionToolbar && (
            <div
              ref={toolbarRef}
              className="absolute z-50 flex items-center gap-1 px-1.5 py-1
                bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700
                rounded-lg shadow-lg"
              style={{
                top: selectionToolbar.top,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <div style={{ pointerEvents: 'auto' }}>
              {toolbarMode === null && (
                <div
                  className="flex items-center gap-0.5"
                  onMouseDown={(e) => {
                    // Allow clicks on color picker swatches to work, prevent default only on buttons
                    if (e.target.tagName !== 'INPUT') e.preventDefault();
                  }}
                >
                  {/* Format buttons */}
                  <button
                    onMouseDown={(e) => { e.preventDefault(); applyFormat('bold'); }}
                    className="p-1.5 text-gray-700 dark:text-neutral-300 hover:bg-gray-100
                      dark:hover:bg-neutral-700 rounded transition-colors"
                    title="Bold"
                  >
                    <Bold size={14} />
                  </button>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); applyFormat('italic'); }}
                    className="p-1.5 text-gray-700 dark:text-neutral-300 hover:bg-gray-100
                      dark:hover:bg-neutral-700 rounded transition-colors"
                    title="Italic"
                  >
                    <Italic size={14} />
                  </button>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); applyFormat('underline'); }}
                    className="p-1.5 text-gray-700 dark:text-neutral-300 hover:bg-gray-100
                      dark:hover:bg-neutral-700 rounded transition-colors"
                    title="Underline"
                  >
                    <Underline size={14} />
                  </button>

                  {/* Color picker */}
                  <div className="relative">
                    <button
                      onMouseDown={(e) => { e.preventDefault(); setShowColorPicker(!showColorPicker); }}
                      className="p-1.5 text-gray-700 dark:text-neutral-300 hover:bg-gray-100
                        dark:hover:bg-neutral-700 rounded transition-colors"
                      title="Text color"
                    >
                      <Palette size={14} />
                    </button>
                    {showColorPicker && (
                      <div
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-3
                          bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700
                          rounded-xl shadow-xl z-[60]"
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <p className="text-[11px] font-medium text-gray-400 dark:text-neutral-500 uppercase tracking-wider mb-2">
                          Text color
                        </p>
                        <div className="grid grid-cols-4 gap-2.5 mb-3">
                          {textColors.map(c => (
                            <button
                              key={c.name}
                              onMouseDown={(e) => { e.preventDefault(); applyColor(c.name); }}
                              className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-neutral-600
                                hover:scale-125 hover:border-gray-400 dark:hover:border-neutral-400
                                transition-all duration-150 shadow-sm"
                              style={{ backgroundColor: c.swatch }}
                              title={c.name.charAt(0).toUpperCase() + c.name.slice(1)}
                            />
                          ))}
                        </div>
                        <button
                          onMouseDown={(e) => { e.preventDefault(); removeColor(); }}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-[12px]
                            text-gray-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-700
                            rounded-lg transition-colors border border-gray-200 dark:border-neutral-700"
                        >
                          <RotateCcw size={12} />
                          Reset color
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="w-px h-4 bg-gray-200 dark:bg-neutral-600 mx-0.5" />

                  {/* Link buttons */}
                  <button
                    onMouseDown={(e) => { e.preventDefault(); handleAddLinkClick(); }}
                    className="flex items-center gap-1 px-2 py-1 text-[12px] font-medium
                      text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700
                      rounded transition-colors whitespace-nowrap"
                  >
                    <Link size={13} />
                    Link
                  </button>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); handleLinkPageClick(); }}
                    className="flex items-center gap-1 px-2 py-1 text-[12px] font-medium
                      text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700
                      rounded transition-colors whitespace-nowrap"
                  >
                    <FileText size={13} />
                    Page
                  </button>
                  {selectionHasLink && (
                    <button
                      onMouseDown={(e) => { e.preventDefault(); handleRemoveLink(); }}
                      className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50
                        dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Remove link"
                    >
                      <Unlink size={13} />
                    </button>
                  )}
                </div>
              )}

              {toolbarMode === 'addLink' && (
                <div className="flex items-center gap-1.5">
                  <input
                    ref={linkInputRef}
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleConfirmLink(); }
                      if (e.key === 'Escape') { e.preventDefault(); handleCancelToolbar(); }
                    }}
                    placeholder="https://..."
                    className="w-52 px-2 py-1 text-[12px] bg-gray-50 dark:bg-neutral-700
                      border border-gray-200 dark:border-neutral-600 rounded
                      focus:outline-none focus:ring-1 focus:ring-blue-500
                      text-gray-900 dark:text-white"
                  />
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleConfirmLink}
                    className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                    title="Apply link"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleCancelToolbar}
                    className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded transition-colors"
                    title="Cancel"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              </div>
            </div>
          )}
        </div>

        {/* Page Picker Modal */}
        {showPagePicker && (
          <PagePickerModal
            pageTree={pageTree}
            onSelect={handleSelectPage}
            onCancel={handleCancelToolbar}
          />
        )}

        {/* Caption Modal */}
        {pendingImage && (
          <CaptionModal
            onSave={handleCaptionSave}
            onCancel={handleCaptionCancel}
          />
        )}

        {/* Lightbox */}
        {lightboxImage && (
          <ImageLightbox
            src={lightboxImage.src}
            alt={lightboxImage.alt}
            onClose={() => setLightboxImage(null)}
          />
        )}

        <style>{`
          .kb-paragraph-editor:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
          }
          ${textColorStyles}
        `}</style>
      </>
    );
  }

  // View mode
  if (!content) return null;

  // Check if content has HTML (images)
  const hasHtml = /<[^>]+>/.test(content);

  if (hasHtml) {
    // Render as HTML with click handler for images
    return (
      <>
        <div
          className="kb-paragraph-view prose prose-gray dark:prose-invert max-w-none
            text-[17px] leading-[1.7] text-gray-700 dark:text-neutral-300
            [&_p]:mb-4 [&_strong]:text-gray-900 [&_strong]:dark:text-white
            [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline
            [&_code]:text-[15px] [&_code]:bg-gray-100 [&_code]:dark:bg-neutral-800
            [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded"
          style={{ whiteSpace: 'pre-wrap' }}
          onClick={handleClick}
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {lightboxImage && (
          <ImageLightbox
            src={lightboxImage.src}
            alt={lightboxImage.alt}
            onClose={() => setLightboxImage(null)}
          />
        )}

        <style>{`
          .kb-paragraph-view .kb-image-caption {
            margin: 8px 0 0 0;
            font-size: 13px;
            color: #6b7280;
            font-style: italic;
            text-align: center;
          }
          ${textColorStyles}
        `}</style>
      </>
    );
  }

  // Preserve line breaks: convert single \n to Markdown hard break (two trailing spaces + \n)
  const preservedContent = content.replace(/\n/g, '  \n');

  // Render as Markdown
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none
      text-[17px] leading-[1.7] text-gray-700 dark:text-neutral-300
      [&_p]:mb-4 [&_strong]:text-gray-900 [&_strong]:dark:text-white
      [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline
      [&_code]:text-[15px] [&_code]:bg-gray-100 [&_code]:dark:bg-neutral-800
      [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {preservedContent}
      </ReactMarkdown>
    </div>
  );
};

export default ParagraphBlock;
