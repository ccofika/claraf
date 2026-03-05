import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Users, Clock, TrendingUp, TrendingDown, ChevronDown, ChevronRight,
  Activity, Hash, Filter, X, RefreshCw, Target, ArrowUpRight, ArrowDownRight,
  Sun, Sunset, Moon, Radio, Calendar, Search, CheckCircle2, AlertCircle,
  Zap, Trophy, ChevronUp, Loader2, Eye
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, Legend
} from 'recharts';
import { DatePicker } from '../components/ui/date-picker';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// ============================================
// DESIGN TOKENS (matching TL/QA pages)
// ============================================

const SHIFT_COLORS = { morning: '#f59e0b', afternoon: '#f97316', night: '#3b82f6' };
const SHIFT_ICONS = { morning: Sun, afternoon: Sunset, night: Moon };

const ORG_COLORS = {
  'Stake.com': { dot: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20', fill: '#3b82f6' },
  'Stake.us': { dot: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-200 dark:border-purple-500/20', fill: '#8b5cf6' },
  'Stake Brazil': { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', fill: '#10b981' },
  'Stake Denmark': { dot: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/20', fill: '#f97316' },
  'Stake Italy': { dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', fill: '#f59e0b' },
};

const CHANNEL_TAG_COLORS = {
  'Stake.com': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
  'Stake.us': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
  'Stake Brazil': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  'Stake Denmark': 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20',
  'Stake Italy': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
};

const RESPONSE_TIME_THRESHOLDS = { good: 180, warn: 300 }; // seconds

const getResponseColor = (seconds) => {
  if (!seconds || seconds <= 0) return 'text-gray-400 dark:text-[#5B5D67]';
  if (seconds < RESPONSE_TIME_THRESHOLDS.good) return 'text-emerald-600 dark:text-emerald-400';
  if (seconds < RESPONSE_TIME_THRESHOLDS.warn) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
};

const getResponseDot = (seconds) => {
  if (!seconds || seconds <= 0) return 'bg-gray-300 dark:bg-[#3A3A45]';
  if (seconds < RESPONSE_TIME_THRESHOLDS.good) return 'bg-emerald-500';
  if (seconds < RESPONSE_TIME_THRESHOLDS.warn) return 'bg-amber-500';
  return 'bg-red-500';
};

// ============================================
// HELPERS
// ============================================

const formatTime = (seconds) => {
  if (!seconds || seconds <= 0) return '-';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
};

const formatTimeShort = (seconds) => {
  if (!seconds || seconds <= 0) return '-';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
};

const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const getInitialColor = (name) => {
  const colors = [
    'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
    'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400',
    'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400',
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

const fmtDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

// ============================================
// SUB-COMPONENTS
// ============================================

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1A1A21] border border-gray-200 dark:border-[#252530] rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-gray-500 dark:text-[#6B6D77] mb-1 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

const MetricCard = ({ title, value, subtitle, change, icon: Icon, format = 'number', color = 'blue' }) => {
  const isTimeMetric = format === 'time';
  const isGood = change !== undefined && change !== 0
    ? (isTimeMetric ? change < 0 : change > 0)
    : null;

  const colorMap = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
  };

  const formatValue = (val) => {
    if (format === 'time') return formatTime(val);
    return val?.toLocaleString() || '0';
  };

  return (
    <div className="bg-white dark:bg-[#111116] border border-gray-200 dark:border-[#1E1E28] rounded-lg p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-400 dark:text-[#5B5D67] uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-lg ${colorMap[color] || colorMap.blue}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-[#E8E9ED]">{formatValue(value)}</div>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-[#6B6D77] mt-1">{subtitle}</p>
      )}
      {change !== undefined && change !== 0 && (
        <div className={`flex items-center gap-1 text-xs mt-2 ${isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          {isGood ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          <span>{Math.abs(change)}% vs prev period</span>
        </div>
      )}
    </div>
  );
};

const ChannelTag = ({ name, org }) => {
  const colorClass = CHANNEL_TAG_COLORS[org] || 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-[#1E1E28] dark:text-[#6B6D77] dark:border-[#252530]';
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${colorClass}`}>
      {name}
    </span>
  );
};

const ShiftBar = ({ distribution, total }) => {
  if (!total) return <span className="text-gray-300 dark:text-[#3A3A45]">-</span>;
  const pcts = {
    morning: Math.round((distribution.morning / total) * 100),
    afternoon: Math.round((distribution.afternoon / total) * 100),
    night: Math.round((distribution.night / total) * 100)
  };
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-px h-2.5 rounded-full overflow-hidden w-16 bg-gray-100 dark:bg-[#1E1E28]">
        {['morning', 'afternoon', 'night'].map(s => (
          pcts[s] > 0 && <div key={s} style={{ width: `${pcts[s]}%`, backgroundColor: SHIFT_COLORS[s] }} title={`${s}: ${pcts[s]}%`} />
        ))}
      </div>
      <span className="text-[10px] text-gray-400 dark:text-[#5B5D67] tabular-nums">
        {distribution.morning}/{distribution.afternoon}/{distribution.night}
      </span>
    </div>
  );
};

const MiniSparkline = ({ data, color = '#3b82f6' }) => {
  if (!data || data.length === 0) return <span className="text-gray-300 dark:text-[#3A3A45]">-</span>;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-px h-5 w-16">
      {data.slice(-7).map((d, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm min-h-[2px]"
          style={{ height: `${Math.max((d.value / max) * 100, 8)}%`, backgroundColor: color, opacity: 0.7 + (i / 10) }}
          title={`${d.label}: ${d.value}`}
        />
      ))}
    </div>
  );
};

// ============================================
// FILTER BAR
// ============================================

const FilterBar = ({
  period, setPeriod, startDate, setStartDate, endDate, setEndDate,
  allChannels, channelFilter, setChannelFilter, agents, agentFilter, setAgentFilter,
  showFilters, setShowFilters
}) => {
  const [agentSearch, setAgentSearch] = useState('');

  const orgGroups = useMemo(() => {
    return allChannels.reduce((acc, ch) => {
      (acc[ch.organization] = acc[ch.organization] || []).push(ch);
      return acc;
    }, {});
  }, [allChannels]);

  const filteredAgents = useMemo(() => {
    if (!agentSearch) return agents.slice(0, 50);
    const q = agentSearch.toLowerCase();
    return agents.filter(a => a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q)).slice(0, 30);
  }, [agents, agentSearch]);

  const toggleChannelOrg = (org) => {
    const orgChannelIds = (orgGroups[org] || []).map(c => c.slackChannelId);
    const allSelected = orgChannelIds.every(id => channelFilter.includes(id));
    if (allSelected) {
      setChannelFilter(prev => prev.filter(id => !orgChannelIds.includes(id)));
    } else {
      setChannelFilter(prev => [...new Set([...prev, ...orgChannelIds])]);
    }
  };

  const activeFilterCount = channelFilter.length + agentFilter.length;

  return (
    <div className="space-y-3">
      {/* Period selector row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick periods */}
          <div className="flex items-center gap-0.5">
            {['7d', '14d', '30d', '90d'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  period === p
                    ? 'bg-gray-900 dark:bg-[#E8E9ED] text-white dark:text-[#0C0C10]'
                    : 'text-gray-500 dark:text-[#6B6D77] hover:text-gray-700 dark:hover:text-[#A0A2AC] hover:bg-gray-50 dark:hover:bg-[#1A1A21]'
                }`}
              >
                {p}
              </button>
            ))}
            {['This Month', 'This Q'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors hidden sm:block ${
                  period === p
                    ? 'bg-gray-900 dark:bg-[#E8E9ED] text-white dark:text-[#0C0C10]'
                    : 'text-gray-500 dark:text-[#6B6D77] hover:text-gray-700 dark:hover:text-[#A0A2AC] hover:bg-gray-50 dark:hover:bg-[#1A1A21]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-gray-200 dark:bg-[#252530] hidden sm:block" />

          {/* Custom date range */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-[#5B5D67]" />
            <DatePicker
              value={startDate}
              onChange={(v) => { setStartDate(v); setPeriod('custom'); }}
              placeholder="Start"
              size="sm"
            />
            <span className="text-gray-400 dark:text-[#5B5D67] text-xs">to</span>
            <DatePicker
              value={endDate}
              onChange={(v) => { setEndDate(v); setPeriod('custom'); }}
              placeholder="End"
              size="sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'bg-gray-100 dark:bg-[#1E1E28] text-gray-900 dark:text-[#E8E9ED]'
                : 'text-gray-500 dark:text-[#6B6D77] hover:text-gray-700 dark:hover:text-[#A0A2AC] hover:bg-gray-50 dark:hover:bg-[#1A1A21]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {channelFilter.map(id => {
            const ch = allChannels.find(c => c.slackChannelId === id);
            return (
              <span key={id} className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
                #{ch?.name || id}
                <X className="w-3 h-3 cursor-pointer hover:opacity-70" onClick={() => setChannelFilter(prev => prev.filter(c => c !== id))} />
              </span>
            );
          })}
          {agentFilter.map(id => {
            const ag = agents.find(a => a._id === id);
            return (
              <span key={id} className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20">
                {ag?.name || id}
                <X className="w-3 h-3 cursor-pointer hover:opacity-70" onClick={() => setAgentFilter(prev => prev.filter(a => a !== id))} />
              </span>
            );
          })}
          <button
            onClick={() => { setChannelFilter([]); setAgentFilter([]); }}
            className="text-xs text-gray-400 dark:text-[#5B5D67] hover:text-gray-700 dark:hover:text-[#A0A2AC]"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Expanded filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-gray-50 dark:bg-[#111116] border border-gray-200 dark:border-[#1E1E28] rounded-lg p-4">
              {/* Channels by org */}
              <div>
                <label className="text-xs font-medium text-gray-400 dark:text-[#5B5D67] uppercase tracking-wider mb-3 block">
                  Channels by Organization
                </label>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {Object.entries(orgGroups).map(([org, chs]) => {
                    const orgChannelIds = chs.map(c => c.slackChannelId);
                    const allSelected = orgChannelIds.every(id => channelFilter.includes(id));
                    const someSelected = orgChannelIds.some(id => channelFilter.includes(id));
                    return (
                      <div key={org}>
                        <label className="flex items-center gap-2 cursor-pointer mb-1">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                            onChange={() => toggleChannelOrg(org)}
                            className="rounded border-gray-300 dark:border-[#3A3A45] text-blue-600 focus:ring-blue-500 bg-white dark:bg-[#1A1A21]"
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-[#A0A2AC]">{org}</span>
                          <span className="text-[10px] text-gray-400 dark:text-[#5B5D67]">{chs.length}ch</span>
                        </label>
                        <div className="ml-5 space-y-0.5">
                          {chs.map(ch => (
                            <label key={ch.slackChannelId} className="flex items-center gap-2 text-xs text-gray-600 dark:text-[#A0A2AC] py-0.5 cursor-pointer hover:text-gray-900 dark:hover:text-[#E8E9ED]">
                              <input
                                type="checkbox"
                                checked={channelFilter.includes(ch.slackChannelId)}
                                onChange={(e) => {
                                  if (e.target.checked) setChannelFilter(prev => [...prev, ch.slackChannelId]);
                                  else setChannelFilter(prev => prev.filter(id => id !== ch.slackChannelId));
                                }}
                                className="rounded border-gray-300 dark:border-[#3A3A45] text-blue-600 focus:ring-blue-500 bg-white dark:bg-[#1A1A21]"
                              />
                              #{ch.name}
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Agents with search */}
              <div>
                <label className="text-xs font-medium text-gray-400 dark:text-[#5B5D67] uppercase tracking-wider mb-3 block">
                  Agents
                </label>
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-[#5B5D67]" />
                  <input
                    type="text"
                    value={agentSearch}
                    onChange={(e) => setAgentSearch(e.target.value)}
                    placeholder="Search agents..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-gray-200 dark:border-[#252530] bg-white dark:bg-[#1A1A21] text-gray-900 dark:text-[#E8E9ED] placeholder-gray-400 dark:placeholder-[#5B5D67] focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
                <div className="space-y-0.5 max-h-40 overflow-y-auto pr-1">
                  {filteredAgents.map(ag => (
                    <label key={ag._id} className="flex items-center gap-2 text-xs text-gray-600 dark:text-[#A0A2AC] py-0.5 cursor-pointer hover:text-gray-900 dark:hover:text-[#E8E9ED]">
                      <input
                        type="checkbox"
                        checked={agentFilter.includes(ag._id)}
                        onChange={(e) => {
                          if (e.target.checked) setAgentFilter(prev => [...prev, ag._id]);
                          else setAgentFilter(prev => prev.filter(id => id !== ag._id));
                        }}
                        className="rounded border-gray-300 dark:border-[#3A3A45] text-blue-600 focus:ring-blue-500 bg-white dark:bg-[#1A1A21]"
                      />
                      <span>{ag.name}</span>
                      <span className="text-gray-400 dark:text-[#5B5D67] ml-auto tabular-nums">{ag.totalCases}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// TOP PERFORMERS PODIUM
// ============================================

const TopPerformersPodium = ({ agents }) => {
  if (!agents || agents.length < 3) return null;
  const top3 = agents.slice(0, 3);

  const podiumOrder = [top3[1], top3[0], top3[2]]; // 2nd, 1st, 3rd
  const heights = ['h-20', 'h-28', 'h-16'];
  const ranks = [2, 1, 3];
  const sizes = ['w-10 h-10 text-sm', 'w-12 h-12 text-base', 'w-10 h-10 text-sm'];

  return (
    <div className="bg-gray-50 dark:bg-[#111116] rounded-lg p-5 sm:p-6">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] mb-5 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-amber-500" />
        Top Performers
      </h3>
      <div className="flex items-end justify-center gap-3 sm:gap-6">
        {podiumOrder.map((agent, i) => {
          if (!agent) return null;
          return (
            <div key={agent._id} className="flex flex-col items-center">
              <div className={`${sizes[i]} rounded-full flex items-center justify-center font-bold ${getInitialColor(agent.name)}`}>
                {getInitials(agent.name)}
              </div>
              <p className="text-xs font-medium text-gray-900 dark:text-[#E8E9ED] mt-2 text-center max-w-[80px] truncate">{agent.name}</p>
              <p className="text-[10px] text-gray-500 dark:text-[#6B6D77] tabular-nums">{agent.totalCases} cases</p>
              <p className={`text-[10px] tabular-nums ${getResponseColor(agent.avgResponseTime)}`}>{formatTimeShort(agent.avgResponseTime)}</p>
              <div className={`mt-2 w-16 sm:w-20 ${heights[i]} rounded-t-lg flex items-center justify-center ${
                ranks[i] === 1 ? 'bg-amber-100 dark:bg-amber-500/15' : ranks[i] === 2 ? 'bg-gray-200 dark:bg-[#252530]' : 'bg-orange-100 dark:bg-orange-500/15'
              }`}>
                <span className={`text-lg font-bold ${
                  ranks[i] === 1 ? 'text-amber-600 dark:text-amber-400' : ranks[i] === 2 ? 'text-gray-500 dark:text-[#6B6D77]' : 'text-orange-600 dark:text-orange-400'
                }`}>#{ranks[i]}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// AGENT DETAIL ROW (expanded)
// ============================================

const AgentDetailRow = ({ agent }) => {
  const dayData = Object.entries(agent.casesByDay || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date: date.slice(5), cases: count }));

  return (
    <motion.tr
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
    >
      <td colSpan={8} className="px-4 py-4 bg-gray-50/50 dark:bg-[#0C0C10]/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Cases by Day */}
          <div>
            <h4 className="text-xs font-medium text-gray-400 dark:text-[#5B5D67] uppercase tracking-wider mb-3">Cases by Day</h4>
            {dayData.length > 0 ? (
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={dayData}>
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'currentColor' }} className="text-gray-400 dark:text-[#5B5D67]" />
                  <YAxis hide />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="cases" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-xs text-gray-400 dark:text-[#5B5D67]">No data</p>}
          </div>

          {/* Channel Breakdown */}
          <div>
            <h4 className="text-xs font-medium text-gray-400 dark:text-[#5B5D67] uppercase tracking-wider mb-3">Channel Breakdown</h4>
            <div className="space-y-2">
              {(agent.channels || []).map((ch, i) => (
                <div key={i} className="flex items-center justify-between">
                  <ChannelTag name={ch.name} org={ch.org} />
                </div>
              ))}
            </div>
          </div>

          {/* Shift + Week Comparison */}
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-medium text-gray-400 dark:text-[#5B5D67] uppercase tracking-wider mb-3">Shift Distribution</h4>
              <div className="space-y-1.5">
                {['morning', 'afternoon', 'night'].map(shift => {
                  const Icon = SHIFT_ICONS[shift];
                  const count = agent.shiftDistribution?.[shift] || 0;
                  const pct = agent.totalCases > 0 ? Math.round((count / agent.totalCases) * 100) : 0;
                  return (
                    <div key={shift} className="flex items-center gap-2 text-xs">
                      <Icon className="w-3 h-3 flex-shrink-0" style={{ color: SHIFT_COLORS[shift] }} />
                      <span className="text-gray-500 dark:text-[#6B6D77] w-14 capitalize">{shift}</span>
                      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-[#1E1E28] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: SHIFT_COLORS[shift] }} />
                      </div>
                      <span className="text-gray-500 dark:text-[#6B6D77] w-6 text-right tabular-nums">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {agent.weekComparison && (
              <div className="pt-3 border-t border-gray-200 dark:border-[#1E1E28]">
                <h4 className="text-xs font-medium text-gray-400 dark:text-[#5B5D67] uppercase tracking-wider mb-2">Period Comparison</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-[#6B6D77]">This week</span>
                    <span className="text-gray-900 dark:text-[#E8E9ED] font-medium tabular-nums">{agent.weekComparison.thisWeek.cases} cases</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-[#6B6D77]">Last week</span>
                    <span className="text-gray-500 dark:text-[#6B6D77] tabular-nums">{agent.weekComparison.lastWeek.cases} cases</span>
                  </div>
                  {agent.weekComparison.lastWeek.cases > 0 && (() => {
                    const diff = agent.weekComparison.thisWeek.cases - agent.weekComparison.lastWeek.cases;
                    const pct = Math.round((diff / agent.weekComparison.lastWeek.cases) * 100);
                    return (
                      <div className={`flex items-center gap-1 ${diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {diff >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        <span>{diff >= 0 ? '+' : ''}{pct}%</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </td>
    </motion.tr>
  );
};

// ============================================
// AGENTS VIEW
// ============================================

const AgentsView = ({ agents, loading, expandedAgent, setExpandedAgent }) => {
  const [sortBy, setSortBy] = useState('cases');
  const [sortDir, setSortDir] = useState('desc');

  const sorted = useMemo(() => {
    if (!agents) return [];
    return [...agents].sort((a, b) => {
      let va, vb;
      switch (sortBy) {
        case 'cases': va = a.totalCases; vb = b.totalCases; break;
        case 'response': va = a.avgResponseTime || 99999; vb = b.avgResponseTime || 99999; break;
        case 'name': va = a.name?.toLowerCase(); vb = b.name?.toLowerCase();
          return sortDir === 'asc' ? (va < vb ? -1 : 1) : (va > vb ? -1 : 1);
        default: va = a.totalCases; vb = b.totalCases;
      }
      return sortDir === 'desc' ? vb - va : va - vb;
    });
  }, [agents, sortBy, sortDir]);

  const toggleSort = (key) => {
    if (sortBy === key) setSortDir(prev => prev === 'desc' ? 'asc' : 'desc');
    else { setSortBy(key); setSortDir('desc'); }
  };

  const SortHeader = ({ label, sortKey, className = '' }) => (
    <th
      className={`text-xs font-medium text-gray-400 dark:text-[#5B5D67] uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 dark:hover:text-[#A0A2AC] transition-colors ${className}`}
      onClick={() => toggleSort(sortKey)}
    >
      <span className="flex items-center gap-1">
        {label}
        {sortBy === sortKey && (
          sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
        )}
      </span>
    </th>
  );

  // Sparkline data per agent
  const getAgentSparkline = (agent) => {
    const entries = Object.entries(agent.casesByDay || {}).sort(([a], [b]) => a.localeCompare(b));
    return entries.map(([date, count]) => ({ label: date, value: count }));
  };

  // Week-over-week trend
  const getWowTrend = (agent) => {
    if (!agent.weekComparison) return null;
    const { thisWeek, lastWeek } = agent.weekComparison;
    if (!lastWeek.cases) return null;
    const pct = Math.round(((thisWeek.cases - lastWeek.cases) / lastWeek.cases) * 100);
    return pct;
  };

  if (loading && !agents.length) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400 dark:text-[#5B5D67]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TopPerformersPodium agents={sorted} />

      <div className="bg-gray-50 dark:bg-[#111116] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200/60 dark:border-[#1E1E28]">
                <th className="text-left text-xs font-medium text-gray-400 dark:text-[#5B5D67] uppercase tracking-wider px-4 py-3 w-10">#</th>
                <SortHeader label="Agent" sortKey="name" className="text-left px-4 py-3" />
                <th className="text-left text-xs font-medium text-gray-400 dark:text-[#5B5D67] uppercase tracking-wider px-4 py-3">Channels</th>
                <SortHeader label="Cases" sortKey="cases" className="text-right px-4 py-3" />
                <SortHeader label="Avg Response" sortKey="response" className="text-right px-4 py-3" />
                <th className="text-left text-xs font-medium text-gray-400 dark:text-[#5B5D67] uppercase tracking-wider px-4 py-3 hidden lg:table-cell">7d Trend</th>
                <th className="text-left text-xs font-medium text-gray-400 dark:text-[#5B5D67] uppercase tracking-wider px-4 py-3 hidden xl:table-cell">Shifts</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {!sorted.length ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-gray-400 dark:text-[#5B5D67]">No agent data available</td>
                </tr>
              ) : sorted.map((agent, idx) => {
                const sparkData = getAgentSparkline(agent);
                const wowTrend = getWowTrend(agent);
                return (
                  <React.Fragment key={agent._id}>
                    <tr
                      className={`hover:bg-gray-100/60 dark:hover:bg-[#1A1A21] cursor-pointer transition-colors ${idx < sorted.length - 1 ? 'border-b border-gray-200/40 dark:border-[#1A1A21]' : ''}`}
                      onClick={() => setExpandedAgent(expandedAgent === agent._id ? null : agent._id)}
                    >
                      <td className="px-4 py-3 text-gray-400 dark:text-[#5B5D67] text-xs tabular-nums">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${getInitialColor(agent.name)}`}>
                            {getInitials(agent.name)}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-[#E8E9ED] truncate max-w-[140px]">{agent.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(agent.channels || []).slice(0, 3).map((ch, i) => (
                            <ChannelTag key={i} name={ch.name} org={ch.org} />
                          ))}
                          {(agent.channels || []).length > 3 && (
                            <span className="text-[10px] text-gray-400 dark:text-[#5B5D67]">+{agent.channels.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="text-right px-4 py-3 text-gray-900 dark:text-[#E8E9ED] font-semibold tabular-nums">{agent.totalCases}</td>
                      <td className="text-right px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getResponseDot(agent.avgResponseTime)}`} />
                          <span className={`font-medium tabular-nums ${getResponseColor(agent.avgResponseTime)}`}>
                            {formatTime(agent.avgResponseTime)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <MiniSparkline data={sparkData} />
                          {wowTrend !== null && (
                            <span className={`text-[10px] font-medium tabular-nums ${wowTrend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                              {wowTrend >= 0 ? '+' : ''}{wowTrend}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <ShiftBar distribution={agent.shiftDistribution || {}} total={agent.totalCases} />
                      </td>
                      <td className="px-2 py-3">
                        {expandedAgent === agent._id
                          ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 dark:text-[#5B5D67]" />
                          : <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-[#3A3A45]" />}
                      </td>
                    </tr>
                    <AnimatePresence>
                      {expandedAgent === agent._id && <AgentDetailRow agent={agent} />}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================
// CHANNEL HEALTH CARD
// ============================================

const ChannelHealthCard = ({ channel, orgColor }) => {
  const sparkData = Object.entries(channel.dailyVolume || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ label: date, value: count }));

  const isPending = !channel.totalCases && !channel.agents?.length;

  if (isPending) {
    return (
      <div className="border border-dashed border-gray-200 dark:border-[#252530] rounded-lg p-4 opacity-60">
        <div className="flex items-center gap-2 mb-2">
          <Hash className="w-3.5 h-3.5 text-gray-300 dark:text-[#3A3A45]" />
          <span className="text-sm font-medium text-gray-400 dark:text-[#5B5D67]">{channel.name}</span>
        </div>
        <p className="text-xs text-gray-400 dark:text-[#5B5D67]">Pending setup</p>
        <p className="text-[10px] text-gray-300 dark:text-[#3A3A45] mt-1">No data yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#141419] border border-gray-200 dark:border-[#1E1E28] rounded-lg p-4 hover:shadow-sm dark:hover:border-[#252530] transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Hash className="w-3.5 h-3.5 text-gray-400 dark:text-[#5B5D67]" />
          <span className="text-sm font-medium text-gray-900 dark:text-[#E8E9ED]">{channel.name}</span>
        </div>
        {channel.trackingMode === 'message_count' && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-[#1E1E28] dark:text-[#5B5D67] font-medium">MSG COUNT</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3">
        <div>
          <span className="text-[10px] text-gray-400 dark:text-[#5B5D67]">Cases</span>
          <p className="text-lg font-bold text-gray-900 dark:text-[#E8E9ED] tabular-nums">{channel.totalCases}</p>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 dark:text-[#5B5D67]">Agents</span>
          <p className="text-lg font-bold text-gray-900 dark:text-[#E8E9ED] tabular-nums">{channel.activeAgents}</p>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 dark:text-[#5B5D67]">Avg Response</span>
          <div className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${getResponseDot(channel.avgResponseTime)}`} />
            <p className={`text-sm font-semibold tabular-nums ${getResponseColor(channel.avgResponseTime)}`}>
              {formatTime(channel.avgResponseTime)}
            </p>
          </div>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 dark:text-[#5B5D67]">Backlog</span>
          <p className={`text-sm font-semibold tabular-nums ${
            channel.backlog > 5 ? 'text-red-600 dark:text-red-400' :
            channel.backlog > 0 ? 'text-amber-600 dark:text-amber-400' :
            'text-gray-500 dark:text-[#6B6D77]'
          }`}>{channel.backlog}</p>
        </div>
      </div>

      {/* Mini sparkline */}
      {sparkData.length > 0 && (
        <div className="pt-2 border-t border-gray-100 dark:border-[#1E1E28]">
          <MiniSparkline data={sparkData} color={orgColor || '#3b82f6'} />
        </div>
      )}

      {/* Top agents */}
      {channel.agents?.length > 0 && (
        <div className="pt-2 mt-2 border-t border-gray-100 dark:border-[#1E1E28]">
          <div className="space-y-1">
            {channel.agents.slice(0, 3).map((a, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <span className="text-gray-600 dark:text-[#A0A2AC] truncate max-w-[100px]">{a.name}</span>
                <span className="text-gray-400 dark:text-[#5B5D67] tabular-nums">{a.cases}</span>
              </div>
            ))}
            {channel.agents.length > 3 && (
              <span className="text-[10px] text-gray-400 dark:text-[#5B5D67]">+{channel.agents.length - 3} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// CHANNELS VIEW
// ============================================

const ChannelsView = ({ channels, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400 dark:text-[#5B5D67]" />
      </div>
    );
  }

  const orgs = Object.entries(channels || {});
  if (!orgs.length) {
    return (
      <div className="text-center py-16">
        <Hash className="w-8 h-8 mx-auto text-gray-200 dark:text-[#2A2A35] mb-3" />
        <p className="text-sm text-gray-400 dark:text-[#5B5D67]">No channel data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {orgs.map(([org, chs]) => {
        const orgColorCfg = ORG_COLORS[org];
        const totalCases = chs.reduce((s, c) => s + (c.totalCases || 0), 0);
        return (
          <section key={org}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-2 h-2 rounded-full ${orgColorCfg?.dot || 'bg-gray-400'}`} />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED]">{org}</h3>
              <span className="text-xs text-gray-400 dark:text-[#5B5D67]">{chs.length} channel{chs.length > 1 ? 's' : ''}</span>
              <span className="text-xs text-gray-400 dark:text-[#5B5D67] tabular-nums">{totalCases} cases</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {chs.map(ch => (
                <ChannelHealthCard key={ch._id || ch.name} channel={ch} orgColor={orgColorCfg?.fill} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};

// ============================================
// TRENDS VIEW
// ============================================

const TrendsView = ({ trends, loading, period }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400 dark:text-[#5B5D67]" />
      </div>
    );
  }

  if (!trends) {
    return (
      <div className="text-center py-16">
        <Activity className="w-8 h-8 mx-auto text-gray-200 dark:text-[#2A2A35] mb-3" />
        <p className="text-sm text-gray-400 dark:text-[#5B5D67]">No trend data available</p>
      </div>
    );
  }

  const dailyCases = (trends.dailyCases || []).map(d => ({
    date: d.date?.slice(5) || d.date,
    total: d.total
  }));

  const dailyResponse = (trends.dailyResponseTime || []).map(d => ({
    date: d.date?.slice(5) || d.date,
    avg: d.avg ? Math.round(d.avg / 60) : 0,
    min: d.min ? Math.round(d.min / 60) : 0,
    max: d.max ? Math.round(d.max / 60) : 0
  }));

  const dailyAgents = (trends.dailyActiveAgents || []).map(d => ({
    date: d.date?.slice(5) || d.date,
    count: d.count
  }));

  const shiftDist = (trends.shiftDistribution || []).map(d => ({
    date: d.date?.slice(5) || d.date,
    morning: d.morning || 0,
    afternoon: d.afternoon || 0,
    night: d.night || 0
  }));

  return (
    <div className="space-y-6">
      {/* Daily Case Volume */}
      <div className="bg-gray-50 dark:bg-[#111116] rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-gray-400 dark:text-[#5B5D67]" />
          Daily Case Volume
        </h3>
        {dailyCases.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyCases}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-[#1E1E28]" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'currentColor' }} className="text-gray-400 dark:text-[#5B5D67]" />
              <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} className="text-gray-400 dark:text-[#5B5D67]" />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="total" name="Cases" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-xs text-gray-400 dark:text-[#5B5D67] py-8 text-center">No daily data</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Time Trend */}
        <div className="bg-gray-50 dark:bg-[#111116] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400 dark:text-[#5B5D67]" />
            Avg Response Time (min)
          </h3>
          {dailyResponse.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={dailyResponse}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-[#1E1E28]" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'currentColor' }} className="text-gray-400 dark:text-[#5B5D67]" />
                <YAxis tick={{ fontSize: 9, fill: 'currentColor' }} className="text-gray-400 dark:text-[#5B5D67]" />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="avg" name="Avg" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-gray-400 dark:text-[#5B5D67] py-8 text-center">No data</p>}
        </div>

        {/* Active Agents per Day */}
        <div className="bg-gray-50 dark:bg-[#111116] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400 dark:text-[#5B5D67]" />
            Active Agents / Day
          </h3>
          {dailyAgents.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={dailyAgents}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-[#1E1E28]" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'currentColor' }} className="text-gray-400 dark:text-[#5B5D67]" />
                <YAxis tick={{ fontSize: 9, fill: 'currentColor' }} className="text-gray-400 dark:text-[#5B5D67]" />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="count" name="Agents" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-gray-400 dark:text-[#5B5D67] py-8 text-center">No data</p>}
        </div>
      </div>

      {/* Shift Distribution Over Time */}
      {shiftDist.length > 0 && (
        <div className="bg-gray-50 dark:bg-[#111116] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] mb-4 flex items-center gap-2">
            <Sun className="w-4 h-4 text-gray-400 dark:text-[#5B5D67]" />
            Shift Distribution Over Time
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={shiftDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-[#1E1E28]" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'currentColor' }} className="text-gray-400 dark:text-[#5B5D67]" />
              <YAxis tick={{ fontSize: 9, fill: 'currentColor' }} className="text-gray-400 dark:text-[#5B5D67]" />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="morning" name="Morning" stackId="1" stroke={SHIFT_COLORS.morning} fill={SHIFT_COLORS.morning} fillOpacity={0.6} />
              <Area type="monotone" dataKey="afternoon" name="Afternoon" stackId="1" stroke={SHIFT_COLORS.afternoon} fill={SHIFT_COLORS.afternoon} fillOpacity={0.6} />
              <Area type="monotone" dataKey="night" name="Night" stackId="1" stroke={SHIFT_COLORS.night} fill={SHIFT_COLORS.night} fillOpacity={0.6} />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

// ============================================
// LIVE VIEW
// ============================================

const LiveView = ({ overview, agents, channels }) => {
  const now = new Date();
  const hour = now.getHours();
  const currentShift = hour >= 7 && hour < 15 ? 'morning' : hour >= 15 && hour < 23 ? 'afternoon' : 'night';
  const ShiftIcon = SHIFT_ICONS[currentShift];

  const openCases = overview?.openCases || 0;
  const resolvedToday = overview?.resolvedToday || 0;

  const allChannelsList = Object.values(channels || {}).flat();

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <div className="bg-gray-50 dark:bg-[#111116] rounded-lg p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="relative">
            <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED]">Live Status</h3>
          <div className="flex items-center gap-1.5 ml-auto text-xs text-gray-500 dark:text-[#6B6D77]">
            <ShiftIcon className="w-3.5 h-3.5" style={{ color: SHIFT_COLORS[currentShift] }} />
            <span className="capitalize">{currentShift} shift</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-white dark:bg-[#0C0C10] border border-gray-200 dark:border-[#1E1E28]">
            <p className="text-[10px] text-gray-400 dark:text-[#5B5D67] uppercase tracking-wider mb-1">Open Cases</p>
            <p className={`text-2xl font-bold tabular-nums ${
              openCases > 5 ? 'text-red-600 dark:text-red-400' :
              openCases > 0 ? 'text-amber-600 dark:text-amber-400' :
              'text-emerald-600 dark:text-emerald-400'
            }`}>{openCases}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white dark:bg-[#0C0C10] border border-gray-200 dark:border-[#1E1E28]">
            <p className="text-[10px] text-gray-400 dark:text-[#5B5D67] uppercase tracking-wider mb-1">Resolved Today</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-[#E8E9ED] tabular-nums">{resolvedToday}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white dark:bg-[#0C0C10] border border-gray-200 dark:border-[#1E1E28]">
            <p className="text-[10px] text-gray-400 dark:text-[#5B5D67] uppercase tracking-wider mb-1">Active Agents</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-[#E8E9ED] tabular-nums">{overview?.activeAgents?.value || 0}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white dark:bg-[#0C0C10] border border-gray-200 dark:border-[#1E1E28]">
            <p className="text-[10px] text-gray-400 dark:text-[#5B5D67] uppercase tracking-wider mb-1">Avg Response</p>
            <div className="flex items-center justify-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${getResponseDot(overview?.avgResponseTime?.value)}`} />
              <p className={`text-2xl font-bold tabular-nums ${getResponseColor(overview?.avgResponseTime?.value)}`}>
                {formatTimeShort(overview?.avgResponseTime?.value)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Channel Backlog */}
      {allChannelsList.some(ch => ch.backlog > 0) && (
        <div className="bg-gray-50 dark:bg-[#111116] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Channels with Backlog
          </h3>
          <div className="space-y-2">
            {allChannelsList.filter(ch => ch.backlog > 0).sort((a, b) => b.backlog - a.backlog).map(ch => (
              <div key={ch.name} className="flex items-center justify-between py-2 px-3 rounded bg-white dark:bg-[#0C0C10] border border-gray-200 dark:border-[#1E1E28]">
                <div className="flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5 text-gray-400 dark:text-[#5B5D67]" />
                  <span className="text-sm text-gray-900 dark:text-[#E8E9ED]">{ch.name}</span>
                </div>
                <span className={`text-sm font-semibold tabular-nums ${
                  ch.backlog > 5 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                }`}>{ch.backlog} open</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shift Coverage */}
      <div className="bg-gray-50 dark:bg-[#111116] rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] mb-4">Shift Coverage Today</h3>
        <div className="grid grid-cols-3 gap-3">
          {['morning', 'afternoon', 'night'].map(shift => {
            const Icon = SHIFT_ICONS[shift];
            const isCurrent = shift === currentShift;
            const shiftAgents = agents.filter(a => {
              const dist = a.shiftDistribution || {};
              return (dist[shift] || 0) > 0;
            });
            return (
              <div key={shift} className={`p-3 rounded-lg border text-center ${
                isCurrent
                  ? 'bg-white dark:bg-[#0C0C10] border-blue-200 dark:border-blue-500/30 ring-1 ring-blue-100 dark:ring-blue-500/10'
                  : 'bg-white dark:bg-[#0C0C10] border-gray-200 dark:border-[#1E1E28]'
              }`}>
                <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: SHIFT_COLORS[shift] }} />
                <p className="text-xs font-medium text-gray-900 dark:text-[#E8E9ED] capitalize">{shift}</p>
                <p className="text-[10px] text-gray-400 dark:text-[#5B5D67]">
                  {shift === 'morning' ? '7:00-15:00' : shift === 'afternoon' ? '15:00-23:00' : '23:00-7:00'}
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-[#E8E9ED] mt-1 tabular-nums">{shiftAgents.length}</p>
                <p className="text-[10px] text-gray-400 dark:text-[#5B5D67]">agents</p>
                {isCurrent && (
                  <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 font-medium">CURRENT</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const KYCGoals = () => {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('agents');
  const [period, setPeriod] = useState('7d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [overview, setOverview] = useState(null);
  const [agents, setAgents] = useState([]);
  const [channels, setChannels] = useState({});
  const [trends, setTrends] = useState(null);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [expandedAgent, setExpandedAgent] = useState(null);
  const pollingRef = useRef(null);

  // Filters
  const [channelFilter, setChannelFilter] = useState([]);
  const [agentFilter, setAgentFilter] = useState([]);
  const [allChannels, setAllChannels] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const getDateRange = useCallback(() => {
    if (period === 'custom' && startDate && endDate) {
      return { startDate, endDate };
    }

    const now = new Date();
    let start;

    if (period === 'This Month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'This Q') {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), qMonth, 1);
    } else {
      const days = period === '7d' ? 7 : period === '14d' ? 14 : period === '30d' ? 30 : 90;
      start = new Date(now);
      start.setDate(start.getDate() - days);
    }

    return { startDate: fmtDate(start), endDate: fmtDate(now) };
  }, [period, startDate, endDate]);

  const buildParams = useCallback(() => {
    const range = getDateRange();
    const params = { ...range };
    if (channelFilter.length) params.channelIds = channelFilter;
    if (agentFilter.length) params.agentIds = agentFilter;
    return params;
  }, [getDateRange, channelFilter, agentFilter]);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/kyc-goals/config`, getAuthHeaders());
      if (res.data.success) setAllChannels(res.data.channels || []);
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

  const fetchTrends = useCallback(async () => {
    try {
      setTrendsLoading(true);
      const params = buildParams();
      const res = await axios.get(`${API_URL}/api/kyc-goals/trends`, { ...getAuthHeaders(), params });
      if (res.data.success) setTrends(res.data.data || res.data);
    } catch (err) {
      console.error('Error fetching trends:', err);
      // Trends endpoint might not exist yet - that's ok
      setTrends(null);
    } finally {
      setTrendsLoading(false);
    }
  }, [buildParams]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);
  useEffect(() => { fetchData(); }, [fetchData]);

  // Fetch trends when switching to trends tab
  useEffect(() => {
    if (view === 'trends') fetchTrends();
  }, [view, fetchTrends]);

  // Polling (30s)
  useEffect(() => {
    pollingRef.current = setInterval(() => fetchData(false), 30000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [fetchData]);

  const TABS = [
    { key: 'agents', label: 'Agents', icon: Users },
    { key: 'channels', label: 'Channels', icon: Hash },
    { key: 'trends', label: 'Trends', icon: Activity },
    { key: 'live', label: 'Live', icon: Radio },
  ];

  // Calculate period label
  const range = getDateRange();
  const dayCount = range.startDate && range.endDate
    ? Math.ceil((new Date(range.endDate) - new Date(range.startDate)) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0C0C10]">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-[#1E1E28]">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-semibold text-gray-900 dark:text-[#E8E9ED]">KYC Goals</h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 font-semibold border border-amber-200 dark:border-amber-500/20">
              BETA
            </span>
            {dayCount > 0 && (
              <span className="text-xs text-gray-400 dark:text-[#5B5D67] hidden sm:block">
                {range.startDate} - {range.endDate} ({dayCount}d)
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  view === key
                    ? 'bg-gray-100 dark:bg-[#1E1E28] text-gray-900 dark:text-[#E8E9ED]'
                    : 'text-gray-500 dark:text-[#6B6D77] hover:text-gray-700 dark:hover:text-[#A0A2AC] hover:bg-gray-50 dark:hover:bg-[#1A1A21]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}

            <div className="h-5 w-px bg-gray-200 dark:bg-[#252530] mx-1" />

            <button
              onClick={() => fetchData()}
              className="p-1.5 rounded text-gray-500 dark:text-[#6B6D77] hover:text-gray-700 dark:hover:text-[#A0A2AC] hover:bg-gray-50 dark:hover:bg-[#1A1A21] transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 sm:px-6 lg:px-8 py-5 space-y-5">

          {/* Filter Bar */}
          <FilterBar
            period={period}
            setPeriod={setPeriod}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            allChannels={allChannels}
            channelFilter={channelFilter}
            setChannelFilter={setChannelFilter}
            agents={agents}
            agentFilter={agentFilter}
            setAgentFilter={setAgentFilter}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
          />

          {/* Overview Cards */}
          {overview && view !== 'live' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard
                title="Total Cases"
                value={overview.totalCases.value}
                subtitle={`Resolved: ${overview.resolvedCases || 0}`}
                change={overview.totalCases.change}
                icon={BarChart3}
                color="blue"
              />
              <MetricCard
                title="Avg Response Time"
                value={overview.avgResponseTime.value}
                subtitle={overview.avgHandlingTime ? `Handling: ${formatTime(overview.avgHandlingTime)}` : undefined}
                change={overview.avgResponseTime.change}
                icon={Clock}
                format="time"
                color="amber"
              />
              <MetricCard
                title="Active Agents"
                value={overview.activeAgents.value}
                change={overview.activeAgents.change}
                icon={Users}
                color="emerald"
              />
              <MetricCard
                title="Cases / Agent"
                value={overview.casesPerAgent.value}
                change={overview.casesPerAgent.change}
                icon={Target}
                color="purple"
              />
            </div>
          )}

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {view === 'agents' && (
                <AgentsView
                  agents={agents}
                  loading={loading}
                  expandedAgent={expandedAgent}
                  setExpandedAgent={setExpandedAgent}
                />
              )}
              {view === 'channels' && (
                <ChannelsView
                  channels={channels}
                  loading={loading && !Object.keys(channels).length}
                />
              )}
              {view === 'trends' && (
                <TrendsView
                  trends={trends}
                  loading={trendsLoading}
                  period={period}
                />
              )}
              {view === 'live' && (
                <LiveView
                  overview={overview}
                  agents={agents}
                  channels={channels}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default KYCGoals;
