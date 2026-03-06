import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Clock, CheckCircle2, AlertCircle,
  Users, Hash, Activity, Loader2, Sun, Sunset, Moon,
  Zap, MessageSquare, ArrowRight, Target, BarChart3, Calendar
} from 'lucide-react';
import {
  BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const SHIFT_CONFIG = {
  morning: { icon: Sun, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', fill: '#f59e0b', label: 'Morning (7-15)' },
  afternoon: { icon: Sunset, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10', fill: '#f97316', label: 'Afternoon (15-23)' },
  night: { icon: Moon, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', fill: '#3b82f6', label: 'Night (23-7)' }
};

const STATUS_CONFIG = {
  open: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20', label: 'Open' },
  claimed: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', label: 'Claimed' },
  in_progress: { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-200 dark:border-purple-500/20', label: 'In Progress' },
  resolved: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', label: 'Resolved' }
};

const ORG_COLORS = {
  'Stake.com': { tag: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20', fill: '#3b82f6' },
  'Stake.us': { tag: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20', fill: '#8b5cf6' },
  'Stake Brazil': { tag: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20', fill: '#10b981' },
  'Stake Denmark': { tag: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20', fill: '#f97316' },
  'Stake Italy': { tag: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20', fill: '#f59e0b' },
};

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '-';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

const formatTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('en-GB', {
    timeZone: 'Europe/Belgrade',
    day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit',
    hour12: false
  });
};

const getResponseColor = (seconds) => {
  if (!seconds || seconds <= 0) return 'text-gray-400 dark:text-[#5B5D67]';
  if (seconds < 180) return 'text-emerald-600 dark:text-emerald-400';
  if (seconds < 300) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
};

const getResponseDot = (seconds) => {
  if (!seconds || seconds <= 0) return 'bg-gray-300';
  if (seconds < 180) return 'bg-emerald-500';
  if (seconds < 300) return 'bg-amber-500';
  return 'bg-red-500';
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
};

// ============================================
// Stat Card
// ============================================
const StatCard = ({ label, value, subValue, icon: Icon, color }) => (
  <div className="bg-white dark:bg-[#141419] border border-gray-200 dark:border-[#1E1E28] rounded-lg p-3.5">
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-[10px] font-medium text-gray-400 dark:text-[#5B5D67] uppercase tracking-wider">{label}</span>
      {Icon && <Icon className={`w-3.5 h-3.5 ${color || 'text-gray-400 dark:text-[#5B5D67]'}`} />}
    </div>
    <p className="text-xl font-bold text-gray-900 dark:text-[#E8E9ED] tabular-nums">{value}</p>
    {subValue && <p className="text-[10px] text-gray-400 dark:text-[#5B5D67] mt-0.5">{subValue}</p>}
  </div>
);

// ============================================
// Agent Breakdown Row
// ============================================
const AgentRow = ({ agent, maxCases, orgColor, navigate }) => {
  const barWidth = maxCases > 0 ? (agent.cases / maxCases) * 100 : 0;

  return (
    <div
      className="flex items-center gap-3 py-2 cursor-pointer group"
      onClick={() => navigate(`/kyc-goals/agent/${agent._id}`)}
    >
      <div className="w-28 flex-shrink-0 flex items-center gap-2">
        {agent.slackAvatarUrl ? (
          <img src={agent.slackAvatarUrl} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-[#1E1E28] flex items-center justify-center flex-shrink-0">
            <span className="text-[8px] font-bold text-gray-500 dark:text-[#6B6D77]">{getInitials(agent.name)}</span>
          </div>
        )}
        <span className="text-[11px] text-gray-700 dark:text-[#A0A2AC] truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{agent.name}</span>
      </div>
      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 h-5 bg-gray-50 dark:bg-[#0C0C10] rounded overflow-hidden relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${barWidth}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full rounded"
            style={{ backgroundColor: orgColor || '#3b82f6', opacity: 0.7 }}
          />
          <span className="absolute inset-0 flex items-center pl-2 text-[10px] font-bold text-gray-700 dark:text-[#B0B1B8]">
            {agent.cases} cases
          </span>
        </div>
        <div className="flex items-center gap-1 w-20 justify-end">
          <span className={`w-1.5 h-1.5 rounded-full ${getResponseDot(agent.avgResponseTime)}`} />
          <span className={`text-xs tabular-nums font-medium ${getResponseColor(agent.avgResponseTime)}`}>
            {formatDuration(agent.avgResponseTime)}
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Timeline Item
// ============================================
const ChannelTimelineItem = ({ item, isLast, navigate }) => {
  const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.open;
  const shiftCfg = SHIFT_CONFIG[item.shift];
  const ShiftIcon = shiftCfg?.icon || Sun;
  const isInstant = item.caseType === 'agent_initiated';

  return (
    <div className="relative flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 mt-1.5 ${
          item.status === 'resolved' ? 'bg-emerald-500 border-emerald-400' :
          item.status === 'open' ? 'bg-blue-500 border-blue-400' :
          item.status === 'claimed' ? 'bg-amber-500 border-amber-400' :
          'bg-purple-500 border-purple-400'
        }`} />
        {!isLast && <div className="w-px flex-1 bg-gray-200 dark:bg-[#1E1E28] min-h-[32px]" />}
      </div>

      <motion.div
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 mb-3 bg-white dark:bg-[#141419] border border-gray-200 dark:border-[#1E1E28] rounded-lg p-3 hover:border-gray-300 dark:hover:border-[#252530] transition-colors"
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded border font-medium ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
              {item.status === 'resolved' ? <CheckCircle2 className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
              {statusCfg.label}
            </span>
            {isInstant && (
              <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-[#1E1E28] dark:text-[#5B5D67] font-medium">
                <Zap className="w-2.5 h-2.5" />Instant
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <ShiftIcon className={`w-3 h-3 ${shiftCfg?.color}`} />
            <span className="text-[10px] text-gray-400 dark:text-[#5B5D67] tabular-nums whitespace-nowrap">
              {formatTime(item.createdAt)}
            </span>
          </div>
        </div>

        {item.messageText && (
          <p className="text-xs text-gray-600 dark:text-[#9A9BA3] line-clamp-2 mb-1.5 leading-relaxed">{item.messageText}</p>
        )}

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {item.claimedBy && (
              <button onClick={(e) => { e.stopPropagation(); navigate(`/kyc-goals/agent/${item.claimedBy._id}`); }} className="flex items-center gap-1 group/agent">
                {item.claimedBy.slackAvatarUrl ? (
                  <img src={item.claimedBy.slackAvatarUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-gray-100 dark:bg-[#1E1E28] flex items-center justify-center">
                    <span className="text-[7px] font-bold text-gray-500">{getInitials(item.claimedBy.name)}</span>
                  </div>
                )}
                <span className="text-[10px] text-gray-600 dark:text-[#9A9BA3] group-hover/agent:text-gray-900 dark:group-hover/agent:text-[#E8E9ED] transition-colors">{item.claimedBy.name}</span>
              </button>
            )}
            {item.resolvedBy && item.resolvedBy._id !== item.claimedBy?._id && (
              <>
                <ArrowRight className="w-2.5 h-2.5 text-gray-300 dark:text-[#3A3A45]" />
                <button onClick={(e) => { e.stopPropagation(); navigate(`/kyc-goals/agent/${item.resolvedBy._id}`); }} className="flex items-center gap-1 group/agent">
                  {item.resolvedBy.slackAvatarUrl ? (
                    <img src={item.resolvedBy.slackAvatarUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-gray-100 dark:bg-[#1E1E28] flex items-center justify-center">
                      <span className="text-[7px] font-bold text-gray-500">{getInitials(item.resolvedBy.name)}</span>
                    </div>
                  )}
                  <span className="text-[10px] text-gray-600 dark:text-[#9A9BA3] group-hover/agent:text-gray-900 dark:group-hover/agent:text-[#E8E9ED] transition-colors">{item.resolvedBy.name}</span>
                </button>
              </>
            )}
          </div>
          {!isInstant && (
            <div className="flex items-center gap-3">
              {item.timeToClaimSeconds > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 dark:text-[#6B6D77]">
                  <Clock className="w-2.5 h-2.5" />
                  <span className={getResponseColor(item.timeToClaimSeconds)}>{formatDuration(item.timeToClaimSeconds)}</span>
                </span>
              )}
              {item.responseTimeSeconds > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 dark:text-[#6B6D77]">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span className={getResponseColor(item.responseTimeSeconds)}>{formatDuration(item.responseTimeSeconds)}</span>
                </span>
              )}
              {item.replyCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 dark:text-[#6B6D77]">
                  <MessageSquare className="w-2.5 h-2.5" />{item.replyCount}
                </span>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ============================================
// Custom Recharts Tooltip
// ============================================
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1A1A22] border border-gray-200 dark:border-[#252530] rounded-lg px-3 py-2 shadow-lg">
      <p className="text-[10px] font-medium text-gray-500 dark:text-[#6B6D77] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs font-bold text-gray-900 dark:text-[#E8E9ED]">
          {p.value} {p.name || 'cases'}
        </p>
      ))}
    </div>
  );
};

// ============================================
// Main Component
// ============================================
const KYCChannelDetail = () => {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const [channel, setChannel] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const fetchData = useCallback(async (page = 1, initial = false) => {
    if (initial) setLoading(true);
    else setTimelineLoading(true);

    try {
      const res = await axios.get(`${API_URL}/api/kyc-goals/channels/${channelId}?page=${page}&limit=30`, getAuthHeaders());
      const data = res.data;
      setChannel(data.channel);
      setTimeline(data.timeline || []);
      setPagination(data.pagination || { page: 1, total: 0, totalPages: 0 });
    } catch (err) {
      toast.error('Failed to load channel data');
    } finally {
      setLoading(false);
      setTimelineLoading(false);
    }
  }, [channelId]);

  useEffect(() => { fetchData(1, true); }, [fetchData]);

  if (loading) {
    return (
      <div className="h-full bg-gray-50 dark:bg-[#0C0C10] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400 dark:text-[#5B5D67]" />
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="h-full bg-gray-50 dark:bg-[#0C0C10] flex items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-[#6B6D77]">Channel not found</p>
      </div>
    );
  }

  const stats = channel.stats || {};
  const agentBreakdown = channel.agentBreakdown || [];
  const dailyActivity = channel.dailyActivity || [];
  const maxAgentCases = Math.max(...agentBreakdown.map(a => a.cases), 1);
  const orgCfg = ORG_COLORS[channel.organization] || ORG_COLORS['Stake.com'];

  const totalShift = (stats.shifts?.morning || 0) + (stats.shifts?.afternoon || 0) + (stats.shifts?.night || 0);
  const shiftPcts = {
    morning: totalShift > 0 ? Math.round(((stats.shifts?.morning || 0) / totalShift) * 100) : 0,
    afternoon: totalShift > 0 ? Math.round(((stats.shifts?.afternoon || 0) / totalShift) * 100) : 0,
    night: totalShift > 0 ? Math.round(((stats.shifts?.night || 0) / totalShift) * 100) : 0
  };

  // Group timeline by date
  const groupedTimeline = {};
  timeline.forEach(item => {
    const date = item.activityDate || 'Unknown';
    if (!groupedTimeline[date]) groupedTimeline[date] = [];
    groupedTimeline[date].push(item);
  });
  const dateGroups = Object.entries(groupedTimeline).sort(([a], [b]) => b.localeCompare(a));

  return (
    <div className="h-full bg-gray-50 dark:bg-[#0C0C10] overflow-y-auto">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-5">
        {/* Channel header */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-[#1E1E28] text-gray-500 dark:text-[#6B6D77] hover:text-gray-900 dark:hover:text-[#E8E9ED] hover:bg-gray-50 dark:hover:bg-[#111116] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: orgCfg.fill + '20' }}>
            <Hash className="w-5 h-5" style={{ color: orgCfg.fill }} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-[#E8E9ED]">{channel.name}</h1>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded border font-medium ${orgCfg.tag}`}>{channel.organization}</span>
              {channel.trackingMode !== 'full' && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-[#1E1E28] dark:text-[#5B5D67] font-medium uppercase">
                  {channel.trackingMode}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Stats & Charts */}
          <div className="lg:col-span-1 space-y-4">
            {/* Key stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Total Cases" value={stats.totalCases} icon={BarChart3} color="text-blue-500" />
              <StatCard label="Resolved" value={stats.resolvedCases} subValue={`${stats.resolutionRate}% rate`} icon={CheckCircle2} color="text-emerald-500" />
              <StatCard label="Avg Response" value={formatDuration(stats.avgResponseTime)} subValue={stats.minResponseTime > 0 ? `Min: ${formatDuration(stats.minResponseTime)}` : undefined} icon={Clock} color={stats.avgResponseTime < 180 ? 'text-emerald-500' : stats.avgResponseTime < 300 ? 'text-amber-500' : 'text-red-500'} />
              <StatCard label="Avg Claim" value={formatDuration(stats.avgClaimTime)} icon={Target} color="text-purple-500" />
              <StatCard label="Active Agents" value={stats.activeAgents} icon={Users} color="text-gray-500 dark:text-[#6B6D77]" />
              <StatCard label="Active Days" value={stats.activeDays} icon={Calendar} color="text-gray-500 dark:text-[#6B6D77]" />
            </div>

            {/* Case type breakdown */}
            {(stats.agentInitiated > 0 || stats.externalRequest > 0) && (
              <div className="bg-white dark:bg-[#141419] border border-gray-200 dark:border-[#1E1E28] rounded-lg p-4">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-[#E8E9ED] mb-3">Case Types</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-600 dark:text-[#9A9BA3]">Agent Initiated</span>
                    </div>
                    <span className="text-xs font-bold text-gray-900 dark:text-[#E8E9ED] tabular-nums">{stats.agentInitiated}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-600 dark:text-[#9A9BA3]">External Request</span>
                    </div>
                    <span className="text-xs font-bold text-gray-900 dark:text-[#E8E9ED] tabular-nums">{stats.externalRequest}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Shift distribution */}
            <div className="bg-white dark:bg-[#141419] border border-gray-200 dark:border-[#1E1E28] rounded-lg p-4">
              <h3 className="text-xs font-semibold text-gray-900 dark:text-[#E8E9ED] mb-3">Shift Distribution</h3>
              <div className="h-3 w-full rounded-full overflow-hidden flex mb-3 bg-gray-100 dark:bg-[#0C0C10]">
                {shiftPcts.morning > 0 && (
                  <motion.div initial={{ width: 0 }} animate={{ width: `${shiftPcts.morning}%` }} className="h-full bg-amber-400" />
                )}
                {shiftPcts.afternoon > 0 && (
                  <motion.div initial={{ width: 0 }} animate={{ width: `${shiftPcts.afternoon}%` }} className="h-full bg-orange-400" />
                )}
                {shiftPcts.night > 0 && (
                  <motion.div initial={{ width: 0 }} animate={{ width: `${shiftPcts.night}%` }} className="h-full bg-blue-400" />
                )}
              </div>
              <div className="space-y-1.5">
                {['morning', 'afternoon', 'night'].map(shift => {
                  const cfg = SHIFT_CONFIG[shift];
                  const Icon = cfg.icon;
                  return (
                    <div key={shift} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-3 h-3 ${cfg.color}`} />
                        <span className="text-xs text-gray-600 dark:text-[#9A9BA3]">{cfg.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900 dark:text-[#E8E9ED] tabular-nums">{stats.shifts?.[shift] || 0}</span>
                        <span className="text-[10px] text-gray-400 dark:text-[#5B5D67] w-8 text-right tabular-nums">{shiftPcts[shift]}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Agent breakdown */}
            {agentBreakdown.length > 0 && (
              <div className="bg-white dark:bg-[#141419] border border-gray-200 dark:border-[#1E1E28] rounded-lg p-4">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-[#E8E9ED] mb-3">Agent Breakdown</h3>
                <div className="space-y-0">
                  {agentBreakdown.map(a => (
                    <AgentRow key={a._id} agent={a} maxCases={maxAgentCases} orgColor={orgCfg.fill} navigate={navigate} />
                  ))}
                </div>
              </div>
            )}

            {/* Daily activity chart */}
            {dailyActivity.length > 1 && (
              <div className="bg-white dark:bg-[#141419] border border-gray-200 dark:border-[#1E1E28] rounded-lg p-4">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-[#E8E9ED] mb-3">Daily Activity</h3>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyActivity} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-100 dark:text-[#1E1E28]" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 9, fill: '#6B6D77' }}
                        tickFormatter={(v) => v.slice(5)}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis tick={{ fontSize: 9, fill: '#6B6D77' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="cases" radius={[2, 2, 0, 0]} fill={orgCfg.fill} opacity={0.7} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Response time range */}
            {stats.maxResponseTime > 0 && (
              <div className="bg-white dark:bg-[#141419] border border-gray-200 dark:border-[#1E1E28] rounded-lg p-4">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-[#E8E9ED] mb-3">Response Time Range</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] text-gray-400 dark:text-[#5B5D67]">Fastest</span>
                      <span className={`text-[10px] font-bold ${getResponseColor(stats.minResponseTime)}`}>{formatDuration(stats.minResponseTime)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 dark:bg-[#0C0C10] rounded-full relative overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.maxResponseTime > 0 ? (stats.avgResponseTime / stats.maxResponseTime) * 100 : 0}%` }}
                        className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-400 rounded-full"
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className={`text-[10px] font-bold ${getResponseColor(stats.avgResponseTime)}`}>Avg: {formatDuration(stats.avgResponseTime)}</span>
                      <span className={`text-[10px] font-bold ${getResponseColor(stats.maxResponseTime)}`}>{formatDuration(stats.maxResponseTime)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Timeline */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Activity Timeline
                <span className="text-xs font-normal text-gray-400 dark:text-[#5B5D67]">({pagination.total} cases)</span>
              </h2>
            </div>

            {timelineLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400 dark:text-[#5B5D67]" />
              </div>
            ) : timeline.length === 0 ? (
              <div className="text-center py-16">
                <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-[#3A3A45]" />
                <p className="text-xs text-gray-500 dark:text-[#6B6D77]">No activity in selected period</p>
              </div>
            ) : (
              <>
                {dateGroups.map(([date, dateItems]) => (
                  <div key={date} className="mb-5">
                    <div className="sticky top-0 z-10 mb-2">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#1E1E28] text-[10px] font-medium text-gray-600 dark:text-[#9A9BA3] border border-gray-200 dark:border-[#252530]">
                        {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                        <span className="text-gray-400 dark:text-[#5B5D67]">({dateItems.length})</span>
                      </span>
                    </div>
                    <div className="pl-1">
                      {dateItems.map((item, i) => (
                        <ChannelTimelineItem key={item._id} item={item} isLast={i === dateItems.length - 1} navigate={navigate} />
                      ))}
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-[#1E1E28]">
                    <p className="text-xs text-gray-500 dark:text-[#6B6D77]">
                      Page {pagination.page} of {pagination.totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fetchData(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#1E1E28] text-xs text-gray-600 dark:text-[#9A9BA3] hover:bg-gray-50 dark:hover:bg-[#111116] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Prev
                      </button>
                      <button
                        onClick={() => fetchData(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#1E1E28] text-xs text-gray-600 dark:text-[#9A9BA3] hover:bg-gray-50 dark:hover:bg-[#111116] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Next <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KYCChannelDetail;
