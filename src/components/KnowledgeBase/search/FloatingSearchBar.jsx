import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, Loader2, ArrowRight, Pencil } from 'lucide-react';
import { useKnowledgeBase } from '../../../context/KnowledgeBaseContext';

// Renders text with highlighted match positions
const HighlightedText = ({ text, highlights = [] }) => {
  if (!highlights.length) return <>{text}</>;

  const parts = [];
  let lastEnd = 0;
  const sorted = [...highlights].sort((a, b) => a.start - b.start);

  for (const { start, end } of sorted) {
    if (start > lastEnd) {
      parts.push(<span key={`t-${lastEnd}`}>{text.slice(lastEnd, start)}</span>);
    }
    parts.push(
      <mark
        key={`h-${start}`}
        className="bg-yellow-200 dark:bg-yellow-900/50 text-yellow-900 dark:text-yellow-200 rounded-sm px-0.5"
      >
        {text.slice(start, end)}
      </mark>
    );
    lastEnd = end;
  }

  if (lastEnd < text.length) {
    parts.push(<span key={`t-${lastEnd}`}>{text.slice(lastEnd)}</span>);
  }

  return <>{parts}</>;
};

const FloatingSearchBar = () => {
  const { fuzzySearch, recordSearchBoost, currentPage, isAdmin } = useKnowledgeBase();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const resultsRef = useRef(null);
  const containerRef = useRef(null);

  // Debounced fuzzy search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setTotalCount(0);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await fuzzySearch(query);
        setResults(data.results || []);
        setTotalCount(data.totalCount || 0);
        setSelectedIndex(0);
      } catch {
        setResults([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query, fuzzySearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input on Ctrl+K or sidebar button event
  useEffect(() => {
    const handleFocusSearch = () => {
      inputRef.current?.focus();
      setFocused(true);
    };
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setFocused(true);
      }
    };
    window.addEventListener('focus-kb-search', handleFocusSearch);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('focus-kb-search', handleFocusSearch);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Scroll selected result into view
  useEffect(() => {
    if (resultsRef.current) {
      const selected = resultsRef.current.children[selectedIndex];
      if (selected) {
        selected.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleResultClick = useCallback((result) => {
    recordSearchBoost(query, result._id);
    navigate(`/knowledge-base/${result.slug}`);
    setFocused(false);
  }, [query, recordSearchBoost, navigate]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleResultClick(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setFocused(false);
      inputRef.current?.blur();
    }
  }, [results, selectedIndex, handleResultClick]);

  const showDropdown = focused && (results.length > 0 || (query.trim().length >= 2 && !loading));

  // Handle edit button click
  const handleEditClick = () => {
    if (currentPage?._id) {
      navigate(`/knowledge-base/admin?edit=${currentPage._id}`);
    }
  };

  return (
    <div className="relative z-30 w-full px-4 pt-4 pb-2" ref={containerRef}>
      {/* Search Input Bar with Edit Button */}
      <div className="mx-auto max-w-3xl flex items-center gap-2">
        {/* Search Bar */}
        <div className={`flex-1 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md rounded-xl
          border transition-shadow ${focused
            ? 'shadow-lg border-blue-300 dark:border-blue-700'
            : 'shadow border-gray-200 dark:border-neutral-700'
          }`}>
          <div className="flex items-center gap-3 px-4 py-3">
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              placeholder="Search all pages and content..."
              className="flex-1 bg-transparent text-gray-900 dark:text-white
                placeholder-gray-400 focus:outline-none text-sm"
            />
            {loading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin shrink-0" />}
            {query && (
              <button
                onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X size={14} />
              </button>
            )}
            <kbd className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-neutral-800
              border border-gray-200 dark:border-neutral-700 rounded font-mono text-gray-400 shrink-0">
              Ctrl+K
            </kbd>
          </div>
        </div>

        {/* Edit Button - only visible for admins when on a page */}
        {isAdmin && currentPage?._id && (
          <button
            onClick={handleEditClick}
            className="flex items-center gap-2 px-4 py-3 bg-white/95 dark:bg-neutral-900/95
              backdrop-blur-md rounded-xl border border-gray-200 dark:border-neutral-700
              shadow hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700
              text-gray-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400
              transition-all shrink-0"
            title="Edit this page"
          >
            <Pencil size={16} />
            <span className="text-sm font-medium">Edit</span>
          </button>
        )}
      </div>

      {/* Results Dropdown - absolute, floats over page content, only when focused */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-4 top-full mt-1 z-40"
            style={{ right: isAdmin && currentPage?._id ? '88px' : '16px' }}
          >
            <div className="mx-auto max-w-3xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md rounded-xl
              shadow-xl border border-gray-200 dark:border-neutral-700 overflow-hidden">

              {/* Results list */}
              {results.length > 0 && (
                <div className="max-h-96 overflow-y-auto" ref={resultsRef}>
                  {results.map((result, idx) => (
                    <button
                      key={result._id}
                      onClick={() => handleResultClick(result)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                        selectedIndex === idx
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-neutral-800/50'
                      }`}
                    >
                      <span className="text-lg shrink-0 mt-0.5">{result.icon || '\u{1F4C4}'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {result.title}
                          </span>
                          {result.matchCount > 1 && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30
                              text-blue-600 dark:text-blue-400 rounded-full shrink-0 font-medium">
                              {result.matchCount} {result.matchCount === 1 ? 'match' : 'matches'}
                            </span>
                          )}
                        </div>
                        {result.excerpts?.map((excerpt, i) => (
                          <p key={i} className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            <HighlightedText text={excerpt.text} highlights={excerpt.highlights} />
                          </p>
                        ))}
                        {result.tags?.length > 0 && (
                          <div className="flex gap-1 mt-1.5">
                            {result.tags.slice(0, 3).map(tag => (
                              <span
                                key={tag}
                                className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-neutral-700 text-gray-500 dark:text-gray-400 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0 mt-1" />
                    </button>
                  ))}
                </div>
              )}

              {/* No results */}
              {query.trim().length >= 2 && !loading && results.length === 0 && (
                <div className="py-8 text-center text-gray-400">
                  <Search className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No results for "{query}"</p>
                  <p className="text-xs mt-1 opacity-75">Try different keywords or check for typos</p>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2 border-t
                border-gray-100 dark:border-neutral-800 text-[10px] text-gray-400">
                <div className="flex items-center gap-3">
                  <span><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">&uarr;&darr;</kbd> Navigate</span>
                  <span><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">&crarr;</kbd> Open</span>
                  <span><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Esc</kbd> Close</span>
                </div>
                {totalCount > 0 && (
                  <span>{totalCount} result{totalCount !== 1 ? 's' : ''} found</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FloatingSearchBar;
