import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Hash, Clock, ChevronLeft, ChevronRight, Filter,
  CheckCircle2, AlertCircle, Loader2, ArrowRight,
  Sun, Sunset, Moon, MessageSquare, Zap, X, Search,
  AlertTriangle, History, Timer, ExternalLink
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const SHIFT_CONFIG = {
  morning: { icon: Sun, color: 'text-amber-500' },
  afternoon: { icon: Sunset, color: 'text-orange-500' },
  night: { icon: Moon, color: 'text-blue-500' }
};

const STATUS_CONFIG = {
  open: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20', label: 'Open', dot: 'bg-blue-500', accent: 'border-l-blue-400 dark:border-l-blue-500' },
  claimed: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', label: 'Claimed', dot: 'bg-amber-500', accent: 'border-l-amber-400 dark:border-l-amber-500' },
  in_progress: { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-200 dark:border-purple-500/20', label: 'In Progress', dot: 'bg-purple-500', accent: 'border-l-purple-400 dark:border-l-purple-500' },
  resolved: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', label: 'Resolved', dot: 'bg-emerald-500', accent: 'border-l-emerald-400 dark:border-l-emerald-500' }
};

const ORG_COLORS = {
  'Stake.com': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
  'Stake.us': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
  'Stake Brazil': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  'Stake Denmark': 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20',
  'Stake Italy': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
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

const formatTimeShort = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('en-GB', {
    timeZone: 'Europe/Belgrade',
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

const getWaitBarWidth = (seconds) => {
  const maxSeconds = 7200; // 2 hours = full bar
  return Math.min((seconds / maxSeconds) * 100, 100);
};

const getWaitBarColor = (seconds) => {
  if (seconds < 900) return 'bg-amber-400 dark:bg-amber-500';
  if (seconds < 1800) return 'bg-orange-400 dark:bg-orange-500';
  return 'bg-red-400 dark:bg-red-500';
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
};

const openInSlack = async (slackChannelId, slackMessageTs) => {
  if (!slackChannelId || !slackMessageTs) return;
  try {
    const res = await axios.get(
      `${API_URL}/api/kyc-goals/slack-permalink?channel=${slackChannelId}&message_ts=${slackMessageTs}`,
      getAuthHeaders()
    );
    if (res.data.permalink) window.open(res.data.permalink, '_blank');
  } catch {
    toast.error('Failed to get Slack link');
  }
};

// ============================================
// Avatar with ring + hover scale
// ============================================
const Avatar = ({ agent, size = 'sm' }) => {
  const sizes = {
    xs: { box: 'w-4 h-4', text: 'text-[7px]' },
    sm: { box: 'w-5 h-5', text: 'text-[8px]' },
    md: { box: 'w-7 h-7', text: 'text-[10px]' },
  };
  const s = sizes[size] || sizes.sm;
  if (!agent) return null;
  if (agent.slackAvatarUrl) {
    return <img src={agent.slackAvatarUrl} alt="" className={`${s.box} rounded-full object-cover flex-shrink-0 ring-1 ring-gray-200/50 dark:ring-[#252530]`} />;
  }
  return (
    <div className={`${s.box} rounded-full bg-gray-100 dark:bg-[#1E1E28] flex items-center justify-center flex-shrink-0 ring-1 ring-gray-200/50 dark:ring-[#252530]`}>
      <span className={`${s.text} font-bold text-gray-500 dark:text-[#6B6D77]`}>{getInitials(agent.name)}</span>
    </div>
  );
};

// ============================================
// Timeline Card
// ============================================
const TimelineCard = ({ item, navigate, index }) => {
  const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.open;
  const shiftCfg = SHIFT_CONFIG[item.shift];
  const ShiftIcon = shiftCfg?.icon || Sun;
  const orgColor = ORG_COLORS[item.organization] || ORG_COLORS['Stake.com'];
  const isInstant = item.caseType === 'agent_initiated';
  const hasMetrics = !isInstant && (item.timeToClaimSeconds > 0 || item.responseTimeSeconds > 0);
  const agent = item.claimedBy || item.resolvedBy;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.025, 0.3), duration: 0.2 }}
      className="group"
    >
      <div className="flex gap-3 bg-white dark:bg-[#111116] border border-gray-200/70 dark:border-[#1E1E28] rounded-xl overflow-hidden hover:border-gray-300 dark:hover:border-[#2A2A36] transition-all duration-150 p-3">
        {/* Left: Avatar */}
        {agent && (
          <button onClick={() => navigate(`/kyc-goals/agent/${agent._id}`)} className="flex-shrink-0 group/a mt-0.5">
            <div className="group-hover/a:scale-105 transition-transform">
              <Avatar agent={agent} size="md" />
            </div>
          </button>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Row 1: Agent name + message + time */}
          <div className="flex items-baseline justify-between gap-3 mb-1">
            <div className="flex items-baseline gap-2 min-w-0">
              {agent && (
                <button onClick={() => navigate(`/kyc-goals/agent/${agent._id}`)} className="group/a flex-shrink-0">
                  <span className="text-[13px] font-medium text-gray-900 dark:text-[#E8E9ED] group-hover/a:text-blue-600 dark:group-hover/a:text-blue-400 transition-colors">{agent.name}</span>
                </button>
              )}
              {item.resolvedBy && item.resolvedBy._id !== item.claimedBy?._id && (
                <span className="flex items-center gap-1 flex-shrink-0">
                  <ArrowRight className="w-3 h-3 text-gray-300 dark:text-[#3A3A45]" />
                  <button onClick={() => navigate(`/kyc-goals/agent/${item.resolvedBy._id}`)} className="group/a">
                    <span className="text-[13px] font-medium text-gray-700 dark:text-[#C8C9CD] group-hover/a:text-blue-600 dark:group-hover/a:text-blue-400 transition-colors">{item.resolvedBy.name}</span>
                  </button>
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <ShiftIcon className={`w-3 h-3 ${shiftCfg?.color} opacity-70`} />
              <span className="text-xs text-gray-400 dark:text-[#5B5D67] tabular-nums">{formatTimeShort(item.createdAt)}</span>
              <button
                onClick={() => openInSlack(item.slackChannelId, item.slackMessageTs)}
                className="p-0.5 rounded text-gray-300 dark:text-[#3A3A45] hover:text-gray-500 dark:hover:text-[#9A9BA3] opacity-0 group-hover:opacity-100 transition-all"
              >
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Row 2: Message text */}
          {item.messageText && (
            <p className="text-xs text-gray-600 dark:text-[#9A9BA3] line-clamp-1 leading-relaxed mb-1.5">{item.messageText}</p>
          )}

          {/* Row 3: Badges + metrics inline */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded border font-medium ${orgColor}`}>
              <Hash className="w-2.5 h-2.5" />{item.channel}
            </span>
            <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded border font-medium ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
              {item.status === 'resolved' ? <CheckCircle2 className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
              {statusCfg.label}
            </span>
            {isInstant && (
              <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-[#1A1A21] dark:text-[#5B5D67] font-medium">
                <Zap className="w-2.5 h-2.5" />Instant
              </span>
            )}
            {hasMetrics && (
              <>
                <span className="text-gray-200 dark:text-[#1E1E28]">|</span>
                {item.timeToClaimSeconds > 0 && (
                  <span className={`inline-flex items-center gap-1 text-[11px] font-medium tabular-nums ${getResponseColor(item.timeToClaimSeconds)}`}>
                    <Clock className="w-3 h-3" />{formatDuration(item.timeToClaimSeconds)}
                  </span>
                )}
                {item.responseTimeSeconds > 0 && (
                  <span className={`inline-flex items-center gap-1 text-[11px] font-medium tabular-nums ${getResponseColor(item.responseTimeSeconds)}`}>
                    <CheckCircle2 className="w-3 h-3" />{formatDuration(item.responseTimeSeconds)}
                  </span>
                )}
              </>
            )}
            {item.replyCount > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[11px] text-gray-400 dark:text-[#5B5D67] tabular-nums">
                <MessageSquare className="w-3 h-3" />{item.replyCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// Long Waiting Card
// ============================================
const LongWaitingCard = ({ item, navigate, showResolveTime, onDismiss, index }) => {
  const orgColor = ORG_COLORS[item.organization] || ORG_COLORS['Stake.com'];
  const waitSeconds = item.waitingSeconds || 0;
  const displaySeconds = showResolveTime ? (item.responseTimeSeconds || item.totalHandlingTimeSeconds || 0) : waitSeconds;

  return (
    <motion.div
      initial={{ opacity: 0, x: 4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.2), duration: 0.15 }}
      className="group/card relative bg-white dark:bg-[#111116] border border-gray-200/60 dark:border-[#1E1E28] rounded-xl overflow-hidden hover:border-gray-300 dark:hover:border-[#2A2A36] transition-all"
    >
      {/* Severity bar */}
      {!showResolveTime && (
        <div className="h-[2px] bg-gray-100 dark:bg-[#1A1A21]">
          <div
            className={`h-full ${getWaitBarColor(waitSeconds)} transition-all`}
            style={{ width: `${getWaitBarWidth(waitSeconds)}%` }}
          />
        </div>
      )}

      <div className="flex items-center gap-2.5 px-3 py-2.5">
        {/* Avatar */}
        {item.claimedBy ? (
          <button onClick={() => navigate(`/kyc-goals/agent/${item.claimedBy._id}`)} className="flex-shrink-0 group/a">
            <div className="group-hover/a:scale-105 transition-transform">
              <Avatar agent={item.claimedBy} size="sm" />
            </div>
          </button>
        ) : (
          <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-2.5 h-2.5 text-red-500" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {item.claimedBy ? (
                <button onClick={() => navigate(`/kyc-goals/agent/${item.claimedBy._id}`)} className="group/a">
                  <span className="text-xs font-medium text-gray-800 dark:text-[#C8C9CD] group-hover/a:text-blue-600 dark:group-hover/a:text-blue-400 transition-colors">{item.claimedBy.name}</span>
                </button>
              ) : (
                <span className="text-xs text-red-500 dark:text-red-400 font-medium">Unclaimed</span>
              )}
              <span className={`inline-flex items-center gap-0.5 text-[9px] px-1 py-px rounded border font-medium flex-shrink-0 ${orgColor}`}>
                <Hash className="w-2 h-2" />{item.channel}
              </span>
            </div>
            <span className={`text-xs font-bold tabular-nums flex-shrink-0 ${showResolveTime ? getResponseColor(displaySeconds) : 'text-red-600 dark:text-red-400'}`}>
              {formatDuration(displaySeconds)}
            </span>
          </div>
          {item.messageText && (
            <p className="text-[11px] text-gray-400 dark:text-[#5B5D67] line-clamp-1 leading-snug mt-0.5">{item.messageText}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover/card:opacity-100 transition-all">
          <button
            onClick={() => openInSlack(item.slackChannelId, item.slackMessageTs)}
            className="p-1 rounded-md text-gray-400 dark:text-[#5B5D67] hover:text-gray-600 dark:hover:text-[#9A9BA3] hover:bg-gray-100 dark:hover:bg-[#1A1A21] transition-all"
          >
            <ExternalLink className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDismiss(item._id)}
            className="p-1 rounded-md text-gray-400 dark:text-[#5B5D67] hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// Right Panel Section
// ============================================
const RightPanelSection = ({ icon: Icon, iconColor, title, count, countStyle, children, style, pag, onPageChange }) => (
  <div className="flex flex-col min-h-0" style={style}>
    <div className="flex-shrink-0 px-3 py-2 border-b border-gray-200/60 dark:border-[#1E1E28] flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        <h3 className="text-[11px] font-semibold text-gray-900 dark:text-[#E8E9ED]">{title}</h3>
      </div>
      <div className="flex items-center gap-1.5">
        {pag && pag.totalPages > 1 && (
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => onPageChange(pag.page - 1)}
              disabled={pag.page <= 1}
              className="p-0.5 rounded text-gray-400 dark:text-[#5B5D67] hover:text-gray-600 dark:hover:text-[#9A9BA3] disabled:opacity-25 transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <span className="text-[9px] text-gray-400 dark:text-[#5B5D67] tabular-nums">{pag.page}/{pag.totalPages}</span>
            <button
              onClick={() => onPageChange(pag.page + 1)}
              disabled={pag.page >= pag.totalPages}
              className="p-0.5 rounded text-gray-400 dark:text-[#5B5D67] hover:text-gray-600 dark:hover:text-[#9A9BA3] disabled:opacity-25 transition-colors"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
        <span className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded ${countStyle}`}>
          {pag ? pag.total : count}
        </span>
      </div>
    </div>
    <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
      {children}
    </div>
  </div>
);

// ============================================
// Main Component
// ============================================
const KYCActivityFeed = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [channels, setChannels] = useState([]);
  const [longWaiting, setLongWaiting] = useState([]);
  const [longWaitingHistory, setLongWaitingHistory] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [lwPagination, setLwPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [lhPagination, setLhPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [channelDropdownOpen, setChannelDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const leftPanelRef = useRef(null);

  const fetchData = useCallback(async (page = 1, lwPage = null, lhPage = null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 30 });
      if (selectedChannel) params.append('channel', selectedChannel);
      if (lwPage) params.append('lwPage', lwPage);
      if (lhPage) params.append('lhPage', lhPage);

      const res = await axios.get(`${API_URL}/api/kyc-goals/activity-feed?${params}`, getAuthHeaders());
      const data = res.data;
      setItems(data.items || []);
      setChannels(data.channels || []);
      setLongWaiting(data.longWaiting || []);
      setLongWaitingHistory(data.longWaitingHistory || []);
      setPagination(data.pagination || { page: 1, total: 0, totalPages: 0 });
      setLwPagination(data.longWaitingPagination || { page: 1, total: 0, totalPages: 0 });
      setLhPagination(data.longWaitingHistoryPagination || { page: 1, total: 0, totalPages: 0 });
    } catch (err) {
      toast.error('Failed to load activity feed');
    } finally {
      setLoading(false);
    }
  }, [selectedChannel]);

  useEffect(() => { fetchData(1); }, [fetchData]);

  useEffect(() => {
    if (leftPanelRef.current) leftPanelRef.current.scrollTop = 0;
  }, [items]);

  // Fetch only long waiting panel data (without reloading main feed)
  const fetchLwPage = async (newPage) => {
    try {
      const params = new URLSearchParams({ page: pagination.page, limit: 30, lwPage: newPage, lhPage: lhPagination.page });
      if (selectedChannel) params.append('channel', selectedChannel);
      const res = await axios.get(`${API_URL}/api/kyc-goals/activity-feed?${params}`, getAuthHeaders());
      setLongWaiting(res.data.longWaiting || []);
      setLwPagination(res.data.longWaitingPagination || { page: 1, total: 0, totalPages: 0 });
    } catch { toast.error('Failed to load'); }
  };

  const fetchLhPage = async (newPage) => {
    try {
      const params = new URLSearchParams({ page: pagination.page, limit: 30, lwPage: lwPagination.page, lhPage: newPage });
      if (selectedChannel) params.append('channel', selectedChannel);
      const res = await axios.get(`${API_URL}/api/kyc-goals/activity-feed?${params}`, getAuthHeaders());
      setLongWaitingHistory(res.data.longWaitingHistory || []);
      setLhPagination(res.data.longWaitingHistoryPagination || { page: 1, total: 0, totalPages: 0 });
    } catch { toast.error('Failed to load'); }
  };

  const handleDismiss = async (ticketId) => {
    try {
      await axios.post(`${API_URL}/api/kyc-goals/tickets/${ticketId}/dismiss`, {}, getAuthHeaders());
      setLongWaiting(prev => prev.filter(t => t._id !== ticketId));
      setLongWaitingHistory(prev => prev.filter(t => t._id !== ticketId));
      setLwPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      setLhPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      toast.success('Ticket dismissed');
    } catch (err) {
      toast.error('Failed to dismiss ticket');
    }
  };

  const filteredChannels = channels.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.organization.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedChannelDoc = channels.find(c => c.slackChannelId === selectedChannel);

  // Group items by date
  const groupedByDate = {};
  items.forEach(item => {
    const date = item.activityDate || 'Unknown';
    if (!groupedByDate[date]) groupedByDate[date] = [];
    groupedByDate[date].push(item);
  });
  const dateGroups = Object.entries(groupedByDate).sort(([a], [b]) => b.localeCompare(a));

  let cumulativeIndex = 0;
  const hasLongWaiting = lwPagination.total > 0 || longWaiting.length > 0;
  const hasHistory = lhPagination.total > 0 || longWaitingHistory.length > 0;

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-[#0C0C10] overflow-hidden">
      {/* Compact toolbar */}
      <div className="flex-shrink-0 px-4 sm:px-6 py-2 border-b border-gray-200/60 dark:border-[#1E1E28] bg-white/60 dark:bg-[#0C0C10]/80 backdrop-blur-sm relative z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 dark:text-[#6B6D77] tabular-nums">{pagination.total.toLocaleString()} cases</span>
            <div className="h-3 w-px bg-gray-200 dark:bg-[#1E1E28]" />
            <div className="flex items-center gap-1">
              <button
                onClick={() => fetchData(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-0.5 rounded text-gray-400 dark:text-[#5B5D67] hover:text-gray-600 dark:hover:text-[#9A9BA3] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] text-gray-500 dark:text-[#6B6D77] tabular-nums min-w-[60px] text-center">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchData(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-0.5 rounded text-gray-400 dark:text-[#5B5D67] hover:text-gray-600 dark:hover:text-[#9A9BA3] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Channel filter */}
          <div className="relative">
            <button
              onClick={() => setChannelDropdownOpen(!channelDropdownOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-colors ${
                selectedChannel
                  ? 'border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
                  : 'border-gray-200 dark:border-[#1E1E28] bg-white dark:bg-[#111116] text-gray-500 dark:text-[#6B6D77] hover:border-gray-300 dark:hover:border-[#252530]'
              }`}
            >
              <Filter className="w-3 h-3" />
              <span>{selectedChannel ? selectedChannelDoc?.name || 'Channel' : 'All Channels'}</span>
              {selectedChannel && (
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedChannel(''); setChannelDropdownOpen(false); }}
                  className="p-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-500/20 -mr-0.5"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </button>

            <AnimatePresence>
              {channelDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-[#111116] border border-gray-200 dark:border-[#1E1E28] rounded-xl shadow-lg z-50 overflow-hidden"
                >
                  <div className="p-2 border-b border-gray-100 dark:border-[#1E1E28]">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-7 pr-2 py-1.5 text-xs bg-gray-50 dark:bg-[#0C0C10] border border-gray-200 dark:border-[#1E1E28] rounded-lg text-gray-900 dark:text-[#E8E9ED] placeholder-gray-400"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto p-1">
                    <button
                      onClick={() => { setSelectedChannel(''); setChannelDropdownOpen(false); setSearchQuery(''); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        !selectedChannel ? 'bg-gray-100 dark:bg-[#1E1E28] text-gray-900 dark:text-[#E8E9ED]' : 'text-gray-600 dark:text-[#9A9BA3] hover:bg-gray-50 dark:hover:bg-[#111116]'
                      }`}
                    >
                      All Channels
                    </button>
                    {Object.entries(
                      filteredChannels.reduce((acc, c) => {
                        if (!acc[c.organization]) acc[c.organization] = [];
                        acc[c.organization].push(c);
                        return acc;
                      }, {})
                    ).map(([org, chs]) => (
                      <div key={org}>
                        <div className="px-2.5 py-1 text-[9px] font-semibold text-gray-400 dark:text-[#5B5D67] uppercase tracking-wider mt-1">{org}</div>
                        {chs.map(c => (
                          <button
                            key={c.slackChannelId}
                            onClick={() => { setSelectedChannel(c.slackChannelId); setChannelDropdownOpen(false); setSearchQuery(''); }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 ${
                              selectedChannel === c.slackChannelId
                                ? 'bg-gray-100 dark:bg-[#1E1E28] text-gray-900 dark:text-[#E8E9ED]'
                                : 'text-gray-600 dark:text-[#9A9BA3] hover:bg-gray-50 dark:hover:bg-[#111116]'
                            }`}
                          >
                            <Hash className="w-2.5 h-2.5 text-gray-400 dark:text-[#5B5D67]" />
                            {c.name}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main split layout */}
      <div className="flex-1 flex min-h-0">
        {/* LEFT: Timeline — scrollable */}
        <div ref={leftPanelRef} className="flex-1 min-w-0 overflow-y-auto px-4 sm:px-6 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400 dark:text-[#5B5D67]" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <Activity className="w-8 h-8 mx-auto mb-3 text-gray-300 dark:text-[#3A3A45]" />
              <p className="text-sm text-gray-500 dark:text-[#6B6D77]">No activity found</p>
            </div>
          ) : (
            <div>
              {dateGroups.map(([date, dateItems]) => {
                const startIndex = cumulativeIndex;
                cumulativeIndex += dateItems.length;
                return (
                  <div key={date} className="mb-4">
                    <div className="sticky top-0 z-10 mb-2 py-0.5">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/90 dark:bg-[#111116]/90 text-[10px] font-medium text-gray-500 dark:text-[#6B6D77] border border-gray-200/60 dark:border-[#1E1E28] backdrop-blur-sm">
                        {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                        <span className="text-gray-400 dark:text-[#5B5D67]">{dateItems.length}</span>
                      </span>
                    </div>
                    <div className="space-y-2">
                      {dateItems.map((item, i) => (
                        <TimelineCard key={item._id} item={item} navigate={navigate} index={startIndex + i} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: Long Waiting — fixed, internal scroll */}
        <div className="w-[550px] flex-shrink-0 hidden lg:flex flex-col border-l border-gray-200/60 dark:border-[#1E1E28] bg-white/30 dark:bg-[#0A0A0E]">
          <RightPanelSection
            icon={AlertTriangle}
            iconColor="text-red-500"
            title="Long Waiting"
            countStyle={lwPagination.total > 0 ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'}
            pag={lwPagination}
            onPageChange={fetchLwPage}
            style={{ height: hasHistory ? '60%' : '100%' }}
          >
            {longWaiting.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <CheckCircle2 className="w-5 h-5 mb-1.5 text-emerald-400 dark:text-emerald-500" />
                <p className="text-[11px] text-gray-500 dark:text-[#6B6D77]">All clear</p>
              </div>
            ) : (
              longWaiting.map((item, i) => (
                <LongWaitingCard key={item._id} item={item} navigate={navigate} onDismiss={handleDismiss} index={i} />
              ))
            )}
          </RightPanelSection>

          <RightPanelSection
            icon={History}
            iconColor="text-gray-400 dark:text-[#5B5D67]"
            title="History"
            countStyle="text-gray-500 dark:text-[#5B5D67]"
            pag={lhPagination}
            onPageChange={fetchLhPage}
            style={{ height: hasLongWaiting ? '40%' : '100%' }}
          >
            {longWaitingHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Timer className="w-5 h-5 mb-1.5 text-gray-300 dark:text-[#3A3A45]" />
                <p className="text-[11px] text-gray-500 dark:text-[#6B6D77]">No long-wait cases yet</p>
              </div>
            ) : (
              longWaitingHistory.map((item, i) => (
                <LongWaitingCard key={item._id} item={item} navigate={navigate} showResolveTime onDismiss={handleDismiss} index={i} />
              ))
            )}
          </RightPanelSection>
        </div>
      </div>

      {/* Dropdown backdrop */}
      {channelDropdownOpen && (
        <div className="fixed inset-0 z-40" onClick={() => { setChannelDropdownOpen(false); setSearchQuery(''); }} />
      )}
    </div>
  );
};

export default KYCActivityFeed;
