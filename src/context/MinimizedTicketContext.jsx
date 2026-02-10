import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const MinimizedTicketContext = createContext();

export const useMinimizedTicket = () => {
  const context = useContext(MinimizedTicketContext);
  if (!context) {
    throw new Error('useMinimizedTicket must be used within a MinimizedTicketProvider');
  }
  return context;
};

export const MinimizedTicketProvider = ({ children }) => {
  const { user } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL;
  const [minimizedTicket, setMinimizedTicket] = useState(null);
  const [restoreRequested, setRestoreRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const minimizedTicketRef = useRef(null);

  // Warp morph animation state
  const [warpAnimation, setWarpAnimation] = useState(null);
  const [dockAppearance, setDockAppearance] = useState('normal');
  const [restoreAnimation, setRestoreAnimation] = useState(null);

  const getAuthHeaders = useCallback(() => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  }), []);

  // Keep ref in sync for sendBeacon access
  useEffect(() => {
    minimizedTicketRef.current = minimizedTicket;
  }, [minimizedTicket]);

  // Fetch minimized ticket on mount (handles refresh/reopen recovery)
  const fetchMinimizedTicket = useCallback(async () => {
    if (!user) return;
    try {
      const response = await axios.get(`${API_URL}/api/qa/minimized-ticket`, getAuthHeaders());
      setMinimizedTicket(response.data);
    } catch {
      // 404 means no minimized ticket - that's fine
      setMinimizedTicket(null);
    }
  }, [API_URL, getAuthHeaders, user]);

  useEffect(() => {
    if (user) {
      fetchMinimizedTicket();
    }
  }, [user, fetchMinimizedTicket]);

  // Save/minimize a ticket
  const minimizeTicket = useCallback(async (data) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/api/qa/minimized-ticket`, data, getAuthHeaders());
      setMinimizedTicket(response.data);
    } catch (err) {
      console.error('Error saving minimized ticket:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL, getAuthHeaders]);

  // Clear minimized ticket (on restore or save)
  const clearMinimizedTicket = useCallback(async () => {
    try {
      await axios.delete(`${API_URL}/api/qa/minimized-ticket`, getAuthHeaders());
      setMinimizedTicket(null);
    } catch (err) {
      console.error('Error clearing minimized ticket:', err);
      setMinimizedTicket(null);
    }
  }, [API_URL, getAuthHeaders]);

  // Warp animation controls
  const startWarpAnimation = useCallback((isDark) => {
    setWarpAnimation({ isDark });
    setDockAppearance({ mode: 'warp-materialize', isDark });
  }, []);

  const clearWarpAnimation = useCallback(() => {
    setWarpAnimation(null);
  }, []);

  const clearDockAppearance = useCallback(() => {
    setDockAppearance(null);
  }, []);

  // Restore (reverse warp) animation controls
  const startRestoreAnimation = useCallback((isDark) => {
    setRestoreAnimation({ isDark });
  }, []);

  const clearRestoreAnimation = useCallback(() => {
    setRestoreAnimation(null);
  }, []);

  // Save via sendBeacon (for beforeunload - fire and forget)
  const saveViaBeacon = useCallback((data) => {
    const token = localStorage.getItem('token');
    if (!token || !API_URL) return;
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    navigator.sendBeacon(`${API_URL}/api/qa/minimized-ticket/beacon?token=${token}`, blob);
  }, [API_URL]);

  const value = {
    minimizedTicket,
    setMinimizedTicket,
    minimizeTicket,
    clearMinimizedTicket,
    fetchMinimizedTicket,
    saveViaBeacon,
    minimizedTicketRef,
    restoreRequested,
    setRestoreRequested,
    loading,
    warpAnimation,
    startWarpAnimation,
    clearWarpAnimation,
    dockAppearance,
    clearDockAppearance,
    restoreAnimation,
    startRestoreAnimation,
    clearRestoreAnimation,
  };

  return (
    <MinimizedTicketContext.Provider value={value}>
      {children}
    </MinimizedTicketContext.Provider>
  );
};

export default MinimizedTicketContext;
