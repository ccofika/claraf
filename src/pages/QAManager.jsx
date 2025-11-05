import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Plus, Edit, Trash2, Filter, Download, Archive, RotateCcw, Search, X,
  Calendar, Users, CheckCircle, Clock, AlertCircle, TrendingUp, Target,
  Activity, FileText, MoreVertical, Eye, ChevronDown, ChevronUp, ArrowUpDown,
  MessageSquare
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

const QAManager = () => {
  const { user } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL;

  // State
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Data state
  const [agents, setAgents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    agent: '',
    status: '',
    isArchived: false,
    dateFrom: '',
    dateTo: '',
    scoreMin: 0,
    scoreMax: 100,
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Dialog state
  const [agentDialog, setAgentDialog] = useState({ open: false, mode: 'create', data: null });
  const [ticketDialog, setTicketDialog] = useState({ open: false, mode: 'create', data: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: null, id: null, name: '' });
  const [gradeDialog, setGradeDialog] = useState({ open: false, ticket: null });
  const [feedbackDialog, setFeedbackDialog] = useState({ open: false, ticket: null });

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
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'tickets' || activeTab === 'archive') {
      fetchTickets();
    }
  }, [filters]);

  useEffect(() => {
    fetchAgents(); // Always fetch agents for dropdowns
  }, []);

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

      const response = await axios.get(
        `${API_URL}/api/qa/tickets?${params.toString()}`,
        getAuthHeaders()
      );
      // Backend returns { tickets: [...], pagination: {...} }
      setTickets(response.data.tickets || response.data);
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
      // Ensure tickets is always an array
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
      // Ensure tickets is always an array
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
      // Update the ticket in the list
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
      // Update the ticket in the list
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
      // Calculate current week range (Sunday to Saturday)
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Sunday
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // Saturday
      weekEnd.setHours(23, 59, 59, 999);

      const response = await axios.post(
        `${API_URL}/api/qa/export/maestro/${agentId}`,
        {
          weekStart: weekStart.toISOString(),
          weekEnd: weekEnd.toISOString()
        },
        { ...getAuthHeaders(), responseType: 'blob' }
      );

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers['content-disposition'];
      let fileName = 'maestro_export.xlsx';

      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = fileNameMatch[1].replace(/"/g, '');
        }
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Maestro export downloaded successfully');
    } catch (err) {
      console.error('Error exporting Maestro:', err);
      toast.error('Failed to export Maestro file');
    }
  };

  // Sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = (data) => {
    if (!data || !Array.isArray(data)) return [];
    if (!sortConfig.key) return data;

    const sorted = [...data].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Handle nested properties
      if (sortConfig.key === 'agentName' && a.agent) {
        aVal = a.agent.name;
        bVal = b.agent.name;
      }

      // Handle dates
      if (sortConfig.key.includes('Date') || sortConfig.key.includes('time')) {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  };

  // Filter helpers
  const getActiveFilters = () => {
    const active = [];
    if (filters.agent) {
      const agent = agents.find(a => a._id === filters.agent);
      if (agent) active.push({ key: 'agent', label: `Agent: ${agent.name}`, value: filters.agent });
    }
    if (filters.status) active.push({ key: 'status', label: `Status: ${filters.status}`, value: filters.status });
    if (filters.dateFrom) active.push({ key: 'dateFrom', label: `From: ${filters.dateFrom}`, value: filters.dateFrom });
    if (filters.dateTo) active.push({ key: 'dateTo', label: `To: ${filters.dateTo}`, value: filters.dateTo });
    if (filters.search) active.push({ key: 'search', label: `Search: ${filters.search}`, value: filters.search });
    return active;
  };

  const clearFilter = (key) => {
    setFilters({ ...filters, [key]: key === 'scoreMin' ? 0 : key === 'scoreMax' ? 100 : '' });
  };

  const clearAllFilters = () => {
    setFilters({
      agent: '',
      status: '',
      isArchived: false,
      dateFrom: '',
      dateTo: '',
      scoreMin: 0,
      scoreMax: 100,
      search: ''
    });
    setShowFilters(false);
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const config = {
      'Selected': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock },
      'Graded': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle }
    };

    const { color, icon: Icon } = config[status] || config['Selected'];

    return (
      <Badge variant="outline" className={`${color} border flex items-center gap-1 px-2 py-0.5`}>
        <Icon className="w-3 h-3" />
        <span className="text-xs font-medium">{status}</span>
      </Badge>
    );
  };

  // Quality Score Badge
  const QualityScoreBadge = ({ score }) => {
    if (score === null || score === undefined) return <span className="text-muted-foreground/70 text-sm">-</span>;

    let color = 'bg-red-100 text-red-800 border-red-200';
    if (score >= 90) color = 'bg-green-100 text-green-800 border-green-200';
    else if (score >= 70) color = 'bg-yellow-100 text-yellow-800 border-yellow-200';

    return (
      <Badge variant="outline" className={`${color} border px-2 py-0.5`}>
        <span className="text-xs font-semibold">{score}%</span>
      </Badge>
    );
  };

  // Loading Skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4 animate-pulse">
      <div className="h-32 bg-muted/30 rounded-lg"></div>
      <div className="h-32 bg-muted/30 rounded-lg"></div>
      <div className="h-32 bg-muted/30 rounded-lg"></div>
    </div>
  );

  // Empty State
  const EmptyState = ({ icon: Icon, title, description, action }) => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground/70" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">{description}</p>
      {action}
    </div>
  );

  // KPI Card Component
  const KPICard = ({ icon: Icon, title, value, subtitle, trend, color = "blue" }) => {
    const colorClasses = {
      blue: "bg-blue-50 text-blue-600",
      green: "bg-green-50 text-green-600",
      yellow: "bg-yellow-50 text-yellow-600",
      purple: "bg-purple-50 text-purple-600"
    };

    return (
      <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4" style={{ borderLeftColor: color === 'blue' ? '#3b82f6' : color === 'green' ? '#10b981' : color === 'yellow' ? '#f59e0b' : '#8b5cf6' }}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
              <p className="text-3xl font-bold text-foreground mb-2">{value}</p>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
              {trend && (
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-green-600">{trend}</span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Dashboard Tab
  const renderDashboard = () => {
    if (loading) return <LoadingSkeleton />;

    if (!dashboardStats) {
      return (
        <EmptyState
          icon={AlertCircle}
          title="Unable to load dashboard"
          description="There was an error loading the dashboard statistics. Please try again."
          action={
            <button
              onClick={fetchDashboardStats}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          }
        />
      );
    }

    const gradedRate = dashboardStats.totalTickets > 0
      ? ((dashboardStats.gradedTickets / dashboardStats.totalTickets) * 100).toFixed(1)
      : 0;

    return (
      <div className="space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            icon={FileText}
            title="Total Tickets"
            value={dashboardStats.totalTickets || 0}
            subtitle="All time"
            color="blue"
          />
          <KPICard
            icon={CheckCircle}
            title="Graded Rate"
            value={`${gradedRate}%`}
            subtitle={`${dashboardStats.gradedTickets || 0} of ${dashboardStats.totalTickets || 0} graded`}
            trend={gradedRate >= 70 ? `${gradedRate}% target met` : null}
            color="green"
          />
          <KPICard
            icon={Target}
            title="Avg Quality Score"
            value={dashboardStats.avgQualityScore ? `${dashboardStats.avgQualityScore.toFixed(1)}%` : 'N/A'}
            subtitle="Across all tickets"
            color="yellow"
          />
          <KPICard
            icon={Users}
            title="Active Agents"
            value={dashboardStats.activeAgents || 0}
            subtitle={`${agents.length || 0} total agents`}
            color="purple"
          />
        </div>

        {/* Recent Activity Section */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Performance Overview</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Quality metrics and ticket distribution</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-card-foreground">Selected Tickets</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{dashboardStats.selectedTickets || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Awaiting grading</p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-card-foreground">Graded Tickets</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{dashboardStats.gradedTickets || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Quality evaluated</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agents Performance Table */}
        {dashboardStats.agentStats && dashboardStats.agentStats.length > 0 && (
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-lg font-semibold">Agent Performance</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Individual agent metrics and progress</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Agent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tickets</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Graded</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {dashboardStats.agentStats.map((stat, idx) => (
                      <tr key={idx} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm mr-3">
                              {stat.agentName?.charAt(0) || '?'}
                            </div>
                            <span className="text-sm font-medium text-foreground">{stat.agentName || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-foreground">{stat.ticketCount || 0}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted/30 rounded-full h-2 max-w-[100px]">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${stat.ticketCount > 0 ? (stat.gradedCount / stat.ticketCount) * 100 : 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-muted-foreground">{stat.gradedCount || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <QualityScoreBadge score={stat.avgScore ? parseFloat(stat.avgScore.toFixed(1)) : null} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleExportMaestro(stat.agentId)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                          >
                            <Download className="w-4 h-4" />
                            Export
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Agents Tab
  const renderAgents = () => {
    const sortedAgents = getSortedData(agents);

    return (
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Agents</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage QA agents and their assignments</p>
          </div>
          <button
            onClick={() => setAgentDialog({ open: true, mode: 'create', data: null })}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Agent
          </button>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : agents.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={Users}
                title="No agents found"
                description="Get started by creating your first QA agent. Agents are responsible for reviewing and evaluating tickets."
                action={
                  <button
                    onClick={() => setAgentDialog({ open: true, mode: 'create', data: null })}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Agent
                  </button>
                }
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-2">
                          <span>Name</span>
                          <ArrowUpDown className="w-4 h-4" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Position</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Team</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Period</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {sortedAgents.map((agent) => (
                      <tr key={agent._id} className="hover:bg-muted/50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold mr-3 shadow-sm">
                              {agent.name?.charAt(0) || '?'}
                            </div>
                            <span className="text-sm font-medium text-foreground">{agent.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {agent.position || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {agent.team || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {agent.periodStart && agent.periodEnd ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-muted-foreground/70" />
                              <span>{new Date(agent.periodStart).toLocaleDateString()} - {new Date(agent.periodEnd).toLocaleDateString()}</span>
                            </div>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline" className={agent.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-muted/50 text-card-foreground border'}>
                            {agent.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleExportMaestro(agent._id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Export Maestro"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setAgentDialog({ open: true, mode: 'edit', data: agent })}
                              className="p-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors"
                              title="Edit Agent"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteDialog({ open: true, type: 'agent', id: agent._id, name: agent.name })}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Agent"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Tickets Tab
  const renderTickets = () => {
    const sortedTickets = getSortedData(tickets);
    const activeFilters = getActiveFilters();

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Tickets</h2>
            <p className="text-sm text-muted-foreground mt-1">Track and manage QA evaluation tickets</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedTickets.length > 0 && (
              <button
                onClick={handleBulkArchive}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors shadow-sm"
              >
                <Archive className="w-4 h-4" />
                Archive ({selectedTickets.length})
              </button>
            )}
            <button
              onClick={() => setTicketDialog({ open: true, mode: 'create', data: null })}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Ticket
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/70 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search tickets by ID or description..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10 pr-4 py-2 w-full border-input focus:border-blue-500 focus:ring-blue-500"
                  />
                  {filters.search && (
                    <button
                      onClick={() => setFilters({ ...filters, search: '' })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/70 hover:text-muted-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    showFilters || activeFilters.length > 0
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-card border-input text-card-foreground hover:bg-muted/50'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {activeFilters.length > 0 && (
                    <Badge className="bg-blue-600 text-white ml-1">{activeFilters.length}</Badge>
                  )}
                </button>
              </div>

              {/* Active Filter Chips */}
              {activeFilters.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {activeFilters.map((filter) => (
                    <Badge
                      key={filter.key}
                      variant="secondary"
                      className="bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1 flex items-center gap-2"
                    >
                      <span className="text-xs">{filter.label}</span>
                      <button
                        onClick={() => clearFilter(filter.key)}
                        className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium ml-2"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {/* Advanced Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                  <div>
                    <Label htmlFor="filterAgent" className="text-sm font-medium text-card-foreground mb-2 block">
                      Agent
                    </Label>
                    <select
                      id="filterAgent"
                      value={filters.agent}
                      onChange={(e) => setFilters({ ...filters, agent: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-card text-foreground"
                    >
                      <option value="">All Agents</option>
                      {agents.map(agent => (
                        <option key={agent._id} value={agent._id}>{agent.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="filterStatus" className="text-sm font-medium text-card-foreground mb-2 block">
                      Status
                    </Label>
                    <select
                      id="filterStatus"
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-card text-foreground"
                    >
                      <option value="">All Status</option>
                      <option value="Selected">Selected</option>
                      <option value="Graded">Graded</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="filterDateFrom" className="text-sm font-medium text-card-foreground mb-2 block">
                      Date From
                    </Label>
                    <Input
                      id="filterDateFrom"
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                      className="w-full text-sm"
                    />
                  </div>

                  <div>
                    <Label htmlFor="filterDateTo" className="text-sm font-medium text-card-foreground mb-2 block">
                      Date To
                    </Label>
                    <Input
                      id="filterDateTo"
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                      className="w-full text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tickets Table */}
        {loading ? (
          <LoadingSkeleton />
        ) : sortedTickets.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={FileText}
                title={filters.search || activeFilters.length > 0 ? "No tickets match your filters" : "No tickets found"}
                description={filters.search || activeFilters.length > 0 ? "Try adjusting your search criteria or filters" : "Create your first ticket to start tracking QA evaluations"}
                action={
                  filters.search || activeFilters.length > 0 ? (
                    <button
                      onClick={clearAllFilters}
                      className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Clear Filters
                    </button>
                  ) : (
                    <button
                      onClick={() => setTicketDialog({ open: true, mode: 'create', data: null })}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Create Ticket
                    </button>
                  )
                }
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedTickets.length === sortedTickets.length && sortedTickets.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTickets(sortedTickets.map(t => t._id));
                            } else {
                              setSelectedTickets([]);
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-input rounded focus:ring-blue-500"
                        />
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => handleSort('ticketId')}
                      >
                        <div className="flex items-center gap-2">
                          <span>Ticket ID</span>
                          <ArrowUpDown className="w-4 h-4" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Agent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => handleSort('qualityScorePercent')}
                      >
                        <div className="flex items-center gap-2">
                          <span>Quality</span>
                          <ArrowUpDown className="w-4 h-4" />
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => handleSort('dateEntered')}
                      >
                        <div className="flex items-center gap-2">
                          <span>Date</span>
                          <ArrowUpDown className="w-4 h-4" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {sortedTickets.map((ticket) => (
                      <tr key={ticket._id} className="hover:bg-muted/50 transition-colors group">
                        <td className="px-4 py-4">
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
                            className="w-4 h-4 text-blue-600 border-input rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono font-medium text-foreground">{ticket.ticketId}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs mr-2">
                              {ticket.agent?.name?.charAt(0) || '?'}
                            </div>
                            <span className="text-sm text-foreground">{ticket.agent?.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <p className="text-sm text-foreground truncate" title={ticket.shortDescription}>
                            {ticket.shortDescription || '-'}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={ticket.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <QualityScoreBadge score={ticket.qualityScorePercent} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {new Date(ticket.dateEntered).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {ticket.status === 'Selected' ? (
                              <button
                                onClick={() => setGradeDialog({ open: true, ticket })}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
                                title="Grade Ticket"
                              >
                                <Target className="w-4 h-4" />
                                Grade
                              </button>
                            ) : (
                              <button
                                onClick={() => setTicketDialog({ open: true, mode: 'edit', data: ticket })}
                                className="p-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors"
                                title="Edit Ticket"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => setFeedbackDialog({ open: true, ticket })}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Add Feedback"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleArchiveTicket(ticket._id)}
                              className="p-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors"
                              title="Archive Ticket"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteDialog({ open: true, type: 'ticket', id: ticket._id, name: ticket.ticketId })}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Ticket"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Archive Tab
  const renderArchive = () => {
    const sortedTickets = getSortedData(tickets);
    const activeFilters = getActiveFilters();

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Archive</h2>
            <p className="text-sm text-muted-foreground mt-1">View and restore archived tickets</p>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/70 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search archived tickets by ID or description..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10 pr-4 py-2 w-full border-input focus:border-blue-500 focus:ring-blue-500"
                  />
                  {filters.search && (
                    <button
                      onClick={() => setFilters({ ...filters, search: '' })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/70 hover:text-muted-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    showFilters || activeFilters.length > 0
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-card border-input text-card-foreground hover:bg-muted/50'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {activeFilters.length > 0 && (
                    <Badge className="bg-blue-600 text-white ml-1">{activeFilters.length}</Badge>
                  )}
                </button>
              </div>

              {/* Active Filter Chips */}
              {activeFilters.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {activeFilters.map((filter) => (
                    <Badge
                      key={filter.key}
                      variant="secondary"
                      className="bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1 flex items-center gap-2"
                    >
                      <span className="text-xs">{filter.label}</span>
                      <button
                        onClick={() => clearFilter(filter.key)}
                        className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium ml-2"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {/* Advanced Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                  <div>
                    <Label htmlFor="filterAgentArchive" className="text-sm font-medium text-card-foreground mb-2 block">
                      Agent
                    </Label>
                    <select
                      id="filterAgentArchive"
                      value={filters.agent}
                      onChange={(e) => setFilters({ ...filters, agent: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-card text-foreground"
                    >
                      <option value="">All Agents</option>
                      {agents.map(agent => (
                        <option key={agent._id} value={agent._id}>{agent.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="filterStatusArchive" className="text-sm font-medium text-card-foreground mb-2 block">
                      Status
                    </Label>
                    <select
                      id="filterStatusArchive"
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-card text-foreground"
                    >
                      <option value="">All Status</option>
                      <option value="Selected">Selected</option>
                      <option value="Graded">Graded</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="filterDateFromArchive" className="text-sm font-medium text-card-foreground mb-2 block">
                      Date From
                    </Label>
                    <Input
                      id="filterDateFromArchive"
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                      className="w-full text-sm"
                    />
                  </div>

                  <div>
                    <Label htmlFor="filterDateToArchive" className="text-sm font-medium text-card-foreground mb-2 block">
                      Date To
                    </Label>
                    <Input
                      id="filterDateToArchive"
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                      className="w-full text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Archived Tickets Table */}
        {loading ? (
          <LoadingSkeleton />
        ) : sortedTickets.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={Archive}
                title="No archived tickets"
                description="Tickets that have been archived will appear here. You can restore them at any time."
                action={null}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Ticket ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Agent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Quality</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Archived Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {sortedTickets.map((ticket) => (
                      <tr key={ticket._id} className="hover:bg-muted/50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono font-medium text-foreground">{ticket.ticketId}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs mr-2">
                              {ticket.agent?.name?.charAt(0) || '?'}
                            </div>
                            <span className="text-sm text-foreground">{ticket.agent?.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <p className="text-sm text-foreground truncate" title={ticket.shortDescription}>
                            {ticket.shortDescription || '-'}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={ticket.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <QualityScoreBadge score={ticket.qualityScorePercent} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {ticket.archivedDate ? new Date(ticket.archivedDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleRestoreTicket(ticket._id)}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Restore Ticket"
                            >
                              <RotateCcw className="w-4 h-4" />
                              Restore
                            </button>
                            <button
                              onClick={() => setDeleteDialog({ open: true, type: 'ticket', id: ticket._id, name: ticket.ticketId })}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Agent Dialog Component
  const AgentDialogComponent = () => {
    const [formData, setFormData] = useState({
      name: '',
      position: '',
      team: '',
      goalMinDate: '',
      goalMaxDate: '',
      periodStart: '',
      periodEnd: '',
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
          periodStart: agentDialog.data.periodStart ? new Date(agentDialog.data.periodStart).toISOString().split('T')[0] : '',
          periodEnd: agentDialog.data.periodEnd ? new Date(agentDialog.data.periodEnd).toISOString().split('T')[0] : '',
          isActive: agentDialog.data.isActive !== undefined ? agentDialog.data.isActive : true
        });
      } else {
        setFormData({
          name: '',
          position: '',
          team: '',
          goalMinDate: '',
          goalMaxDate: '',
          periodStart: '',
          periodEnd: '',
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
      <Dialog open={agentDialog.open} onOpenChange={(open) => !open && setAgentDialog({ open: false, mode: 'create', data: null })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {agentDialog.mode === 'create' ? 'Create New Agent' : 'Edit Agent'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="agentName" className="text-sm font-medium text-card-foreground mb-2 block">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="agentName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter agent name"
                  required
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="agentPosition" className="text-sm font-medium text-card-foreground mb-2 block">
                  Position
                </Label>
                <Input
                  id="agentPosition"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Enter position"
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="agentTeam" className="text-sm font-medium text-card-foreground mb-2 block">
                Team
              </Label>
              <Input
                id="agentTeam"
                value={formData.team}
                onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                placeholder="Enter team name"
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="goalMinDate" className="text-sm font-medium text-card-foreground mb-2 block">
                  Goal Min Date
                </Label>
                <Input
                  id="goalMinDate"
                  type="date"
                  value={formData.goalMinDate}
                  onChange={(e) => setFormData({ ...formData, goalMinDate: e.target.value })}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="goalMaxDate" className="text-sm font-medium text-card-foreground mb-2 block">
                  Goal Max Date
                </Label>
                <Input
                  id="goalMaxDate"
                  type="date"
                  value={formData.goalMaxDate}
                  onChange={(e) => setFormData({ ...formData, goalMaxDate: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="periodStart" className="text-sm font-medium text-card-foreground mb-2 block">
                  Period Start
                </Label>
                <Input
                  id="periodStart"
                  type="date"
                  value={formData.periodStart}
                  onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="periodEnd" className="text-sm font-medium text-card-foreground mb-2 block">
                  Period End
                </Label>
                <Input
                  id="periodEnd"
                  type="date"
                  value={formData.periodEnd}
                  onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-input rounded focus:ring-blue-500"
              />
              <Label htmlFor="isActive" className="text-sm font-medium text-card-foreground cursor-pointer">
                Active Agent
              </Label>
            </div>

            <DialogFooter className="flex items-center gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setAgentDialog({ open: false, mode: 'create', data: null })}
                className="px-4 py-2 text-card-foreground border border-input rounded-lg hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {agentDialog.mode === 'create' ? 'Create Agent' : 'Save Changes'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // Ticket Dialog Component
  const TicketDialogComponent = () => {
    const [formData, setFormData] = useState({
      agent: '',
      ticketId: '',
      shortDescription: '',
      dateEntered: new Date().toISOString().split('T')[0],
      notes: '',
      feedback: '',
      status: 'Selected',
      qualityScorePercent: ''
    });

    useEffect(() => {
      if (ticketDialog.data) {
        setFormData({
          agent: ticketDialog.data.agent?._id || ticketDialog.data.agent || '',
          ticketId: ticketDialog.data.ticketId || '',
          shortDescription: ticketDialog.data.shortDescription || '',
          dateEntered: ticketDialog.data.dateEntered ? new Date(ticketDialog.data.dateEntered).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          notes: ticketDialog.data.notes || '',
          feedback: ticketDialog.data.feedback || '',
          status: ticketDialog.data.status || 'Selected',
          qualityScorePercent: ticketDialog.data.qualityScorePercent !== undefined ? ticketDialog.data.qualityScorePercent : ''
        });
      } else {
        setFormData({
          agent: '',
          ticketId: '',
          shortDescription: '',
          dateEntered: new Date().toISOString().split('T')[0],
          notes: '',
          feedback: '',
          status: 'Selected',
          qualityScorePercent: ''
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
      <Dialog open={ticketDialog.open} onOpenChange={(open) => !open && setTicketDialog({ open: false, mode: 'create', data: null })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {ticketDialog.mode === 'create' ? 'Create New Ticket' : 'Edit Ticket'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ticketAgent" className="text-sm font-medium text-card-foreground mb-2 block">
                  Agent <span className="text-red-500">*</span>
                </Label>
                <select
                  id="ticketAgent"
                  value={formData.agent}
                  onChange={(e) => setFormData({ ...formData, agent: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-card text-foreground"
                >
                  <option value="">Select Agent</option>
                  {agents.map(agent => (
                    <option key={agent._id} value={agent._id}>{agent.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="ticketId" className="text-sm font-medium text-card-foreground mb-2 block">
                  Ticket ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ticketId"
                  value={formData.ticketId}
                  onChange={(e) => setFormData({ ...formData, ticketId: e.target.value })}
                  placeholder="Enter ticket ID"
                  required
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="ticketDescription" className="text-sm font-medium text-card-foreground mb-2 block">
                Description
              </Label>
              <textarea
                id="ticketDescription"
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                placeholder="Enter ticket description"
                rows={3}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-card text-foreground"
              />
            </div>

            <div>
              <Label htmlFor="ticketDate" className="text-sm font-medium text-card-foreground mb-2 block">
                Date Entered
              </Label>
              <Input
                id="ticketDate"
                type="date"
                value={formData.dateEntered}
                onChange={(e) => setFormData({ ...formData, dateEntered: e.target.value })}
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="ticketNotes" className="text-sm font-medium text-card-foreground mb-2 block">
                Notes
              </Label>
              <textarea
                id="ticketNotes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Enter additional notes"
                rows={4}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-card text-foreground"
              />
            </div>

            {/* Edit Mode Only - Status and Quality Score */}
            {ticketDialog.mode === 'edit' && (
              <>
                <div className="border-t pt-4 space-y-4">
                  <p className="text-sm font-medium text-muted-foreground">Edit Status & Quality Score</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ticketStatus" className="text-sm font-medium text-card-foreground mb-2 block">
                        Status
                      </Label>
                      <select
                        id="ticketStatus"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-card text-foreground"
                      >
                        <option value="Selected">Selected</option>
                        <option value="Graded">Graded</option>
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">Change ticket status if needed</p>
                    </div>

                    <div>
                      <Label htmlFor="ticketQuality" className="text-sm font-medium text-card-foreground mb-2 block">
                        Quality Score (%)
                      </Label>
                      <Input
                        id="ticketQuality"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.qualityScorePercent}
                        onChange={(e) => setFormData({ ...formData, qualityScorePercent: e.target.value })}
                        placeholder="Enter quality score (0-100)"
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Update or set quality score</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Label htmlFor="ticketFeedback" className="text-sm font-medium text-card-foreground mb-2 block flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                    Feedback (AI Training)
                  </Label>
                  <textarea
                    id="ticketFeedback"
                    value={formData.feedback}
                    onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                    placeholder="Enter feedback for this ticket (optional)..."
                    rows={4}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none bg-card text-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 This feedback will be used to train AI models for future ticket suggestions
                  </p>
                </div>
              </>
            )}

            <DialogFooter className="flex items-center gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setTicketDialog({ open: false, mode: 'create', data: null })}
                className="px-4 py-2 text-card-foreground border border-input rounded-lg hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {ticketDialog.mode === 'create' ? 'Create Ticket' : 'Save Changes'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // Grade Dialog Component
  const GradeDialogComponent = () => {
    const [qualityScore, setQualityScore] = useState('');

    useEffect(() => {
      if (gradeDialog.ticket) {
        setQualityScore(gradeDialog.ticket.qualityScorePercent || '');
      }
    }, [gradeDialog.ticket]);

    const handleSubmit = (e) => {
      e.preventDefault();
      if (gradeDialog.ticket) {
        handleGradeTicket(gradeDialog.ticket._id, parseFloat(qualityScore));
      }
    };

    return (
      <Dialog open={gradeDialog.open} onOpenChange={(open) => !open && setGradeDialog({ open: false, ticket: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">Grade Ticket</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {gradeDialog.ticket?.ticketId}
                </p>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="py-4 space-y-4">
              <div>
                <Label htmlFor="qualityScore" className="text-sm font-medium text-card-foreground mb-2 block">
                  Quality Score (%) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="qualityScore"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={qualityScore}
                  onChange={(e) => setQualityScore(e.target.value)}
                  placeholder="Enter quality score (0-100)"
                  required
                  className="w-full"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-2">
                  This will change the ticket status to "Graded"
                </p>
              </div>

              {gradeDialog.ticket?.notes && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Notes:</p>
                  <p className="text-sm text-foreground">{gradeDialog.ticket.notes}</p>
                </div>
              )}
            </div>
            <DialogFooter className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setGradeDialog({ open: false, ticket: null })}
                className="px-4 py-2 text-card-foreground border border-input rounded-lg hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Grade Ticket
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // Feedback Dialog Component
  const FeedbackDialogComponent = () => {
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
      if (feedbackDialog.ticket) {
        setFeedback(feedbackDialog.ticket.feedback || '');
      }
    }, [feedbackDialog.ticket]);

    const handleSubmit = (e) => {
      e.preventDefault();
      if (feedbackDialog.ticket) {
        handleUpdateFeedback(feedbackDialog.ticket._id, feedback);
      }
    };

    return (
      <Dialog open={feedbackDialog.open} onOpenChange={(open) => !open && setFeedbackDialog({ open: false, ticket: null })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">Ticket Feedback</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {feedbackDialog.ticket?.ticketId}
                </p>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="py-4 space-y-4">
              <div>
                <Label htmlFor="feedback" className="text-sm font-medium text-card-foreground mb-2 block">
                  Feedback
                </Label>
                <textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Enter feedback for this ticket... (This will be used for AI training)"
                  rows={8}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none bg-card text-foreground"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-2">
                  💡 This feedback will be used to train AI models for future ticket suggestions
                </p>
              </div>

              {feedbackDialog.ticket?.notes && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Ticket Notes:</p>
                  <p className="text-sm text-foreground">{feedbackDialog.ticket.notes}</p>
                </div>
              )}
            </div>
            <DialogFooter className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFeedbackDialog({ open: false, ticket: null })}
                className="px-4 py-2 text-card-foreground border border-input rounded-lg hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Save Feedback
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // Delete Confirmation Dialog
  const DeleteDialogComponent = () => (
    <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, type: null, id: null, name: '' })}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Delete {deleteDialog.type === 'agent' ? 'Agent' : 'Ticket'}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">This action cannot be undone</p>
            </div>
          </div>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-card-foreground">
            Are you sure you want to permanently delete{' '}
            <span className="font-semibold">{deleteDialog.name}</span>?
            {deleteDialog.type === 'agent' && (
              <span className="block mt-2 text-red-600">
                Warning: All tickets associated with this agent will remain but show as "Unknown Agent".
              </span>
            )}
          </p>
        </div>
        <DialogFooter className="flex items-center gap-3">
          <button
            onClick={() => setDeleteDialog({ open: false, type: null, id: null, name: '' })}
            className="px-4 py-2 text-card-foreground border border-input rounded-lg hover:bg-muted/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (deleteDialog.type === 'agent') {
                handleDeleteAgent(deleteDialog.id);
              } else {
                handleDeleteTicket(deleteDialog.id);
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete {deleteDialog.type === 'agent' ? 'Agent' : 'Ticket'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">QA Evaluation Manager</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track quality assurance metrics and agent performance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm bg-card">
              {user?.name}
            </Badge>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 bg-card border shadow-sm">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Dashboard
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="agents"
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Agents
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="tickets"
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Tickets
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="archive"
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
            >
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4" />
                Archive
              </div>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="dashboard" className="m-0">
              {renderDashboard()}
            </TabsContent>
            <TabsContent value="agents" className="m-0">
              {renderAgents()}
            </TabsContent>
            <TabsContent value="tickets" className="m-0">
              {renderTickets()}
            </TabsContent>
            <TabsContent value="archive" className="m-0">
              {renderArchive()}
            </TabsContent>
          </div>
        </Tabs>

        {/* Dialogs */}
        <AgentDialogComponent />
        <TicketDialogComponent />
        <GradeDialogComponent />
        <FeedbackDialogComponent />
        <DeleteDialogComponent />
      </div>
    </div>
  );
};

export default QAManager;
