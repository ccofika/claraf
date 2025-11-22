import React, { useState, useEffect, useRef } from 'react';
import { Search, Globe, Box } from 'lucide-react';
import axios from 'axios';

const CanvasSearchBar = ({ currentWorkspaceId, workspaces = [], onElementSelect }) => {
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState('local'); // 'local' or 'global'
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef(null);
  const resultsRef = useRef(null);
  const debounceTimer = useRef(null);

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (query.trim().length === 0) {
      setResults([]);
      setShowResults(false);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, searchMode, currentWorkspaceId]);

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/canvas/search`,
        {
          params: {
            query: searchQuery,
            mode: searchMode,
            workspaceId: searchMode === 'local' ? currentWorkspaceId : undefined
          },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setResults(response.data);
      setShowResults(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!showResults || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowResults(false);
        setQuery('');
        searchInputRef.current?.blur();
        break;
      default:
        break;
    }
  };

  const handleResultClick = (result) => {
    onElementSelect?.(result);
    setShowResults(false);
    setQuery('');
    searchInputRef.current?.blur();
  };

  const getElementTypeLabel = (type) => {
    const labels = {
      title: 'Title',
      description: 'Description',
      macro: 'Macro',
      example: 'Example',
      text: 'Text',
      card: 'Card',
      'sticky-note': 'Note'
    };
    return labels[type] || type;
  };

  const getElementPreview = (element) => {
    if (element.type === 'title' || element.type === 'description') {
      return element.content?.value || 'No content';
    }
    if (element.type === 'macro') {
      return element.content?.title || element.content?.description || 'No content';
    }
    if (element.type === 'example') {
      const currentExample = element.content?.examples?.[element.content?.currentExampleIndex || 0];
      return currentExample?.title || 'No content';
    }
    return element.content?.text || element.content?.title || 'No content';
  };

  const stripHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(e.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4">
      <div className="relative">
        {/* Search Input Container */}
        <div
          className={`
            flex items-center gap-1 px-2 py-1.5
            rounded-lg
            bg-white/90 dark:bg-black/40 backdrop-blur-xl
            border border-gray-200 dark:border-white/10
            shadow-2xl
            transition-all duration-300 ease-out
          `}
        >
          {/* Search Icon */}
          <Search size={9} className="text-gray-600 dark:text-white/70" />

          {/* Search Input */}
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query && setShowResults(true)}
            placeholder={`Search ${searchMode === 'local' ? 'workspace' : 'all workspaces'}...`}
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/50 outline-none text-xs"
          />

          {/* Loading Spinner */}
          {isSearching && (
            <div className="w-2 h-2 border border-gray-300 dark:border-white/30 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
          )}

          {/* Divider */}
          <div className="w-px h-3 bg-gray-300 dark:bg-white/10" />

          {/* Local/Global Switch */}
          <div className="flex items-center gap-0.5 bg-gray-200 dark:bg-white/5 rounded-md p-0.5">
            <button
              onClick={() => setSearchMode('local')}
              className={`
                flex items-center gap-1 px-1.5 py-1 rounded
                transition-all duration-200
                ${searchMode === 'local'
                  ? 'bg-gray-300 dark:bg-white/15 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white/80 hover:bg-gray-200 dark:hover:bg-white/5'
                }
              `}
              title="Search current workspace"
            >
              <Box size={7} />
              <span className="text-[10px] font-medium">Local</span>
            </button>
            <button
              onClick={() => setSearchMode('global')}
              className={`
                flex items-center gap-1 px-1.5 py-1 rounded
                transition-all duration-200
                ${searchMode === 'global'
                  ? 'bg-gray-300 dark:bg-white/15 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white/80 hover:bg-gray-200 dark:hover:bg-white/5'
                }
              `}
              title="Search all workspaces"
            >
              <Globe size={7} />
              <span className="text-[10px] font-medium">Global</span>
            </button>
          </div>
        </div>

        {/* Search Results Dropdown */}
        {showResults && results.length > 0 && (
          <div
            ref={resultsRef}
            className="absolute top-full left-0 right-0 mt-1 rounded-md bg-white/95 dark:bg-black/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-2xl max-h-[200px] overflow-y-auto"
          >
            {results.map((result, index) => (
              <div
                key={result._id}
                onClick={() => handleResultClick(result)}
                className={`
                  px-2 py-1.5 cursor-pointer transition-all duration-150
                  border-b border-gray-200 dark:border-white/5 last:border-b-0
                  ${index === selectedIndex
                    ? 'bg-gray-200 dark:bg-white/15'
                    : 'hover:bg-gray-100 dark:hover:bg-white/10'
                  }
                `}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex-1 min-w-0">
                    {/* Element Type Tag */}
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="inline-block px-1 py-0.5 text-[9px] font-medium rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                        {getElementTypeLabel(result.type)}
                      </span>
                      {searchMode === 'global' && result.workspaceName && (
                        <span className="inline-block px-1 py-0.5 text-[9px] font-medium rounded bg-purple-500/20 text-purple-300 border border-purple-400/30">
                          {result.workspaceName}
                        </span>
                      )}
                    </div>

                    {/* Element Preview */}
                    <div className="text-[11px] text-gray-900 dark:text-white line-clamp-2">
                      {stripHtml(getElementPreview(result))}
                    </div>
                  </div>

                  {/* Match Score (if available) */}
                  {result.score && (
                    <div className="text-[9px] text-gray-500 dark:text-white/50 whitespace-nowrap">
                      {Math.round(result.score * 100)}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results Message */}
        {showResults && results.length === 0 && !isSearching && query && (
          <div
            ref={resultsRef}
            className="absolute top-full left-0 right-0 mt-1 rounded-md bg-white/95 dark:bg-black/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-2xl px-2 py-4 text-center"
          >
            <p className="text-gray-500 dark:text-white/50 text-xs">No results found for "{query}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasSearchBar;
