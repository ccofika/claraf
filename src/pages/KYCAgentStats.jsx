import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Users, Clock, Trophy, TrendingUp, AlertCircle, CheckCircle2,
  Calendar, Filter, RefreshCw, UserPlus, Settings, BarChart3,
  Timer, Zap, Sun, Moon, Sunset
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

  // Filter state
  const [dateRange, setDateRange] = useState({
    startDate: getDateString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
    endDate: getDateString(new Date())
  });
  const [selectedShift, setSelectedShift] = useState('');

  // Dialog state
  const [addAgentDialog, setAddAgentDialog] = useState({ open: false });
  const [agentDetailDialog, setAgentDetailDialog] = useState({ open: false });
  const [newAgent, setNewAgent] = useState({ name: '', email: '' });

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
  const fetchOverview = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/kyc-stats/overview`, {
        headers: { Authorization: `Bearer ${token}` },
        params: dateRange
      });
      setOverview(res.data.overview);
    } catch (err) {
      console.error('Error fetching overview:', err);
      toast.error('Failed to fetch overview');
    } finally {
      setLoading(false);
    }
  };

  // Fetch leaderboard
  const fetchLeaderboard = async () => {
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
  };

  // Fetch shift stats
  const fetchShiftStats = async () => {
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
  };

  // Fetch agent details
  const fetchAgentDetails = async (agentId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/kyc-stats/agent/${agentId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: dateRange
      });
      setAgentDetails(res.data);
      setAgentDetailDialog({ open: true });
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

  // Effects
  useEffect(() => {
    fetchConfigStatus();
    fetchAgents();
  }, []);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverview();
      fetchLeaderboard();
    } else if (activeTab === 'shifts') {
      fetchShiftStats();
    }
  }, [activeTab, dateRange, selectedShift]);

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
                    <span>Connected to Slack</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    <span>Slack not configured</span>
                  </>
                )}
              </div>
            )}
            <button
              onClick={() => {
                fetchOverview();
                fetchLeaderboard();
                fetchShiftStats();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
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
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="shifts" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              By Shift
            </TabsTrigger>
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
                          className="border-b border-gray-100 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800/50"
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
                              onClick={() => fetchAgentDetails(item.agent._id)}
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
                    className={`flex items-center gap-4 p-4 rounded-lg ${
                      index === 0
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                        : index === 1
                        ? 'bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700'
                        : index === 2
                        ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
                        : 'bg-gray-50 dark:bg-neutral-800/50'
                    }`}
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

          {/* Manage Agents Tab */}
          <TabsContent value="agents">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Tracked Agents
                </h3>
                <button
                  onClick={seedAgents}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Seed Initial Agents
                </button>
              </div>
              <div className="space-y-3">
                {agents.map((agent) => (
                  <div
                    key={agent._id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg"
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

        {/* Agent Detail Dialog */}
        <Dialog open={agentDetailDialog.open} onOpenChange={(open) => setAgentDetailDialog({ open })}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {agentDetails?.agent?.name} - Detailed Statistics
              </DialogTitle>
            </DialogHeader>
            {agentDetails && (
              <div className="space-y-6 py-4">
                {/* Overall Stats */}
                <div className="grid grid-cols-3 gap-4">
                  {agentDetails.overallStats.map((stat) => (
                    <div key={stat._id} className="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-neutral-400 capitalize">
                        {stat._id.replace('_', ' ')}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.count}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Shift Breakdown */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">By Shift</h4>
                  <div className="space-y-2">
                    {agentDetails.shiftStats.map((shift) => (
                      <div
                        key={shift._id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          {getShiftIcon(shift._id)}
                          <span className="text-gray-700 dark:text-neutral-300">
                            {getShiftLabel(shift._id)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          {shift.activities.map((act) => (
                            <span key={act.type} className="text-sm text-gray-500">
                              {act.type}: {act.count}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activities */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Recent Activities</h4>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {agentDetails.recentActivities.slice(0, 10).map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 text-sm border-b border-gray-100 dark:border-neutral-800"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant={activity.activityType === 'ticket_taken' ? 'default' : 'secondary'}>
                            {activity.activityType.replace('_', ' ')}
                          </Badge>
                          {activity.messagePreview && (
                            <span className="text-gray-500 truncate max-w-xs">
                              {activity.messagePreview}
                            </span>
                          )}
                        </div>
                        <span className="text-gray-400">
                          {new Date(activity.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default KYCAgentStats;
