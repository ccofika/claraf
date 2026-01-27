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

  // Sections (stored in localStorage, not database - purely UI organization)
  const [sections, setSections] = useState(() => {
    try {
      const saved = localStorage.getItem('kb_sections');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist sections to localStorage
  useEffect(() => {
    localStorage.setItem('kb_sections', JSON.stringify(sections));
  }, [sections]);

  // Section management
  const addSection = useCallback((name) => {
    const newSection = {
      id: `section_${Date.now()}`,
      name,
      order: sections.length
    };
    setSections(prev => [...prev, newSection]);
    return newSection;
  }, [sections]);

  const removeSection = useCallback((sectionId) => {
    setSections(prev => prev.filter(s => s.id !== sectionId));
  }, []);

  const renameSection = useCallback((sectionId, newName) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, name: newName } : s
    ));
  }, []);

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

  // Fetch page tree on mount
  useEffect(() => {
    if (user) {
      fetchPageTree();
    }
  }, [user, fetchPageTree]);

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

  // Reorder a page
  const reorderPage = useCallback(async (pageId, newOrder, newParentPage) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/knowledge-base/pages/${pageId}/reorder`,
        { newOrder, newParentPage },
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

    // Sections (local UI organization)
    sections,
    setSections,
    addSection,
    removeSection,
    renameSection
  };

  return (
    <KnowledgeBaseContext.Provider value={value}>
      {children}
    </KnowledgeBaseContext.Provider>
  );
};

export default KnowledgeBaseContext;
