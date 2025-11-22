import { useState, useEffect } from 'react';

const QA_SAVED_SEARCHES_KEY = 'qa_saved_searches';

export const useQASavedSearches = () => {
  const [savedSearches, setSavedSearches] = useState([]);

  useEffect(() => {
    // Load from localStorage
    try {
      const stored = localStorage.getItem(QA_SAVED_SEARCHES_KEY);
      if (stored) {
        setSavedSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading saved searches:', error);
    }
  }, []);

  const saveSearch = (name, query, filters = {}, searchMode = 'ai') => {
    const newSearch = {
      id: Date.now().toString(),
      name,
      query,
      filters,
      searchMode,
      createdAt: new Date().toISOString(),
      usageCount: 0
    };

    setSavedSearches((prev) => {
      const updated = [...prev, newSearch];
      try {
        localStorage.setItem(QA_SAVED_SEARCHES_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving search:', error);
      }
      return updated;
    });

    return newSearch;
  };

  const deleteSearch = (id) => {
    setSavedSearches((prev) => {
      const updated = prev.filter((search) => search.id !== id);
      try {
        localStorage.setItem(QA_SAVED_SEARCHES_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error deleting search:', error);
      }
      return updated;
    });
  };

  const updateSearch = (id, updates) => {
    setSavedSearches((prev) => {
      const updated = prev.map((search) =>
        search.id === id ? { ...search, ...updates } : search
      );
      try {
        localStorage.setItem(QA_SAVED_SEARCHES_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error updating search:', error);
      }
      return updated;
    });
  };

  const incrementUsageCount = (id) => {
    setSavedSearches((prev) => {
      const updated = prev.map((search) =>
        search.id === id
          ? { ...search, usageCount: (search.usageCount || 0) + 1, lastUsedAt: new Date().toISOString() }
          : search
      );
      try {
        localStorage.setItem(QA_SAVED_SEARCHES_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error incrementing usage count:', error);
      }
      return updated;
    });
  };

  const getPopularSearches = (limit = 5) => {
    return [...savedSearches]
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, limit);
  };

  return {
    savedSearches,
    saveSearch,
    deleteSearch,
    updateSearch,
    incrementUsageCount,
    getPopularSearches
  };
};
