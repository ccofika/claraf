import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Link, Unlink, FileText, Search, Check, Bold, Italic, Underline, Palette, RotateCcw } from 'lucide-react';
import { textColors, textColorStyles } from '../../../hooks/useRichTextEditor';

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

// Shared Rich Text Toolbar component
const RichTextToolbar = ({
  // From useRichTextEditor hook
  selectionToolbar,
  toolbarMode,
  linkUrl,
  setLinkUrl,
  showColorPicker,
  setShowColorPicker,
  selectionHasLink,
  showPagePicker,
  toolbarRef,
  linkInputRef,
  // Functions
  applyFormat,
  applyColor,
  removeColor,
  handleAddLinkClick,
  handleLinkPageClick,
  handleRemoveLink,
  handleConfirmLink,
  handleCancelToolbar,
  handleSelectPage,
  // External
  pageTree,
}) => {
  if (!selectionToolbar) return null;

  return (
    <>
      {createPortal(
      <div
        ref={toolbarRef}
        className="fixed z-[99997] flex items-center gap-1 px-1.5 py-1
          bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700
          rounded-lg shadow-lg"
        style={{
          top: selectionToolbar.top,
          left: selectionToolbar.left,
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
        }}
      >
        <div style={{ pointerEvents: 'auto' }}>
          {toolbarMode === null && (
            <div
              className="flex items-center gap-0.5"
              onMouseDown={(e) => {
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
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-4 py-3
                      bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700
                      rounded-xl shadow-xl z-[60]"
                    style={{ minWidth: '200px' }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <p className="text-[11px] font-medium text-gray-400 dark:text-neutral-500 uppercase tracking-wider mb-2.5">
                      Text color
                    </p>
                    <div className="grid grid-cols-4 gap-3 mb-3">
                      {textColors.map(c => (
                        <button
                          key={c.name}
                          onMouseDown={(e) => { e.preventDefault(); applyColor(c.name); }}
                          className="w-9 h-9 rounded-full border-2 border-gray-200 dark:border-neutral-600
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
      </div>,
      document.body
      )}

      {/* Page Picker Modal */}
      {showPagePicker && (
        <PagePickerModal
          pageTree={pageTree}
          onSelect={handleSelectPage}
          onCancel={handleCancelToolbar}
        />
      )}
    </>
  );
};

export { textColorStyles, PagePickerModal };
export default RichTextToolbar;
