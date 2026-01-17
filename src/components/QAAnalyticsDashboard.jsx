import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, FileText, Target, Award, AlertCircle, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  staggerContainer,
  staggerItem,
  cardVariants,
  metricCardVariants,
  chartContainer,
  duration,
  easing
} from '../utils/animations';

const QAAnalyticsDashboard = () => {
  const API_URL = process.env.REACT_APP_API_URL;
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedGrader, setSelectedGrader] = useState(null);
  const [graders, setGraders] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

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

  const COLORS = {
    primary: '#171717',
    secondary: '#737373',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    blue: '#3b82f6',
  };

  const DARK_COLORS = {
    primary: '#fafafa',
    secondary: '#a3a3a3',
    success: '#4ade80',
    warning: '#fbbf24',
    danger: '#f87171',
    purple: '#a78bfa',
    blue: '#60a5fa',
  };

  const isDark = document.documentElement.classList.contains('dark');
  const colors = isDark ? DARK_COLORS : COLORS;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 shadow-lg"
        >
          <p className="text-sm font-medium text-neutral-900 dark:text-white mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs text-neutral-600 dark:text-neutral-400">
              <span style={{ color: entry.color }}>{entry.name}:</span> {entry.value}
            </p>
          ))}
        </motion.div>
      );
    }
    return null;
  };

  const MetricCard = ({ title, value, change, icon: Icon, trend, index }) => (
    <motion.div
      variants={metricCardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">{title}</p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05, duration: duration.normal }}
            className="text-2xl font-semibold text-neutral-900 dark:text-white"
          >
            {value}
          </motion.p>
          {change !== undefined && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              className={`flex items-center gap-1 mt-2 text-xs ${
                trend === 'up' ? 'text-green-600 dark:text-green-400' :
                trend === 'down' ? 'text-red-600 dark:text-red-400' :
                'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
              <span>{change > 0 ? '+' : ''}{change}% from last period</span>
            </motion.div>
          )}
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 + index * 0.05, type: 'spring', stiffness: 200 }}
          className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg"
        >
          <Icon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
        </motion.div>
      </div>
    </motion.div>
  );

  const ChartCard = ({ title, subtitle, children, className = '' }) => (
    <motion.div
      variants={cardVariants}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, amount: 0.2 }}
      className={`bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 ${className}`}
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{title}</h3>
        {subtitle && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{subtitle}</p>}
      </div>
      <motion.div variants={chartContainer} initial="initial" animate="animate">
        {children}
      </motion.div>
    </motion.div>
  );

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="h-32 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse"
          />
        ))}
      </motion.div>
    );
  }

  if (!analyticsData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12 text-neutral-500"
      >
        <AlertCircle className="w-12 h-12 mb-3" />
        <p className="text-sm">No analytics data available</p>
      </motion.div>
    );
  }

  const { overview, qualityTrend, agentPerformance, categoryDistribution, weeklyVolume, scoreDistribution, feedbackStats } = analyticsData;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Filters Row */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Analytics Dashboard</h2>
        <div className="flex flex-wrap items-center gap-3">
          <AnimatePresence>
            {isAdmin && graders.length > 0 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                <select
                  value={selectedGrader || ''}
                  onChange={(e) => setSelectedGrader(e.target.value || null)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all"
                >
                  <option value="">My Analytics</option>
                  <option value="all">All Graders</option>
                  {graders.map((grader) => (
                    <option key={grader._id} value={grader._id}>{grader.name || grader.email}</option>
                  ))}
                </select>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-1">
            {[
              { label: '7 Days', value: '7d' },
              { label: '30 Days', value: '30d' },
              { label: '90 Days', value: '90d' },
              { label: 'All Time', value: 'all' }
            ].map((option) => (
              <motion.button
                key={option.value}
                onClick={() => setTimeRange(option.value)}
                whileTap={{ scale: 0.95 }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  timeRange === option.value
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                {option.label}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Overview Metrics */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Tickets" value={overview?.totalTickets || 0} change={overview?.ticketsChange} trend={overview?.ticketsChange > 0 ? 'up' : overview?.ticketsChange < 0 ? 'down' : 'neutral'} icon={FileText} index={0} />
        <MetricCard title="Avg Quality Score" value={`${overview?.avgQualityScore || 0}%`} change={overview?.qualityChange} trend={overview?.qualityChange > 0 ? 'up' : overview?.qualityChange < 0 ? 'down' : 'neutral'} icon={Target} index={1} />
        <MetricCard title="Pending Review" value={(overview?.totalTickets || 0) - (overview?.gradedTickets || 0)} icon={AlertCircle} index={2} />
        <MetricCard title="Grading Rate" value={`${overview?.gradingRate || 0}%`} change={overview?.gradingRateChange} trend={overview?.gradingRateChange > 0 ? 'up' : overview?.gradingRateChange < 0 ? 'down' : 'neutral'} icon={Award} index={3} />
      </motion.div>

      {/* Quality Trend */}
      <ChartCard title="Quality Score Trend" subtitle="Average quality scores over time">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={qualityTrend || []}>
            <defs>
              <linearGradient id="colorQuality" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.primary} stopOpacity={0.2} />
                <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.secondary} opacity={0.15} />
            <XAxis dataKey="date" stroke={colors.secondary} style={{ fontSize: '12px' }} />
            <YAxis stroke={colors.secondary} style={{ fontSize: '12px' }} domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="avgScore" name="Avg Quality" stroke={colors.primary} strokeWidth={2} fillOpacity={1} fill="url(#colorQuality)" />
            <Area type="monotone" dataKey="targetScore" name="Target" stroke={colors.warning} strokeWidth={2} strokeDasharray="5 5" fillOpacity={0} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Performance */}
        <ChartCard title="Agent Performance" subtitle="Quality scores by agent">
          {agentPerformance && agentPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800">
                    <th className="text-left py-2 px-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">Agent</th>
                    <th className="text-center py-2 px-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">Tickets</th>
                    <th className="text-center py-2 px-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">Avg Score</th>
                    <th className="text-right py-2 px-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {agentPerformance.slice(0, 10).map((agent, index) => (
                    <motion.tr key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }} className="border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="py-2 px-2 text-neutral-900 dark:text-white font-medium truncate max-w-[150px]" title={agent.name}>{agent.name}</td>
                      <td className="py-2 px-2 text-center text-neutral-600 dark:text-neutral-400">{agent.ticketCount}</td>
                      <td className="py-2 px-2 text-center">
                        <span className={`font-semibold ${agent.avgScore >= 80 ? 'text-green-600 dark:text-green-400' : agent.avgScore >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>{agent.avgScore}%</span>
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${agent.avgScore}%` }} transition={{ delay: 0.2 + index * 0.05, duration: 0.5, ease: easing.smooth }} className={`h-full rounded-full ${agent.avgScore >= 80 ? 'bg-green-500' : agent.avgScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {agentPerformance.length > 10 && <p className="text-xs text-neutral-500 mt-2 text-center">Showing top 10 of {agentPerformance.length} agents</p>}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-neutral-500"><p className="text-sm">No agent performance data</p></div>
          )}
        </ChartCard>

        {/* Category Distribution */}
        <ChartCard title="Category Distribution" subtitle="Tickets by category">
          {categoryDistribution && categoryDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryDistribution} cx="50%" cy="50%" labelLine={false} label={(entry) => `${entry.name}: ${entry.value}`} outerRadius={80} fill={colors.primary} dataKey="value">
                  {categoryDistribution.map((entry, index) => {
                    const colorKeys = Object.keys(colors);
                    return <Cell key={`cell-${index}`} fill={colors[colorKeys[index % colorKeys.length]]} />;
                  })}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-neutral-500"><p className="text-sm">No category data</p></div>
          )}
        </ChartCard>
      </div>

      {/* Weekly Volume */}
      <ChartCard title="Weekly Ticket Volume" subtitle="Tickets created and graded per week">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={weeklyVolume || []}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.secondary} opacity={0.15} />
            <XAxis dataKey="week" stroke={colors.secondary} style={{ fontSize: '12px' }} />
            <YAxis stroke={colors.secondary} style={{ fontSize: '12px' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="created" name="Created" fill={colors.blue} radius={[4, 4, 0, 0]} />
            <Bar dataKey="graded" name="Graded" fill={colors.success} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Score Distribution & Top/Bottom Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Score Distribution" subtitle="Distribution of quality scores">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={scoreDistribution || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.secondary} opacity={0.15} />
              <XAxis dataKey="range" stroke={colors.secondary} style={{ fontSize: '12px' }} />
              <YAxis stroke={colors.secondary} style={{ fontSize: '12px' }} />
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
        </ChartCard>

        <ChartCard title="Top & Bottom Performers" subtitle="Best and worst performing agents">
          {agentPerformance && agentPerformance.length > 0 ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Top Performers</p>
                <div className="space-y-2">
                  {agentPerformance.slice(0, 3).map((agent, index) => (
                    <motion.div key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="flex items-center justify-between py-2 px-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <span className="text-sm text-neutral-900 dark:text-white">{agent.name}</span>
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">{agent.avgScore}%</span>
                    </motion.div>
                  ))}
                </div>
              </div>
              {agentPerformance.length > 3 && (
                <div>
                  <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-2 flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Needs Improvement</p>
                  <div className="space-y-2">
                    {agentPerformance.slice(-3).reverse().map((agent, index) => (
                      <motion.div key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + index * 0.05 }} className="flex items-center justify-between py-2 px-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <span className="text-sm text-neutral-900 dark:text-white">{agent.name}</span>
                        <span className="text-sm font-semibold text-red-600 dark:text-red-400">{agent.avgScore}%</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-neutral-500"><p className="text-sm">No performance data</p></div>
          )}
        </ChartCard>
      </div>

      {/* Feedback Statistics */}
      <AnimatePresence>
        {feedbackStats && (
          <ChartCard title="Feedback Statistics" subtitle="Common feedback themes and patterns">
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Tickets with Feedback', value: feedbackStats.withFeedback || 0, sub: `${feedbackStats.feedbackRate || 0}% of graded tickets` },
                { label: 'Avg Feedback Length', value: feedbackStats.avgLength || 0, sub: 'characters' },
                { label: 'Graded Tickets', value: overview?.gradedTickets || 0, sub: `of ${overview?.totalTickets || 0} total` },
                { label: 'Pending Review', value: (overview?.totalTickets || 0) - (overview?.gradedTickets || 0), sub: 'tickets to grade' }
              ].map((stat, index) => (
                <motion.div key={stat.label} variants={staggerItem} className="p-4 bg-neutral-50 dark:bg-neutral-950 rounded-xl">
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">{stat.label}</p>
                  <p className="text-2xl font-semibold text-neutral-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-neutral-500 mt-1">{stat.sub}</p>
                </motion.div>
              ))}
            </motion.div>
          </ChartCard>
        )}
      </AnimatePresence>

      {/* Summary Statistics */}
      <ChartCard title="Summary Statistics" subtitle="Key metrics at a glance">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800">
                <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">Metric</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">Value</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { metric: 'Total Tickets Reviewed', value: overview?.totalTickets || 0, status: timeRange === 'all' ? 'All Time' : `Last ${timeRange.replace('d', ' days')}`, statusClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
                { metric: 'Average Quality Score', value: `${overview?.avgQualityScore || 0}%`, status: (overview?.avgQualityScore || 0) >= 80 ? 'Excellent' : (overview?.avgQualityScore || 0) >= 60 ? 'Good' : 'Needs Work', statusClass: (overview?.avgQualityScore || 0) >= 80 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : (overview?.avgQualityScore || 0) >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
                { metric: 'Grading Completion Rate', value: `${overview?.gradingRate || 0}%`, status: (overview?.gradingRate || 0) >= 90 ? 'On Track' : (overview?.gradingRate || 0) >= 70 ? 'Behind' : 'Critical', statusClass: (overview?.gradingRate || 0) >= 90 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : (overview?.gradingRate || 0) >= 70 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
                { metric: 'Pending Review', value: (overview?.totalTickets || 0) - (overview?.gradedTickets || 0), status: (overview?.totalTickets || 0) - (overview?.gradedTickets || 0) === 0 ? 'All Done' : 'Awaiting', statusClass: (overview?.totalTickets || 0) - (overview?.gradedTickets || 0) === 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' },
                { metric: 'Feedback Coverage', value: `${feedbackStats?.feedbackRate || 0}%`, status: (feedbackStats?.feedbackRate || 0) >= 80 ? 'Complete' : (feedbackStats?.feedbackRate || 0) >= 50 ? 'Partial' : 'Low', statusClass: (feedbackStats?.feedbackRate || 0) >= 80 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : (feedbackStats?.feedbackRate || 0) >= 50 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' }
              ].map((row, index) => (
                <motion.tr key={row.metric} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }} className="border-b border-neutral-100 dark:border-neutral-800/50">
                  <td className="py-3 px-3 text-neutral-900 dark:text-white">{row.metric}</td>
                  <td className="py-3 px-3 text-right font-semibold text-neutral-900 dark:text-white">{row.value}</td>
                  <td className="py-3 px-3 text-right"><span className={`px-2 py-0.5 rounded-md text-xs font-medium ${row.statusClass}`}>{row.status}</span></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </motion.div>
  );
};

export default QAAnalyticsDashboard;
