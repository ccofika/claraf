import React, { useState, useEffect, useRef } from 'react';
import { Hash, Tag, ListChecks } from 'lucide-react';
import { useMacros } from '../hooks/useMacros';

const MacroTriggerDropdown = ({
  triggerText,
  position,
  onSelect,
  onClose,
  editorRef
}) => {
  const { searchMacros, macros, fetchMacros } = useMacros();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef(null);
  const hasFetchedMacros = useRef(false);
  const resultsRef = useRef(results);
  const selectedIndexRef = useRef(selectedIndex);

  // Keep refs in sync
  resultsRef.current = results;
  selectedIndexRef.current = selectedIndex;

  // Fetch all macros initially if not already fetched
  useEffect(() => {
    if (!hasFetchedMacros.current) {
      fetchMacros();
      hasFetchedMacros.current = true;
    }
  }, [fetchMacros]);

  // Search when trigger text changes
  useEffect(() => {
    let cancelled = false;

    if (!triggerText) {
      // Show all macros if no search term
      const allMacros = macros.slice(0, 10);
      setResults(allMacros);
      // Only reset to 0 if we have no results or index is out of bounds
      setSelectedIndex(prev => prev >= allMacros.length ? 0 : prev);
      return;
    }

    const search = async () => {
      setLoading(true);
      const searchResults = await searchMacros(triggerText);
      if (!cancelled) {
        const limitedResults = searchResults.slice(0, 10);
        setResults(limitedResults);
        // Only reset to 0 if index would be out of bounds
        setSelectedIndex(prev => prev >= limitedResults.length ? 0 : prev);
        setLoading(false);
      }
    };

    const timer = setTimeout(search, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [triggerText, searchMacros, macros]);

  // Handle keyboard navigation - use refs to avoid stale closure issues
  useEffect(() => {
    const handleKeyDown = (e) => {
      const currentResults = resultsRef.current;
      const currentIndex = selectedIndexRef.current;

      if (!currentResults.length) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex((currentIndex + 1) % currentResults.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex((currentIndex - 1 + currentResults.length) % currentResults.length);
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          e.stopPropagation();
          if (currentResults[currentIndex]) {
            onSelect(currentResults[currentIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          e.stopPropagation();
          onClose();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [onSelect, onClose]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        // Don't close if clicking inside the editor
        if (editorRef?.current && editorRef.current.contains(e.target)) {
          return;
        }
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, editorRef]);

  // Scroll selected item into view
  useEffect(() => {
    if (dropdownRef.current) {
      const selected = dropdownRef.current.querySelector('[data-selected="true"]');
      if (selected) {
        selected.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (results.length === 0 && !loading) {
    return (
      <div
        ref={dropdownRef}
        className="absolute z-[9999] bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg overflow-hidden min-w-[200px]"
        style={{
          top: position?.top ?? 0,
          left: position?.left ?? 0
        }}
      >
        <div className="px-3 py-2 text-sm text-gray-500 dark:text-neutral-400">
          {triggerText ? 'No matching macros' : 'No macros available'}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={dropdownRef}
      className="macro-trigger-dropdown absolute z-[9999] bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg overflow-hidden min-w-[250px] max-w-[350px] max-h-[200px] overflow-y-auto"
      style={{
        top: position?.top ?? 0,
        left: position?.left ?? 0
      }}
    >
      {loading ? (
        <div className="px-3 py-2 text-sm text-gray-500 dark:text-neutral-400">
          Searching...
        </div>
      ) : (
        <div className="py-1">
          <div className="px-3 py-1 text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wide border-b border-gray-100 dark:border-neutral-800">
            Macros
          </div>
          {results.map((macro, index) => {
            const hasCategories = macro.categories && macro.categories.length > 0;
            const hasScorecard = macro.scorecardData && Object.keys(macro.scorecardData).length > 0;

            return (
              <button
                key={macro._id}
                data-selected={index === selectedIndex}
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent blur on editor
                  onSelect(macro);
                }}
                className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors ${
                  index === selectedIndex
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300'
                }`}
              >
                <Hash className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
                <span className="text-sm truncate flex-1">{macro.title}</span>
                {(hasCategories || hasScorecard) && (
                  <span className="flex items-center gap-1 flex-shrink-0">
                    {hasCategories && (
                      <Tag className="w-3 h-3 text-blue-500 opacity-70" />
                    )}
                    {hasScorecard && (
                      <ListChecks className="w-3 h-3 text-purple-500 opacity-70" />
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
      <div className="px-3 py-1.5 border-t border-gray-100 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950">
        <p className="text-xs text-gray-500 dark:text-neutral-500">
          <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-neutral-700 rounded text-xs">Enter</kbd> insert macro
          <span className="mx-2">|</span>
          <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-neutral-700 rounded text-xs">Esc</kbd> close
        </p>
      </div>
    </div>
  );
};

export default MacroTriggerDropdown;
