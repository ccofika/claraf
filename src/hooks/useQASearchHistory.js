import { useState, useEffect } from 'react';

const QA_SEARCH_HISTORY_KEY = 'qa_search_history';
const MAX_HISTORY_ITEMS = 20;

export const useQASearchHistory = () => {
  const [searchHistory, setSearchHistory] = useState([]);

  useEffect(() => {
    // Load from localStorage
    try {
      const stored = localStorage.getItem(QA_SEARCH_HISTORY_KEY);
      if (stored) {
        setSearchHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  }, []);

  const addToHistory = (query, filters = {}, results = 0) => {
    const newEntry = {
      query,
      filters,
      results,
      timestamp: new Date().toISOString()
    };

    setSearchHistory((prev) => {
      // Remove duplicate queries
      const filtered = prev.filter(
        (item) => item.query.toLowerCase() !== query.toLowerCase()
      );

      // Add new entry at the beginning
      const updated = [newEntry, ...filtered].slice(0, MAX_HISTORY_ITEMS);

      // Save to localStorage
      try {
        localStorage.setItem(QA_SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving search history:', error);
      }

      return updated;
    });
  };

  const removeFromHistory = (timestamp) => {
    setSearchHistory((prev) => {
      const updated = prev.filter((item) => item.timestamp !== timestamp);
      try {
        localStorage.setItem(QA_SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error updating search history:', error);
      }
      return updated;
    });
  };

  const clearHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem(QA_SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  };

  const getRecentSearches = (limit = 5) => {
    return searchHistory.slice(0, limit);
  };

  return {
    searchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getRecentSearches
  };
};
