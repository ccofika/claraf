import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BarChart3, Users, Clock, TrendingUp, TrendingDown, ChevronRight,
  Activity, Hash, X, RefreshCw,
  Sun, Sunset, Moon, Calendar, Search, CheckCircle2, AlertCircle,
  Zap, Trophy, Loader2, Target
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
// MULTI-SELECT DROPDOWN
// ============================================

const MultiDropdown = ({ label, icon: Icon, selected, options, onToggle, onClear, renderOption, groupBy, searchable, searchPlaceholder }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = useMemo(() => {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(o => (o.label || '').toLowerCase().includes(q) || (o.group || '').toLowerCase().includes(q));
  }, [options, search]);

  const grouped = useMemo(() => {
    if (!groupBy) return null;
    return filtered.reduce((acc, o) => {
      const g = o.group || 'Other';
      (acc[g] = acc[g] || []).push(o);
      return acc;
    }, {});
  }, [filtered, groupBy]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); setSearch(''); }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all ${
          selected.length > 0
            ? 'border-blue-300 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
            : 'border-gray-200 dark:border-[#1E1E28] bg-white dark:bg-[#141419] text-gray-600 dark:text-[#9A9BA3] hover:border-gray-300 dark:hover:border-[#252530]'
        }`}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{selected.length > 0 ? `${label} (${selected.length})` : label}</span>
        {selected.length > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="ml-0.5 p-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-500/20"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1 w-72 bg-white dark:bg-[#141419] border border-gray-200 dark:border-[#1E1E28] rounded-lg shadow-lg z-50 overflow-hidden"
          >
            {searchable && (
              <div className="p-2 border-b border-gray-100 dark:border-[#1E1E28]">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder={searchPlaceholder || 'Search...'}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-7 pr-2 py-1.5 text-xs bg-gray-50 dark:bg-[#0C0C10] border border-gray-200 dark:border-[#1E1E28] rounded text-gray-900 dark:text-[#E8E9ED] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    autoFocus
                  />
                </div>
              </div>
            )}
            <div className="max-h-64 overflow-y-auto p-1">
              {grouped ? (
                Object.entries(grouped).map(([group, items]) => (
                  <div key={group}>
                    <div className="px-3 py-1 text-[10px] font-semibold text-gray-400 dark:text-[#5B5D67] uppercase tracking-wider mt-1">{group}</div>
                    {items.map(o => {
                      const isSelected = selected.includes(o.value);
                      return (
                        <button
                          key={o.value}
                          onClick={() => onToggle(o.value)}
                          className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-2 ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
                              : 'text-gray-600 dark:text-[#9A9BA3] hover:bg-gray-50 dark:hover:bg-[#111116]'
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-blue-500 border-blue-500 dark:bg-blue-500 dark:border-blue-500'
                              : 'border-gray-300 dark:border-[#3A3A45]'
                          }`}>
                            {isSelected && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                          </div>
                          {renderOption ? renderOption(o) : o.label}
                        </button>
                      );
                    })}
                  </div>
                ))
              ) : (
                filtered.map(o => {
                  const isSelected = selected.includes(o.value);
                  return (
                    <button
                      key={o.value}
                      onClick={() => onToggle(o.value)}
                      className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-2 ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
                          : 'text-gray-600 dark:text-[#9A9BA3] hover:bg-gray-50 dark:hover:bg-[#111116]'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-blue-500 border-blue-500 dark:bg-blue-500 dark:border-blue-500'
                          : 'border-gray-300 dark:border-[#3A3A45]'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                      </div>
                      {renderOption ? renderOption(o) : o.label}
                    </button>
                  );
                })
              )}
              {filtered.length === 0 && (
                <p className="text-xs text-gray-400 dark:text-[#5B5D67] text-center py-3">No results</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// FILTER BAR
// ============================================

const FilterBar = ({
  period, setPeriod, startDate, setStartDate, endDate, setEndDate,
  allChannels, channelFilter, setChannelFilter, agents, agentFilter, setAgentFilter
}) => {
  const channelOptions = useMemo(() => {
    return allChannels.map(ch => ({
      value: ch.slackChannelId,
      label: ch.name,
      group: ch.organization,
    }));
  }, [allChannels]);

  const agentOptions = useMemo(() => {
    return [...agents].sort((a, b) => b.totalCases - a.totalCases).map(ag => ({
      value: ag._id,
      label: ag.name,
      extra: ag.totalCases,
    }));
  }, [agents]);

  const toggleChannel = (id) => {
    setChannelFilter(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const toggleAgent = (id) => {
    setAgentFilter(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const activeFilterCount = channelFilter.length + agentFilter.length;

  return (
    <div className="space-y-3">
      {/* Period selector + filter dropdowns */}
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
          <MultiDropdown
            label="Channels"
            icon={Hash}
            selected={channelFilter}
            options={channelOptions}
            onToggle={toggleChannel}
            onClear={() => setChannelFilter([])}
            groupBy
            searchable
            searchPlaceholder="Search channels..."
            renderOption={(o) => (
              <span className="flex items-center gap-1.5">
                <Hash className="w-3 h-3 text-gray-400 dark:text-[#5B5D67] flex-shrink-0" />
                {o.label}
              </span>
            )}
          />
          <MultiDropdown
            label="Agents"
            icon={Users}
            selected={agentFilter}
            options={agentOptions}
            onToggle={toggleAgent}
            onClear={() => setAgentFilter([])}
            searchable
            searchPlaceholder="Search agents..."
            renderOption={(o) => (
              <span className="flex items-center justify-between w-full">
                <span>{o.label}</span>
                <span className="text-gray-400 dark:text-[#5B5D67] tabular-nums ml-2">{o.extra}</span>
              </span>
            )}
          />
        </div>
      </div>

      {/* Active filter chips */}
      <AnimatePresence>
        {activeFilterCount > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-1.5 flex-wrap">
              {channelFilter.map(id => {
                const ch = allChannels.find(c => c.slackChannelId === id);
                return (
                  <motion.span
                    key={`ch-${id}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
                  >
                    #{ch?.name || id}
                    <X className="w-3 h-3 cursor-pointer hover:opacity-70" onClick={() => setChannelFilter(prev => prev.filter(c => c !== id))} />
                  </motion.span>
                );
              })}
              {agentFilter.map(id => {
                const ag = agents.find(a => a._id === id);
                return (
                  <motion.span
                    key={`ag-${id}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20"
                  >
                    {ag?.name || id}
                    <X className="w-3 h-3 cursor-pointer hover:opacity-70" onClick={() => setAgentFilter(prev => prev.filter(a => a !== id))} />
                  </motion.span>
                );
              })}
              <button
                onClick={() => { setChannelFilter([]); setAgentFilter([]); }}
                className="text-xs text-gray-400 dark:text-[#5B5D67] hover:text-gray-700 dark:hover:text-[#A0A2AC] transition-colors"
              >
                Clear all
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// AGENT CARD
// ============================================

const AgentCard = ({ agent, rank, navigate }) => {
  const responseColor = getResponseColor(agent.avgResponseTime);
  const responseDot = getResponseDot(agent.avgResponseTime);

  return (
    <motion.div
      layout
      layoutId={`agent-card-${agent._id}`}
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      transition={{ duration: 0.3, delay: Math.min(rank * 0.02, 0.2), layout: { duration: 0.3, type: 'spring', stiffness: 500, damping: 35 } }}
      onClick={() => navigate(`/kyc-goals/agent/${agent._id}`)}
      className="group relative bg-white dark:bg-[#141419] border border-gray-200/80 dark:border-[#1E1E28] rounded-xl p-4 cursor-pointer hover:border-gray-300 dark:hover:border-[#2A2A35] hover:shadow-sm transition-all"
    >
      {/* Rank badge for top 3 */}
      {rank <= 3 && (
        <div className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ${
          rank === 1 ? 'bg-amber-400 text-amber-950' :
          rank === 2 ? 'bg-gray-300 dark:bg-gray-500 text-white' :
          'bg-orange-300 dark:bg-orange-500/80 text-orange-950 dark:text-white'
        }`}>
          {rank}
        </div>
      )}

      <div className="flex items-center gap-3 mb-3">
        {agent.slackAvatarUrl ? (
          <img src={agent.slackAvatarUrl} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100 dark:ring-[#1E1E28] group-hover:ring-gray-200 dark:group-hover:ring-[#2A2A35] transition-all" />
        ) : (
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ring-2 ring-gray-100 dark:ring-[#1E1E28] ${getInitialColor(agent.name)}`}>
            {getInitials(agent.name)}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{agent.name}</p>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {(agent.channels || []).slice(0, 2).map((ch, i) => (
              <ChannelTag key={i} name={ch.name} org={ch.org} />
            ))}
            {(agent.channels || []).length > 2 && (
              <span className="text-[9px] text-gray-400 dark:text-[#5B5D67]">+{agent.channels.length - 2}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-bold text-gray-900 dark:text-[#E8E9ED] tabular-nums">{agent.totalCases}</span>
          <span className="text-[10px] text-gray-400 dark:text-[#5B5D67]">cases</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${responseDot}`} />
          <span className={`text-xs font-medium tabular-nums ${responseColor}`}>
            {formatTime(agent.avgResponseTime)}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// TEAM SECTION
// ============================================

const TEAM_PATTERNS = {
  'Stake.com': { accent: '#3b82f6', accentLight: 'rgba(59,130,246,0.06)', accentDark: 'rgba(59,130,246,0.08)' },
  'Stake.us': { accent: '#8b5cf6', accentLight: 'rgba(139,92,246,0.06)', accentDark: 'rgba(139,92,246,0.08)' },
  'Stake Brazil': { accent: '#10b981', accentLight: 'rgba(16,185,129,0.06)', accentDark: 'rgba(16,185,129,0.08)' },
  'Stake Denmark': { accent: '#f97316', accentLight: 'rgba(249,115,22,0.06)', accentDark: 'rgba(249,115,22,0.08)' },
  'Stake Italy': { accent: '#f59e0b', accentLight: 'rgba(245,158,11,0.06)', accentDark: 'rgba(245,158,11,0.08)' },
};

const TeamSection = ({ teamName, agents, navigate }) => {
  const cfg = TEAM_PATTERNS[teamName] || TEAM_PATTERNS['Stake.com'];
  const totalCases = agents.reduce((sum, a) => sum + a.totalCases, 0);
  const sorted = [...agents].sort((a, b) => b.totalCases - a.totalCases);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.accent }} />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED]">{teamName}</h3>
          <span className="text-[10px] text-gray-400 dark:text-[#5B5D67] tabular-nums">{agents.length} agents</span>
        </div>
        <span className="text-xs text-gray-500 dark:text-[#6B6D77] tabular-nums font-medium">{totalCases} cases</span>
      </div>

      {/* Agent cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        <AnimatePresence mode="popLayout">
          {sorted.map((agent, i) => (
            <AgentCard key={agent._id} agent={agent} rank={agent._globalRank || i + 1} navigate={navigate} />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ============================================
// AGENTS VIEW
// ============================================

const AgentsView = ({ agents, loading, refetching, navigate, overview, channelFilter = [], agentFilter = [], allChannels = [] }) => {
  const sorted = useMemo(() => {
    if (!agents) return [];
    return [...agents].sort((a, b) => b.totalCases - a.totalCases);
  }, [agents]);

  // Group agents by primary team
  const teamGroups = useMemo(() => {
    const groups = {};
    sorted.forEach((agent, idx) => {
      const team = agent.primaryTeam || 'Unknown';
      if (!groups[team]) groups[team] = [];
      groups[team].push({ ...agent, _globalRank: idx + 1 });
    });
    // Sort teams by total cases
    return Object.entries(groups)
      .sort(([, a], [, b]) => {
        const totalA = a.reduce((s, ag) => s + ag.totalCases, 0);
        const totalB = b.reduce((s, ag) => s + ag.totalCases, 0);
        return totalB - totalA;
      });
  }, [sorted]);

  // Dynamic title based on active filters
  const podiumTitle = useMemo(() => {
    const selectedChannelNames = channelFilter.map(id => {
      const ch = allChannels.find(c => c.slackChannelId === id);
      return ch ? ch.name : null;
    }).filter(Boolean);
    const selectedAgentNames = agentFilter.map(id => {
      const ag = agents.find(a => a._id === id);
      return ag ? ag.name?.split(' ')[0] : null;
    }).filter(Boolean);

    const hasChannels = selectedChannelNames.length > 0;
    const hasAgents = selectedAgentNames.length > 0;

    if (!hasChannels && !hasAgents) return 'Top Performers';

    // Build context-aware title
    let agentPart = '';
    let channelPart = '';

    if (hasAgents) {
      if (selectedAgentNames.length === 1) {
        agentPart = `${selectedAgentNames[0]}'s`;
      } else if (selectedAgentNames.length <= 3) {
        agentPart = selectedAgentNames.join(', ');
      } else {
        agentPart = `${selectedAgentNames.length} agents`;
      }
    }

    if (hasChannels) {
      if (selectedChannelNames.length === 1) {
        // Extract meaningful name: "italy-support-kyc" → "Italy"
        const rawName = selectedChannelNames[0];
        const parts = rawName.replace(/-/g, ' ').split(' ');
        const meaningful = parts.find(p => !['kyc', 'support', 'mebit', 'veriff', 'pd'].includes(p.toLowerCase()));
        channelPart = meaningful ? meaningful.charAt(0).toUpperCase() + meaningful.slice(1) : rawName;
      } else if (selectedChannelNames.length <= 3) {
        channelPart = selectedChannelNames.map(n => `#${n}`).join(', ');
      } else {
        channelPart = `${selectedChannelNames.length} channels`;
      }
    }

    if (hasAgents && hasChannels) {
      return selectedAgentNames.length === 1
        ? `${agentPart} ${channelPart} Performance`
        : `${agentPart} in ${channelPart}`;
    }
    if (hasAgents) {
      return selectedAgentNames.length === 1
        ? `${agentPart} Performance`
        : `Top ${agentPart}`;
    }
    // channels only
    return `Top ${channelPart} Performers`;
  }, [channelFilter, agentFilter, allChannels, agents]);

  const hasActiveFilters = channelFilter.length > 0 || agentFilter.length > 0;

  if (loading && !agents.length) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400 dark:text-[#5B5D67]" />
      </div>
    );
  }

  if (!loading && agents.length === 0 && hasActiveFilters) {
    return (
      <div className="text-center py-20">
        <Users className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-[#3A3A45]" />
        <p className="text-sm font-medium text-gray-500 dark:text-[#6B6D77]">No agents match your filters</p>
        <p className="text-xs text-gray-400 dark:text-[#5B5D67] mt-1">Try adjusting your channel or agent selection</p>
      </div>
    );
  }

  const top3 = sorted.slice(0, 3);
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
  const heights = ['h-16', 'h-24', 'h-12'];
  const sizes = ['w-11 h-11', 'w-14 h-14', 'w-11 h-11'];
  const ranks = top3.length >= 3 ? [2, 1, 3] : [1, 2, 3];

  return (
    <div className={`space-y-8 transition-opacity duration-300 ${refetching ? 'opacity-60' : 'opacity-100'}`}>
      {/* Refetch indicator */}
      {refetching && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="h-0.5 bg-blue-500/30 overflow-hidden">
            <div className="h-full bg-blue-500 animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}

      {/* Top section: Podium OR Filtered Performance Dashboard */}
      <div
        className="relative rounded-xl p-6 sm:p-8 overflow-hidden"
        style={{
          background: top3.length >= 3
            ? 'linear-gradient(135deg, rgba(251,191,36,0.04) 0%, transparent 40%, rgba(59,130,246,0.03) 100%)'
            : 'linear-gradient(135deg, rgba(59,130,246,0.04) 0%, transparent 40%, rgba(139,92,246,0.03) 100%)',
        }}
      >
        {/* Subtle dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.15] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, currentColor 0.5px, transparent 0.5px)',
            backgroundSize: '20px 20px',
            color: '#94a3b8',
          }}
        />

        {top3.length >= 3 ? (
          /* === PODIUM MODE (3+ agents, no narrow filter) === */
          <>
            <div className="relative flex items-start justify-between gap-4">
              {/* Left floating stats */}
              <div className="hidden lg:flex flex-col gap-4 pt-6 min-w-[120px]">
                {overview && (
                  <>
                    <div>
                      <p className="text-[10px] font-medium text-gray-400 dark:text-[#5B5D67] uppercase tracking-widest mb-1">Total Cases</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-[#E8E9ED] tabular-nums">{overview.totalCases.value}</p>
                      <p className="text-[10px] text-gray-400 dark:text-[#5B5D67]">Resolved: {overview.resolvedCases || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-gray-400 dark:text-[#5B5D67] uppercase tracking-widest mb-1">Avg Response</p>
                      <p className={`text-2xl font-bold tabular-nums ${getResponseColor(overview.avgResponseTime.value)}`}>{formatTime(overview.avgResponseTime.value)}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Center podium */}
              <div className="flex-1 flex flex-col items-center">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] mb-6 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  {podiumTitle}
                </h3>
                <div className="flex items-end justify-center gap-4 sm:gap-8">
                  {podiumOrder.map((agent, i) => {
                    if (!agent) return null;
                    return (
                      <div
                        key={agent._id}
                        className="flex flex-col items-center cursor-pointer group"
                        onClick={() => navigate(`/kyc-goals/agent/${agent._id}`)}
                      >
                        <div className="relative">
                          {agent.slackAvatarUrl ? (
                            <img src={agent.slackAvatarUrl} alt="" className={`${sizes[i]} rounded-full object-cover ring-2 ${
                              ranks[i] === 1 ? 'ring-amber-300 dark:ring-amber-500/50' : 'ring-gray-200 dark:ring-[#252530]'
                            } group-hover:scale-105 transition-transform`} />
                          ) : (
                            <div className={`${sizes[i]} rounded-full flex items-center justify-center font-bold ${getInitialColor(agent.name)} group-hover:scale-105 transition-transform`}>
                              {getInitials(agent.name)}
                            </div>
                          )}
                          {ranks[i] === 1 && (
                            <div className="absolute -top-1 -right-1 text-amber-400 text-sm">
                              <Trophy className="w-4 h-4 fill-amber-400" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-gray-900 dark:text-[#E8E9ED] mt-2 text-center max-w-[90px] truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{agent.name}</p>
                        <p className="text-[11px] text-gray-600 dark:text-[#9A9BA3] font-bold tabular-nums">{agent.totalCases}</p>
                        <p className={`text-[10px] tabular-nums ${getResponseColor(agent.avgResponseTime)}`}>{formatTimeShort(agent.avgResponseTime)}</p>
                        <div className={`mt-2 w-16 sm:w-20 ${heights[i]} rounded-t-lg flex items-center justify-center ${
                          ranks[i] === 1 ? 'bg-gradient-to-t from-amber-200/60 to-amber-100/30 dark:from-amber-500/20 dark:to-amber-500/5' :
                          ranks[i] === 2 ? 'bg-gradient-to-t from-gray-200/80 to-gray-100/30 dark:from-[#252530] dark:to-[#1E1E28]' :
                          'bg-gradient-to-t from-orange-200/60 to-orange-100/30 dark:from-orange-500/15 dark:to-orange-500/5'
                        }`}>
                          <span className={`text-base font-bold ${
                            ranks[i] === 1 ? 'text-amber-600 dark:text-amber-400' :
                            ranks[i] === 2 ? 'text-gray-500 dark:text-[#6B6D77]' :
                            'text-orange-600 dark:text-orange-400'
                          }`}>#{ranks[i]}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right floating stats */}
              <div className="hidden lg:flex flex-col gap-4 pt-6 min-w-[120px] items-end text-right">
                {overview && (
                  <>
                    <div>
                      <p className="text-[10px] font-medium text-gray-400 dark:text-[#5B5D67] uppercase tracking-widest mb-1">Active Agents</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-[#E8E9ED] tabular-nums">{overview.activeAgents.value}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-gray-400 dark:text-[#5B5D67] uppercase tracking-widest mb-1">Cases / Agent</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-[#E8E9ED] tabular-nums">{overview.casesPerAgent.value}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Mobile stats row */}
            {overview && (
              <div className="flex items-center justify-around mt-5 pt-4 border-t border-gray-200/50 dark:border-[#1E1E28] lg:hidden">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900 dark:text-[#E8E9ED] tabular-nums">{overview.totalCases.value}</p>
                  <p className="text-[10px] text-gray-400 dark:text-[#5B5D67]">Cases</p>
                </div>
                <div className="text-center">
                  <p className={`text-lg font-bold tabular-nums ${getResponseColor(overview.avgResponseTime.value)}`}>{formatTime(overview.avgResponseTime.value)}</p>
                  <p className="text-[10px] text-gray-400 dark:text-[#5B5D67]">Avg Response</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900 dark:text-[#E8E9ED] tabular-nums">{overview.activeAgents.value}</p>
                  <p className="text-[10px] text-gray-400 dark:text-[#5B5D67]">Agents</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900 dark:text-[#E8E9ED] tabular-nums">{overview.casesPerAgent.value}</p>
                  <p className="text-[10px] text-gray-400 dark:text-[#5B5D67]">Per Agent</p>
                </div>
              </div>
            )}
          </>
        ) : (
          /* === FILTERED PERFORMANCE DASHBOARD (< 3 agents) === */
          <div className="relative">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] mb-5 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              {podiumTitle}
            </h3>

            {sorted.length === 1 ? (
              /* --- Single agent spotlight --- */
              (() => {
                const agent = sorted[0];
                const agentChannels = agent.channels || [];
                const multiChannel = agentChannels.length > 1;

                return (
                  <div className="flex flex-col gap-5">
                    {/* Agent identity + aggregate stats */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                      <div
                        className="flex flex-col items-center cursor-pointer group flex-shrink-0"
                        onClick={() => navigate(`/kyc-goals/agent/${agent._id}`)}
                      >
                        {agent.slackAvatarUrl ? (
                          <img src={agent.slackAvatarUrl} alt="" className="w-20 h-20 rounded-full object-cover ring-3 ring-blue-200 dark:ring-blue-500/30 group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ring-3 ring-blue-200 dark:ring-blue-500/30 ${getInitialColor(agent.name)} group-hover:scale-105 transition-transform`}>
                            {getInitials(agent.name)}
                          </div>
                        )}
                        <p className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] mt-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{agent.name}</p>
                        {!multiChannel && (
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap justify-center">
                            {agentChannels.slice(0, 3).map((ch, ci) => (
                              <ChannelTag key={ci} name={ch.name} org={ch.org} />
                            ))}
                          </div>
                        )}
                      </div>

                      {!multiChannel ? (
                        /* Single channel — show flat stats grid */
                        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                          <div className="text-center sm:text-left">
                            <p className="text-[10px] font-medium text-gray-400 dark:text-[#5B5D67] uppercase tracking-widest mb-1">Total Cases</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-[#E8E9ED] tabular-nums">{agent.totalCases}</p>
                            <p className="text-[10px] text-gray-400 dark:text-[#5B5D67]">Resolved: {agent.resolvedCases || 0}</p>
                          </div>
                          <div className="text-center sm:text-left">
                            <p className="text-[10px] font-medium text-gray-400 dark:text-[#5B5D67] uppercase tracking-widest mb-1">Avg Response</p>
                            <p className={`text-3xl font-bold tabular-nums ${getResponseColor(agent.avgResponseTime)}`}>{formatTime(agent.avgResponseTime)}</p>
                          </div>
                          <div className="text-center sm:text-left">
                            <p className="text-[10px] font-medium text-gray-400 dark:text-[#5B5D67] uppercase tracking-widest mb-1">Fastest</p>
                            <p className={`text-3xl font-bold tabular-nums ${getResponseColor(agent.fastestResponse)}`}>{formatTime(agent.fastestResponse)}</p>
                          </div>
                          <div className="text-center sm:text-left">
                            <p className="text-[10px] font-medium text-gray-400 dark:text-[#5B5D67] uppercase tracking-widest mb-1">Consistency</p>
                            <p className={`text-3xl font-bold tabular-nums ${
                              agent.consistency >= 70 ? 'text-emerald-600 dark:text-emerald-400' :
                              agent.consistency >= 40 ? 'text-amber-600 dark:text-amber-400' :
                              'text-red-600 dark:text-red-400'
                            }`}>{agent.consistency}%</p>
                          </div>
                        </div>
                      ) : (
                        /* Multi-channel — show aggregate summary next to avatar */
                        <div className="flex-1 flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {agentChannels.map((ch, ci) => (
                              <ChannelTag key={ci} name={ch.name} org={ch.org} />
                            ))}
                          </div>
                          <div className="flex items-baseline gap-4 mt-2">
                            <div>
                              <span className="text-2xl font-bold text-gray-900 dark:text-[#E8E9ED] tabular-nums">{agent.totalCases}</span>
                              <span className="text-xs text-gray-400 dark:text-[#5B5D67] ml-1.5">total cases</span>
                            </div>
                            <div>
                              <span className={`text-2xl font-bold tabular-nums ${getResponseColor(agent.avgResponseTime)}`}>{formatTime(agent.avgResponseTime)}</span>
                              <span className="text-xs text-gray-400 dark:text-[#5B5D67] ml-1.5">avg</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Channel comparison cards */}
                    {multiChannel && (
                      <div className={`grid gap-3 ${agentChannels.length === 2 ? 'grid-cols-2' : agentChannels.length === 3 ? 'grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}>
                        {agentChannels.map((ch) => {
                          const orgCfg = ORG_COLORS[ch.org] || ORG_COLORS['Stake.com'];
                          const pct = agent.totalCases > 0 ? Math.round(ch.cases / agent.totalCases * 100) : 0;
                          return (
                            <motion.div
                              key={ch.slackChannelId}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.25 }}
                              className="bg-white/60 dark:bg-[#111116]/60 rounded-lg p-3.5 border border-gray-200/50 dark:border-[#1E1E28]/50"
                            >
                              {/* Channel header */}
                              <div className="flex items-center justify-between mb-3">
                                <span className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border font-medium ${orgCfg.bg} ${orgCfg.text} ${orgCfg.border}`}>
                                  <Hash className="w-2.5 h-2.5" />{ch.name}
                                </span>
                                <span className="text-[10px] text-gray-400 dark:text-[#5B5D67] tabular-nums">{pct}%</span>
                              </div>

                              {/* Channel stats */}
                              <div className="space-y-2.5">
                                <div>
                                  <p className="text-[9px] font-medium text-gray-400 dark:text-[#5B5D67] uppercase tracking-widest mb-0.5">Cases</p>
                                  <p className="text-xl font-bold text-gray-900 dark:text-[#E8E9ED] tabular-nums">{ch.cases}</p>
                                  <p className="text-[9px] text-gray-400 dark:text-[#5B5D67]">Resolved: {ch.resolved || 0}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] font-medium text-gray-400 dark:text-[#5B5D67] uppercase tracking-widest mb-0.5">Avg Response</p>
                                  <p className={`text-xl font-bold tabular-nums ${getResponseColor(ch.avgResponseTime)}`}>{formatTime(ch.avgResponseTime)}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] font-medium text-gray-400 dark:text-[#5B5D67] uppercase tracking-widest mb-0.5">Fastest</p>
                                  <p className={`text-xl font-bold tabular-nums ${getResponseColor(ch.fastestResponse)}`}>{formatTime(ch.fastestResponse)}</p>
                                </div>
                              </div>

                              {/* Volume bar */}
                              <div className="mt-3 pt-2 border-t border-gray-200/30 dark:border-[#1E1E28]/30">
                                <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-[#1E1E28] overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%`, backgroundColor: orgCfg.fill }}
                                  />
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()
            ) : sorted.length === 2 ? (
              /* --- Two agents comparison --- */
              <div className="flex flex-col sm:flex-row items-stretch gap-4">
                {sorted.map((agent, ai) => (
                  <div
                    key={agent._id}
                    className="flex-1 bg-white/60 dark:bg-[#111116]/60 rounded-lg p-4 cursor-pointer group hover:bg-white dark:hover:bg-[#141419] transition-colors"
                    onClick={() => navigate(`/kyc-goals/agent/${agent._id}`)}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {agent.slackAvatarUrl ? (
                        <img src={agent.slackAvatarUrl} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-[#252530] group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ring-2 ring-gray-200 dark:ring-[#252530] ${getInitialColor(agent.name)} group-hover:scale-105 transition-transform`}>
                          {getInitials(agent.name)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{agent.name}</p>
                        <div className="flex gap-1 mt-0.5">
                          {(agent.channels || []).slice(0, 2).map((ch, ci) => (
                            <ChannelTag key={ci} name={ch.name} org={ch.org} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] font-medium text-gray-400 dark:text-[#5B5D67] uppercase tracking-widest mb-0.5">Cases</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-[#E8E9ED] tabular-nums">{agent.totalCases}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-gray-400 dark:text-[#5B5D67] uppercase tracking-widest mb-0.5">Avg Response</p>
                        <p className={`text-2xl font-bold tabular-nums ${getResponseColor(agent.avgResponseTime)}`}>{formatTime(agent.avgResponseTime)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-gray-400 dark:text-[#5B5D67] uppercase tracking-widest mb-0.5">Fastest</p>
                        <p className={`text-2xl font-bold tabular-nums ${getResponseColor(agent.fastestResponse)}`}>{formatTime(agent.fastestResponse)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-gray-400 dark:text-[#5B5D67] uppercase tracking-widest mb-0.5">Consistency</p>
                        <p className={`text-2xl font-bold tabular-nums ${
                          agent.consistency >= 70 ? 'text-emerald-600 dark:text-emerald-400' :
                          agent.consistency >= 40 ? 'text-amber-600 dark:text-amber-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>{agent.consistency}%</p>
                      </div>
                    </div>
                    {/* Shift distribution bar */}
                    {agent.shiftDistribution && (
                      <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-[#1E1E28]/50">
                        <div className="flex items-center gap-3">
                          {Object.entries(agent.shiftDistribution).filter(([,v]) => v > 0).map(([shift, count]) => {
                            const ShiftIcon = SHIFT_ICONS[shift] || Sun;
                            const total = Object.values(agent.shiftDistribution).reduce((s, v) => s + v, 0);
                            return (
                              <div key={shift} className="flex items-center gap-1">
                                <ShiftIcon className={`w-3 h-3 ${shift === 'morning' ? 'text-amber-500' : shift === 'afternoon' ? 'text-orange-500' : 'text-blue-500'}`} />
                                <span className="text-[10px] text-gray-500 dark:text-[#6B6D77] tabular-nums">{Math.round(count / total * 100)}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* --- No agents (empty filtered result) --- */
              <div className="text-center py-8">
                <Users className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-[#3A3A45]" />
                <p className="text-sm text-gray-500 dark:text-[#6B6D77]">No data for current filters</p>
              </div>
            )}

            {/* Overview stats row - always visible when < 3 agents */}
            {overview && sorted.length > 0 && (
              <div className="flex items-center justify-around mt-5 pt-4 border-t border-gray-200/50 dark:border-[#1E1E28]">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900 dark:text-[#E8E9ED] tabular-nums">{overview.totalCases.value}</p>
                  <p className="text-[10px] text-gray-400 dark:text-[#5B5D67]">Total Cases</p>
                </div>
                <div className="text-center">
                  <p className={`text-lg font-bold tabular-nums ${getResponseColor(overview.avgResponseTime.value)}`}>{formatTime(overview.avgResponseTime.value)}</p>
                  <p className="text-[10px] text-gray-400 dark:text-[#5B5D67]">Avg Response</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900 dark:text-[#E8E9ED] tabular-nums">{overview.activeAgents.value}</p>
                  <p className="text-[10px] text-gray-400 dark:text-[#5B5D67]">Agents</p>
                </div>
                {overview.avgHandlingTime > 0 && (
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-[#E8E9ED] tabular-nums">{formatTime(overview.avgHandlingTime)}</p>
                    <p className="text-[10px] text-gray-400 dark:text-[#5B5D67]">Handling Time</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Team sections */}
      <AnimatePresence mode="popLayout">
        {teamGroups.map(([teamName, teamAgents]) => (
          <TeamSection key={teamName} teamName={teamName} agents={teamAgents} navigate={navigate} />
        ))}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// CHANNEL HEALTH CARD
// ============================================

const ChannelCard = ({ channel, orgColor, rank, navigate }) => {
  const sparkData = Object.entries(channel.dailyVolume || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ label: date, value: count }));

  const noBotInstalled = channel.botInstalled === false;
  const isPending = !channel.totalCases && !channel.agents?.length;
  const resolveRate = channel.totalCases > 0 ? Math.round((channel.resolvedCases / channel.totalCases) * 100) : 0;

  if (isPending) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: Math.min(rank * 0.03, 0.3) }}
        className="border border-dashed border-gray-200 dark:border-[#252530] rounded-xl p-4 opacity-50"
      >
        <div className="flex items-center gap-2 mb-2">
          <Hash className="w-3.5 h-3.5 text-gray-300 dark:text-[#3A3A45]" />
          <span className="text-sm font-medium text-gray-400 dark:text-[#5B5D67]">{channel.name}</span>
        </div>
        <p className="text-xs text-gray-400 dark:text-[#5B5D67]">{noBotInstalled ? 'Bot not installed' : 'No data yet'}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      layoutId={`channel-card-${channel.slackChannelId}`}
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      transition={{ duration: 0.3, delay: Math.min(rank * 0.02, 0.2), layout: { duration: 0.3, type: 'spring', stiffness: 500, damping: 35 } }}
      onClick={() => navigate(`/kyc-goals/channel/${channel._id || channel.slackChannelId}`)}
      className="group relative bg-white dark:bg-[#141419] border border-gray-200/80 dark:border-[#1E1E28] rounded-xl p-4 hover:border-gray-300 dark:hover:border-[#2A2A35] hover:shadow-sm transition-all cursor-pointer"
    >
      {/* Channel header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Hash className="w-3.5 h-3.5 flex-shrink-0" style={{ color: orgColor || '#6b7280' }} />
          <span className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] truncate">{channel.name}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {noBotInstalled && (
            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 font-bold uppercase tracking-wider">No Bot</span>
          )}
          {channel.trackingMode !== 'full' && (
            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-[#1E1E28] dark:text-[#5B5D67] font-bold uppercase tracking-wider">
              {channel.trackingMode === 'hybrid' ? 'Hybrid' : 'Msg'}
            </span>
          )}
        </div>
      </div>

      {/* Main stats */}
      <div className="flex items-baseline justify-between mb-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-gray-900 dark:text-[#E8E9ED] tabular-nums">{channel.totalCases}</span>
          <span className="text-[10px] text-gray-400 dark:text-[#5B5D67]">cases</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${getResponseDot(channel.avgResponseTime)}`} />
          <span className={`text-xs font-medium tabular-nums ${getResponseColor(channel.avgResponseTime)}`}>
            {formatTime(channel.avgResponseTime)}
          </span>
        </div>
      </div>

      {/* Secondary stats row */}
      <div className="flex items-center gap-3 mb-3 text-[11px]">
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3 text-gray-400 dark:text-[#5B5D67]" />
          <span className="text-gray-600 dark:text-[#9A9BA3] tabular-nums">{channel.activeAgents}</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-gray-400 dark:text-[#5B5D67]" />
          <span className="text-gray-600 dark:text-[#9A9BA3] tabular-nums">{resolveRate}%</span>
        </div>
        {channel.backlog > 0 && (
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-500" />
            <span className={`tabular-nums font-medium ${
              channel.backlog > 5 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
            }`}>{channel.backlog}</span>
          </div>
        )}
        {sparkData.length > 0 && (
          <div className="ml-auto">
            <MiniSparkline data={sparkData} color={orgColor || '#3b82f6'} />
          </div>
        )}
      </div>

      {/* Top agents */}
      {channel.agents?.length > 0 && (
        <div className="pt-2.5 border-t border-gray-100 dark:border-[#1E1E28]">
          <div className="space-y-1.5">
            {channel.agents.slice(0, 3).map((a, i) => {
              const pct = channel.totalCases > 0 ? Math.round(a.cases / channel.totalCases * 100) : 0;
              return (
                <div key={a._id || i} className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-gray-500 dark:text-[#5B5D67] w-3 tabular-nums">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] text-gray-700 dark:text-[#A0A2AC] truncate">{a.name}</span>
                      <span className="text-[10px] text-gray-500 dark:text-[#6B6D77] tabular-nums ml-2 flex-shrink-0">{a.cases}</span>
                    </div>
                    <div className="w-full h-1 rounded-full bg-gray-100 dark:bg-[#1E1E28] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: orgColor || '#3b82f6', opacity: 0.6 }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {channel.agents.length > 3 && (
              <span className="text-[10px] text-gray-400 dark:text-[#5B5D67] pl-5">+{channel.agents.length - 3} more</span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ============================================
// CHANNELS VIEW
// ============================================

const ChannelsView = ({ channels, loading, overview, navigate }) => {
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

  // Aggregate stats across all visible channels
  const allChannelsList = orgs.flatMap(([, chs]) => chs);
  const totalCasesAll = allChannelsList.reduce((s, c) => s + (c.totalCases || 0), 0);
  const activeChannels = allChannelsList.filter(c => c.totalCases > 0).length;
  const totalBacklog = allChannelsList.reduce((s, c) => s + (c.backlog || 0), 0);
  const top3 = [...allChannelsList].filter(c => c.totalCases > 0).sort((a, b) => b.totalCases - a.totalCases).slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Hero section */}
      <div
        className="relative rounded-xl p-6 sm:p-8 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.04) 0%, transparent 40%, rgba(16,185,129,0.03) 100%)',
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.15] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, currentColor 0.5px, transparent 0.5px)',
            backgroundSize: '20px 20px',
            color: '#94a3b8',
          }}
        />

        <div className="relative">
          {top3.length >= 3 ? (
            /* Top 3 channels display */
            <div className="flex items-start justify-between gap-4">
              <div className="hidden lg:flex flex-col gap-4 pt-6 min-w-[120px]">
                <div>
                  <p className="text-[10px] font-medium text-gray-400 dark:text-[#5B5D67] uppercase tracking-widest mb-1">Total Cases</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-[#E8E9ED] tabular-nums">{totalCasesAll}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-gray-400 dark:text-[#5B5D67] uppercase tracking-widest mb-1">Active Channels</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-[#E8E9ED] tabular-nums">{activeChannels}</p>
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] mb-6 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-blue-500" />
                  Busiest Channels
                </h3>
                <div className="flex items-end justify-center gap-4 sm:gap-8">
                  {[top3[1], top3[0], top3[2]].map((ch, i) => {
                    if (!ch) return null;
                    const orgCfg = ORG_COLORS[orgs.find(([, chs]) => chs.some(c => c.slackChannelId === ch.slackChannelId))?.[0]] || ORG_COLORS['Stake.com'];
                    const barHeights = ['h-16', 'h-24', 'h-12'];
                    const barRanks = [2, 1, 3];
                    return (
                      <div key={ch.slackChannelId} className="flex flex-col items-center">
                        <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-medium mb-2 ${orgCfg.bg} ${orgCfg.text} ${orgCfg.border}`}>
                          <Hash className="w-2.5 h-2.5" />{ch.name}
                        </span>
                        <p className="text-[11px] text-gray-600 dark:text-[#9A9BA3] font-bold tabular-nums">{ch.totalCases} cases</p>
                        <p className={`text-[10px] tabular-nums ${getResponseColor(ch.avgResponseTime)}`}>{formatTime(ch.avgResponseTime)}</p>
                        <div className={`mt-2 w-16 sm:w-20 ${barHeights[i]} rounded-t-lg flex items-center justify-center ${
                          barRanks[i] === 1 ? 'bg-gradient-to-t from-blue-200/60 to-blue-100/30 dark:from-blue-500/20 dark:to-blue-500/5' :
                          barRanks[i] === 2 ? 'bg-gradient-to-t from-gray-200/80 to-gray-100/30 dark:from-[#252530] dark:to-[#1E1E28]' :
                          'bg-gradient-to-t from-emerald-200/60 to-emerald-100/30 dark:from-emerald-500/15 dark:to-emerald-500/5'
                        }`}>
                          <span className={`text-base font-bold ${
                            barRanks[i] === 1 ? 'text-blue-600 dark:text-blue-400' :
                            barRanks[i] === 2 ? 'text-gray-500 dark:text-[#6B6D77]' :
                            'text-emerald-600 dark:text-emerald-400'
                          }`}>#{barRanks[i]}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="hidden lg:flex flex-col gap-4 pt-6 min-w-[120px] items-end text-right">
                {overview && (
                  <>
                    <div>
                      <p className="text-[10px] font-medium text-gray-400 dark:text-[#5B5D67] uppercase tracking-widest mb-1">Avg Response</p>
                      <p className={`text-2xl font-bold tabular-nums ${getResponseColor(overview.avgResponseTime.value)}`}>{formatTime(overview.avgResponseTime.value)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-gray-400 dark:text-[#5B5D67] uppercase tracking-widest mb-1">Open Backlog</p>
                      <p className={`text-2xl font-bold tabular-nums ${
                        totalBacklog > 10 ? 'text-red-600 dark:text-red-400' :
                        totalBacklog > 0 ? 'text-amber-600 dark:text-amber-400' :
                        'text-emerald-600 dark:text-emerald-400'
                      }`}>{totalBacklog}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Fewer than 3 channels — simple stats */
            <div className="flex items-center justify-around py-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-[#E8E9ED] tabular-nums">{totalCasesAll}</p>
                <p className="text-[10px] text-gray-400 dark:text-[#5B5D67]">Total Cases</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-[#E8E9ED] tabular-nums">{activeChannels}</p>
                <p className="text-[10px] text-gray-400 dark:text-[#5B5D67]">Channels</p>
              </div>
              {overview && (
                <div className="text-center">
                  <p className={`text-2xl font-bold tabular-nums ${getResponseColor(overview.avgResponseTime.value)}`}>{formatTime(overview.avgResponseTime.value)}</p>
                  <p className="text-[10px] text-gray-400 dark:text-[#5B5D67]">Avg Response</p>
                </div>
              )}
              <div className="text-center">
                <p className={`text-2xl font-bold tabular-nums ${
                  totalBacklog > 10 ? 'text-red-600 dark:text-red-400' :
                  totalBacklog > 0 ? 'text-amber-600 dark:text-amber-400' :
                  'text-emerald-600 dark:text-emerald-400'
                }`}>{totalBacklog}</p>
                <p className="text-[10px] text-gray-400 dark:text-[#5B5D67]">Open Backlog</p>
              </div>
            </div>
          )}

          {/* Mobile stats */}
          {top3.length >= 3 && (
            <div className="flex items-center justify-around mt-5 pt-4 border-t border-gray-200/50 dark:border-[#1E1E28] lg:hidden">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-[#E8E9ED] tabular-nums">{totalCasesAll}</p>
                <p className="text-[10px] text-gray-400 dark:text-[#5B5D67]">Cases</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-[#E8E9ED] tabular-nums">{activeChannels}</p>
                <p className="text-[10px] text-gray-400 dark:text-[#5B5D67]">Channels</p>
              </div>
              {overview && (
                <div className="text-center">
                  <p className={`text-lg font-bold tabular-nums ${getResponseColor(overview.avgResponseTime.value)}`}>{formatTime(overview.avgResponseTime.value)}</p>
                  <p className="text-[10px] text-gray-400 dark:text-[#5B5D67]">Avg Response</p>
                </div>
              )}
              <div className="text-center">
                <p className={`text-lg font-bold tabular-nums ${totalBacklog > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{totalBacklog}</p>
                <p className="text-[10px] text-gray-400 dark:text-[#5B5D67]">Backlog</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Org sections */}
      <AnimatePresence mode="popLayout">
        {orgs.map(([org, chs]) => {
          const orgCfg = ORG_COLORS[org] || ORG_COLORS['Stake.com'];
          const cfg = TEAM_PATTERNS[org] || TEAM_PATTERNS['Stake.com'];
          const totalCases = chs.reduce((s, c) => s + (c.totalCases || 0), 0);
          const sortedChs = [...chs].sort((a, b) => b.totalCases - a.totalCases);

          return (
            <motion.div
              key={org}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.accent }} />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED]">{org}</h3>
                  <span className="text-[10px] text-gray-400 dark:text-[#5B5D67] tabular-nums">{chs.length} channel{chs.length !== 1 ? 's' : ''}</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-[#6B6D77] tabular-nums font-medium">{totalCases} cases</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                <AnimatePresence mode="popLayout">
                  {sortedChs.map((ch, i) => (
                    <ChannelCard key={ch._id || ch.slackChannelId} channel={ch} orgColor={orgCfg.fill} rank={i} navigate={navigate} />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// TRENDS VIEW
// ============================================

const HeatmapCell = ({ count, maxCount }) => {
  const intensity = maxCount > 0 ? count / maxCount : 0;
  const bg = intensity === 0
    ? 'bg-gray-50 dark:bg-[#111116]'
    : intensity < 0.25 ? 'bg-blue-100/60 dark:bg-blue-500/10'
    : intensity < 0.5 ? 'bg-blue-200/70 dark:bg-blue-500/20'
    : intensity < 0.75 ? 'bg-blue-300/80 dark:bg-blue-500/35'
    : 'bg-blue-400/90 dark:bg-blue-500/50';
  return (
    <div className={`w-full aspect-square rounded-[3px] ${bg} transition-colors`} title={`${count} cases`} />
  );
};

const TrendStatCard = ({ label, value, sub, icon: Icon, color = 'text-gray-900 dark:text-[#E8E9ED]', delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    className="relative overflow-hidden"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[10px] text-gray-400 dark:text-[#5B5D67] uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
        {sub && <p className="text-[11px] text-gray-400 dark:text-[#5B5D67] mt-0.5">{sub}</p>}
      </div>
      {Icon && <Icon className="w-4 h-4 text-gray-300 dark:text-[#2A2A35]" />}
    </div>
  </motion.div>
);

const TrendsView = ({ trends, loading, navigate }) => {
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

  const summary = trends.summary || {};
  const dailyCases = (trends.dailyCases || []).map(d => ({ date: d.date?.slice(5) || d.date, total: d.total, ...d.byChannel }));
  const dailyResponse = (trends.dailyResponseTime || []).map(d => ({
    date: d.date?.slice(5) || d.date,
    avg: d.avg ? Math.round(d.avg / 60) : 0,
    p50: d.p50 ? Math.round(d.p50 / 60) : 0,
    p90: d.p90 ? Math.round(d.p90 / 60) : 0,
    min: d.min ? Math.round(d.min / 60) : 0,
    max: d.max ? Math.round(d.max / 60) : 0
  }));
  const dailyAgents = (trends.dailyActiveAgents || []).map(d => ({ date: d.date?.slice(5) || d.date, count: d.count }));
  const shiftDist = (trends.shiftDistribution || []).map(d => ({
    date: d.date?.slice(5) || d.date,
    morning: d.morning || 0, afternoon: d.afternoon || 0, night: d.night || 0
  }));
  const dailyResolution = (trends.dailyResolution || []).map(d => ({
    date: d.date?.slice(5) || d.date, rate: d.rate, total: d.total, resolved: d.resolved
  }));
  const channelVolume = trends.channelVolume || [];
  const topAgents = trends.topAgents || [];
  const hourlyHeatmap = trends.hourlyHeatmap || [];
  const maxChannelVol = channelVolume.length > 0 ? channelVolume[0].total : 1;

  // Heatmap: 7 days x 24 hours
  const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const heatmapGrid = Array.from({ length: 7 }, () => Array(24).fill(0));
  let maxHeatCount = 0;
  hourlyHeatmap.forEach(h => {
    const dowIdx = (h.dow || 1) - 1;
    if (dowIdx >= 0 && dowIdx < 7 && h.hour >= 0 && h.hour < 24) {
      heatmapGrid[dowIdx][h.hour] = h.count;
      if (h.count > maxHeatCount) maxHeatCount = h.count;
    }
  });

  // Collect unique channel names from dailyCases for stacked bars
  const channelNames = new Set();
  (trends.dailyCases || []).forEach(d => {
    Object.keys(d.byChannel || {}).forEach(n => channelNames.add(n));
  });
  const channelList = [...channelNames];

  // Assign org color to each channel
  const channelOrgColorMap = {};
  channelVolume.forEach(cv => {
    const orgCfg = ORG_COLORS[cv.org];
    channelOrgColorMap[cv.channel] = orgCfg?.fill || '#6b7280';
  });

  return (
    <div className="space-y-6">
      {/* Hero Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative rounded-xl border border-gray-200/80 dark:border-[#1E1E28] bg-gray-50/50 dark:bg-[#111116]/50 p-5 sm:p-6 overflow-hidden"
      >
        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.15] pointer-events-none text-gray-400 dark:text-gray-500"
          style={{ backgroundImage: 'radial-gradient(circle, currentColor 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }}
        />
        <div className="relative grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-5 sm:gap-6">
          <TrendStatCard label="Total Cases" value={summary.totalCases?.toLocaleString() || '0'} icon={BarChart3} delay={0} />
          <TrendStatCard label="Resolved" value={summary.totalResolved?.toLocaleString() || '0'} sub={`${summary.resolutionRate || 0}% rate`} icon={CheckCircle2} color="text-emerald-600 dark:text-emerald-400" delay={0.03} />
          <TrendStatCard label="Avg / Day" value={summary.avgDailyCases || '0'} icon={TrendingUp} delay={0.06} />
          <TrendStatCard label="Peak Day" value={summary.peakDay?.total?.toLocaleString() || '-'} sub={summary.peakDay?.date?.slice(5) || ''} icon={Zap} color="text-amber-600 dark:text-amber-400" delay={0.09} />
          <TrendStatCard label="Avg Response" value={formatTimeShort(summary.avgResponseTime)} icon={Clock} color={getResponseColor(summary.avgResponseTime)} delay={0.12} />
          <TrendStatCard label="Active Days" value={summary.totalDays || '0'} icon={Calendar} delay={0.15} />
          <TrendStatCard label="Agents" value={summary.totalAgents || '0'} icon={Users} delay={0.18} />
        </div>
      </motion.div>

      {/* Daily Case Volume - Stacked by Channel */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
        className="border border-gray-200/80 dark:border-[#1E1E28] rounded-xl p-5 bg-white dark:bg-[#0C0C10]"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-gray-400 dark:text-[#5B5D67]" />
            Daily Case Volume
          </h3>
          <span className="text-[10px] text-gray-400 dark:text-[#5B5D67] uppercase tracking-wider">by channel</span>
        </div>
        {dailyCases.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyCases} barSize={dailyCases.length > 14 ? undefined : 20}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-100 dark:text-[#1A1A22]" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-gray-400 dark:text-[#5B5D67]" />
              <YAxis tick={{ fontSize: 10 }} className="text-gray-400 dark:text-[#5B5D67]" />
              <Tooltip content={<ChartTooltip />} />
              {channelList.length > 0 ? channelList.map((ch, i) => (
                <Bar key={ch} dataKey={ch} name={ch} stackId="volume" fill={channelOrgColorMap[ch] || `hsl(${(i * 37) % 360}, 60%, 55%)`} radius={i === channelList.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]} />
              )) : (
                <Bar dataKey="total" name="Cases" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-xs text-gray-400 dark:text-[#5B5D67] py-8 text-center">No daily data</p>}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Response Time with P50 + P90 bands */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}
          className="border border-gray-200/80 dark:border-[#1E1E28] rounded-xl p-5 bg-white dark:bg-[#0C0C10]"
        >
          <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400 dark:text-[#5B5D67]" />
            Response Time (min)
          </h3>
          {dailyResponse.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={dailyResponse}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-100 dark:text-[#1A1A22]" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} className="text-gray-400 dark:text-[#5B5D67]" />
                <YAxis tick={{ fontSize: 9 }} className="text-gray-400 dark:text-[#5B5D67]" />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="p90" name="P90" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                <Line type="monotone" dataKey="avg" name="Avg" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="p50" name="Median" stroke="#10b981" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-gray-400 dark:text-[#5B5D67] py-8 text-center">No data</p>}
          <div className="flex items-center justify-center gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-[#5B5D67]"><span className="w-3 h-0.5 bg-emerald-500 rounded" />Median</span>
            <span className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-[#5B5D67]"><span className="w-3 h-0.5 bg-blue-500 rounded" />Average</span>
            <span className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-[#5B5D67]"><span className="w-3 h-0.5 bg-red-500 rounded border-dashed" />P90</span>
          </div>
        </motion.div>

        {/* Resolution Rate Over Time */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}
          className="border border-gray-200/80 dark:border-[#1E1E28] rounded-xl p-5 bg-white dark:bg-[#0C0C10]"
        >
          <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-gray-400 dark:text-[#5B5D67]" />
            Daily Resolution Rate
          </h3>
          {dailyResolution.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={dailyResolution}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-100 dark:text-[#1A1A22]" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} className="text-gray-400 dark:text-[#5B5D67]" />
                <YAxis tick={{ fontSize: 9 }} domain={[0, 100]} unit="%" className="text-gray-400 dark:text-[#5B5D67]" />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="rate" name="Resolution %" stroke="#10b981" fill="#10b981" fillOpacity={0.08} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-gray-400 dark:text-[#5B5D67] py-8 text-center">No data</p>}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Active Agents per Day */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.25 }}
          className="border border-gray-200/80 dark:border-[#1E1E28] rounded-xl p-5 bg-white dark:bg-[#0C0C10]"
        >
          <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400 dark:text-[#5B5D67]" />
            Active Agents / Day
          </h3>
          {dailyAgents.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={dailyAgents}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-100 dark:text-[#1A1A22]" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} className="text-gray-400 dark:text-[#5B5D67]" />
                <YAxis tick={{ fontSize: 9 }} className="text-gray-400 dark:text-[#5B5D67]" />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="count" name="Agents" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.08} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-gray-400 dark:text-[#5B5D67] py-8 text-center">No data</p>}
        </motion.div>

        {/* Shift Distribution */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}
          className="border border-gray-200/80 dark:border-[#1E1E28] rounded-xl p-5 bg-white dark:bg-[#0C0C10]"
        >
          <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] mb-4 flex items-center gap-2">
            <Sun className="w-4 h-4 text-gray-400 dark:text-[#5B5D67]" />
            Shift Distribution
          </h3>
          {shiftDist.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={shiftDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-100 dark:text-[#1A1A22]" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} className="text-gray-400 dark:text-[#5B5D67]" />
                  <YAxis tick={{ fontSize: 9 }} className="text-gray-400 dark:text-[#5B5D67]" />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="morning" name="Morning" stackId="1" stroke={SHIFT_COLORS.morning} fill={SHIFT_COLORS.morning} fillOpacity={0.5} />
                  <Area type="monotone" dataKey="afternoon" name="Afternoon" stackId="1" stroke={SHIFT_COLORS.afternoon} fill={SHIFT_COLORS.afternoon} fillOpacity={0.5} />
                  <Area type="monotone" dataKey="night" name="Night" stackId="1" stroke={SHIFT_COLORS.night} fill={SHIFT_COLORS.night} fillOpacity={0.5} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-4 mt-2">
                {[['morning', 'Morning', SHIFT_COLORS.morning], ['afternoon', 'Afternoon', SHIFT_COLORS.afternoon], ['night', 'Night', SHIFT_COLORS.night]].map(([key, name, color]) => (
                  <span key={key} className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-[#5B5D67]">
                    <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />{name}
                  </span>
                ))}
              </div>
            </>
          ) : <p className="text-xs text-gray-400 dark:text-[#5B5D67] py-8 text-center">No data</p>}
        </motion.div>
      </div>

      {/* Channel Breakdown + Top Agents side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Channel Volume Breakdown */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.35 }}
          className="border border-gray-200/80 dark:border-[#1E1E28] rounded-xl p-5 bg-white dark:bg-[#0C0C10]"
        >
          <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] mb-4 flex items-center gap-2">
            <Hash className="w-4 h-4 text-gray-400 dark:text-[#5B5D67]" />
            Channel Breakdown
          </h3>
          {channelVolume.length > 0 ? (
            <div className="space-y-2.5">
              {channelVolume.map((ch, i) => {
                const orgCfg = ORG_COLORS[ch.org];
                const pct = maxChannelVol > 0 ? (ch.total / maxChannelVol) * 100 : 0;
                return (
                  <div key={ch.channel} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${orgCfg?.dot || 'bg-gray-400'}`} />
                        <span className="text-xs font-medium text-gray-700 dark:text-[#C8C9CD] truncate">{ch.channel}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-[10px] text-gray-400 dark:text-[#5B5D67] tabular-nums">{ch.rate}%</span>
                        <span className="text-xs font-semibold text-gray-900 dark:text-[#E8E9ED] tabular-nums w-8 text-right">{ch.total}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-[#1A1A22] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, delay: 0.35 + i * 0.03 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: orgCfg?.fill || '#6b7280' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-xs text-gray-400 dark:text-[#5B5D67] py-8 text-center">No data</p>}
        </motion.div>

        {/* Top Agents */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }}
          className="border border-gray-200/80 dark:border-[#1E1E28] rounded-xl p-5 bg-white dark:bg-[#0C0C10]"
        >
          <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-gray-400 dark:text-[#5B5D67]" />
            Top Performers
          </h3>
          {topAgents.length > 0 ? (
            <div className="space-y-2">
              {topAgents.map((agent, i) => {
                const maxCases = topAgents[0].cases || 1;
                const pct = (agent.cases / maxCases) * 100;
                return (
                  <div
                    key={agent.agentId || i}
                    className="flex items-center gap-3 py-1.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#111116] rounded-lg px-2 -mx-2 transition-colors"
                    onClick={() => agent.agentId && navigate(`/kyc-goals/agent/${agent.agentId}`)}
                  >
                    <span className="text-[10px] text-gray-400 dark:text-[#5B5D67] tabular-nums w-4 text-right font-medium">{i + 1}</span>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${getInitialColor(agent.name)}`}>
                      {getInitials(agent.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium text-gray-900 dark:text-[#E8E9ED] truncate">{agent.name}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-[10px] tabular-nums ${getResponseColor(agent.avgResponse)}`}>{formatTimeShort(agent.avgResponse)}</span>
                          <span className="text-xs font-semibold text-gray-900 dark:text-[#E8E9ED] tabular-nums">{agent.cases}</span>
                        </div>
                      </div>
                      <div className="h-1 bg-gray-100 dark:bg-[#1A1A22] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5, delay: 0.4 + i * 0.03 }}
                          className="h-full rounded-full bg-amber-400 dark:bg-amber-500/60"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-xs text-gray-400 dark:text-[#5B5D67] py-8 text-center">No data</p>}
        </motion.div>
      </div>

      {/* Hourly Activity Heatmap */}
      {hourlyHeatmap.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.45 }}
          className="border border-gray-200/80 dark:border-[#1E1E28] rounded-xl p-5 bg-white dark:bg-[#0C0C10]"
        >
          <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-gray-400 dark:text-[#5B5D67]" />
            Activity Heatmap
          </h3>
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Hour labels */}
              <div className="flex items-center gap-0.5 mb-1 ml-10">
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={h} className="flex-1 text-center text-[8px] text-gray-400 dark:text-[#5B5D67] tabular-nums">
                    {h % 3 === 0 ? `${String(h).padStart(2, '0')}` : ''}
                  </div>
                ))}
              </div>
              {/* Rows */}
              {heatmapGrid.map((row, dowIdx) => (
                <div key={dowIdx} className="flex items-center gap-0.5 mb-0.5">
                  <span className="text-[9px] text-gray-400 dark:text-[#5B5D67] w-9 text-right pr-1.5 flex-shrink-0">{DOW_LABELS[dowIdx]}</span>
                  {row.map((count, hour) => (
                    <div key={hour} className="flex-1">
                      <HeatmapCell count={count} maxCount={maxHeatCount} />
                    </div>
                  ))}
                </div>
              ))}
              {/* Legend */}
              <div className="flex items-center justify-end gap-1 mt-2 mr-1">
                <span className="text-[9px] text-gray-400 dark:text-[#5B5D67] mr-1">Less</span>
                {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
                  <div key={i} className={`w-3 h-3 rounded-[2px] ${
                    intensity === 0 ? 'bg-gray-50 dark:bg-[#111116] border border-gray-200 dark:border-[#1E1E28]'
                    : intensity < 0.5 ? 'bg-blue-200/70 dark:bg-blue-500/20'
                    : intensity < 0.75 ? 'bg-blue-300/80 dark:bg-blue-500/35'
                    : 'bg-blue-400/90 dark:bg-blue-500/50'
                  }`} />
                ))}
                <span className="text-[9px] text-gray-400 dark:text-[#5B5D67] ml-1">More</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const KYCGoals = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const view = searchParams.get('view') || 'agents';
  const [period, setPeriod] = useState('7d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [overview, setOverview] = useState(null);
  const [agents, setAgents] = useState([]);
  const [channels, setChannels] = useState({});
  const [trends, setTrends] = useState(null);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [refetching, setRefetching] = useState(false);
  const pollingRef = useRef(null);

  // Filters
  const [channelFilter, setChannelFilter] = useState([]);
  const [agentFilter, setAgentFilter] = useState([]);
  const [allChannels, setAllChannels] = useState([]);
  const [allAgentsList, setAllAgentsList] = useState([]);

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
    if (channelFilter.length) params.channelIds = channelFilter.join(',');
    if (agentFilter.length) params.agentIds = agentFilter.join(',');
    return params;
  }, [getDateRange, channelFilter, agentFilter]);

  const fetchConfig = useCallback(async () => {
    try {
      const range = getDateRange();
      const [configRes, agentsRes] = await Promise.all([
        axios.get(`${API_URL}/api/kyc-goals/config`, getAuthHeaders()),
        axios.get(`${API_URL}/api/kyc-goals/agents`, { ...getAuthHeaders(), params: range })
      ]);
      if (configRes.data.success) setAllChannels(configRes.data.channels || []);
      if (agentsRes.data.success) setAllAgentsList(agentsRes.data.agents || []);
    } catch (err) {
      console.error('Error fetching config:', err);
    }
  }, [getDateRange]);

  const hasDataRef = useRef(false);
  const fetchData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading && !hasDataRef.current) setLoading(true);
      if (showLoading && hasDataRef.current) setRefetching(true);
      const params = buildParams();

      const [overviewRes, agentsRes, channelsRes] = await Promise.all([
        axios.get(`${API_URL}/api/kyc-goals/overview`, { ...getAuthHeaders(), params }),
        axios.get(`${API_URL}/api/kyc-goals/agents`, { ...getAuthHeaders(), params }),
        axios.get(`${API_URL}/api/kyc-goals/channels`, { ...getAuthHeaders(), params })
      ]);

      if (overviewRes.data.success) setOverview(overviewRes.data.data);
      if (agentsRes.data.success) {
        setAgents(agentsRes.data.agents);
        hasDataRef.current = true;
      }
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
      setRefetching(false);
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

  return (
    <div className="h-full bg-white dark:bg-[#0C0C10] overflow-y-auto">

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
            agents={allAgentsList}
            agentFilter={agentFilter}
            setAgentFilter={setAgentFilter}
          />

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
                  refetching={refetching}
                  navigate={navigate}
                  overview={overview}
                  channelFilter={channelFilter}
                  agentFilter={agentFilter}
                  allChannels={allChannels}
                />
              )}
              {view === 'channels' && (
                <ChannelsView
                  channels={channels}
                  loading={loading && !Object.keys(channels).length}
                  overview={overview}
                  navigate={navigate}
                />
              )}
              {view === 'trends' && (
                <TrendsView
                  trends={trends}
                  loading={trendsLoading}
                  navigate={navigate}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
    </div>
  );
};

export default KYCGoals;
