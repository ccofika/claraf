import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Plus, Edit, Trash2, Filter, Download, Archive, RotateCcw, X,
  Users, CheckCircle, Target,
  FileText, ArrowUpDown, MessageSquare, Sparkles, Tag, TrendingUp, Zap, BarChart3, Search, UsersRound,
  Keyboard, RefreshCw, ChevronDown, ChevronRight, AlertTriangle, Loader2
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { DatePicker } from '../components/ui/date-picker';
import { toast } from 'sonner';
import QASearchBar from '../components/QASearchBar';
import QACommandPalette from '../components/QACommandPalette';
import QAAnalyticsDashboard from '../components/QAAnalyticsDashboard';
import QAAllAgents from '../components/QAAllAgents';
import QASummaries from '../components/QASummaries';
import QAShortcutsModal from '../components/QAShortcutsModal';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import ShareButton from '../components/Chat/ShareButton';
import TicketRichTextEditor, { TicketContentDisplay } from '../components/TicketRichTextEditor';
import SimilarFeedbacksPanel from '../components/SimilarFeedbacksPanel';
import RelatedTicketsPanel from '../components/RelatedTicketsPanel';
const QAManager = () => {
  const { user } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL;
  const [searchParams] = useSearchParams();

  // State
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [focusedTicketIndex, setFocusedTicketIndex] = useState(-1);
  const searchInputRef = useRef(null);
  const ticketListRef = useRef(null);

  // Watch for tab changes from URL (e.g., from wheel navigation)
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['dashboard', 'agents', 'tickets', 'archive', 'analytics', 'summaries'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Data state
  const [agents, setAgents] = useState([]);
  const [allExistingAgents, setAllExistingAgents] = useState([]); // All existing agents in system
  const [agentsForFilter, setAgentsForFilter] = useState([]); // Agents who have tickets (for filters)
  const [tickets, setTickets] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  // Separate filter states for tickets and archive tabs
  const [ticketsFilters, setTicketsFilters] = useState({
    agent: '',
    status: '',
    isArchived: false,
    dateFrom: '',
    dateTo: '',
    scoreMin: 0,
    scoreMax: 100,
    search: '',
    category: '',
    priority: '',
    tags: '',
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
    category: '',
    priority: '',
    tags: '',
    searchMode: 'text'
  });

  // Get current filters based on active tab
  const filters = activeTab === 'archive' ? archiveFilters : ticketsFilters;
  const setFilters = activeTab === 'archive' ? setArchiveFilters : setTicketsFilters;

  // Dialog state
  const [agentDialog, setAgentDialog] = useState({ open: false, mode: 'create', data: null });
  const [addExistingAgentDialog, setAddExistingAgentDialog] = useState({ open: false });
  const [similarAgentDialog, setSimilarAgentDialog] = useState({ open: false, similarAgents: [], newAgentName: '' });
  const [ticketDialog, setTicketDialog] = useState({ open: false, mode: 'create', data: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: null, id: null, name: '' });
  const [gradeDialog, setGradeDialog] = useState({ open: false, ticket: null });
  const [feedbackDialog, setFeedbackDialog] = useState({ open: false, ticket: null });
  const [viewDialog, setViewDialog] = useState({ open: false, ticket: null });

  // Agent expansion state (for showing unresolved issues)
  const [expandedAgentId, setExpandedAgentId] = useState(null);
  const [agentIssues, setAgentIssues] = useState({ loading: false, data: null });

  // Selection state
  const [selectedTickets, setSelectedTickets] = useState([]);

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Fetch data
  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardStats();
    } else if (activeTab === 'agents') {
      fetchAgents();
    } else if (activeTab === 'tickets' || activeTab === 'archive') {
      fetchTickets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'tickets') {
      fetchTickets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketsFilters, pagination.page]);

  useEffect(() => {
    if (activeTab === 'archive') {
      fetchTickets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archiveFilters, pagination.page]);

  useEffect(() => {
    fetchAgents(); // Always fetch agents for dropdowns
    fetchAgentsForFilter(); // Fetch all agents with tickets for filters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Comprehensive Keyboard Shortcuts (using Alt to avoid Chrome conflicts)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in inputs (except for Ctrl+Enter to save)
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) ||
                       document.activeElement?.isContentEditable;

      // Alt key shortcuts (avoid Chrome's Ctrl shortcuts)
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        switch (e.key) {
          // Tab Navigation: Alt+1/2/3/4
          case '1':
            e.preventDefault();
            setActiveTab('dashboard');
            return;
          case '2':
            e.preventDefault();
            setActiveTab('agents');
            return;
          case '3':
            e.preventDefault();
            setActiveTab('tickets');
            return;
          case '4':
            e.preventDefault();
            setActiveTab('archive');
            return;
          // Quick Actions: Alt+T/A/E/S/K
          case 't':
          case 'T':
            e.preventDefault();
            setTicketDialog({ open: true, mode: 'create', data: null });
            return;
          case 'a':
          case 'A':
            if (!isTyping) {
              e.preventDefault();
              setAgentDialog({ open: true, mode: 'create', data: null });
            }
            return;
          case 'e':
          case 'E':
            e.preventDefault();
            handleExportSelectedTickets();
            return;
          case 's':
          case 'S':
            e.preventDefault();
            // Toggle AI/Text search
            setFilters(prev => ({
              ...prev,
              searchMode: prev.searchMode === 'ai' ? 'text' : 'ai'
            }));
            toast.success(`Switched to ${filters.searchMode === 'ai' ? 'Text' : 'AI'} search`);
            return;
          case 'k':
          case 'K':
            e.preventDefault();
            setShowCommandPalette(true);
            return;
        }
      }

      // Single key shortcuts (only when not typing)
      if (!isTyping && !e.ctrlKey && !e.altKey && !e.metaKey) {
        switch (e.key) {
          case '?':
            e.preventDefault();
            setShowShortcutsModal(true);
            return;
          case '/':
            e.preventDefault();
            searchInputRef.current?.focus();
            return;
          case 'Escape':
            if (selectedTickets.length > 0) {
              setSelectedTickets([]);
              toast.info('Selection cleared');
            }
            setFocusedTicketIndex(-1);
            return;
          case 'r':
          case 'R':
            e.preventDefault();
            if (activeTab === 'dashboard') fetchDashboardStats();
            else if (activeTab === 'agents') fetchAgents();
            else fetchTickets();
            toast.success('Refreshing data...');
            return;
        }

        // Ticket list navigation (J/K) - only in tickets/archive tabs
        if ((activeTab === 'tickets' || activeTab === 'archive') && tickets.length > 0) {
          switch (e.key.toLowerCase()) {
            case 'j':
              e.preventDefault();
              setFocusedTicketIndex(prev => Math.min(prev + 1, tickets.length - 1));
              return;
            case 'k':
              e.preventDefault();
              setFocusedTicketIndex(prev => Math.max(prev - 1, 0));
              return;
            case 'enter':
              if (focusedTicketIndex >= 0 && focusedTicketIndex < tickets.length) {
                e.preventDefault();
                setViewDialog({ open: true, ticket: tickets[focusedTicketIndex] });
              }
              return;
            case 'g':
              if (focusedTicketIndex >= 0 && focusedTicketIndex < tickets.length) {
                const ticket = tickets[focusedTicketIndex];
                if (ticket.status !== 'Graded') {
                  e.preventDefault();
                  setGradeDialog({ open: true, ticket });
                }
              }
              return;
            case 'f':
              if (focusedTicketIndex >= 0 && focusedTicketIndex < tickets.length) {
                e.preventDefault();
                setFeedbackDialog({ open: true, ticket: tickets[focusedTicketIndex] });
              }
              return;
            case 'a':
              if (focusedTicketIndex >= 0 && focusedTicketIndex < tickets.length && activeTab === 'tickets') {
                e.preventDefault();
                handleArchiveTicket(tickets[focusedTicketIndex]._id);
              }
              return;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, tickets, focusedTicketIndex, selectedTickets, filters.searchMode]);

  // Scroll focused ticket into view
  useEffect(() => {
    if (focusedTicketIndex >= 0 && ticketListRef.current) {
      const focusedRow = ticketListRef.current.querySelector(`[data-ticket-index="${focusedTicketIndex}"]`);
      if (focusedRow) {
        focusedRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [focusedTicketIndex]);

  // Reset focused index when switching tabs or when tickets change
  useEffect(() => {
    setFocusedTicketIndex(-1);
  }, [activeTab]);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchDashboardStats = async () => {
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
  };

  const fetchAgents = async () => {
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
  };

  const fetchAllExistingAgents = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/qa/agents/all/existing`, getAuthHeaders());
      setAllExistingAgents(response.data);
    } catch (err) {
      console.error('Error fetching all existing agents:', err);
      toast.error('Failed to load existing agents');
    }
  };

  const fetchAgentsForFilter = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/qa/agents/with-tickets`, getAuthHeaders());
      setAgentsForFilter(response.data);
    } catch (err) {
      console.error('Error fetching agents for filter:', err);
      toast.error('Failed to load agents for filter');
    }
  };

  // Fetch agent's unresolved issues when expanding
  const fetchAgentIssues = async (agentId) => {
    try {
      setAgentIssues({ loading: true, data: null });
      const response = await axios.get(`${API_URL}/api/qa/agents/${agentId}/issues`, getAuthHeaders());
      setAgentIssues({ loading: false, data: response.data });
    } catch (err) {
      console.error('Error fetching agent issues:', err);
      setAgentIssues({ loading: false, data: null });
    }
  };

  // Toggle agent expansion
  const handleAgentExpand = (agentId) => {
    if (expandedAgentId === agentId) {
      setExpandedAgentId(null);
      setAgentIssues({ loading: false, data: null });
    } else {
      setExpandedAgentId(agentId);
      fetchAgentIssues(agentId);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);

      // Determine if we should use AI semantic search or regular text search
      const useAISearch = filters.searchMode === 'ai' && filters.search && filters.search.trim().length > 0;

      // Clear tickets immediately when starting AI search to prevent flickering
      if (useAISearch) {
        setTickets([]);
      }

      const params = new URLSearchParams();
      if (filters.agent) params.append('agent', filters.agent);
      if (filters.status) params.append('status', filters.status);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.scoreMin) params.append('scoreMin', filters.scoreMin);
      if (filters.scoreMax && filters.scoreMax < 100) params.append('scoreMax', filters.scoreMax);
      params.append('isArchived', activeTab === 'archive');

      if (useAISearch) {
        // AI Semantic Search - uses embeddings to find semantically similar tickets
        params.append('query', filters.search);
        params.append('limit', pagination.limit);

        const response = await axios.get(
          `${API_URL}/api/qa/ai-search?${params.toString()}`,
          getAuthHeaders()
        );

        // AI search returns array directly with relevanceScore
        const results = response.data || [];
        setTickets(results);

        // Update pagination for AI search results
        setPagination(prev => ({
          ...prev,
          total: results.length,
          pages: 1,
          page: 1
        }));
      } else {
        // Regular text search
        if (filters.search) params.append('search', filters.search);
        params.append('page', pagination.page);
        params.append('limit', pagination.limit);

        const response = await axios.get(
          `${API_URL}/api/qa/tickets?${params.toString()}`,
          getAuthHeaders()
        );
        setTickets(response.data.tickets || response.data);

        // Update pagination info from response
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
  };

  // Agent CRUD
  const handleCreateAgent = async (formData) => {
    try {
      // First, check for similar agents
      const checkResponse = await axios.post(
        `${API_URL}/api/qa/agents/check-similar`,
        { name: formData.name },
        getAuthHeaders()
      );

      if (checkResponse.data.exactMatch) {
        // Exact match found - automatically add existing agent
        await axios.post(
          `${API_URL}/api/qa/agents/${checkResponse.data.agent._id}/add-to-list`,
          {},
          getAuthHeaders()
        );
        setAgents([...agents, checkResponse.data.agent]);
        setAgentDialog({ open: false, mode: 'create', data: null });
        toast.success(`Agent "${checkResponse.data.agent.name}" added to your list`);
        return;
      }

      if (checkResponse.data.similar && checkResponse.data.similar.length > 0) {
        // Similar agents found - ask user
        setSimilarAgentDialog({
          open: true,
          similarAgents: checkResponse.data.similar,
          newAgentName: formData.name,
          formData: formData
        });
        return;
      }

      // No similar agents - create new one
      const response = await axios.post(`${API_URL}/api/qa/agents`, formData, getAuthHeaders());
      setAgents([...agents, response.data]);
      setAgentDialog({ open: false, mode: 'create', data: null });
      toast.success('Agent created successfully');
      fetchAgentsForFilter(); // Refresh filter list
    } catch (err) {
      console.error('Error creating agent:', err);
      toast.error(err.response?.data?.message || 'Failed to create agent');
    }
  };

  const handleUpdateAgent = async (id, formData) => {
    try {
      const response = await axios.put(`${API_URL}/api/qa/agents/${id}`, formData, getAuthHeaders());
      setAgents(agents.map(a => a._id === id ? response.data : a));
      setAgentDialog({ open: false, mode: 'create', data: null });
      toast.success('Agent updated successfully');
    } catch (err) {
      console.error('Error updating agent:', err);
      toast.error(err.response?.data?.message || 'Failed to update agent');
    }
  };

  const handleDeleteAgent = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/qa/agents/${id}`, getAuthHeaders());
      setAgents(agents.filter(a => a._id !== id));
      setDeleteDialog({ open: false, type: null, id: null, name: '' });
      toast.success('Agent removed from your grading list');
    } catch (err) {
      console.error('Error removing agent:', err);
      toast.error(err.response?.data?.message || 'Failed to remove agent');
    }
  };

  const handleAddExistingAgent = async (agentId) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/qa/agents/${agentId}/add-to-list`,
        {},
        getAuthHeaders()
      );
      setAgents([...agents, response.data]);
      setAddExistingAgentDialog({ open: false });
      toast.success(`Agent "${response.data.name}" added to your list`);
    } catch (err) {
      console.error('Error adding existing agent:', err);
      toast.error(err.response?.data?.message || 'Failed to add agent');
    }
  };

  const handleConfirmSimilarAgent = async (selectedAgentId) => {
    try {
      if (selectedAgentId) {
        // User selected an existing agent
        await handleAddExistingAgent(selectedAgentId);
      } else {
        // User wants to create new agent
        const response = await axios.post(
          `${API_URL}/api/qa/agents`,
          similarAgentDialog.formData,
          getAuthHeaders()
        );
        setAgents([...agents, response.data]);
        toast.success('Agent created successfully');
        fetchAgentsForFilter();
      }
      setSimilarAgentDialog({ open: false, similarAgents: [], newAgentName: '', formData: null });
      setAgentDialog({ open: false, mode: 'create', data: null });
    } catch (err) {
      console.error('Error handling similar agent:', err);
      toast.error(err.response?.data?.message || 'Failed to process agent');
    }
  };

  // Ticket CRUD
  const handleCreateTicket = async (formData) => {
    try {
      const response = await axios.post(`${API_URL}/api/qa/tickets`, formData, getAuthHeaders());
      const currentTickets = Array.isArray(tickets) ? tickets : [];
      setTickets([response.data, ...currentTickets]);
      setTicketDialog({ open: false, mode: 'create', data: null });
      toast.success('Ticket created successfully');
    } catch (err) {
      console.error('Error creating ticket:', err);
      toast.error(err.response?.data?.message || 'Failed to create ticket');
    }
  };

  const handleUpdateTicket = async (id, formData) => {
    try {
      const response = await axios.put(`${API_URL}/api/qa/tickets/${id}`, formData, getAuthHeaders());
      const currentTickets = Array.isArray(tickets) ? tickets : [];
      setTickets(currentTickets.map(t => t._id === id ? response.data : t));
      setTicketDialog({ open: false, mode: 'create', data: null });
      toast.success('Ticket updated successfully');
    } catch (err) {
      console.error('Error updating ticket:', err);
      toast.error(err.response?.data?.message || 'Failed to update ticket');
    }
  };

  const handleDeleteTicket = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/qa/tickets/${id}`, getAuthHeaders());
      setTickets(tickets.filter(t => t._id !== id));
      setDeleteDialog({ open: false, type: null, id: null, name: '' });
      toast.success('Ticket deleted successfully');
    } catch (err) {
      console.error('Error deleting ticket:', err);
      toast.error(err.response?.data?.message || 'Failed to delete ticket');
    }
  };

  const handleArchiveTicket = async (id) => {
    try {
      await axios.post(`${API_URL}/api/qa/tickets/${id}/archive`, {}, getAuthHeaders());
      setTickets(tickets.filter(t => t._id !== id));
      toast.success('Ticket archived successfully');
    } catch (err) {
      console.error('Error archiving ticket:', err);
      toast.error('Failed to archive ticket');
    }
  };

  const handleBulkArchive = async () => {
    if (selectedTickets.length === 0) {
      toast.error('No tickets selected');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/qa/tickets/bulk-archive`, { ticketIds: selectedTickets }, getAuthHeaders());
      setTickets(tickets.filter(t => !selectedTickets.includes(t._id)));
      setSelectedTickets([]);
      toast.success(`${selectedTickets.length} ticket(s) archived successfully`);
    } catch (err) {
      console.error('Error bulk archiving:', err);
      toast.error('Failed to archive tickets');
    }
  };

  const handleRestoreTicket = async (id) => {
    try {
      await axios.post(`${API_URL}/api/qa/tickets/${id}/restore`, {}, getAuthHeaders());
      setTickets(tickets.filter(t => t._id !== id));
      toast.success('Ticket restored successfully');
    } catch (err) {
      console.error('Error restoring ticket:', err);
      toast.error('Failed to restore ticket');
    }
  };

  // State for embedding regeneration
  const [regeneratingEmbeddings, setRegeneratingEmbeddings] = useState(false);

  const handleRegenerateEmbeddings = async () => {
    try {
      setRegeneratingEmbeddings(true);
      toast.info('Regenerating AI embeddings for all tickets... This may take a moment.');

      const response = await axios.post(
        `${API_URL}/api/qa/generate-all-embeddings`,
        { force: true }, // Force regeneration of all embeddings
        getAuthHeaders()
      );

      toast.success(`Embeddings regenerated: ${response.data.processed} tickets processed`);
    } catch (err) {
      console.error('Error regenerating embeddings:', err);
      toast.error('Failed to regenerate embeddings');
    } finally {
      setRegeneratingEmbeddings(false);
    }
  };

  const handleGradeTicket = async (id, qualityScorePercent) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/qa/tickets/${id}/grade`,
        { qualityScorePercent },
        getAuthHeaders()
      );
      const currentTickets = Array.isArray(tickets) ? tickets : [];
      setTickets(currentTickets.map(t => t._id === id ? response.data : t));
      setGradeDialog({ open: false, ticket: null });
      toast.success('Ticket graded successfully');
    } catch (err) {
      console.error('Error grading ticket:', err);
      toast.error(err.response?.data?.message || 'Failed to grade ticket');
    }
  };

  const handleUpdateFeedback = async (id, feedback) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/qa/tickets/${id}`,
        { feedback },
        getAuthHeaders()
      );
      const currentTickets = Array.isArray(tickets) ? tickets : [];
      setTickets(currentTickets.map(t => t._id === id ? response.data : t));
      setFeedbackDialog({ open: false, ticket: null });
      toast.success('Feedback saved successfully');
    } catch (err) {
      console.error('Error updating feedback:', err);
      toast.error(err.response?.data?.message || 'Failed to save feedback');
    }
  };

  const handleExportMaestro = async (agentId) => {
    try {
      // Export ALL Selected tickets for this agent (no date filter)
      const response = await axios.post(
        `${API_URL}/api/qa/export/maestro/${agentId}`,
        {}, // No date filters - export all Selected tickets
        { ...getAuthHeaders(), responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Get filename from Content-Disposition header if available
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
      console.error('Error details:', err.response?.data);
      toast.error(err.response?.data?.message || 'Failed to export selected tickets');
    }
  };

  const handleExportSelectedTickets = async () => {
    try {
      // Fetch all tickets that are not graded and not archived
      // Use high limit to get all tickets, and filter by status='Selected'
      const response = await axios.get(
        `${API_URL}/api/qa/tickets?isArchived=false&status=Selected&limit=10000`,
        getAuthHeaders()
      );

      // Get tickets array from response
      const allTickets = response.data.tickets || response.data;

      // Filter tickets: only those with status 'Selected' (not 'Graded')
      const selectedTickets = allTickets.filter(
        ticket => ticket.status === 'Selected'
      );

      if (selectedTickets.length === 0) {
        toast.error('No selected tickets to export');
        return;
      }

      // Create CSV content with only ticket IDs, one per line
      let csvContent = 'Ticket ID\n';
      selectedTickets.forEach(ticket => {
        const ticketId = ticket.ticketId || ticket._id.slice(-6);
        csvContent += `${ticketId}\n`;
      });

      // Create and download the CSV file
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

      toast.success(`Exported ${selectedTickets.length} selected tickets`);
    } catch (err) {
      console.error('Error exporting selected tickets:', err);
      toast.error(err.response?.data?.message || 'Failed to export selected tickets');
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset to page 1 when filters change
  const updateFilters = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getSortedData = (data) => {
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
  };

  // Minimal Button Component
  const Button = ({ children, variant = 'default', size = 'default', className = '', onClick, disabled, type = 'button' }) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

    const variants = {
      default: 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 focus:ring-gray-900 dark:focus:ring-gray-300',
      secondary: 'bg-white dark:bg-neutral-800 text-black dark:text-white border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 focus:ring-gray-200 dark:focus:ring-neutral-600',
      ghost: 'hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300',
      destructive: 'bg-red-600 dark:bg-red-500 text-white hover:bg-red-700 dark:hover:bg-red-600 focus:ring-red-600 dark:focus:ring-red-500',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      default: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      >
        {children}
      </button>
    );
  };

  // Minimal Stat Card Component
  const StatCard = ({ icon: Icon, label, value, trend, accent = 'gray' }) => {
    const accentColors = {
      blue: 'text-blue-600 dark:text-blue-400',
      green: 'text-green-600 dark:text-green-400',
      yellow: 'text-yellow-600 dark:text-yellow-400',
      purple: 'text-purple-600 dark:text-purple-400',
      gray: 'text-gray-600 dark:text-gray-400'
    };

    return (
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-4 hover:shadow-md dark:hover:shadow-neutral-900/50 transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1">{label}</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
            {trend && <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">{trend}</p>}
          </div>
          <div className={`${accentColors[accent]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </div>
    );
  };

  // Loading Skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      <div className="h-32 bg-gray-100 dark:bg-neutral-800 rounded-lg animate-pulse"></div>
      <div className="h-32 bg-gray-100 dark:bg-neutral-800 rounded-lg animate-pulse"></div>
      <div className="h-32 bg-gray-100 dark:bg-neutral-800 rounded-lg animate-pulse"></div>
    </div>
  );

  // Empty State Component
  const EmptyState = ({ icon: Icon, title, description, action }) => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-12 h-12 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-gray-400 dark:text-neutral-500" />
      </div>
      <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-neutral-400 mb-6 text-center max-w-sm">{description}</p>
      {action}
    </div>
  );

  // Quality Score Badge
  const QualityScoreBadge = ({ score }) => {
    if (score === null || score === undefined) {
      return <Badge variant="outline" className="text-xs">Not graded</Badge>;
    }

    let color = 'bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-neutral-300';
    if (score >= 80) color = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
    else if (score >= 60) color = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
    else if (score >= 40) color = 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400';
    else color = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>
        {score}%
      </span>
    );
  };

  // Status Badge
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      'Selected': { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400', label: 'Selected' },
      'Graded': { color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400', label: 'Graded' },
      'archived': { color: 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400', label: 'Archived' },
    };

    const config = statusConfig[status] || statusConfig['Selected'];

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // Pagination Component
  const Pagination = ({ currentPage, totalPages, onPageChange, totalItems }) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const showEllipsis = totalPages > 7;

      if (!showEllipsis) {
        // Show all pages if 7 or fewer
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Always show first page
        pages.push(1);

        if (currentPage > 3) {
          pages.push('ellipsis-start');
        }

        // Show current page and neighbors
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);

        for (let i = start; i <= end; i++) {
          pages.push(i);
        }

        if (currentPage < totalPages - 2) {
          pages.push('ellipsis-end');
        }

        // Always show last page
        pages.push(totalPages);
      }

      return pages;
    };

    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-neutral-400">
          <span>
            Showing <span className="font-medium text-gray-900 dark:text-white">{((currentPage - 1) * pagination.limit) + 1}</span> to{' '}
            <span className="font-medium text-gray-900 dark:text-white">{Math.min(currentPage * pagination.limit, totalItems)}</span> of{' '}
            <span className="font-medium text-gray-900 dark:text-white">{totalItems}</span> results
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-2"
          >
            Previous
          </Button>

          {getPageNumbers().map((page, idx) => {
            if (page === 'ellipsis-start' || page === 'ellipsis-end') {
              return (
                <span key={page} className="px-2 text-gray-400 dark:text-neutral-500">
                  ...
                </span>
              );
            }

            return (
              <button
                key={idx}
                onClick={() => onPageChange(page)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  currentPage === page
                    ? 'bg-black dark:bg-white text-white dark:text-black font-medium'
                    : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800'
                }`}
              >
                {page}
              </button>
            );
          })}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-2"
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  // Dashboard Tab
  const renderDashboard = () => {
    if (loading || !dashboardStats) {
      return <LoadingSkeleton />;
    }

    const totalTickets = dashboardStats.totalTickets || 0;
    const selectedTickets = dashboardStats.selectedTickets || 0;
    const gradedTickets = dashboardStats.gradedTickets || 0;
    const gradedRate = totalTickets > 0 ? ((gradedTickets / totalTickets) * 100).toFixed(0) : 0;

    return (
      <div className="space-y-6">
        {/* Action Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShortcutsModal(true)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
              title="Keyboard shortcuts (?)"
            >
              <Keyboard className="w-4 h-4" />
            </button>
            <button
              onClick={fetchDashboardStats}
              className="p-2 rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
              title="Refresh (R)"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <Button
            onClick={handleExportSelectedTickets}
            size="sm"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Export Selected
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={FileText}
            label="Total Tickets"
            value={totalTickets}
            trend={`${selectedTickets} pending review`}
            accent="blue"
          />
          <StatCard
            icon={CheckCircle}
            label="Graded Rate"
            value={`${gradedRate}%`}
            trend={`${gradedTickets} of ${totalTickets} graded`}
            accent="green"
          />
          <StatCard
            icon={Target}
            label="Avg Quality"
            value={dashboardStats.avgQualityScore ? `${dashboardStats.avgQualityScore.toFixed(1)}%` : 'N/A'}
            trend="Across all tickets"
            accent="yellow"
          />
          <StatCard
            icon={Users}
            label="Active Agents"
            value={dashboardStats.activeAgents || 0}
            trend={`${agents.length || 0} total agents`}
            accent="purple"
          />
        </div>

        {/* Performance Overview */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Performance Overview</h3>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">Quality metrics and ticket distribution</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-neutral-950 rounded-lg border border-gray-100 dark:border-neutral-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-700 dark:text-neutral-300">Selected Tickets</span>
                </div>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{selectedTickets}</p>
                <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">Awaiting grading</p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-neutral-950 rounded-lg border border-gray-100 dark:border-neutral-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-700 dark:text-neutral-300">Graded Tickets</span>
                </div>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{gradedTickets}</p>
                <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">Quality evaluated</p>
              </div>
            </div>
          </div>
        </div>

        {/* Agent Performance Table */}
        {dashboardStats.agentStats && dashboardStats.agentStats.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Agent Performance</h3>
              <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">Individual metrics and progress</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Agent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Tickets</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Graded</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Avg Score</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                  {dashboardStats.agentStats.map((stat, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center text-xs font-medium">
                            {stat.agentName?.charAt(0) || '?'}
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{stat.agentName || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{stat.ticketCount || 0}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 dark:bg-neutral-800 rounded-full h-1.5 max-w-[80px]">
                            <div
                              className="bg-black dark:bg-white h-1.5 rounded-full transition-all"
                              style={{ width: `${stat.ticketCount > 0 ? (stat.gradedCount / stat.ticketCount) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 dark:text-neutral-400">{stat.gradedCount || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <QualityScoreBadge score={stat.avgScore ? parseFloat(stat.avgScore.toFixed(1)) : null} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleExportMaestro(stat.agentId)}
                          className="text-xs text-gray-600 dark:text-neutral-400 hover:text-black dark:hover:text-white flex items-center gap-1.5 ml-auto transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Export
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Agents Tab
  const renderAgents = () => {
    const sortedAgents = getSortedData(agents);

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Agents</h2>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">Manage QA agents for this week's grading</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => {
              fetchAllExistingAgents();
              setAddExistingAgentDialog({ open: true });
            }}>
              <Users className="w-4 h-4 mr-1.5" />
              Add Existing
            </Button>
            <Button size="sm" onClick={() => setAgentDialog({ open: true, mode: 'create', data: null })}>
              <Plus className="w-4 h-4 mr-1.5" />
              New Agent
            </Button>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : agents.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg">
            <EmptyState
              icon={Users}
              title="No agents found"
              description="Get started by creating your first QA agent."
              action={
                <Button onClick={() => setAgentDialog({ open: true, mode: 'create', data: null })}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create Agent
                </Button>
              }
            />
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800">
                <tr>
                  <th
                    className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Name
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Position</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Team</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                {sortedAgents.map((agent) => {
                  const isExpanded = expandedAgentId === agent._id;
                  return (
                    <React.Fragment key={agent._id}>
                      <tr className="group hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleAgentExpand(agent._id)}
                            className="flex items-center gap-3 w-full text-left group/name"
                          >
                            <div className="w-5 h-5 flex items-center justify-center text-gray-400 dark:text-neutral-500">
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </div>
                            <div className="w-7 h-7 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center text-xs font-medium">
                              {agent.name?.charAt(0) || '?'}
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white group-hover/name:text-blue-600 dark:group-hover/name:text-blue-400 transition-colors">{agent.name}</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-neutral-500">{agent.position || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-neutral-500">{agent.team || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            agent.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400'
                          }`}>
                            {agent.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleExportMaestro(agent._id)}
                              className="p-1.5 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition-colors"
                              title="Export"
                            >
                              <Download className="w-4 h-4 text-gray-500 dark:text-neutral-400" />
                            </button>
                            <button
                              onClick={() => setAgentDialog({ open: true, mode: 'edit', data: agent })}
                              className="p-1.5 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4 text-gray-500 dark:text-neutral-400" />
                            </button>
                            <button
                              onClick={() => setDeleteDialog({ open: true, type: 'agent', id: agent._id, name: agent.name })}
                              className="p-1.5 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition-colors"
                              title="Remove"
                            >
                              <Trash2 className="w-4 h-4 text-gray-500 dark:text-neutral-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Expanded row - Agent Issues */}
                      {isExpanded && (
                        <tr className="bg-gray-50/50 dark:bg-neutral-900/50">
                          <td colSpan={5} className="px-4 py-4">
                            <div className="ml-8">
                              {agentIssues.loading ? (
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-neutral-400">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Loading issues...
                                </div>
                              ) : agentIssues.data?.unresolvedCount === 0 ? (
                                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                  <CheckCircle className="w-4 h-4" />
                                  No unresolved issues - great performance!
                                </div>
                              ) : agentIssues.data?.issues?.length > 0 ? (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                                    <AlertTriangle className="w-4 h-4" />
                                    {agentIssues.data.unresolvedCount} unresolved issue{agentIssues.data.unresolvedCount !== 1 ? 's' : ''} (last 3 weeks)
                                  </div>
                                  <div className="grid gap-2">
                                    {agentIssues.data.issues.map((issue, idx) => (
                                      <div
                                        key={issue.ticketId || idx}
                                        className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg p-3"
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="text-xs font-mono text-gray-500 dark:text-neutral-500">
                                                {issue.ticketNumber}
                                              </span>
                                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                                issue.qualityScore < 70
                                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                  : issue.qualityScore < 80
                                                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                                                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                              }`}>
                                                {issue.qualityScore}%
                                              </span>
                                              {issue.category && (
                                                <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-neutral-400">
                                                  {issue.category}
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-sm text-gray-900 dark:text-white">
                                              {issue.summary}
                                            </p>
                                            {issue.gradedDate && (
                                              <p className="text-xs text-gray-400 dark:text-neutral-500 mt-1">
                                                {new Date(issue.gradedDate).toLocaleDateString()}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500 dark:text-neutral-400">
                                  No issues data available
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // Tickets Tab
  const renderTickets = () => {
    const sortedTickets = getSortedData(tickets);

    return (
      <div className="space-y-4">
        {/* Unified Search Bar with AI/Text toggle and filters */}
        <div className="mb-4">
          <QASearchBar
            currentFilters={ticketsFilters}
            onFilterChange={setTicketsFilters}
            agents={agents}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tickets</h2>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">Review and grade support tickets</p>
          </div>
          <Button size="sm" onClick={() => setTicketDialog({ open: true, mode: 'create', data: null })}>
            <Plus className="w-4 h-4 mr-1.5" />
            New Ticket
          </Button>
        </div>

        {/* Bulk Actions */}
        {selectedTickets.length > 0 && (
          <div className="bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-neutral-300">{selectedTickets.length} ticket(s) selected</span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setSelectedTickets([])}>
                Clear
              </Button>
              <Button size="sm" onClick={handleBulkArchive}>
                <Archive className="w-4 h-4 mr-1.5" />
                Archive Selected
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <LoadingSkeleton />
        ) : tickets.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg">
            <EmptyState
              icon={FileText}
              title="No tickets found"
              description="No tickets match your current filters."
              action={
                <Button onClick={() => setTicketDialog({ open: true, mode: 'create', data: null })}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create Ticket
                </Button>
              }
            />
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800">
                <tr>
                  <th className="px-4 py-2.5 w-8">
                    <input
                      type="checkbox"
                      checked={selectedTickets.length === tickets.length && tickets.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTickets(tickets.map(t => t._id));
                        } else {
                          setSelectedTickets([]);
                        }
                      }}
                      className="rounded border-gray-300 dark:border-neutral-600"
                    />
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Agent</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Score</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800" ref={ticketListRef}>
                {sortedTickets.map((ticket, index) => (
                  <tr
                    key={ticket._id}
                    data-ticket-index={index}
                    className={`group transition-colors cursor-pointer ${
                      focusedTicketIndex === index
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-neutral-800/50'
                    }`}
                    onClick={(e) => {
                      // Don't open dialog if clicking on checkbox or action buttons
                      if (e.target.closest('input[type="checkbox"]') || e.target.closest('button')) {
                        return;
                      }
                      setFocusedTicketIndex(index);
                      setViewDialog({ open: true, ticket });
                    }}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedTickets.includes(ticket._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTickets([...selectedTickets, ticket._id]);
                          } else {
                            setSelectedTickets(selectedTickets.filter(id => id !== ticket._id));
                          }
                        }}
                        className="rounded border-gray-300 dark:border-neutral-600"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-neutral-400" onClick={(e) => e.stopPropagation()}>{ticket.ticketId || ticket._id.slice(-6)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white" onClick={(e) => e.stopPropagation()}>
                      {ticket.agent?.name || ticket.agentName || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-neutral-500">
                      {new Date(ticket.dateEntered || ticket.createdAt || ticket.reviewDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-4 py-3">
                      <QualityScoreBadge score={ticket.qualityScorePercent} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {ticket.status !== 'Graded' && (
                          <button
                            onClick={() => setGradeDialog({ open: true, ticket })}
                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition-colors"
                            title="Grade"
                          >
                            <Target className="w-4 h-4 text-gray-500 dark:text-neutral-400" />
                          </button>
                        )}
                        <button
                          onClick={() => setFeedbackDialog({ open: true, ticket })}
                          className="p-1.5 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition-colors"
                          title="Feedback"
                        >
                          <MessageSquare className="w-4 h-4 text-gray-500 dark:text-neutral-400" />
                        </button>
                        <button
                          onClick={() => setTicketDialog({ open: true, mode: 'edit', data: ticket })}
                          className="p-1.5 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-gray-500 dark:text-neutral-400" />
                        </button>
                        <button
                          onClick={() => handleArchiveTicket(ticket._id)}
                          className="p-1.5 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition-colors"
                          title="Archive"
                        >
                          <Archive className="w-4 h-4 text-gray-500 dark:text-neutral-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              totalItems={pagination.total}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    );
  };

  // Archive Tab
  const renderArchive = () => {
    // For AI search, tickets are already sorted by relevance, don't re-sort
    const isAISearch = archiveFilters.searchMode === 'ai' && archiveFilters.search && archiveFilters.search.trim().length > 0;
    const sortedTickets = isAISearch ? tickets : getSortedData(tickets);

    return (
      <div className="space-y-4">
        {/* Unified Search Bar with AI/Text toggle and filters */}
        <div className="mb-4">
          <QASearchBar
            currentFilters={archiveFilters}
            onFilterChange={setArchiveFilters}
            agents={agentsForFilter}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Archive</h2>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
              {isAISearch
                ? `Found ${tickets.length} semantically similar tickets`
                : 'Archived tickets from all QA agents'}
            </p>
          </div>
          {/* Regenerate Embeddings Button - useful when switching models or updating ticket content */}
          <button
            onClick={handleRegenerateEmbeddings}
            disabled={regeneratingEmbeddings}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg
              bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300
              hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed"
            title="Regenerate AI embeddings for better semantic search"
          >
            <Zap className="w-3.5 h-3.5" />
            {regeneratingEmbeddings ? 'Regenerating...' : 'Refresh AI Index'}
          </button>
        </div>

        {loading ? (
          isAISearch ? (
            // Custom AI search loading state
            <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-12">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <Sparkles className="w-8 h-8 text-purple-500 animate-pulse" />
                  <div className="absolute inset-0 w-8 h-8 border-2 border-purple-500/30 rounded-full animate-ping" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Searching with AI...</p>
                  <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">Finding semantically similar tickets</p>
                </div>
              </div>
            </div>
          ) : (
            <LoadingSkeleton />
          )
        ) : tickets.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg">
            <EmptyState
              icon={Archive}
              title={isAISearch ? "No matching tickets found" : "No archived tickets"}
              description={isAISearch
                ? "Try different search terms or check if tickets have embeddings generated."
                : "Archived tickets will appear here."}
            />
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800">
                <tr>
                  {isAISearch && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Match</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Archived Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800" ref={activeTab === 'archive' ? ticketListRef : undefined}>
                {sortedTickets.map((ticket, index) => (
                  <tr
                    key={ticket._id}
                    data-ticket-index={index}
                    className={`group transition-colors cursor-pointer ${
                      focusedTicketIndex === index
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-neutral-800/50'
                    }`}
                    onClick={(e) => {
                      // Don't open dialog if clicking on action buttons
                      if (e.target.closest('button')) {
                        return;
                      }
                      setFocusedTicketIndex(index);
                      setViewDialog({ open: true, ticket });
                    }}
                  >
                    {isAISearch && (
                      <td className="px-4 py-3">
                        <div
                          className="flex items-center gap-1.5 cursor-help"
                          title={`Hybrid: ${ticket.relevanceScore}%\nSemantic: ${ticket.semanticScore || '-'}%\nKeyword: ${ticket.keywordScore || '-'}%`}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                          <span className={`text-xs font-semibold ${
                            ticket.relevanceScore >= 70 ? 'text-green-600 dark:text-green-400' :
                            ticket.relevanceScore >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-gray-500 dark:text-neutral-400'
                          }`}>
                            {ticket.relevanceScore}%
                          </span>
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-neutral-400" onClick={(e) => e.stopPropagation()}>{ticket.ticketId || ticket._id.slice(-6)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white" onClick={(e) => e.stopPropagation()}>{ticket.agent?.name || 'Unknown'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-4 py-3">
                      <QualityScoreBadge score={ticket.qualityScorePercent} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-neutral-500">
                      {ticket.archivedDate ? new Date(ticket.archivedDate).toLocaleDateString() : new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleRestoreTicket(ticket._id)}
                          className="p-1.5 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition-colors"
                          title="Restore"
                        >
                          <RotateCcw className="w-4 h-4 text-gray-500 dark:text-neutral-400" />
                        </button>
                        <button
                          onClick={() => setDeleteDialog({ open: true, type: 'ticket', id: ticket._id, name: ticket.ticketId })}
                          className="p-1.5 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-gray-500 dark:text-neutral-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              totalItems={pagination.total}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    );
  };

  // Agent Dialog Component
  const AgentDialogContent = () => {
    const formRef = useRef(null);
    const [formData, setFormData] = useState({
      name: '',
      position: '',
      team: '',
      goalMinDate: '',
      goalMaxDate: '',
      isActive: true
    });

    useEffect(() => {
      if (agentDialog.data) {
        setFormData({
          name: agentDialog.data.name || '',
          position: agentDialog.data.position || '',
          team: agentDialog.data.team || '',
          goalMinDate: agentDialog.data.goalMinDate ? new Date(agentDialog.data.goalMinDate).toISOString().split('T')[0] : '',
          goalMaxDate: agentDialog.data.goalMaxDate ? new Date(agentDialog.data.goalMaxDate).toISOString().split('T')[0] : '',
          isActive: agentDialog.data.isActive !== undefined ? agentDialog.data.isActive : true
        });
      } else {
        setFormData({
          name: '',
          position: '',
          team: '',
          goalMinDate: '',
          goalMaxDate: '',
          isActive: true
        });
      }
    }, [agentDialog.data]);

    // Ctrl+Enter to save
    useEffect(() => {
      const handleKeyDown = (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
          e.preventDefault();
          formRef.current?.requestSubmit();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSubmit = (e) => {
      e.preventDefault();
      if (agentDialog.mode === 'create') {
        handleCreateAgent(formData);
      } else {
        handleUpdateAgent(agentDialog.data._id, formData);
      }
    };

    return (
      <Dialog open={agentDialog.open} onOpenChange={(open) => setAgentDialog({ ...agentDialog, open })}>
        <DialogContent className="bg-white dark:bg-neutral-900 max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {agentDialog.mode === 'create' ? 'Create Agent' : 'Edit Agent'}
            </DialogTitle>
          </DialogHeader>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5">Name <span className="text-red-600 dark:text-red-400">*</span></Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter agent name"
                required
                className="text-sm"
              />
            </div>

            <div>
              <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5">Position</Label>
              <Input
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Enter position"
                className="text-sm"
              />
            </div>

            <div>
              <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5">Team</Label>
              <Input
                value={formData.team}
                onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                placeholder="Enter team name"
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5">Goal Min Date</Label>
                <DatePicker
                  value={formData.goalMinDate}
                  onChange={(value) => setFormData({ ...formData, goalMinDate: value })}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5">Goal Max Date</Label>
                <DatePicker
                  value={formData.goalMaxDate}
                  onChange={(value) => setFormData({ ...formData, goalMaxDate: value })}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 dark:border-neutral-600"
              />
              <Label htmlFor="isActive" className="text-xs text-gray-600 dark:text-neutral-400">Active Agent</Label>
            </div>

            <DialogFooter className="pt-4 border-t border-gray-200 dark:border-neutral-800">
              <Button type="button" variant="secondary" onClick={() => setAgentDialog({ ...agentDialog, open: false })}>
                Cancel
              </Button>
              <Button type="submit">
                {agentDialog.mode === 'create' ? 'Create Agent' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // Add Existing Agent Dialog Component
  const AddExistingAgentDialog = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredAgents = allExistingAgents.filter(agent =>
      !agents.some(a => a._id === agent._id) && // Not already in user's list
      agent.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <Dialog open={addExistingAgentDialog.open} onOpenChange={(open) => setAddExistingAgentDialog({ open })}>
        <DialogContent className="bg-white dark:bg-neutral-900 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">Add Existing Agent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-gray-700 dark:text-neutral-300 mb-2">Search agents</Label>
              <Input
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredAgents.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-neutral-400 text-center py-4">
                  No agents found
                </p>
              ) : (
                filteredAgents.map(agent => (
                  <button
                    key={agent._id}
                    onClick={() => handleAddExistingAgent(agent._id)}
                    className="w-full p-3 text-left border border-gray-200 dark:border-neutral-800 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center text-xs font-medium">
                        {agent.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{agent.name}</p>
                        {agent.position && (
                          <p className="text-xs text-gray-500 dark:text-neutral-400">{agent.position}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setAddExistingAgentDialog({ open: false })}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Similar Agent Confirmation Dialog
  const SimilarAgentDialog = () => {
    const [selectedAgent, setSelectedAgent] = useState(null);

    return (
      <Dialog open={similarAgentDialog.open} onOpenChange={(open) => setSimilarAgentDialog({ ...similarAgentDialog, open })}>
        <DialogContent className="bg-white dark:bg-neutral-900 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">Similar Agent Found</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-neutral-400">
              We found similar agents in the system. Did you want to add one of these existing agents?
            </p>
            <div className="space-y-2">
              {similarAgentDialog.similarAgents.map(agent => (
                <label
                  key={agent._id}
                  className="flex items-center gap-3 p-3 border border-gray-200 dark:border-neutral-800 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <input
                    type="radio"
                    name="similarAgent"
                    value={agent._id}
                    checked={selectedAgent === agent._id}
                    onChange={() => setSelectedAgent(agent._id)}
                    className="text-black dark:text-white"
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center text-xs font-medium">
                      {agent.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{agent.name}</p>
                      {agent.position && (
                        <p className="text-xs text-gray-500 dark:text-neutral-400">{agent.position}</p>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex items-center gap-2 p-3 border border-gray-200 dark:border-neutral-800 rounded-lg">
              <input
                type="radio"
                name="similarAgent"
                value="create-new"
                checked={selectedAgent === 'create-new'}
                onChange={() => setSelectedAgent('create-new')}
                className="text-black dark:text-white"
              />
              <label className="text-sm text-gray-700 dark:text-neutral-300 cursor-pointer">
                No, create new agent: <strong>{similarAgentDialog.newAgentName}</strong>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => {
              setSimilarAgentDialog({ open: false, similarAgents: [], newAgentName: '', formData: null });
              setSelectedAgent(null);
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedAgent === 'create-new') {
                  handleConfirmSimilarAgent(null);
                } else if (selectedAgent) {
                  handleConfirmSimilarAgent(selectedAgent);
                }
                setSelectedAgent(null);
              }}
              disabled={!selectedAgent}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Ticket Dialog Component
  const TicketDialogContent = () => {
    const formRef = useRef(null);
    const [rightPanelMode, setRightPanelMode] = useState('ai'); // 'ai' | 'related'
    const [formData, setFormData] = useState({
      agent: '',
      ticketId: '',
      status: 'Selected',
      dateEntered: new Date().toISOString().split('T')[0],
      notes: '',
      feedback: '',
      qualityScorePercent: '',
      category: 'Other'
    });

    useEffect(() => {
      if (ticketDialog.data) {
        setFormData({
          agent: ticketDialog.data.agent?._id || ticketDialog.data.agent || '',
          ticketId: ticketDialog.data.ticketId || '',
          status: ticketDialog.data.status || 'Selected',
          dateEntered: ticketDialog.data.dateEntered ? new Date(ticketDialog.data.dateEntered).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          notes: ticketDialog.data.notes || '',
          feedback: ticketDialog.data.feedback || '',
          qualityScorePercent: ticketDialog.data.qualityScorePercent !== undefined ? ticketDialog.data.qualityScorePercent : '',
          category: ticketDialog.data.category || 'Other'
        });
      } else {
        setFormData({
          agent: '',
          ticketId: '',
          status: 'Selected',
          dateEntered: new Date().toISOString().split('T')[0],
          notes: '',
          feedback: '',
          qualityScorePercent: '',
          category: 'Other'
        });
      }
    }, [ticketDialog.data]);

    // Ctrl+Enter to save
    useEffect(() => {
      const handleKeyDown = (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
          e.preventDefault();
          formRef.current?.requestSubmit();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSubmit = (e) => {
      e.preventDefault();
      if (ticketDialog.mode === 'create') {
        handleCreateTicket(formData);
      } else {
        handleUpdateTicket(ticketDialog.data._id, formData);
      }
    };

    return (
      <Dialog open={ticketDialog.open} onOpenChange={(open) => setTicketDialog({ ...ticketDialog, open })}>
        <DialogContent hideCloseButton className="bg-white dark:bg-neutral-900 !max-w-none !w-screen !h-screen !max-h-screen !rounded-none p-0 gap-0 flex flex-col">
          {/* Header */}
          <DialogHeader className="flex-shrink-0 px-4 py-2.5 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-sm font-semibold text-gray-900 dark:text-white">
                {ticketDialog.mode === 'create' ? 'Create Ticket' : 'Edit Ticket'}
              </DialogTitle>
              <button
                onClick={() => setTicketDialog({ ...ticketDialog, open: false })}
                className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-neutral-800 text-gray-500 dark:text-neutral-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </DialogHeader>

          {/* Main Content - 50/50 Split */}
          <form ref={formRef} onSubmit={handleSubmit} className="flex flex-1 overflow-hidden">
            {/* LEFT SIDE - Ticket Form */}
            <div className="w-1/2 flex flex-col border-r border-gray-200 dark:border-neutral-800 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Top Section: Agent, Ticket ID, Date Entered */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5 block">Agent <span className="text-red-600 dark:text-red-400">*</span></Label>
                    <select
                      value={formData.agent}
                      onChange={(e) => setFormData({ ...formData, agent: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Agent</option>
                      {agents.map(agent => (
                        <option key={agent._id} value={agent._id}>{agent.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5 block">Ticket ID <span className="text-red-600 dark:text-red-400">*</span></Label>
                    <Input
                      value={formData.ticketId}
                      onChange={(e) => setFormData({ ...formData, ticketId: e.target.value })}
                      placeholder="Enter ticket ID"
                      required
                      className="text-sm bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5 block">Date Entered</Label>
                    <DatePicker
                      value={formData.dateEntered}
                      onChange={(value) => setFormData({ ...formData, dateEntered: value })}
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Notes Section */}
                <div>
                  <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    Notes
                  </Label>
                  <TicketRichTextEditor
                    value={formData.notes}
                    onChange={(html) => setFormData({ ...formData, notes: html })}
                    placeholder="Internal notes for yourself"
                    rows={5}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white resize-none min-h-[140px]"
                  />
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-neutral-700"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 bg-white dark:bg-neutral-900 text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                      Grading Information
                    </span>
                  </div>
                </div>

                {/* Bottom Section: Status, Quality Score, Category */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5 block">Status</Label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white"
                    >
                      <option value="Selected">Selected</option>
                      <option value="Graded">Graded</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5 block">Quality Score (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.qualityScorePercent}
                      onChange={(e) => setFormData({ ...formData, qualityScorePercent: e.target.value })}
                      placeholder="0-100"
                      className="text-sm bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800"
                    />
                  </div>
                  <div>
                    <Label className={`text-xs mb-1.5 block ${
                      (!formData.category || formData.category === 'Other') && rightPanelMode === 'related'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-neutral-400'
                    }`}>
                      Category
                      {(!formData.category || formData.category === 'Other') && rightPanelMode === 'related' && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className={`w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white transition-all ${
                        (!formData.category || formData.category === 'Other') && rightPanelMode === 'related'
                          ? 'border-2 border-red-400 dark:border-red-500 ring-2 ring-red-200 dark:ring-red-500/20 focus:ring-red-400 dark:focus:ring-red-500'
                          : 'border border-gray-200 dark:border-neutral-800 focus:ring-gray-900 dark:focus:ring-gray-300'
                      }`}
                    >
                      <option value="Account closure">Account closure</option>
                      <option value="ACP usage">ACP usage</option>
                      <option value="Account recovery">Account recovery</option>
                      <option value="Affiliate program">Affiliate program</option>
                      <option value="Available bonuses">Available bonuses</option>
                      <option value="Balance issues">Balance issues</option>
                      <option value="Bet | Bet archive">Bet | Bet archive</option>
                      <option value="Birthday bonus">Birthday bonus</option>
                      <option value="Break in play">Break in play</option>
                      <option value="Bonus crediting">Bonus crediting</option>
                      <option value="Bonus drops">Bonus drops</option>
                      <option value="Casino">Casino</option>
                      <option value="Coin mixing | AML">Coin mixing | AML</option>
                      <option value="Compliance (KYC, Terms of service, Privacy)">Compliance (KYC, Terms of service, Privacy)</option>
                      <option value="Crypto - General">Crypto - General</option>
                      <option value="Crypto deposits">Crypto deposits</option>
                      <option value="Crypto withdrawals">Crypto withdrawals</option>
                      <option value="Data deletion">Data deletion</option>
                      <option value="Deposit bonus">Deposit bonus</option>
                      <option value="Exclusion | General">Exclusion | General</option>
                      <option value="Exclusion | Self exclusion">Exclusion | Self exclusion</option>
                      <option value="Exclusion | Casino exclusion">Exclusion | Casino exclusion</option>
                      <option value="Fiat General">Fiat General</option>
                      <option value="Fiat - CAD">Fiat - CAD</option>
                      <option value="Fiat - BRL">Fiat - BRL</option>
                      <option value="Fiat - JPY">Fiat - JPY</option>
                      <option value="Fiat - INR">Fiat - INR</option>
                      <option value="Fiat - PEN/ARS/CLP">Fiat - PEN/ARS/CLP</option>
                      <option value="Forum">Forum</option>
                      <option value="Funds recovery">Funds recovery</option>
                      <option value="Games issues">Games issues</option>
                      <option value="Games | Providers | Rules">Games | Providers | Rules</option>
                      <option value="Games | Live games">Games | Live games</option>
                      <option value="Hacked accounts">Hacked accounts</option>
                      <option value="In-game chat | Third party chat">In-game chat | Third party chat</option>
                      <option value="Monthly bonus">Monthly bonus</option>
                      <option value="No luck tickets | RTP">No luck tickets | RTP</option>
                      <option value="Phishing | Scam attempt">Phishing | Scam attempt</option>
                      <option value="Phone removal">Phone removal</option>
                      <option value="Pre/Post monthly bonus">Pre/Post monthly bonus</option>
                      <option value="Promotions">Promotions</option>
                      <option value="Provably fair">Provably fair</option>
                      <option value="Race">Race</option>
                      <option value="Rakeback">Rakeback</option>
                      <option value="Reload">Reload</option>
                      <option value="Responsible gambling">Responsible gambling</option>
                      <option value="Roles">Roles</option>
                      <option value="Rollover">Rollover</option>
                      <option value="Security (2FA, Password, Email codes)">Security (2FA, Password, Email codes)</option>
                      <option value="Sportsbook">Sportsbook</option>
                      <option value="Stake basics">Stake basics</option>
                      <option value="Stake chat">Stake chat</option>
                      <option value="Stake original">Stake original</option>
                      <option value="Tech issues | Jira cases | Bugs">Tech issues | Jira cases | Bugs</option>
                      <option value="Tip recovery">Tip recovery</option>
                      <option value="VIP host">VIP host</option>
                      <option value="VIP program">VIP program</option>
                      <option value="Welcome bonus">Welcome bonus</option>
                      <option value="Weekly bonus">Weekly bonus</option>
                      <option value="Other">Other</option>
                    </select>
                    {(!formData.category || formData.category === 'Other') && rightPanelMode === 'related' && (
                      <p className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        This field must be filled for Related Tickets
                      </p>
                    )}
                  </div>
                </div>

                {/* Feedback Section */}
                <div>
                  <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5 flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Feedback
                  </Label>
                  <TicketRichTextEditor
                    value={formData.feedback}
                    onChange={(html) => setFormData({ ...formData, feedback: html })}
                    placeholder="Feedback to agent after grading"
                    rows={5}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white resize-none min-h-[140px]"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-neutral-800">
                  <Button type="button" variant="secondary" onClick={() => setTicketDialog({ ...ticketDialog, open: false })}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {ticketDialog.mode === 'create' ? 'Create Ticket' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE - AI/Related Toggle Panel */}
            <div className="w-1/2 flex flex-col bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 overflow-hidden relative">
              {/* Subtle grid pattern overlay */}
              <div
                className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
                style={{
                  backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
                  backgroundSize: '40px 40px'
                }}
              />

              {/* Toggle Header */}
              <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm relative z-10">
                <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-neutral-800 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setRightPanelMode('ai')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                      rightPanelMode === 'ai'
                        ? 'bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    AI Similar
                  </button>
                  <button
                    type="button"
                    onClick={() => setRightPanelMode('related')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                      rightPanelMode === 'related'
                        ? 'bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Related
                  </button>
                </div>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-hidden relative z-10">
                {rightPanelMode === 'ai' ? (
                  <SimilarFeedbacksPanel
                    notes={formData.notes}
                    ticketId={ticketDialog.data?._id}
                    onCopyFeedback={(feedback) => {
                      // Append to existing feedback
                      const currentFeedback = formData.feedback || '';
                      const separator = currentFeedback.trim() ? '\n\n' : '';
                      setFormData(prev => ({
                        ...prev,
                        feedback: currentFeedback + separator + feedback
                      }));
                    }}
                  />
                ) : (
                  <RelatedTicketsPanel
                    agentId={formData.agent}
                    category={formData.category}
                    currentTicketId={ticketDialog.data?._id}
                  />
                )}
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // Grade Dialog Component
  const GradeDialogContent = () => {
    const formRef = useRef(null);
    const [score, setScore] = useState(gradeDialog.ticket?.qualityScorePercent || 80);

    // Ctrl+Enter to save
    useEffect(() => {
      const handleKeyDown = (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
          e.preventDefault();
          formRef.current?.requestSubmit();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSubmit = (e) => {
      e.preventDefault();
      handleGradeTicket(gradeDialog.ticket._id, score);
    };

    return (
      <Dialog open={gradeDialog.open} onOpenChange={(open) => setGradeDialog({ ...gradeDialog, open })}>
        <DialogContent className="bg-white dark:bg-neutral-900 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">Grade Ticket</DialogTitle>
          </DialogHeader>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5">Quality Score (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(parseInt(e.target.value))}
                required
                className="text-sm bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800"
              />
              <div className="mt-2 h-2 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-black dark:bg-white transition-all"
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setGradeDialog({ open: false, ticket: null })}>
                Cancel
              </Button>
              <Button type="submit">Grade</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // Feedback Dialog Component
  const FeedbackDialogContent = () => {
    const formRef = useRef(null);
    const [feedback, setFeedback] = useState(feedbackDialog.ticket?.feedback || '');

    // Ctrl+Enter to save
    useEffect(() => {
      const handleKeyDown = (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
          e.preventDefault();
          formRef.current?.requestSubmit();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSubmit = (e) => {
      e.preventDefault();
      handleUpdateFeedback(feedbackDialog.ticket._id, feedback);
    };

    return (
      <Dialog open={feedbackDialog.open} onOpenChange={(open) => setFeedbackDialog({ ...feedbackDialog, open })}>
        <DialogContent className="bg-white dark:bg-neutral-900 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">Add Feedback</DialogTitle>
          </DialogHeader>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5">Feedback</Label>
              <TicketRichTextEditor
                value={feedback}
                onChange={(html) => setFeedback(html)}
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white"
                placeholder="Enter your feedback..."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setFeedbackDialog({ open: false, ticket: null })}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // View Ticket Details Dialog Component - Full Screen 50/50 Layout
  const ViewTicketDialogContent = () => {
    const [rightPanelMode, setRightPanelMode] = useState('ai'); // 'ai' | 'related'

    if (!viewDialog.ticket) return null;

    const ticket = viewDialog.ticket;

    return (
      <Dialog open={viewDialog.open} onOpenChange={(open) => setViewDialog({ ...viewDialog, open })}>
        <DialogContent hideCloseButton className="bg-white dark:bg-neutral-900 !max-w-none !w-screen !h-screen !max-h-screen !rounded-none p-0 gap-0 flex flex-col">
          {/* Header */}
          <DialogHeader className="flex-shrink-0 px-4 py-2.5 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-sm font-semibold text-gray-900 dark:text-white">
                Ticket Details
              </DialogTitle>
              <div className="flex items-center gap-2">
                {!ticket.isArchived && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setViewDialog({ open: false, ticket: null });
                      setTicketDialog({ open: true, mode: 'edit', data: ticket });
                    }}
                  >
                    <Edit className="w-4 h-4 mr-1.5" />
                    Edit Ticket
                  </Button>
                )}
                <button
                  onClick={() => setViewDialog({ open: false, ticket: null })}
                  className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-neutral-800 text-gray-500 dark:text-neutral-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </DialogHeader>

          {/* Main Content - 50/50 Split */}
          <div className="flex flex-1 overflow-hidden">
            {/* LEFT SIDE - Ticket Information */}
            <div className="w-1/2 flex flex-col border-r border-gray-200 dark:border-neutral-800 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Top Section: Agent, Ticket ID, Date Entered */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-neutral-950 rounded-lg p-4 border border-gray-200 dark:border-neutral-800">
                    <p className="text-xs text-gray-500 dark:text-neutral-400 mb-1 uppercase tracking-wide">Agent</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.agent?.name || ticket.agentName || 'Unknown'}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-neutral-950 rounded-lg p-4 border border-gray-200 dark:border-neutral-800">
                    <p className="text-xs text-gray-500 dark:text-neutral-400 mb-1 uppercase tracking-wide">Ticket ID</p>
                    <p className="text-sm font-mono font-medium text-gray-900 dark:text-white">{ticket.ticketId}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-neutral-950 rounded-lg p-4 border border-gray-200 dark:border-neutral-800">
                    <p className="text-xs text-gray-500 dark:text-neutral-400 mb-1 uppercase tracking-wide">Date Entered</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {new Date(ticket.dateEntered || ticket.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Notes Section */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Notes
                  </h4>
                  <div className="bg-gray-50 dark:bg-neutral-950 rounded-lg p-4 border border-gray-200 dark:border-neutral-800 min-h-[120px]">
                    {ticket.notes ? (
                      <TicketContentDisplay
                        content={ticket.notes}
                        className="text-sm text-gray-700 dark:text-neutral-300"
                      />
                    ) : (
                      <p className="text-sm text-gray-400 dark:text-neutral-500 italic">No notes available</p>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-neutral-700"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 bg-white dark:bg-neutral-900 text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                      Grading Information
                    </span>
                  </div>
                </div>

                {/* Bottom Section: Status, Quality Score */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-neutral-950 rounded-lg p-4 border border-gray-200 dark:border-neutral-800">
                    <p className="text-xs text-gray-500 dark:text-neutral-400 mb-2 uppercase tracking-wide">Status</p>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <div className="bg-gray-50 dark:bg-neutral-950 rounded-lg p-4 border border-gray-200 dark:border-neutral-800">
                    <p className="text-xs text-gray-500 dark:text-neutral-400 mb-2 uppercase tracking-wide">Quality Score</p>
                    <QualityScoreBadge score={ticket.qualityScorePercent} />
                  </div>
                </div>

                {/* Feedback Section */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Feedback
                  </h4>
                  <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-200 dark:border-blue-800 min-h-[120px]">
                    {ticket.feedback ? (
                      <TicketContentDisplay
                        content={ticket.feedback}
                        className="text-sm text-gray-700 dark:text-neutral-300"
                      />
                    ) : (
                      <p className="text-sm text-gray-400 dark:text-neutral-500 italic">No feedback available</p>
                    )}
                  </div>
                </div>

                {/* Additional Metadata */}
                {(ticket.category || ticket.createdBy || (ticket.isArchived && ticket.archivedDate) || ticket.gradedDate) && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-neutral-800">
                    {ticket.category && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-neutral-400 mb-1">Category</p>
                        <p className="text-sm text-gray-900 dark:text-white">{ticket.category}</p>
                      </div>
                    )}
                    {ticket.createdBy && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-neutral-400 mb-1">Created By</p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {ticket.createdBy.name || ticket.createdBy.email}
                        </p>
                      </div>
                    )}
                    {ticket.gradedDate && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-neutral-400 mb-1">Graded Date</p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {new Date(ticket.gradedDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                    {ticket.isArchived && ticket.archivedDate && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-neutral-400 mb-1">Archived Date</p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {new Date(ticket.archivedDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT SIDE - AI/Related Toggle Panel */}
            <div className="w-1/2 flex flex-col bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 overflow-hidden relative">
              {/* Subtle grid pattern overlay */}
              <div
                className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
                style={{
                  backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
                  backgroundSize: '40px 40px'
                }}
              />

              {/* Toggle Header */}
              <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm relative z-10">
                <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-neutral-800 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setRightPanelMode('ai')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                      rightPanelMode === 'ai'
                        ? 'bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    AI Similar
                  </button>
                  <button
                    type="button"
                    onClick={() => setRightPanelMode('related')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                      rightPanelMode === 'related'
                        ? 'bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Related
                  </button>
                </div>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-hidden relative z-10">
                {rightPanelMode === 'ai' ? (
                  <SimilarFeedbacksPanel
                    notes={ticket.notes}
                    ticketId={ticket._id}
                  />
                ) : (
                  <RelatedTicketsPanel
                    agentId={ticket.agent?._id || ticket.agent}
                    category={ticket.category}
                    currentTicketId={ticket._id}
                  />
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Delete Dialog Component
  const DeleteDialogContent = () => {
    const handleDelete = () => {
      if (deleteDialog.type === 'agent') {
        handleDeleteAgent(deleteDialog.id);
      } else {
        handleDeleteTicket(deleteDialog.id);
      }
    };

    return (
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent className="bg-white dark:bg-neutral-900 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {deleteDialog.type === 'agent' ? 'Remove from Grading List' : 'Confirm Delete'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 dark:text-neutral-400">
            {deleteDialog.type === 'agent' ? (
              <>
                Are you sure you want to remove <strong className="text-gray-900 dark:text-white">{deleteDialog.name}</strong> from your grading list?
                The agent and their tickets will remain in the system.
              </>
            ) : (
              <>
                Are you sure you want to delete <strong className="text-gray-900 dark:text-white">{deleteDialog.name}</strong>? This action cannot be undone.
              </>
            )}
          </p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteDialog({ open: false, type: null, id: null, name: '' })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {deleteDialog.type === 'agent' ? 'Remove' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-neutral-950">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">QA Manager</h1>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">Manage agents, tickets, and quality metrics</p>
          </div>
          <button
            onClick={() => setShowCommandPalette(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 rounded-lg transition-colors"
            title="Quick Search (Alt+K)"
          >
            <Search className="w-4 h-4" />
            Quick Search
          </button>
        </div>
      </div>

      {/* Tabs - Fixed */}
      <div className="flex-shrink-0 bg-gray-50 dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 p-1 rounded-lg">
              <TabsTrigger value="dashboard" className="text-sm data-[state=active]:bg-black dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-black dark:text-neutral-400">
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="agents" className="text-sm data-[state=active]:bg-black dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-black dark:text-neutral-400">
                Agents
              </TabsTrigger>
              <TabsTrigger value="tickets" className="text-sm data-[state=active]:bg-black dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-black dark:text-neutral-400">
                Tickets
              </TabsTrigger>
              <TabsTrigger value="archive" className="text-sm data-[state=active]:bg-black dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-black dark:text-neutral-400">
                Archive
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-sm data-[state=active]:bg-black dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-black dark:text-neutral-400">
                <BarChart3 className="w-4 h-4 inline mr-1.5" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="summaries" className="text-sm data-[state=active]:bg-black dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-black dark:text-neutral-400">
                <FileText className="w-4 h-4 inline mr-1.5" />
                Summaries
              </TabsTrigger>
              {['filipkozomara@mebit.io', 'nevena@mebit.io'].includes(user?.email) && (
                <TabsTrigger value="all-agents" className="text-sm data-[state=active]:bg-black dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-black dark:text-neutral-400">
                  <UsersRound className="w-4 h-4 inline mr-1.5" />
                  All Agents
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="dashboard">{renderDashboard()}</TabsContent>
            <TabsContent value="agents">{renderAgents()}</TabsContent>
            <TabsContent value="tickets">{renderTickets()}</TabsContent>
            <TabsContent value="archive">{renderArchive()}</TabsContent>
            <TabsContent value="analytics">
              <QAAnalyticsDashboard />
            </TabsContent>
            <TabsContent value="summaries">
              <QASummaries />
            </TabsContent>
            <TabsContent value="all-agents">
              <QAAllAgents />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialogs */}
      {agentDialog.open && <AgentDialogContent />}
      {addExistingAgentDialog.open && <AddExistingAgentDialog />}
      {similarAgentDialog.open && <SimilarAgentDialog />}
      {ticketDialog.open && <TicketDialogContent />}
      {gradeDialog.open && <GradeDialogContent />}
      {feedbackDialog.open && <FeedbackDialogContent />}
      {viewDialog.open && <ViewTicketDialogContent />}
      {deleteDialog.open && <DeleteDialogContent />}

      {/* Command Palette */}
      <QACommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onTicketSelect={(ticket) => {
          setTicketDialog({ open: true, mode: 'edit', data: ticket });
          setShowCommandPalette(false);
        }}
        currentFilters={filters}
      />

      {/* Shortcuts Modal */}
      <QAShortcutsModal
        open={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
    </div>
  );
};

export default QAManager;
