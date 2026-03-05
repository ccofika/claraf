import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Users, Clock, TrendingUp, TrendingDown, ChevronDown, ChevronRight,
  Activity, Hash, Filter, X, RefreshCw, Zap, Target, ArrowUpRight, ArrowDownRight,
  Sun, Sunset, Moon, Radio
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const SHIFT_COLORS = { morning: '#f59e0b', afternoon: '#f97316', night: '#3b82f6' };
const SHIFT_ICONS = { morning: Sun, afternoon: Sunset, night: Moon };

// ============================================
// SUB-COMPONENTS
// ============================================

const MetricCard = ({ title, value, change, icon: Icon, format = 'number', color = 'emerald' }) => {
  const isPositive = change > 0;
  const isNegative = change < 0;
  // For response time, negative change is good
  const isTimeMetric = format === 'time';
  const isGood = isTimeMetric ? isNegative : isPositive;

  const formatValue = (val) => {
    if (format === 'time') {
      if (val < 60) return `${val}s`;
      if (val < 3600) return `${Math.floor(val / 60)}m ${val % 60}s`;
      return `${Math.floor(val / 3600)}h ${Math.floor((val % 3600) / 60)}m`;
    }
    return val?.toLocaleString() || '0';
  };

  return (
    <div className="bg-neutral-900 border border-[#1E1E28] rounded-xl p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-400">{title}</span>
        <div className={`p-2 rounded-lg bg-${color}-500/10`}>
          <Icon className={`w-4 h-4 text-${color}-400`} />
        </div>
      </div>
      <div className="text-2xl font-bold text-[#E8E9ED]">{formatValue(value)}</div>
      {change !== undefined && change !== 0 && (
        <div className={`flex items-center gap-1 text-xs ${isGood ? 'text-emerald-400' : 'text-red-400'}`}>
          {isGood ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          <span>{Math.abs(change)}% vs prev period</span>
        </div>
      )}
    </div>
  );
};

const ConsistencyBar = ({ value }) => {
  const color = value >= 70 ? 'bg-emerald-500' : value >= 40 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-neutral-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-neutral-400">{value}%</span>
    </div>
  );
};

const ChannelTag = ({ name, org }) => {
  const colors = {
    Mebit: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    Fraud: 'bg-red-500/15 text-red-400 border-red-500/30',
    Payments: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Poker: 'bg-purple-500/15 text-purple-400 border-purple-500/30'
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${colors[org] || 'bg-neutral-800 text-neutral-400 border-neutral-700'}`}>
      {name}
    </span>
  );
};

const ShiftBar = ({ distribution, total }) => {
  if (!total) return null;
  const pcts = {
    morning: Math.round((distribution.morning / total) * 100),
    afternoon: Math.round((distribution.afternoon / total) * 100),
    night: Math.round((distribution.night / total) * 100)
  };
  return (
    <div className="flex gap-0.5 h-3 rounded-full overflow-hidden w-24">
      {['morning', 'afternoon', 'night'].map(s => (
        pcts[s] > 0 && <div key={s} style={{ width: `${pcts[s]}%`, backgroundColor: SHIFT_COLORS[s] }} title={`${s}: ${pcts[s]}%`} />
      ))}
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-xs">
      <p className="text-neutral-300 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

const formatTime = (seconds) => {
  if (!seconds || seconds <= 0) return '-';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
};

// ============================================
// EXPANDABLE AGENT ROW
// ============================================

const AgentDetailRow = ({ agent }) => {
  // Cases by day chart data
  const dayData = Object.entries(agent.casesByDay || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date: date.slice(5), cases: count }));

  return (
    <motion.tr
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
    >
      <td colSpan={8} className="px-4 py-3 bg-neutral-900/50">
        <div className="grid grid-cols-3 gap-4">
          {/* Cases by Day */}
          <div>
            <h4 className="text-xs font-medium text-neutral-400 mb-2">Cases by Day</h4>
            {dayData.length > 0 ? (
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={dayData}>
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#6b7280' }} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="cases" fill="#10b981" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-xs text-neutral-500">No data</p>}
          </div>

          {/* Per-Channel Breakdown */}
          <div>
            <h4 className="text-xs font-medium text-neutral-400 mb-2">Channel Breakdown</h4>
            <div className="space-y-1">
              {(agent.channels || []).map((ch, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <ChannelTag name={ch.name} org={ch.org} />
                </div>
              ))}
            </div>
          </div>

          {/* Shift Distribution */}
          <div>
            <h4 className="text-xs font-medium text-neutral-400 mb-2">Shift Distribution</h4>
            <div className="space-y-1.5">
              {['morning', 'afternoon', 'night'].map(shift => {
                const Icon = SHIFT_ICONS[shift];
                const count = agent.shiftDistribution?.[shift] || 0;
                const pct = agent.totalCases > 0 ? Math.round((count / agent.totalCases) * 100) : 0;
                return (
                  <div key={shift} className="flex items-center gap-2 text-xs">
                    <Icon className="w-3 h-3" style={{ color: SHIFT_COLORS[shift] }} />
                    <span className="text-neutral-400 w-16 capitalize">{shift}</span>
                    <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: SHIFT_COLORS[shift] }} />
                    </div>
                    <span className="text-neutral-500 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Week-over-Week Comparison */}
        {agent.weekComparison && (
          <div className="mt-3 pt-3 border-t border-neutral-800">
            <h4 className="text-xs font-medium text-neutral-400 mb-2">Week-over-Week</h4>
            <div className="flex gap-6 text-xs">
              <div>
                <span className="text-neutral-500">This week: </span>
                <span className="text-[#E8E9ED] font-medium">{agent.weekComparison.thisWeek.cases} cases</span>
                <span className="text-neutral-500 ml-2">({formatTime(agent.weekComparison.thisWeek.avgTime)} avg)</span>
              </div>
              <div>
                <span className="text-neutral-500">Last week: </span>
                <span className="text-[#E8E9ED] font-medium">{agent.weekComparison.lastWeek.cases} cases</span>
                <span className="text-neutral-500 ml-2">({formatTime(agent.weekComparison.lastWeek.avgTime)} avg)</span>
              </div>
              {agent.weekComparison.lastWeek.cases > 0 && (
                <div>
                  {(() => {
                    const diff = agent.weekComparison.thisWeek.cases - agent.weekComparison.lastWeek.cases;
                    const pct = Math.round((diff / agent.weekComparison.lastWeek.cases) * 100);
                    return (
                      <span className={diff >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {diff >= 0 ? '+' : ''}{pct}%
                      </span>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}
      </td>
    </motion.tr>
  );
};

// ============================================
// CHANNELS VIEW
// ============================================

const ChannelsView = ({ channels, loading }) => {
  const [expandedOrg, setExpandedOrg] = useState({});
  const [expandedChannel, setExpandedChannel] = useState(null);

  const toggleOrg = (org) => setExpandedOrg(prev => ({ ...prev, [org]: !prev[org] }));

  if (loading) {
    return <div className="text-center py-12 text-neutral-500">Loading channels...</div>;
  }

  const orgs = Object.entries(channels || {});
  if (!orgs.length) {
    return <div className="text-center py-12 text-neutral-500">No channel data available</div>;
  }

  // Cross-channel comparison data
  const allChannelsList = orgs.flatMap(([org, chs]) => chs.map(ch => ({ ...ch, org })));
  const barData = allChannelsList.map(ch => ({
    name: ch.name,
    cases: ch.totalCases,
    avgTime: ch.avgResponseTime
  }));

  const ORG_COLORS = { Mebit: '#3b82f6', Fraud: '#ef4444', Payments: '#10b981', Poker: '#8b5cf6' };

  return (
    <div className="space-y-4">
      {/* Cross-channel bar chart */}
      {barData.length > 1 && (
        <div className="bg-neutral-900 border border-[#1E1E28] rounded-xl p-4">
          <h3 className="text-sm font-medium text-neutral-400 mb-3">Cross-Channel Volume</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E1E28" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="cases" name="Cases" radius={[4, 4, 0, 0]}>
                {barData.map((entry, i) => {
                  const ch = allChannelsList.find(c => c.name === entry.name);
                  return <Cell key={i} fill={ORG_COLORS[ch?.org] || '#6b7280'} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Org accordion groups */}
      {orgs.map(([org, chs]) => (
        <div key={org} className="bg-neutral-900 border border-[#1E1E28] rounded-xl overflow-hidden">
          <button
            onClick={() => toggleOrg(org)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-800/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              {expandedOrg[org] ? <ChevronDown className="w-4 h-4 text-neutral-500" /> : <ChevronRight className="w-4 h-4 text-neutral-500" />}
              <span className="text-sm font-medium text-[#E8E9ED]">{org}</span>
              <span className="text-xs text-neutral-500">{chs.length} channel{chs.length > 1 ? 's' : ''}</span>
            </div>
            <div className="flex gap-4 text-xs text-neutral-400">
              <span>{chs.reduce((s, c) => s + c.totalCases, 0)} cases</span>
            </div>
          </button>

          <AnimatePresence>
            {expandedOrg[org] && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-t border-[#1E1E28]">
                        <th className="text-left text-xs font-medium text-neutral-500 px-4 py-2">Channel</th>
                        <th className="text-right text-xs font-medium text-neutral-500 px-4 py-2">Cases</th>
                        <th className="text-right text-xs font-medium text-neutral-500 px-4 py-2">Agents</th>
                        <th className="text-right text-xs font-medium text-neutral-500 px-4 py-2">Avg Response</th>
                        <th className="text-right text-xs font-medium text-neutral-500 px-4 py-2">Backlog</th>
                        <th className="w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {chs.map(ch => (
                        <React.Fragment key={ch._id}>
                          <tr
                            className="border-t border-[#1E1E28] hover:bg-neutral-800/30 cursor-pointer"
                            onClick={() => setExpandedChannel(expandedChannel === ch._id ? null : ch._id)}
                          >
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <Hash className="w-3.5 h-3.5 text-neutral-500" />
                                <span className="text-[#E8E9ED]">{ch.name}</span>
                              </div>
                            </td>
                            <td className="text-right px-4 py-2.5 text-[#E8E9ED] font-medium">{ch.totalCases}</td>
                            <td className="text-right px-4 py-2.5 text-neutral-400">{ch.activeAgents}</td>
                            <td className="text-right px-4 py-2.5 text-neutral-400">{formatTime(ch.avgResponseTime)}</td>
                            <td className="text-right px-4 py-2.5">
                              <span className={ch.backlog > 0 ? 'text-amber-400' : 'text-neutral-500'}>{ch.backlog}</span>
                            </td>
                            <td className="px-2">
                              {expandedChannel === ch._id ? <ChevronDown className="w-3 h-3 text-neutral-500" /> : <ChevronRight className="w-3 h-3 text-neutral-500" />}
                            </td>
                          </tr>
                          {/* Expanded: agent cards + daily sparkline */}
                          <AnimatePresence>
                            {expandedChannel === ch._id && (
                              <motion.tr
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                              >
                                <td colSpan={6} className="px-4 py-3 bg-neutral-900/50">
                                  <div className="grid grid-cols-2 gap-4">
                                    {/* Agent cards */}
                                    <div>
                                      <h4 className="text-xs font-medium text-neutral-400 mb-2">Agents</h4>
                                      <div className="space-y-1">
                                        {(ch.agents || []).slice(0, 10).map((a, i) => (
                                          <div key={i} className="flex items-center justify-between text-xs bg-neutral-800/50 rounded px-2 py-1">
                                            <span className="text-[#E8E9ED]">{a.name}</span>
                                            <div className="flex gap-3 text-neutral-400">
                                              <span>{a.cases} cases</span>
                                              <span>{formatTime(a.avgResponseTime)}</span>
                                            </div>
                                          </div>
                                        ))}
                                        {!ch.agents?.length && <p className="text-xs text-neutral-500">No agents yet</p>}
                                      </div>
                                    </div>
                                    {/* Daily volume sparkline */}
                                    <div>
                                      <h4 className="text-xs font-medium text-neutral-400 mb-2">Daily Volume</h4>
                                      {Object.keys(ch.dailyVolume || {}).length > 0 ? (
                                        <ResponsiveContainer width="100%" height={80}>
                                          <BarChart data={Object.entries(ch.dailyVolume).sort(([a], [b]) => a.localeCompare(b)).map(([d, v]) => ({ date: d.slice(5), vol: v }))}>
                                            <XAxis dataKey="date" tick={{ fontSize: 8, fill: '#6b7280' }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="vol" name="Cases" fill={ORG_COLORS[org] || '#6b7280'} radius={[2, 2, 0, 0]} />
                                          </BarChart>
                                        </ResponsiveContainer>
                                      ) : <p className="text-xs text-neutral-500">No data</p>}
                                    </div>
                                  </div>
                                </td>
                              </motion.tr>
                            )}
                          </AnimatePresence>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const KYCGoals = () => {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('agents'); // 'agents' | 'channels'
  const [period, setPeriod] = useState('7d');
  const [overview, setOverview] = useState(null);
  const [agents, setAgents] = useState([]);
  const [channels, setChannels] = useState({});
  const [expandedAgent, setExpandedAgent] = useState(null);
  const pollingRef = useRef(null);

  // Filters
  const [channelFilter, setChannelFilter] = useState([]);
  const [agentFilter, setAgentFilter] = useState([]);
  const [allChannels, setAllChannels] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const getDateRange = useCallback(() => {
    const now = new Date();
    const days = period === '7d' ? 7 : period === '14d' ? 14 : period === '30d' ? 30 : 90;
    const start = new Date(now);
    start.setDate(start.getDate() - days);

    const fmt = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    };
    return { startDate: fmt(start), endDate: fmt(now) };
  }, [period]);

  const buildParams = useCallback(() => {
    const { startDate, endDate } = getDateRange();
    const params = { startDate, endDate };
    if (channelFilter.length) params.channelIds = channelFilter;
    if (agentFilter.length) params.agentIds = agentFilter;
    return params;
  }, [getDateRange, channelFilter, agentFilter]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // Fetch all channels for filter dropdown
  const fetchConfig = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/kyc-goals/config`, getAuthHeaders());
      if (res.data.success) {
        setAllChannels(res.data.channels || []);
      }
    } catch (err) {
      console.error('Error fetching config:', err);
    }
  }, []);

  const fetchData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const params = buildParams();

      const [overviewRes, agentsRes, channelsRes] = await Promise.all([
        axios.get(`${API_URL}/api/kyc-goals/overview`, { ...getAuthHeaders(), params }),
        axios.get(`${API_URL}/api/kyc-goals/agents`, { ...getAuthHeaders(), params }),
        axios.get(`${API_URL}/api/kyc-goals/channels`, { ...getAuthHeaders(), params })
      ]);

      if (overviewRes.data.success) setOverview(overviewRes.data.data);
      if (agentsRes.data.success) setAgents(agentsRes.data.agents);
      if (channelsRes.data.success) setChannels(channelsRes.data.channels);
    } catch (err) {
      console.error('Error fetching KYC Goals data:', err);
      if (err.response?.status === 403) {
        toast.error('Access denied to KYC Goals');
      } else {
        toast.error('Failed to load KYC Goals data');
      }
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Always-on live polling (30s)
  useEffect(() => {
    pollingRef.current = setInterval(() => fetchData(false), 30000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchData]);

  const removeChannelFilter = (id) => setChannelFilter(prev => prev.filter(c => c !== id));
  const removeAgentFilter = (id) => setAgentFilter(prev => prev.filter(a => a !== id));

  return (
    <div className="min-h-screen bg-[#0C0C10] text-[#E8E9ED]">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">KYC Goals</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-medium">
              BETA
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Period buttons */}
            {['7d', '14d', '30d', '90d'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  period === p
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-neutral-800/50 text-neutral-400 border border-transparent hover:bg-neutral-800'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => fetchData()}
              className="p-1.5 rounded-lg bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 transition-colors ml-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
              showFilters ? 'bg-neutral-700 text-white' : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800'
            }`}
          >
            <Filter className="w-3 h-3" />
            Filters
          </button>

          {/* Active chips */}
          {channelFilter.map(id => {
            const ch = allChannels.find(c => c.slackChannelId === id);
            return (
              <span key={id} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/15 text-blue-400 text-xs border border-blue-500/30">
                #{ch?.name || id}
                <X className="w-3 h-3 cursor-pointer" onClick={() => removeChannelFilter(id)} />
              </span>
            );
          })}
          {agentFilter.map(id => {
            const ag = agents.find(a => a._id === id);
            return (
              <span key={id} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/15 text-purple-400 text-xs border border-purple-500/30">
                {ag?.name || id}
                <X className="w-3 h-3 cursor-pointer" onClick={() => removeAgentFilter(id)} />
              </span>
            );
          })}
          {(channelFilter.length > 0 || agentFilter.length > 0) && (
            <button
              onClick={() => { setChannelFilter([]); setAgentFilter([]); }}
              className="text-xs text-neutral-500 hover:text-neutral-300"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Filter dropdowns */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-4 bg-neutral-900 border border-[#1E1E28] rounded-xl p-4">
                {/* Channel multi-select */}
                <div>
                  <label className="text-xs font-medium text-neutral-400 mb-2 block">Channels</label>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {/* Group by org */}
                    {Object.entries(
                      allChannels.reduce((acc, ch) => {
                        (acc[ch.organization] = acc[ch.organization] || []).push(ch);
                        return acc;
                      }, {})
                    ).map(([org, chs]) => (
                      <div key={org}>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-0.5">{org}</p>
                        {chs.map(ch => (
                          <label key={ch.slackChannelId} className="flex items-center gap-2 text-xs text-neutral-300 py-0.5 cursor-pointer hover:text-white">
                            <input
                              type="checkbox"
                              checked={channelFilter.includes(ch.slackChannelId)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setChannelFilter(prev => [...prev, ch.slackChannelId]);
                                } else {
                                  removeChannelFilter(ch.slackChannelId);
                                }
                              }}
                              className="rounded border-neutral-600 bg-neutral-800"
                            />
                            #{ch.name}
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Agent multi-select */}
                <div>
                  <label className="text-xs font-medium text-neutral-400 mb-2 block">Agents</label>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {agents.slice(0, 30).map(ag => (
                      <label key={ag._id} className="flex items-center gap-2 text-xs text-neutral-300 py-0.5 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={agentFilter.includes(ag._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAgentFilter(prev => [...prev, ag._id]);
                            } else {
                              removeAgentFilter(ag._id);
                            }
                          }}
                          className="rounded border-neutral-600 bg-neutral-800"
                        />
                        {ag.name} ({ag.totalCases})
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View toggle + live indicator */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 bg-neutral-800/50 rounded-lg p-0.5">
            {[
              { key: 'agents', label: 'By Agents', icon: Users },
              { key: 'channels', label: 'By Channels', icon: Hash }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  view === key
                    ? 'bg-neutral-700 text-white'
                    : 'text-neutral-400 hover:text-neutral-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Radio className="w-3 h-3 animate-pulse" />
            Live
          </div>
        </div>

        {/* Summary Cards */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Total Cases" value={overview.totalCases.value} change={overview.totalCases.change} icon={BarChart3} color="emerald" />
            <MetricCard title="Avg Response Time" value={overview.avgResponseTime.value} change={overview.avgResponseTime.change} icon={Clock} format="time" color="amber" />
            <MetricCard title="Active Agents" value={overview.activeAgents.value} change={overview.activeAgents.change} icon={Users} color="blue" />
            <MetricCard title="Cases / Agent" value={overview.casesPerAgent.value} change={overview.casesPerAgent.change} icon={Target} color="purple" />
          </div>
        )}

        {/* Main content */}
        {view === 'agents' ? (
          <div className="bg-neutral-900 border border-[#1E1E28] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1E1E28]">
                    <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3 w-10">#</th>
                    <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">Agent</th>
                    <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">Channels</th>
                    <th className="text-right text-xs font-medium text-neutral-500 px-4 py-3">Cases</th>
                    <th className="text-right text-xs font-medium text-neutral-500 px-4 py-3">Avg Response</th>
                    <th className="text-right text-xs font-medium text-neutral-500 px-4 py-3">Fastest</th>
                    <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">Consistency</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {loading && !agents.length ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-neutral-500">Loading agents...</td>
                    </tr>
                  ) : !agents.length ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-neutral-500">No agent data available</td>
                    </tr>
                  ) : (
                    agents.map((agent) => (
                      <React.Fragment key={agent._id}>
                        <tr
                          className="border-t border-[#1E1E28] hover:bg-neutral-800/30 cursor-pointer transition-colors"
                          onClick={() => setExpandedAgent(expandedAgent === agent._id ? null : agent._id)}
                        >
                          <td className="px-4 py-2.5 text-neutral-500 text-xs">{agent.rank}</td>
                          <td className="px-4 py-2.5">
                            <span className="text-[#E8E9ED] font-medium">{agent.name}</span>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex flex-wrap gap-1">
                              {(agent.channels || []).map((ch, i) => (
                                <ChannelTag key={i} name={ch.name} org={ch.org} />
                              ))}
                            </div>
                          </td>
                          <td className="text-right px-4 py-2.5 text-[#E8E9ED] font-medium">{agent.totalCases}</td>
                          <td className="text-right px-4 py-2.5 text-neutral-400">{formatTime(agent.avgResponseTime)}</td>
                          <td className="text-right px-4 py-2.5 text-emerald-400">{formatTime(agent.fastestResponse)}</td>
                          <td className="px-4 py-2.5">
                            <ConsistencyBar value={agent.consistency} />
                          </td>
                          <td className="px-2">
                            {expandedAgent === agent._id ? <ChevronDown className="w-3 h-3 text-neutral-500" /> : <ChevronRight className="w-3 h-3 text-neutral-500" />}
                          </td>
                        </tr>
                        <AnimatePresence>
                          {expandedAgent === agent._id && <AgentDetailRow agent={agent} />}
                        </AnimatePresence>
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <ChannelsView channels={channels} loading={loading && !Object.keys(channels).length} />
        )}
      </div>
    </div>
  );
};

export default KYCGoals;
