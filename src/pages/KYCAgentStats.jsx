import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Users, Clock, Trophy, TrendingUp, AlertCircle, CheckCircle2,
  Calendar, Filter, RefreshCw, UserPlus, Settings, BarChart3,
  Timer, Zap, Sun, Moon, Sunset, MessageSquare, Activity,
  ChevronDown, ChevronRight, Eye, MessageCircle, Hourglass
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

const KYCAgentStats = () => {
  const { user } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL;

  // State
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [configStatus, setConfigStatus] = useState(null);

  // Data state
  const [agents, setAgents] = useState([]);
  const [overview, setOverview] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [shiftStats, setShiftStats] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentDetails, setAgentDetails] = useState(null);
  const [activityFeed, setActivityFeed] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Real-time state
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const pollingIntervalRef = useRef(null);

  // Filter state
  const [dateRange, setDateRange] = useState({
    startDate: getDateString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
    endDate: getDateString(new Date())
  });
  const [selectedShift, setSelectedShift] = useState('');
  const [activityFilter, setActivityFilter] = useState('all'); // all, ticket_taken, thread_reply
  const [selectedAgentFilter, setSelectedAgentFilter] = useState('');

  // Dialog state
  const [addAgentDialog, setAddAgentDialog] = useState({ open: false });
  const [agentDetailDialog, setAgentDetailDialog] = useState({ open: false });
  const [activityDetailDialog, setActivityDetailDialog] = useState({ open: false, activity: null });
  const [newAgent, setNewAgent] = useState({ name: '', email: '' });

  // Expanded activities for showing details inline
  const [expandedActivities, setExpandedActivities] = useState(new Set());

  // Helper function for date string
  function getDateString(date) {
    return date.toISOString().split('T')[0];
  }

  // Format seconds to readable time
  function formatTime(seconds) {
    if (!seconds || seconds === 0) return '-';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    }
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }

  // Format relative time
  function formatRelativeTime(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  // Get shift label
  function getShiftLabel(shift) {
    switch (shift) {
      case 'morning': return '7:00 - 15:00';
      case 'afternoon': return '15:00 - 23:00';
      case 'night': return '23:00 - 7:00';
      default: return shift;
    }
  }

  // Get shift icon
  function getShiftIcon(shift) {
    switch (shift) {
      case 'morning': return <Sun className="w-4 h-4 text-yellow-500" />;
      case 'afternoon': return <Sunset className="w-4 h-4 text-orange-500" />;
      case 'night': return <Moon className="w-4 h-4 text-blue-500" />;
      default: return null;
    }
  }

  // Get activity type icon
  function getActivityIcon(type) {
    switch (type) {
      case 'ticket_taken': return <Hourglass className="w-4 h-4 text-blue-500" />;
      case 'thread_reply': return <MessageCircle className="w-4 h-4 text-green-500" />;
      case 'message_sent': return <MessageSquare className="w-4 h-4 text-purple-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  }

  // Get activity type label
  function getActivityLabel(type) {
    switch (type) {
      case 'ticket_taken': return 'Took Ticket';
      case 'thread_reply': return 'Replied';
      case 'message_sent': return 'Sent Message';
      default: return type;
    }
  }

  // Fetch config status
  const fetchConfigStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/kyc-stats/config-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfigStatus(res.data.status);
    } catch (err) {
      console.error('Error fetching config status:', err);
    }
  };

  // Fetch agents
  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/kyc-stats/agents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAgents(res.data.agents);
    } catch (err) {
      console.error('Error fetching agents:', err);
      toast.error('Failed to fetch agents');
    }
  };

  // Fetch overview
  const fetchOverview = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/kyc-stats/overview`, {
        headers: { Authorization: `Bearer ${token}` },
        params: dateRange
      });
      setOverview(res.data.overview);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching overview:', err);
      if (showLoading) toast.error('Failed to fetch overview');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [API_URL, dateRange]);

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/kyc-stats/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` },
        params: dateRange
      });
      setLeaderboard(res.data.leaderboard);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    }
  }, [API_URL, dateRange]);

  // Fetch shift stats
  const fetchShiftStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/kyc-stats/by-shift`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { ...dateRange, shift: selectedShift || undefined }
      });
      setShiftStats(res.data.stats);
    } catch (err) {
      console.error('Error fetching shift stats:', err);
    }
  }, [API_URL, dateRange, selectedShift]);

  // Fetch activity feed
  const fetchActivityFeed = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setActivityLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/kyc-stats/activity-feed`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          ...dateRange,
          activityType: activityFilter !== 'all' ? activityFilter : undefined,
          agentId: selectedAgentFilter || undefined,
          limit: 100
        }
      });
      setActivityFeed(res.data.activities || []);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching activity feed:', err);
      // Don't show error toast for background updates
    } finally {
      if (showLoading) setActivityLoading(false);
    }
  }, [API_URL, dateRange, activityFilter, selectedAgentFilter]);

  // Fetch agent details
  const fetchAgentDetails = async (agentId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/kyc-stats/agent/${agentId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: dateRange
      });
      setAgentDetails(res.data);
      setSelectedAgent(agentId);
      setActiveTab('agent-details');
    } catch (err) {
      console.error('Error fetching agent details:', err);
      toast.error('Failed to fetch agent details');
    }
  };

  // Seed agents
  const seedAgents = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/kyc-stats/agents/seed`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Agents seeded successfully');
      fetchAgents();
    } catch (err) {
      console.error('Error seeding agents:', err);
      toast.error('Failed to seed agents');
    }
  };

  // Add agent
  const handleAddAgent = async () => {
    if (!newAgent.name || !newAgent.email) {
      toast.error('Name and email are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/kyc-stats/agents`, newAgent, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Agent added successfully');
      setAddAgentDialog({ open: false });
      setNewAgent({ name: '', email: '' });
      fetchAgents();
    } catch (err) {
      console.error('Error adding agent:', err);
      toast.error(err.response?.data?.message || 'Failed to add agent');
    }
  };

  // Toggle activity expansion
  const toggleActivityExpansion = (activityId) => {
    setExpandedActivities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };

  // Refresh all data
  const refreshAllData = useCallback(() => {
    fetchOverview(false);
    fetchLeaderboard();
    fetchShiftStats();
    if (activeTab === 'activity') {
      fetchActivityFeed(false);
    }
    if (activeTab === 'agent-details' && selectedAgent) {
      fetchAgentDetails(selectedAgent);
    }
  }, [fetchOverview, fetchLeaderboard, fetchShiftStats, fetchActivityFeed, activeTab, selectedAgent]);

  // Setup polling for real-time updates
  useEffect(() => {
    if (isLive) {
      // Initial fetch
      refreshAllData();

      // Setup polling every 10 seconds
      pollingIntervalRef.current = setInterval(() => {
        refreshAllData();
      }, 10000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    } else {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    }
  }, [isLive, refreshAllData]);

  // Initial fetch
  useEffect(() => {
    fetchConfigStatus();
    fetchAgents();
  }, []);

  // Fetch data when tab changes
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverview();
      fetchLeaderboard();
    } else if (activeTab === 'shifts') {
      fetchShiftStats();
    } else if (activeTab === 'activity') {
      fetchActivityFeed();
    }
  }, [activeTab, dateRange, selectedShift, activityFilter, selectedAgentFilter]);

  // Calculate totals
  const totals = overview.reduce((acc, item) => ({
    ticketsTaken: acc.ticketsTaken + (item.stats.ticketsTaken || 0),
    messagesCount: acc.messagesCount + (item.stats.messagesCount || 0)
  }), { ticketsTaken: 0, messagesCount: 0 });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              KYC Agent Statistics
            </h1>
            <p className="text-gray-500 dark:text-neutral-400 mt-1">
              Monitor KYC agent performance in mebit-kyc channel
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <button
              onClick={() => setIsLive(!isLive)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                isLive
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              {isLive ? 'Live' : 'Paused'}
            </button>

            {/* Last update */}
            <span className="text-xs text-gray-400 dark:text-neutral-500">
              Updated {formatRelativeTime(lastUpdate)}
            </span>

            {/* Config Status */}
            {configStatus && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                configStatus.slackConnected
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              }`}>
                {configStatus.slackConnected ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Connected</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    <span>Not configured</span>
                  </>
                )}
              </div>
            )}

            <button
              onClick={refreshAllData}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setAddAgentDialog({ open: true })}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add Agent
            </button>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-neutral-400">Date Range:</span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-40"
              />
              <span className="text-gray-400">to</span>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setDateRange({
                  startDate: getDateString(new Date()),
                  endDate: getDateString(new Date())
                })}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-neutral-800 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-700"
              >
                Today
              </button>
              <button
                onClick={() => setDateRange({
                  startDate: getDateString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
                  endDate: getDateString(new Date())
                })}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-neutral-800 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-700"
              >
                Last 7 days
              </button>
              <button
                onClick={() => setDateRange({
                  startDate: getDateString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
                  endDate: getDateString(new Date())
                })}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-neutral-800 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-700"
              >
                Last 30 days
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-neutral-400">Active Agents</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{agents.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-neutral-400">Tickets Taken</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totals.ticketsTaken}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-neutral-400">Total Messages</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totals.messagesCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-neutral-400">Avg Response Time</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatTime(
                    Math.round(
                      overview.reduce((sum, o) => sum + (o.stats.avgResponseTime || 0), 0) /
                      (overview.filter(o => o.stats.avgResponseTime > 0).length || 1)
                    )
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Activity Feed
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="shifts" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              By Shift
            </TabsTrigger>
            {selectedAgent && (
              <TabsTrigger value="agent-details" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Agent Details
              </TabsTrigger>
            )}
            <TabsTrigger value="agents" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Manage Agents
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-neutral-800">
                      <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-neutral-400">Agent</th>
                      <th className="text-center p-4 text-sm font-medium text-gray-500 dark:text-neutral-400">Tickets Taken</th>
                      <th className="text-center p-4 text-sm font-medium text-gray-500 dark:text-neutral-400">Messages</th>
                      <th className="text-center p-4 text-sm font-medium text-gray-500 dark:text-neutral-400">Avg Response</th>
                      <th className="text-center p-4 text-sm font-medium text-gray-500 dark:text-neutral-400">Fastest</th>
                      <th className="text-center p-4 text-sm font-medium text-gray-500 dark:text-neutral-400">Slowest</th>
                      <th className="text-center p-4 text-sm font-medium text-gray-500 dark:text-neutral-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-500">
                          Loading...
                        </td>
                      </tr>
                    ) : overview.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-500">
                          No data available for this period
                        </td>
                      </tr>
                    ) : (
                      overview.map((item) => (
                        <tr
                          key={item.agent._id}
                          className="border-b border-gray-100 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800/50 cursor-pointer"
                          onClick={() => fetchAgentDetails(item.agent._id)}
                        >
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{item.agent.name}</p>
                              <p className="text-sm text-gray-500 dark:text-neutral-400">{item.agent.email}</p>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {item.stats.ticketsTaken}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="text-gray-600 dark:text-neutral-300">
                              {item.stats.messagesCount}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`font-medium ${
                              item.stats.avgResponseTime < 300
                                ? 'text-green-600 dark:text-green-400'
                                : item.stats.avgResponseTime < 600
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {formatTime(item.stats.avgResponseTime)}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="text-green-600 dark:text-green-400">
                              {formatTime(item.stats.minResponseTime)}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="text-red-600 dark:text-red-400">
                              {formatTime(item.stats.maxResponseTime)}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                fetchAgentDetails(item.agent._id);
                              }}
                              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Activity Feed Tab */}
          <TabsContent value="activity">
            <div className="space-y-4">
              {/* Filters */}
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-neutral-400">Filter:</span>
                  </div>

                  {/* Activity Type Filter */}
                  <select
                    value={activityFilter}
                    onChange={(e) => setActivityFilter(e.target.value)}
                    className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-neutral-800 rounded-lg border-0 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Activities</option>
                    <option value="ticket_taken">Tickets Taken</option>
                    <option value="thread_reply">Thread Replies</option>
                  </select>

                  {/* Agent Filter */}
                  <select
                    value={selectedAgentFilter}
                    onChange={(e) => setSelectedAgentFilter(e.target.value)}
                    className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-neutral-800 rounded-lg border-0 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Agents</option>
                    {agents.map(agent => (
                      <option key={agent._id} value={agent._id}>{agent.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Activity List */}
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800">
                {activityLoading ? (
                  <div className="p-8 text-center text-gray-500">Loading activities...</div>
                ) : activityFeed.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No activities found for this period</div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-neutral-800">
                    {activityFeed.map((activity, index) => (
                      <div key={activity._id || index} className="p-4">
                        <div
                          className="flex items-start gap-4 cursor-pointer"
                          onClick={() => toggleActivityExpansion(activity._id)}
                        >
                          {/* Activity Icon */}
                          <div className={`p-2 rounded-lg ${
                            activity.activityType === 'ticket_taken'
                              ? 'bg-blue-100 dark:bg-blue-900/30'
                              : 'bg-green-100 dark:bg-green-900/30'
                          }`}>
                            {getActivityIcon(activity.activityType)}
                          </div>

                          {/* Activity Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {activity.agentName || 'Unknown Agent'}
                              </span>
                              <Badge variant={activity.activityType === 'ticket_taken' ? 'default' : 'secondary'}>
                                {getActivityLabel(activity.activityType)}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                {getShiftIcon(activity.shift)}
                                <span>{getShiftLabel(activity.shift)}</span>
                              </div>
                            </div>

                            {/* Message Preview */}
                            {activity.messagePreview && (
                              <p className="text-sm text-gray-600 dark:text-neutral-400 truncate">
                                {activity.messagePreview}
                              </p>
                            )}

                            {/* Response Time */}
                            {activity.responseTimeSeconds > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <Timer className="w-3 h-3 text-gray-400" />
                                <span className={`text-xs ${
                                  activity.responseTimeSeconds < 300
                                    ? 'text-green-600'
                                    : activity.responseTimeSeconds < 600
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                                }`}>
                                  Response time: {formatTime(activity.responseTimeSeconds)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Timestamp & Expand */}
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span>{formatRelativeTime(activity.createdAt)}</span>
                            {expandedActivities.has(activity._id) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {expandedActivities.has(activity._id) && (
                          <div className="mt-4 ml-12 p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500 dark:text-neutral-400">Thread ID:</span>
                                <span className="ml-2 text-gray-900 dark:text-white font-mono text-xs">
                                  {activity.threadTs}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-neutral-400">Date:</span>
                                <span className="ml-2 text-gray-900 dark:text-white">
                                  {new Date(activity.createdAt).toLocaleString()}
                                </span>
                              </div>
                              {activity.reactionAddedAt && (
                                <div>
                                  <span className="text-gray-500 dark:text-neutral-400">Ticket Taken At:</span>
                                  <span className="ml-2 text-gray-900 dark:text-white">
                                    {new Date(activity.reactionAddedAt).toLocaleString()}
                                  </span>
                                </div>
                              )}
                              {activity.firstReplyAt && (
                                <div>
                                  <span className="text-gray-500 dark:text-neutral-400">First Reply At:</span>
                                  <span className="ml-2 text-gray-900 dark:text-white">
                                    {new Date(activity.firstReplyAt).toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Full Message */}
                            {activity.messagePreview && (
                              <div>
                                <span className="text-gray-500 dark:text-neutral-400 text-sm">Message:</span>
                                <p className="mt-1 p-3 bg-white dark:bg-neutral-900 rounded border border-gray-200 dark:border-neutral-700 text-sm text-gray-900 dark:text-white">
                                  {activity.messagePreview}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Top Performers
              </h3>
              <div className="space-y-4">
                {leaderboard.map((item, index) => (
                  <div
                    key={item.agent._id}
                    className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-colors ${
                      index === 0
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                        : index === 1
                        ? 'bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-700'
                        : index === 2
                        ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                        : 'bg-gray-50 dark:bg-neutral-800/50 hover:bg-gray-100 dark:hover:bg-neutral-800'
                    }`}
                    onClick={() => fetchAgentDetails(item.agent._id)}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      index === 0
                        ? 'bg-yellow-500 text-white'
                        : index === 1
                        ? 'bg-gray-400 text-white'
                        : index === 2
                        ? 'bg-orange-400 text-white'
                        : 'bg-gray-200 dark:bg-neutral-700 text-gray-600 dark:text-neutral-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{item.agent.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.ticketsTaken}</p>
                      <p className="text-sm text-gray-500 dark:text-neutral-400">tickets</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {formatTime(item.avgResponseTime)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-neutral-400">avg response</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Shifts Tab */}
          <TabsContent value="shifts">
            <div className="space-y-6">
              {/* Shift Filter */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-neutral-400">Filter by shift:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedShift('')}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                      selectedShift === ''
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300'
                    }`}
                  >
                    All Shifts
                  </button>
                  <button
                    onClick={() => setSelectedShift('morning')}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                      selectedShift === 'morning'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    Morning (7-15)
                  </button>
                  <button
                    onClick={() => setSelectedShift('afternoon')}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                      selectedShift === 'afternoon'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300'
                    }`}
                  >
                    <Sunset className="w-4 h-4" />
                    Afternoon (15-23)
                  </button>
                  <button
                    onClick={() => setSelectedShift('night')}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                      selectedShift === 'night'
                        ? 'bg-blue-700 text-white'
                        : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    Night (23-7)
                  </button>
                </div>
              </div>

              {/* Shift Stats */}
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-neutral-800">
                        <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-neutral-400">Agent</th>
                        <th className="text-center p-4 text-sm font-medium text-gray-500 dark:text-neutral-400">Shift</th>
                        <th className="text-center p-4 text-sm font-medium text-gray-500 dark:text-neutral-400">Tickets</th>
                        <th className="text-center p-4 text-sm font-medium text-gray-500 dark:text-neutral-400">Messages</th>
                        <th className="text-center p-4 text-sm font-medium text-gray-500 dark:text-neutral-400">Avg Response</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shiftStats.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-500">
                            No data available for this period
                          </td>
                        </tr>
                      ) : (
                        shiftStats.map((item, index) => (
                          <tr
                            key={`${item.agentSlackId}-${item.shift}-${index}`}
                            className="border-b border-gray-100 dark:border-neutral-800"
                          >
                            <td className="p-4">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {item.agentName || 'Unknown'}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {getShiftIcon(item.shift)}
                                <span className="text-gray-600 dark:text-neutral-300">
                                  {getShiftLabel(item.shift)}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 text-center font-semibold text-gray-900 dark:text-white">
                              {item.ticketsTaken}
                            </td>
                            <td className="p-4 text-center text-gray-600 dark:text-neutral-300">
                              {item.messagesCount}
                            </td>
                            <td className="p-4 text-center">
                              <span className={`font-medium ${
                                item.avgResponseTime < 300
                                  ? 'text-green-600'
                                  : item.avgResponseTime < 600
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                              }`}>
                                {formatTime(item.avgResponseTime)}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Agent Details Tab */}
          <TabsContent value="agent-details">
            {agentDetails && (
              <div className="space-y-6">
                {/* Agent Header */}
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {agentDetails.agent.name}
                      </h2>
                      <p className="text-gray-500 dark:text-neutral-400">{agentDetails.agent.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedAgent(null);
                        setAgentDetails(null);
                        setActiveTab('overview');
                      }}
                      className="text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                    >
                      Back to Overview
                    </button>
                  </div>
                </div>

                {/* Overall Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {agentDetails.overallStats.map((stat) => (
                    <div key={stat._id} className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6">
                      <p className="text-sm text-gray-500 dark:text-neutral-400 capitalize mb-2">
                        {stat._id.replace('_', ' ')}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {stat.count}
                      </p>
                      {stat.avgResponseTime > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          Avg response: {formatTime(Math.round(stat.avgResponseTime))}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Shift Breakdown */}
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Performance by Shift</h3>
                  <div className="space-y-3">
                    {agentDetails.shiftStats.map((shift) => (
                      <div
                        key={shift._id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getShiftIcon(shift._id)}
                          <span className="font-medium text-gray-700 dark:text-neutral-300">
                            {getShiftLabel(shift._id)}
                          </span>
                        </div>
                        <div className="flex items-center gap-6">
                          {shift.activities.map((act) => (
                            <div key={act.type} className="text-center">
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">{act.count}</p>
                              <p className="text-xs text-gray-500 capitalize">{act.type.replace('_', ' ')}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activities */}
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Activities</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {agentDetails.recentActivities.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg"
                      >
                        <div className={`p-2 rounded-lg ${
                          activity.activityType === 'ticket_taken'
                            ? 'bg-blue-100 dark:bg-blue-900/30'
                            : 'bg-green-100 dark:bg-green-900/30'
                        }`}>
                          {getActivityIcon(activity.activityType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={activity.activityType === 'ticket_taken' ? 'default' : 'secondary'}>
                              {getActivityLabel(activity.activityType)}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              {getShiftIcon(activity.shift)}
                              <span>{activity.shift}</span>
                            </div>
                          </div>
                          {activity.messagePreview && (
                            <p className="text-sm text-gray-600 dark:text-neutral-400">
                              {activity.messagePreview}
                            </p>
                          )}
                          {activity.responseTimeSeconds > 0 && (
                            <p className={`text-xs mt-1 ${
                              activity.responseTimeSeconds < 300
                                ? 'text-green-600'
                                : activity.responseTimeSeconds < 600
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}>
                              Response time: {formatTime(activity.responseTimeSeconds)}
                            </p>
                          )}
                        </div>
                        <span className="text-sm text-gray-400 whitespace-nowrap">
                          {new Date(activity.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Manage Agents Tab */}
          <TabsContent value="agents">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Tracked Agents
                </h3>
              </div>
              <div className="space-y-3">
                {agents.map((agent) => (
                  <div
                    key={agent._id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 cursor-pointer transition-colors"
                    onClick={() => fetchAgentDetails(agent._id)}
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{agent.name}</p>
                      <p className="text-sm text-gray-500 dark:text-neutral-400">{agent.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {agent.slackUserId ? (
                        <Badge variant="success">Linked to Slack</Badge>
                      ) : (
                        <Badge variant="secondary">Pending Link</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Agent Dialog */}
        <Dialog open={addAgentDialog.open} onOpenChange={(open) => setAddAgentDialog({ open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add KYC Agent</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                  placeholder="e.g., Milan Petrovic"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newAgent.email}
                  onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })}
                  placeholder="e.g., milanpetrovic@mebit.io"
                />
              </div>
            </div>
            <DialogFooter>
              <button
                onClick={() => setAddAgentDialog({ open: false })}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAgent}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Agent
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default KYCAgentStats;
