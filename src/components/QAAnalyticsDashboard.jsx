import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, Users, FileText, Target, Calendar, Award, AlertCircle, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

const QAAnalyticsDashboard = () => {
  const API_URL = process.env.REACT_APP_API_URL;
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedGrader, setSelectedGrader] = useState(null); // null = current user
  const [graders, setGraders] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin and fetch graders
  useEffect(() => {
    const checkAdminAndFetchGraders = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/qa/analytics/graders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setGraders(response.data);
        setIsAdmin(true);
      } catch (error) {
        // Not admin, that's fine
        setIsAdmin(false);
      }
    };
    checkAdminAndFetchGraders();
  }, [API_URL]);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, selectedGrader]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = { timeRange };
      if (selectedGrader) {
        params.graderId = selectedGrader;
      }
      const response = await axios.get(`${API_URL}/api/qa/analytics`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  // Chart colors
  const COLORS = {
    primary: '#000000',
    secondary: '#6b7280',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    blue: '#3b82f6',
  };

  const DARK_COLORS = {
    primary: '#ffffff',
    secondary: '#9ca3af',
    success: '#34d399',
    warning: '#fbbf24',
    danger: '#f87171',
    purple: '#a78bfa',
    blue: '#60a5fa',
  };

  const isDark = document.documentElement.classList.contains('dark');
  const colors = isDark ? DARK_COLORS : COLORS;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-800 rounded-lg p-3 shadow-xl">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs text-gray-600 dark:text-neutral-400">
              <span style={{ color: entry.color }}>{entry.name}:</span> {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Metric card component
  const MetricCard = ({ title, value, change, icon: Icon, trend }) => (
    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trend === 'up' ? 'text-green-600 dark:text-green-400' : trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-neutral-400'}`}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
              <span>{change > 0 ? '+' : ''}{change}% from last period</span>
            </div>
          )}
        </div>
        <div className="text-gray-600 dark:text-neutral-400">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-gray-200 dark:bg-neutral-800 rounded-lg"></div>
        <div className="h-64 bg-gray-200 dark:bg-neutral-800 rounded-lg"></div>
        <div className="h-64 bg-gray-200 dark:bg-neutral-800 rounded-lg"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-neutral-500">
        <AlertCircle className="w-12 h-12 mb-3" />
        <p className="text-sm">No analytics data available</p>
      </div>
    );
  }

  const {
    overview,
    qualityTrend,
    agentPerformance,
    categoryDistribution,
    weeklyVolume,
    scoreDistribution,
    feedbackStats
  } = analyticsData;

  return (
    <div className="space-y-6">
      {/* Filters Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics Dashboard</h2>

        <div className="flex flex-wrap items-center gap-3">
          {/* Grader Filter (Admin only) */}
          {isAdmin && graders.length > 0 && (
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-gray-500 dark:text-neutral-400" />
              <select
                value={selectedGrader || ''}
                onChange={(e) => setSelectedGrader(e.target.value || null)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              >
                <option value="">My Analytics</option>
                <option value="all">All Graders</option>
                {graders.map((grader) => (
                  <option key={grader._id} value={grader._id}>
                    {grader.name || grader.email}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-1">
            {[
              { label: '7 Days', value: '7d' },
              { label: '30 Days', value: '30d' },
              { label: '90 Days', value: '90d' },
              { label: 'All Time', value: 'all' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeRange(option.value)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  timeRange === option.value
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Tickets"
          value={overview?.totalTickets || 0}
          change={overview?.ticketsChange}
          trend={overview?.ticketsChange > 0 ? 'up' : overview?.ticketsChange < 0 ? 'down' : 'neutral'}
          icon={FileText}
        />
        <MetricCard
          title="Avg Quality Score"
          value={`${overview?.avgQualityScore || 0}%`}
          change={overview?.qualityChange}
          trend={overview?.qualityChange > 0 ? 'up' : overview?.qualityChange < 0 ? 'down' : 'neutral'}
          icon={Target}
        />
        <MetricCard
          title="Active Agents"
          value={overview?.activeAgents || 0}
          icon={Users}
        />
        <MetricCard
          title="Grading Rate"
          value={`${overview?.gradingRate || 0}%`}
          change={overview?.gradingRateChange}
          trend={overview?.gradingRateChange > 0 ? 'up' : overview?.gradingRateChange < 0 ? 'down' : 'neutral'}
          icon={Award}
        />
      </div>

      {/* Quality Trend Over Time */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Quality Score Trend</h3>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">Average quality scores over time</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={qualityTrend || []}>
            <defs>
              <linearGradient id="colorQuality" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3} />
                <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.secondary} opacity={0.2} />
            <XAxis
              dataKey="date"
              stroke={colors.secondary}
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke={colors.secondary}
              style={{ fontSize: '12px' }}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="avgScore"
              name="Avg Quality"
              stroke={colors.primary}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorQuality)"
            />
            <Area
              type="monotone"
              dataKey="targetScore"
              name="Target"
              stroke={colors.warning}
              strokeWidth={2}
              strokeDasharray="5 5"
              fillOpacity={0}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Performance Table */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Agent Performance</h3>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">Quality scores by agent</p>
          </div>
          {agentPerformance && agentPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-neutral-800">
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 dark:text-neutral-400">Agent</th>
                    <th className="text-center py-2 px-2 text-xs font-medium text-gray-500 dark:text-neutral-400">Tickets</th>
                    <th className="text-center py-2 px-2 text-xs font-medium text-gray-500 dark:text-neutral-400">Avg Score</th>
                    <th className="text-right py-2 px-2 text-xs font-medium text-gray-500 dark:text-neutral-400">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {agentPerformance.slice(0, 10).map((agent, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-neutral-800/50 hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                      <td className="py-2 px-2 text-gray-900 dark:text-white font-medium truncate max-w-[150px]" title={agent.name}>
                        {agent.name}
                      </td>
                      <td className="py-2 px-2 text-center text-gray-600 dark:text-neutral-400">
                        {agent.ticketCount}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className={`font-semibold ${
                          agent.avgScore >= 80 ? 'text-green-600 dark:text-green-400' :
                          agent.avgScore >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {agent.avgScore}%
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 h-2 bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                agent.avgScore >= 80 ? 'bg-green-500' :
                                agent.avgScore >= 60 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${agent.avgScore}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {agentPerformance.length > 10 && (
                <p className="text-xs text-gray-500 dark:text-neutral-400 mt-2 text-center">
                  Showing top 10 of {agentPerformance.length} agents
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500 dark:text-neutral-500">
              <p className="text-sm">No agent performance data</p>
            </div>
          )}
        </div>

        {/* Category Distribution */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Category Distribution</h3>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">Tickets by category</p>
          </div>
          {categoryDistribution && categoryDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill={colors.primary}
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => {
                    const colorKeys = Object.keys(colors);
                    const color = colors[colorKeys[index % colorKeys.length]];
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500 dark:text-neutral-500">
              <p className="text-sm">No category data</p>
            </div>
          )}
        </div>
      </div>

      {/* Weekly Volume */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Weekly Ticket Volume</h3>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">Tickets created and graded per week</p>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={weeklyVolume || []}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.secondary} opacity={0.2} />
            <XAxis
              dataKey="week"
              stroke={colors.secondary}
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke={colors.secondary}
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="created" name="Created" fill={colors.blue} radius={[4, 4, 0, 0]} />
            <Bar dataKey="graded" name="Graded" fill={colors.success} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Score Distribution & Top/Bottom Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Score Distribution</h3>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">Distribution of quality scores</p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={scoreDistribution || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.secondary} opacity={0.2} />
              <XAxis
                dataKey="range"
                stroke={colors.secondary}
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke={colors.secondary}
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Tickets" radius={[4, 4, 0, 0]}>
                {(scoreDistribution || []).map((entry, index) => {
                  let fill = colors.danger;
                  if (entry.range.includes('80-100')) fill = colors.success;
                  else if (entry.range.includes('60-80')) fill = colors.warning;
                  else if (entry.range.includes('40-60')) fill = colors.secondary;
                  return <Cell key={`cell-${index}`} fill={fill} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top & Bottom Performers */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Top & Bottom Performers</h3>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">Best and worst performing agents</p>
          </div>
          {agentPerformance && agentPerformance.length > 0 ? (
            <div className="space-y-4">
              {/* Top 3 */}
              <div>
                <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Top Performers
                </p>
                <div className="space-y-2">
                  {agentPerformance.slice(0, 3).map((agent, index) => (
                    <div key={index} className="flex items-center justify-between py-1.5 px-2 bg-green-50 dark:bg-green-900/20 rounded">
                      <span className="text-sm text-gray-900 dark:text-white">{agent.name}</span>
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">{agent.avgScore}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom 3 */}
              {agentPerformance.length > 3 && (
                <div>
                  <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" /> Needs Improvement
                  </p>
                  <div className="space-y-2">
                    {agentPerformance.slice(-3).reverse().map((agent, index) => (
                      <div key={index} className="flex items-center justify-between py-1.5 px-2 bg-red-50 dark:bg-red-900/20 rounded">
                        <span className="text-sm text-gray-900 dark:text-white">{agent.name}</span>
                        <span className="text-sm font-semibold text-red-600 dark:text-red-400">{agent.avgScore}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500 dark:text-neutral-500">
              <p className="text-sm">No performance data</p>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Statistics */}
      {feedbackStats && (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Feedback Statistics</h3>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">Common feedback themes and patterns</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-neutral-950 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Tickets with Feedback</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {feedbackStats.withFeedback || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-neutral-500 mt-1">
                {feedbackStats.feedbackRate || 0}% of graded tickets
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-neutral-950 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Avg Feedback Length</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {feedbackStats.avgLength || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-neutral-500 mt-1">characters</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-neutral-950 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Graded Tickets</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {overview?.gradedTickets || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-neutral-500 mt-1">
                of {overview?.totalTickets || 0} total
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-neutral-950 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Pending Review</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {(overview?.totalTickets || 0) - (overview?.gradedTickets || 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-neutral-500 mt-1">tickets to grade</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Statistics Table */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Summary Statistics</h3>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">Key metrics at a glance</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-neutral-800">
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-neutral-400">Metric</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-neutral-400">Value</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-neutral-400">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 dark:border-neutral-800/50">
                <td className="py-3 px-3 text-gray-900 dark:text-white">Total Tickets Reviewed</td>
                <td className="py-3 px-3 text-right font-semibold text-gray-900 dark:text-white">{overview?.totalTickets || 0}</td>
                <td className="py-3 px-3 text-right">
                  <span className="px-2 py-0.5 rounded text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                    {timeRange === 'all' ? 'All Time' : `Last ${timeRange.replace('d', ' days')}`}
                  </span>
                </td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-neutral-800/50">
                <td className="py-3 px-3 text-gray-900 dark:text-white">Average Quality Score</td>
                <td className="py-3 px-3 text-right font-semibold text-gray-900 dark:text-white">{overview?.avgQualityScore || 0}%</td>
                <td className="py-3 px-3 text-right">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    (overview?.avgQualityScore || 0) >= 80
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : (overview?.avgQualityScore || 0) >= 60
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    {(overview?.avgQualityScore || 0) >= 80 ? 'Excellent' : (overview?.avgQualityScore || 0) >= 60 ? 'Good' : 'Needs Work'}
                  </span>
                </td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-neutral-800/50">
                <td className="py-3 px-3 text-gray-900 dark:text-white">Grading Completion Rate</td>
                <td className="py-3 px-3 text-right font-semibold text-gray-900 dark:text-white">{overview?.gradingRate || 0}%</td>
                <td className="py-3 px-3 text-right">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    (overview?.gradingRate || 0) >= 90
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : (overview?.gradingRate || 0) >= 70
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    {(overview?.gradingRate || 0) >= 90 ? 'On Track' : (overview?.gradingRate || 0) >= 70 ? 'Behind' : 'Critical'}
                  </span>
                </td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-neutral-800/50">
                <td className="py-3 px-3 text-gray-900 dark:text-white">Active Agents Being Reviewed</td>
                <td className="py-3 px-3 text-right font-semibold text-gray-900 dark:text-white">{overview?.activeAgents || 0}</td>
                <td className="py-3 px-3 text-right">
                  <span className="px-2 py-0.5 rounded text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                    Unique Agents
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-gray-900 dark:text-white">Feedback Coverage</td>
                <td className="py-3 px-3 text-right font-semibold text-gray-900 dark:text-white">{feedbackStats?.feedbackRate || 0}%</td>
                <td className="py-3 px-3 text-right">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    (feedbackStats?.feedbackRate || 0) >= 80
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : (feedbackStats?.feedbackRate || 0) >= 50
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    {(feedbackStats?.feedbackRate || 0) >= 80 ? 'Complete' : (feedbackStats?.feedbackRate || 0) >= 50 ? 'Partial' : 'Low'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QAAnalyticsDashboard;
