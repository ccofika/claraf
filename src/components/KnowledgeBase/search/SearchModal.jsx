import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, FileText, Clock, Tag, ArrowRight, Loader2, Filter, Calendar, ChevronDown } from 'lucide-react';

const SearchModal = ({ onSearch, onNavigate, onSuggestions, recentSearches = [], allTags = [], onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filterTags, setFilterTags] = useState([]);
  const [dateRange, setDateRange] = useState(''); // '', '7d', '30d', '90d'
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const suggestRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Fetch suggestions on query change (shorter debounce)
  useEffect(() => {
    if (!onSuggestions) return;
    if (query.trim().length < 1) {
      setSuggestions(null);
      return;
    }
    if (query.trim().length >= 2) {
      // Full search will handle this
      setSuggestions(null);
      return;
    }
    clearTimeout(suggestRef.current);
    suggestRef.current = setTimeout(async () => {
      try {
        const data = await onSuggestions(query);
        setSuggestions(data);
      } catch {
        setSuggestions(null);
      }
    }, 150);
    return () => clearTimeout(suggestRef.current);
  }, [query, onSuggestions]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const filters = {};
        if (filterTags.length > 0) filters.tags = filterTags.join(',');
        if (dateRange) {
          const days = { '7d': 7, '30d': 30, '90d': 90 }[dateRange];
          if (days) {
            const d = new Date();
            d.setDate(d.getDate() - days);
            filters.dateFrom = d.toISOString();
          }
        }
        const data = await onSearch?.(query, filters);
        setResults(data || []);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Search error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query, filterTags, dateRange]);

  const handleKeyDown = useCallback((e) => {
    const items = query.trim() ? results : recentSearches;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[selectedIndex]) {
        const item = items[selectedIndex];
        onNavigate?.(item.slug || item);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [results, recentSearches, selectedIndex, query, onNavigate, onClose]);

  const toggleTagFilter = (tag) => {
    setFilterTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setFilterTags([]);
    setDateRange('');
  };

  const hasActiveFilters = filterTags.length > 0 || dateRange;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[600px] max-h-[60vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, blocks, tags..."
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none text-sm"
          />
          {loading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-md transition-colors ${
              hasActiveFilters
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Toggle filters"
          >
            <Filter className="w-4 h-4" />
          </button>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
            ESC
          </kbd>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 space-y-3">
            {/* Date Range */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-1.5 block">
                Date Range
              </label>
              <div className="flex gap-1.5">
                {[
                  { value: '', label: 'Any time' },
                  { value: '7d', label: 'Past week' },
                  { value: '30d', label: 'Past month' },
                  { value: '90d', label: 'Past 3 months' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setDateRange(opt.value)}
                    className={`px-2.5 py-1 text-[11px] rounded-md border transition-colors ${
                      dateRange === opt.value
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tag Filters */}
            {allTags.length > 0 && (
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-1.5 block">
                  Tags
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                  {allTags.slice(0, 30).map(tag => {
                    const tagName = typeof tag === 'string' ? tag : tag.name || tag._id;
                    const isActive = filterTags.includes(tagName);
                    return (
                      <button
                        key={tagName}
                        onClick={() => toggleTagFilter(tagName)}
                        className={`px-2 py-0.5 text-[11px] rounded-md border transition-colors ${
                          isActive
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                            : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        {tagName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-[11px] text-red-500 hover:text-red-600 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {query.trim() ? (
            results.length > 0 ? (
              <div className="py-1">
                {results.map((result, idx) => (
                  <button
                    key={result._id || idx}
                    onClick={() => {
                      onNavigate?.(result.slug);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      selectedIndex === idx
                        ? 'bg-blue-50 dark:bg-blue-900/30'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <span className="text-lg shrink-0">{result.icon || '📄'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {result.title}
                      </div>
                      {result.matchedContent && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          ...{result.matchedContent}...
                        </p>
                      )}
                      {result.tags && result.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {result.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
                  </button>
                ))}
              </div>
            ) : !loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Search className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No results for "{query}"</p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-blue-500 hover:text-blue-600 mt-1"
                  >
                    Try clearing filters
                  </button>
                )}
              </div>
            ) : null
          ) : (
            /* Recent searches / suggestions / quick actions */
            <div className="py-2">
              {/* Suggestions from API */}
              {suggestions && (
                <>
                  {suggestions.pages?.length > 0 && (
                    <>
                      <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-gray-400 font-medium">
                        Suggestions
                      </div>
                      {suggestions.pages.map((page, idx) => (
                        <button
                          key={page._id || idx}
                          onClick={() => {
                            onNavigate?.(page.slug);
                            onClose();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <span className="text-base shrink-0">{page.icon || '📄'}</span>
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{page.title}</span>
                          <ArrowRight className="w-3 h-3 text-gray-300 ml-auto shrink-0" />
                        </button>
                      ))}
                    </>
                  )}
                  {suggestions.tags?.length > 0 && (
                    <>
                      <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-gray-400 font-medium">
                        Matching Tags
                      </div>
                      <div className="flex flex-wrap gap-1.5 px-4 py-1.5">
                        {suggestions.tags.map(t => (
                          <button
                            key={t.tag}
                            onClick={() => {
                              setFilterTags(prev => prev.includes(t.tag) ? prev : [...prev, t.tag]);
                              setShowFilters(true);
                              setQuery('');
                            }}
                            className="px-2.5 py-1 text-[11px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                          >
                            #{t.tag} <span className="text-gray-400 ml-0.5">({t.count})</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Recent searches */}
              {!suggestions && recentSearches.length > 0 && (
                <>
                  <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-gray-400 font-medium">
                    Recent
                  </div>
                  {recentSearches.map((item, idx) => (
                    <button
                      key={item._id || idx}
                      onClick={() => {
                        onNavigate?.(item.slug || item);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                        selectedIndex === idx
                          ? 'bg-blue-50 dark:bg-blue-900/30'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {item.title || item}
                      </span>
                    </button>
                  ))}
                </>
              )}
              {!suggestions && (
                <div className="px-4 py-3 text-xs text-gray-400 text-center">
                  Type to search across all pages and content
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 dark:border-gray-700 text-[10px] text-gray-400">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↵</kbd> Open</span>
          </div>
          <span><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
