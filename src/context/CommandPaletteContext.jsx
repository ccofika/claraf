import React, { createContext, useState, useCallback, useEffect } from 'react';

export const CommandPaletteContext = createContext();

export const CommandPaletteProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    elementTypes: [],
    workspaceIds: [],
    dateRange: null,
    advanced: {}
  });

  // Open command palette
  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Close command palette
  const close = useCallback(() => {
    setIsOpen(false);
    // Clear search when closing (optional - can be removed if you want to keep search state)
    setTimeout(() => {
      setSearchQuery('');
    }, 200); // Delay to allow closing animation
  }, []);

  // Toggle command palette
  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Set search query
  const setQuery = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  // Clear search query
  const clearQuery = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Add filter
  const addFilter = useCallback((filterType, value) => {
    setActiveFilters(prev => {
      if (filterType === 'elementTypes' || filterType === 'workspaceIds') {
        // Array-based filters (multi-select)
        if (!prev[filterType].includes(value)) {
          return {
            ...prev,
            [filterType]: [...prev[filterType], value]
          };
        }
      } else if (filterType === 'dateRange') {
        // Date range filter
        return {
          ...prev,
          dateRange: value
        };
      } else {
        // Advanced filters
        return {
          ...prev,
          advanced: {
            ...prev.advanced,
            [filterType]: value
          }
        };
      }
      return prev;
    });
  }, []);

  // Remove filter
  const removeFilter = useCallback((filterType, value) => {
    setActiveFilters(prev => {
      if (filterType === 'elementTypes' || filterType === 'workspaceIds') {
        return {
          ...prev,
          [filterType]: prev[filterType].filter(item => item !== value)
        };
      } else if (filterType === 'dateRange') {
        return {
          ...prev,
          dateRange: null
        };
      } else {
        // Advanced filters
        const newAdvanced = { ...prev.advanced };
        delete newAdvanced[filterType];
        return {
          ...prev,
          advanced: newAdvanced
        };
      }
    });
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setActiveFilters({
      elementTypes: [],
      workspaceIds: [],
      dateRange: null,
      advanced: {}
    });
  }, []);

  // Toggle element type filter
  const toggleElementType = useCallback((elementType) => {
    setActiveFilters(prev => {
      const isActive = prev.elementTypes.includes(elementType);
      return {
        ...prev,
        elementTypes: isActive
          ? prev.elementTypes.filter(type => type !== elementType)
          : [...prev.elementTypes, elementType]
      };
    });
  }, []);

  // Toggle workspace filter
  const toggleWorkspace = useCallback((workspaceId) => {
    setActiveFilters(prev => {
      const isActive = prev.workspaceIds.includes(workspaceId);
      return {
        ...prev,
        workspaceIds: isActive
          ? prev.workspaceIds.filter(id => id !== workspaceId)
          : [...prev.workspaceIds, workspaceId]
      };
    });
  }, []);

  // Set date range filter
  const setDateRange = useCallback((dateRange) => {
    setActiveFilters(prev => ({
      ...prev,
      dateRange
    }));
  }, []);

  // Set filters directly (for loading saved searches)
  const setFilters = useCallback((filters) => {
    setActiveFilters(filters || {
      elementTypes: [],
      workspaceIds: [],
      dateRange: null,
      advanced: {}
    });
  }, []);

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K to toggle command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }

      // Escape to close command palette
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggle, close]);

  // Count active filters
  const activeFilterCount =
    activeFilters.elementTypes.length +
    activeFilters.workspaceIds.length +
    (activeFilters.dateRange ? 1 : 0) +
    Object.keys(activeFilters.advanced).length;

  const value = {
    isOpen,
    searchQuery,
    activeFilters,
    activeFilterCount,
    open,
    close,
    toggle,
    setQuery,
    clearQuery,
    addFilter,
    removeFilter,
    clearAllFilters,
    toggleElementType,
    toggleWorkspace,
    setDateRange,
    setFilters
  };

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
    </CommandPaletteContext.Provider>
  );
};
