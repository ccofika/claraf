import { useState, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export const useMacros = () => {
  const [macros, setMacros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all macros for current user
  const fetchMacros = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/api/qa/macros`, getAuthHeaders());
      setMacros(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching macros:', err);
      setError(err.response?.data?.message || 'Failed to fetch macros');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Search macros by partial title match
  const searchMacros = useCallback(async (term) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/qa/macros/search?q=${encodeURIComponent(term)}`,
        getAuthHeaders()
      );
      return response.data;
    } catch (err) {
      console.error('Error searching macros:', err);
      return [];
    }
  }, []);

  // Get single macro by ID
  const getMacro = useCallback(async (id) => {
    try {
      const response = await axios.get(`${API_URL}/api/qa/macros/${id}`, getAuthHeaders());
      return response.data;
    } catch (err) {
      console.error('Error fetching macro:', err);
      return null;
    }
  }, []);

  // Create new macro
  const createMacro = useCallback(async (data) => {
    try {
      const response = await axios.post(`${API_URL}/api/qa/macros`, data, getAuthHeaders());
      setMacros(prev => [...prev, response.data]);
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error creating macro:', err);
      return { success: false, error: err.response?.data?.message || 'Failed to create macro' };
    }
  }, []);

  // Update macro
  const updateMacro = useCallback(async (id, data) => {
    try {
      const response = await axios.put(`${API_URL}/api/qa/macros/${id}`, data, getAuthHeaders());
      setMacros(prev => prev.map(m => m._id === id ? response.data : m));
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error updating macro:', err);
      return { success: false, error: err.response?.data?.message || 'Failed to update macro' };
    }
  }, []);

  // Delete macro
  const deleteMacro = useCallback(async (id) => {
    try {
      await axios.delete(`${API_URL}/api/qa/macros/${id}`, getAuthHeaders());
      setMacros(prev => prev.filter(m => m._id !== id));
      return { success: true };
    } catch (err) {
      console.error('Error deleting macro:', err);
      return { success: false, error: err.response?.data?.message || 'Failed to delete macro' };
    }
  }, []);

  // Record macro usage for a ticket
  const recordUsage = useCallback(async (macroId, ticketId, ticketNumber) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/qa/macros/${macroId}/use`,
        { ticketId, ticketNumber },
        getAuthHeaders()
      );
      // Update local state with new usage data
      setMacros(prev => prev.map(m => m._id === macroId ? response.data : m));
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error recording macro usage:', err);
      return { success: false, error: err.response?.data?.message || 'Failed to record usage' };
    }
  }, []);

  // Get tickets where macro was used (paginated)
  const getMacroTickets = useCallback(async (macroId, limit = 10, offset = 0) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/qa/macros/${macroId}/tickets?limit=${limit}&offset=${offset}`,
        getAuthHeaders()
      );
      return response.data;
    } catch (err) {
      console.error('Error fetching macro tickets:', err);
      return { tickets: [], total: 0, hasMore: false };
    }
  }, []);

  // Get QA graders for sharing
  const fetchQAGraders = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/qa/macros/graders`, getAuthHeaders());
      return response.data;
    } catch (err) {
      console.error('Error fetching QA graders:', err);
      return [];
    }
  }, []);

  return {
    macros,
    loading,
    error,
    fetchMacros,
    searchMacros,
    getMacro,
    createMacro,
    updateMacro,
    deleteMacro,
    recordUsage,
    getMacroTickets,
    fetchQAGraders
  };
};

export default useMacros;
