import React, { useRef, useEffect, useState } from 'react';
import { useTextFormatting } from '../context/TextFormattingContext';
import { uploadImageToCloudinary, generateImageId } from '../utils/imageUpload';
import { toast } from 'sonner';

const RichTextEditor = ({
  value = '',
  onChange,
  onBlur,
  onKeyDown,
  placeholder = 'Enter text...',
  className = '',
  multiline = false,
  style = {},
  autoFocus = false,
  workspaceId,
  onElementLinkClick,
  onImagePaste // Callback when image is pasted - receives image metadata
}) => {
  const editorRef = useRef(null);
  const { startEditing, stopEditing } = useTextFormatting();
  const [isFocused, setIsFocused] = useState(false);
  const previousFormattingRef = useRef({
    bold: false,
    italic: false,
    underline: false,
    hyperlink: '',
    elementLink: null,
    fontSize: 16
  });

  // Initialize editor with HTML content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        hyperlink: '',
        elementLink: null
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
    let elementLink = null;
    let foundLink = false; // Track if we found the closest link

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

      // Only get the FIRST (closest) link we encounter
      if (tagName === 'a' && !foundLink) {
        foundLink = true;
        const elementId = currentElement.getAttribute('data-element-id');
        const elementWorkspaceId = currentElement.getAttribute('data-workspace-id');
        if (elementId && elementWorkspaceId) {
          // This is an element link
          elementLink = {
            elementId,
            workspaceId: elementWorkspaceId,
            elementType: currentElement.getAttribute('data-element-type'),
            elementTitle: currentElement.getAttribute('data-element-title')
          };
        } else {
          // Regular hyperlink
          hyperlink = currentElement.getAttribute('href') || '';
        }
      }

      currentElement = currentElement.parentElement;
    }

    return { bold, italic, underline, hyperlink, elementLink };
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Check if clicking within formatting dock
    if (targetElement?.closest('.text-formatting-dock')) {
      // If clicking on an input or button within the dock, allow it
      if (targetElement.tagName === 'INPUT' || targetElement.tagName === 'BUTTON') {
        return;
      }
      editorRef.current?.focus();
      return;
    }

    // Check if clicking within a modal (Dialog component)
    if (targetElement?.closest('[role="dialog"]')) {
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

  const handlePaste = async (e) => {
    const clipboardData = e.clipboardData || window.clipboardData;
    const items = clipboardData.items;

    // Check if there are any images in the clipboard
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault(); // Prevent default paste for images

        const imageFile = items[i].getAsFile();
        if (imageFile) {
          await handleImagePaste(imageFile);
        }
        break; // Handle only the first image
      }
    }

    // If no image, let default paste behavior happen (for text, HTML, etc.)
  };

  const handleImagePaste = async (imageFile) => {
    try {
      // Show loading toast
      const loadingToast = toast.loading('Uploading image...');

      // Upload image to Cloudinary
      const imageData = await uploadImageToCloudinary(imageFile);

      // Dismiss loading toast
      toast.dismiss(loadingToast);
      toast.success('Image uploaded!');

      // Generate unique ID for this image
      const imageId = generateImageId();

      // Insert image at cursor position
      insertImageAtCursor(imageData, imageId);

      // Notify parent component about the new image
      if (onImagePaste) {
        onImagePaste({
          id: imageId,
          url: imageData.url,
          publicId: imageData.publicId,
          width: imageData.width,
          height: imageData.height,
          format: imageData.format,
          bytes: imageData.bytes
        });
      }
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

    // Create image element
    const img = document.createElement('img');
    img.src = imageData.url;
    img.alt = 'Pasted image';
    img.className = 'inline-image';
    img.style.maxWidth = '100%';
    img.style.width = 'auto';
    img.style.height = 'auto';
    img.style.display = 'block';
    img.style.margin = '8px 0';
    img.style.borderRadius = '4px';
    img.style.cursor = 'pointer';
    img.style.objectFit = 'contain';
    img.style.boxSizing = 'border-box';

    // Add data attributes for metadata
    img.setAttribute('data-image-id', imageId);
    img.setAttribute('data-public-id', imageData.publicId);
    img.setAttribute('data-width', imageData.width);
    img.setAttribute('data-height', imageData.height);
    img.setAttribute('data-format', imageData.format);
    img.setAttribute('data-bytes', imageData.bytes);

    // If cursor is in the middle of text, add line breaks
    const needsLineBreak = !range.collapsed || range.startContainer.nodeType === Node.TEXT_NODE;

    if (needsLineBreak) {
      // Add line break before image
      range.insertNode(document.createElement('br'));
    }

    // Insert image
    range.insertNode(img);

    // Add line break after image
    const brAfter = document.createElement('br');
    img.parentNode.insertBefore(brAfter, img.nextSibling);

    // Move cursor after the image
    range.setStartAfter(brAfter);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    // Trigger onChange with updated HTML
    onChange?.(editorRef.current.innerHTML);
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
            // Ensure it's not an element link
            link.removeAttribute('data-element-id');
            link.removeAttribute('data-workspace-id');
            link.removeAttribute('data-element-type');
            link.removeAttribute('data-element-title');
            link.classList.remove('element-link');
          });
        } else if (prevFormat.hyperlink) {
          // Remove link
          document.execCommand('unlink', false, null);
        }
      }

      // Element Link
      if (JSON.stringify(newFormatting.elementLink) !== JSON.stringify(prevFormat.elementLink)) {
        if (newFormatting.elementLink) {

          // Get fresh selection
          const currentSelection = window.getSelection();
          if (!currentSelection.rangeCount) {
            console.error('No selection range available');
            return;
          }
          const freshRange = currentSelection.getRangeAt(0);

          // Check if current selection already has a link (any type)
          const container = freshRange.commonAncestorContainer;
          const element = container.nodeType === 3 ? container.parentElement : container;
          let hasExistingLink = false;
          let checkElement = element;

          while (checkElement && checkElement !== editorRef.current) {
            if (checkElement.tagName === 'A') {
              hasExistingLink = true;
              break;
            }
            checkElement = checkElement.parentElement;
          }

          // Remove any existing link on the CURRENT selection only if it exists
          if (hasExistingLink) {
            document.execCommand('unlink', false, null);
          }

          // Get fresh range after any modifications
          if (!currentSelection.rangeCount) {
            console.error('No selection range available after unlink');
            return;
          }
          const finalRange = currentSelection.getRangeAt(0);

          // Create element link
          const selectedContent = finalRange.extractContents();

          const link = document.createElement('a');
          link.href = '#';
          link.className = 'element-link';
          link.style.color = '#10b981'; // Green color for element links
          link.style.textDecoration = 'underline';
          link.style.cursor = 'pointer';
          link.setAttribute('data-element-id', newFormatting.elementLink.elementId);
          link.setAttribute('data-workspace-id', newFormatting.elementLink.workspaceId);
          link.setAttribute('data-element-type', newFormatting.elementLink.elementType || '');
          link.setAttribute('data-element-title', newFormatting.elementLink.elementTitle || '');
          link.appendChild(selectedContent);
          finalRange.insertNode(link);


          // Restore selection on the link
          const newRange = document.createRange();
          newRange.selectNodeContents(link);
          currentSelection.removeAllRanges();
          currentSelection.addRange(newRange);
        } else if (prevFormat.elementLink) {
          // Remove element link - need to manually remove to clear styles
          const currentSelection = window.getSelection();
          if (currentSelection.rangeCount > 0) {
            const currentRange = currentSelection.getRangeAt(0);
            const container = currentRange.commonAncestorContainer;
            const element = container.nodeType === 3 ? container.parentElement : container;

            // Find the closest element link anchor
            let linkElement = element;
            while (linkElement && linkElement !== editorRef.current) {
              if (linkElement.tagName === 'A' && linkElement.getAttribute('data-element-id')) {
                break;
              }
              linkElement = linkElement.parentElement;
            }

            if (linkElement && linkElement.tagName === 'A') {
              // Extract text content without the link and its styles
              const textContent = linkElement.textContent;
              const textNode = document.createTextNode(textContent);
              linkElement.parentNode.replaceChild(textNode, linkElement);

              // Re-select the text
              const newRange = document.createRange();
              newRange.selectNodeContents(textNode);
              currentSelection.removeAllRanges();
              currentSelection.addRange(newRange);

            }
          }
        }
      }

      // Update previous formatting
      previousFormattingRef.current = { ...newFormatting, fontSize: newFontSize, elementLink: newFormatting.elementLink };

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
      onPaste={handlePaste}
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

        // Handle link clicks - find closest anchor element
        let target = e.target;

        // Walk up the DOM to find an anchor tag
        while (target && target !== editorRef.current) {
          if (target.tagName === 'A') {
            e.preventDefault();
            e.stopPropagation();

            // Check if it's an element link
            const elementId = target.getAttribute('data-element-id');
            const elementWorkspaceId = target.getAttribute('data-workspace-id');

            if (elementId && elementWorkspaceId) {
              // Element link - navigate only with Ctrl/Cmd + click
              if ((e.ctrlKey || e.metaKey) && onElementLinkClick) {
                onElementLinkClick({
                  elementId,
                  workspaceId: elementWorkspaceId,
                  elementType: target.getAttribute('data-element-type'),
                  elementTitle: target.getAttribute('data-element-title')
                });
              }
            } else {
              // Regular hyperlink - only open with Ctrl/Cmd
              if (e.ctrlKey || e.metaKey) {
                window.open(target.href, '_blank', 'noopener,noreferrer');
              }
            }
            break;
          }
          target = target.parentElement;
        }
      }}
    />
  );
};

export default RichTextEditor;
