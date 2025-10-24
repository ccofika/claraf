import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, ChevronUp, ChevronDown } from 'lucide-react';
import ViewModeDropdown from './ViewModeDropdown';

const PostView = ({ wrappers = [], allElements = [], currentWorkspace, onModeChange, canEditContent }) => {
  const [currentWrapperIndex, setCurrentWrapperIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

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

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      // Remove all highlights
      document.querySelectorAll('.search-highlight').forEach(el => {
        el.classList.remove('search-highlight', 'current-search-highlight');
      });
      return;
    }

    // Find all text nodes containing search query
    const results = [];
    const containers = document.querySelectorAll('[data-searchable]');

    containers.forEach((container) => {
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

    // Highlight results and scroll to first
    if (results.length > 0) {
      highlightSearchResults(results, 0);
    }
  }, [searchQuery]);

  const highlightSearchResults = (results, currentIndex) => {
    // Clear previous highlights
    document.querySelectorAll('.search-highlight').forEach(el => {
      const parent = el.parentNode;
      parent.replaceChild(document.createTextNode(el.textContent), el);
      parent.normalize();
    });

    results.forEach((result, idx) => {
      const container = result.container;
      const text = container.textContent || '';
      const lowerText = text.toLowerCase();
      const lowerQuery = searchQuery.toLowerCase();

      // Create a document fragment for safe manipulation
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      let matchIndex = lowerText.indexOf(lowerQuery);

      while (matchIndex !== -1) {
        // Add text before match
        if (matchIndex > lastIndex) {
          fragment.appendChild(document.createTextNode(text.substring(lastIndex, matchIndex)));
        }

        // Add highlighted match
        const mark = document.createElement('mark');
        mark.className = 'search-highlight' + (idx === currentIndex ? ' current-search-highlight' : '');
        mark.textContent = text.substr(matchIndex, searchQuery.length);
        fragment.appendChild(mark);

        lastIndex = matchIndex + searchQuery.length;
        matchIndex = lowerText.indexOf(lowerQuery, lastIndex);
      }

      // Add remaining text
      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
      }

      // Replace container content
      container.textContent = '';
      container.appendChild(fragment);
    });

    // Scroll to current result
    if (results[currentIndex]) {
      const currentHighlight = document.querySelector('.current-search-highlight');
      if (currentHighlight) {
        currentHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const goToNextSearchResult = () => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    highlightSearchResults(searchResults, nextIndex);
  };

  const goToPrevSearchResult = () => {
    if (searchResults.length === 0) return;
    const prevIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
    setCurrentSearchIndex(prevIndex);
    highlightSearchResults(searchResults, prevIndex);
  };

  // Render element content with proper formatting
  const renderDescription = (element) => {
    if (!element.content?.value) return <p className="text-sm text-muted-foreground">No content</p>;

    return (
      <div
        data-searchable
        className="[&_*]:!text-xs [&_*]:!leading-relaxed whitespace-pre-line pb-3"
        style={{ fontSize: '0.75rem', lineHeight: '1.5' }}
        dangerouslySetInnerHTML={{ __html: element.content.value }}
      />
    );
  };

  const renderMacro = (element) => {
    if (!element.content?.title && !element.content?.description) {
      return <p className="text-sm text-muted-foreground">No content</p>;
    }

    return (
      <div className="space-y-3 pt-2 pb-3">
        {/* Macro Title */}
        {element.content.title && (
          <div
            data-searchable
            className="font-semibold [&_*]:!text-base [&_*]:!leading-relaxed whitespace-pre-line"
            style={{ fontSize: '1rem', lineHeight: '1.5' }}
            dangerouslySetInnerHTML={{ __html: element.content.title }}
          />
        )}

        {/* Macro Description */}
        {element.content.description && (
          <div
            data-searchable
            className="[&_*]:!text-xs [&_*]:!leading-relaxed whitespace-pre-line"
            style={{ fontSize: '0.75rem', lineHeight: '1.5' }}
            dangerouslySetInnerHTML={{ __html: element.content.description }}
          />
        )}
      </div>
    );
  };

  const renderExample = (element) => {
    if (!element.content?.examples || element.content.examples.length === 0) {
      return <p className="text-sm text-muted-foreground">No content</p>;
    }

    return (
      <div className="space-y-4 pt-2 pb-3">
        {element.content.examples.map((example, exIdx) => (
          <div key={exIdx} className="space-y-2">
            {/* Example Title */}
            {example.title && (
              <div
                data-searchable
                className="font-semibold [&_*]:!text-base [&_*]:!leading-relaxed whitespace-pre-line"
                style={{ fontSize: '1rem', lineHeight: '1.5' }}
                dangerouslySetInnerHTML={{ __html: example.title }}
              />
            )}

            {/* Example Messages */}
            {example.messages && example.messages.length > 0 && (
              <div className="space-y-2">
                {example.messages.map((msg, msgIdx) => (
                  <div
                    key={msgIdx}
                    className={`p-3 rounded-lg ${
                      msg.type === 'user'
                        ? 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900'
                        : 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900'
                    }`}
                  >
                    <div className="text-xs font-medium mb-1 uppercase tracking-wide text-muted-foreground">
                      {msg.type === 'user' ? 'User' : 'Agent'}
                    </div>
                    <div
                      data-searchable
                      className="[&_*]:!text-xs [&_*]:!leading-relaxed whitespace-pre-line"
                      style={{ fontSize: '0.75rem', lineHeight: '1.5' }}
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
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground">No wrapper posts available</p>
          <p className="text-sm text-muted-foreground mt-2">Create a wrapper in edit mode to view posts</p>
        </div>
      </div>
    );
  }

  if (!currentWrapper) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground">Wrapper not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Header with Title */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Navigation + Title */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Navigation Arrows */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={goToPrevious}
                disabled={currentWrapperIndex >= sortedWrappers.length - 1}
                className="p-2 rounded-md border border-input bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous post"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={goToNext}
                disabled={currentWrapperIndex === 0}
                className="p-2 rounded-md border border-input bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next post"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Title */}
            <h1 className="text-xl font-bold truncate" data-searchable>
              {wrapperElements.title?.content?.value
                ? stripHtml(wrapperElements.title.content.value)
                : 'Untitled Post'}
            </h1>
          </div>

          {/* Right: Search + Mode Dropdown */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in post..."
                className={`flex h-9 rounded-md border border-input bg-background pl-9 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-all ${
                  searchResults.length > 0 ? 'w-80 pr-28' : 'w-64 pr-3'
                }`}
              />
              {searchResults.length > 0 && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 bg-background px-1 rounded z-20">
                  <span className="text-xs text-foreground mr-1 font-semibold whitespace-nowrap">
                    {currentSearchIndex + 1}/{searchResults.length}
                  </span>
                  <button
                    onClick={goToPrevSearchResult}
                    className="p-1.5 rounded bg-muted hover:bg-accent transition-colors"
                    title="Previous result"
                  >
                    <ChevronUp className="h-3.5 w-3.5 text-foreground" />
                  </button>
                  <button
                    onClick={goToNextSearchResult}
                    className="p-1.5 rounded bg-muted hover:bg-accent transition-colors"
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

      {/* Three Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Description Column */}
        <div className="w-1/3 border-r overflow-y-auto">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 uppercase tracking-wide text-muted-foreground">
              Description
            </h2>
            {wrapperElements.descriptions.length > 0 ? (
              <div className="space-y-0">
                {wrapperElements.descriptions.map((el, idx) => (
                  <React.Fragment key={el._id}>
                    {idx > 0 && <div className="border-t my-6" />}
                    {renderDescription(el)}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No description elements</p>
            )}
          </div>
        </div>

        {/* Macro Column */}
        <div className="w-1/3 border-r overflow-y-auto">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 uppercase tracking-wide text-muted-foreground">
              Macro
            </h2>
            {wrapperElements.macros.length > 0 ? (
              <div className="space-y-0">
                {wrapperElements.macros.map((el, idx) => (
                  <React.Fragment key={el._id}>
                    {idx > 0 && <div className="border-t my-6" />}
                    {renderMacro(el)}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No macro elements</p>
            )}
          </div>
        </div>

        {/* Example Column */}
        <div className="w-1/3 overflow-y-auto">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 uppercase tracking-wide text-muted-foreground">
              Example
            </h2>
            {wrapperElements.examples.length > 0 ? (
              <div className="space-y-0">
                {wrapperElements.examples.map((el, idx) => (
                  <React.Fragment key={el._id}>
                    {idx > 0 && <div className="border-t my-6" />}
                    {renderExample(el)}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No example elements</p>
            )}
          </div>
        </div>
      </div>

      {/* Add search highlight styles */}
      <style>{`
        .search-highlight {
          background-color: #fef08a;
          padding: 0 2px;
          border-radius: 2px;
        }
        .dark .search-highlight {
          background-color: #854d0e;
        }
        .current-search-highlight {
          background-color: #fb923c;
          font-weight: 600;
        }
        .dark .current-search-highlight {
          background-color: #ea580c;
        }
      `}</style>
    </div>
  );
};

export default PostView;
