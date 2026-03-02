import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, Quote,
  List, ListOrdered, Indent, Outdent,
  Link, ImagePlus, RemoveFormatting, Smile,
  Highlighter, ChevronDown, X, Check
} from 'lucide-react';
import EmojiPicker from './Chat/EmojiPicker';

// Preset text colors
const TEXT_COLORS = [
  { color: '#000000', label: 'Black' },
  { color: '#dc2626', label: 'Red' },
  { color: '#ea580c', label: 'Orange' },
  { color: '#ca8a04', label: 'Yellow' },
  { color: '#16a34a', label: 'Green' },
  { color: '#2563eb', label: 'Blue' },
  { color: '#9333ea', label: 'Purple' },
  { color: '#db2777', label: 'Pink' },
  { color: '#6b7280', label: 'Gray' },
];

// Preset highlight colors
const HIGHLIGHT_COLORS = [
  { color: '#fef08a', label: 'Yellow' },
  { color: '#bbf7d0', label: 'Green' },
  { color: '#bfdbfe', label: 'Blue' },
  { color: '#ddd6fe', label: 'Purple' },
  { color: '#fecaca', label: 'Red' },
  { color: '#fed7aa', label: 'Orange' },
  { color: '#e5e7eb', label: 'Gray' },
];

// Heading options
const HEADING_OPTIONS = [
  { value: 'div', label: 'Normal' },
  { value: 'h1', label: 'Heading 1' },
  { value: 'h2', label: 'Heading 2' },
  { value: 'h3', label: 'Heading 3' },
];

const ToolbarButton = ({ icon: Icon, label, active, onClick, className = '' }) => (
  <button
    type="button"
    title={label}
    onMouseDown={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }}
    className={`p-1.5 rounded transition-colors cursor-pointer ${
      active
        ? 'bg-gray-200 dark:bg-neutral-700 text-gray-900 dark:text-white'
        : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white'
    } ${className}`}
  >
    <Icon className="w-4 h-4" />
  </button>
);

const ToolbarDivider = () => (
  <div className="w-px h-5 bg-gray-200 dark:bg-neutral-700 mx-0.5" />
);

const TicketEditorToolbar = ({
  editorRef,
  activeFormats,
  onExecCommand,
  onImageUpload,
  savedSelectionRef,
  disabled
}) => {
  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const headingRef = useRef(null);
  const emojiRef = useRef(null);
  const textColorRef = useRef(null);
  const highlightRef = useRef(null);
  const linkRef = useRef(null);
  const fileInputRef = useRef(null);
  const linkInputRef = useRef(null);

  // Close all popovers
  const closeAllPopovers = useCallback(() => {
    setShowHeadingDropdown(false);
    setShowEmojiPicker(false);
    setShowTextColorPicker(false);
    setShowHighlightPicker(false);
    setShowLinkPopover(false);
  }, []);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.closest('.ticket-editor-toolbar')) return;
      closeAllPopovers();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeAllPopovers]);

  // Get current heading label
  const getHeadingLabel = () => {
    const block = activeFormats.formatBlock?.toLowerCase() || '';
    if (block === 'h1') return 'H1';
    if (block === 'h2') return 'H2';
    if (block === 'h3') return 'H3';
    return 'Normal';
  };

  // Save selection before opening link popover
  const handleLinkButtonClick = () => {
    // Save current selection
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
    }

    // Check if cursor is inside a link - pre-populate URL
    if (activeFormats.isLink && activeFormats.linkUrl) {
      setLinkUrl(activeFormats.linkUrl);
    } else {
      setLinkUrl('');
    }

    closeAllPopovers();
    setShowLinkPopover(true);
    setTimeout(() => linkInputRef.current?.focus(), 50);
  };

  // Apply link
  const handleLinkApply = () => {
    const url = linkUrl.trim();
    if (!url) {
      // Remove link if URL is empty - strip all link styling
      if (activeFormats.isLink) {
        restoreSelectionAndExec(() => {
          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const container = range.commonAncestorContainer;
            let el = container.nodeType === 3 ? container.parentElement : container;
            while (el && el !== editorRef.current) {
              if (el.tagName === 'A') {
                const text = el.textContent;
                const textNode = document.createTextNode(text);
                el.parentNode.replaceChild(textNode, el);
                const newRange = document.createRange();
                newRange.selectNodeContents(textNode);
                selection.removeAllRanges();
                selection.addRange(newRange);
                break;
              }
              el = el.parentElement;
            }
          }
        });
      }
    } else {
      // Normalize URL
      const normalizedUrl = url.match(/^https?:\/\//) ? url : `https://${url}`;
      restoreSelectionAndExec(() => {
        document.execCommand('createLink', false, normalizedUrl);
        // Set target and rel on the new link
        if (editorRef.current) {
          const links = editorRef.current.querySelectorAll(`a[href="${normalizedUrl}"]`);
          links.forEach(link => {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.style.cssText = 'color: #2563eb; text-decoration: underline; cursor: pointer;';
          });
        }
      });
    }
    setShowLinkPopover(false);
    setLinkUrl('');
  };

  // Restore selection and execute a formatting action
  const restoreSelectionAndExec = (action) => {
    if (editorRef.current) {
      editorRef.current.focus();
      if (savedSelectionRef.current) {
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(savedSelectionRef.current);
      }
      action();
      onExecCommand();
    }
  };

  // Handle emoji select
  const handleEmojiSelect = (emoji) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertText', false, emoji);
      onExecCommand();
    }
    setShowEmojiPicker(false);
  };

  // Handle heading select
  const handleHeadingSelect = (value) => {
    onExecCommand('formatBlock', value);
    setShowHeadingDropdown(false);
  };

  // Handle text color select
  const handleTextColorSelect = (color) => {
    if (color === 'reset') {
      // Remove text color by applying default
      onExecCommand('removeFormat');
    } else {
      onExecCommand('foreColor', color);
    }
    setShowTextColorPicker(false);
  };

  // Handle highlight color select
  const handleHighlightSelect = (color) => {
    if (color === 'remove') {
      onExecCommand('backColor', 'transparent');
    } else {
      onExecCommand('backColor', color);
    }
    setShowHighlightPicker(false);
  };

  // Handle image file selection
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await onImageUpload(file);
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (disabled) return null;

  return (
    <div className="ticket-editor-toolbar flex items-center flex-wrap gap-0.5 px-2 py-1.5 border-b border-gray-200 dark:border-neutral-700 bg-gray-50/50 dark:bg-neutral-800/50">
      {/* Heading Dropdown */}
      <div className="relative" ref={headingRef}>
        <button
          type="button"
          title="Text style"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            closeAllPopovers();
            setShowHeadingDropdown(!showHeadingDropdown);
          }}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white min-w-[70px]"
        >
          <span>{getHeadingLabel()}</span>
          <ChevronDown className="w-3 h-3" />
        </button>

        {showHeadingDropdown && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg py-1 min-w-[140px]">
            {HEADING_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleHeadingSelect(option.value);
                }}
                className={`w-full text-left px-3 py-1.5 text-sm transition-colors cursor-pointer ${
                  (activeFormats.formatBlock?.toLowerCase() || 'div') === option.value
                    ? 'bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white font-medium'
                    : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800'
                }`}
                style={{
                  fontSize: option.value === 'h1' ? '1.25em' : option.value === 'h2' ? '1.1em' : option.value === 'h3' ? '1em' : '0.875rem',
                  fontWeight: option.value.startsWith('h') ? '600' : '400'
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <ToolbarDivider />

      {/* Emoji */}
      <div className="relative" ref={emojiRef}>
        <ToolbarButton
          icon={Smile}
          label="Insert emoji"
          onClick={() => {
            closeAllPopovers();
            setShowEmojiPicker(!showEmojiPicker);
          }}
        />
        {showEmojiPicker && (
          <div className="absolute top-full left-0 mt-1 z-50">
            <EmojiPicker
              onSelectEmoji={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
            />
          </div>
        )}
      </div>

      {/* Bold, Italic, Underline, Strikethrough */}
      <ToolbarButton icon={Bold} label="Bold (Ctrl+B)" active={activeFormats.bold} onClick={() => onExecCommand('bold')} />
      <ToolbarButton icon={Italic} label="Italic (Ctrl+I)" active={activeFormats.italic} onClick={() => onExecCommand('italic')} />
      <ToolbarButton icon={Underline} label="Underline (Ctrl+U)" active={activeFormats.underline} onClick={() => onExecCommand('underline')} />
      <ToolbarButton icon={Strikethrough} label="Strikethrough (Ctrl+Shift+X)" active={activeFormats.strikethrough} onClick={() => onExecCommand('strikeThrough')} />

      <ToolbarDivider />

      {/* Blockquote */}
      <ToolbarButton
        icon={Quote}
        label="Block quote"
        active={activeFormats.formatBlock?.toLowerCase() === 'blockquote'}
        onClick={() => {
          if (activeFormats.formatBlock?.toLowerCase() === 'blockquote') {
            onExecCommand('formatBlock', 'div');
          } else {
            onExecCommand('formatBlock', 'blockquote');
          }
        }}
      />

      <ToolbarDivider />

      {/* Text Color */}
      <div className="relative" ref={textColorRef}>
        <button
          type="button"
          title="Text color"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            closeAllPopovers();
            setShowTextColorPicker(!showTextColorPicker);
          }}
          className="p-1.5 rounded transition-colors cursor-pointer text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white"
        >
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold leading-none" style={{ color: activeFormats.foreColor && activeFormats.foreColor !== 'rgb(0, 0, 0)' ? activeFormats.foreColor : undefined }}>A</span>
            <div className="w-4 h-0.5 mt-0.5 rounded-full" style={{ backgroundColor: activeFormats.foreColor && activeFormats.foreColor !== 'rgb(0, 0, 0)' ? activeFormats.foreColor : '#6b7280' }} />
          </div>
        </button>

        {showTextColorPicker && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg p-2 min-w-[180px]">
            <div className="text-xs text-gray-500 dark:text-neutral-400 mb-1.5 px-1">Text Color</div>
            <div className="grid grid-cols-5 gap-1">
              {TEXT_COLORS.map(({ color, label }) => (
                <button
                  key={color}
                  type="button"
                  title={label}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleTextColorSelect(color);
                  }}
                  className="w-7 h-7 rounded border border-gray-200 dark:border-neutral-600 hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: color }}
                />
              ))}
              <button
                type="button"
                title="Reset color"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleTextColorSelect('reset');
                }}
                className="w-7 h-7 rounded border border-gray-200 dark:border-neutral-600 hover:scale-110 transition-transform cursor-pointer flex items-center justify-center bg-white dark:bg-neutral-800"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Highlight Color */}
      <div className="relative" ref={highlightRef}>
        <button
          type="button"
          title="Highlight color"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            closeAllPopovers();
            setShowHighlightPicker(!showHighlightPicker);
          }}
          className="p-1.5 rounded transition-colors cursor-pointer text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white"
        >
          <Highlighter className="w-4 h-4" />
        </button>

        {showHighlightPicker && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg p-2 min-w-[180px]">
            <div className="text-xs text-gray-500 dark:text-neutral-400 mb-1.5 px-1">Highlight Color</div>
            <div className="grid grid-cols-4 gap-1">
              {HIGHLIGHT_COLORS.map(({ color, label }) => (
                <button
                  key={color}
                  type="button"
                  title={label}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleHighlightSelect(color);
                  }}
                  className="w-7 h-7 rounded border border-gray-200 dark:border-neutral-600 hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: color }}
                />
              ))}
              <button
                type="button"
                title="Remove highlight"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleHighlightSelect('remove');
                }}
                className="w-7 h-7 rounded border border-gray-200 dark:border-neutral-600 hover:scale-110 transition-transform cursor-pointer flex items-center justify-center bg-white dark:bg-neutral-800"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton icon={ListOrdered} label="Numbered list (Ctrl+Shift+7)" active={activeFormats.orderedList} onClick={() => onExecCommand('insertOrderedList')} />
      <ToolbarButton icon={List} label="Bullet list (Ctrl+Shift+8)" active={activeFormats.unorderedList} onClick={() => onExecCommand('insertUnorderedList')} />
      <ToolbarButton icon={Indent} label="Indent" onClick={() => onExecCommand('indent')} />
      <ToolbarButton icon={Outdent} label="Outdent" onClick={() => onExecCommand('outdent')} />

      <ToolbarDivider />

      {/* Link */}
      <div className="relative" ref={linkRef}>
        <ToolbarButton
          icon={Link}
          label="Insert link (Ctrl+K)"
          active={activeFormats.isLink}
          onClick={handleLinkButtonClick}
        />

        {showLinkPopover && (
          <div
            className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg p-3 min-w-[280px]"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="text-xs text-gray-500 dark:text-neutral-400 mb-2">Insert Link</div>
            <input
              ref={linkInputRef}
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleLinkApply();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  setShowLinkPopover(false);
                }
              }}
              placeholder="https://..."
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="flex items-center justify-end gap-2 mt-2">
              {activeFormats.isLink && (
                <button
                  type="button"
                  onClick={() => {
                    restoreSelectionAndExec(() => {
                      // Find the anchor element and strip its styling before unlinking
                      const selection = window.getSelection();
                      if (selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        const container = range.commonAncestorContainer;
                        let el = container.nodeType === 3 ? container.parentElement : container;
                        while (el && el !== editorRef.current) {
                          if (el.tagName === 'A') {
                            // Replace the anchor with its plain text content
                            const text = el.textContent;
                            const textNode = document.createTextNode(text);
                            el.parentNode.replaceChild(textNode, el);
                            // Re-select the text
                            const newRange = document.createRange();
                            newRange.selectNodeContents(textNode);
                            selection.removeAllRanges();
                            selection.addRange(newRange);
                            break;
                          }
                          el = el.parentElement;
                        }
                      }
                    });
                    setShowLinkPopover(false);
                    setLinkUrl('');
                  }}
                  className="px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors cursor-pointer"
                >
                  Remove link
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowLinkPopover(false);
                  setLinkUrl('');
                }}
                className="px-2 py-1 text-xs text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLinkApply}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Image Upload */}
      <ToolbarButton
        icon={ImagePlus}
        label="Upload image"
        onClick={() => fileInputRef.current?.click()}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <ToolbarDivider />

      {/* Clear Formatting */}
      <ToolbarButton
        icon={RemoveFormatting}
        label="Clear formatting"
        onClick={() => {
          onExecCommand('removeFormat');
          // Also reset block to normal
          onExecCommand('formatBlock', 'div');
        }}
      />
    </div>
  );
};

export default TicketEditorToolbar;
