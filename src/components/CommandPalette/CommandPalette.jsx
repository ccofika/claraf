import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, X, Loader2, SlidersHorizontal, Save, Sparkles, MessageSquare } from 'lucide-react';
import { useCommandPalette } from '../../hooks/useCommandPalette';
import { useSearchHistory } from '../../hooks/useSearchHistory';
import { useSavedSearches } from '../../hooks/useSavedSearches';
import FilterPanel from './FilterPanel';
import FilterChip from './FilterChip';
import ResultsGroup from './ResultsGroup';
import ResultCard from './ResultCard';
import RecentSearches from './RecentSearches';
import SavedSearches from './SavedSearches';
import SaveSearchDialog from './SaveSearchDialog';
import AIAssistant from './AIAssistant';
import ChatSessionsList from './ChatSessionsList';
import { toast } from 'sonner';
import axios from 'axios';

const CommandPalette = ({ currentWorkspaceId, workspaces = [], onElementSelect, onBookmarkCreate }) => {
  const {
    isOpen,
    searchQuery,
    activeFilters,
    activeFilterCount,
    close,
    setQuery,
    clearQuery,
    removeFilter,
    clearAllFilters,
    setFilters
  } = useCommandPalette();

  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showFilters, setShowFilters] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [aiMode, setAiMode] = useState(false); // AI Search toggle
  const [viewMode, setViewMode] = useState('search'); // 'search' or 'assistant'
  const [assistantView, setAssistantView] = useState('list'); // 'list' or 'chat'
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory();
  const { savedSearches, saveSearch, removeSearch, clearSavedSearches, canSaveMore } = useSavedSearches();

  const searchInputRef = useRef(null);
  const resultsRef = useRef(null);
  const debounceTimer = useRef(null);
  const modalRef = useRef(null);

  // Group results by element type
  const groupedResults = useMemo(() => {
    if (results.length === 0) return {};

    const groups = {};
    results.forEach(result => {
      const type = result.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(result);
    });

    return groups;
  }, [results]);

  // Focus input when command palette opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      // Reset assistant view when modal closes
      setAssistantView('list');
      setSelectedSessionId(null);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (searchQuery.trim().length === 0) {
      setResults([]);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, activeFilters, aiMode]);

  const performSearch = async (query) => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');

      // Build query string manually to handle arrays properly
      const params = new URLSearchParams();
      params.append('query', query);
      params.append('mode', 'global');

      // Add array filters (multiple values for same key)
      if (activeFilters.elementTypes.length > 0) {
        activeFilters.elementTypes.forEach(type => {
          params.append('elementTypes', type);
        });
      }
      if (activeFilters.workspaceIds.length > 0) {
        activeFilters.workspaceIds.forEach(id => {
          params.append('workspaceIds', id);
        });
      }
      if (activeFilters.dateRange) {
        params.append('dateFrom', activeFilters.dateRange.from);
        params.append('dateTo', activeFilters.dateRange.to);
      }
      // Add advanced filters
      Object.entries(activeFilters.advanced).forEach(([key, value]) => {
        params.append(key, value);
      });

      // Choose endpoint based on AI mode
      const endpoint = aiMode ? 'ai-search' : 'search';

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/canvas/${endpoint}?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setResults(response.data);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!results.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      default:
        break;
    }
  }, [results, selectedIndex]);

  const handleResultClick = (result) => {
    // Add current search to history
    if (searchQuery) {
      addToHistory(searchQuery);
    }
    onElementSelect?.(result);
    close();
    clearQuery();
  };

  const handleRecentSearchClick = (query) => {
    setQuery(query);
    // Search will be triggered automatically by useEffect
  };

  const handleClearSearch = () => {
    clearQuery();
    setResults([]);
    searchInputRef.current?.focus();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      close();
    }
  };

  const handleSaveCurrentSearch = () => {
    if (!searchQuery && activeFilterCount === 0) {
      toast.error('Please enter a search query or apply filters first');
      return;
    }
    if (!canSaveMore) {
      toast.error('Maximum saved searches reached (5). Please delete some first.');
      return;
    }
    setShowSaveDialog(true);
  };

  const handleSaveSearch = (name, query, filters) => {
    saveSearch(name, query, filters);
    toast.success(`Saved search: "${name}"`);
  };

  const handleSavedSearchClick = (savedSearch) => {
    // Apply saved search query
    setQuery(savedSearch.query || '');

    // Apply filters if any
    if (savedSearch.filters) {
      setFilters(savedSearch.filters);
    }

    toast.success(`Loaded: "${savedSearch.name}"`);
  };

  // Helper functions
  const getElementTypeLabel = (type) => {
    const labels = {
      title: 'Title',
      description: 'Description',
      macro: 'Macro',
      example: 'Example',
      text: 'Text',
      card: 'Card',
      'sticky-note': 'Note',
      wrapper: 'Wrapper',
      image: 'Image',
      link: 'Link'
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[8vh] bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-4xl mx-4 bg-white dark:bg-neutral-900 rounded-xl shadow-2xl animate-scaleIn overflow-hidden border border-gray-200 dark:border-neutral-800 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* View Mode Tabs */}
        <div className="flex items-center border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50">
          <button
            onClick={() => setViewMode('search')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              viewMode === 'search'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-neutral-900'
                : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Search size={16} />
            Search
          </button>
          <button
            onClick={() => setViewMode('assistant')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              viewMode === 'assistant'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-neutral-900'
                : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare size={16} />
            AI Assistant
          </button>
        </div>

        {/* Search Input Section */}
        {viewMode === 'search' && (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-neutral-800">
          <Search size={20} className="text-gray-400 dark:text-neutral-500 shrink-0" />

          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search anything... (Cmd+K)"
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 outline-none text-base"
          />

          {isSearching && (
            <Loader2 size={16} className="text-blue-500 animate-spin shrink-0" />
          )}

          {searchQuery && !isSearching && (
            <button
              onClick={handleClearSearch}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
              title="Clear search"
            >
              <X size={16} className="text-gray-400 dark:text-neutral-500" />
            </button>
          )}

          {/* Save Search Button */}
          <button
            onClick={handleSaveCurrentSearch}
            disabled={!searchQuery && activeFilterCount === 0}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Save current search"
          >
            <Save size={14} className="text-gray-600 dark:text-neutral-400" />
          </button>

          {/* AI Mode Toggle */}
          <button
            onClick={() => setAiMode(!aiMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all shrink-0 ${
              aiMode
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
            }`}
            title={aiMode ? "AI Search Active" : "Enable AI Search"}
          >
            <Sparkles size={14} />
            {aiMode && <span className="text-[10px]">AI</span>}
          </button>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all shrink-0 ${
              showFilters || activeFilterCount > 0
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
            }`}
            title="Toggle filters"
          >
            <SlidersHorizontal size={14} />
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-blue-600 dark:bg-blue-500 text-white text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="text-xs text-gray-400 dark:text-neutral-500 shrink-0">
            ESC
          </div>
        </div>
        )}

        {/* Active Filters Display */}
        {viewMode === 'search' && activeFilterCount > 0 && (
          <div className="px-4 py-2 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500 dark:text-neutral-400 shrink-0">
                Filters:
              </span>

              {/* Element Type Chips */}
              {activeFilters.elementTypes.map(type => (
                <FilterChip
                  key={type}
                  label={getElementTypeLabel(type)}
                  onRemove={() => removeFilter('elementTypes', type)}
                />
              ))}

              {/* Workspace Chips */}
              {activeFilters.workspaceIds.map(workspaceId => {
                const workspace = workspaces.find(w => w._id === workspaceId);
                return workspace ? (
                  <FilterChip
                    key={workspaceId}
                    label={workspace.name}
                    onRemove={() => removeFilter('workspaceIds', workspaceId)}
                  />
                ) : null;
              })}

              {/* Date Range Chip */}
              {activeFilters.dateRange && (
                <FilterChip
                  label="Date filtered"
                  onRemove={() => removeFilter('dateRange')}
                />
              )}

              {/* Clear All Button */}
              <button
                onClick={clearAllFilters}
                className="ml-auto text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium shrink-0"
              >
                Clear all
              </button>
            </div>
          </div>
        )}

        {/* Results Section - Search Mode */}
        {viewMode === 'search' && (
        <div
          ref={resultsRef}
          className="flex-1 overflow-y-auto min-h-0"
        >
          {/* Empty State with Recent Searches */}
          {!searchQuery && results.length === 0 && (
            <>
              <div className="py-12 px-4 text-center">
                <Search size={48} className="mx-auto mb-4 text-gray-300 dark:text-neutral-700" />
                <p className="text-gray-500 dark:text-neutral-400 text-sm mb-2">
                  Start typing to search across all workspaces
                </p>
                <p className="text-gray-400 dark:text-neutral-500 text-xs">
                  Use filters to narrow down your search
                </p>
              </div>

              {/* Recent Searches */}
              <RecentSearches
                history={history}
                onSearchClick={handleRecentSearchClick}
                onRemoveClick={removeFromHistory}
                onClearAll={clearHistory}
              />

              {/* Saved Searches */}
              <SavedSearches
                savedSearches={savedSearches}
                onSearchClick={handleSavedSearchClick}
                onRemoveClick={removeSearch}
                onClearAll={clearSavedSearches}
              />
            </>
          )}

          {/* No Results */}
          {searchQuery && results.length === 0 && !isSearching && (
            <div className="py-12 px-4 text-center">
              <p className="text-gray-500 dark:text-neutral-400 text-sm mb-2">
                No results found for "{searchQuery}"
              </p>
              <p className="text-gray-400 dark:text-neutral-500 text-xs">
                Try adjusting your search or filters
              </p>
            </div>
          )}

          {/* Results List - Grouped by Type */}
          {results.length > 0 && (
            <div>
              {Object.entries(groupedResults).map(([type, typeResults]) => (
                <ResultsGroup
                  key={type}
                  title={getElementTypeLabel(type)}
                  count={typeResults.length}
                  icon={null}
                >
                  {typeResults.map((result, index) => {
                    // Calculate global index for keyboard navigation
                    const globalIndex = results.findIndex(r => r._id === result._id);
                    return (
                      <ResultCard
                        key={result._id}
                        result={result}
                        isSelected={globalIndex === selectedIndex}
                        onClick={() => handleResultClick(result)}
                        workspaceName={result.workspaceName}
                        onBookmark={onBookmarkCreate}
                      />
                    );
                  })}
                </ResultsGroup>
              ))}
            </div>
          )}
        </div>
        )}

        {/* AI Assistant Mode */}
        {viewMode === 'assistant' && (
          <div className="flex-1 min-h-0">
            {assistantView === 'list' ? (
              <ChatSessionsList
                onSelectSession={(sessionId) => {
                  setSelectedSessionId(sessionId);
                  setAssistantView('chat');
                }}
                onNewChat={() => {
                  setSelectedSessionId(null);
                  setAssistantView('chat');
                }}
              />
            ) : (
              <AIAssistant
                workspaces={workspaces}
                activeFilters={activeFilters}
                resultsCount={results.length}
                onElementSelect={onElementSelect}
                onBookmarkCreate={onBookmarkCreate}
                onClose={close}
                sessionId={selectedSessionId}
                onBackToList={() => {
                  setAssistantView('list');
                  setSelectedSessionId(null);
                }}
              />
            )}
          </div>
        )}

        {/* Filter Panel */}
        {viewMode === 'search' && showFilters && (
          <FilterPanel workspaces={workspaces} />
        )}

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-neutral-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded text-xs">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded text-xs">↵</kbd>
                Select
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded text-xs">ESC</kbd>
                Close
              </span>
            </div>
            {results.length > 0 && (
              <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      </div>

      {/* Save Search Dialog */}
      <SaveSearchDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveSearch}
        currentQuery={searchQuery}
        currentFilters={activeFilters}
      />
    </div>
  );
};

export default CommandPalette;
