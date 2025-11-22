import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, Users, FileText, Target, Calendar, Award, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const QAAnalyticsDashboard = () => {
  const API_URL = process.env.REACT_APP_API_URL;
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [timeRange, setTimeRange] = useState('30d'); // '7d', '30d', '90d', 'all'

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/qa/analytics`, {
        params: { timeRange },
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
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics Dashboard</h2>
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
        {/* Agent Performance Comparison */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Agent Performance</h3>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">Comparison of agent quality scores</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={agentPerformance || []} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke={colors.secondary} opacity={0.2} />
              <XAxis
                type="number"
                stroke={colors.secondary}
                style={{ fontSize: '12px' }}
                domain={[0, 100]}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke={colors.secondary}
                style={{ fontSize: '11px' }}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avgScore" name="Avg Score" fill={colors.primary} radius={[0, 4, 4, 0]} />
              <Bar dataKey="ticketCount" name="Tickets" fill={colors.purple} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Category Distribution</h3>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">Tickets by category</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryDistribution || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill={colors.primary}
                dataKey="value"
              >
                {(categoryDistribution || []).map((entry, index) => {
                  const colorKeys = Object.keys(colors);
                  const color = colors[colorKeys[index % colorKeys.length]];
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
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

      {/* Feedback Statistics */}
      {feedbackStats && (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Feedback Statistics</h3>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">Common feedback themes and patterns</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                {feedbackStats.avgLength || 0} chars
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-neutral-950 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Most Common Theme</p>
              <p className="text-base font-semibold text-gray-900 dark:text-white">
                {feedbackStats.topTheme || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QAAnalyticsDashboard;
