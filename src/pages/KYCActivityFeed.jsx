import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Hash, Clock, ChevronLeft, ChevronRight, Filter,
  CheckCircle2, AlertCircle, Loader2, User, ArrowRight,
  Sun, Sunset, Moon, MessageSquare, Zap, Eye, X, Search
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const SHIFT_CONFIG = {
  morning: { icon: Sun, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', label: 'Morning' },
  afternoon: { icon: Sunset, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10', label: 'Afternoon' },
  night: { icon: Moon, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', label: 'Night' }
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

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
};

// ============================================
// Timeline Item
// ============================================
const TimelineItem = ({ item, isLast, navigate }) => {
  const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.open;
  const shiftCfg = SHIFT_CONFIG[item.shift];
  const ShiftIcon = shiftCfg?.icon || Sun;
  const orgColor = ORG_COLORS[item.organization] || ORG_COLORS['Stake.com'];
  const isInstant = item.caseType === 'agent_initiated';

  return (
    <div className="relative flex gap-4">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 mt-1.5 ${
          item.status === 'resolved' ? 'bg-emerald-500 border-emerald-400' :
          item.status === 'open' ? 'bg-blue-500 border-blue-400' :
          item.status === 'claimed' ? 'bg-amber-500 border-amber-400' :
          'bg-purple-500 border-purple-400'
        }`} />
        {!isLast && <div className="w-px flex-1 bg-gray-200 dark:bg-[#1E1E28] min-h-[40px]" />}
      </div>

      {/* Content card */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 mb-4 bg-white dark:bg-[#141419] border border-gray-200 dark:border-[#1E1E28] rounded-lg p-4 hover:border-gray-300 dark:hover:border-[#252530] transition-colors"
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border font-medium ${orgColor}`}>
              <Hash className="w-2.5 h-2.5" />
              {item.channel}
            </span>
            <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border font-medium ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
              {item.status === 'resolved' ? <CheckCircle2 className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
              {statusCfg.label}
            </span>
            {isInstant && (
              <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-[#1E1E28] dark:text-[#5B5D67] font-medium">
                <Zap className="w-2.5 h-2.5" />
                Instant
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <ShiftIcon className={`w-3 h-3 ${shiftCfg?.color}`} />
            <span className="text-[10px] text-gray-400 dark:text-[#5B5D67] tabular-nums whitespace-nowrap">
              {formatTime(item.createdAt)}
            </span>
          </div>
        </div>

        {/* Message text */}
        {item.messageText && (
          <p className="text-sm text-gray-700 dark:text-[#B0B1B8] mb-3 line-clamp-2 leading-relaxed">
            {item.messageText}
          </p>
        )}

        {/* Agent + timing info */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            {/* Claimed by */}
            {item.claimedBy && (
              <button
                onClick={() => navigate(`/kyc-goals/agent/${item.claimedBy._id}`)}
                className="flex items-center gap-1.5 group"
              >
                {item.claimedBy.slackAvatarUrl ? (
                  <img src={item.claimedBy.slackAvatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-[#1E1E28] flex items-center justify-center">
                    <span className="text-[9px] font-bold text-gray-500 dark:text-[#6B6D77]">{getInitials(item.claimedBy.name)}</span>
                  </div>
                )}
                <span className="text-xs text-gray-600 dark:text-[#9A9BA3] group-hover:text-gray-900 dark:group-hover:text-[#E8E9ED] transition-colors">
                  {item.claimedBy.name}
                </span>
              </button>
            )}
            {/* Resolved by (if different) */}
            {item.resolvedBy && item.resolvedBy._id !== item.claimedBy?._id && (
              <>
                <ArrowRight className="w-3 h-3 text-gray-300 dark:text-[#3A3A45]" />
                <button
                  onClick={() => navigate(`/kyc-goals/agent/${item.resolvedBy._id}`)}
                  className="flex items-center gap-1.5 group"
                >
                  {item.resolvedBy.slackAvatarUrl ? (
                    <img src={item.resolvedBy.slackAvatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">{getInitials(item.resolvedBy.name)}</span>
                    </div>
                  )}
                  <span className="text-xs text-gray-600 dark:text-[#9A9BA3] group-hover:text-gray-900 dark:group-hover:text-[#E8E9ED] transition-colors">
                    {item.resolvedBy.name}
                  </span>
                </button>
              </>
            )}
          </div>

          {/* Timing chips */}
          {!isInstant && (
            <div className="flex items-center gap-2">
              {item.timeToClaimSeconds > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 dark:text-[#6B6D77]">
                  <Clock className="w-2.5 h-2.5" />
                  Claim: <span className={getResponseColor(item.timeToClaimSeconds)}>{formatDuration(item.timeToClaimSeconds)}</span>
                </span>
              )}
              {item.responseTimeSeconds > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 dark:text-[#6B6D77]">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  Resolve: <span className={getResponseColor(item.responseTimeSeconds)}>{formatDuration(item.responseTimeSeconds)}</span>
                </span>
              )}
              {item.replyCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 dark:text-[#6B6D77]">
                  <MessageSquare className="w-2.5 h-2.5" />
                  {item.replyCount}
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
// Main Component
// ============================================
const KYCActivityFeed = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [channels, setChannels] = useState([]);
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
      setPagination(data.pagination || { page: 1, total: 0, totalPages: 0 });
    } catch (err) {
      toast.error('Failed to load activity feed');
    } finally {
      setLoading(false);
    }
  }, [selectedChannel]);

  useEffect(() => { fetchData(1); }, [fetchData]);

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
    <div className="min-h-screen bg-gray-50 dark:bg-[#0C0C10]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/kyc-goals')}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1E1E28] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-400 dark:text-[#5B5D67]" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-[#E8E9ED]">Activity Feed</h1>
              <p className="text-xs text-gray-500 dark:text-[#6B6D77]">
                {pagination.total} cases total
              </p>
            </div>
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

        {/* Timeline */}
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
              <div key={date} className="mb-6">
                {/* Date header */}
                <div className="sticky top-0 z-10 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-[#1E1E28] text-xs font-medium text-gray-600 dark:text-[#9A9BA3] border border-gray-200 dark:border-[#252530]">
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    <span className="text-gray-400 dark:text-[#5B5D67]">({dateItems.length})</span>
                  </span>
                </div>

                {/* Items */}
                <div className="pl-2">
                  {dateItems.map((item, i) => (
                    <TimelineItem
                      key={item._id}
                      item={item}
                      isLast={i === dateItems.length - 1}
                      navigate={navigate}
                    />
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

      {/* Click outside to close dropdown */}
      {channelDropdownOpen && (
        <div className="fixed inset-0 z-40" onClick={() => { setChannelDropdownOpen(false); setSearchQuery(''); }} />
      )}
    </div>
  );
};

export default KYCActivityFeed;
