import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, ChevronUp, ChevronDown, Send } from 'lucide-react';
import ViewModeDropdown from './ViewModeDropdown';

const PostView = ({ wrappers = [], allElements = [], currentWorkspace, onModeChange, canEditContent }) => {
  const [currentWrapperIndex, setCurrentWrapperIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const originalContentRef = React.useRef(new Map());


  // Sort wrappers by createdAt descending (newest first)
  const sortedWrappers = useMemo(() => {
    return [...wrappers].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA; // Newest first
    });
  }, [wrappers]);

  // Current wrapper
  const currentWrapper = sortedWrappers[currentWrapperIndex];

  // Helper to strip HTML and decode entities
  const stripHtml = (html) => {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Get elements for current wrapper
  const wrapperElements = useMemo(() => {
    if (!currentWrapper?.content?.childElements) return { title: null, descriptions: [], macros: [], examples: [] };

    const childIds = new Set(currentWrapper.content.childElements);
    const elements = allElements.filter(el => childIds.has(el._id));

    // Sort macros and examples by createdAt ascending (oldest first)
    const sortByCreatedAt = (a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateA - dateB; // Oldest first
    };

    return {
      title: elements.find(el => el.type === 'title') || null,
      descriptions: elements.filter(el => el.type === 'description'),
      macros: elements.filter(el => el.type === 'macro').sort(sortByCreatedAt),
      examples: elements.filter(el => el.type === 'example').sort(sortByCreatedAt)
    };
  }, [currentWrapper, allElements]);

  // Handle navigation
  const goToPrevious = () => {
    if (currentWrapperIndex < sortedWrappers.length - 1) {
      setCurrentWrapperIndex(prev => prev + 1);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const goToNext = () => {
    if (currentWrapperIndex > 0) {
      setCurrentWrapperIndex(prev => prev - 1);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  // Perform highlighting with current index
  const performHighlighting = React.useCallback((results, currentIdx) => {
    if (!results || results.length === 0) return;

    // First, restore all original content
    originalContentRef.current.forEach((originalHTML, container) => {
      if (document.body.contains(container)) {
        container.innerHTML = originalHTML;
      }
    });

    // Get the search query
    const query = searchQuery;
    if (!query) return;

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQuery, 'gi');

    // Group results by container to know which indices belong to which container
    const resultsByContainer = new Map();
    results.forEach((result, idx) => {
      if (!resultsByContainer.has(result.container)) {
        resultsByContainer.set(result.container, []);
      }
      resultsByContainer.get(result.container).push(idx);
    });

    // Process each container
    resultsByContainer.forEach((indices, container) => {
      const originalHTML = originalContentRef.current.get(container);
      if (!originalHTML) return;

      // Split HTML to avoid replacing inside tags
      const parts = originalHTML.split(/(<[^>]+>)/g);
      let matchCounter = 0;
      const currentContainerStartIndex = indices[0];

      const highlightedParts = parts.map(part => {
        // Skip HTML tags
        if (part.match(/^<[^>]+>$/)) {
          return part;
        }

        // Replace matches in text content
        return part.replace(regex, (match) => {
          const globalMatchIndex = currentContainerStartIndex + matchCounter;
          const isCurrentMatch = globalMatchIndex === currentIdx;
          matchCounter++;

          const className = isCurrentMatch
            ? 'search-highlight current-search-highlight'
            : 'search-highlight';

          return `<mark class="${className}" data-match-index="${globalMatchIndex}">${match}</mark>`;
        });
      });

      container.innerHTML = highlightedParts.join('');
    });

    // Scroll to current match
    setTimeout(() => {
      const currentMark = document.querySelector('.current-search-highlight');
      if (currentMark) {
        currentMark.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
    }, 100);
  }, [searchQuery]);

  // Reset search when wrapper changes
  useEffect(() => {
    setSearchQuery('');
    setSearchResults([]);
    setCurrentSearchIndex(0);
    originalContentRef.current.clear();
  }, [currentWrapperIndex]);

  // Search functionality
  useEffect(() => {
    // Save original content
    const containers = document.querySelectorAll('[data-searchable]');
    containers.forEach((container) => {
      if (!originalContentRef.current.has(container)) {
        originalContentRef.current.set(container, container.innerHTML);
      }
    });

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      // Restore original content
      originalContentRef.current.forEach((originalHTML, container) => {
        if (document.body.contains(container)) {
          container.innerHTML = originalHTML;
        }
      });
      return;
    }

    // Find all matches
    const results = [];
    const searchContainers = document.querySelectorAll('[data-searchable]');

    searchContainers.forEach((container) => {
      const text = container.textContent || '';
      const lowerText = text.toLowerCase();
      const lowerQuery = searchQuery.toLowerCase();

      let index = lowerText.indexOf(lowerQuery);
      while (index !== -1) {
        results.push({
          container,
          index
        });
        index = lowerText.indexOf(lowerQuery, index + 1);
      }
    });

    setSearchResults(results);
    setCurrentSearchIndex(0);

    // Highlight all results
    if (results.length > 0) {
      performHighlighting(results, 0);
    }
  }, [searchQuery, performHighlighting]);

  const goToNextSearchResult = () => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    performHighlighting(searchResults, nextIndex);
  };

  const goToPrevSearchResult = () => {
    if (searchResults.length === 0) return;
    const prevIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
    setCurrentSearchIndex(prevIndex);
    performHighlighting(searchResults, prevIndex);
  };

  // Keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Arrow key navigation (only when search is not focused)
      if (document.activeElement.tagName !== 'INPUT') {
        if (e.key === 'ArrowLeft' && currentWrapperIndex < sortedWrappers.length - 1) {
          setCurrentWrapperIndex(prev => prev + 1);
          setSearchQuery('');
          setSearchResults([]);
        } else if (e.key === 'ArrowRight' && currentWrapperIndex > 0) {
          setCurrentWrapperIndex(prev => prev - 1);
          setSearchQuery('');
          setSearchResults([]);
        }
      }

      // Search shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.querySelector('input[placeholder="Search in post..."]')?.focus();
      }

      // Navigate search results with Ctrl/Cmd + G
      if ((e.ctrlKey || e.metaKey) && e.key === 'g' && searchResults.length > 0) {
        e.preventDefault();
        if (e.shiftKey) {
          const prevIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
          setCurrentSearchIndex(prevIndex);
          performHighlighting(searchResults, prevIndex);
        } else {
          const nextIndex = (currentSearchIndex + 1) % searchResults.length;
          setCurrentSearchIndex(nextIndex);
          performHighlighting(searchResults, nextIndex);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentWrapperIndex, sortedWrappers.length, searchResults, currentSearchIndex]);

  // Render element content with proper formatting
  const renderDescription = (element) => {
    if (!element.content?.value) return <p className="text-sm text-muted-foreground italic">No content</p>;

    return (
      <div
        data-searchable
        className="prose prose-sm dark:prose-invert max-w-none [&_*]:!text-base [&_*]:!leading-relaxed whitespace-pre-line pb-4"
        style={{ fontSize: '1rem', lineHeight: '1.65' }}
        dangerouslySetInnerHTML={{ __html: element.content.value }}
      />
    );
  };

  const renderMacro = (element) => {
    if (!element.content?.title && !element.content?.description) {
      return <p className="text-sm text-muted-foreground italic">No content</p>;
    }

    return (
      <div className="space-y-4 pt-2 pb-4">
        {/* Macro Title */}
        {element.content.title && (
          <div
            data-searchable
            className="font-semibold [&_*]:!text-lg [&_*]:!leading-snug whitespace-pre-line text-foreground"
            style={{ fontSize: '1.125rem', lineHeight: '1.6' }}
            dangerouslySetInnerHTML={{ __html: element.content.title }}
          />
        )}

        {/* Macro Description */}
        {element.content.description && (
          <div
            data-searchable
            className="prose prose-sm dark:prose-invert max-w-none [&_*]:!text-base [&_*]:!leading-relaxed whitespace-pre-line"
            style={{ fontSize: '1rem', lineHeight: '1.65' }}
            dangerouslySetInnerHTML={{ __html: element.content.description }}
          />
        )}
      </div>
    );
  };

  const renderExample = (element) => {
    if (!element.content?.examples || element.content.examples.length === 0) {
      return <p className="text-sm text-muted-foreground italic">No content</p>;
    }

    return (
      <div className="space-y-6 pt-2 pb-4">
        {element.content.examples.map((example, exIdx) => (
          <div key={exIdx} className="space-y-3">
            {/* Example Title */}
            {example.title && (
              <div
                data-searchable
                className="font-semibold [&_*]:!text-lg [&_*]:!leading-snug whitespace-pre-line text-foreground"
                style={{ fontSize: '1.125rem', lineHeight: '1.6' }}
                dangerouslySetInnerHTML={{ __html: example.title }}
              />
            )}

            {/* Example Messages */}
            {example.messages && example.messages.length > 0 && (
              <div className="space-y-3">
                {example.messages.map((msg, msgIdx) => (
                  <div
                    key={msgIdx}
                    className={`p-4 rounded-lg transition-all hover:shadow-md ${
                      msg.type === 'user'
                        ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50'
                        : 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50'
                    }`}
                  >
                    <div className="text-xs font-semibold mb-2 uppercase tracking-wider text-muted-foreground">
                      {msg.type === 'user' ? 'User' : 'Agent'}
                    </div>
                    <div
                      data-searchable
                      className="prose prose-sm dark:prose-invert max-w-none [&_*]:!text-sm [&_*]:!leading-relaxed whitespace-pre-line"
                      style={{ fontSize: '0.875rem', lineHeight: '1.65' }}
                      dangerouslySetInnerHTML={{ __html: msg.text }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (sortedWrappers.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="mb-4 text-muted-foreground/40">
            <Send className="w-16 h-16 mx-auto" />
          </div>
          <p className="text-2xl font-semibold text-foreground mb-3">No Posts Available</p>
          <p className="text-base text-muted-foreground leading-relaxed">Create a wrapper in edit mode to start viewing your posts here.</p>
        </div>
      </div>
    );
  }

  if (!currentWrapper) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="mb-4 text-muted-foreground/40">
            <Search className="w-16 h-16 mx-auto" />
          </div>
          <p className="text-2xl font-semibold text-foreground mb-3">Wrapper Not Found</p>
          <p className="text-base text-muted-foreground leading-relaxed">The wrapper you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Header with Title - Sticky and Enhanced */}
      <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur-sm shadow-sm px-6 py-5">
        <div className="flex items-center justify-between gap-6">
          {/* Left: Navigation + Title */}
          <div className="flex items-center gap-5 flex-1 min-w-0">
            {/* Navigation Arrows */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={goToPrevious}
                disabled={currentWrapperIndex >= sortedWrappers.length - 1}
                className="p-2.5 rounded-lg border border-input bg-background hover:bg-accent hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 shadow-sm"
                title="Previous post (← Arrow Key)"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={goToNext}
                disabled={currentWrapperIndex === 0}
                className="p-2.5 rounded-lg border border-input bg-background hover:bg-accent hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 shadow-sm"
                title="Next post (→ Arrow Key)"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Title */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold truncate text-foreground" data-searchable>
                {wrapperElements.title?.content?.value
                  ? stripHtml(wrapperElements.title.content.value)
                  : 'Untitled Post'}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Post {currentWrapperIndex + 1} of {sortedWrappers.length}
              </p>
            </div>
          </div>

          {/* Right: Search + Mode Dropdown */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in post..."
                title="Search in post (Ctrl/Cmd + F)"
                className={`flex h-10 rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all ${
                  searchResults.length > 0 ? 'w-80 pr-28' : 'w-64'
                }`}
              />
              {searchResults.length > 0 && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-background px-2 rounded-md z-20 border border-border">
                  <span className="text-xs text-foreground mr-1 font-semibold whitespace-nowrap">
                    {currentSearchIndex + 1}/{searchResults.length}
                  </span>
                  <button
                    onClick={goToPrevSearchResult}
                    className="p-1.5 rounded-md bg-muted hover:bg-accent transition-colors"
                    title="Previous result"
                  >
                    <ChevronUp className="h-3.5 w-3.5 text-foreground" />
                  </button>
                  <button
                    onClick={goToNextSearchResult}
                    className="p-1.5 rounded-md bg-muted hover:bg-accent transition-colors"
                    title="Next result"
                  >
                    <ChevronDown className="h-3.5 w-3.5 text-foreground" />
                  </button>
                </div>
              )}
            </div>

            {/* Mode Dropdown */}
            <ViewModeDropdown
              currentMode="post-view"
              onModeChange={onModeChange}
              canEditContent={canEditContent}
            />
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="border-t border-border/30 bg-muted/10 px-6 py-2">
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border border-border">←</kbd>
            <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border border-border">→</kbd>
            Navigate posts
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border border-border">Ctrl</kbd>
            <span>+</span>
            <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border border-border">F</kbd>
            Search
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border border-border">Ctrl</kbd>
            <span>+</span>
            <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border border-border">G</kbd>
            Next result
          </span>
        </div>
      </div>

      {/* Three Column Layout */}
      <div className="flex-1 flex overflow-hidden bg-muted/20">
        {/* Description Column */}
        <div className="w-1/3 border-r border-border/50 overflow-y-auto scroll-smooth">
          <div className="px-8 py-8">
            <div className="max-w-2xl mx-auto">
              <div className="mb-6 pb-4 border-b-2 border-primary/20">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Description
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Background and context</p>
              </div>
              {wrapperElements.descriptions.length > 0 ? (
                <div className="space-y-0">
                  {wrapperElements.descriptions.map((el, idx) => (
                    <React.Fragment key={el._id}>
                      {idx > 0 && <div className="border-t border-border/40 my-8" />}
                      {renderDescription(el)}
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-8">No description elements</p>
              )}
            </div>
          </div>
        </div>

        {/* Macro Column */}
        <div className="w-1/3 border-r border-border/50 overflow-y-auto scroll-smooth bg-card/30">
          <div className="px-8 py-8">
            <div className="max-w-2xl mx-auto">
              <div className="mb-6 pb-4 border-b-2 border-primary/20">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Macro
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Key concepts and instructions</p>
              </div>
              {wrapperElements.macros.length > 0 ? (
                <div className="space-y-0">
                  {wrapperElements.macros.map((el, idx) => (
                    <React.Fragment key={el._id}>
                      {idx > 0 && <div className="border-t border-border/40 my-8" />}
                      {renderMacro(el)}
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-8">No macro elements</p>
              )}
            </div>
          </div>
        </div>

        {/* Example Column */}
        <div className="w-1/3 overflow-y-auto scroll-smooth">
          <div className="px-8 py-8">
            <div className="max-w-2xl mx-auto">
              <div className="mb-6 pb-4 border-b-2 border-primary/20">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Example
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Practical demonstrations</p>
              </div>
              {wrapperElements.examples.length > 0 ? (
                <div className="space-y-0">
                  {wrapperElements.examples.map((el, idx) => (
                    <React.Fragment key={el._id}>
                      {idx > 0 && <div className="border-t border-border/40 my-8" />}
                      {renderExample(el)}
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-8">No example elements</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add search highlight styles */}
      <style>{`
        .search-highlight {
          background: linear-gradient(120deg, #fef08a 0%, #fde047 100%);
          padding: 2px 4px;
          border-radius: 3px;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .dark .search-highlight {
          background: linear-gradient(120deg, #854d0e 0%, #a16207 100%);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
        .current-search-highlight {
          background: linear-gradient(120deg, #fb923c 0%, #f97316 100%);
          font-weight: 600;
          padding: 3px 5px;
          box-shadow: 0 2px 6px rgba(251, 146, 60, 0.4);
          animation: pulse-highlight 1.5s ease-in-out infinite;
        }
        .dark .current-search-highlight {
          background: linear-gradient(120deg, #ea580c 0%, #dc2626 100%);
          box-shadow: 0 2px 6px rgba(234, 88, 12, 0.5);
        }

        @keyframes pulse-highlight {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        /* Smooth scroll behavior */
        .scroll-smooth {
          scroll-behavior: smooth;
        }

        /* Custom scrollbar for columns */
        .scroll-smooth::-webkit-scrollbar {
          width: 10px;
        }

        .scroll-smooth::-webkit-scrollbar-track {
          background: transparent;
          margin: 8px 0;
        }

        .scroll-smooth::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.3);
          border-radius: 5px;
          transition: background 0.2s ease;
        }

        .scroll-smooth::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.5);
        }
      `}</style>
    </div>
  );
};

export default PostView;
