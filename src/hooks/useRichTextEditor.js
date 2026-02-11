import { useRef, useState, useCallback, useEffect } from 'react';

// Theme-aware color palette
export const textColors = [
  { name: 'red',    light: '#dc2626', dark: '#f87171', swatch: '#ef4444' },
  { name: 'orange', light: '#ea580c', dark: '#fb923c', swatch: '#f97316' },
  { name: 'yellow', light: '#ca8a04', dark: '#facc15', swatch: '#eab308' },
  { name: 'green',  light: '#16a34a', dark: '#4ade80', swatch: '#22c55e' },
  { name: 'blue',   light: '#2563eb', dark: '#60a5fa', swatch: '#3b82f6' },
  { name: 'purple', light: '#9333ea', dark: '#a78bfa', swatch: '#8b5cf6' },
  { name: 'pink',   light: '#db2777', dark: '#f472b6', swatch: '#ec4899' },
  { name: 'gray',   light: '#4b5563', dark: '#9ca3af', swatch: '#6b7280' },
];

// CSS for theme-aware text colors (used in both editor and view)
export const textColorStyles = textColors.map(c => `
  [data-text-color="${c.name}"] { color: ${c.light}; }
  .dark [data-text-color="${c.name}"] { color: ${c.dark}; }
`).join('');

const useRichTextEditor = ({ onUpdate, externalEditorRef } = {}) => {
  const internalEditorRef = useRef(null);
  const editorRef = externalEditorRef || internalEditorRef;
  const wrapperRef = useRef(null);
  const toolbarRef = useRef(null);
  const linkInputRef = useRef(null);
  const savedSelectionRef = useRef(null);
  const toolbarModeRef = useRef(null);

  // State
  const [selectionToolbar, setSelectionToolbar] = useState(null);
  const [toolbarMode, setToolbarMode] = useState(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [showPagePicker, setShowPagePicker] = useState(false);
  const [selectionHasLink, setSelectionHasLink] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Keep ref in sync with state
  useEffect(() => {
    toolbarModeRef.current = toolbarMode;
  }, [toolbarMode]);

  // Auto-focus link input
  useEffect(() => {
    if (toolbarMode === 'addLink') {
      requestAnimationFrame(() => {
        linkInputRef.current?.focus();
      });
    }
  }, [toolbarMode]);

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
  }, [editorRef]);

  // Find closest <a> ancestor
  const findAnchorInSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    let node = selection.anchorNode;
    while (node && node !== editorRef.current) {
      if (node.nodeName === 'A') return node;
      node = node.parentNode;
    }
    return null;
  }, [editorRef]);

  // Handle selection change — show/hide toolbar
  const handleSelectionChange = useCallback(() => {
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

    setSelectionHasLink(!!findAnchorInSelection());

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    const toolbarHeight = 40;
    const gap = 8;
    const topAbove = rect.top - toolbarHeight - gap;
    const topBelow = rect.bottom + gap;

    setSelectionToolbar({
      top: topAbove >= 60 ? topAbove : topBelow,
      left: rect.left + rect.width / 2,
    });
  }, [editorRef, findAnchorInSelection]);

  // Cancel toolbar
  const handleCancelToolbar = useCallback(() => {
    setSelectionToolbar(null);
    setToolbarMode(null);
    setLinkUrl('');
    setShowPagePicker(false);
    setShowColorPicker(false);
    savedSelectionRef.current = null;
  }, []);

  // Apply formatting command
  const applyFormat = useCallback((command) => {
    document.execCommand(command, false, null);
    onUpdate?.(editorRef.current.innerHTML);
  }, [onUpdate, editorRef]);

  // Apply text color
  const applyColor = useCallback((colorName) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    if (!selectedText.trim()) return;

    const span = document.createElement('span');
    span.setAttribute('data-text-color', colorName);
    span.textContent = selectedText;

    range.deleteContents();
    range.insertNode(span);

    range.setStartAfter(span);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    setShowColorPicker(false);
    onUpdate?.(editorRef.current.innerHTML);
  }, [onUpdate, editorRef]);

  // Remove text color
  const removeColor = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

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
  }, [onUpdate, editorRef]);

  // Apply link
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

    range.setStartAfter(anchor);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    savedSelectionRef.current = null;
    setSelectionToolbar(null);
    setToolbarMode(null);
    setLinkUrl('');
    setShowPagePicker(false);

    onUpdate?.(editorRef.current.innerHTML);
  }, [restoreSelection, onUpdate, editorRef]);

  // Remove link
  const handleRemoveLink = useCallback(() => {
    const anchor = findAnchorInSelection();
    if (!anchor || !editorRef.current) return;

    const fragment = document.createDocumentFragment();
    while (anchor.firstChild) {
      const child = anchor.firstChild;
      if (child.nodeType === Node.ELEMENT_NODE) {
        child.style.removeProperty('color');
        child.style.removeProperty('text-decoration');
        child.style.removeProperty('text-decoration-line');
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
  }, [findAnchorInSelection, onUpdate, editorRef]);

  // Link handlers
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

  const handleSelectPage = useCallback((page) => {
    applyLink(`/knowledge-base/${page.slug}`, { internal: true });
  }, [applyLink]);

  // Click-outside handler
  useEffect(() => {
    if (!selectionToolbar) return;

    const handleClickOutside = (e) => {
      if (toolbarRef.current?.contains(e.target)) return;
      if (editorRef.current?.contains(e.target)) return;
      if (toolbarModeRef.current) return;

      handleCancelToolbar();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectionToolbar, handleCancelToolbar, editorRef]);

  return {
    // Refs
    editorRef,
    wrapperRef,
    toolbarRef,
    linkInputRef,
    // State
    selectionToolbar,
    toolbarMode,
    linkUrl,
    setLinkUrl,
    showPagePicker,
    selectionHasLink,
    showColorPicker,
    setShowColorPicker,
    // Functions
    saveSelection,
    restoreSelection,
    handleSelectionChange,
    handleCancelToolbar,
    applyFormat,
    applyColor,
    removeColor,
    applyLink,
    handleRemoveLink,
    handleAddLinkClick,
    handleLinkPageClick,
    handleConfirmLink,
    handleSelectPage,
  };
};

export default useRichTextEditor;
