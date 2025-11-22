import { useState, useEffect } from 'react';

const SEARCH_HISTORY_KEY = 'command_palette_search_history';
const MAX_HISTORY_ITEMS = 10;

export const useSearchHistory = () => {
  const [history, setHistory] = useState([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  }, []);

  // Save search to history
  const addToHistory = (searchQuery) => {
    if (!searchQuery || !searchQuery.trim()) return;

    setHistory(prevHistory => {
      // Remove if already exists (to move to top)
      const filtered = prevHistory.filter(item => item.query !== searchQuery);

      // Add to beginning
      const newHistory = [
        {
          query: searchQuery,
          timestamp: new Date().toISOString()
        },
        ...filtered
      ].slice(0, MAX_HISTORY_ITEMS); // Keep only last N items

      // Save to localStorage
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      } catch (error) {
        console.error('Error saving search history:', error);
      }

      return newHistory;
    });
  };

  // Remove specific item from history
  const removeFromHistory = (query) => {
    setHistory(prevHistory => {
      const newHistory = prevHistory.filter(item => item.query !== query);

      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      } catch (error) {
        console.error('Error updating search history:', error);
      }

      return newHistory;
    });
  };

  // Clear all history
  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  };

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory
  };
};
