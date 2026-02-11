import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const ZenMoveContext = createContext();

export const useZenMove = () => {
  const context = useContext(ZenMoveContext);
  if (!context) {
    throw new Error('useZenMove must be used within a ZenMoveProvider');
  }
  return context;
};

export const ZenMoveProvider = ({ children }) => {
  const { user } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL;

  // Core state - persisted to localStorage
  const [zenMoveActive, setZenMoveActive] = useState(() => {
    return localStorage.getItem('zenMoveActive') === 'true';
  });
  const [selectedAgentId, setSelectedAgentId] = useState(() => {
    return localStorage.getItem('zenMoveSelectedAgent') || null;
  });

  // Extraction data from server
  const [extractionCounts, setExtractionCounts] = useState([]);
  const [extractionTarget, setExtractionTarget] = useState(8);

  const getAuthHeaders = useCallback(() => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  }), []);

  // Persist toggle to localStorage
  useEffect(() => {
    localStorage.setItem('zenMoveActive', zenMoveActive);
  }, [zenMoveActive]);

  useEffect(() => {
    if (selectedAgentId) {
      localStorage.setItem('zenMoveSelectedAgent', selectedAgentId);
    } else {
      localStorage.removeItem('zenMoveSelectedAgent');
    }
  }, [selectedAgentId]);

  // Fetch extraction counts
  const fetchExtractionCounts = useCallback(async () => {
    if (!user) return;
    try {
      const response = await axios.get(
        `${API_URL}/api/qa/zenmove/extraction-counts`,
        getAuthHeaders()
      );
      setExtractionCounts(response.data.counts);
      setExtractionTarget(response.data.extractionTarget);
    } catch (err) {
      console.error('Error fetching extraction counts:', err);
    }
  }, [API_URL, getAuthHeaders, user]);

  // Fetch when ZenMove activates or user loads
  useEffect(() => {
    if (zenMoveActive && user) {
      fetchExtractionCounts();
    }
  }, [zenMoveActive, user, fetchExtractionCounts]);

  // Toggle function
  const toggleZenMove = useCallback(() => {
    setZenMoveActive(prev => !prev);
  }, []);

  // Get count for specific agent
  const getAgentExtractionCount = useCallback((agentId) => {
    const entry = extractionCounts.find(c => c.agentId === agentId);
    return entry ? entry.count : 0;
  }, [extractionCounts]);

  // Increment count locally after ticket creation (optimistic update)
  const incrementExtractionCount = useCallback((agentId) => {
    setExtractionCounts(prev => {
      const existing = prev.find(c => c.agentId === agentId);
      if (existing) {
        return prev.map(c => c.agentId === agentId ? { ...c, count: c.count + 1 } : c);
      }
      return [...prev, { agentId, count: 1 }];
    });
  }, []);

  // Update settings (admin only)
  const updateExtractionTarget = useCallback(async (newTarget) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/qa/zenmove/settings`,
        { extractionTarget: newTarget },
        getAuthHeaders()
      );
      setExtractionTarget(response.data.extractionTarget);
      return true;
    } catch (err) {
      console.error('Error updating ZenMove settings:', err);
      return false;
    }
  }, [API_URL, getAuthHeaders]);

  // Total progress across all agents
  const getTotalExtracted = useCallback(() => {
    return extractionCounts.reduce((sum, c) => sum + c.count, 0);
  }, [extractionCounts]);

  const value = {
    zenMoveActive,
    toggleZenMove,
    selectedAgentId,
    setSelectedAgentId,
    extractionCounts,
    extractionTarget,
    fetchExtractionCounts,
    getAgentExtractionCount,
    incrementExtractionCount,
    updateExtractionTarget,
    getTotalExtracted,
  };

  return (
    <ZenMoveContext.Provider value={value}>
      {children}
    </ZenMoveContext.Provider>
  );
};
