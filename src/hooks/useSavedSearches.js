import { useState, useEffect } from 'react';

const SAVED_SEARCHES_KEY = 'command_palette_saved_searches';
const MAX_SAVED_SEARCHES = 5;

export const useSavedSearches = () => {
  const [savedSearches, setSavedSearches] = useState([]);

  // Load saved searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SAVED_SEARCHES_KEY);
      if (stored) {
        setSavedSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading saved searches:', error);
    }
  }, []);

  // Save a new search
  const saveSearch = (name, query, filters) => {
    setSavedSearches(prevSearches => {
      // Check if already exists
      const exists = prevSearches.find(s => s.name === name);
      if (exists) {
        return prevSearches; // Don't save duplicates
      }

      // Create new saved search
      const newSearch = {
        id: Date.now().toString(),
        name,
        query,
        filters,
        createdAt: new Date().toISOString()
      };

      // Add to beginning, keep max limit
      const newSearches = [newSearch, ...prevSearches].slice(0, MAX_SAVED_SEARCHES);

      // Save to localStorage
      try {
        localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(newSearches));
      } catch (error) {
        console.error('Error saving search:', error);
      }

      return newSearches;
    });
  };

  // Remove a saved search
  const removeSearch = (id) => {
    setSavedSearches(prevSearches => {
      const newSearches = prevSearches.filter(s => s.id !== id);

      try {
        localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(newSearches));
      } catch (error) {
        console.error('Error removing saved search:', error);
      }

      return newSearches;
    });
  };

  // Clear all saved searches
  const clearSavedSearches = () => {
    setSavedSearches([]);
    try {
      localStorage.removeItem(SAVED_SEARCHES_KEY);
    } catch (error) {
      console.error('Error clearing saved searches:', error);
    }
  };

  return {
    savedSearches,
    saveSearch,
    removeSearch,
    clearSavedSearches,
    canSaveMore: savedSearches.length < MAX_SAVED_SEARCHES
  };
};
