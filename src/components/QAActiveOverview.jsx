import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Users, ChevronDown, ChevronRight, Ticket, Archive,
  RefreshCw, Eye, UserPlus, CheckSquare, Square, Search,
  AlertCircle, Loader2, X, TrendingUp, Clock, CheckCircle,
  User, ArrowRight, ArrowLeftRight, Plane, Calendar,
  BarChart3, AlertTriangle, History, Settings, Copy,
  GripVertical, Plus, Minus, Save, RotateCcw, Upload, FileSpreadsheet, Check, Pencil, Play
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { toast } from 'sonner';

// Sub-tab components
const SubTabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'agents', label: 'Agent Management', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'week-setup', label: 'Week Setup', icon: Calendar }
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl mb-6">
      {tabs.map(tab => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-neutral-900 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

const QAActiveOverview = () => {
  const { user } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL;

  // Main state
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({
    globalStats: { totalTickets: 0, totalGraded: 0, totalSelected: 0, totalGraders: 0, avgScore: 0 },
    graders: [],
    qaGraderList: []
  });

  // Analytics state
  const [velocityData, setVelocityData] = useState(null);
  const [scoreComparison, setScoreComparison] = useState(null);
  const [staleTickets, setStaleTickets] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Grade clicks state
  const [gradeClicksData, setGradeClicksData] = useState(null);

  // Week setup state
  const [weekSetup, setWeekSetup] = useState(null);
  const [weekSetupLoading, setWeekSetupLoading] = useState(false);
  const [weekSetupChanges, setWeekSetupChanges] = useState({});

  // Agent history state
  const [agentHistory, setAgentHistory] = useState(null);
  const [agentHistoryLoading, setAgentHistoryLoading] = useState(false);

  // UI state
  const [expandedGraders, setExpandedGraders] = useState({});
  const [expandedAgents, setExpandedAgents] = useState({});
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '', grader: '' });

  // Dialog states
  const [viewTicketDialog, setViewTicketDialog] = useState({ open: false, ticket: null });
  const [reassignDialog, setReassignDialog] = useState({ open: false, ticketIds: [], single: false });
  const [reassignAgentDialog, setReassignAgentDialog] = useState({ open: false, agent: null, fromGrader: null });
  const [swapAgentsDialog, setSwapAgentsDialog] = useState({ open: false, agent1: null, grader1: null });
  const [vacationDialog, setVacationDialog] = useState({ open: false, grader: null });
  const [agentHistoryDialog, setAgentHistoryDialog] = useState({ open: false, agent: null });
  const [excelImportDialog, setExcelImportDialog] = useState({ open: false, data: null, loading: false });
  const [editAgentDialog, setEditAgentDialog] = useState({ open: false, agent: null });
  const [editAgentForm, setEditAgentForm] = useState({ name: '', maestroName: '', position: '', team: '' });
  const [selectedGrader, setSelectedGrader] = useState('');
  const [selectedAgent2, setSelectedAgent2] = useState(null);
  const [selectedGrader2, setSelectedGrader2] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Auth headers
  const getAuthHeaders = useCallback(() => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  }), []);

  // Check if user is admin
  const isAdmin = ['filipkozomara@mebit.io', 'nevena@mebit.io'].includes(user?.email);

  // Fetch main data
  const fetchData = useCallback(async (showRefreshing = false) => {
    if (!isAdmin) return;

    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [response, gradeClicksRes] = await Promise.all([
        axios.get(`${API_URL}/api/qa/active-overview`, getAuthHeaders()),
        axios.get(`${API_URL}/api/qa/grade-clicks/weekly`, getAuthHeaders()).catch(() => ({ data: null }))
      ]);

      setData(response.data);
      setGradeClicksData(gradeClicksRes.data);

      // Auto-expand all graders on first load
      if (!showRefreshing && response.data.graders) {
        const expanded = {};
        response.data.graders.forEach(g => {
          if (g.grader?._id) {
            expanded[g.grader._id] = true;
          }
        });
        setExpandedGraders(expanded);
      }
    } catch (err) {
      console.error('Error fetching active overview:', err);
      toast.error('Failed to load active overview');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [API_URL, getAuthHeaders, isAdmin]);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    if (!isAdmin) return;

    try {
      setAnalyticsLoading(true);

      const [velocityRes, scoreRes, staleRes] = await Promise.all([
        axios.get(`${API_URL}/api/qa/active-overview/velocity?days=14`, getAuthHeaders()),
        axios.get(`${API_URL}/api/qa/active-overview/score-comparison?weeks=4`, getAuthHeaders()),
        axios.get(`${API_URL}/api/qa/active-overview/stale-tickets?days=5`, getAuthHeaders())
      ]);

      setVelocityData(velocityRes.data);
      setScoreComparison(scoreRes.data);
      setStaleTickets(staleRes.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      toast.error('Failed to load analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  }, [API_URL, getAuthHeaders, isAdmin]);

  // Fetch week setup data
  const fetchWeekSetup = useCallback(async () => {
    if (!isAdmin) return;

    try {
      setWeekSetupLoading(true);

      const response = await axios.get(
        `${API_URL}/api/qa/active-overview/week-setup`,
        getAuthHeaders()
      );

      setWeekSetup(response.data);
      setWeekSetupChanges({});
    } catch (err) {
      console.error('Error fetching week setup:', err);
      toast.error('Failed to load week setup');
    } finally {
      setWeekSetupLoading(false);
    }
  }, [API_URL, getAuthHeaders, isAdmin]);

  // Fetch agent history
  const fetchAgentHistory = async (agentId) => {
    try {
      setAgentHistoryLoading(true);

      const response = await axios.get(
        `${API_URL}/api/qa/active-overview/agent-history/${agentId}`,
        getAuthHeaders()
      );

      setAgentHistory(response.data);
    } catch (err) {
      console.error('Error fetching agent history:', err);
      toast.error('Failed to load agent history');
    } finally {
      setAgentHistoryLoading(false);
    }
  };

  // Open edit agent dialog
  const openEditAgentDialog = (agent) => {
    setEditAgentForm({
      name: agent.agentName || agent.name || '',
      maestroName: agent.maestroName || '',
      position: agent.agentPosition || agent.position || '',
      team: agent.agentTeam || agent.team || ''
    });
    setEditAgentDialog({ open: true, agent });
  };

  // Save edited agent
  const handleSaveAgent = async () => {
    const agent = editAgentDialog.agent;
    const agentId = agent.agentId || agent._id;

    if (!agentId) {
      toast.error('Agent ID not found');
      return;
    }

    try {
      setActionLoading(true);
      await axios.put(
        `${API_URL}/api/qa/agents/${agentId}`,
        {
          name: editAgentForm.name,
          maestroName: editAgentForm.maestroName,
          position: editAgentForm.position,
          team: editAgentForm.team
        },
        getAuthHeaders()
      );
      toast.success('Agent updated successfully');
      setEditAgentDialog({ open: false, agent: null });
      fetchData(true); // Refresh data
      if (activeSubTab === 'week-setup') {
        fetchWeekSetup();
      }
    } catch (err) {
      console.error('Error updating agent:', err);
      toast.error(err.response?.data?.message || 'Failed to update agent');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeSubTab === 'analytics') {
      fetchAnalytics();
    } else if (activeSubTab === 'week-setup') {
      fetchWeekSetup();
    }
  }, [activeSubTab, fetchAnalytics, fetchWeekSetup]);

  // Toggle functions
  const toggleGrader = (graderId) => {
    setExpandedGraders(prev => ({ ...prev, [graderId]: !prev[graderId] }));
  };

  const toggleAgent = (graderId, agentId) => {
    const key = `${graderId}-${agentId}`;
    setExpandedAgents(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Selection functions
  const toggleTicketSelection = (ticketId) => {
    setSelectedTickets(prev =>
      prev.includes(ticketId)
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const selectAllForGrader = (grader) => {
    const allTicketIds = grader.agents.flatMap(a => a.tickets.map(t => t._id));
    setSelectedTickets(prev => {
      const allSelected = allTicketIds.every(id => prev.includes(id));
      return allSelected
        ? prev.filter(id => !allTicketIds.includes(id))
        : [...new Set([...prev, ...allTicketIds])];
    });
  };

  const selectAllForAgent = (agent) => {
    const ticketIds = agent.tickets.map(t => t._id);
    setSelectedTickets(prev => {
      const allSelected = ticketIds.every(id => prev.includes(id));
      return allSelected
        ? prev.filter(id => !ticketIds.includes(id))
        : [...new Set([...prev, ...ticketIds])];
    });
  };

  // Action handlers
  const handleReassign = async () => {
    if (!selectedGrader) {
      toast.error('Please select a grader');
      return;
    }

    try {
      setActionLoading(true);

      if (reassignDialog.single && reassignDialog.ticketIds.length === 1) {
        await axios.put(
          `${API_URL}/api/qa/tickets/${reassignDialog.ticketIds[0]}/reassign`,
          { newGraderId: selectedGrader },
          getAuthHeaders()
        );
        toast.success('Ticket reassigned successfully');
      } else {
        await axios.post(
          `${API_URL}/api/qa/tickets/bulk-reassign`,
          { ticketIds: reassignDialog.ticketIds, newGraderId: selectedGrader },
          getAuthHeaders()
        );
        toast.success(`${reassignDialog.ticketIds.length} tickets reassigned successfully`);
      }

      setReassignDialog({ open: false, ticketIds: [], single: false });
      setSelectedGrader('');
      setSelectedTickets([]);
      fetchData(true);
    } catch (err) {
      console.error('Error reassigning tickets:', err);
      toast.error(err.response?.data?.message || 'Failed to reassign tickets');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedTickets.length === 0) {
      toast.error('No tickets selected');
      return;
    }

    try {
      setActionLoading(true);

      await axios.post(
        `${API_URL}/api/qa/active-overview/bulk-archive`,
        { ticketIds: selectedTickets },
        getAuthHeaders()
      );

      toast.success(`${selectedTickets.length} tickets archived successfully`);
      setSelectedTickets([]);
      fetchData(true);
    } catch (err) {
      console.error('Error archiving tickets:', err);
      toast.error(err.response?.data?.message || 'Failed to archive tickets');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReassignAgent = async () => {
    if (!selectedGrader) {
      toast.error('Please select a grader');
      return;
    }

    try {
      setActionLoading(true);

      await axios.post(
        `${API_URL}/api/qa/active-overview/reassign-agent`,
        {
          agentId: reassignAgentDialog.agent._id,
          fromGraderId: reassignAgentDialog.fromGrader._id,
          toGraderId: selectedGrader,
          moveTickets: true
        },
        getAuthHeaders()
      );

      toast.success(`Agent ${reassignAgentDialog.agent.agentName} reassigned successfully`);
      setReassignAgentDialog({ open: false, agent: null, fromGrader: null });
      setSelectedGrader('');
      fetchData(true);
    } catch (err) {
      console.error('Error reassigning agent:', err);
      toast.error(err.response?.data?.message || 'Failed to reassign agent');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSwapAgents = async () => {
    if (!selectedAgent2 || !selectedGrader2) {
      toast.error('Please select an agent and grader to swap with');
      return;
    }

    try {
      setActionLoading(true);

      await axios.post(
        `${API_URL}/api/qa/active-overview/swap-agents`,
        {
          agent1Id: swapAgentsDialog.agent1.agentId,
          grader1Id: swapAgentsDialog.grader1._id,
          agent2Id: selectedAgent2,
          grader2Id: selectedGrader2,
          moveTickets: true
        },
        getAuthHeaders()
      );

      toast.success('Agents swapped successfully');
      setSwapAgentsDialog({ open: false, agent1: null, grader1: null });
      setSelectedAgent2(null);
      setSelectedGrader2('');
      fetchData(true);
    } catch (err) {
      console.error('Error swapping agents:', err);
      toast.error(err.response?.data?.message || 'Failed to swap agents');
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchiveForGrader = async (graderId) => {
    if (!window.confirm('Are you sure you want to archive ALL tickets for this grader?')) {
      return;
    }

    try {
      setActionLoading(true);

      const response = await axios.post(
        `${API_URL}/api/qa/active-overview/archive-grader-tickets`,
        { graderId },
        getAuthHeaders()
      );

      toast.success(response.data.message);
      fetchData(true);
    } catch (err) {
      console.error('Error archiving grader tickets:', err);
      toast.error(err.response?.data?.message || 'Failed to archive tickets');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVacationMode = async () => {
    try {
      setActionLoading(true);

      const response = await axios.post(
        `${API_URL}/api/qa/active-overview/vacation-mode`,
        { graderId: vacationDialog.grader._id, archiveTickets: true },
        getAuthHeaders()
      );

      toast.success(response.data.message);
      setVacationDialog({ open: false, grader: null });
      fetchData(true);
    } catch (err) {
      console.error('Error activating vacation mode:', err);
      toast.error(err.response?.data?.message || 'Failed to activate vacation mode');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveWeekSetup = async () => {
    try {
      setActionLoading(true);

      // Build assignments array from current setup + changes
      const assignments = weekSetup.setup.map(s => {
        const changes = weekSetupChanges[s.grader._id] || { add: [], remove: [] };
        let agentIds = s.agents.map(a => a._id);

        // Apply changes
        agentIds = agentIds.filter(id => !changes.remove.includes(id));
        agentIds = [...new Set([...agentIds, ...changes.add])];

        return { graderId: s.grader._id, agentIds };
      });

      await axios.post(
        `${API_URL}/api/qa/active-overview/week-setup`,
        { assignments },
        getAuthHeaders()
      );

      toast.success('Week setup saved successfully');
      fetchWeekSetup();
      fetchData(true);
    } catch (err) {
      console.error('Error saving week setup:', err);
      toast.error(err.response?.data?.message || 'Failed to save week setup');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyLastWeek = async () => {
    try {
      setActionLoading(true);

      const response = await axios.post(
        `${API_URL}/api/qa/active-overview/copy-last-week`,
        {},
        getAuthHeaders()
      );

      // Apply last week's setup as changes
      const changes = {};
      response.data.setup.forEach(s => {
        const currentSetup = weekSetup?.setup?.find(ws => ws.grader._id === s.grader._id);
        const currentAgentIds = currentSetup?.agents?.map(a => a._id) || [];
        const lastWeekAgentIds = s.agents.map(a => a._id);

        changes[s.grader._id] = {
          add: lastWeekAgentIds.filter(id => !currentAgentIds.includes(id)),
          remove: currentAgentIds.filter(id => !lastWeekAgentIds.includes(id))
        };
      });

      setWeekSetupChanges(changes);
      toast.success('Last week setup loaded. Click Save to apply.');
    } catch (err) {
      console.error('Error copying last week:', err);
      toast.error(err.response?.data?.message || 'Failed to copy last week');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExcelUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setExcelImportDialog({ open: true, data: null, loading: true });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_URL}/api/qa/active-overview/import-excel`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setExcelImportDialog({ open: true, data: response.data, loading: false });
    } catch (err) {
      console.error('Error parsing Excel:', err);
      toast.error(err.response?.data?.message || 'Failed to parse Excel file');
      setExcelImportDialog({ open: false, data: null, loading: false });
    }

    // Reset the file input
    event.target.value = '';
  };

  const handleApplyExcelImport = () => {
    if (!excelImportDialog.data?.matchedAgents?.length) {
      toast.error('No matched agents to import');
      return;
    }

    // Find current user's grader setup
    const currentUserSetup = weekSetup?.setup?.find(s => s.grader._id === user._id || s.grader.email === user.email);

    if (!currentUserSetup) {
      toast.error('Cannot find your grader setup');
      return;
    }

    // Get matched agent IDs
    const importedAgentIds = excelImportDialog.data.matchedAgents.map(m => m.dbAgent._id);

    // Current agents for this grader
    const currentAgentIds = currentUserSetup.agents.map(a => a._id);

    // Determine which agents to add and remove
    const toAdd = importedAgentIds.filter(id => !currentAgentIds.includes(id));
    const toRemove = currentAgentIds.filter(id => !importedAgentIds.includes(id));

    // Apply changes
    setWeekSetupChanges(prev => ({
      ...prev,
      [currentUserSetup.grader._id]: {
        add: toAdd,
        remove: toRemove
      }
    }));

    toast.success(`Imported ${excelImportDialog.data.matchedAgents.length} agents from Excel. Click Save to apply.`);
    setExcelImportDialog({ open: false, data: null, loading: false });
  };

  // Helper functions
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getScoreColor = (score) => {
    if (score === null || score === undefined) return 'text-neutral-400';
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStatusBadge = (status) => {
    if (status === 'Graded') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle className="w-3 h-3" />
          Graded
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        <Clock className="w-3 h-3" />
        Selected
      </span>
    );
  };

  // Filter data
  const getFilteredData = () => {
    if (!data.graders || data.graders.length === 0) return [];

    return data.graders
      .filter(g => g.grader && g.grader._id)
      .filter(g => !filters.grader || g.grader._id === filters.grader)
      .map(graderData => {
        const filteredAgents = graderData.agents
          .filter(agent => agent.agentId)
          .map(agent => {
            const filteredTickets = agent.tickets.filter(ticket => {
              if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const matchesSearch =
                  ticket.ticketId?.toLowerCase().includes(searchLower) ||
                  ticket.shortDescription?.toLowerCase().includes(searchLower) ||
                  agent.agentName?.toLowerCase().includes(searchLower);
                if (!matchesSearch) return false;
              }
              if (filters.status && ticket.status !== filters.status) return false;
              return true;
            });

            return {
              ...agent,
              tickets: filteredTickets,
              filteredStats: {
                total: filteredTickets.length,
                graded: filteredTickets.filter(t => t.status === 'Graded').length,
                selected: filteredTickets.filter(t => t.status === 'Selected').length
              }
            };
          });

        return {
          ...graderData,
          agents: filteredAgents
        };
      });
  };

  const filteredGraders = getFilteredData();

  // Calculate totals
  const totalAgents = data.graders?.reduce((sum, g) => sum + (g.stats?.agentCount || 0), 0) || 0;

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        <span className="ml-2 text-neutral-500">Loading overview...</span>
      </div>
    );
  }

  // Access denied
  if (!isAdmin) {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-8">
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Access Denied</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Only admins can access the Active Overview page.
          </p>
        </div>
      </div>
    );
  }

  // Render Overview Tab
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Ticket className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{data.globalStats?.totalTickets || 0}</p>
              <p className="text-xs text-neutral-500">Total Active</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{data.globalStats?.totalGraded || 0}</p>
              <p className="text-xs text-neutral-500">Graded</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{data.globalStats?.totalSelected || 0}</p>
              <p className="text-xs text-neutral-500">Pending</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{data.globalStats?.totalGraders || 0}</p>
              <p className="text-xs text-neutral-500">Active Graders</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{data.globalStats?.avgScore || 0}%</p>
              <p className="text-xs text-neutral-500">Avg Score</p>
            </div>
          </div>
        </div>
      </div>

      {/* Workload Balance */}
      {data.graders && data.graders.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" />
            Workload Balance (by number of agents)
          </h3>
          <div className="space-y-3">
            {(() => {
              const maxAgents = Math.max(...data.graders.map(g => g.stats?.agentCount || 0), 1);
              const avgAgents = totalAgents / data.graders.length;

              return data.graders.map((graderData, index) => {
                const agentCount = graderData.stats?.agentCount || 0;
                const percentage = (agentCount / maxAgents) * 100;
                const isOverloaded = agentCount > avgAgents * 1.3;
                const isUnderloaded = agentCount < avgAgents * 0.7 && agentCount > 0;

                return (
                  <div key={graderData.grader?._id || `grader-${index}`} className="flex items-center gap-3">
                    <div className="w-28 flex-shrink-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                        {graderData.grader?.name?.split(' ')[0] || 'Unknown'}
                      </p>
                    </div>
                    <div className="flex-1 h-6 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOverloaded ? 'bg-red-500' : isUnderloaded ? 'bg-amber-500' : 'bg-purple-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        {agentCount} agent{agentCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {isOverloaded && <span className="text-xs text-red-500 flex-shrink-0">High</span>}
                    {isUnderloaded && <span className="text-xs text-amber-500 flex-shrink-0">Low</span>}
                  </div>
                );
              });
            })()}
          </div>
          <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between text-xs text-neutral-500">
            <span>Average: {(totalAgents / data.graders.length).toFixed(1)} agents per grader</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-purple-500" />Balanced</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500" />High</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-amber-500" />Low</span>
            </div>
          </div>
        </div>
      )}

      {/* Progress by Grader */}
      {data.graders && data.graders.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-green-500" />
            Grading Progress This Week
          </h3>
          <div className="space-y-3">
            {data.graders.map((graderData, index) => {
              const total = graderData.stats?.total || 0;
              const graded = graderData.stats?.graded || 0;
              const progress = total > 0 ? Math.round((graded / total) * 100) : 0;

              return (
                <div key={graderData.grader?._id || `grader-${index}`} className="flex items-center gap-3">
                  <div className="w-28 flex-shrink-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                      {graderData.grader?.name?.split(' ')[0] || 'Unknown'}
                    </p>
                  </div>
                  <div className="flex-1 h-6 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-neutral-700 dark:text-neutral-300">
                      {graded}/{total} ({progress}%)
                    </span>
                  </div>
                  {progress === 100 && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grade Button Usage This Week */}
      {data.graders && data.graders.length > 0 && gradeClicksData && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
            <Play className="w-4 h-4 text-blue-500" />
            Grade Button Usage This Week
            <span className="text-xs font-normal text-neutral-500 ml-2">
              ({gradeClicksData.weekStart} - {gradeClicksData.weekEnd})
            </span>
          </h3>
          <div className="space-y-3">
            {(() => {
              const counts = gradeClicksData.counts || {};
              const maxClicks = Math.max(...Object.values(counts), 1);

              return data.graders.map((graderData, index) => {
                const graderId = graderData.grader?._id;
                const clickCount = counts[graderId] || 0;
                const percentage = (clickCount / maxClicks) * 100;

                return (
                  <div key={graderId || `grader-${index}`} className="flex items-center gap-3">
                    <div className="w-28 flex-shrink-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                        {graderData.grader?.name?.split(' ')[0] || 'Unknown'}
                      </p>
                    </div>
                    <div className="flex-1 h-6 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        {clickCount} click{clickCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
          <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700 text-xs text-neutral-500">
            Total: {Object.values(gradeClicksData.counts || {}).reduce((sum, c) => sum + c, 0)} grade button clicks this week
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full pl-10 pr-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          className="px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">All Statuses</option>
          <option value="Selected">Selected</option>
          <option value="Graded">Graded</option>
        </select>

        <select
          value={filters.grader}
          onChange={(e) => setFilters(prev => ({ ...prev, grader: e.target.value }))}
          className="px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">All Graders</option>
          {(data.qaGraderList || []).map(grader => (
            <option key={grader._id} value={grader._id}>{grader.name}</option>
          ))}
        </select>

        {(filters.search || filters.status || filters.grader) && (
          <button
            onClick={() => setFilters({ search: '', status: '', grader: '' })}
            className="p-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex-1" />

        {selectedTickets.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">{selectedTickets.length} selected</span>
            <button
              onClick={() => setReassignDialog({ open: true, ticketIds: selectedTickets, single: false })}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
            >
              <UserPlus className="w-4 h-4" />Reassign
            </button>
            <button
              onClick={handleBulkArchive}
              disabled={actionLoading}
              className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 disabled:opacity-50"
            >
              <Archive className="w-4 h-4" />Archive
            </button>
            <button onClick={() => setSelectedTickets([])} className="p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Graders List */}
      <div className="space-y-4">
        {filteredGraders.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-8 text-center">
            <Ticket className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">No active data</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {filters.search || filters.status || filters.grader
                ? 'Try adjusting your filters'
                : 'No QA graders have active agents assigned'}
            </p>
          </div>
        ) : (
          filteredGraders.map((graderData, graderIndex) => {
            const graderId = graderData.grader?._id || `grader-${graderIndex}`;
            const isExpanded = expandedGraders[graderId];
            const allTicketIds = graderData.agents.flatMap(a => a.tickets.map(t => t._id));
            const allSelected = allTicketIds.length > 0 && allTicketIds.every(id => selectedTickets.includes(id));
            const someSelected = allTicketIds.some(id => selectedTickets.includes(id));

            return (
              <div key={graderId} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
                {/* Grader Header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
                  onClick={() => toggleGrader(graderId)}
                >
                  <button onClick={(e) => { e.stopPropagation(); selectAllForGrader(graderData); }} className="p-0.5">
                    {allSelected ? <CheckSquare className="w-5 h-5 text-purple-600" />
                      : someSelected ? <div className="w-5 h-5 border-2 border-purple-600 rounded bg-purple-100 dark:bg-purple-900/30" />
                      : <Square className="w-5 h-5 text-neutral-400" />}
                  </button>

                  {isExpanded ? <ChevronDown className="w-5 h-5 text-neutral-400" /> : <ChevronRight className="w-5 h-5 text-neutral-400" />}

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-white">{graderData.grader?.name || 'Unknown'}</h3>
                      <p className="text-xs text-neutral-500">{graderData.grader?.email || ''}</p>
                    </div>
                  </div>

                  <div className="flex-1" />

                  {/* Quick Actions */}
                  <div className="flex items-center gap-1 mr-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleArchiveForGrader(graderData.grader._id); }}
                      className="p-1.5 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg"
                      title="Archive all tickets"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setVacationDialog({ open: true, grader: graderData.grader }); }}
                      className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg"
                      title="Vacation mode"
                    >
                      <Plane className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Grader Stats */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-semibold text-neutral-900 dark:text-white">{graderData.stats?.total || 0}</p>
                      <p className="text-xs text-neutral-500">Tickets</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-green-600 dark:text-green-400">{graderData.stats?.graded || 0}</p>
                      <p className="text-xs text-neutral-500">Graded</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-amber-600 dark:text-amber-400">{graderData.stats?.selected || 0}</p>
                      <p className="text-xs text-neutral-500">Pending</p>
                    </div>
                    <div className="text-center">
                      <p className={`font-semibold ${getScoreColor(graderData.stats?.avgScore)}`}>{graderData.stats?.avgScore || '-'}%</p>
                      <p className="text-xs text-neutral-500">Avg Score</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-neutral-900 dark:text-white">{graderData.stats?.agentCount || 0}</p>
                      <p className="text-xs text-neutral-500">Agents</p>
                    </div>
                  </div>
                </div>

                {/* Agents List */}
                {isExpanded && (
                  <div className="p-4 space-y-3">
                    {graderData.agents.length === 0 ? (
                      <p className="text-sm text-neutral-500 text-center py-4">No active agents</p>
                    ) : (
                      graderData.agents.map((agent, agentIndex) => {
                        const agentKey = `${graderId}-${agent.agentId || `agent-${agentIndex}`}`;
                        const isAgentExpanded = expandedAgents[agentKey];
                        const agentTicketIds = agent.tickets.map(t => t._id);
                        const allAgentSelected = agentTicketIds.length > 0 && agentTicketIds.every(id => selectedTickets.includes(id));
                        const someAgentSelected = agentTicketIds.some(id => selectedTickets.includes(id));

                        return (
                          <div key={agentKey} className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
                            {/* Agent Header */}
                            <div
                              className="flex items-center gap-3 px-3 py-2 bg-neutral-50 dark:bg-neutral-800/50 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                              onClick={() => toggleAgent(graderId, agent.agentId || `agent-${agentIndex}`)}
                            >
                              <button onClick={(e) => { e.stopPropagation(); selectAllForAgent(agent); }} className="p-0.5" disabled={agent.tickets.length === 0}>
                                {allAgentSelected ? <CheckSquare className="w-4 h-4 text-purple-600" />
                                  : someAgentSelected ? <div className="w-4 h-4 border-2 border-purple-600 rounded bg-purple-100 dark:bg-purple-900/30" />
                                  : <Square className={`w-4 h-4 ${agent.tickets.length === 0 ? 'text-neutral-300' : 'text-neutral-400'}`} />}
                              </button>

                              {isAgentExpanded ? <ChevronDown className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}

                              <span className="font-medium text-neutral-900 dark:text-white">{agent.agentName || 'Unknown Agent'}</span>
                              {agent.agentTeam && (
                                <span className="text-xs text-neutral-500 bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 rounded">{agent.agentTeam}</span>
                              )}

                              <div className="flex-1" />

                              {/* Agent Quick Actions */}
                              <div className="flex items-center gap-1 mr-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setReassignAgentDialog({ open: true, agent, fromGrader: graderData.grader }); }}
                                  className="p-1 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded"
                                  title="Reassign agent"
                                >
                                  <UserPlus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSwapAgentsDialog({ open: true, agent1: agent, grader1: graderData.grader }); }}
                                  className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                                  title="Swap with another agent"
                                >
                                  <ArrowLeftRight className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAgentHistoryDialog({ open: true, agent });
                                    fetchAgentHistory(agent.agentId);
                                  }}
                                  className="p-1 text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded"
                                  title="View history"
                                >
                                  <History className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); openEditAgentDialog(agent); }}
                                  className="p-1 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded"
                                  title="Edit agent"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="flex items-center gap-4 text-xs">
                                <span className="text-neutral-600 dark:text-neutral-400"><strong>{agent.tickets.length}</strong> tickets</span>
                                <span className="text-green-600 dark:text-green-400"><strong>{agent.filteredStats?.graded || agent.stats?.graded || 0}</strong> graded</span>
                                <span className={getScoreColor(agent.stats?.avgScore)}><strong>{agent.stats?.avgScore || '-'}%</strong> avg</span>
                              </div>
                            </div>

                            {/* Tickets Table */}
                            {isAgentExpanded && (
                              <div>
                                {agent.tickets.length === 0 ? (
                                  <p className="text-sm text-neutral-500 text-center py-4">No tickets for this agent</p>
                                ) : (
                                  <table className="w-full text-sm">
                                    <thead className="bg-neutral-100 dark:bg-neutral-800">
                                      <tr>
                                        <th className="w-10 px-3 py-2"></th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase">ID</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Description</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Date</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Score</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium text-neutral-500 uppercase">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                      {agent.tickets.map((ticket, ticketIndex) => {
                                        const isSelected = selectedTickets.includes(ticket._id);
                                        return (
                                          <tr key={ticket._id || `ticket-${ticketIndex}`} className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${isSelected ? 'bg-purple-50 dark:bg-purple-900/10' : ''}`}>
                                            <td className="px-3 py-2">
                                              <button onClick={() => toggleTicketSelection(ticket._id)} className="p-0.5">
                                                {isSelected ? <CheckSquare className="w-4 h-4 text-purple-600" /> : <Square className="w-4 h-4 text-neutral-400" />}
                                              </button>
                                            </td>
                                            <td className="px-3 py-2 font-mono text-xs text-neutral-600 dark:text-neutral-400">{ticket.ticketId || '-'}</td>
                                            <td className="px-3 py-2 text-neutral-900 dark:text-white max-w-xs truncate">{ticket.shortDescription || '-'}</td>
                                            <td className="px-3 py-2 text-neutral-500 text-xs">{formatDate(ticket.dateEntered)}</td>
                                            <td className="px-3 py-2">{getStatusBadge(ticket.status)}</td>
                                            <td className="px-3 py-2">
                                              <span className={`font-semibold ${getScoreColor(ticket.qualityScorePercent)}`}>
                                                {ticket.qualityScorePercent !== null && ticket.qualityScorePercent !== undefined ? `${ticket.qualityScorePercent}%` : '-'}
                                              </span>
                                            </td>
                                            <td className="px-3 py-2">
                                              <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => setViewTicketDialog({ open: true, ticket })} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded" title="View">
                                                  <Eye className="w-4 h-4 text-neutral-500" />
                                                </button>
                                                <button onClick={() => setReassignDialog({ open: true, ticketIds: [ticket._id], single: true })} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded" title="Reassign">
                                                  <UserPlus className="w-4 h-4 text-purple-500" />
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  // Render Agent Management Tab
  const renderAgentManagementTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-500" />
          Agent Assignments
        </h3>
        <p className="text-sm text-neutral-500 mb-6">
          Drag agents between graders or use the action buttons to reassign, swap, or manage agents.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.graders?.map((graderData, index) => (
            <div key={graderData.grader?._id || `grader-${index}`} className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
              <div className="bg-neutral-50 dark:bg-neutral-800 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-neutral-900 dark:text-white">{graderData.grader?.name?.split(' ')[0]}</h4>
                    <p className="text-xs text-neutral-500">{graderData.stats?.agentCount || 0} agents</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setVacationDialog({ open: true, grader: graderData.grader })}
                    className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg"
                    title="Vacation mode"
                  >
                    <Plane className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-3 max-h-64 overflow-y-auto">
                {graderData.agents?.length === 0 ? (
                  <p className="text-sm text-neutral-400 text-center py-4">No agents assigned</p>
                ) : (
                  <div className="space-y-2">
                    {graderData.agents.map((agent, agentIndex) => (
                      <div
                        key={agent.agentId || `agent-${agentIndex}`}
                        className="flex items-center gap-2 p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg group"
                      >
                        <GripVertical className="w-4 h-4 text-neutral-300 cursor-grab" />
                        <span className="flex-1 text-sm text-neutral-900 dark:text-white truncate">{agent.agentName}</span>
                        <div className="hidden group-hover:flex items-center gap-1">
                          <button
                            onClick={() => setReassignAgentDialog({ open: true, agent, fromGrader: graderData.grader })}
                            className="p-1 text-purple-500 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded"
                            title="Reassign"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSwapAgentsDialog({ open: true, agent1: agent, grader1: graderData.grader })}
                            className="p-1 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                            title="Swap"
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditAgentDialog(agent)}
                            className="p-1 text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-xs text-neutral-400">{agent.tickets?.length || 0}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render Analytics Tab
  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      {analyticsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          <span className="ml-2 text-neutral-500">Loading analytics...</span>
        </div>
      ) : (
        <>
          {/* Grading Velocity */}
          {velocityData && (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Grading Velocity (Last {velocityData.period.days} Days)
              </h3>
              <div className="space-y-4">
                {velocityData.graders?.map((grader, index) => (
                  <div key={grader.grader?._id || `grader-${index}`} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-purple-500" />
                        <span className="font-medium text-neutral-900 dark:text-white">{grader.grader?.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-neutral-500">Total: <strong className="text-neutral-900 dark:text-white">{grader.stats?.totalGraded}</strong></span>
                        <span className="text-neutral-500">Avg/Day: <strong className="text-blue-600">{grader.stats?.avgPerDay}</strong></span>
                        <span className="text-neutral-500">Active Days: <strong className="text-green-600">{grader.stats?.activeDays}</strong></span>
                      </div>
                    </div>
                    <div className="flex items-end gap-1 h-16">
                      {grader.dailyData?.slice(-14).map((day, dayIndex) => {
                        const maxCount = Math.max(...grader.dailyData.map(d => d.count), 1);
                        const height = (day.count / maxCount) * 100;
                        return (
                          <div key={dayIndex} className="flex-1 flex flex-col items-center">
                            <div
                              className="w-full bg-blue-500 rounded-t transition-all duration-300"
                              style={{ height: `${height}%`, minHeight: day.count > 0 ? '4px' : '0' }}
                              title={`${day.date}: ${day.count} tickets`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Score Comparison */}
          {scoreComparison && (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                Score Comparison (Last {scoreComparison.period.weeks} Weeks)
              </h3>
              <p className="text-sm text-neutral-500 mb-4">
                Overall Average: <strong className="text-purple-600">{scoreComparison.overallAvg}%</strong>
              </p>
              <div className="space-y-3">
                {scoreComparison.comparison?.map((item, index) => {
                  const deviation = item.stats.avgScore - scoreComparison.overallAvg;
                  const isStrict = deviation < -5;
                  const isLenient = deviation > 5;

                  return (
                    <div key={item.grader?._id || `grader-${index}`} className="flex items-center gap-4">
                      <div className="w-28 flex-shrink-0">
                        <span className="text-sm font-medium text-neutral-900 dark:text-white">{item.grader?.name?.split(' ')[0]}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-4 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isStrict ? 'bg-red-500' : isLenient ? 'bg-green-500' : 'bg-purple-500'
                              }`}
                              style={{ width: `${item.stats.avgScore}%` }}
                            />
                          </div>
                          <span className={`text-sm font-semibold w-12 ${getScoreColor(item.stats.avgScore)}`}>
                            {item.stats.avgScore}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-500 w-32">
                        <span>{item.stats.ticketsGraded} graded</span>
                        {isStrict && <span className="text-red-500">(Strict)</span>}
                        {isLenient && <span className="text-green-500">(Lenient)</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stale Tickets Warning */}
          {staleTickets && staleTickets.totalStale > 0 && (
            <div className="bg-white dark:bg-neutral-900 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-400 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Stale Tickets Warning ({staleTickets.totalStale} tickets older than {staleTickets.threshold} days)
              </h3>
              <div className="space-y-4">
                {staleTickets.byGrader?.map((graderData, index) => (
                  <div key={graderData.grader?._id || `grader-${index}`} className="border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-neutral-900 dark:text-white">{graderData.grader?.name}</span>
                      <span className="text-sm text-amber-600">{graderData.tickets.length} stale tickets</span>
                    </div>
                    <div className="space-y-1">
                      {graderData.tickets.slice(0, 5).map((ticket, ticketIndex) => (
                        <div key={ticket._id || `ticket-${ticketIndex}`} className="flex items-center gap-2 text-sm">
                          <span className="font-mono text-neutral-500">{ticket.ticketId}</span>
                          <span className="text-neutral-600 dark:text-neutral-400 truncate flex-1">{ticket.agent?.name}</span>
                          <span className="text-amber-600">{ticket.daysOld} days old</span>
                        </div>
                      ))}
                      {graderData.tickets.length > 5 && (
                        <p className="text-xs text-neutral-500">...and {graderData.tickets.length - 5} more</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Searchable Agent Dropdown Component
  const SearchableAgentDropdown = ({ graderId, availableAgents, onAdd }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const buttonRef = React.useRef(null);
    const dropdownRef = React.useRef(null);

    // Calculate dropdown position when opening
    const updatePosition = useCallback(() => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const dropdownHeight = 250; // approximate max height

        // If not enough space below, show above
        const showAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

        setDropdownPosition({
          top: showAbove ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
          left: rect.left,
          width: rect.width
        });
      }
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
            buttonRef.current && !buttonRef.current.contains(event.target)) {
          setIsOpen(false);
          setSearchTerm('');
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Update position on scroll/resize
    useEffect(() => {
      if (isOpen) {
        updatePosition();
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        return () => {
          window.removeEventListener('scroll', updatePosition, true);
          window.removeEventListener('resize', updatePosition);
        };
      }
    }, [isOpen, updatePosition]);

    const filteredAgents = availableAgents?.filter(agent =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const handleSelect = (agent) => {
      onAdd(graderId, agent._id);
      setIsOpen(false);
      setSearchTerm('');
    };

    const handleOpen = () => {
      updatePosition();
      setIsOpen(!isOpen);
    };

    return (
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={handleOpen}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-xl text-neutral-500 hover:border-purple-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Agent</span>
        </button>

        {isOpen && (
          <div
            ref={dropdownRef}
            className="fixed z-[9999] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-2xl overflow-hidden"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              maxHeight: '250px'
            }}
          >
            {/* Search Input */}
            <div className="p-2 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 bg-white dark:bg-neutral-900">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search agents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Agent List */}
            <div className="max-h-48 overflow-y-auto">
              {filteredAgents.length === 0 ? (
                <div className="px-4 py-3 text-sm text-neutral-500 text-center">
                  {searchTerm ? 'No agents found' : 'No available agents'}
                </div>
              ) : (
                filteredAgents.map(agent => (
                  <button
                    key={agent._id}
                    onClick={() => handleSelect(agent)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-neutral-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{agent.name}</p>
                      {agent.team && <p className="text-xs text-neutral-500 truncate">{agent.team}</p>}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Week Setup Tab
  const renderWeekSetupTab = () => {
    const handleAddAgent = (graderId, agentId) => {
      setWeekSetupChanges(prev => ({
        ...prev,
        [graderId]: {
          add: [...(prev[graderId]?.add || []), agentId],
          remove: (prev[graderId]?.remove || [])
        }
      }));
    };

    const handleRemoveAgent = (graderId, agentId, isNew = false) => {
      if (isNew) {
        setWeekSetupChanges(prev => ({
          ...prev,
          [graderId]: {
            add: (prev[graderId]?.add || []).filter(id => id !== agentId),
            remove: (prev[graderId]?.remove || [])
          }
        }));
      } else {
        setWeekSetupChanges(prev => ({
          ...prev,
          [graderId]: {
            add: (prev[graderId]?.add || []),
            remove: [...(prev[graderId]?.remove || []), agentId]
          }
        }));
      }
    };

    // Get all agents that are currently assigned (to any grader) or being added
    const getAvailableAgentsForGrader = (graderId) => {
      const allAssignedIds = new Set();

      // Add all currently assigned agents
      weekSetup?.setup?.forEach(s => {
        const changes = weekSetupChanges[s.grader._id] || { add: [], remove: [] };
        s.agents.forEach(a => {
          if (!changes.remove.includes(a._id)) {
            allAssignedIds.add(a._id);
          }
        });
        changes.add.forEach(id => allAssignedIds.add(id));
      });

      // Return agents not assigned anywhere
      return weekSetup?.allAgents?.filter(a => !allAssignedIds.has(a._id)) || [];
    };

    return (
      <div className="space-y-6">
        {weekSetupLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
            <span className="ml-2 text-neutral-500">Loading week setup...</span>
          </div>
        ) : weekSetup ? (
          <>
            {/* Header Actions */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-500" />
                    Week Setup
                  </h3>
                  <p className="text-sm text-neutral-500 mt-1">Configure agent assignments for this week. Changes are saved only when you click "Save Changes".</p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Excel Import Button */}
                  <label className="flex items-center gap-2 px-4 py-2.5 text-sm border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors cursor-pointer">
                    <FileSpreadsheet className="w-4 h-4" />
                    Import Excel
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleExcelUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={handleCopyLastWeek}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Last Week
                  </button>
                  <button
                    onClick={() => { setWeekSetupChanges({}); fetchWeekSetup(); }}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                  <button
                    onClick={handleSaveWeekSetup}
                    disabled={actionLoading || Object.keys(weekSetupChanges).length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </button>
                </div>
              </div>

              {/* Changes indicator */}
              {Object.keys(weekSetupChanges).length > 0 && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-amber-700 dark:text-amber-400">You have unsaved changes</span>
                </div>
              )}
            </div>

            {/* Setup Grid - Larger Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {weekSetup.setup?.map((graderSetup, index) => {
                const changes = weekSetupChanges[graderSetup.grader._id] || { add: [], remove: [] };
                const currentAgents = graderSetup.agents.filter(a => !changes.remove.includes(a._id));
                const addedAgents = weekSetup.allAgents?.filter(a => changes.add.includes(a._id)) || [];
                const totalAgents = currentAgents.length + addedAgents.length;
                const hasChanges = changes.add.length > 0 || changes.remove.length > 0;

                return (
                  <div
                    key={graderSetup.grader?._id || `grader-${index}`}
                    className={`bg-white dark:bg-neutral-900 border-2 rounded-2xl overflow-hidden transition-all ${
                      hasChanges
                        ? 'border-purple-300 dark:border-purple-700 shadow-lg shadow-purple-100 dark:shadow-purple-900/20'
                        : 'border-neutral-200 dark:border-neutral-800'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                            <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-neutral-900 dark:text-white">{graderSetup.grader?.name}</h4>
                            <p className="text-xs text-neutral-500">{graderSetup.grader?.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-2xl font-bold ${totalAgents > 0 ? 'text-purple-600 dark:text-purple-400' : 'text-neutral-400'}`}>
                            {totalAgents}
                          </span>
                          <p className="text-xs text-neutral-500">agents</p>
                        </div>
                      </div>
                    </div>

                    {/* Card Body - Agent List */}
                    <div className="p-4">
                      <div className="space-y-2 mb-4 max-h-80 overflow-y-auto">
                        {/* Current agents */}
                        {currentAgents.map((agent, agentIndex) => (
                          <div
                            key={agent._id || `agent-${agentIndex}`}
                            className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl group hover:bg-neutral-100 dark:hover:bg-neutral-750 transition-colors"
                          >
                            <div className="w-8 h-8 rounded-full bg-white dark:bg-neutral-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                              <User className="w-4 h-4 text-neutral-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-neutral-900 dark:text-white truncate block">{agent.name}</span>
                              {agent.team && <span className="text-xs text-neutral-500">{agent.team}</span>}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={() => openEditAgentDialog(agent)}
                                className="p-1.5 text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg"
                                title="Edit agent"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRemoveAgent(graderSetup.grader._id, agent._id)}
                                className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Newly added agents */}
                        {addedAgents.map((agent, agentIndex) => (
                          <div
                            key={agent._id || `added-${agentIndex}`}
                            className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl group"
                          >
                            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                              <Plus className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-green-700 dark:text-green-400 truncate block">{agent.name}</span>
                              <span className="text-xs text-green-600 dark:text-green-500">New assignment</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEditAgentDialog(agent)}
                                className="p-1.5 text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg"
                                title="Edit agent"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRemoveAgent(graderSetup.grader._id, agent._id, true)}
                                className="p-1.5 text-green-500 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Empty state */}
                        {currentAgents.length === 0 && addedAgents.length === 0 && (
                          <div className="py-6 text-center">
                            <Users className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
                            <p className="text-sm text-neutral-500">No agents assigned</p>
                          </div>
                        )}
                      </div>

                      {/* Add Agent - Searchable Dropdown */}
                      <SearchableAgentDropdown
                        graderId={graderSetup.grader._id}
                        availableAgents={getAvailableAgentsForGrader(graderSetup.grader._id)}
                        onAdd={handleAddAgent}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Unassigned Agents Pool */}
            {(() => {
              const unassignedCount = weekSetup?.allAgents?.filter(a => {
                const isAssigned = weekSetup.setup?.some(s => {
                  const changes = weekSetupChanges[s.grader._id] || { add: [], remove: [] };
                  const currentIds = s.agents.filter(ag => !changes.remove.includes(ag._id)).map(ag => ag._id);
                  return [...currentIds, ...changes.add].includes(a._id);
                });
                return !isAssigned;
              }).length || 0;

              if (unassignedCount === 0) return null;

              const unassignedAgents = weekSetup?.allAgents?.filter(a => {
                const isAssigned = weekSetup.setup?.some(s => {
                  const changes = weekSetupChanges[s.grader._id] || { add: [], remove: [] };
                  const currentIds = s.agents.filter(ag => !changes.remove.includes(ag._id)).map(ag => ag._id);
                  return [...currentIds, ...changes.add].includes(a._id);
                });
                return !isAssigned;
              }) || [];

              return (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5">
                  <h4 className="font-semibold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Unassigned Agents ({unassignedCount})
                  </h4>
                  <p className="text-sm text-amber-600 dark:text-amber-500 mb-4">These agents are not assigned to any grader this week.</p>
                  <div className="flex flex-wrap gap-2">
                    {unassignedAgents.map((agent, index) => (
                      <span
                        key={agent._id || `unassigned-${index}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-neutral-800 border border-amber-200 dark:border-amber-700 rounded-lg text-sm text-neutral-700 dark:text-neutral-300"
                      >
                        <User className="w-3 h-3 text-neutral-400" />
                        {agent.name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}
          </>
        ) : (
          <div className="text-center py-12 text-neutral-500">No week setup data available</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">QA Command Center</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Manage QA graders, agents, and weekly assignments
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Sub-tabs */}
      <SubTabs activeTab={activeSubTab} onTabChange={setActiveSubTab} />

      {/* Tab Content */}
      {activeSubTab === 'overview' && renderOverviewTab()}
      {activeSubTab === 'agents' && renderAgentManagementTab()}
      {activeSubTab === 'analytics' && renderAnalyticsTab()}
      {activeSubTab === 'week-setup' && renderWeekSetupTab()}

      {/* View Ticket Dialog */}
      <Dialog open={viewTicketDialog.open} onOpenChange={(open) => !open && setViewTicketDialog({ open: false, ticket: null })}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              Ticket: {viewTicketDialog.ticket?.ticketId}
            </DialogTitle>
          </DialogHeader>
          {viewTicketDialog.ticket && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-neutral-500 uppercase">Agent</label>
                  <p className="font-medium text-neutral-900 dark:text-white">{viewTicketDialog.ticket.agent?.name || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-xs text-neutral-500 uppercase">Grader</label>
                  <p className="font-medium text-neutral-900 dark:text-white">{viewTicketDialog.ticket.createdBy?.name || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-xs text-neutral-500 uppercase">Date</label>
                  <p className="text-neutral-900 dark:text-white">{formatDate(viewTicketDialog.ticket.dateEntered)}</p>
                </div>
                <div>
                  <label className="text-xs text-neutral-500 uppercase">Status</label>
                  <div className="mt-1">{getStatusBadge(viewTicketDialog.ticket.status)}</div>
                </div>
                <div>
                  <label className="text-xs text-neutral-500 uppercase">Score</label>
                  <p className={`font-semibold ${getScoreColor(viewTicketDialog.ticket.qualityScorePercent)}`}>
                    {viewTicketDialog.ticket.qualityScorePercent !== null ? `${viewTicketDialog.ticket.qualityScorePercent}%` : 'Not graded'}
                  </p>
                </div>
              </div>
              {viewTicketDialog.ticket.shortDescription && (
                <div>
                  <label className="text-xs text-neutral-500 uppercase">Description</label>
                  <p className="mt-1 text-neutral-900 dark:text-white">{viewTicketDialog.ticket.shortDescription}</p>
                </div>
              )}
              {viewTicketDialog.ticket.notes && (
                <div>
                  <label className="text-xs text-neutral-500 uppercase">Notes</label>
                  <div className="mt-1 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg text-sm prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: viewTicketDialog.ticket.notes }} />
                </div>
              )}
              {viewTicketDialog.ticket.feedback && (
                <div>
                  <label className="text-xs text-neutral-500 uppercase">Feedback</label>
                  <div className="mt-1 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg text-sm">{viewTicketDialog.ticket.feedback}</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <button onClick={() => setViewTicketDialog({ open: false, ticket: null })} className="px-4 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700">Close</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Tickets Dialog */}
      <Dialog open={reassignDialog.open} onOpenChange={(open) => !open && setReassignDialog({ open: false, ticketIds: [], single: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Reassign {reassignDialog.ticketIds.length === 1 ? 'Ticket' : `${reassignDialog.ticketIds.length} Tickets`}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Select a QA grader to reassign to:</p>
            <div className="space-y-2">
              {(data.qaGraderList || []).map(grader => (
                <label key={grader._id} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${selectedGrader === grader._id ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}>
                  <input type="radio" name="grader" value={grader._id} checked={selectedGrader === grader._id} onChange={(e) => setSelectedGrader(e.target.value)} className="w-4 h-4 text-purple-600" />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-white">{grader.name}</p>
                      <p className="text-xs text-neutral-500">{grader.email}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => { setReassignDialog({ open: false, ticketIds: [], single: false }); setSelectedGrader(''); }} disabled={actionLoading} className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">Cancel</button>
            <button onClick={handleReassign} disabled={!selectedGrader || actionLoading} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <ArrowRight className="w-4 h-4" />Reassign
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Agent Dialog */}
      <Dialog open={reassignAgentDialog.open} onOpenChange={(open) => !open && setReassignAgentDialog({ open: false, agent: null, fromGrader: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Reassign Agent: {reassignAgentDialog.agent?.agentName}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Move this agent (and all their tickets) from <strong>{reassignAgentDialog.fromGrader?.name}</strong> to:
            </p>
            <div className="space-y-2">
              {(data.qaGraderList || []).filter(g => g._id !== reassignAgentDialog.fromGrader?._id).map(grader => (
                <label key={grader._id} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${selectedGrader === grader._id ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}>
                  <input type="radio" name="grader" value={grader._id} checked={selectedGrader === grader._id} onChange={(e) => setSelectedGrader(e.target.value)} className="w-4 h-4 text-purple-600" />
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-500" />
                    <span className="font-medium text-neutral-900 dark:text-white">{grader.name}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => { setReassignAgentDialog({ open: false, agent: null, fromGrader: null }); setSelectedGrader(''); }} disabled={actionLoading} className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">Cancel</button>
            <button onClick={handleReassignAgent} disabled={!selectedGrader || actionLoading} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <ArrowRight className="w-4 h-4" />Reassign Agent
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Swap Agents Dialog */}
      <Dialog open={swapAgentsDialog.open} onOpenChange={(open) => !open && setSwapAgentsDialog({ open: false, agent1: null, grader1: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5" />
              Swap Agents
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <p className="text-sm text-purple-700 dark:text-purple-300">
                <strong>{swapAgentsDialog.agent1?.agentName}</strong> from {swapAgentsDialog.grader1?.name}
              </p>
            </div>
            <p className="text-sm text-neutral-500 text-center">will swap with</p>
            <div className="space-y-3">
              <select
                value={selectedGrader2}
                onChange={(e) => { setSelectedGrader2(e.target.value); setSelectedAgent2(null); }}
                className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg"
              >
                <option value="">Select grader...</option>
                {(data.qaGraderList || []).filter(g => g._id !== swapAgentsDialog.grader1?._id).map(grader => (
                  <option key={grader._id} value={grader._id}>{grader.name}</option>
                ))}
              </select>
              {selectedGrader2 && (
                <select
                  value={selectedAgent2 || ''}
                  onChange={(e) => setSelectedAgent2(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg"
                >
                  <option value="">Select agent...</option>
                  {data.graders?.find(g => g.grader?._id === selectedGrader2)?.agents?.map((agent, index) => (
                    <option key={agent.agentId || `agent-${index}`} value={agent.agentId}>{agent.agentName}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => { setSwapAgentsDialog({ open: false, agent1: null, grader1: null }); setSelectedGrader2(''); setSelectedAgent2(null); }} disabled={actionLoading} className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">Cancel</button>
            <button onClick={handleSwapAgents} disabled={!selectedAgent2 || !selectedGrader2 || actionLoading} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <ArrowLeftRight className="w-4 h-4" />Swap Agents
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vacation Mode Dialog */}
      <Dialog open={vacationDialog.open} onOpenChange={(open) => !open && setVacationDialog({ open: false, grader: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-blue-500" />
              Vacation Mode: {vacationDialog.grader?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">This will:</p>
              <ul className="mt-2 space-y-1 text-sm text-blue-600 dark:text-blue-400">
                <li>- Redistribute all agents to other graders (balanced by workload)</li>
                <li>- Archive all current tickets</li>
              </ul>
            </div>
            <p className="text-sm text-neutral-500">Are you sure you want to activate vacation mode for {vacationDialog.grader?.name}?</p>
          </div>
          <DialogFooter>
            <button onClick={() => setVacationDialog({ open: false, grader: null })} disabled={actionLoading} className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">Cancel</button>
            <button onClick={handleVacationMode} disabled={actionLoading} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <Plane className="w-4 h-4" />Activate Vacation Mode
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Agent History Dialog */}
      <Dialog open={agentHistoryDialog.open} onOpenChange={(open) => !open && setAgentHistoryDialog({ open: false, agent: null })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              History: {agentHistoryDialog.agent?.agentName}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {agentHistoryLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
              </div>
            ) : agentHistory?.history?.length > 0 ? (
              <div className="space-y-2">
                {agentHistory.history.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-white">{item.grader?.name}</p>
                      <p className="text-xs text-neutral-500">Week {item.week}, {item.year}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-neutral-600 dark:text-neutral-400">{item.ticketCount} tickets</p>
                      <p className={getScoreColor(item.avgScore)}>{item.avgScore || '-'}% avg</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-neutral-500 py-8">No history found</p>
            )}
          </div>
          <DialogFooter>
            <button onClick={() => setAgentHistoryDialog({ open: false, agent: null })} className="px-4 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700">Close</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Agent Dialog */}
      <Dialog open={editAgentDialog.open} onOpenChange={(open) => !open && setEditAgentDialog({ open: false, agent: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-amber-500" />
              Edit Agent
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Name</label>
              <input
                type="text"
                value={editAgentForm.name}
                onChange={(e) => setEditAgentForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Full name (first and last)"
                className="w-full px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {/* MaestroQA Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">MaestroQA Name</label>
              <input
                type="text"
                value={editAgentForm.maestroName}
                onChange={(e) => setEditAgentForm(prev => ({ ...prev, maestroName: e.target.value }))}
                placeholder="Name as it appears in MaestroQA"
                className="w-full px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Position</label>
              <select
                value={editAgentForm.position}
                onChange={(e) => setEditAgentForm(prev => ({ ...prev, position: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">Select position</option>
                <option value="Notes">Notes</option>
                <option value="Junior Scorecard">Junior Scorecard</option>
                <option value="Medior Scorecard">Medior Scorecard</option>
                <option value="Senior Scorecard">Senior Scorecard</option>
              </select>
            </div>

            {/* Team */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Team</label>
              <input
                type="text"
                value={editAgentForm.team}
                onChange={(e) => setEditAgentForm(prev => ({ ...prev, team: e.target.value }))}
                placeholder="BG 1, KG 1..."
                className="w-full px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button
              onClick={() => setEditAgentDialog({ open: false, agent: null })}
              className="px-4 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAgent}
              disabled={actionLoading || !editAgentForm.name.trim()}
              className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Excel Import Dialog */}
      <Dialog open={excelImportDialog.open} onOpenChange={(open) => !open && setExcelImportDialog({ open: false, data: null, loading: false })}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-green-500" />
              Import from Excel
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {excelImportDialog.loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-green-500 mb-4" />
                <p className="text-neutral-500">Parsing Excel file...</p>
              </div>
            ) : excelImportDialog.data ? (
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-400">{excelImportDialog.data.sheetName}</p>
                      <p className="text-sm text-green-600">Week: {excelImportDialog.data.weekRange}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-400">{excelImportDialog.data.totalAgentsInExcel}</p>
                      <p className="text-xs text-green-600">Total in Excel</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-400">{excelImportDialog.data.matchedAgents?.length || 0}</p>
                      <p className="text-xs text-green-600">Matched</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-600">{excelImportDialog.data.unmatchedAgents?.length || 0}</p>
                      <p className="text-xs text-amber-600">Unmatched</p>
                    </div>
                  </div>
                </div>

                {/* Matched Agents */}
                {excelImportDialog.data.matchedAgents?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Matched Agents ({excelImportDialog.data.matchedAgents.length})
                    </h4>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {excelImportDialog.data.matchedAgents.map((agent, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-green-700 dark:text-green-400 truncate">{agent.dbAgent.name}</p>
                            {agent.team && <p className="text-xs text-green-600 truncate">{agent.team}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unmatched Agents */}
                {excelImportDialog.data.unmatchedAgents?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Unmatched Agents ({excelImportDialog.data.unmatchedAgents.length})
                    </h4>
                    <p className="text-xs text-amber-600 mb-2">These agents were not found in the database and will be skipped.</p>
                    <div className="flex flex-wrap gap-2">
                      {excelImportDialog.data.unmatchedAgents.map((agent, index) => (
                        <span key={index} className="px-2 py-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded text-sm text-amber-700 dark:text-amber-400">
                          {agent.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Weeks */}
                {excelImportDialog.data.availableWeeks?.length > 1 && (
                  <div>
                    <h4 className="font-medium text-neutral-900 dark:text-white mb-2 text-sm">Other weeks in this file:</h4>
                    <div className="flex flex-wrap gap-2">
                      {excelImportDialog.data.availableWeeks.map((week, index) => (
                        <span key={index} className={`px-2 py-1 rounded text-xs ${
                          week.weekRange === excelImportDialog.data.weekRange
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600'
                        }`}>
                          {week.weekRange} ({week.agentCount})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500">No data loaded</div>
            )}
          </div>
          <DialogFooter>
            <button
              onClick={() => setExcelImportDialog({ open: false, data: null, loading: false })}
              className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyExcelImport}
              disabled={!excelImportDialog.data?.matchedAgents?.length}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              Apply Import
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QAActiveOverview;
