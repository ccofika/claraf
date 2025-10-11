import React, { useState } from 'react';
import { Bold, Italic, Underline, Link, Plus, Minus, LinkIcon } from 'lucide-react';
import { useTextFormatting } from '../context/TextFormattingContext';
import ElementLinkModal from './modals/ElementLinkModal';

const TextFormattingDock = ({ currentWorkspaceId }) => {
  const {
    isEditing,
    currentFormatting,
    currentFontSize,
    toggleBold,
    toggleItalic,
    toggleUnderline,
    setHyperlink,
    setElementLink,
    increaseFontSize,
    decreaseFontSize
  } = useTextFormatting();

  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showElementLinkModal, setShowElementLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState(currentFormatting.hyperlink || '');
  const [hoveredItem, setHoveredItem] = useState(null);
  const [savedSelection, setSavedSelection] = useState(null);
  const [activeElementLink, setActiveElementLink] = useState(null);

  const handleLinkClick = () => {
    // Save current selection before opening input
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      setSavedSelection(selection.getRangeAt(0));
    }
    setShowLinkInput(!showLinkInput);
  };

  const handleLinkSubmit = () => {
    // Restore selection before applying hyperlink
    if (savedSelection) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(savedSelection);
    }

    setHyperlink(linkUrl);
    setShowLinkInput(false);
    setSavedSelection(null);
  };

  const handleLinkCancel = () => {
    setLinkUrl(currentFormatting.hyperlink || '');
    setShowLinkInput(false);
    setSavedSelection(null);
  };

  const handleElementLinkClick = (e) => {
    // Prevent any default behavior and stop propagation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Save current selection before opening modal
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      // Check if there's actually selected text
      if (range.toString().trim().length === 0) {
        console.warn('No text selected for element link');
        return;
      }

      // Check if the current selection already has an element link
      const container = range.commonAncestorContainer;
      const element = container.nodeType === 3 ? container.parentElement : container;

      let currentElementLink = null;
      let checkElement = element;

      // Walk up the DOM to find if we're inside an element link
      while (checkElement && checkElement.contentEditable !== 'true') {
        if (checkElement.tagName === 'A') {
          const elementId = checkElement.getAttribute('data-element-id');
          const workspaceId = checkElement.getAttribute('data-workspace-id');

          if (elementId && workspaceId) {
            // Found an element link
            currentElementLink = {
              elementId,
              workspaceId,
              elementType: checkElement.getAttribute('data-element-type'),
              elementTitle: checkElement.getAttribute('data-element-title')
            };
            break;
          }
        }
        checkElement = checkElement.parentElement;
      }

      // Clone the range to preserve it - this ensures we work with the exact selection
      const clonedRange = range.cloneRange();
      setSavedSelection(clonedRange);
      setActiveElementLink(currentElementLink);

      console.log('Saved selection for element link:', {
        text: range.toString(),
        hasElementLink: !!currentElementLink,
        elementLinkData: currentElementLink,
        startContainer: range.startContainer,
        startOffset: range.startOffset,
        endContainer: range.endContainer,
        endOffset: range.endOffset
      });
    } else {
      console.warn('No selection available');
      return;
    }

    setShowElementLinkModal(true);
  };

  const handleRemoveElementLink = () => {
    console.log('Removing element link for:', activeElementLink);

    // Close modal and reset state first
    setShowElementLinkModal(false);

    // Use requestAnimationFrame to ensure modal is fully closed and DOM is updated
    requestAnimationFrame(() => {
      if (savedSelection) {
        try {
          const selection = window.getSelection();

          // Clear any existing selection first
          selection.removeAllRanges();

          // Restore the saved selection
          const restoredRange = savedSelection.cloneRange();
          selection.addRange(restoredRange);

          console.log('Restored selection for link removal:', {
            text: restoredRange.toString(),
            elementLink: activeElementLink
          });

          // Set element link to null to remove it
          setElementLink(null);
        } catch (error) {
          console.error('Error removing element link:', error);
        }
      }

      // Reset state
      setSavedSelection(null);
      setActiveElementLink(null);
    });
  };

  const handleElementLinkSelect = (linkData) => {
    console.log('Element link selected:', linkData);

    // Close modal first
    setShowElementLinkModal(false);

    // Use requestAnimationFrame to ensure modal is fully closed and DOM is updated
    requestAnimationFrame(() => {
      if (savedSelection) {
        try {
          const selection = window.getSelection();

          // Clear any existing selection first
          selection.removeAllRanges();

          // Restore the saved selection
          const restoredRange = savedSelection.cloneRange();
          selection.addRange(restoredRange);

          console.log('Restored selection:', restoredRange.toString());
          console.log('Range details:', {
            startContainer: restoredRange.startContainer,
            startOffset: restoredRange.startOffset,
            endContainer: restoredRange.endContainer,
            endOffset: restoredRange.endOffset,
            collapsed: restoredRange.collapsed
          });

          // Apply the element link with the restored selection
          setElementLink(linkData);
        } catch (error) {
          console.error('Error restoring selection:', error);
        }
      }

      // Reset state
      setSavedSelection(null);
      setActiveElementLink(null);
    });
  };

  if (!isEditing) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 text-formatting-dock">
      <div className="relative">
        {/* Dock Container */}
        <div
          className={`
            flex items-center gap-2 px-4 py-3
            rounded-xl
            bg-black/40 dark:bg-black/40 backdrop-blur-xl
            border border-white/10
            shadow-2xl
            transition-all duration-300 ease-out
          `}
        >
          {/* Bold Button */}
          <button
            onClick={toggleBold}
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => setHoveredItem('bold')}
            onMouseLeave={() => setHoveredItem(null)}
            className={`
              relative flex items-center justify-center
              w-9 h-9 rounded-lg
              ${currentFormatting.bold ? 'bg-white/20' : 'bg-white/5'}
              backdrop-blur-[2px]
              border border-white/10
              transition-all duration-200 ease-out
              cursor-pointer
              ${hoveredItem === 'bold'
                ? 'scale-110 bg-white/15 border-white/20 shadow-lg shadow-white/10'
                : 'hover:scale-105 hover:bg-white/10'
              }
            `}
            title="Bold"
          >
            <Bold size={16} className="text-white" />
          </button>

          {/* Italic Button */}
          <button
            onClick={toggleItalic}
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => setHoveredItem('italic')}
            onMouseLeave={() => setHoveredItem(null)}
            className={`
              relative flex items-center justify-center
              w-9 h-9 rounded-lg
              ${currentFormatting.italic ? 'bg-white/20' : 'bg-white/5'}
              backdrop-blur-[2px]
              border border-white/10
              transition-all duration-200 ease-out
              cursor-pointer
              ${hoveredItem === 'italic'
                ? 'scale-110 bg-white/15 border-white/20 shadow-lg shadow-white/10'
                : 'hover:scale-105 hover:bg-white/10'
              }
            `}
            title="Italic"
          >
            <Italic size={16} className="text-white" />
          </button>

          {/* Underline Button */}
          <button
            onClick={toggleUnderline}
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => setHoveredItem('underline')}
            onMouseLeave={() => setHoveredItem(null)}
            className={`
              relative flex items-center justify-center
              w-9 h-9 rounded-lg
              ${currentFormatting.underline ? 'bg-white/20' : 'bg-white/5'}
              backdrop-blur-[2px]
              border border-white/10
              transition-all duration-200 ease-out
              cursor-pointer
              ${hoveredItem === 'underline'
                ? 'scale-110 bg-white/15 border-white/20 shadow-lg shadow-white/10'
                : 'hover:scale-105 hover:bg-white/10'
              }
            `}
            title="Underline"
          >
            <Underline size={16} className="text-white" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-white/10" />

          {/* Font Size Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={decreaseFontSize}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setHoveredItem('minus')}
              onMouseLeave={() => setHoveredItem(null)}
              className={`
                relative flex items-center justify-center
                w-7 h-9 rounded-lg
                bg-white/5
                backdrop-blur-[2px]
                border border-white/10
                transition-all duration-200 ease-out
                cursor-pointer
                ${hoveredItem === 'minus'
                  ? 'scale-110 bg-white/15 border-white/20 shadow-lg shadow-white/10'
                  : 'hover:scale-105 hover:bg-white/10'
                }
              `}
              title="Decrease font size"
            >
              <Minus size={14} className="text-white" />
            </button>

            <div className="px-2 py-1 min-w-[40px] text-center text-white text-sm font-medium">
              {currentFontSize}
            </div>

            <button
              onClick={increaseFontSize}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setHoveredItem('plus')}
              onMouseLeave={() => setHoveredItem(null)}
              className={`
                relative flex items-center justify-center
                w-7 h-9 rounded-lg
                bg-white/5
                backdrop-blur-[2px]
                border border-white/10
                transition-all duration-200 ease-out
                cursor-pointer
                ${hoveredItem === 'plus'
                  ? 'scale-110 bg-white/15 border-white/20 shadow-lg shadow-white/10'
                  : 'hover:scale-105 hover:bg-white/10'
                }
              `}
              title="Increase font size"
            >
              <Plus size={14} className="text-white" />
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-white/10" />

          {/* Hyperlink Button */}
          <button
            onClick={handleLinkClick}
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => setHoveredItem('link')}
            onMouseLeave={() => setHoveredItem(null)}
            className={`
              relative flex items-center justify-center
              w-9 h-9 rounded-lg
              ${currentFormatting.hyperlink ? 'bg-white/20' : 'bg-white/5'}
              backdrop-blur-[2px]
              border border-white/10
              transition-all duration-200 ease-out
              cursor-pointer
              ${hoveredItem === 'link'
                ? 'scale-110 bg-white/15 border-white/20 shadow-lg shadow-white/10'
                : 'hover:scale-105 hover:bg-white/10'
              }
            `}
            title="Hyperlink"
          >
            <Link size={16} className="text-white" />
          </button>

          {/* Element Link Button */}
          <button
            onClick={handleElementLinkClick}
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => setHoveredItem('elementLink')}
            onMouseLeave={() => setHoveredItem(null)}
            className={`
              relative flex items-center justify-center
              w-9 h-9 rounded-lg
              ${currentFormatting.elementLink ? 'bg-green-500/30' : 'bg-white/5'}
              backdrop-blur-[2px]
              border ${currentFormatting.elementLink ? 'border-green-400/40' : 'border-white/10'}
              transition-all duration-200 ease-out
              cursor-pointer
              ${hoveredItem === 'elementLink'
                ? 'scale-110 bg-green-500/25 border-green-400/50 shadow-lg shadow-green-400/20'
                : 'hover:scale-105 hover:bg-green-500/15'
              }
            `}
            title="Link to Element"
          >
            <LinkIcon size={16} className={currentFormatting.elementLink ? 'text-green-300' : 'text-white'} />
          </button>
        </div>

        {/* Link Input Popup */}
        {showLinkInput && (
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-3 rounded-lg bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl min-w-[300px] z-[60] pointer-events-auto"
            onMouseEnter={() => setHoveredItem(null)}
          >
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleLinkSubmit();
                } else if (e.key === 'Escape') {
                  handleLinkCancel();
                }
              }}
              placeholder="Enter URL..."
              className="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/50 outline-none focus:border-white/40 text-sm"
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleLinkSubmit}
                onMouseDown={(e) => e.preventDefault()}
                className="flex-1 px-3 py-1.5 rounded-md bg-blue-500 hover:bg-blue-600 text-white text-sm transition-colors"
              >
                Apply
              </button>
              <button
                onClick={handleLinkCancel}
                onMouseDown={(e) => e.preventDefault()}
                className="flex-1 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Element Link Modal */}
        <ElementLinkModal
          isOpen={showElementLinkModal}
          onClose={() => {
            setShowElementLinkModal(false);
            setActiveElementLink(null);
            setSavedSelection(null);
          }}
          onElementSelect={handleElementLinkSelect}
          onRemoveLink={handleRemoveElementLink}
          currentElementLink={activeElementLink}
          currentWorkspaceId={currentWorkspaceId}
        />
      </div>
    </div>
  );
};

export default TextFormattingDock;
