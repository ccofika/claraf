import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './AuthContext';

const KnowledgeBaseContext = createContext();

export const useKnowledgeBase = () => {
  const context = useContext(KnowledgeBaseContext);
  if (!context) {
    throw new Error('useKnowledgeBase must be used within a KnowledgeBaseProvider');
  }
  return context;
};

export const KnowledgeBaseProvider = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const API_URL = process.env.REACT_APP_API_URL;

  // Admin status
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Page data
  const [pageTree, setPageTree] = useState([]);
  const [currentPage, setCurrentPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);

  // Dropdown selections (session-only, not persisted)
  const [selections, setSelections] = useState({});

  // Navbar visibility
  const [showNavbar, setShowNavbar] = useState(true);

  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Sections (stored in database, shared across all users)
  const [sections, setSections] = useState([]);

  // Fetch sections from API
  const fetchSections = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/knowledge-base/sections`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSections(response.data);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  }, [API_URL]);

  // Section management
  const addSection = useCallback(async (name) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/knowledge-base/sections`,
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSections(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      console.error('Error creating section:', error);
      throw error;
    }
  }, [API_URL]);

  const removeSection = useCallback(async (sectionId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/knowledge-base/sections/${sectionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSections(prev => prev.filter(s => s._id !== sectionId));
    } catch (error) {
      console.error('Error deleting section:', error);
      throw error;
    }
  }, [API_URL]);

  const renameSection = useCallback(async (sectionId, newName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/api/knowledge-base/sections/${sectionId}`,
        { name: newName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSections(prev => prev.map(s =>
        s._id === sectionId ? response.data : s
      ));
    } catch (error) {
      console.error('Error renaming section:', error);
      throw error;
    }
  }, [API_URL]);

  // Check admin status on mount
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/knowledge-base/check-admin`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsAdmin(response.data.isAdmin);
        setIsSuperAdmin(response.data.isSuperAdmin);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        setIsSuperAdmin(false);
      }
    };

    checkAdmin();
  }, [user, API_URL]);

  // Fetch page tree
  const fetchPageTree = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/knowledge-base/pages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPageTree(response.data);
    } catch (error) {
      console.error('Error fetching page tree:', error);
      setPageTree([]);
    } finally {
      setLoading(false);
    }
  }, [user, API_URL]);

  // Fetch page tree and sections on mount
  useEffect(() => {
    if (user) {
      fetchPageTree();
      fetchSections();
    }
  }, [user, fetchPageTree, fetchSections]);

  // Load a page by slug
  const loadPage = useCallback(async (slug) => {
    if (!slug) {
      setCurrentPage(null);
      return;
    }

    try {
      setPageLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/knowledge-base/pages/by-slug/${slug}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const page = response.data;
      setCurrentPage(page);

      // Initialize selections with defaults for this page's dropdowns
      if (page.dropdowns && page.dropdowns.length > 0) {
        const defaults = {};
        page.dropdowns.forEach(dropdown => {
          defaults[dropdown.id] = dropdown.defaultValue || dropdown.options[0]?.value || '';
        });
        setSelections(defaults);
      } else {
        setSelections({});
      }
    } catch (error) {
      console.error('Error loading page:', error);
      setCurrentPage(null);
    } finally {
      setPageLoading(false);
    }
  }, [API_URL]);

  // Set a dropdown selection
  const setSelection = useCallback((dropdownId, value) => {
    setSelections(prev => ({
      ...prev,
      [dropdownId]: value
    }));
  }, []);

  // Reset all selections to defaults
  const resetSelections = useCallback(() => {
    if (!currentPage?.dropdowns) {
      setSelections({});
      return;
    }

    const defaults = {};
    currentPage.dropdowns.forEach(dropdown => {
      defaults[dropdown.id] = dropdown.defaultValue || dropdown.options[0]?.value || '';
    });
    setSelections(defaults);
  }, [currentPage]);

  // Resolve content for a block based on current selections
  const resolveContent = useCallback((block) => {
    if (!block) return '';
    if (!block.variants || Object.keys(block.variants).length === 0) {
      return block.defaultContent;
    }

    // Check for matching variant
    // Variant keys are in format "dropdownId:optionValue"
    const variants = block.variants instanceof Map
      ? Object.fromEntries(block.variants)
      : block.variants;

    for (const [key, content] of Object.entries(variants)) {
      const [dropdownId, optionValue] = key.split(':');
      if (selections[dropdownId] === optionValue) {
        return content;
      }
    }

    return block.defaultContent;
  }, [selections]);

  // Create a new page
  const createPage = useCallback(async (pageData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/knowledge-base/pages`,
        pageData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchPageTree();
      return response.data;
    } catch (error) {
      console.error('Error creating page:', error);
      throw error;
    }
  }, [API_URL, fetchPageTree]);

  // Update a page
  const updatePage = useCallback(async (pageId, updates) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/api/knowledge-base/pages/${pageId}`,
        updates,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh page tree and current page
      await fetchPageTree();
      if (currentPage?._id === pageId) {
        setCurrentPage(response.data);
      }

      return response.data;
    } catch (error) {
      console.error('Error updating page:', error);
      throw error;
    }
  }, [API_URL, fetchPageTree, currentPage]);

  // Delete a page
  const deletePage = useCallback(async (pageId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_URL}/api/knowledge-base/pages/${pageId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchPageTree();

      if (currentPage?._id === pageId) {
        setCurrentPage(null);
        navigate('/knowledge-base');
      }
    } catch (error) {
      console.error('Error deleting page:', error);
      throw error;
    }
  }, [API_URL, fetchPageTree, currentPage, navigate]);

  // Reorder a page (supports positional inserts and section assignment)
  const reorderPage = useCallback(async (pageId, newOrder, newParentPage, sectionId) => {
    try {
      const token = localStorage.getItem('token');
      const body = { newOrder, newParentPage };
      if (sectionId !== undefined) body.sectionId = sectionId;
      await axios.put(
        `${API_URL}/api/knowledge-base/pages/${pageId}/reorder`,
        body,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchPageTree();
    } catch (error) {
      console.error('Error reordering page:', error);
      throw error;
    }
  }, [API_URL, fetchPageTree]);

  // Update page section assignment
  const updatePageSection = useCallback(async (pageId, sectionId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/knowledge-base/pages/${pageId}`,
        { sectionId: sectionId || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchPageTree();
    } catch (error) {
      console.error('Error updating page section:', error);
      throw error;
    }
  }, [API_URL, fetchPageTree]);

  // Get admins (superadmin only)
  const getAdmins = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/knowledge-base/admins`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching admins:', error);
      throw error;
    }
  }, [API_URL]);

  // Add admin (superadmin only)
  const addAdmin = useCallback(async (email) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/knowledge-base/admins`,
        { email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error adding admin:', error);
      throw error;
    }
  }, [API_URL]);

  // Remove admin (superadmin only)
  const removeAdmin = useCallback(async (adminId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/knowledge-base/admins/${adminId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error removing admin:', error);
      throw error;
    }
  }, [API_URL]);

  // Get edit logs
  const getEditLogs = useCallback(async (pageId = null, limit = 100) => {
    try {
      const token = localStorage.getItem('token');
      const url = pageId
        ? `${API_URL}/api/knowledge-base/logs/${pageId}?limit=${limit}`
        : `${API_URL}/api/knowledge-base/logs?limit=${limit}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching edit logs:', error);
      throw error;
    }
  }, [API_URL]);

  // ==================== TEMPLATES ====================

  const [templates, setTemplates] = useState([]);

  const fetchTemplates = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/knowledge-base/templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
  }, [API_URL]);

  const createTemplate = useCallback(async (data) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/api/knowledge-base/templates`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setTemplates(prev => [response.data, ...prev]);
    return response.data;
  }, [API_URL]);

  const deleteTemplate = useCallback(async (templateId) => {
    const token = localStorage.getItem('token');
    await axios.delete(`${API_URL}/api/knowledge-base/templates/${templateId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setTemplates(prev => prev.filter(t => t._id !== templateId));
  }, [API_URL]);

  const useTemplate = useCallback(async (templateId) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/api/knowledge-base/templates/${templateId}/use`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    await fetchPageTree();
    return response.data;
  }, [API_URL, fetchPageTree]);

  const saveAsTemplate = useCallback(async (pageId, data) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/api/knowledge-base/pages/${pageId}/save-as-template`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setTemplates(prev => [response.data, ...prev]);
    return response.data;
  }, [API_URL]);

  // ==================== VERSION HISTORY ====================

  const [versions, setVersions] = useState([]);

  const fetchVersions = useCallback(async (pageId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/knowledge-base/pages/${pageId}/versions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVersions(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching versions:', error);
      return [];
    }
  }, [API_URL]);

  const fetchVersion = useCallback(async (pageId, versionNumber) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/knowledge-base/pages/${pageId}/versions/${versionNumber}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }, [API_URL]);

  const restoreVersion = useCallback(async (pageId, versionNumber) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/api/knowledge-base/pages/${pageId}/restore/${versionNumber}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    await fetchPageTree();
    if (currentPage?._id === pageId) {
      setCurrentPage(response.data);
    }
    return response.data;
  }, [API_URL, fetchPageTree, currentPage]);

  // ==================== COMMENTS ====================

  const [comments, setComments] = useState([]);

  const fetchComments = useCallback(async (pageId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/knowledge-base/pages/${pageId}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  }, [API_URL]);

  const addComment = useCallback(async (pageId, data) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/api/knowledge-base/pages/${pageId}/comments`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setComments(prev => [...prev, response.data]);
    return response.data;
  }, [API_URL]);

  const updateComment = useCallback(async (commentId, content) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_URL}/api/knowledge-base/comments/${commentId}`, { content }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setComments(prev => prev.map(c => c._id === commentId ? response.data : c));
    return response.data;
  }, [API_URL]);

  const deleteComment = useCallback(async (commentId) => {
    const token = localStorage.getItem('token');
    await axios.delete(`${API_URL}/api/knowledge-base/comments/${commentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setComments(prev => prev.filter(c => c._id !== commentId));
  }, [API_URL]);

  const resolveComment = useCallback(async (commentId) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/api/knowledge-base/comments/${commentId}/resolve`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setComments(prev => prev.map(c => c._id === commentId ? response.data : c));
    return response.data;
  }, [API_URL]);

  const reactToComment = useCallback(async (commentId, emoji) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/api/knowledge-base/comments/${commentId}/react`, { emoji }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setComments(prev => prev.map(c => c._id === commentId ? response.data : c));
    return response.data;
  }, [API_URL]);

  // ==================== FAVORITES & RECENT ====================

  const [favorites, setFavorites] = useState([]);
  const [recentPages, setRecentPages] = useState([]);

  const fetchFavorites = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/knowledge-base/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavorites(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }
  }, [API_URL]);

  const toggleFavorite = useCallback(async (pageId) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/api/knowledge-base/favorites/${pageId}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setFavorites(response.data.favorites || []);
    return response.data;
  }, [API_URL]);

  const fetchRecentPages = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/knowledge-base/recent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentPages(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent pages:', error);
      return [];
    }
  }, [API_URL]);

  const trackPageVisit = useCallback(async (pageId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/knowledge-base/recent/${pageId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      // Silent fail - tracking is not critical
    }
  }, [API_URL]);

  // Fetch favorites and recent on mount
  useEffect(() => {
    if (user) {
      fetchFavorites();
      fetchRecentPages();
    }
  }, [user, fetchFavorites, fetchRecentPages]);

  // ==================== SEARCH ====================

  const searchSuggestions = useCallback(async (query) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/knowledge-base/search/suggestions?q=${encodeURIComponent(query || '')}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }, [API_URL]);

  const searchPages = useCallback(async (query, filters = {}) => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({ q: query });
    if (filters.tags) params.append('tags', filters.tags);
    if (filters.author) params.append('author', filters.author);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);

    const response = await axios.get(`${API_URL}/api/knowledge-base/search?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    // Normalize results to flat array for SearchModal
    const data = response.data;
    if (data.results) {
      return data.results.map(r => ({
        _id: r.page?._id || r._id,
        title: r.page?.title || r.title,
        slug: r.page?.slug || r.slug,
        icon: r.page?.icon || r.icon,
        tags: r.page?.tags || r.tags,
        matchedContent: r.matchedContent
      }));
    }
    return data;
  }, [API_URL]);

  // ==================== FUZZY SEARCH ====================

  const fuzzySearch = useCallback(async (query, filters = {}) => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({ q: query });
    if (filters.tags) params.append('tags', filters.tags);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await axios.get(`${API_URL}/api/knowledge-base/search/fuzzy?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }, [API_URL]);

  const recordSearchBoost = useCallback(async (query, pageId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/knowledge-base/search/boost`,
        { query, pageId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      // Silent fail - boost tracking is not critical
    }
  }, [API_URL]);

  // ==================== SHARING & PERMISSIONS ====================

  const fetchPermissions = useCallback(async (pageId) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/knowledge-base/pages/${pageId}/permissions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }, [API_URL]);

  const updatePermissions = useCallback(async (pageId, permissions) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_URL}/api/knowledge-base/pages/${pageId}/permissions`, permissions, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }, [API_URL]);

  const generateShareLink = useCallback(async (pageId) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/api/knowledge-base/pages/${pageId}/share`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }, [API_URL]);

  const revokeShareLink = useCallback(async (pageId) => {
    const token = localStorage.getItem('token');
    await axios.delete(`${API_URL}/api/knowledge-base/pages/${pageId}/share`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }, [API_URL]);

  // ==================== ANALYTICS ====================

  const fetchPageAnalytics = useCallback(async (pageId, days = 30) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/knowledge-base/pages/${pageId}/analytics?days=${days}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }, [API_URL]);

  const fetchTopPages = useCallback(async (limit = 10) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/knowledge-base/analytics/top-pages?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }, [API_URL]);

  const fetchOverallStats = useCallback(async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/knowledge-base/analytics/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }, [API_URL]);

  const fetchContentStats = useCallback(async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/knowledge-base/analytics/content-stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }, [API_URL]);

  const fetchActiveEditors = useCallback(async (days = 30) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/knowledge-base/analytics/active-editors?days=${days}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }, [API_URL]);

  // ==================== TAGS ====================

  const [allTags, setAllTags] = useState([]);

  const fetchAllTags = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/knowledge-base/tags`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllTags(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching tags:', error);
      return [];
    }
  }, [API_URL]);

  // ==================== IMPORT / EXPORT ====================

  const exportPage = useCallback(async (pageId, format = 'json') => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/knowledge-base/pages/${pageId}/export/${format}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }, [API_URL]);

  const importPage = useCallback(async (data) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/api/knowledge-base/import`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    await fetchPageTree();
    return response.data;
  }, [API_URL, fetchPageTree]);

  const value = {
    // State
    isAdmin,
    isSuperAdmin,
    pageTree,
    currentPage,
    loading,
    pageLoading,
    selections,
    showNavbar,
    sidebarCollapsed,

    // Actions
    setSelection,
    resetSelections,
    loadPage,
    resolveContent,
    fetchPageTree,
    setShowNavbar,
    setCurrentPage,
    setSidebarCollapsed,

    // CRUD
    createPage,
    updatePage,
    deletePage,
    reorderPage,
    updatePageSection,

    // Admin management
    getAdmins,
    addAdmin,
    removeAdmin,

    // Logs
    getEditLogs,

    // Sections
    sections,
    setSections,
    addSection,
    removeSection,
    renameSection,
    fetchSections,

    // Templates
    templates,
    fetchTemplates,
    createTemplate,
    deleteTemplate,
    useTemplate,
    saveAsTemplate,

    // Version History
    versions,
    fetchVersions,
    fetchVersion,
    restoreVersion,

    // Comments
    comments,
    fetchComments,
    addComment,
    updateComment,
    deleteComment,
    resolveComment,
    reactToComment,

    // Favorites & Recent
    favorites,
    recentPages,
    fetchFavorites,
    toggleFavorite,
    fetchRecentPages,
    trackPageVisit,

    // Search
    searchPages,
    searchSuggestions,
    fuzzySearch,
    recordSearchBoost,

    // Sharing & Permissions
    fetchPermissions,
    updatePermissions,
    generateShareLink,
    revokeShareLink,

    // Analytics
    fetchPageAnalytics,
    fetchTopPages,
    fetchOverallStats,
    fetchContentStats,
    fetchActiveEditors,

    // Tags
    allTags,
    fetchAllTags,

    // Import/Export
    exportPage,
    importPage
  };

  return (
    <KnowledgeBaseContext.Provider value={value}>
      {children}
    </KnowledgeBaseContext.Provider>
  );
};

export default KnowledgeBaseContext;
