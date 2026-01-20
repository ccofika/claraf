import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Plus, Edit, Trash2, Filter, Download, Archive, RotateCcw, X,
  Users, CheckCircle, Target, Eye, Upload, Play, ClipboardList,
  FileText, ArrowUpDown, MessageSquare, Sparkles, Tag, TrendingUp, Zap, BarChart3, Search, UsersRound,
  Keyboard, RefreshCw, ChevronDown, ChevronRight, ChevronLeft, AlertTriangle, Loader2, Hash, Save, Send, Check, XCircle, ExternalLink, Bug
} from 'lucide-react';
import { staggerContainer, staggerItem, fadeInUp, tabContent, cardVariants, tableRow, modalOverlay, modalContent, duration, easing } from '../utils/animations';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
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
import QAImportTickets from '../components/QAImportTickets';
import StatisticsPage from '../components/statistics/StatisticsPage';
import QAShortcutsModal from '../components/QAShortcutsModal';
import QAActiveOverview from '../components/QAActiveOverview';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import ShareButton from '../components/Chat/ShareButton';
import TicketRichTextEditor, { TicketContentDisplay } from '../components/TicketRichTextEditor';
import SimilarFeedbacksPanel from '../components/SimilarFeedbacksPanel';
import RelatedTicketsPanel from '../components/RelatedTicketsPanel';
import ManageMacrosModal from '../components/ManageMacrosModal';
import ChooseMacroModal from '../components/ChooseMacroModal';
import SaveAsMacroModal from '../components/SaveAsMacroModal';
import { useMacros } from '../hooks/useMacros';
import ScorecardEditor from '../components/ScorecardEditor';
import { getScorecardConfig, getScorecardValues, getScorecardCategories, hasScorecard, requiresVariantSelection } from '../data/scorecardConfig';
import SendTicketModal from '../components/SendTicketModal';
import BugReportButton from '../components/BugReportButton';
import BugReportsAdmin from '../components/BugReportsAdmin';

// Minimal Button Component (moved outside to prevent re-renders)
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
    if (tabFromUrl && ['dashboard', 'agents', 'tickets', 'archive', 'analytics', 'summaries', 'all-agents', 'statistics', 'import-tickets', 'active-overview', 'bugs'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Data state
  const [agents, setAgents] = useState([]);
  const [allExistingAgents, setAllExistingAgents] = useState([]); // All existing agents in system
  const [agentsForFilter, setAgentsForFilter] = useState([]); // Agents who have tickets (for filters)
  const [graders, setGraders] = useState([]); // QA graders for filter
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

  // Macro dialog state
  const [manageMacrosDialog, setManageMacrosDialog] = useState({ open: false });
  const [chooseMacroDialog, setChooseMacroDialog] = useState({ open: false, onSelect: null });
  const [saveAsMacroDialog, setSaveAsMacroDialog] = useState({ open: false, feedback: '' });

  // Send Macro Ticket state (send ticket to another grader)
  const [sendMacroDialog, setSendMacroDialog] = useState({ open: false });
  const [pendingMacroTickets, setPendingMacroTickets] = useState([]);
  const [declineConfirmDialog, setDeclineConfirmDialog] = useState({ open: false, macroTicket: null });

  // Ticket form data ref (using ref instead of state to avoid parent re-renders on every keystroke)
  // This allows TicketDialogContent to update form data without causing QAManager to re-render
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

  // Agent expansion state (for showing unresolved issues)
  const [expandedAgentId, setExpandedAgentId] = useState(null);
  const [agentIssues, setAgentIssues] = useState({ loading: false, data: null });

  // Validation state for grading prerequisites
  const [validationErrors, setValidationErrors] = useState({
    invalidTickets: {}, // { ticketId: { missing: ['feedback', 'categories', ...] } }
    highlightedAgentId: null, // Agent ID that needs maestroName
    validationMode: false // Whether we're showing validation errors
  });

  // Extension logs state
  const [extensionLogs, setExtensionLogs] = useState([]);
  const [extensionActive, setExtensionActive] = useState(false);
  const extensionLogsRef = useRef(null);

  // Assignments state (for tracking MaestroQA assignments created by bot)
  const [assignmentsDialog, setAssignmentsDialog] = useState({ open: false, agentId: null, agentName: '' });
  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  // Listen for extension messages (logs, status updates, assignments)
  useEffect(() => {
    const handleExtensionMessage = async (event) => {
      if (event.data && event.data.type === 'CLARA_EXTENSION_LOG') {
        const logEntry = {
          timestamp: new Date().toLocaleTimeString(),
          message: event.data.message,
          level: event.data.level || 'info'
        };
        setExtensionLogs(prev => [...prev, logEntry]);
        // Auto-scroll to bottom
        setTimeout(() => {
          if (extensionLogsRef.current) {
            extensionLogsRef.current.scrollTop = extensionLogsRef.current.scrollHeight;
          }
        }, 50);
      } else if (event.data && event.data.type === 'CLARA_EXTENSION_STATUS') {
        setExtensionActive(event.data.active);
        if (!event.data.active) {
          // Extension finished or cancelled
          const logEntry = {
            timestamp: new Date().toLocaleTimeString(),
            message: event.data.reason || 'Extension stopped',
            level: event.data.cancelled ? 'warning' : 'success'
          };
          setExtensionLogs(prev => [...prev, logEntry]);
        }
      } else if (event.data && event.data.type === 'CLARA_ASSIGNMENT_CREATED') {
        // Assignment created by extension - save to backend
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
        // Ticket graded - update ticket in Clara and mark in assignment
        try {
          const data = event.data.data;
          console.log('Received CLARA_TICKET_GRADED:', data);

          // Update the ticket in Clara with quality score and status change
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
          } else {
            console.log('Missing ticketObjectId or qualityScore, skipping ticket update');
          }

          // Mark ticket as graded in assignment tracking
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
        // Task completed - update assignment status
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
  }, []);

  // Cancel extension grading
  const handleCancelExtension = () => {
    window.postMessage({ type: 'CLARA_CANCEL_GRADING' }, '*');
    const event = new CustomEvent('clara-cancel-grading');
    document.dispatchEvent(event);
    setExtensionLogs(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      message: 'Cancel signal sent to extension...',
      level: 'warning'
    }]);
  };

  // Clear extension logs
  const handleClearExtensionLogs = () => {
    setExtensionLogs([]);
  };

  // Selection state
  const [selectedTickets, setSelectedTickets] = useState([]);

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Helper function to open ticket dialog and initialize form data ref
  const openTicketDialog = useCallback((mode, data = null) => {
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
      // Get scorecard values (plain object from backend)
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
        scorecardValues: scorecardValuesObj
      };
    }
    setTicketDialog({ open: true, mode, data });
  }, []);

  // State for unsaved changes modal
  const [unsavedChangesModal, setUnsavedChangesModal] = useState({ open: false, onConfirm: null });
  // Ref to track if edit form has unsaved changes (set by TicketDialogContent)
  const hasUnsavedChangesRef = useRef(false);
  // Ref to store original form data for comparison
  const originalFormDataRef = useRef(null);

  // Navigation helper: get current ticket index in the visible list
  const getCurrentTicketIndex = useCallback((ticketId) => {
    if (!ticketId || !Array.isArray(tickets)) return -1;
    return tickets.findIndex(t => t._id === ticketId);
  }, [tickets]);

  // Navigation helper: navigate to previous/next ticket
  const navigateToTicket = useCallback((direction, currentTicketId, mode) => {
    const currentIndex = getCurrentTicketIndex(currentTicketId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= tickets.length) return;

    const newTicket = tickets[newIndex];

    if (mode === 'view') {
      setViewDialog({ open: true, ticket: newTicket });
    } else if (mode === 'edit') {
      openTicketDialog('edit', newTicket);
    }
  }, [getCurrentTicketIndex, tickets, openTicketDialog]);

  // Navigation with unsaved changes check (for edit mode)
  const navigateWithUnsavedCheck = useCallback((direction, currentTicketId) => {
    if (hasUnsavedChangesRef.current) {
      setUnsavedChangesModal({
        open: true,
        onConfirm: () => {
          setUnsavedChangesModal({ open: false, onConfirm: null });
          navigateToTicket(direction, currentTicketId, 'edit');
        }
      });
    } else {
      navigateToTicket(direction, currentTicketId, 'edit');
    }
  }, [navigateToTicket]);

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

  // Track previous tab for validation clearing logic
  const prevTabRef = useRef(activeTab);

  // Clear validation errors only when switching AWAY from the tab showing errors
  useEffect(() => {
    const prevTab = prevTabRef.current;
    prevTabRef.current = activeTab;

    // Only clear if we were on tickets tab (where errors show) and now switching away
    // This allows the validation to set errors AND switch to tickets without clearing
    if (validationErrors.validationMode && prevTab === 'tickets' && activeTab !== 'tickets') {
      clearValidationErrors();
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
    fetchAllExistingAgents(); // Fetch all existing agents for Send Ticket modal
    fetchPendingMacroTickets(); // Fetch pending macro tickets from other graders
    fetchGraders(); // Fetch QA graders for filter
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Comprehensive Keyboard Shortcuts (using Alt to avoid Chrome conflicts)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in inputs (except for Ctrl+Enter to save)
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) ||
                       document.activeElement?.isContentEditable;

      // Don't trigger ticket shortcuts when any modal is open
      const isModalOpen = ticketDialog.open || gradeDialog.open || feedbackDialog.open || viewDialog.open;

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
            openTicketDialog('create');
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
            if (!isModalOpen) {
              e.preventDefault();
              if (activeTab === 'dashboard') fetchDashboardStats();
              else if (activeTab === 'agents') fetchAgents();
              else fetchTickets();
              toast.success('Refreshing data...');
            }
            return;
        }

        // Ticket list navigation (J/K) - only in tickets/archive tabs, and not when modal is open
        if ((activeTab === 'tickets' || activeTab === 'archive') && tickets.length > 0 && !isModalOpen) {
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
  }, [activeTab, tickets, focusedTicketIndex, selectedTickets, filters.searchMode, ticketDialog.open, gradeDialog.open, feedbackDialog.open, viewDialog.open]);

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

  // Fetch graders for filter
  const fetchGraders = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/qa/analytics/graders`, getAuthHeaders());
      setGraders(response.data);
    } catch (err) {
      console.error('Error fetching graders:', err);
      // Don't show error toast - graders filter is optional
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

  // Fetch pending macro tickets (tickets sent by other graders)
  const fetchPendingMacroTickets = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/qa/macro-tickets/pending`, getAuthHeaders());
      setPendingMacroTickets(response.data);
    } catch (err) {
      console.error('Error fetching pending macro tickets:', err);
    }
  };

  // Send ticket to another grader
  const handleSendMacroTicket = async (data) => {
    try {
      const response = await axios.post(`${API_URL}/api/qa/macro-tickets`, data, getAuthHeaders());
      toast.success(response.data.message);
      setSendMacroDialog({ open: false });
      fetchPendingMacroTickets(); // Refresh in case sent to self
      return { success: true };
    } catch (err) {
      console.error('Error sending ticket:', err);
      const message = err.response?.data?.message || 'Failed to send ticket';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Accept incoming ticket
  const handleAcceptMacroTicket = async (macroTicketId) => {
    try {
      await axios.post(
        `${API_URL}/api/qa/macro-tickets/${macroTicketId}/accept`,
        {},
        getAuthHeaders()
      );
      toast.success('Ticket accepted and added to your list');
      fetchPendingMacroTickets();
      fetchTickets(); // Refresh tickets to show the new one
    } catch (err) {
      console.error('Error accepting ticket:', err);
      toast.error(err.response?.data?.message || 'Failed to accept ticket');
    }
  };

  // Decline incoming ticket
  const handleDeclineMacroTicket = async (macroTicketId) => {
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
      if (filters.categories && filters.categories.length > 0) {
        params.append('categories', filters.categories.join(','));
      }
      if (filters.grader) params.append('createdBy', filters.grader);
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

      // Clear validation errors if maestroName was added for the highlighted agent
      if (validationErrors.highlightedAgentId === id && formData.maestroName) {
        clearValidationErrors();
      }
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
      // Build clean request body to ensure all fields are sent
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
      console.log('Creating ticket with requestBody:', requestBody);
      console.log('Scorecard variant:', requestBody.scorecardVariant);
      console.log('Scorecard values:', requestBody.scorecardValues);
      const response = await axios.post(`${API_URL}/api/qa/tickets`, requestBody, getAuthHeaders());
      console.log('Created ticket response:', response.data);
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
      // Build clean request body to ensure all fields are sent
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
      console.log('Updating ticket with requestBody:', requestBody);
      console.log('Categories being sent:', requestBody.categories);
      console.log('Scorecard variant being sent:', requestBody.scorecardVariant);
      console.log('Scorecard values being sent:', requestBody.scorecardValues);
      const response = await axios.put(`${API_URL}/api/qa/tickets/${id}`, requestBody, getAuthHeaders());
      console.log('Response from server:', response.data);
      console.log('Categories in response:', response.data.categories);
      console.log('Scorecard in response:', response.data.scorecardVariant, response.data.scorecardValues);
      const currentTickets = Array.isArray(tickets) ? tickets : [];
      setTickets(currentTickets.map(t => t._id === id ? response.data : t));
      setTicketDialog({ open: false, mode: 'create', data: null });
      toast.success('Ticket updated successfully');

      // Clear validation error for this ticket if it was fixed
      if (validationErrors.invalidTickets[id]) {
        setValidationErrors(prev => {
          const newInvalidTickets = { ...prev.invalidTickets };
          delete newInvalidTickets[id];
          // If no more invalid tickets, clear validation mode
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

  const [archivingAll, setArchivingAll] = useState(false);

  const handleArchiveAll = async () => {
    if (tickets.length === 0) {
      toast.error('No tickets to archive');
      return;
    }

    // Confirm action
    if (!window.confirm(`Are you sure you want to archive all ${tickets.length} tickets? This will move them to the Archive tab.`)) {
      return;
    }

    try {
      setArchivingAll(true);
      const allTicketIds = tickets.map(t => t._id);
      await axios.post(`${API_URL}/api/qa/tickets/bulk-archive`, { ticketIds: allTicketIds }, getAuthHeaders());
      setTickets([]);
      setSelectedTickets([]);
      toast.success(`All ${allTicketIds.length} tickets archived successfully`);
    } catch (err) {
      console.error('Error archiving all tickets:', err);
      toast.error('Failed to archive tickets');
    } finally {
      setArchivingAll(false);
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

  // Start grading with Chrome extension
  // Validate ticket for grading - returns array of missing fields
  const validateTicketForGrading = (ticket, agentPosition) => {
    const missing = [];

    // Check ticket ID
    if (!ticket.ticketId) {
      missing.push('Ticket ID');
    }

    // Check scorecard variant for Senior position FIRST (needed to get correct fields)
    const isSenior = agentPosition?.toLowerCase().includes('senior');
    if (isSenior && !ticket.scorecardVariant) {
      missing.push('Scorecard Type');
    }

    // Get expected scorecard fields based on position and variant
    const expectedFields = getScorecardValues(agentPosition, ticket.scorecardVariant);

    if (expectedFields.length === 0) {
      // Position doesn't have a scorecard config
      missing.push('Scorecard Configuration');
    } else {
      // Check that ALL expected fields exist and have values
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

    // Check categories - must have at least one
    if (!ticket.categories || ticket.categories.length === 0) {
      missing.push('Categories');
    }

    // Check feedback
    if (!ticket.feedback || ticket.feedback.trim() === '') {
      missing.push('Feedback');
    }

    return missing;
  };

  // Validate all tickets for an agent before grading
  const validateGradingPrerequisites = async (agentId) => {
    const agent = agents.find(a => a._id === agentId);
    if (!agent) {
      return { valid: false, error: 'Agent not found' };
    }

    // Check maestroName first
    if (!agent.maestroName) {
      setValidationErrors({
        invalidTickets: {},
        highlightedAgentId: agentId,
        validationMode: true
      });
      setActiveTab('agents');
      toast.error('MaestroQA name missing. Please add it to continue.');
      return { valid: false, error: 'maestroName' };
    }

    // Get selected tickets for this agent
    const ticketsResponse = await axios.get(
      `${API_URL}/api/qa/tickets?agent=${agentId}&status=Selected&isArchived=false&limit=1000`,
      getAuthHeaders()
    );
    const selectedTickets = ticketsResponse.data.tickets || [];

    if (selectedTickets.length === 0) {
      return { valid: false, error: 'No selected tickets found for this agent' };
    }

    // Validate each ticket
    const invalidTickets = {};
    for (const ticket of selectedTickets) {
      const missing = validateTicketForGrading(ticket, agent.position);
      if (missing.length > 0) {
        invalidTickets[ticket._id] = { missing, ticketId: ticket.ticketId };
      }
    }

    // If any tickets are invalid, show them
    if (Object.keys(invalidTickets).length > 0) {
      setValidationErrors({
        invalidTickets,
        highlightedAgentId: null,
        validationMode: true
      });
      // Navigate to tickets tab with agent filter
      setTicketsFilters(prev => ({
        ...prev,
        agent: agentId,
        status: 'Selected'
      }));
      setActiveTab('tickets');
      toast.error(`${Object.keys(invalidTickets).length} ticket(s) have missing information. Please complete them to continue.`);
      return { valid: false, error: 'invalidTickets', invalidTickets };
    }

    return { valid: true, tickets: selectedTickets };
  };

  // Clear validation errors
  const clearValidationErrors = () => {
    setValidationErrors({
      invalidTickets: {},
      highlightedAgentId: null,
      validationMode: false
    });
  };

  const handleStartGrading = async (agentId) => {
    try {
      // Clear any previous validation errors
      clearValidationErrors();

      const agent = agents.find(a => a._id === agentId);
      if (!agent) {
        toast.error('Agent not found');
        return;
      }

      // Validate prerequisites
      const validation = await validateGradingPrerequisites(agentId);
      if (!validation.valid) {
        return; // Validation function handles the UI updates
      }

      const selectedTickets = validation.tickets;

      // Check for existing active assignment for this agent
      let hasExistingAssignment = false;
      let existingAssignmentName = null;
      let gradedTicketIds = [];

      try {
        const assignmentRes = await axios.get(
          `${API_URL}/api/qa/assignments/${agentId}/active`,
          getAuthHeaders()
        );
        if (assignmentRes.data.assignment) {
          hasExistingAssignment = true;
          existingAssignmentName = assignmentRes.data.assignment.assignmentName;
          gradedTicketIds = assignmentRes.data.assignment.gradedTicketIds || [];
          console.log('Found existing assignment:', existingAssignmentName);
          console.log('Already graded tickets:', gradedTicketIds);
        }
      } catch (err) {
        // No existing assignment, will create new one
        console.log('No existing assignment found, will create new one');
      }

      // Get the CSV content for the extension
      const csvResponse = await axios.post(
        `${API_URL}/api/qa/export/maestro/${agentId}`,
        {},
        { ...getAuthHeaders(), responseType: 'text' }
      );

      // Get user email from auth context
      const userEmail = user?.email || '';

      // Prepare task data for extension
      const taskData = {
        agentId: agent._id,
        agentName: agent.name,
        maestroName: agent.maestroName,
        position: agent.position,
        rubricName: agent.position, // e.g., "Senior Scorecard"
        ticketCount: selectedTickets.length,
        csvContent: csvResponse.data,
        fileName: `${agent.name.replace(/\s+/g, '_')}_tickets.csv`,
        qaEmail: userEmail,
        // Existing assignment info
        hasExistingAssignment: hasExistingAssignment,
        existingAssignmentName: existingAssignmentName,
        gradedTicketIds: gradedTicketIds,
        tickets: selectedTickets.map(t => ({
          _id: t._id,
          ticketId: t.ticketId,
          scorecardValues: t.scorecardValues,
          scorecardVariant: t.scorecardVariant,
          categories: t.categories,
          feedback: t.feedback,
          notes: t.notes
        }))
      };

      // Send message to extension via window.postMessage
      // The extension content script will listen for this
      window.postMessage({
        type: 'CLARA_START_GRADING',
        data: taskData
      }, '*');

      const mode = hasExistingAssignment ? 'adding to existing' : 'creating new';
      toast.success(`Starting grading for ${agent.name} (${selectedTickets.length} tickets, ${mode} assignment)`);

      // Also try to communicate with extension directly if it's installed
      // This uses a custom event that the extension can listen to
      const event = new CustomEvent('clara-start-grading', { detail: taskData });
      document.dispatchEvent(event);

    } catch (err) {
      console.error('Error starting grading:', err);
      toast.error(err.response?.data?.message || 'Failed to start grading');
    }
  };

  // Navigate to tickets tab with agent filter
  const handleViewAgentTickets = (agentId) => {
    // Set agent filter in tickets tab (replace any existing agent filter)
    setTicketsFilters(prev => ({
      ...prev,
      agent: agentId
    }));
    // Switch to tickets tab
    setActiveTab('tickets');
  };

  // View assignments for an agent
  const handleViewAssignments = async (agentId) => {
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
  };

  // Reset/delete an assignment
  const handleResetAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to reset this assignment? This will delete all tracking data for this assignment.')) {
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/api/qa/assignments/${assignmentId}`,
        getAuthHeaders()
      );
      // Remove from local state
      setAssignments(prev => prev.filter(a => a._id !== assignmentId));
      toast.success('Assignment reset successfully');
    } catch (err) {
      console.error('Error resetting assignment:', err);
      toast.error('Failed to reset assignment');
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
        </div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={staggerItem}>
            <StatCard
              icon={FileText}
              label="Total Tickets"
              value={totalTickets}
              trend={`${selectedTickets} pending review`}
              accent="blue"
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <StatCard
              icon={CheckCircle}
              label="Graded Rate"
              value={`${gradedRate}%`}
              trend={`${gradedTickets} of ${totalTickets} graded`}
              accent="green"
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <StatCard
              icon={Target}
              label="Avg Quality"
              value={dashboardStats.avgQualityScore ? `${dashboardStats.avgQualityScore.toFixed(1)}%` : 'N/A'}
              trend="Across all tickets"
              accent="yellow"
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <StatCard
              icon={Users}
              label="Total Agents"
              value={agents.length || 0}
              trend="In your roster"
              accent="purple"
            />
          </motion.div>
        </motion.div>

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
                    <motion.tr
                      key={idx}
                      className="hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03, duration: duration.fast, ease: easing.smooth }}
                    >
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
                        <div className="flex items-center gap-3 justify-end">
                          <button
                            onClick={() => handleViewAgentTickets(stat.agentId)}
                            className="text-xs text-gray-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                          <button
                            onClick={() => handleExportMaestro(stat.agentId)}
                            className="text-xs text-gray-600 dark:text-neutral-400 hover:text-black dark:hover:text-white flex items-center gap-1.5 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Export
                          </button>
                          <button
                            onClick={() => handleStartGrading(stat.agentId)}
                            className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 flex items-center gap-1.5 transition-colors"
                          >
                            <Play className="w-3.5 h-3.5" />
                            Grade
                          </button>
                          <button
                            onClick={() => handleViewAssignments(stat.agentId)}
                            className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1.5 transition-colors"
                          >
                            <ClipboardList className="w-3.5 h-3.5" />
                            Assignments
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Extension Download Section */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Clara QA Extension</h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">Automatski ocenjuj tikete na MaestroQA</p>
          </div>
          <div className="p-6 space-y-4">
            {/* Download Link */}
            <div className="flex items-center gap-3">
              <a
                href="https://drive.google.com/drive/folders/17lfzCiKQJnr9vgUGZtTdCU4osRxw0G9b?usp=drive_link"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Extension
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Setup Instructions */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Setup uputstvo:</h4>
              <ol className="space-y-2 text-sm text-gray-600 dark:text-neutral-400">
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 dark:text-neutral-300">1</span>
                  <span>Downloaduj folder sa Google Drive linka iznad.</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 dark:text-neutral-300">2</span>
                  <span>Extraktuj ZIP tako da ostane samo <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-neutral-800 rounded text-xs font-mono">"extension"</code> folder.</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 dark:text-neutral-300">3</span>
                  <span>Idi na <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-neutral-800 rounded text-xs font-mono">chrome://extensions/</code> u Chrome-u.</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 dark:text-neutral-300">4</span>
                  <span>U gornjem desnom uglu uključi <strong className="text-gray-900 dark:text-white">Developer mode</strong>.</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 dark:text-neutral-300">5</span>
                  <span>Klikni na <strong className="text-gray-900 dark:text-white">"Load unpacked"</strong> sa leve strane.</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 dark:text-neutral-300">6</span>
                  <span>U file exploreru klikni jednom na <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-neutral-800 rounded text-xs font-mono">extension</code> folder i klikni <strong className="text-gray-900 dark:text-white">"Select Folder"</strong>.</span>
                </li>
              </ol>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-3">
                Ekstenzija je tada dodata u tvoj browser i možeš da koristiš Grade funkciju koja će sama oceniti tvoje tikete na Maestru. (samo refreshuj stranicu nakon dodavanja ekstenzije) :)
              </p>
            </div>

            {/* Important Note */}
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Važno!</p>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    <strong>Assignment ne smeš da započneš sam na Maestru</strong> inače ova funkcija neće raditi. Moraš da isključivo ocenjuješ preko Clare sve tikete kako bi radilo bez greške.
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-2">
                    Ne brini - neće ništa pokvariti, štaviše uživo ćeš pratiti šta radi pa možeš posle i da prekontrolišeš. :D
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
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
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                {sortedAgents.map((agent) => {
                  const isExpanded = expandedAgentId === agent._id;
                  const isHighlightedForValidation = validationErrors.validationMode && validationErrors.highlightedAgentId === agent._id;
                  return (
                    <React.Fragment key={agent._id}>
                      <tr
                        className={`group transition-colors ${
                          isHighlightedForValidation
                            ? 'bg-red-50 dark:bg-red-900/20 ring-2 ring-red-400 dark:ring-red-500 ring-inset'
                            : 'hover:bg-gray-50 dark:hover:bg-neutral-800/50'
                        }`}
                        title={isHighlightedForValidation ? 'MaestroQA Name is required' : ''}
                      >
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
                          <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleStartGrading(agent._id)}
                              className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
                              title="Start Grading (Extension)"
                            >
                              <Play className="w-4 h-4 text-gray-500 dark:text-neutral-400 hover:text-green-600 dark:hover:text-green-400" />
                            </button>
                            <button
                              onClick={() => handleViewAgentTickets(agent._id)}
                              className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                              title="View Tickets"
                            >
                              <Eye className="w-4 h-4 text-gray-500 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400" />
                            </button>
                            <button
                              onClick={() => handleExportMaestro(agent._id)}
                              className="p-1.5 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition-colors"
                              title="Export"
                            >
                              <Download className="w-4 h-4 text-gray-500 dark:text-neutral-400" />
                            </button>
                            <button
                              onClick={() => setAgentDialog({ open: true, mode: 'edit', data: agent })}
                              className={`p-1.5 rounded transition-colors ${
                                isHighlightedForValidation
                                  ? 'bg-red-100 dark:bg-red-900/50 ring-2 ring-red-400 dark:ring-red-500 animate-pulse'
                                  : 'hover:bg-gray-200 dark:hover:bg-neutral-700'
                              }`}
                              title={isHighlightedForValidation ? 'Click to add MaestroQA Name' : 'Edit'}
                            >
                              <Edit className={`w-4 h-4 ${isHighlightedForValidation ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-neutral-400'}`} />
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
                                              {issue.categories && issue.categories.length > 0 && (
                                                <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-neutral-400">
                                                  {issue.categories.length === 1 ? issue.categories[0] : `${issue.categories.length} categories`}
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

        {/* Extension Logs Panel */}
        {extensionLogs.length > 0 && (
          <div className="mt-6 bg-gray-900 dark:bg-black border border-gray-700 dark:border-neutral-800 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-neutral-900 border-b border-gray-700 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${extensionActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                <span className="text-sm font-medium text-white">Extension Logs</span>
                <span className="text-xs text-gray-400">({extensionLogs.length} entries)</span>
              </div>
              <div className="flex items-center gap-2">
                {extensionActive && (
                  <button
                    onClick={handleCancelExtension}
                    className="px-3 py-1 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={handleClearExtensionLogs}
                  className="px-3 py-1 text-xs font-medium bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
            <div
              ref={extensionLogsRef}
              className="p-3 max-h-64 overflow-y-auto font-mono text-xs space-y-1"
            >
              {extensionLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2 ${
                    log.level === 'error' ? 'text-red-400' :
                    log.level === 'warning' ? 'text-yellow-400' :
                    log.level === 'success' ? 'text-green-400' :
                    'text-gray-300'
                  }`}
                >
                  <span className="text-gray-500 flex-shrink-0">[{log.timestamp}]</span>
                  <span className="break-all">{log.message}</span>
                </div>
              ))}
            </div>
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
            graders={graders}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tickets</h2>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">Review and grade support tickets</p>
          </div>
          <div className="flex items-center gap-2">
            {tickets.length > 0 && (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleArchiveAll}
                disabled={archivingAll}
                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
              >
                <Archive className="w-4 h-4 mr-1.5" />
                {archivingAll ? 'Archiving...' : 'Archive All'}
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => setManageMacrosDialog({ open: true })}>
              <Hash className="w-4 h-4 mr-1.5" />
              Manage Macros
            </Button>
            <Button
              size="sm"
              onClick={() => setSendMacroDialog({ open: true })}
              className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
            >
              <Send className="w-4 h-4 mr-1.5" />
              Send Ticket
            </Button>
            <Button size="sm" onClick={() => openTicketDialog('create')}>
              <Plus className="w-4 h-4 mr-1.5" />
              New Ticket
            </Button>
          </div>
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

        {/* Pending Tickets - Blue glowing cards above regular tickets */}
        {pendingMacroTickets.length > 0 && (
          <div className="space-y-2 mb-4">
            <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <Send className="w-4 h-4" />
              Incoming Tickets ({pendingMacroTickets.length})
            </h3>
            {pendingMacroTickets.map((macroTicket) => (
              <motion.div
                key={macroTicket._id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-400 dark:border-blue-500 rounded-lg p-4 shadow-[0_0_15px_rgba(59,130,246,0.3)] dark:shadow-[0_0_20px_rgba(59,130,246,0.4)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-0.5">Ticket ID</p>
                      <p className="text-sm font-mono font-medium text-gray-900 dark:text-white">{macroTicket.ticketId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-0.5">Agent</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{macroTicket.agent?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-0.5">Date</p>
                      <p className="text-sm text-gray-700 dark:text-neutral-300">
                        {new Date(macroTicket.dateEntered).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-0.5">From</p>
                      <p className="text-sm text-gray-700 dark:text-neutral-300">
                        {macroTicket.sentBy?.name || macroTicket.sentBy?.email}
                      </p>
                    </div>
                    {macroTicket.notes && (
                      <div className="max-w-xs">
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-0.5">Notes</p>
                        <p className="text-sm text-gray-700 dark:text-neutral-300 truncate">
                          <span dangerouslySetInnerHTML={{ __html: macroTicket.notes.substring(0, 100) + (macroTicket.notes.length > 100 ? '...' : '') }} />
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => window.open(`https://app.intercom.com/a/inbox/cx1ywgf2/inbox/conversation/${macroTicket.ticketId}`, '_blank')}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30"
                      title="Open in Intercom"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        // View ticket details
                        setViewDialog({
                          open: true,
                          ticket: {
                            _id: macroTicket._id,
                            ticketId: macroTicket.ticketId,
                            agent: macroTicket.agent,
                            dateEntered: macroTicket.dateEntered,
                            notes: macroTicket.notes,
                            status: 'Pending',
                            isMacroTicket: true
                          }
                        });
                      }}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAcceptMacroTicket(macroTicket._id)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setDeclineConfirmDialog({ open: true, macroTicket })}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {loading ? (
          <LoadingSkeleton />
        ) : tickets.length === 0 && pendingMacroTickets.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg">
            <EmptyState
              icon={FileText}
              title="No tickets found"
              description="No tickets match your current filters."
              action={
                <Button onClick={() => openTicketDialog('create')}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create Ticket
                </Button>
              }
            />
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg">
            <EmptyState
              icon={FileText}
              title="No regular tickets found"
              description="You have pending macro tickets above, but no regular tickets match your filters."
            />
          </div>
        ) : (
          <div className="py-4 -my-4 px-2 -mx-2 overflow-visible">
            <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-visible">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800 rounded-t-lg">
                <tr>
                  <th className="px-4 py-2.5 w-8 rounded-tl-lg">
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
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800" ref={ticketListRef}>
                {sortedTickets.map((ticket, index) => {
                  const ticketValidationError = validationErrors.invalidTickets[ticket._id];
                  const hasValidationError = validationErrors.validationMode && ticketValidationError;

                  return (
                  <tr
                    key={ticket._id}
                    data-ticket-index={index}
                    className={`group transition-colors cursor-pointer relative ${
                      hasValidationError
                        ? 'bg-red-50 dark:bg-red-900/20'
                        : focusedTicketIndex === index
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-neutral-800/50'
                    }`}
                    style={hasValidationError ? {
                      boxShadow: '0 0 20px rgba(239, 68, 68, 0.5), inset 0 0 0 2px rgba(239, 68, 68, 0.6)'
                    } : undefined}
                    onClick={(e) => {
                      // Don't open dialog if clicking on checkbox or action buttons
                      if (e.target.closest('input[type="checkbox"]') || e.target.closest('button')) {
                        return;
                      }
                      setFocusedTicketIndex(index);
                      setViewDialog({ open: true, ticket });
                    }}
                  >
                    {/* Validation error tooltip */}
                    {hasValidationError && (
                      <div className="absolute left-1/2 -translate-x-1/2 -top-2 -translate-y-full z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                          <span className="text-red-400 dark:text-red-600 font-semibold">Missing:</span> {ticketValidationError.missing.join(', ')}
                          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900 dark:border-t-gray-100" />
                        </div>
                      </div>
                    )}
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
                        <button
                          onClick={() => window.open(`https://app.intercom.com/a/inbox/cx1ywgf2/inbox/conversation/${ticket.ticketId}`, '_blank')}
                          className="p-1.5 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition-colors"
                          title="Open in Intercom"
                        >
                          <ExternalLink className="w-4 h-4 text-gray-500 dark:text-neutral-400" />
                        </button>
                        <button
                          onClick={() => openTicketDialog('edit', ticket)}
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
                  );
                })}
              </tbody>
              </table>
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                totalItems={pagination.total}
                onPageChange={handlePageChange}
              />
            </div>
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
            graders={graders}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Archive</h2>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
            {isAISearch
              ? `Found ${tickets.length} semantically similar tickets`
              : 'Archived tickets from all QA agents'}
          </p>
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
                          onClick={() => window.open(`https://app.intercom.com/a/inbox/cx1ywgf2/inbox/conversation/${ticket.ticketId}`, '_blank')}
                          className="p-1.5 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition-colors"
                          title="Open in Intercom"
                        >
                          <ExternalLink className="w-4 h-4 text-gray-500 dark:text-neutral-400" />
                        </button>
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
      maestroName: ''
    });

    useEffect(() => {
      if (agentDialog.data) {
        setFormData({
          name: agentDialog.data.name || '',
          position: agentDialog.data.position || '',
          team: agentDialog.data.team || '',
          maestroName: agentDialog.data.maestroName || ''
        });
      } else {
        setFormData({
          name: '',
          position: '',
          team: '',
          maestroName: ''
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

            <div>
              <Label className={`text-xs mb-1.5 ${
                validationErrors.validationMode && validationErrors.highlightedAgentId === agentDialog.data?._id && !formData.maestroName
                  ? 'text-red-600 dark:text-red-400 font-medium'
                  : 'text-gray-600 dark:text-neutral-400'
              }`}>
                MaestroQA Name {validationErrors.validationMode && validationErrors.highlightedAgentId === agentDialog.data?._id && !formData.maestroName && <span className="text-red-500">*</span>}
              </Label>
              <Input
                value={formData.maestroName}
                onChange={(e) => setFormData({ ...formData, maestroName: e.target.value })}
                placeholder="Agent name as it appears in MaestroQA"
                className={`text-sm ${
                  validationErrors.validationMode && validationErrors.highlightedAgentId === agentDialog.data?._id && !formData.maestroName
                    ? 'ring-2 ring-red-400 dark:ring-red-500 border-red-400 dark:border-red-500 focus:ring-red-500'
                    : ''
                }`}
              />
              <p className={`text-[10px] mt-1 ${
                validationErrors.validationMode && validationErrors.highlightedAgentId === agentDialog.data?._id && !formData.maestroName
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-gray-400 dark:text-neutral-500'
              }`}>
                {validationErrors.validationMode && validationErrors.highlightedAgentId === agentDialog.data?._id && !formData.maestroName
                  ? 'Required for grading. Enter the agent name as it appears in MaestroQA.'
                  : 'Used by the grading extension to identify the agent'}
              </p>
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
  // Uses local state for form data to avoid parent re-renders on every keystroke
  // Parent ref (ticketFormDataRef) is updated on every change so parent can access latest data
  const TicketDialogContent = () => {
    const formRef = useRef(null);
    const [rightPanelMode, setRightPanelMode] = useState('ai'); // 'ai' | 'related'
    // Local state initialized from parent ref - changes don't re-render parent
    const [formData, setFormDataLocal] = useState(() => ({ ...ticketFormDataRef.current }));
    // Wrapper that updates both local state AND parent ref
    const setFormData = useCallback((valueOrUpdater) => {
      setFormDataLocal(prev => {
        const newValue = typeof valueOrUpdater === 'function' ? valueOrUpdater(prev) : valueOrUpdater;
        ticketFormDataRef.current = newValue; // Keep ref in sync for parent access
        return newValue;
      });
    }, []);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');
    const [categoryHighlightIndex, setCategoryHighlightIndex] = useState(0);
    const categoryDropdownRef = useRef(null);
    const categoryInputRef = useRef(null);
    const categoryListRef = useRef(null);

    // Get selected agent's position for scorecard config
    const selectedAgent = agents.find(a => a._id === formData.agent);
    const agentPosition = selectedAgent?.position || null;
    const agentHasScorecard = agentPosition && hasScorecard(agentPosition);

    // Default categories (fallback when no scorecard config)
    const defaultCategories = [
      'Account closure', 'ACP usage', 'Account recovery', 'Affiliate program',
      'Available bonuses', 'Balance issues', 'Bet | Bet archive', 'Birthday bonus',
      'Break in play', 'Bonus crediting', 'Bonus drops', 'Casino',
      'Coin mixing | AML', 'Compliance (KYC, Terms of service, Privacy)',
      'Crypto - General', 'Crypto deposits', 'Crypto withdrawals', 'Data deletion',
      'Deposit bonus', 'Exclusion | General', 'Exclusion | Self exclusion',
      'Exclusion | Casino exclusion', 'Fiat General', 'Fiat - CAD', 'Fiat - BRL',
      'Fiat - JPY', 'Fiat - INR', 'Fiat - PEN/ARS/CLP', 'Forum', 'Funds recovery',
      'Games issues', 'Games | Providers | Rules', 'Games | Live games',
      'Hacked accounts', 'In-game chat | Third party chat', 'Monthly bonus',
      'No luck tickets | RTP', 'Phishing | Scam attempt', 'Phone removal',
      'Pre/Post monthly bonus', 'Promotions', 'Provably fair', 'Race', 'Rakeback',
      'Reload', 'Responsible gambling', 'Roles', 'Rollover',
      'Security (2FA, Password, Email codes)', 'Sportsbook', 'Stake basics',
      'Stake chat', 'Stake original', 'Tech issues | Jira cases | Bugs',
      'Tip recovery', 'VIP host', 'VIP program', 'Welcome bonus', 'Weekly bonus', 'Other'
    ];

    // Get categories based on agent position (from scorecard config or default)
    const allCategories = agentHasScorecard
      ? getScorecardCategories(agentPosition)
      : defaultCategories;

    // Filter categories based on search (exclude already selected)
    const filteredCategories = allCategories.filter(cat =>
      cat.toLowerCase().includes(categorySearch.toLowerCase()) &&
      !formData.categories.includes(cat)
    );
    const [showChooseMacroModal, setShowChooseMacroModal] = useState(false);
    const { recordUsage } = useMacros();

    // Close category dropdown on click outside
    // Reset highlight when search changes
    useEffect(() => {
      setCategoryHighlightIndex(0);
    }, [categorySearch]);

    // Scroll highlighted category into view
    useEffect(() => {
      if (showCategoryDropdown && categoryListRef.current) {
        const highlighted = categoryListRef.current.querySelector('[data-highlighted="true"]');
        if (highlighted) {
          highlighted.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    }, [categoryHighlightIndex, showCategoryDropdown]);

    // Keyboard navigation for categories
    const handleCategoryKeyDown = (e) => {
      if (!showCategoryDropdown) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setShowCategoryDropdown(true);
        }
        return;
      }

      const totalItems = filteredCategories.length;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setCategoryHighlightIndex(prev => (prev + 1) % Math.max(totalItems, 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setCategoryHighlightIndex(prev => (prev - 1 + Math.max(totalItems, 1)) % Math.max(totalItems, 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCategories[categoryHighlightIndex]) {
            const selected = filteredCategories[categoryHighlightIndex];
            setFormData({ ...formData, categories: [...formData.categories, selected] });
            setCategorySearch('');
            setCategoryHighlightIndex(0);
            // Keep dropdown open and focus on input
            setTimeout(() => categoryInputRef.current?.focus(), 0);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowCategoryDropdown(false);
          setCategorySearch('');
          break;
        case 'Backspace':
          // If search is empty and backspace is pressed, remove last category
          if (categorySearch === '' && formData.categories.length > 0) {
            setFormData({ ...formData, categories: formData.categories.slice(0, -1) });
          }
          break;
        default:
          break;
      }
    };

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
          setShowCategoryDropdown(false);
          setCategorySearch('');
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Store original form data when entering edit mode (for unsaved changes detection)
    useEffect(() => {
      if (ticketDialog.mode === 'edit' && ticketDialog.data) {
        originalFormDataRef.current = { ...ticketFormDataRef.current };
        hasUnsavedChangesRef.current = false;
      }
      return () => {
        // Reset when dialog closes
        hasUnsavedChangesRef.current = false;
        originalFormDataRef.current = null;
      };
    }, [ticketDialog.mode, ticketDialog.data?._id]);

    // Track unsaved changes by comparing current form data with original
    useEffect(() => {
      if (ticketDialog.mode === 'edit' && originalFormDataRef.current) {
        const original = originalFormDataRef.current;
        const hasChanges =
          formData.agent !== original.agent ||
          formData.ticketId !== original.ticketId ||
          formData.status !== original.status ||
          formData.qualityScorePercent !== original.qualityScorePercent ||
          formData.notes !== original.notes ||
          formData.feedback !== original.feedback ||
          formData.dateEntered !== original.dateEntered ||
          JSON.stringify(formData.categories) !== JSON.stringify(original.categories) ||
          formData.scorecardVariant !== original.scorecardVariant ||
          JSON.stringify(formData.scorecardValues) !== JSON.stringify(original.scorecardValues);
        hasUnsavedChangesRef.current = hasChanges;
      }
    }, [formData, ticketDialog.mode]);

    // Get navigation info for this ticket
    const currentIndex = ticketDialog.data ? getCurrentTicketIndex(ticketDialog.data._id) : -1;
    const canGoPrev = currentIndex > 0;
    const canGoNext = currentIndex >= 0 && currentIndex < tickets.length - 1;

    // Keyboard shortcuts: Ctrl+Enter to save, Alt+Arrow for navigation
    useEffect(() => {
      const handleKeyDown = (e) => {
        // Ctrl+Enter to save
        if (e.ctrlKey && e.key === 'Enter') {
          e.preventDefault();
          formRef.current?.requestSubmit();
          return;
        }
        // Alt+Left/Right for navigation (only in edit mode)
        if (e.altKey && ticketDialog.mode === 'edit' && ticketDialog.data) {
          if (e.key === 'ArrowLeft' && canGoPrev) {
            e.preventDefault();
            navigateWithUnsavedCheck('prev', ticketDialog.data._id);
          } else if (e.key === 'ArrowRight' && canGoNext) {
            e.preventDefault();
            navigateWithUnsavedCheck('next', ticketDialog.data._id);
          }
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [ticketDialog.mode, ticketDialog.data, canGoPrev, canGoNext]);

    const handleSubmit = (e) => {
      e.preventDefault();
      if (ticketDialog.mode === 'create') {
        handleCreateTicket(formData);
      } else {
        handleUpdateTicket(ticketDialog.data._id, formData);
      }
    };

    // Check if form has any data entered (for create mode)
    const hasFormData = () => {
      return (
        formData.agent ||
        formData.ticketId ||
        formData.notes?.trim() ||
        formData.feedback?.trim() ||
        formData.qualityScorePercent ||
        formData.categories?.length > 0 ||
        formData.scorecardVariant ||
        Object.keys(formData.scorecardValues || {}).length > 0
      );
    };

    // Handle closing dialog with unsaved changes check
    const handleCloseDialog = () => {
      const shouldShowModal = ticketDialog.mode === 'create'
        ? hasFormData()
        : hasUnsavedChangesRef.current;

      if (shouldShowModal) {
        setUnsavedChangesModal({
          open: true,
          onConfirm: () => {
            setUnsavedChangesModal({ open: false, onConfirm: null });
            setTicketDialog({ ...ticketDialog, open: false });
          }
        });
      } else {
        setTicketDialog({ ...ticketDialog, open: false });
      }
    };

    return (
      <>
      <Dialog open={ticketDialog.open} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent hideCloseButton className="bg-white dark:bg-neutral-900 !max-w-none !w-screen !h-screen !max-h-screen !rounded-none p-0 gap-0 flex flex-col">
          {/* Header */}
          <DialogHeader className="flex-shrink-0 px-4 py-2.5 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-sm font-semibold text-gray-900 dark:text-white">
                {ticketDialog.mode === 'create' ? 'Create Ticket' : 'Edit Ticket'}
              </DialogTitle>
              <div className="flex items-center gap-1">
                {/* Navigation arrows - only show in edit mode */}
                {ticketDialog.mode === 'edit' && (
                  <>
                    <button
                      type="button"
                      onClick={() => navigateWithUnsavedCheck('prev', ticketDialog.data?._id)}
                      disabled={!canGoPrev}
                      className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-neutral-800 text-gray-500 dark:text-neutral-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Previous ticket"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateWithUnsavedCheck('next', ticketDialog.data?._id)}
                      disabled={!canGoNext}
                      className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-neutral-800 text-gray-500 dark:text-neutral-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Next ticket"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-gray-300 dark:bg-neutral-700 mx-1" />
                  </>
                )}
                <button
                  type="button"
                  onClick={handleCloseDialog}
                  className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-neutral-800 text-gray-500 dark:text-neutral-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </DialogHeader>

          {/* Main Content - 60/40 Split */}
          <form ref={formRef} onSubmit={handleSubmit} className="flex flex-1 overflow-hidden">
            {/* LEFT SIDE - Ticket Form */}
            <div className="w-3/5 flex flex-col border-r border-gray-200 dark:border-neutral-800 overflow-hidden">
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

                {/* Scorecard Editor - only show if agent has scorecard */}
                {agentHasScorecard && (
                  <ScorecardEditor
                    agentPosition={agentPosition}
                    variant={formData.scorecardVariant}
                    onVariantChange={(variant) => {
                      // When variant changes, reset scorecard values
                      setFormData({ ...formData, scorecardVariant: variant, scorecardValues: {} });
                    }}
                    values={formData.scorecardValues}
                    onChange={(values) => setFormData({ ...formData, scorecardValues: values })}
                    disabled={false}
                  />
                )}

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
                  <div ref={categoryDropdownRef} className="relative">
                    <Label className={`text-xs mb-1.5 block ${
                      formData.categories.length === 0 && rightPanelMode === 'related'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-neutral-400'
                    }`}>
                      Categories
                      {formData.categories.length === 0 && rightPanelMode === 'related' && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                    {/* Selected categories as tags + search input */}
                    <div
                      className={`flex flex-wrap items-center gap-1 px-2 py-1.5 text-sm rounded-lg bg-white dark:bg-neutral-900 cursor-text min-h-[38px] ${
                        formData.categories.length === 0 && rightPanelMode === 'related'
                          ? 'border-2 border-red-400 dark:border-red-500 ring-2 ring-red-200 dark:ring-red-500/20'
                          : 'border border-gray-200 dark:border-neutral-800'
                      } ${showCategoryDropdown ? 'ring-2 ring-gray-900 dark:ring-gray-300' : ''}`}
                      onClick={() => categoryInputRef.current?.focus()}
                    >
                      {formData.categories.map(cat => (
                        <span
                          key={cat}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full"
                        >
                          {cat}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData({ ...formData, categories: formData.categories.filter(c => c !== cat) });
                            }}
                            className="hover:text-blue-900 dark:hover:text-blue-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      <input
                        ref={categoryInputRef}
                        type="text"
                        value={categorySearch}
                        onChange={(e) => {
                          setCategorySearch(e.target.value);
                          setShowCategoryDropdown(true);
                        }}
                        onFocus={() => setShowCategoryDropdown(true)}
                        onKeyDown={handleCategoryKeyDown}
                        placeholder={formData.categories.length === 0 ? "Search categories..." : ""}
                        className="flex-1 min-w-[100px] bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 text-sm"
                      />
                    </div>
                    {showCategoryDropdown && (
                      <div
                        ref={categoryListRef}
                        className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                      >
                        {filteredCategories.length > 0 ? (
                          filteredCategories.map((cat, index) => (
                            <button
                              key={cat}
                              type="button"
                              data-highlighted={categoryHighlightIndex === index}
                              onClick={() => {
                                setFormData({ ...formData, categories: [...formData.categories, cat] });
                                setCategorySearch('');
                                setCategoryHighlightIndex(0);
                                setTimeout(() => categoryInputRef.current?.focus(), 0);
                              }}
                              onMouseEnter={() => setCategoryHighlightIndex(index)}
                              className={`w-full px-3 py-2 text-left text-sm text-gray-900 dark:text-white transition-colors ${
                                categoryHighlightIndex === index
                                  ? 'bg-blue-100 dark:bg-blue-900/30'
                                  : 'hover:bg-gray-100 dark:hover:bg-neutral-800'
                              }`}
                            >
                              {cat}
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500 dark:text-neutral-500">
                            {categorySearch ? 'No categories found' : 'All categories selected'}
                          </div>
                        )}
                      </div>
                    )}
                    {formData.categories.length === 0 && rightPanelMode === 'related' && (
                      <p className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        This field must be filled for Related Tickets
                      </p>
                    )}
                  </div>
                </div>

                {/* Feedback Section */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-xs text-gray-600 dark:text-neutral-400 flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Feedback
                    </Label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowChooseMacroModal(true)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <Hash className="w-3 h-3" />
                        Choose Macro
                      </button>
                      {formData.feedback && formData.feedback.trim() && (
                        <button
                          type="button"
                          onClick={() => setSaveAsMacroDialog({ open: true, feedback: formData.feedback })}
                          className="text-xs text-green-600 dark:text-green-400 hover:underline flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          Save as Macro
                        </button>
                      )}
                    </div>
                  </div>
                  <TicketRichTextEditor
                    value={formData.feedback}
                    onChange={(html) => setFormData({ ...formData, feedback: html })}
                    placeholder="Feedback to agent after grading (type # to insert macro)"
                    rows={5}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white resize-none min-h-[140px]"
                    enableMacros={true}
                    onMacroSelect={(macro) => {
                      // Record usage when macro selected via # trigger
                      // Use local recordUsage to avoid triggering QAManager re-render
                      if (ticketDialog.data?._id) {
                        recordUsage(macro._id, ticketDialog.data._id, ticketDialog.data.ticketId);
                      }
                    }}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-neutral-800">
                  <Button type="button" variant="secondary" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {ticketDialog.mode === 'create' ? 'Create Ticket' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE - AI/Related Toggle Panel */}
            <div className="w-2/5 flex flex-col bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 overflow-hidden relative">
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
                    categories={formData.categories}
                    currentTicketId={ticketDialog.data?._id}
                  />
                )}
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Choose Macro Modal - rendered inside TicketDialogContent for direct access to formData */}
      <ChooseMacroModal
        open={showChooseMacroModal}
        onOpenChange={setShowChooseMacroModal}
        onSelectMacro={(macro) => {
          const currentFeedback = formData.feedback || '';
          const separator = currentFeedback.trim() ? '\n\n' : '';
          setFormData(prev => ({
            ...prev,
            feedback: currentFeedback + separator + macro.feedback
          }));
          if (ticketDialog.data?._id) {
            recordUsage(macro._id, ticketDialog.data._id, ticketDialog.data.ticketId);
          }
          setShowChooseMacroModal(false);
        }}
      />
      </>
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

    const ticket = viewDialog.ticket;

    // Navigation info for this ticket (must be before hooks for consistent hook order)
    const currentIndex = ticket ? getCurrentTicketIndex(ticket._id) : -1;
    const canGoPrev = currentIndex > 0;
    const canGoNext = currentIndex >= 0 && currentIndex < tickets.length - 1;

    // Keyboard shortcuts: Alt+Arrow for navigation in view mode
    // Must be called before early return to maintain hook order
    useEffect(() => {
      if (!ticket) return;

      const handleKeyDown = (e) => {
        if (e.altKey) {
          if (e.key === 'ArrowLeft' && canGoPrev) {
            e.preventDefault();
            navigateToTicket('prev', ticket._id, 'view');
          } else if (e.key === 'ArrowRight' && canGoNext) {
            e.preventDefault();
            navigateToTicket('next', ticket._id, 'view');
          }
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [ticket?._id, canGoPrev, canGoNext]);

    // Early return after all hooks
    if (!ticket) return null;

    // Check if user can edit this ticket
    // Non-archived tickets can always be edited
    // Archived tickets can be edited by: creator, filipkozomara@mebit.io, or neven@mebit.io
    const adminEmails = ['filipkozomara@mebit.io', 'neven@mebit.io'];
    const isCreator = ticket.createdBy === user?._id || ticket.createdBy?._id === user?._id;
    const isAdmin = adminEmails.includes(user?.email);
    const canEdit = !ticket.isArchived || isCreator || isAdmin;

    return (
      <Dialog open={viewDialog.open} onOpenChange={(open) => setViewDialog({ ...viewDialog, open })}>
        <DialogContent hideCloseButton overlayClassName="z-[60]" className="bg-white dark:bg-neutral-900 !max-w-none !w-screen !h-screen !max-h-screen !rounded-none p-0 gap-0 flex flex-col z-[60]">
          {/* Header */}
          <DialogHeader className="flex-shrink-0 px-4 py-2.5 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-sm font-semibold text-gray-900 dark:text-white">
                Ticket Details
              </DialogTitle>
              <div className="flex items-center gap-2">
                {ticket.feedback && ticket.feedback.trim() && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setSaveAsMacroDialog({ open: true, feedback: ticket.feedback })}
                  >
                    <Hash className="w-4 h-4 mr-1.5" />
                    Save as Macro
                  </Button>
                )}
                {canEdit && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setViewDialog({ open: false, ticket: null });
                      openTicketDialog('edit', ticket);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-1.5" />
                    Edit Ticket
                  </Button>
                )}
                {/* Navigation arrows */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => navigateToTicket('prev', ticket._id, 'view')}
                    disabled={!canGoPrev}
                    className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-neutral-800 text-gray-500 dark:text-neutral-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Previous ticket"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigateToTicket('next', ticket._id, 'view')}
                    disabled={!canGoNext}
                    className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-neutral-800 text-gray-500 dark:text-neutral-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Next ticket"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="w-px h-4 bg-gray-300 dark:bg-neutral-700" />
                <button
                  onClick={() => setViewDialog({ open: false, ticket: null })}
                  className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-neutral-800 text-gray-500 dark:text-neutral-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </DialogHeader>

          {/* Main Content - 60/40 Split */}
          <div className="flex flex-1 overflow-hidden">
            {/* LEFT SIDE - Ticket Information */}
            <div className="w-3/5 flex flex-col border-r border-gray-200 dark:border-neutral-800 overflow-hidden">
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

                {/* Scorecard Values (readonly) */}
                {ticket.agent?.position && hasScorecard(ticket.agent.position) && ticket.scorecardValues && Object.keys(ticket.scorecardValues).length > 0 && (
                  <ScorecardEditor
                    agentPosition={ticket.agent.position}
                    variant={ticket.scorecardVariant}
                    onVariantChange={() => {}}
                    values={ticket.scorecardValues || {}}
                    onChange={() => {}}
                    disabled={true}
                  />
                )}

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
                {((ticket.categories && ticket.categories.length > 0) || ticket.createdBy || (ticket.isArchived && ticket.archivedDate) || ticket.gradedDate) && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-neutral-800">
                    {ticket.categories && ticket.categories.length > 0 && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500 dark:text-neutral-400 mb-1">Categories</p>
                        <div className="flex flex-wrap gap-1">
                          {ticket.categories.map(cat => (
                            <span key={cat} className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                              {cat}
                            </span>
                          ))}
                        </div>
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
            <div className="w-2/5 flex flex-col bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 overflow-hidden relative">
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
                    categories={ticket.categories || []}
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
    <motion.div
      className="flex flex-col h-screen bg-gray-50 dark:bg-neutral-950"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: duration.normal }}
    >
      {/* Header - Fixed */}
      <motion.div
        className="flex-shrink-0 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.normal, ease: easing.smooth }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">QA Manager</h1>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">Manage agents, tickets, and quality metrics</p>
          </div>
          <motion.button
            onClick={() => setShowCommandPalette(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 rounded-lg transition-colors"
            title="Quick Search (Alt+K)"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Search className="w-4 h-4" />
            Quick Search
          </motion.button>
        </div>
      </motion.div>

      {/* Tabs - Fixed */}
      <div className="flex-shrink-0 bg-gray-50 dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 pt-6 pb-4 overflow-x-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 p-1 rounded-lg inline-flex w-max">
              <TabsTrigger value="dashboard" className="text-sm whitespace-nowrap data-[state=active]:bg-black dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-black dark:text-neutral-400">
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="agents" className="text-sm whitespace-nowrap data-[state=active]:bg-black dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-black dark:text-neutral-400">
                Agents
              </TabsTrigger>
              <TabsTrigger value="tickets" className="text-sm whitespace-nowrap data-[state=active]:bg-black dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-black dark:text-neutral-400">
                Tickets
              </TabsTrigger>
              <TabsTrigger value="archive" className="text-sm whitespace-nowrap data-[state=active]:bg-black dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-black dark:text-neutral-400">
                Archive
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-sm whitespace-nowrap data-[state=active]:bg-black dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-black dark:text-neutral-400">
                <BarChart3 className="w-4 h-4 inline mr-1.5" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="summaries" className="text-sm whitespace-nowrap data-[state=active]:bg-black dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-black dark:text-neutral-400">
                <FileText className="w-4 h-4 inline mr-1.5" />
                Summaries
              </TabsTrigger>
              <TabsTrigger value="import-tickets" className="text-sm whitespace-nowrap data-[state=active]:bg-black dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-black dark:text-neutral-400">
                <Upload className="w-4 h-4 inline mr-1.5" />
                Import Tickets
              </TabsTrigger>
              {['filipkozomara@mebit.io', 'nevena@mebit.io'].includes(user?.email) && (
                <TabsTrigger value="all-agents" className="text-sm whitespace-nowrap data-[state=active]:bg-black dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-black dark:text-neutral-400">
                  <UsersRound className="w-4 h-4 inline mr-1.5" />
                  All Agents
                </TabsTrigger>
              )}
              {['filipkozomara@mebit.io', 'nevena@mebit.io'].includes(user?.email) && (
                <TabsTrigger value="statistics" className="text-sm whitespace-nowrap data-[state=active]:bg-black dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-black dark:text-neutral-400">
                  <TrendingUp className="w-4 h-4 inline mr-1.5" />
                  Statistics
                </TabsTrigger>
              )}
              {['filipkozomara@mebit.io', 'nevena@mebit.io'].includes(user?.email) && (
                <TabsTrigger value="active-overview" className="text-sm whitespace-nowrap data-[state=active]:bg-black dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-black dark:text-neutral-400">
                  <Target className="w-4 h-4 inline mr-1.5" />
                  Active Overview
                </TabsTrigger>
              )}
              {user?.email === 'filipkozomara@mebit.io' && (
                <TabsTrigger value="bugs" className="text-sm whitespace-nowrap data-[state=active]:bg-black dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-black dark:text-neutral-400">
                  <Bug className="w-4 h-4 inline mr-1.5" />
                  Bugs
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
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: duration.normal, ease: easing.smooth }}
              >
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'agents' && renderAgents()}
                {activeTab === 'tickets' && renderTickets()}
                {activeTab === 'archive' && renderArchive()}
                {activeTab === 'analytics' && <QAAnalyticsDashboard />}
                {activeTab === 'summaries' && <QASummaries />}
                {activeTab === 'import-tickets' && <QAImportTickets agents={agents} currentUser={user} />}
                {activeTab === 'all-agents' && <QAAllAgents />}
                {activeTab === 'statistics' && <StatisticsPage />}
                {activeTab === 'active-overview' && <QAActiveOverview />}
                {activeTab === 'bugs' && <BugReportsAdmin getAuthHeaders={getAuthHeaders} userEmail={user?.email} />}
              </motion.div>
            </AnimatePresence>
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

      {/* Assignments Dialog */}
      <Dialog open={assignmentsDialog.open} onOpenChange={(open) => setAssignmentsDialog({ ...assignmentsDialog, open })}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-purple-500" />
              Assignments - {assignmentsDialog.agentName}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {assignmentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-neutral-400">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No assignments found for this agent</p>
                <p className="text-xs mt-1">Assignments will appear here after the bot creates them</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <div
                    key={assignment._id}
                    className="p-4 border border-gray-200 dark:border-neutral-700 rounded-lg bg-gray-50 dark:bg-neutral-800/50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{assignment.assignmentName}</h4>
                        <p className="text-xs text-gray-500 dark:text-neutral-400">
                          Created: {new Date(assignment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          assignment.status === 'completed'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : assignment.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-neutral-700 dark:text-neutral-300'
                        }`}>
                          {assignment.status === 'completed' ? 'Completed' : assignment.status === 'in_progress' ? 'In Progress' : 'Created'}
                        </span>
                        <button
                          onClick={() => handleResetAssignment(assignment._id)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="Reset assignment"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-neutral-400">Total Tickets:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">{assignment.ticketIds?.length || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-neutral-400">Graded:</span>
                        <span className="ml-2 font-medium text-green-600 dark:text-green-400">{assignment.gradedTicketIds?.length || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-neutral-400">Pending:</span>
                        <span className="ml-2 font-medium text-orange-600 dark:text-orange-400">
                          {(assignment.ticketIds?.length || 0) - (assignment.gradedTicketIds?.length || 0)}
                        </span>
                      </div>
                    </div>
                    {assignment.ticketIds && assignment.ticketIds.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-neutral-700">
                        <p className="text-xs text-gray-500 dark:text-neutral-400 mb-1">Ticket IDs:</p>
                        <div className="flex flex-wrap gap-1">
                          {assignment.ticketIds.slice(0, 10).map((ticketId, idx) => (
                            <span
                              key={idx}
                              className={`px-1.5 py-0.5 text-xs rounded ${
                                assignment.gradedTicketIds?.includes(ticketId)
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-gray-100 text-gray-600 dark:bg-neutral-700 dark:text-neutral-300'
                              }`}
                            >
                              {ticketId}
                            </span>
                          ))}
                          {assignment.ticketIds.length > 10 && (
                            <span className="px-1.5 py-0.5 text-xs text-gray-400">
                              +{assignment.ticketIds.length - 10} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Macro Modals */}
      <ManageMacrosModal
        open={manageMacrosDialog.open}
        onOpenChange={(open) => setManageMacrosDialog({ open })}
        onViewTicket={async (ticketId) => {
          // First try to find in local tickets
          let ticket = tickets.find(t => t._id === ticketId || t.ticketId === ticketId);

          // If not found locally, fetch from API
          if (!ticket) {
            try {
              const response = await axios.get(`${API_URL}/api/qa/tickets/${ticketId}`, getAuthHeaders());
              ticket = response.data;
            } catch (err) {
              console.error('Error fetching ticket:', err);
              toast.error('Could not load ticket');
              return;
            }
          }

          if (ticket) {
            setViewDialog({ open: true, ticket });
          }
        }}
      />
      <ChooseMacroModal
        open={chooseMacroDialog.open}
        onOpenChange={(open) => setChooseMacroDialog({ ...chooseMacroDialog, open })}
        onSelectMacro={(macro) => {
          if (chooseMacroDialog.onSelect) {
            chooseMacroDialog.onSelect(macro);
          }
          setChooseMacroDialog({ open: false, onSelect: null });
        }}
      />
      <SaveAsMacroModal
        open={saveAsMacroDialog.open}
        onOpenChange={(open) => setSaveAsMacroDialog({ ...saveAsMacroDialog, open })}
        initialFeedback={saveAsMacroDialog.feedback}
        onSave={() => setSaveAsMacroDialog({ open: false, feedback: '' })}
      />

      {/* Send Ticket Modal - Premium Animated */}
      <SendTicketModal
        open={sendMacroDialog.open}
        onOpenChange={(open) => setSendMacroDialog({ open })}
        agents={allExistingAgents}
        onSubmit={handleSendMacroTicket}
      />

      {/* Decline Ticket Confirmation Modal */}
      <Dialog open={declineConfirmDialog.open} onOpenChange={(open) => !open && setDeclineConfirmDialog({ open: false, macroTicket: null })}>
        <DialogContent className="bg-white dark:bg-neutral-900 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Decline Ticket
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 dark:text-neutral-400 py-2">
            Are you sure you want to decline this ticket? This action cannot be undone.
          </p>
          {declineConfirmDialog.macroTicket && (
            <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-3 text-sm">
              <p><span className="text-gray-500 dark:text-neutral-400">Ticket ID:</span> {declineConfirmDialog.macroTicket.ticketId}</p>
              <p><span className="text-gray-500 dark:text-neutral-400">Agent:</span> {declineConfirmDialog.macroTicket.agent?.name}</p>
              <p><span className="text-gray-500 dark:text-neutral-400">From:</span> {declineConfirmDialog.macroTicket.sentBy?.name || declineConfirmDialog.macroTicket.sentBy?.email}</p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="secondary"
              onClick={() => setDeclineConfirmDialog({ open: false, macroTicket: null })}
            >
              Cancel
            </Button>
            <Button
              ref={(el) => el && declineConfirmDialog.open && setTimeout(() => el.focus(), 0)}
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => handleDeclineMacroTicket(declineConfirmDialog.macroTicket._id)}
            >
              Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Confirmation Modal */}
      <Dialog open={unsavedChangesModal.open} onOpenChange={(open) => !open && setUnsavedChangesModal({ open: false, onConfirm: null })}>
        <DialogContent className="bg-white dark:bg-neutral-900 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Nesačuvane promene
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 dark:text-neutral-400 py-2">
            Imate nesačuvane promene na ovom tiketu. Da li ste sigurni da želite da napustite bez čuvanja?
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="secondary"
              onClick={() => setUnsavedChangesModal({ open: false, onConfirm: null })}
            >
              Otkaži
            </Button>
            <Button
              ref={(el) => el && unsavedChangesModal.open && setTimeout(() => el.focus(), 0)}
              onClick={() => {
                if (unsavedChangesModal.onConfirm) {
                  unsavedChangesModal.onConfirm();
                }
              }}
            >
              Izađi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Command Palette */}
      <QACommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onTicketSelect={(ticket) => {
          openTicketDialog('edit', ticket);
          setShowCommandPalette(false);
        }}
        currentFilters={filters}
      />

      {/* Shortcuts Modal */}
      <QAShortcutsModal
        open={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      {/* Bug Report Floating Button */}
      <BugReportButton getAuthHeaders={getAuthHeaders} />
    </motion.div>
  );
};

export default QAManager;
