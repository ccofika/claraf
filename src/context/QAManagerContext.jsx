import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { getScorecardValues } from '../data/scorecardConfig';

const QAManagerContext = createContext();

// Roles that have QA admin permissions
const QA_ADMIN_ROLES = ['admin', 'qa-admin'];

// Roles that can access the Review feature
const REVIEWER_ROLES = ['admin', 'qa-admin'];

export const useQAManager = () => {
  const context = useContext(QAManagerContext);
  if (!context) {
    throw new Error('useQAManager must be used within a QAManagerProvider');
  }
  return context;
};

export const QAManagerProvider = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const API_URL = process.env.REACT_APP_API_URL;

  // Check if current user is a QA admin (admin or qa-admin role)
  const isQAAdmin = QA_ADMIN_ROLES.includes(user?.role);

  // Check if current user is a reviewer (can access Review feature)
  const isReviewer = REVIEWER_ROLES.includes(user?.role);

  // ============================================
  // HELPER: Get active tab from URL path
  // ============================================
  const getActiveTabFromPath = useCallback(() => {
    const path = location.pathname.replace('/qa-manager', '').replace(/^\//, '');
    if (!path || path === '') return 'dashboard';
    return path.split('/')[0];
  }, [location.pathname]);

  // ============================================
  // LOADING STATE
  // ============================================
  const [loading, setLoading] = useState(true);

  // ============================================
  // DATA STATE
  // ============================================
  const [agents, setAgents] = useState([]);
  const [allExistingAgents, setAllExistingAgents] = useState([]);
  const [agentsForFilter, setAgentsForFilter] = useState([]);
  const [graders, setGraders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  // ============================================
  // FILTER STATE
  // ============================================
  const [ticketsFilters, setTicketsFilters] = useState({
    agent: '',
    status: '',
    isArchived: false,
    dateFrom: '',
    dateTo: '',
    scoreMin: 0,
    scoreMax: 100,
    search: '',
    categories: [],
    tags: '',
    grader: '',
    searchMode: 'text'
  });

  const [archiveFilters, setArchiveFilters] = useState({
    agent: '',
    status: '',
    isArchived: true,
    dateFrom: '',
    dateTo: '',
    scoreMin: 0,
    scoreMax: 100,
    search: '',
    categories: [],
    tags: '',
    grader: '',
    searchMode: 'text'
  });

  // ============================================
  // REVIEW STATE
  // ============================================
  const [reviewFilters, setReviewFilters] = useState({
    agent: '',
    dateFrom: '',
    dateTo: '',
    scoreMin: 0,
    scoreMax: 100,
    search: '',
    categories: [],
    createdBy: '',
    searchMode: 'text'
  });
  const [reviewTickets, setReviewTickets] = useState([]);
  const [reviewPagination, setReviewPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });
  const [reviewPendingCount, setReviewPendingCount] = useState(0);
  const [showReviewBanner, setShowReviewBanner] = useState(() => {
    // Check localStorage for banner dismiss state
    const dismissed = localStorage.getItem('reviewBannerDismissed');
    if (dismissed) {
      const { timestamp, count } = JSON.parse(dismissed);
      // Banner was dismissed, will show again if count changes
      return false;
    }
    return true;
  });

  // Get current filters based on active tab
  const activeTab = getActiveTabFromPath();
  const getFiltersForTab = (tab) => {
    if (tab === 'archive') return archiveFilters;
    if (tab === 'review') return reviewFilters;
    return ticketsFilters;
  };
  const getSetFiltersForTab = (tab) => {
    if (tab === 'archive') return setArchiveFilters;
    if (tab === 'review') return setReviewFilters;
    return setTicketsFilters;
  };
  const filters = getFiltersForTab(activeTab);
  const setFilters = getSetFiltersForTab(activeTab);

  // ============================================
  // DIALOG STATE
  // ============================================
  const [agentDialog, setAgentDialog] = useState({ open: false, mode: 'create', data: null });
  const [addExistingAgentDialog, setAddExistingAgentDialog] = useState({ open: false });
  const [similarAgentDialog, setSimilarAgentDialog] = useState({ open: false, similarAgents: [], newAgentName: '' });
  const [ticketDialog, setTicketDialog] = useState({ open: false, mode: 'create', data: null, source: 'tickets' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: null, id: null, name: '' });
  const [gradeDialog, setGradeDialog] = useState({ open: false, ticket: null });
  const [feedbackDialog, setFeedbackDialog] = useState({ open: false, ticket: null });
  const [viewDialog, setViewDialog] = useState({ open: false, ticket: null, source: null });

  // Macro dialog state
  const [manageMacrosDialog, setManageMacrosDialog] = useState({ open: false });
  const [chooseMacroDialog, setChooseMacroDialog] = useState({ open: false, onSelect: null });
  const [saveAsMacroDialog, setSaveAsMacroDialog] = useState({ open: false, feedback: '', categories: [], scorecardData: {}, agentPosition: null });

  // Send Macro Ticket state
  const [sendMacroDialog, setSendMacroDialog] = useState({ open: false });
  const [pendingMacroTickets, setPendingMacroTickets] = useState([]);
  const [declineConfirmDialog, setDeclineConfirmDialog] = useState({ open: false, macroTicket: null });

  // Unsaved changes modal
  const [unsavedChangesModal, setUnsavedChangesModal] = useState({ open: false, onConfirm: null });

  // Assignments state
  const [assignmentsDialog, setAssignmentsDialog] = useState({ open: false, agentId: null, agentName: '' });
  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  // Grading assignment modal state (shown when starting grading from dashboard)
  const [gradingAssignmentModal, setGradingAssignmentModal] = useState({
    open: false,
    hasExistingAssignment: false,
    existingAssignment: null,
    agentId: null,
    agentName: null,
    pendingTaskData: null,
    newAssignmentName: ''
  });

  // ============================================
  // VALIDATION STATE
  // ============================================
  const [validationErrors, setValidationErrors] = useState({
    invalidTickets: {},
    highlightedAgentId: null,
    validationMode: false
  });

  // ============================================
  // EXTENSION STATE
  // ============================================
  const [extensionLogs, setExtensionLogs] = useState([]);
  const [extensionActive, setExtensionActive] = useState(false);
  const extensionLogsRef = useRef(null);

  // ============================================
  // REFS
  // ============================================
  const ticketFormDataRef = useRef({
    agent: '',
    ticketId: '',
    status: 'Selected',
    qualityScorePercent: '',
    notes: '',
    feedback: '',
    dateEntered: null,
    categories: [],
    scorecardVariant: null,
    scorecardValues: {}
  });
  const hasUnsavedChangesRef = useRef(false);
  const originalFormDataRef = useRef(null);

  // ============================================
  // SORTING STATE
  // ============================================
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // ============================================
  // SELECTION STATE
  // ============================================
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [selectedArchivedTickets, setSelectedArchivedTickets] = useState([]);
  const [archivingAll, setArchivingAll] = useState(false);
  const [focusedTicketIndex, setFocusedTicketIndex] = useState(-1);
  const ticketListRef = useRef(null);

  // ============================================
  // UNDO ARCHIVE STATE
  // ============================================
  const [lastArchivedTicketIds, setLastArchivedTicketIds] = useState([]);
  const undoToastIdRef = useRef(null);

  // ============================================
  // AGENT EXPANSION STATE
  // ============================================
  const [expandedAgentId, setExpandedAgentId] = useState(null);
  const [agentIssues, setAgentIssues] = useState({ loading: false, data: null });

  // ============================================
  // AUTH HELPER
  // ============================================
  const getAuthHeaders = useCallback(() => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  }), []);

  // ============================================
  // API FUNCTIONS
  // ============================================
  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/qa/dashboard/stats`, getAuthHeaders());
      setDashboardStats(response.data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      if (err.response?.status === 403) {
        toast.error('You do not have permission to access QA Manager');
      } else {
        toast.error('Failed to load dashboard statistics');
      }
    } finally {
      setLoading(false);
    }
  }, [API_URL, getAuthHeaders]);

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/qa/agents`, getAuthHeaders());
      setAgents(response.data);
    } catch (err) {
      console.error('Error fetching agents:', err);
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  }, [API_URL, getAuthHeaders]);

  const fetchAllExistingAgents = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/qa/agents/all/existing`, getAuthHeaders());
      setAllExistingAgents(response.data);
    } catch (err) {
      console.error('Error fetching all existing agents:', err);
      toast.error('Failed to load existing agents');
    }
  }, [API_URL, getAuthHeaders]);

  const fetchAgentsForFilter = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/qa/agents/with-tickets`, getAuthHeaders());
      setAgentsForFilter(response.data);
    } catch (err) {
      console.error('Error fetching agents for filter:', err);
      toast.error('Failed to load agents for filter');
    }
  }, [API_URL, getAuthHeaders]);

  const fetchGraders = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/qa/analytics/graders`, getAuthHeaders());
      setGraders(response.data);
    } catch (err) {
      console.error('Error fetching graders:', err);
    }
  }, [API_URL, getAuthHeaders]);

  const fetchAgentIssues = useCallback(async (agentId) => {
    try {
      setAgentIssues({ loading: true, data: null });
      const response = await axios.get(`${API_URL}/api/qa/agents/${agentId}/issues`, getAuthHeaders());
      setAgentIssues({ loading: false, data: response.data });
    } catch (err) {
      console.error('Error fetching agent issues:', err);
      setAgentIssues({ loading: false, data: null });
    }
  }, [API_URL, getAuthHeaders]);

  const fetchPendingMacroTickets = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/qa/macro-tickets/pending`, getAuthHeaders());
      setPendingMacroTickets(response.data);
    } catch (err) {
      console.error('Error fetching pending macro tickets:', err);
    }
  }, [API_URL, getAuthHeaders]);

  const fetchTickets = useCallback(async (customFilters = null, isArchive = false) => {
    try {
      setLoading(true);
      const currentFilters = customFilters || (isArchive ? archiveFilters : ticketsFilters);
      const useAISearch = currentFilters.searchMode === 'ai' && currentFilters.search && currentFilters.search.trim().length > 0;

      if (useAISearch) {
        setTickets([]);
      }

      const params = new URLSearchParams();
      if (currentFilters.agent) params.append('agent', currentFilters.agent);
      if (currentFilters.status) params.append('status', currentFilters.status);
      if (currentFilters.dateFrom) params.append('dateFrom', currentFilters.dateFrom);
      if (currentFilters.dateTo) params.append('dateTo', currentFilters.dateTo);
      if (currentFilters.scoreMin) params.append('scoreMin', currentFilters.scoreMin);
      if (currentFilters.scoreMax && currentFilters.scoreMax < 100) params.append('scoreMax', currentFilters.scoreMax);
      if (currentFilters.categories && currentFilters.categories.length > 0) {
        params.append('categories', currentFilters.categories.join(','));
      }
      if (currentFilters.grader) params.append('createdBy', currentFilters.grader);
      params.append('isArchived', isArchive ? 'true' : 'false');

      if (useAISearch) {
        params.append('query', currentFilters.search);
        params.append('limit', pagination.limit);

        const response = await axios.get(
          `${API_URL}/api/qa/ai-search?${params.toString()}`,
          getAuthHeaders()
        );

        const results = response.data || [];
        setTickets(results);
        setPagination(prev => ({
          ...prev,
          total: results.length,
          pages: 1,
          page: 1
        }));
      } else {
        if (currentFilters.search) params.append('search', currentFilters.search);
        params.append('page', pagination.page);
        params.append('limit', pagination.limit);

        const response = await axios.get(
          `${API_URL}/api/qa/tickets?${params.toString()}`,
          getAuthHeaders()
        );
        setTickets(response.data.tickets || response.data);

        if (response.data.pagination) {
          setPagination(prev => ({
            ...prev,
            total: response.data.pagination.total,
            pages: response.data.pagination.pages
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [API_URL, getAuthHeaders, ticketsFilters, archiveFilters, pagination.page, pagination.limit]);

  // Wrapper for fetching archived tickets
  const fetchArchivedTickets = useCallback(() => {
    return fetchTickets(null, true);
  }, [fetchTickets]);

  // ============================================
  // REVIEW FUNCTIONS
  // ============================================

  // Fetch review pending count (for notification badge)
  const fetchReviewPendingCount = useCallback(async () => {
    if (!isReviewer) return;
    try {
      const response = await axios.get(
        `${API_URL}/api/qa/review/pending-count`,
        getAuthHeaders()
      );
      const newCount = response.data.count || 0;

      // Check if count changed since banner was dismissed
      const dismissed = localStorage.getItem('reviewBannerDismissed');
      if (dismissed) {
        const { count: dismissedCount } = JSON.parse(dismissed);
        if (newCount > dismissedCount) {
          // New tickets arrived, show banner again
          setShowReviewBanner(true);
          localStorage.removeItem('reviewBannerDismissed');
        }
      }

      setReviewPendingCount(newCount);
    } catch (err) {
      console.error('Error fetching review pending count:', err);
    }
  }, [API_URL, getAuthHeaders, isReviewer]);

  // Dismiss review banner
  const dismissReviewBanner = useCallback(() => {
    setShowReviewBanner(false);
    localStorage.setItem('reviewBannerDismissed', JSON.stringify({
      timestamp: Date.now(),
      count: reviewPendingCount
    }));
  }, [reviewPendingCount]);

  // Fetch review tickets
  const fetchReviewTickets = useCallback(async (customFilters = null) => {
    if (!isReviewer) return;
    try {
      setLoading(true);
      const currentFilters = customFilters || reviewFilters;

      const params = new URLSearchParams();
      if (currentFilters.agent) params.append('agent', currentFilters.agent);
      if (currentFilters.dateFrom) params.append('dateFrom', currentFilters.dateFrom);
      if (currentFilters.dateTo) params.append('dateTo', currentFilters.dateTo);
      if (currentFilters.scoreMin) params.append('scoreMin', currentFilters.scoreMin);
      if (currentFilters.scoreMax && currentFilters.scoreMax < 100) params.append('scoreMax', currentFilters.scoreMax);
      if (currentFilters.categories && currentFilters.categories.length > 0) {
        params.append('categories', currentFilters.categories.join(','));
      }
      if (currentFilters.createdBy) params.append('createdBy', currentFilters.createdBy);
      if (currentFilters.search) params.append('search', currentFilters.search);
      params.append('page', reviewPagination.page);
      params.append('limit', reviewPagination.limit);

      const response = await axios.get(
        `${API_URL}/api/qa/review/tickets?${params.toString()}`,
        getAuthHeaders()
      );

      setReviewTickets(response.data.tickets || []);

      if (response.data.pagination) {
        setReviewPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        }));
      }
    } catch (err) {
      console.error('Error fetching review tickets:', err);
      toast.error('Failed to load review tickets');
    } finally {
      setLoading(false);
    }
  }, [API_URL, getAuthHeaders, isReviewer, reviewFilters, reviewPagination.page, reviewPagination.limit]);

  // Get single review ticket
  const fetchReviewTicket = useCallback(async (ticketId) => {
    if (!isReviewer) return null;
    try {
      const response = await axios.get(
        `${API_URL}/api/qa/review/tickets/${ticketId}`,
        getAuthHeaders()
      );
      return response.data;
    } catch (err) {
      console.error('Error fetching review ticket:', err);
      toast.error('Failed to load review ticket');
      return null;
    }
  }, [API_URL, getAuthHeaders, isReviewer]);

  // Update review ticket
  const handleUpdateReviewTicket = useCallback(async (ticketId, formData) => {
    if (!isReviewer) return;
    try {
      const response = await axios.put(
        `${API_URL}/api/qa/review/tickets/${ticketId}`,
        formData,
        getAuthHeaders()
      );
      // Update local state
      setReviewTickets(prev => prev.map(t =>
        t._id === ticketId ? response.data : t
      ));
      return response.data;
    } catch (err) {
      console.error('Error updating review ticket:', err);
      toast.error('Failed to update review ticket');
      throw err;
    }
  }, [API_URL, getAuthHeaders, isReviewer]);

  // Approve ticket
  const handleApproveTicket = useCallback(async (ticketId, note = '') => {
    if (!isReviewer) return;
    try {
      const response = await axios.post(
        `${API_URL}/api/qa/review/tickets/${ticketId}/approve`,
        { note },
        getAuthHeaders()
      );
      // Remove from review tickets list
      setReviewTickets(prev => prev.filter(t => t._id !== ticketId));
      setReviewPendingCount(prev => Math.max(0, prev - 1));
      toast.success('Ticket approved successfully');
      return response.data;
    } catch (err) {
      console.error('Error approving ticket:', err);
      toast.error('Failed to approve ticket');
      throw err;
    }
  }, [API_URL, getAuthHeaders, isReviewer]);

  // Deny ticket
  const handleDenyTicket = useCallback(async (ticketId, note = '') => {
    if (!isReviewer) return;
    try {
      const response = await axios.post(
        `${API_URL}/api/qa/review/tickets/${ticketId}/deny`,
        { note },
        getAuthHeaders()
      );
      // Remove from review tickets list
      setReviewTickets(prev => prev.filter(t => t._id !== ticketId));
      setReviewPendingCount(prev => Math.max(0, prev - 1));
      toast.success('Ticket denied - grader will be notified');
      return response.data;
    } catch (err) {
      console.error('Error denying ticket:', err);
      toast.error('Failed to deny ticket');
      throw err;
    }
  }, [API_URL, getAuthHeaders, isReviewer]);

  // Fetch review analytics
  const fetchReviewAnalytics = useCallback(async (dateFrom = null, dateTo = null, createdBy = null) => {
    if (!isReviewer) return null;
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (createdBy) params.append('createdBy', createdBy);

      const response = await axios.get(
        `${API_URL}/api/qa/review/analytics?${params.toString()}`,
        getAuthHeaders()
      );
      return response.data;
    } catch (err) {
      console.error('Error fetching review analytics:', err);
      toast.error('Failed to load review analytics');
      return null;
    }
  }, [API_URL, getAuthHeaders, isReviewer]);

  // ============================================
  // AGENT CRUD
  // ============================================
  const handleCreateAgent = useCallback(async (formData) => {
    try {
      const checkResponse = await axios.post(
        `${API_URL}/api/qa/agents/check-similar`,
        { name: formData.name },
        getAuthHeaders()
      );

      if (checkResponse.data.exactMatch) {
        await axios.post(
          `${API_URL}/api/qa/agents/${checkResponse.data.agent._id}/add-to-list`,
          {},
          getAuthHeaders()
        );
        setAgents(prev => [...prev, checkResponse.data.agent]);
        setAgentDialog({ open: false, mode: 'create', data: null });
        toast.success(`Agent "${checkResponse.data.agent.name}" added to your list`);
        return;
      }

      if (checkResponse.data.similar && checkResponse.data.similar.length > 0) {
        setSimilarAgentDialog({
          open: true,
          similarAgents: checkResponse.data.similar,
          newAgentName: formData.name,
          formData: formData
        });
        return;
      }

      const response = await axios.post(`${API_URL}/api/qa/agents`, formData, getAuthHeaders());
      setAgents(prev => [...prev, response.data]);
      setAgentDialog({ open: false, mode: 'create', data: null });
      toast.success('Agent created successfully');
      fetchAgentsForFilter();
    } catch (err) {
      console.error('Error creating agent:', err);
      toast.error(err.response?.data?.message || 'Failed to create agent');
    }
  }, [API_URL, getAuthHeaders, fetchAgentsForFilter]);

  const handleUpdateAgent = useCallback(async (id, formData) => {
    try {
      const response = await axios.put(`${API_URL}/api/qa/agents/${id}`, formData, getAuthHeaders());
      setAgents(prev => prev.map(a => a._id === id ? response.data : a));
      setAgentDialog({ open: false, mode: 'create', data: null });
      toast.success('Agent updated successfully');

      if (validationErrors.highlightedAgentId === id && formData.maestroName) {
        clearValidationErrors();
      }
    } catch (err) {
      console.error('Error updating agent:', err);
      toast.error(err.response?.data?.message || 'Failed to update agent');
    }
  }, [API_URL, getAuthHeaders, validationErrors.highlightedAgentId]);

  const handleDeleteAgent = useCallback(async (id) => {
    try {
      await axios.delete(`${API_URL}/api/qa/agents/${id}`, getAuthHeaders());
      setAgents(prev => prev.filter(a => a._id !== id));
      setDeleteDialog({ open: false, type: null, id: null, name: '' });
      toast.success('Agent removed from your grading list');
    } catch (err) {
      console.error('Error removing agent:', err);
      toast.error(err.response?.data?.message || 'Failed to remove agent');
    }
  }, [API_URL, getAuthHeaders]);

  const handleAddExistingAgent = useCallback(async (agentId) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/qa/agents/${agentId}/add-to-list`,
        {},
        getAuthHeaders()
      );
      setAgents(prev => [...prev, response.data]);
      setAddExistingAgentDialog({ open: false });
      toast.success(`Agent "${response.data.name}" added to your list`);
    } catch (err) {
      console.error('Error adding existing agent:', err);
      toast.error(err.response?.data?.message || 'Failed to add agent');
    }
  }, [API_URL, getAuthHeaders]);

  const handleConfirmSimilarAgent = useCallback(async (selectedAgentId) => {
    try {
      if (selectedAgentId) {
        await handleAddExistingAgent(selectedAgentId);
      } else {
        const response = await axios.post(
          `${API_URL}/api/qa/agents`,
          similarAgentDialog.formData,
          getAuthHeaders()
        );
        setAgents(prev => [...prev, response.data]);
        toast.success('Agent created successfully');
        fetchAgentsForFilter();
      }
      setSimilarAgentDialog({ open: false, similarAgents: [], newAgentName: '', formData: null });
      setAgentDialog({ open: false, mode: 'create', data: null });
    } catch (err) {
      console.error('Error handling similar agent:', err);
      toast.error(err.response?.data?.message || 'Failed to process agent');
    }
  }, [API_URL, getAuthHeaders, similarAgentDialog.formData, handleAddExistingAgent, fetchAgentsForFilter]);

  // ============================================
  // TICKET CRUD
  // ============================================
  const handleCreateTicket = useCallback(async (formData) => {
    try {
      const requestBody = {
        agent: formData.agent,
        ticketId: formData.ticketId,
        status: formData.status,
        dateEntered: formData.dateEntered,
        notes: formData.notes,
        feedback: formData.feedback,
        qualityScorePercent: formData.qualityScorePercent,
        categories: formData.categories,
        scorecardVariant: formData.scorecardVariant,
        scorecardValues: formData.scorecardValues
      };
      const response = await axios.post(`${API_URL}/api/qa/tickets`, requestBody, getAuthHeaders());
      setTickets(prev => [response.data, ...prev]);
      setTicketDialog({ open: false, mode: 'create', data: null });
      toast.success('Ticket created successfully');
    } catch (err) {
      console.error('Error creating ticket:', err);
      toast.error(err.response?.data?.message || 'Failed to create ticket');
    }
  }, [API_URL, getAuthHeaders]);

  const handleUpdateTicket = useCallback(async (id, formData) => {
    try {
      const requestBody = {
        agent: formData.agent,
        ticketId: formData.ticketId,
        status: formData.status,
        dateEntered: formData.dateEntered,
        notes: formData.notes,
        feedback: formData.feedback,
        qualityScorePercent: formData.qualityScorePercent,
        categories: formData.categories,
        scorecardVariant: formData.scorecardVariant,
        scorecardValues: formData.scorecardValues
      };
      const response = await axios.put(`${API_URL}/api/qa/tickets/${id}`, requestBody, getAuthHeaders());
      setTickets(prev => prev.map(t => t._id === id ? response.data : t));
      setTicketDialog({ open: false, mode: 'create', data: null });
      toast.success('Ticket updated successfully');

      if (validationErrors.invalidTickets[id]) {
        setValidationErrors(prev => {
          const newInvalidTickets = { ...prev.invalidTickets };
          delete newInvalidTickets[id];
          const hasRemainingErrors = Object.keys(newInvalidTickets).length > 0;
          return {
            ...prev,
            invalidTickets: newInvalidTickets,
            validationMode: hasRemainingErrors
          };
        });
      }
    } catch (err) {
      console.error('Error updating ticket:', err);
      toast.error(err.response?.data?.message || 'Failed to update ticket');
    }
  }, [API_URL, getAuthHeaders, validationErrors.invalidTickets]);

  const handleDeleteTicket = useCallback(async (id) => {
    try {
      await axios.delete(`${API_URL}/api/qa/tickets/${id}`, getAuthHeaders());
      setTickets(prev => prev.filter(t => t._id !== id));
      setDeleteDialog({ open: false, type: null, id: null, name: '' });
      toast.success('Ticket deleted successfully');
    } catch (err) {
      console.error('Error deleting ticket:', err);
      toast.error(err.response?.data?.message || 'Failed to delete ticket');
    }
  }, [API_URL, getAuthHeaders]);

  // Undo archive handler
  const handleUndoArchive = useCallback(async (ticketIds) => {
    try {
      await axios.post(`${API_URL}/api/qa/tickets/bulk-restore`, { ticketIds }, getAuthHeaders());
      // Dismiss the undo toast
      if (undoToastIdRef.current) {
        toast.dismiss(undoToastIdRef.current);
        undoToastIdRef.current = null;
      }
      setLastArchivedTicketIds([]);
      // Refresh tickets to show restored ones
      fetchTickets();
      toast.success(`${ticketIds.length} ticket(s) restored`);
    } catch (err) {
      console.error('Error undoing archive:', err);
      toast.error('Failed to undo archive');
    }
  }, [API_URL, getAuthHeaders, fetchTickets]);

  // Show undo toast with persistent duration
  const showUndoToast = useCallback((count, ticketIds) => {
    // Dismiss previous undo toast if exists
    if (undoToastIdRef.current) {
      toast.dismiss(undoToastIdRef.current);
    }

    setLastArchivedTicketIds(ticketIds);

    undoToastIdRef.current = toast.success(
      <div className="flex items-center justify-between w-full min-w-[280px]">
        <span className="flex-1 text-center font-medium">
          {count} ticket(s) archived
        </span>
        <button
          onClick={() => handleUndoArchive(ticketIds)}
          className="ml-4 px-4 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200 bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 shadow-sm"
        >
          Undo
        </button>
      </div>,
      {
        duration: 15000, // 15 seconds
        dismissible: true,
        onDismiss: () => {
          undoToastIdRef.current = null;
          setLastArchivedTicketIds([]);
        }
      }
    );
  }, [handleUndoArchive]);

  const handleArchiveTicket = useCallback(async (id) => {
    try {
      await axios.post(`${API_URL}/api/qa/tickets/${id}/archive`, {}, getAuthHeaders());
      setTickets(prev => prev.filter(t => t._id !== id));
      showUndoToast(1, [id]);
    } catch (err) {
      console.error('Error archiving ticket:', err);
      toast.error('Failed to archive ticket');
    }
  }, [API_URL, getAuthHeaders, showUndoToast]);

  const handleBulkArchive = useCallback(async () => {
    if (selectedTickets.length === 0) {
      toast.error('No tickets selected');
      return;
    }
    try {
      const ticketIds = [...selectedTickets];
      await axios.post(`${API_URL}/api/qa/tickets/bulk-archive`, { ticketIds }, getAuthHeaders());
      setTickets(prev => prev.filter(t => !ticketIds.includes(t._id)));
      setSelectedTickets([]);
      showUndoToast(ticketIds.length, ticketIds);
    } catch (err) {
      console.error('Error bulk archiving:', err);
      toast.error('Failed to archive tickets');
    }
  }, [API_URL, getAuthHeaders, selectedTickets, showUndoToast]);

  const handleArchiveAll = useCallback(async () => {
    if (tickets.length === 0) {
      toast.error('No tickets to archive');
      return;
    }

    if (!window.confirm(`Are you sure you want to archive ALL tickets matching your current filters? This will archive tickets across all pages.`)) {
      return;
    }

    try {
      setArchivingAll(true);
      // Use the new endpoint that archives all filtered tickets
      const response = await axios.post(`${API_URL}/api/qa/tickets/archive-all-filtered`, {
        agent: ticketsFilters.agent || undefined,
        status: ticketsFilters.status || undefined,
        dateFrom: ticketsFilters.dateFrom || undefined,
        dateTo: ticketsFilters.dateTo || undefined,
        scoreMin: ticketsFilters.scoreMin || undefined,
        scoreMax: ticketsFilters.scoreMax || undefined,
        categories: ticketsFilters.categories?.length > 0 ? ticketsFilters.categories : undefined,
        grader: ticketsFilters.grader || undefined
      }, getAuthHeaders());

      const archivedIds = response.data.archivedTicketIds || [];
      const count = response.data.count || 0;

      if (count > 0) {
        setTickets([]);
        setSelectedTickets([]);
        showUndoToast(count, archivedIds);
      } else {
        toast.info('No tickets to archive');
      }
    } catch (err) {
      console.error('Error archiving all tickets:', err);
      toast.error('Failed to archive tickets');
    } finally {
      setArchivingAll(false);
    }
  }, [API_URL, getAuthHeaders, tickets.length, ticketsFilters, showUndoToast]);

  const handleRestoreTicket = useCallback(async (id) => {
    try {
      await axios.post(`${API_URL}/api/qa/tickets/${id}/restore`, {}, getAuthHeaders());
      setTickets(prev => prev.filter(t => t._id !== id));
      toast.success('Ticket restored successfully');
    } catch (err) {
      console.error('Error restoring ticket:', err);
      toast.error('Failed to restore ticket');
    }
  }, [API_URL, getAuthHeaders]);

  // Bulk restore archived tickets (for Archive page)
  const handleBulkRestore = useCallback(async () => {
    if (selectedArchivedTickets.length === 0) {
      toast.error('No tickets selected');
      return;
    }
    try {
      const ticketIds = [...selectedArchivedTickets];
      await axios.post(`${API_URL}/api/qa/tickets/bulk-restore`, { ticketIds }, getAuthHeaders());
      setTickets(prev => prev.filter(t => !ticketIds.includes(t._id)));
      setSelectedArchivedTickets([]);
      toast.success(`${ticketIds.length} ticket(s) restored successfully`);
    } catch (err) {
      console.error('Error bulk restoring:', err);
      toast.error('Failed to restore tickets');
    }
  }, [API_URL, getAuthHeaders, selectedArchivedTickets]);

  // Bulk change status for archived tickets
  const handleBulkStatusChange = useCallback(async (newStatus) => {
    if (selectedArchivedTickets.length === 0) {
      toast.error('No tickets selected');
      return;
    }
    try {
      const ticketIds = [...selectedArchivedTickets];
      await axios.post(`${API_URL}/api/qa/tickets/bulk-status`, { ticketIds, status: newStatus }, getAuthHeaders());
      // Update local state
      setTickets(prev => prev.map(t =>
        ticketIds.includes(t._id) ? { ...t, status: newStatus } : t
      ));
      setSelectedArchivedTickets([]);
      toast.success(`${ticketIds.length} ticket(s) status changed to ${newStatus}`);
    } catch (err) {
      console.error('Error bulk changing status:', err);
      toast.error('Failed to change ticket status');
    }
  }, [API_URL, getAuthHeaders, selectedArchivedTickets]);

  // Bulk delete archived tickets
  const handleBulkDelete = useCallback(async () => {
    if (selectedArchivedTickets.length === 0) {
      toast.error('No tickets selected');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete ${selectedArchivedTickets.length} ticket(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const ticketIds = [...selectedArchivedTickets];
      await axios.post(`${API_URL}/api/qa/tickets/bulk-delete`, { ticketIds }, getAuthHeaders());
      setTickets(prev => prev.filter(t => !ticketIds.includes(t._id)));
      setSelectedArchivedTickets([]);
      toast.success(`${ticketIds.length} ticket(s) deleted permanently`);
    } catch (err) {
      console.error('Error bulk deleting:', err);
      toast.error('Failed to delete tickets');
    }
  }, [API_URL, getAuthHeaders, selectedArchivedTickets]);

  // Bulk change status for regular tickets (Tickets page)
  const handleBulkStatusChangeTickets = useCallback(async (newStatus) => {
    if (selectedTickets.length === 0) {
      toast.error('No tickets selected');
      return;
    }
    try {
      const ticketIds = [...selectedTickets];
      await axios.post(`${API_URL}/api/qa/tickets/bulk-status`, { ticketIds, status: newStatus }, getAuthHeaders());
      setTickets(prev => prev.map(t =>
        ticketIds.includes(t._id) ? { ...t, status: newStatus } : t
      ));
      setSelectedTickets([]);
      toast.success(`${ticketIds.length} ticket(s) status changed to ${newStatus}`);
    } catch (err) {
      console.error('Error bulk changing status:', err);
      toast.error('Failed to change ticket status');
    }
  }, [API_URL, getAuthHeaders, selectedTickets]);

  // Bulk delete regular tickets (Tickets page)
  const handleBulkDeleteTickets = useCallback(async () => {
    if (selectedTickets.length === 0) {
      toast.error('No tickets selected');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete ${selectedTickets.length} ticket(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const ticketIds = [...selectedTickets];
      await axios.post(`${API_URL}/api/qa/tickets/bulk-delete`, { ticketIds }, getAuthHeaders());
      setTickets(prev => prev.filter(t => !ticketIds.includes(t._id)));
      setSelectedTickets([]);
      toast.success(`${ticketIds.length} ticket(s) deleted permanently`);
    } catch (err) {
      console.error('Error bulk deleting:', err);
      toast.error('Failed to delete tickets');
    }
  }, [API_URL, getAuthHeaders, selectedTickets]);

  const handleGradeTicket = useCallback(async (id, qualityScorePercent) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/qa/tickets/${id}/grade`,
        { qualityScorePercent },
        getAuthHeaders()
      );
      setTickets(prev => prev.map(t => t._id === id ? response.data : t));
      setGradeDialog({ open: false, ticket: null });
      toast.success('Ticket graded successfully');
    } catch (err) {
      console.error('Error grading ticket:', err);
      toast.error(err.response?.data?.message || 'Failed to grade ticket');
    }
  }, [API_URL, getAuthHeaders]);

  const handleUpdateFeedback = useCallback(async (id, feedback) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/qa/tickets/${id}`,
        { feedback },
        getAuthHeaders()
      );
      setTickets(prev => prev.map(t => t._id === id ? response.data : t));
      setFeedbackDialog({ open: false, ticket: null });
      toast.success('Feedback saved successfully');
    } catch (err) {
      console.error('Error updating feedback:', err);
      toast.error(err.response?.data?.message || 'Failed to save feedback');
    }
  }, [API_URL, getAuthHeaders]);

  // ============================================
  // MACRO TICKET FUNCTIONS
  // ============================================
  const handleSendMacroTicket = useCallback(async (data) => {
    try {
      const response = await axios.post(`${API_URL}/api/qa/macro-tickets`, data, getAuthHeaders());
      toast.success(response.data.message);
      setSendMacroDialog({ open: false });
      fetchPendingMacroTickets();
      return { success: true };
    } catch (err) {
      console.error('Error sending ticket:', err);
      const message = err.response?.data?.message || 'Failed to send ticket';
      toast.error(message);
      return { success: false, error: message };
    }
  }, [API_URL, getAuthHeaders, fetchPendingMacroTickets]);

  const handleAcceptMacroTicket = useCallback(async (macroTicketId) => {
    try {
      await axios.post(
        `${API_URL}/api/qa/macro-tickets/${macroTicketId}/accept`,
        {},
        getAuthHeaders()
      );
      toast.success('Ticket accepted and added to your list');
      fetchPendingMacroTickets();
      fetchTickets();
    } catch (err) {
      console.error('Error accepting ticket:', err);
      toast.error(err.response?.data?.message || 'Failed to accept ticket');
    }
  }, [API_URL, getAuthHeaders, fetchPendingMacroTickets, fetchTickets]);

  const handleDeclineMacroTicket = useCallback(async (macroTicketId) => {
    try {
      await axios.post(
        `${API_URL}/api/qa/macro-tickets/${macroTicketId}/decline`,
        {},
        getAuthHeaders()
      );
      toast.success('Ticket declined');
      fetchPendingMacroTickets();
      setDeclineConfirmDialog({ open: false, macroTicket: null });
    } catch (err) {
      console.error('Error declining ticket:', err);
      toast.error(err.response?.data?.message || 'Failed to decline ticket');
    }
  }, [API_URL, getAuthHeaders, fetchPendingMacroTickets]);

  // ============================================
  // EXPORT FUNCTIONS
  // ============================================
  const handleExportMaestro = useCallback(async (agentId, source = 'dashboard') => {
    try {
      // Track the grade button click
      axios.post(
        `${API_URL}/api/qa/grade-clicks`,
        { agentId, source },
        getAuthHeaders()
      ).catch(err => console.error('Failed to track grade click:', err));

      const response = await axios.post(
        `${API_URL}/api/qa/export/maestro/${agentId}`,
        {},
        { ...getAuthHeaders(), responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      let filename;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      if (!filename) {
        const agent = agents.find(a => a._id === agentId);
        const agentName = agent ? agent.name.replace(/\s+/g, '_') : 'agent';
        const dateStr = new Date().toISOString().split('T')[0];
        filename = `${agentName}_selected_tickets_${dateStr}.csv`;
      }
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Selected tickets exported successfully');
    } catch (err) {
      console.error('Error exporting selected tickets:', err);
      toast.error(err.response?.data?.message || 'Failed to export selected tickets');
    }
  }, [API_URL, getAuthHeaders, agents]);

  const handleExportSelectedTickets = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/qa/tickets?isArchived=false&status=Selected&limit=10000`,
        getAuthHeaders()
      );

      const allTickets = response.data.tickets || response.data;
      const selectedTicketsList = allTickets.filter(ticket => ticket.status === 'Selected');

      if (selectedTicketsList.length === 0) {
        toast.error('No selected tickets to export');
        return;
      }

      let csvContent = 'Ticket ID\n';
      selectedTicketsList.forEach(ticket => {
        const ticketId = ticket.ticketId || ticket._id.slice(-6);
        csvContent += `${ticketId}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `selected_tickets_${dateStr}.csv`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Exported ${selectedTicketsList.length} selected tickets`);
    } catch (err) {
      console.error('Error exporting selected tickets:', err);
      toast.error(err.response?.data?.message || 'Failed to export selected tickets');
    }
  }, [API_URL, getAuthHeaders]);

  // ============================================
  // VALIDATION FUNCTIONS
  // ============================================
  const validateTicketForGrading = useCallback((ticket, agentPosition) => {
    const missing = [];

    if (!ticket.ticketId) {
      missing.push('Ticket ID');
    }

    const isSenior = agentPosition?.toLowerCase().includes('senior');
    if (isSenior && !ticket.scorecardVariant) {
      missing.push('Scorecard Type');
    }

    const expectedFields = getScorecardValues(agentPosition, ticket.scorecardVariant);

    if (expectedFields.length === 0) {
      missing.push('Scorecard Configuration');
    } else {
      const missingFields = [];
      for (const field of expectedFields) {
        const value = ticket.scorecardValues?.[field.key];
        if (value === null || value === undefined) {
          missingFields.push(field.label);
        }
      }

      if (missingFields.length > 0) {
        missing.push(`Scorecard: ${missingFields.join(', ')}`);
      }
    }

    if (!ticket.categories || ticket.categories.length === 0) {
      missing.push('Categories');
    }

    if (!ticket.feedback || ticket.feedback.trim() === '') {
      missing.push('Feedback');
    }

    return missing;
  }, []);

  const validateGradingPrerequisites = useCallback(async (agentId) => {
    const agent = agents.find(a => a._id === agentId);
    if (!agent) {
      return { valid: false, error: 'Agent not found' };
    }

    if (!agent.maestroName) {
      setValidationErrors({
        invalidTickets: {},
        highlightedAgentId: agentId,
        validationMode: true
      });
      navigate('/qa-manager/agents');
      toast.error('MaestroQA name missing. Please add it to continue.');
      return { valid: false, error: 'maestroName' };
    }

    const ticketsResponse = await axios.get(
      `${API_URL}/api/qa/tickets?agent=${agentId}&status=Selected&isArchived=false&limit=1000`,
      getAuthHeaders()
    );
    const selectedTicketsList = ticketsResponse.data.tickets || [];

    if (selectedTicketsList.length === 0) {
      return { valid: false, error: 'No selected tickets found for this agent' };
    }

    const invalidTickets = {};
    for (const ticket of selectedTicketsList) {
      const missing = validateTicketForGrading(ticket, agent.position);
      if (missing.length > 0) {
        invalidTickets[ticket._id] = { missing, ticketId: ticket.ticketId };
      }
    }

    if (Object.keys(invalidTickets).length > 0) {
      setValidationErrors({
        invalidTickets,
        highlightedAgentId: null,
        validationMode: true
      });
      setTicketsFilters(prev => ({
        ...prev,
        agent: agentId,
        status: 'Selected'
      }));
      navigate('/qa-manager/tickets');
      toast.error(`${Object.keys(invalidTickets).length} ticket(s) have missing information. Please complete them to continue.`);
      return { valid: false, error: 'invalidTickets', invalidTickets };
    }

    return { valid: true, tickets: selectedTicketsList };
  }, [agents, API_URL, getAuthHeaders, navigate, validateTicketForGrading]);

  const clearValidationErrors = useCallback(() => {
    setValidationErrors({
      invalidTickets: {},
      highlightedAgentId: null,
      validationMode: false
    });
  }, []);

  // ============================================
  // GRADING FUNCTIONS
  // ============================================
  const handleStartGrading = useCallback(async (agentId, source = 'dashboard') => {
    try {
      clearValidationErrors();

      const agent = agents.find(a => a._id === agentId);
      if (!agent) {
        toast.error('Agent not found');
        return;
      }

      const validation = await validateGradingPrerequisites(agentId);
      if (!validation.valid) {
        return;
      }

      const selectedTicketsList = validation.tickets;

      let hasExistingAssignment = false;
      let existingAssignment = null;

      try {
        const assignmentRes = await axios.get(
          `${API_URL}/api/qa/assignments/${agentId}/active`,
          getAuthHeaders()
        );
        if (assignmentRes.data.assignment) {
          hasExistingAssignment = true;
          existingAssignment = assignmentRes.data.assignment;
          console.log('[GRADE] Found existing assignment:', existingAssignment.assignmentName, '(weekId:', existingAssignment.weekId, ', status:', existingAssignment.status, ')');
        } else {
          console.log('[GRADE] No existing assignment found for agent, will create new one');
        }
      } catch (err) {
        console.warn('[GRADE] Error checking for existing assignment:', err.response?.status, err.message);
      }

      const csvResponse = await axios.post(
        `${API_URL}/api/qa/export/maestro/${agentId}`,
        {},
        { ...getAuthHeaders(), responseType: 'text' }
      );

      const userEmail = user?.email || '';

      // Prepare task data (without assignment name for now - will be added based on modal choice)
      const taskData = {
        agentId: agent._id,
        agentName: agent.name,
        maestroName: agent.maestroName,
        position: agent.position,
        rubricName: agent.position,
        ticketCount: selectedTicketsList.length,
        csvContent: csvResponse.data,
        fileName: `${agent.name.replace(/\s+/g, '_')}_tickets.csv`,
        qaEmail: userEmail,
        hasExistingAssignment: hasExistingAssignment,
        existingAssignmentName: existingAssignment?.assignmentName || null,
        gradedTicketIds: existingAssignment?.gradedTicketIds || [],
        tickets: selectedTicketsList.map(t => ({
          _id: t._id,
          ticketId: t.ticketId,
          scorecardValues: t.scorecardValues,
          scorecardVariant: t.scorecardVariant,
          categories: t.categories,
          feedback: t.feedback,
          notes: t.notes
        })),
        source
      };

      // If assignment exists, show modal to confirm or delete
      if (hasExistingAssignment) {
        setGradingAssignmentModal({
          open: true,
          hasExistingAssignment: true,
          existingAssignment,
          agentId: agent._id,
          agentName: agent.name,
          pendingTaskData: taskData,
          newAssignmentName: ''
        });
        return;
      }

      // No assignment exists - proceed directly with grading
      window.postMessage({
        type: 'CLARA_START_GRADING',
        data: taskData
      }, '*');

      // Record the grade button click for tracking
      try {
        await axios.post(
          `${API_URL}/api/qa/grade-clicks`,
          { agentId: agent._id, source },
          getAuthHeaders()
        );
      } catch (trackingErr) {
        console.error('Failed to record grade click:', trackingErr);
      }

      toast.success(`Starting grading for ${agent.name} (${selectedTicketsList.length} tickets, creating new assignment)`);

      const event = new CustomEvent('clara-start-grading', { detail: taskData });
      document.dispatchEvent(event);

    } catch (err) {
      console.error('Error starting grading:', err);
      toast.error(err.response?.data?.message || 'Failed to start grading');
    }
  }, [agents, API_URL, getAuthHeaders, user, validateGradingPrerequisites, clearValidationErrors]);

  // Confirm using existing assignment and start grading
  const handleConfirmGradingWithExistingAssignment = useCallback(async () => {
    const { pendingTaskData, existingAssignment } = gradingAssignmentModal;
    if (!pendingTaskData) return;

    // Update taskData to use existing assignment
    const taskData = {
      ...pendingTaskData,
      hasExistingAssignment: true,
      existingAssignmentName: existingAssignment.assignmentName,
      gradedTicketIds: existingAssignment.gradedTicketIds || []
    };

    // Close modal
    setGradingAssignmentModal(prev => ({ ...prev, open: false }));

    // Send to extension
    window.postMessage({
      type: 'CLARA_START_GRADING',
      data: taskData
    }, '*');

    // Record the grade button click for tracking
    try {
      await axios.post(
        `${API_URL}/api/qa/grade-clicks`,
        { agentId: taskData.agentId, source: taskData.source },
        getAuthHeaders()
      );
    } catch (trackingErr) {
      console.error('Failed to record grade click:', trackingErr);
    }

    toast.success(`Starting grading for ${taskData.agentName} (${taskData.ticketCount} tickets, adding to existing assignment)`);

    const event = new CustomEvent('clara-start-grading', { detail: taskData });
    document.dispatchEvent(event);
  }, [gradingAssignmentModal, API_URL, getAuthHeaders]);

  // Delete existing assignment and close modal (user can click Grade again to start fresh)
  const handleDeleteAssignmentFromModal = useCallback(async () => {
    const { existingAssignment } = gradingAssignmentModal;
    if (!existingAssignment) return;

    try {
      await axios.delete(
        `${API_URL}/api/qa/assignments/${existingAssignment._id}`,
        getAuthHeaders()
      );

      toast.success(`Assignment "${existingAssignment.assignmentName}" deleted. Click Grade again to start fresh.`);

      // Close modal - user can click Grade again
      setGradingAssignmentModal({
        open: false,
        hasExistingAssignment: false,
        existingAssignment: null,
        agentId: null,
        agentName: null,
        pendingTaskData: null,
        newAssignmentName: ''
      });
    } catch (err) {
      console.error('Error deleting assignment:', err);
      toast.error('Failed to delete assignment');
    }
  }, [gradingAssignmentModal, API_URL, getAuthHeaders]);

  // Create new assignment with custom name and start grading
  const handleCreateAssignmentAndStartGrading = useCallback(async () => {
    const { pendingTaskData, newAssignmentName } = gradingAssignmentModal;
    if (!pendingTaskData || !newAssignmentName.trim()) {
      toast.error('Please enter an assignment name');
      return;
    }

    // Update taskData with the new assignment name
    const taskData = {
      ...pendingTaskData,
      hasExistingAssignment: false,
      existingAssignmentName: null,
      gradedTicketIds: [],
      customAssignmentName: newAssignmentName.trim()
    };

    // Close modal
    setGradingAssignmentModal(prev => ({ ...prev, open: false }));

    // Send to extension
    window.postMessage({
      type: 'CLARA_START_GRADING',
      data: taskData
    }, '*');

    // Record the grade button click for tracking
    try {
      await axios.post(
        `${API_URL}/api/qa/grade-clicks`,
        { agentId: taskData.agentId, source: taskData.source },
        getAuthHeaders()
      );
    } catch (trackingErr) {
      console.error('Failed to record grade click:', trackingErr);
    }

    toast.success(`Starting grading for ${taskData.agentName} (${taskData.ticketCount} tickets, creating new assignment)`);

    const event = new CustomEvent('clara-start-grading', { detail: taskData });
    document.dispatchEvent(event);
  }, [gradingAssignmentModal, API_URL, getAuthHeaders]);

  // Close modal without action
  const handleCloseGradingAssignmentModal = useCallback(() => {
    setGradingAssignmentModal({
      open: false,
      hasExistingAssignment: false,
      existingAssignment: null,
      agentId: null,
      agentName: null,
      pendingTaskData: null,
      newAssignmentName: ''
    });
  }, []);

  // ============================================
  // NAVIGATION FUNCTIONS
  // ============================================
  const handleViewAgentTickets = useCallback((agentId) => {
    setTicketsFilters(prev => ({
      ...prev,
      agent: agentId
    }));
    navigate('/qa-manager/tickets');
  }, [navigate]);

  const handleAgentExpand = useCallback((agentId) => {
    if (expandedAgentId === agentId) {
      setExpandedAgentId(null);
      setAgentIssues({ loading: false, data: null });
    } else {
      setExpandedAgentId(agentId);
      fetchAgentIssues(agentId);
    }
  }, [expandedAgentId, fetchAgentIssues]);

  // ============================================
  // DIALOG HELPERS
  // ============================================
  const openTicketDialog = useCallback((mode, data = null, source = 'tickets') => {
    if (mode === 'create') {
      ticketFormDataRef.current = {
        agent: '',
        ticketId: '',
        status: 'Selected',
        qualityScorePercent: '',
        notes: '',
        feedback: '',
        dateEntered: new Date().toISOString().split('T')[0],
        categories: [],
        scorecardVariant: null,
        scorecardValues: {}
      };
    } else if (mode === 'edit' && data) {
      const scorecardValuesObj = data.scorecardValues && typeof data.scorecardValues === 'object'
        ? { ...data.scorecardValues }
        : {};
      ticketFormDataRef.current = {
        agent: data.agent?._id || data.agent || '',
        ticketId: data.ticketId || '',
        status: data.status || 'Selected',
        dateEntered: data.dateEntered ? new Date(data.dateEntered).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        notes: data.notes || '',
        feedback: data.feedback || '',
        qualityScorePercent: data.qualityScorePercent !== undefined ? data.qualityScorePercent : '',
        categories: data.categories || [],
        scorecardVariant: data.scorecardVariant || null,
        scorecardValues: scorecardValuesObj,
        additionalNote: data.additionalNote || ''
      };
    }
    setTicketDialog({ open: true, mode, data, source });
  }, []);

  const getCurrentTicketIndex = useCallback((ticketId) => {
    if (!ticketId || !Array.isArray(tickets)) return -1;
    return tickets.findIndex(t => t._id === ticketId);
  }, [tickets]);

  const navigateToTicket = useCallback((direction, currentTicketId, mode) => {
    const currentIndex = getCurrentTicketIndex(currentTicketId);
    if (currentIndex === -1) return null;

    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= tickets.length) return null;

    const newTicket = tickets[newIndex];

    if (mode === 'view') {
      setViewDialog({ open: true, ticket: newTicket });
    } else if (mode === 'edit') {
      openTicketDialog('edit', newTicket);
    }

    return newTicket;
  }, [getCurrentTicketIndex, tickets, openTicketDialog]);

  const navigateWithUnsavedCheck = useCallback((direction, currentTicketId, onNavigate) => {
    const doNavigate = () => {
      const newTicket = navigateToTicket(direction, currentTicketId, 'edit');
      if (onNavigate && newTicket) {
        onNavigate(newTicket);
      }
    };

    if (hasUnsavedChangesRef.current) {
      setUnsavedChangesModal({
        open: true,
        onConfirm: () => {
          setUnsavedChangesModal({ open: false, onConfirm: null });
          doNavigate();
        }
      });
    } else {
      doNavigate();
    }
  }, [navigateToTicket]);

  // ============================================
  // ASSIGNMENT FUNCTIONS
  // ============================================
  const handleViewAssignments = useCallback(async (agentId) => {
    const agent = agents.find(a => a._id === agentId);
    if (!agent) {
      toast.error('Agent not found');
      return;
    }

    setAssignmentsDialog({ open: true, agentId, agentName: agent.name });
    setAssignmentsLoading(true);

    try {
      const response = await axios.get(
        `${API_URL}/api/qa/assignments/${agentId}`,
        getAuthHeaders()
      );
      setAssignments(response.data.assignments || []);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      toast.error('Failed to load assignments');
      setAssignments([]);
    } finally {
      setAssignmentsLoading(false);
    }
  }, [agents, API_URL, getAuthHeaders]);

  const handleResetAssignment = useCallback(async (assignmentId) => {
    if (!window.confirm('Are you sure you want to reset this assignment? This will delete all tracking data for this assignment.')) {
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/api/qa/assignments/${assignmentId}`,
        getAuthHeaders()
      );
      setAssignments(prev => prev.filter(a => a._id !== assignmentId));
      toast.success('Assignment reset successfully');
    } catch (err) {
      console.error('Error resetting assignment:', err);
      toast.error('Failed to reset assignment');
    }
  }, [API_URL, getAuthHeaders]);

  // Create a new assignment manually from the Assignments dialog
  const handleCreateManualAssignment = useCallback(async (agentId, assignmentName) => {
    if (!assignmentName?.trim()) {
      toast.error('Please enter an assignment name');
      return false;
    }

    const agent = agents.find(a => a._id === agentId);
    if (!agent) {
      toast.error('Agent not found');
      return false;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/qa/assignments`,
        {
          agentId,
          assignmentName: assignmentName.trim(),
          ticketIds: [],
          rubricName: agent.position,
          qaEmail: user?.email || ''
        },
        getAuthHeaders()
      );

      // Add to local state
      setAssignments(prev => [response.data.assignment, ...prev]);
      toast.success(`Assignment "${assignmentName}" created successfully`);
      return true;
    } catch (err) {
      console.error('Error creating assignment:', err);
      toast.error(err.response?.data?.message || 'Failed to create assignment');
      return false;
    }
  }, [agents, API_URL, getAuthHeaders, user]);

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const handlePageChange = useCallback((newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const updateFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [setFilters]);

  const getSortedData = useCallback((data) => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [sortConfig]);

  // ============================================
  // EXTENSION HANDLERS
  // ============================================
  const handleCancelExtension = useCallback(() => {
    window.postMessage({ type: 'CLARA_CANCEL_GRADING' }, '*');
    const event = new CustomEvent('clara-cancel-grading');
    document.dispatchEvent(event);
    setExtensionLogs(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      message: 'Cancel signal sent to extension...',
      level: 'warning'
    }]);
  }, []);

  const handleClearExtensionLogs = useCallback(() => {
    setExtensionLogs([]);
  }, []);

  // ============================================
  // INITIAL DATA FETCH
  // ============================================
  useEffect(() => {
    fetchAgents();
    fetchAgentsForFilter();
    fetchAllExistingAgents();
    fetchPendingMacroTickets();
    fetchGraders();
    fetchReviewPendingCount();
  }, [fetchAgents, fetchAgentsForFilter, fetchAllExistingAgents, fetchPendingMacroTickets, fetchGraders, fetchReviewPendingCount]);

  // ============================================
  // EXTENSION MESSAGE LISTENER
  // ============================================
  useEffect(() => {
    const handleExtensionMessage = async (event) => {
      if (event.data && event.data.type === 'CLARA_EXTENSION_LOG') {
        const logEntry = {
          timestamp: new Date().toLocaleTimeString(),
          message: event.data.message,
          level: event.data.level || 'info'
        };
        setExtensionLogs(prev => [...prev, logEntry]);
        setTimeout(() => {
          if (extensionLogsRef.current) {
            extensionLogsRef.current.scrollTop = extensionLogsRef.current.scrollHeight;
          }
        }, 50);
      } else if (event.data && event.data.type === 'CLARA_EXTENSION_STATUS') {
        setExtensionActive(event.data.active);
        if (!event.data.active) {
          const logEntry = {
            timestamp: new Date().toLocaleTimeString(),
            message: event.data.reason || 'Extension stopped',
            level: event.data.cancelled ? 'warning' : 'success'
          };
          setExtensionLogs(prev => [...prev, logEntry]);
        }
      } else if (event.data && event.data.type === 'CLARA_ASSIGNMENT_CREATED') {
        try {
          const data = event.data.data;
          await axios.post(`${API_URL}/api/qa/assignments`, {
            agentId: data.agentId,
            assignmentName: data.assignmentName,
            ticketIds: data.ticketIds,
            rubricName: data.rubricName,
            qaEmail: data.qaEmail
          }, getAuthHeaders());
          console.log('Assignment saved to backend:', data.assignmentName);
        } catch (err) {
          console.error('Failed to save assignment:', err);
        }
      } else if (event.data && event.data.type === 'CLARA_TICKET_GRADED') {
        try {
          const data = event.data.data;
          console.log('Received CLARA_TICKET_GRADED:', data);

          if (data.ticketObjectId && data.qualityScore !== null && data.qualityScore !== undefined) {
            try {
              await axios.post(
                `${API_URL}/api/qa/tickets/${data.ticketObjectId}/grade`,
                { qualityScorePercent: data.qualityScore },
                getAuthHeaders()
              );
              console.log(`Ticket ${data.ticketId} updated with score ${data.qualityScore}% and status Graded`);
            } catch (gradeErr) {
              console.error('Failed to update ticket score:', gradeErr);
            }
          }

          const activeRes = await axios.get(
            `${API_URL}/api/qa/assignments/${data.agentId}/active`,
            getAuthHeaders()
          );
          if (activeRes.data.assignment) {
            await axios.post(
              `${API_URL}/api/qa/assignments/${activeRes.data.assignment._id}/graded/${data.ticketId}`,
              {},
              getAuthHeaders()
            );
            console.log('Ticket marked as graded in assignment:', data.ticketId);
          }
        } catch (err) {
          console.error('Failed to process ticket graded:', err);
        }
      } else if (event.data && event.data.type === 'CLARA_TASK_COMPLETED') {
        try {
          const data = event.data.data;
          const activeRes = await axios.get(
            `${API_URL}/api/qa/assignments/${data.agentId}/active`,
            getAuthHeaders()
          );
          if (activeRes.data.assignment) {
            await axios.put(
              `${API_URL}/api/qa/assignments/${activeRes.data.assignment._id}`,
              { status: 'completed', completedAt: new Date() },
              getAuthHeaders()
            );
            console.log('Assignment marked as completed');
          }
        } catch (err) {
          console.error('Failed to mark assignment as completed:', err);
        }
      }
    };

    window.addEventListener('message', handleExtensionMessage);
    return () => window.removeEventListener('message', handleExtensionMessage);
  }, [API_URL, getAuthHeaders]);

  // ============================================
  // CONTEXT VALUE
  // ============================================
  const value = {
    // Auth
    user,
    getAuthHeaders,
    isQAAdmin,
    isReviewer,

    // Review
    reviewFilters,
    setReviewFilters,
    reviewTickets,
    setReviewTickets,
    reviewPagination,
    setReviewPagination,
    reviewPendingCount,
    showReviewBanner,
    dismissReviewBanner,
    fetchReviewPendingCount,
    fetchReviewTickets,
    fetchReviewTicket,
    handleUpdateReviewTicket,
    handleApproveTicket,
    handleDenyTicket,
    fetchReviewAnalytics,

    // Loading
    loading,
    setLoading,

    // Data
    agents,
    setAgents,
    allExistingAgents,
    agentsForFilter,
    graders,
    tickets,
    setTickets,
    dashboardStats,
    pagination,
    setPagination,

    // Filters
    ticketsFilters,
    setTicketsFilters,
    archiveFilters,
    setArchiveFilters,
    filters,
    setFilters,
    updateFilters,

    // Dialogs
    agentDialog,
    setAgentDialog,
    addExistingAgentDialog,
    setAddExistingAgentDialog,
    similarAgentDialog,
    setSimilarAgentDialog,
    ticketDialog,
    setTicketDialog,
    deleteDialog,
    setDeleteDialog,
    gradeDialog,
    setGradeDialog,
    feedbackDialog,
    setFeedbackDialog,
    viewDialog,
    setViewDialog,
    manageMacrosDialog,
    setManageMacrosDialog,
    chooseMacroDialog,
    setChooseMacroDialog,
    saveAsMacroDialog,
    setSaveAsMacroDialog,
    sendMacroDialog,
    setSendMacroDialog,
    pendingMacroTickets,
    declineConfirmDialog,
    setDeclineConfirmDialog,
    unsavedChangesModal,
    setUnsavedChangesModal,
    assignmentsDialog,
    setAssignmentsDialog,
    assignments,
    assignmentsLoading,
    gradingAssignmentModal,
    setGradingAssignmentModal,
    handleConfirmGradingWithExistingAssignment,
    handleDeleteAssignmentFromModal,
    handleCreateAssignmentAndStartGrading,
    handleCloseGradingAssignmentModal,

    // Validation
    validationErrors,
    setValidationErrors,
    clearValidationErrors,

    // Extension
    extensionLogs,
    extensionActive,
    extensionLogsRef,
    handleCancelExtension,
    handleClearExtensionLogs,

    // Refs
    ticketFormDataRef,
    hasUnsavedChangesRef,
    originalFormDataRef,

    // Selection & Sorting
    selectedTickets,
    setSelectedTickets,
    selectedArchivedTickets,
    setSelectedArchivedTickets,
    focusedTicketIndex,
    setFocusedTicketIndex,
    ticketListRef,
    sortConfig,
    handleSort,
    getSortedData,

    // Agent Expansion
    expandedAgentId,
    agentIssues,
    handleAgentExpand,

    // API Functions
    fetchDashboardStats,
    fetchAgents,
    fetchAllExistingAgents,
    fetchAgentsForFilter,
    fetchGraders,
    fetchAgentIssues,
    fetchTickets,
    fetchArchivedTickets,
    fetchPendingMacroTickets,

    // Agent CRUD
    handleCreateAgent,
    handleUpdateAgent,
    handleDeleteAgent,
    handleAddExistingAgent,
    handleConfirmSimilarAgent,

    // Ticket CRUD
    handleCreateTicket,
    handleUpdateTicket,
    handleDeleteTicket,
    handleArchiveTicket,
    handleBulkArchive,
    handleBulkStatusChangeTickets,
    handleBulkDeleteTickets,
    handleArchiveAll,
    archivingAll,
    handleRestoreTicket,
    handleBulkRestore,
    handleBulkStatusChange,
    handleBulkDelete,
    handleUndoArchive,
    handleGradeTicket,
    handleUpdateFeedback,

    // Macro Tickets
    handleSendMacroTicket,
    handleAcceptMacroTicket,
    handleDeclineMacroTicket,

    // Export
    handleExportMaestro,
    handleExportSelectedTickets,

    // Validation
    validateTicketForGrading,
    validateGradingPrerequisites,

    // Grading
    handleStartGrading,

    // Navigation
    handleViewAgentTickets,
    openTicketDialog,
    getCurrentTicketIndex,
    navigateToTicket,
    navigateWithUnsavedCheck,
    handlePageChange,

    // Assignments
    handleViewAssignments,
    handleResetAssignment,
    handleCreateManualAssignment,

    // Navigation helper
    getActiveTabFromPath,
  };

  return (
    <QAManagerContext.Provider value={value}>
      {children}
    </QAManagerContext.Provider>
  );
};

export default QAManagerContext;
