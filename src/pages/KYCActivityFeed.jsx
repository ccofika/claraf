import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Hash, Clock, ChevronLeft, ChevronRight, Filter,
  CheckCircle2, AlertCircle, Loader2, ArrowRight, ArrowLeft,
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
  open: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20', label: 'Open' },
  claimed: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', label: 'Claimed' },
  in_progress: { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-200 dark:border-purple-500/20', label: 'In Progress' },
  resolved: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', label: 'Resolved' }
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

const getResponseColor = (seconds) => {
  if (!seconds || seconds <= 0) return 'text-gray-400 dark:text-[#5B5D67]';
  if (seconds < 180) return 'text-emerald-600 dark:text-emerald-400';
  if (seconds < 300) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
};

const getWaitingSeverity = (seconds) => {
  if (seconds < 900) return 'border-amber-300 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/5'; // 10-15 min
  if (seconds < 1800) return 'border-orange-300 dark:border-orange-500/30 bg-orange-50/50 dark:bg-orange-500/5'; // 15-30 min
  return 'border-red-300 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/5'; // 30+ min
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
    if (res.data.permalink) {
      window.open(res.data.permalink, '_blank');
    }
  } catch {
    toast.error('Failed to get Slack link');
  }
};

const Avatar = ({ agent, size = 'w-5 h-5' }) => {
  if (!agent) return null;
  if (agent.slackAvatarUrl) {
    return <img src={agent.slackAvatarUrl} alt="" className={`${size} rounded-full object-cover flex-shrink-0`} />;
  }
  return (
    <div className={`${size} rounded-full bg-gray-100 dark:bg-[#1E1E28] flex items-center justify-center flex-shrink-0`}>
      <span className="text-[9px] font-bold text-gray-500 dark:text-[#6B6D77]">{getInitials(agent.name)}</span>
    </div>
  );
};

// ============================================
// Timeline Item (left column)
// ============================================
const TimelineItem = ({ item, isLast, navigate }) => {
  const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.open;
  const shiftCfg = SHIFT_CONFIG[item.shift];
  const ShiftIcon = shiftCfg?.icon || Sun;
  const orgColor = ORG_COLORS[item.organization] || ORG_COLORS['Stake.com'];
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
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded border font-medium ${orgColor}`}>
              <Hash className="w-2.5 h-2.5" />{item.channel}
            </span>
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
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => openInSlack(item.slackChannelId, item.slackMessageTs)}
              title="Open in Slack"
              className="p-0.5 rounded text-gray-300 dark:text-[#3A3A45] hover:text-gray-600 dark:hover:text-[#9A9BA3] transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
            <ShiftIcon className={`w-3 h-3 ${shiftCfg?.color}`} />
            <span className="text-[10px] text-gray-400 dark:text-[#5B5D67] tabular-nums whitespace-nowrap">
              {formatTime(item.createdAt)}
            </span>
          </div>
        </div>

        {item.messageText && (
          <p className="text-xs text-gray-600 dark:text-[#9A9BA3] mb-2 line-clamp-2 leading-relaxed">{item.messageText}</p>
        )}

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {item.claimedBy && (
              <button onClick={() => navigate(`/kyc-goals/agent/${item.claimedBy._id}`)} className="flex items-center gap-1 group">
                <Avatar agent={item.claimedBy} />
                <span className="text-[11px] text-gray-600 dark:text-[#9A9BA3] group-hover:text-gray-900 dark:group-hover:text-[#E8E9ED] transition-colors">{item.claimedBy.name}</span>
              </button>
            )}
            {item.resolvedBy && item.resolvedBy._id !== item.claimedBy?._id && (
              <>
                <ArrowRight className="w-2.5 h-2.5 text-gray-300 dark:text-[#3A3A45]" />
                <button onClick={() => navigate(`/kyc-goals/agent/${item.resolvedBy._id}`)} className="flex items-center gap-1 group">
                  <Avatar agent={item.resolvedBy} />
                  <span className="text-[11px] text-gray-600 dark:text-[#9A9BA3] group-hover:text-gray-900 dark:group-hover:text-[#E8E9ED] transition-colors">{item.resolvedBy.name}</span>
                </button>
              </>
            )}
          </div>
          {!isInstant && (
            <div className="flex items-center gap-2">
              {item.timeToClaimSeconds > 0 && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-500 dark:text-[#6B6D77]">
                  <Clock className="w-2.5 h-2.5" />
                  <span className={getResponseColor(item.timeToClaimSeconds)}>{formatDuration(item.timeToClaimSeconds)}</span>
                </span>
              )}
              {item.responseTimeSeconds > 0 && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-500 dark:text-[#6B6D77]">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span className={getResponseColor(item.responseTimeSeconds)}>{formatDuration(item.responseTimeSeconds)}</span>
                </span>
              )}
              {item.replyCount > 0 && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-500 dark:text-[#6B6D77]">
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
// Long Waiting Card (right column)
// ============================================
const LongWaitingCard = ({ item, navigate, showResolveTime, onDismiss }) => {
  const orgColor = ORG_COLORS[item.organization] || ORG_COLORS['Stake.com'];
  const waitSeconds = item.waitingSeconds || 0;
  const severity = showResolveTime ? 'border-gray-200 dark:border-[#1E1E28]' : getWaitingSeverity(waitSeconds);

  return (
    <div className={`border rounded-lg p-2.5 ${severity} transition-colors group/card relative`}>
      <button
        onClick={() => onDismiss(item._id)}
        title="Dismiss (false alarm)"
        className="absolute top-1.5 right-1.5 p-0.5 rounded text-gray-300 dark:text-[#3A3A45] hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover/card:opacity-100 transition-all"
      >
        <X className="w-3 h-3" />
      </button>

      <div className="flex items-center justify-between gap-2 mb-1 pr-4">
        <span className={`inline-flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded border font-medium ${orgColor}`}>
          <Hash className="w-2 h-2" />{item.channel}
        </span>
        <span className={`text-[10px] font-bold tabular-nums ${showResolveTime ? getResponseColor(item.totalHandlingTimeSeconds) : 'text-red-600 dark:text-red-400'}`}>
          {showResolveTime ? formatDuration(item.totalHandlingTimeSeconds) : formatDuration(waitSeconds)}
        </span>
      </div>

      {item.messageText && (
        <p className="text-[11px] text-gray-600 dark:text-[#9A9BA3] line-clamp-1 mb-1 leading-relaxed">{item.messageText}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {item.claimedBy ? (
            <button onClick={() => navigate(`/kyc-goals/agent/${item.claimedBy._id}`)} className="flex items-center gap-1 group">
              <Avatar agent={item.claimedBy} size="w-4 h-4" />
              <span className="text-[10px] text-gray-500 dark:text-[#6B6D77] group-hover:text-gray-900 dark:group-hover:text-[#E8E9ED]">{item.claimedBy.name}</span>
            </button>
          ) : (
            <span className="text-[10px] text-red-500 font-medium">Unclaimed</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => openInSlack(item.slackChannelId, item.slackMessageTs)}
            title="Open in Slack"
            className="p-0.5 rounded text-gray-300 dark:text-[#3A3A45] hover:text-gray-600 dark:hover:text-[#9A9BA3] opacity-0 group-hover/card:opacity-100 transition-all"
          >
            <ExternalLink className="w-2.5 h-2.5" />
          </button>
          <span className="text-[9px] text-gray-400 dark:text-[#5B5D67] tabular-nums">{formatTime(item.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};

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
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [channelDropdownOpen, setChannelDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 30 });
      if (selectedChannel) params.append('channel', selectedChannel);

      const res = await axios.get(`${API_URL}/api/kyc-goals/activity-feed?${params}`, getAuthHeaders());
      const data = res.data;
      setItems(data.items || []);
      setChannels(data.channels || []);
      setLongWaiting(data.longWaiting || []);
      setLongWaitingHistory(data.longWaitingHistory || []);
      setPagination(data.pagination || { page: 1, total: 0, totalPages: 0 });
    } catch (err) {
      toast.error('Failed to load activity feed');
    } finally {
      setLoading(false);
    }
  }, [selectedChannel]);

  useEffect(() => { fetchData(1); }, [fetchData]);

  const handleDismiss = async (ticketId) => {
    try {
      await axios.post(`${API_URL}/api/kyc-goals/tickets/${ticketId}/dismiss`, {}, getAuthHeaders());
      setLongWaiting(prev => prev.filter(t => t._id !== ticketId));
      setLongWaitingHistory(prev => prev.filter(t => t._id !== ticketId));
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

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#0C0C10]">
      {/* Header bar */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-[#1E1E28] bg-white dark:bg-[#0C0C10]">
        <div className="flex items-center justify-between px-4 sm:px-6 py-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/kyc-goals')}
              className="flex items-center gap-1 text-sm text-gray-500 dark:text-[#6B6D77] hover:text-gray-900 dark:hover:text-[#E8E9ED] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </button>
            <div className="h-5 w-px bg-gray-200 dark:bg-[#252530]" />
            <h1 className="text-base font-semibold text-gray-900 dark:text-[#E8E9ED]">Activity Feed</h1>
            <span className="text-xs text-gray-400 dark:text-[#5B5D67]">{pagination.total} cases</span>
          </div>

          {/* Channel filter */}
          <div className="relative">
            <button
              onClick={() => setChannelDropdownOpen(!channelDropdownOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                selectedChannel
                  ? 'border-blue-300 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
                  : 'border-gray-200 dark:border-[#1E1E28] bg-white dark:bg-[#141419] text-gray-600 dark:text-[#9A9BA3] hover:border-gray-300 dark:hover:border-[#252530]'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              {selectedChannel ? selectedChannelDoc?.name || 'Channel' : 'All Channels'}
              {selectedChannel && (
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedChannel(''); setChannelDropdownOpen(false); }}
                  className="ml-1 p-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-500/20"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </button>

            <AnimatePresence>
              {channelDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-[#141419] border border-gray-200 dark:border-[#1E1E28] rounded-lg shadow-lg z-50 overflow-hidden"
                >
                  <div className="p-2 border-b border-gray-100 dark:border-[#1E1E28]">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search channels..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-7 pr-2 py-1.5 text-xs bg-gray-50 dark:bg-[#0C0C10] border border-gray-200 dark:border-[#1E1E28] rounded text-gray-900 dark:text-[#E8E9ED] placeholder-gray-400"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto p-1">
                    <button
                      onClick={() => { setSelectedChannel(''); setChannelDropdownOpen(false); setSearchQuery(''); }}
                      className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${
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
                        <div className="px-3 py-1 text-[10px] font-semibold text-gray-400 dark:text-[#5B5D67] uppercase tracking-wider mt-1">{org}</div>
                        {chs.map(c => (
                          <button
                            key={c.slackChannelId}
                            onClick={() => { setSelectedChannel(c.slackChannelId); setChannelDropdownOpen(false); setSearchQuery(''); }}
                            className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-2 ${
                              selectedChannel === c.slackChannelId
                                ? 'bg-gray-100 dark:bg-[#1E1E28] text-gray-900 dark:text-[#E8E9ED]'
                                : 'text-gray-600 dark:text-[#9A9BA3] hover:bg-gray-50 dark:hover:bg-[#111116]'
                            }`}
                          >
                            <Hash className="w-3 h-3 text-gray-400 dark:text-[#5B5D67]" />
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        {/* Two-column layout */}
        <div className="flex gap-6">
          {/* LEFT: Activity Feed Timeline (65%) */}
          <div className="flex-[65] min-w-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400 dark:text-[#5B5D67]" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-20">
                <Activity className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-[#3A3A45]" />
                <p className="text-sm text-gray-500 dark:text-[#6B6D77]">No activity found</p>
              </div>
            ) : (
              <div>
                {dateGroups.map(([date, dateItems]) => (
                  <div key={date} className="mb-5">
                    <div className="sticky top-0 z-10 mb-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-[#1E1E28] text-xs font-medium text-gray-600 dark:text-[#9A9BA3] border border-gray-200 dark:border-[#252530]">
                        {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        <span className="text-gray-400 dark:text-[#5B5D67]">({dateItems.length})</span>
                      </span>
                    </div>
                    <div className="pl-1">
                      {dateItems.map((item, i) => (
                        <TimelineItem key={item._id} item={item} isLast={i === dateItems.length - 1} navigate={navigate} />
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
              </div>
            )}
          </div>

          {/* RIGHT: Long Waiting Panels (35%) */}
          <div className="flex-[35] min-w-0 hidden lg:block">
            <div className="sticky top-4 space-y-5">
              {/* Current Long Waiting */}
              <div className="bg-white dark:bg-[#141419] border border-gray-200 dark:border-[#1E1E28] rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-[#1E1E28] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED]">Long Waiting</h3>
                  </div>
                  <span className={`text-xs font-bold tabular-nums px-1.5 py-0.5 rounded ${
                    longWaiting.length > 0 ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                  }`}>
                    {longWaiting.length}
                  </span>
                </div>
                <div className="p-3 max-h-[40vh] overflow-y-auto">
                  {longWaiting.length === 0 ? (
                    <div className="text-center py-6">
                      <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-400 dark:text-emerald-500" />
                      <p className="text-xs text-gray-500 dark:text-[#6B6D77]">No cases waiting over 10 min</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {longWaiting.map(item => (
                        <LongWaitingCard key={item._id} item={item} navigate={navigate} onDismiss={handleDismiss} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Long Waiting History */}
              <div className="bg-white dark:bg-[#141419] border border-gray-200 dark:border-[#1E1E28] rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-[#1E1E28] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-gray-400 dark:text-[#5B5D67]" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED]">Long Wait History</h3>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-[#5B5D67] tabular-nums">
                    {longWaitingHistory.length} cases
                  </span>
                </div>
                <div className="p-3 max-h-[40vh] overflow-y-auto">
                  {longWaitingHistory.length === 0 ? (
                    <div className="text-center py-6">
                      <Timer className="w-6 h-6 mx-auto mb-2 text-gray-300 dark:text-[#3A3A45]" />
                      <p className="text-xs text-gray-500 dark:text-[#6B6D77]">No long-wait cases recorded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {longWaitingHistory.map(item => (
                        <LongWaitingCard key={item._id} item={item} navigate={navigate} showResolveTime onDismiss={handleDismiss} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Click outside to close dropdown */}
      {channelDropdownOpen && (
        <div className="fixed inset-0 z-40" onClick={() => { setChannelDropdownOpen(false); setSearchQuery(''); }} />
      )}
    </div>
  );
};

export default KYCActivityFeed;
