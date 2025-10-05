import React, { useRef, useEffect, useState } from 'react';
import { useTextFormatting } from '../context/TextFormattingContext';

const RichTextEditor = ({
  value = '',
  onChange,
  onBlur,
  onKeyDown,
  placeholder = 'Enter text...',
  className = '',
  multiline = false,
  style = {},
  autoFocus = false
}) => {
  const editorRef = useRef(null);
  const { startEditing, stopEditing } = useTextFormatting();
  const [isFocused, setIsFocused] = useState(false);
  const previousFormattingRef = useRef({
    bold: false,
    italic: false,
    underline: false,
    hyperlink: '',
    fontSize: 16
  });

  // Initialize editor with HTML content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, []);

  // Auto focus
  useEffect(() => {
    if (autoFocus && editorRef.current) {
      editorRef.current.focus();
      // Move cursor to end without selecting all text
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false); // Collapse to end
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, [autoFocus]);

  // Get current selection formatting
  const getCurrentFormatting = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) {
      return {
        bold: false,
        italic: false,
        underline: false,
        hyperlink: ''
      };
    }

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const element = container.nodeType === 3 ? container.parentElement : container;

    let currentElement = element;
    let bold = false;
    let italic = false;
    let underline = false;
    let hyperlink = '';

    // Walk up the DOM tree to check for formatting
    while (currentElement && currentElement !== editorRef.current) {
      const tagName = currentElement.tagName?.toLowerCase();
      const computedStyle = window.getComputedStyle(currentElement);

      if (tagName === 'b' || tagName === 'strong' || computedStyle.fontWeight === 'bold' || parseInt(computedStyle.fontWeight) >= 700) {
        bold = true;
      }
      if (tagName === 'i' || tagName === 'em' || computedStyle.fontStyle === 'italic') {
        italic = true;
      }
      if (tagName === 'u' || computedStyle.textDecoration.includes('underline')) {
        underline = true;
      }
      if (tagName === 'a') {
        hyperlink = currentElement.getAttribute('href') || '';
      }

      currentElement = currentElement.parentElement;
    }

    return { bold, italic, underline, hyperlink };
  };

  // Update formatting context when selection changes
  const handleSelectionChange = () => {
    if (!isFocused || !editorRef.current) return;

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    // Check if selection is within our editor
    const range = selection.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) return;

    const formatting = getCurrentFormatting();
    const fontSize = parseInt(window.getComputedStyle(editorRef.current).fontSize) || 16;

    // Update previous formatting
    previousFormattingRef.current = {
      ...formatting,
      fontSize
    };
  };

  useEffect(() => {
    if (isFocused) {
      document.addEventListener('selectionchange', handleSelectionChange);
      return () => {
        document.removeEventListener('selectionchange', handleSelectionChange);
      };
    }
  }, [isFocused]);

  const handleFocus = () => {
    setIsFocused(true);

    // Get current formatting
    setTimeout(() => {
      const formatting = getCurrentFormatting();
      const fontSize = parseInt(window.getComputedStyle(editorRef.current).fontSize) || 16;

      previousFormattingRef.current = { ...formatting, fontSize };

      startEditing(formatting, fontSize, (newFormatting, newFontSize) => {
        applyFormatting(newFormatting, newFontSize);
      });
    }, 0);
  };

  const handleBlur = (e) => {
    // Don't blur if clicking on formatting toolbar, but allow focus on inputs
    const targetElement = e.relatedTarget;
    if (targetElement?.closest('.text-formatting-dock')) {
      // If clicking on an input or button within the dock, allow it
      if (targetElement.tagName === 'INPUT' || targetElement.tagName === 'BUTTON') {
        return;
      }
      editorRef.current?.focus();
      return;
    }

    setIsFocused(false);
    stopEditing();
    onBlur?.();
  };

  const handleInput = (e) => {
    const html = e.target.innerHTML;
    onChange?.(html);
  };

  const handleKeyDownInternal = (e) => {
    // Escape to cancel edit
    if (e.key === 'Escape') {
      stopEditing();
      editorRef.current?.blur();
      onKeyDown?.(e);
      return;
    }

    // Ctrl+Enter to confirm edit
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      editorRef.current?.blur();
      return;
    }

    // Regular Enter behavior for single-line inputs
    if (!multiline && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      editorRef.current?.blur();
      return;
    }

    onKeyDown?.(e);
  };

  const applyFormatting = (newFormatting, newFontSize) => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const prevFormat = previousFormattingRef.current;

    // If no text selected, just update the format state for next typing
    if (range.collapsed) {
      previousFormattingRef.current = { ...newFormatting, fontSize: newFontSize };
      return;
    }

    // Apply only the changes
    try {
      // Bold
      if (newFormatting.bold !== prevFormat.bold) {
        document.execCommand('bold', false, null);
      }

      // Italic
      if (newFormatting.italic !== prevFormat.italic) {
        document.execCommand('italic', false, null);
      }

      // Underline
      if (newFormatting.underline !== prevFormat.underline) {
        document.execCommand('underline', false, null);
      }

      // Font size
      if (newFontSize !== prevFormat.fontSize) {
        // Wrap selected content in span with font size
        const selectedContent = range.extractContents();
        const span = document.createElement('span');
        span.style.fontSize = `${newFontSize}px`;
        span.appendChild(selectedContent);
        range.insertNode(span);

        // Restore selection on the span
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }

      // Hyperlink
      if (newFormatting.hyperlink !== prevFormat.hyperlink) {
        if (newFormatting.hyperlink) {
          // Create link
          document.execCommand('createLink', false, newFormatting.hyperlink);

          // Set target and rel attributes
          const links = editorRef.current.querySelectorAll('a[href="' + newFormatting.hyperlink + '"]');
          links.forEach(link => {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
          });
        } else if (prevFormat.hyperlink) {
          // Remove link
          document.execCommand('unlink', false, null);
        }
      }

      // Update previous formatting
      previousFormattingRef.current = { ...newFormatting, fontSize: newFontSize };

      // Trigger change
      onChange?.(editorRef.current.innerHTML);
    } catch (error) {
      console.error('Error applying formatting:', error);
    }
  };

  return (
    <div
      ref={editorRef}
      contentEditable={true}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onInput={handleInput}
      onKeyDown={handleKeyDownInternal}
      className={`outline-none ${className}`}
      style={{
        minHeight: multiline ? '80px' : 'auto',
        whiteSpace: multiline ? 'pre-wrap' : 'nowrap',
        overflowWrap: 'break-word',
        cursor: 'text',
        userSelect: 'text',
        WebkitUserSelect: 'text',
        MozUserSelect: 'text',
        msUserSelect: 'text',
        pointerEvents: 'auto',
        ...style
      }}
      data-placeholder={placeholder}
      suppressContentEditableWarning
      onMouseDown={(e) => {
        // Allow text selection - don't prevent default
        e.stopPropagation();
      }}
      onClick={(e) => {
        // Handle link clicks - only open with Ctrl/Cmd
        if (e.target.tagName === 'A') {
          e.preventDefault();
          if (e.ctrlKey || e.metaKey) {
            window.open(e.target.href, '_blank', 'noopener,noreferrer');
          }
        }
      }}
    />
  );
};

export default RichTextEditor;
