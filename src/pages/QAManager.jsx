import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Plus, Edit, Trash2, Filter, Download, Archive, RotateCcw, X,
  Users, CheckCircle, Target,
  FileText, ArrowUpDown, MessageSquare, Sparkles, Tag, TrendingUp, Zap, BarChart3, Search
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
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
const QAManager = () => {
  const { user } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL;

  // State
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Data state
  const [agents, setAgents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  // Filter state
  const [filters, setFilters] = useState({
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
    tags: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showAISearch, setShowAISearch] = useState(true);

  // Dialog state
  const [agentDialog, setAgentDialog] = useState({ open: false, mode: 'create', data: null });
  const [ticketDialog, setTicketDialog] = useState({ open: false, mode: 'create', data: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: null, id: null, name: '' });
  const [gradeDialog, setGradeDialog] = useState({ open: false, ticket: null });
  const [feedbackDialog, setFeedbackDialog] = useState({ open: false, ticket: null });
  const [viewDialog, setViewDialog] = useState({ open: false, ticket: null });

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
    if (activeTab === 'tickets' || activeTab === 'archive') {
      fetchTickets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, activeTab, pagination.page]);

  useEffect(() => {
    fetchAgents(); // Always fetch agents for dropdowns
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'open-command-palette': {
      keys: 'cmd+k',
      handler: (e) => {
        e.preventDefault();
        setShowCommandPalette(true);
      },
      description: 'Open Command Palette',
      enabled: true
    }
  });
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

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.agent) params.append('agent', filters.agent);
      if (filters.status) params.append('status', filters.status);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.scoreMin) params.append('scoreMin', filters.scoreMin);
      if (filters.scoreMax && filters.scoreMax < 100) params.append('scoreMax', filters.scoreMax);
      if (filters.search) params.append('search', filters.search);
      params.append('isArchived', activeTab === 'archive');
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
      const response = await axios.post(`${API_URL}/api/qa/agents`, formData, getAuthHeaders());
      setAgents([...agents, response.data]);
      setAgentDialog({ open: false, mode: 'create', data: null });
      toast.success('Agent created successfully');
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
      toast.success('Agent deleted successfully');
    } catch (err) {
      console.error('Error deleting agent:', err);
      toast.error(err.response?.data?.message || 'Failed to delete agent');
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

  const handleAISearchTicketSelect = (ticket) => {
    // Open ticket for viewing/editing
    setTicketDialog({ open: true, mode: 'edit', data: ticket });
  };

  const handleExportMaestro = async (agentId) => {
    try {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const response = await axios.post(
        `${API_URL}/api/qa/export/maestro/${agentId}`,
        {
          weekStart: weekStart.toISOString(),
          weekEnd: weekEnd.toISOString()
        },
        { ...getAuthHeaders(), responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const agent = agents.find(a => a._id === agentId);
      const agentName = agent ? agent.name.replace(/\s+/g, '_') : 'agent';
      const dateStr = `${weekStart.getMonth() + 1}-${weekStart.getDate()}-${weekStart.getFullYear()}`;
      link.download = `${agentName}_maestro_${dateStr}.csv`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Maestro report exported successfully');
    } catch (err) {
      console.error('Error exporting Maestro report:', err);
      console.error('Error details:', err.response?.data);
      toast.error(err.response?.data?.message || 'Failed to export Maestro report');
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
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">Manage QA agents and assignments</p>
          </div>
          <Button onClick={() => setAgentDialog({ open: true, mode: 'create', data: null })}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Agent
          </Button>
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
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Name
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Team</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                {sortedAgents.map((agent) => (
                  <tr key={agent._id} className="hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center text-xs font-medium">
                          {agent.name?.charAt(0) || '?'}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{agent.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-neutral-400">{agent.position || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-neutral-400">{agent.team || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        agent.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400'
                      }`}>
                        {agent.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleExportMaestro(agent._id)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
                          title="Export Maestro"
                        >
                          <Download className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
                        </button>
                        <button
                          onClick={() => setAgentDialog({ open: true, mode: 'edit', data: agent })}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
                        </button>
                        <button
                          onClick={() => setDeleteDialog({ open: true, type: 'agent', id: agent._id, name: agent.name })}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
        {/* AI Search Bar */}
        {showAISearch && (
          <div className="mb-4">
            <QASearchBar
              onTicketSelect={handleAISearchTicketSelect}
              currentFilters={filters}
              onFilterChange={setFilters}
            />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tickets</h2>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">Review and grade support tickets</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAISearch(!showAISearch)}
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              {showAISearch ? 'Hide' : 'Show'} AI Search
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-1.5" />
              Filters
            </Button>
            <Button onClick={() => setTicketDialog({ open: true, mode: 'create', data: null })}>
              <Plus className="w-4 h-4 mr-1.5" />
              Add Ticket
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5">Search</Label>
                <Input
                  placeholder="Search tickets..."
                  value={filters.search}
                  onChange={(e) => updateFilters({ ...filters, search: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5">Agent</Label>
                <select
                  value={filters.agent}
                  onChange={(e) => updateFilters({ ...filters, agent: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white"
                >
                  <option value="">All agents</option>
                  {agents.map(agent => (
                    <option key={agent._id} value={agent._id}>{agent.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5">Status</Label>
                <select
                  value={filters.status}
                  onChange={(e) => updateFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white"
                >
                  <option value="">All statuses</option>
                  <option value="Selected">Selected</option>
                  <option value="Graded">Graded</option>
                </select>
              </div>
              <div>
                <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5">Date From</Label>
                <DatePicker
                  value={filters.dateFrom}
                  onChange={(value) => updateFilters({ ...filters, dateFrom: value })}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5">Date To</Label>
                <DatePicker
                  value={filters.dateTo}
                  onChange={(value) => updateFilters({ ...filters, dateTo: value })}
                  className="text-sm"
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateFilters({
                    agent: '',
                    status: '',
                    isArchived: false,
                    dateFrom: '',
                    dateTo: '',
                    scoreMin: 0,
                    scoreMax: 100,
                    search: ''
                  })}
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-1.5" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        )}

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
                  <th className="px-6 py-3 w-8">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Score</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                {sortedTickets.map((ticket) => (
                  <tr
                    key={ticket._id}
                    className="hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    onClick={(e) => {
                      // Don't open dialog if clicking on checkbox or action buttons
                      if (e.target.closest('input[type="checkbox"]') || e.target.closest('button')) {
                        return;
                      }
                      setViewDialog({ open: true, ticket });
                    }}
                  >
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
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
                    <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-neutral-400">{ticket.ticketId || ticket._id.slice(-6)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {ticket.agent?.name || ticket.agentName || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-neutral-400">
                      {new Date(ticket.dateEntered || ticket.createdAt || ticket.reviewDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-6 py-4">
                      <QualityScoreBadge score={ticket.qualityScorePercent} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {ticket.status !== 'Graded' && (
                          <button
                            onClick={() => setGradeDialog({ open: true, ticket })}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
                            title="Grade ticket"
                          >
                            <Target className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
                          </button>
                        )}
                        <button
                          onClick={() => setFeedbackDialog({ open: true, ticket })}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
                          title="Add feedback"
                        >
                          <MessageSquare className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
                        </button>
                        <button
                          onClick={() => setTicketDialog({ open: true, mode: 'edit', data: ticket })}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
                        </button>
                        <button
                          onClick={() => handleArchiveTicket(ticket._id)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
                          title="Archive"
                        >
                          <Archive className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
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
    const sortedTickets = getSortedData(tickets);

    return (
      <div className="space-y-4">
        {/* AI Search Bar */}
        {showAISearch && (
          <div className="mb-4">
            <QASearchBar
              onTicketSelect={handleAISearchTicketSelect}
              currentFilters={{ ...filters, isArchived: true }}
              onFilterChange={setFilters}
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Archive</h2>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">Archived tickets from all QA agents</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAISearch(!showAISearch)}
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              {showAISearch ? 'Hide' : 'Show'} AI Search
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-1.5" />
              Filters
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5">Search</Label>
                <Input
                  placeholder="Search tickets..."
                  value={filters.search}
                  onChange={(e) => updateFilters({ ...filters, search: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5">Agent</Label>
                <select
                  value={filters.agent}
                  onChange={(e) => updateFilters({ ...filters, agent: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white"
                >
                  <option value="">All agents</option>
                  {agents.map(agent => (
                    <option key={agent._id} value={agent._id}>{agent.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5">Status</Label>
                <select
                  value={filters.status}
                  onChange={(e) => updateFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white"
                >
                  <option value="">All statuses</option>
                  <option value="Selected">Selected</option>
                  <option value="Graded">Graded</option>
                </select>
              </div>
              <div>
                <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5">Date From</Label>
                <DatePicker
                  value={filters.dateFrom}
                  onChange={(value) => updateFilters({ ...filters, dateFrom: value })}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5">Date To</Label>
                <DatePicker
                  value={filters.dateTo}
                  onChange={(value) => updateFilters({ ...filters, dateTo: value })}
                  className="text-sm"
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateFilters({
                    agent: '',
                    status: '',
                    isArchived: false,
                    dateFrom: '',
                    dateTo: '',
                    scoreMin: 0,
                    scoreMax: 100,
                    search: ''
                  })}
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-1.5" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <LoadingSkeleton />
        ) : tickets.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg">
            <EmptyState
              icon={Archive}
              title="No archived tickets"
              description="Archived tickets will appear here."
            />
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Archived Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                {sortedTickets.map((ticket) => (
                  <tr
                    key={ticket._id}
                    className="hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    onClick={(e) => {
                      // Don't open dialog if clicking on action buttons
                      if (e.target.closest('button')) {
                        return;
                      }
                      setViewDialog({ open: true, ticket });
                    }}
                  >
                    <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-neutral-400">{ticket.ticketId || ticket._id.slice(-6)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{ticket.agent?.name || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-6 py-4">
                      <QualityScoreBadge score={ticket.qualityScorePercent} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-neutral-400">
                      {ticket.archivedDate ? new Date(ticket.archivedDate).toLocaleDateString() : new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRestoreTicket(ticket._id)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
                          title="Restore"
                        >
                          <RotateCcw className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
                        </button>
                        <button
                          onClick={() => setDeleteDialog({ open: true, type: 'ticket', id: ticket._id, name: ticket.ticketId })}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
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
          <form onSubmit={handleSubmit} className="space-y-4">
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

  // Ticket Dialog Component
  const TicketDialogContent = () => {
    const [formData, setFormData] = useState({
      agent: '',
      ticketId: '',
      status: 'Selected',
      dateEntered: new Date().toISOString().split('T')[0],
      notes: '',
      feedback: '',
      qualityScorePercent: '',
      category: 'General'
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
          category: ticketDialog.data.category || 'General'
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
          category: 'General'
        });
      }
    }, [ticketDialog.data]);

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
        <DialogContent className="bg-white dark:bg-neutral-900 max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {ticketDialog.mode === 'create' ? 'Create Ticket' : 'Edit Ticket'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5">Agent <span className="text-red-600 dark:text-red-400">*</span></Label>
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
                <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5">Ticket ID <span className="text-red-600 dark:text-red-400">*</span></Label>
                <Input
                  value={formData.ticketId}
                  onChange={(e) => setFormData({ ...formData, ticketId: e.target.value })}
                  placeholder="Enter ticket ID"
                  required
                  className="text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5">Status</Label>
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
                <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5">Date Entered</Label>
                <DatePicker
                  value={formData.dateEntered}
                  onChange={(value) => setFormData({ ...formData, dateEntered: value })}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5">Quality Score (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.qualityScorePercent}
                  onChange={(e) => setFormData({ ...formData, qualityScorePercent: e.target.value })}
                  placeholder="0-100"
                  className="text-sm"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5">Category</Label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white"
              >
                <option value="General">General</option>
                <option value="Technical">Technical</option>
                <option value="Billing">Billing</option>
                <option value="Account">Account</option>
                <option value="Complaint">Complaint</option>
                <option value="Feature Request">Feature Request</option>
                <option value="Bug Report">Bug Report</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5">Notes</Label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Internal notes for yourself"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white resize-none"
                />
              </div>

              <div>
                <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5">Feedback</Label>
                <textarea
                  value={formData.feedback}
                  onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                  placeholder="Feedback to agent after grading"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white resize-none"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-gray-200 dark:border-neutral-800">
              <Button type="button" variant="secondary" onClick={() => setTicketDialog({ ...ticketDialog, open: false })}>
                Cancel
              </Button>
              <Button type="submit">
                {ticketDialog.mode === 'create' ? 'Create Ticket' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // Grade Dialog Component
  const GradeDialogContent = () => {
    const [score, setScore] = useState(gradeDialog.ticket?.qualityScorePercent || 80);

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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5">Quality Score (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(parseInt(e.target.value))}
                required
                className="text-sm"
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
    const [feedback, setFeedback] = useState(feedbackDialog.ticket?.feedback || '');

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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs text-gray-600 dark:text-neutral-400 mb-1.5">Feedback</Label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
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

  // View Ticket Details Dialog Component
  const ViewTicketDialogContent = () => {
    if (!viewDialog.ticket) return null;

    const ticket = viewDialog.ticket;

    return (
      <Dialog open={viewDialog.open} onOpenChange={(open) => setViewDialog({ ...viewDialog, open })}>
        <DialogContent className="bg-white dark:bg-neutral-900 max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Ticket Details
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(85vh-120px)] space-y-6 pr-2">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200 dark:border-neutral-800">
              <div>
                <p className="text-xs text-gray-500 dark:text-neutral-400 mb-1">Ticket ID</p>
                <p className="text-sm font-mono font-medium text-gray-900 dark:text-white">{ticket.ticketId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-neutral-400 mb-1">Agent</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.agent?.name || ticket.agentName || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-neutral-400 mb-1">Status</p>
                <StatusBadge status={ticket.status} />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-neutral-400 mb-1">Quality Score</p>
                <QualityScoreBadge score={ticket.qualityScorePercent} />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-neutral-400 mb-1">Date Entered</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {new Date(ticket.dateEntered || ticket.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
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
            </div>

            {/* Notes Section */}
            {ticket.notes && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notes
                </h4>
                <div className="bg-gray-50 dark:bg-neutral-950 rounded-lg p-4 border border-gray-200 dark:border-neutral-800">
                  <p className="text-sm text-gray-700 dark:text-neutral-300 whitespace-pre-wrap">{ticket.notes}</p>
                </div>
              </div>
            )}

            {/* Feedback Section */}
            {ticket.feedback && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Feedback
                </h4>
                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-gray-700 dark:text-neutral-300 whitespace-pre-wrap">{ticket.feedback}</p>
                </div>
              </div>
            )}

            {/* Metadata */}
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
          </div>

          <DialogFooter className="pt-4 border-t border-gray-200 dark:border-neutral-800">
            <Button variant="secondary" onClick={() => setViewDialog({ open: false, ticket: null })}>
              Close
            </Button>
            {!ticket.isArchived && (
              <Button onClick={() => {
                setViewDialog({ open: false, ticket: null });
                setTicketDialog({ open: true, mode: 'edit', data: ticket });
              }}>
                <Edit className="w-4 h-4 mr-1.5" />
                Edit Ticket
              </Button>
            )}
          </DialogFooter>
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
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 dark:text-neutral-400">
            Are you sure you want to delete <strong className="text-gray-900 dark:text-white">{deleteDialog.name}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteDialog({ open: false, type: null, id: null, name: '' })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
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
          >
            <Search className="w-4 h-4" />
            Quick Search
            <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded">⌘K</kbd>
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
          </Tabs>
        </div>
      </div>

      {/* Dialogs */}
      {agentDialog.open && <AgentDialogContent />}
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
    </div>
  );
};

export default QAManager;
