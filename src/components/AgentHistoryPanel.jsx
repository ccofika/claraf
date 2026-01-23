import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  ChevronDown,
  ChevronRight,
  Loader2,
  BarChart3,
  Copy,
  Check,
  Eye,
  MessageSquare,
  ClipboardList,
  Calendar,
  Tag,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from './ui/badge';
import { SCORE_COLORS, SHORT_LABELS, getScorecardValues } from '../data/scorecardConfig';

const API_URL = process.env.REACT_APP_API_URL;

const AgentHistoryPanel = ({ agentId, agentName, isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [expandedWeeks, setExpandedWeeks] = useState(new Set([1]));
  const [copiedId, setCopiedId] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [fullTicketData, setFullTicketData] = useState(null);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  }, []);

  const fetchHistory = useCallback(async () => {
    if (!agentId) return;

    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/api/qa/agents/${agentId}/performance-history`,
        getAuthHeaders()
      );
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch agent history:', error);
      toast.error('Failed to load agent history');
    } finally {
      setLoading(false);
    }
  }, [agentId, getAuthHeaders]);

  const fetchTicketDetails = useCallback(async (ticketId) => {
    try {
      setTicketLoading(true);
      const response = await axios.get(
        `${API_URL}/api/qa/tickets/${ticketId}`,
        getAuthHeaders()
      );
      setFullTicketData(response.data);
    } catch (error) {
      console.error('Failed to fetch ticket:', error);
      toast.error('Failed to load ticket details');
    } finally {
      setTicketLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    if (isOpen && agentId) {
      fetchHistory();
      setExpandedWeeks(new Set([1]));
      setSelectedTicket(null);
      setFullTicketData(null);
    }
  }, [isOpen, agentId, fetchHistory]);

  useEffect(() => {
    if (selectedTicket) {
      fetchTicketDetails(selectedTicket._id);
    }
  }, [selectedTicket, fetchTicketDetails]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (selectedTicket) {
          setSelectedTicket(null);
          setFullTicketData(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, selectedTicket]);

  const toggleWeek = (weekNum) => {
    setExpandedWeeks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(weekNum)) {
        newSet.delete(weekNum);
      } else {
        newSet.add(weekNum);
      }
      return newSet;
    });
  };

  const expandAllWeeks = () => setExpandedWeeks(new Set([1, 2, 3]));
  const collapseAllWeeks = () => setExpandedWeeks(new Set());

  const getScoreColor = (score) => {
    if (score === null || score === undefined) return 'text-gray-400';
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 80) return 'text-blue-600 dark:text-blue-400';
    if (score >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score) => {
    if (score === null || score === undefined) return 'bg-gray-100 dark:bg-gray-800';
    if (score >= 90) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 80) return 'bg-blue-100 dark:bg-blue-900/30';
    if (score >= 70) return 'bg-amber-100 dark:bg-amber-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  const getTrendIcon = (trend) => {
    if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTrendLabel = (trend, value) => {
    if (trend === 'improving') return `+${value}% vs previous`;
    if (trend === 'declining') return `${value}% vs previous`;
    return 'Stable';
  };

  const handleCopyTicketId = async (ticketId, e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(ticketId);
      setCopiedId(ticketId);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleViewTicket = (ticket, e) => {
    e.stopPropagation();
    setSelectedTicket(ticket);
  };

  const closeTicketPreview = () => {
    setSelectedTicket(null);
    setFullTicketData(null);
  };

  // Strip HTML and decode entities
  const stripHtml = (html) => {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (selectedTicket) {
                closeTicketPreview();
              } else {
                onClose();
              }
            }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998]"
          />

          {/* Ticket Preview Panel (Left Side) */}
          <AnimatePresence>
            {selectedTicket && (
              <motion.div
                initial={{ x: '-100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '-100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed left-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-neutral-900 shadow-2xl z-[9999] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Preview Header */}
                <div className="flex-shrink-0 border-b border-gray-200 dark:border-neutral-800 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={closeTicketPreview}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                      </button>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          Ticket #{selectedTicket.ticketId}
                          <span className={`px-2 py-0.5 rounded-lg text-sm font-medium ${getScoreBgColor(selectedTicket.score)} ${getScoreColor(selectedTicket.score)}`}>
                            {selectedTicket.score !== null ? `${selectedTicket.score}%` : '-'}
                          </span>
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-neutral-400">
                          Graded on {new Date(selectedTicket.gradedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={closeTicketPreview}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Preview Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {ticketLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                  ) : fullTicketData ? (
                    <div className="space-y-6">
                      {/* Categories */}
                      {fullTicketData.categories?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Tag className="w-4 h-4 text-gray-400" />
                            <h3 className="text-sm font-medium text-gray-700 dark:text-neutral-300">Categories</h3>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {fullTicketData.categories.map((cat, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes Section */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <ClipboardList className="w-4 h-4 text-gray-400" />
                          <h3 className="text-sm font-medium text-gray-700 dark:text-neutral-300">Notes</h3>
                        </div>
                        <div className="bg-gray-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-gray-200 dark:border-neutral-700">
                          {fullTicketData.notes ? (
                            <div
                              className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-neutral-300"
                              dangerouslySetInnerHTML={{ __html: fullTicketData.notes }}
                            />
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-neutral-500 italic">No notes available</p>
                          )}
                        </div>
                      </div>

                      {/* Feedback Section */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-gray-400" />
                          <h3 className="text-sm font-medium text-gray-700 dark:text-neutral-300">Feedback</h3>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                          {fullTicketData.feedback ? (
                            <div
                              className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-neutral-300"
                              dangerouslySetInnerHTML={{ __html: fullTicketData.feedback }}
                            />
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-neutral-500 italic">No feedback available</p>
                          )}
                        </div>
                      </div>

                      {/* Scorecard if available */}
                      {fullTicketData.scorecardValues && Object.keys(fullTicketData.scorecardValues).length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <BarChart3 className="w-4 h-4 text-gray-400" />
                            <h3 className="text-sm font-medium text-gray-700 dark:text-neutral-300">Scorecard</h3>
                          </div>
                          <div className="bg-gray-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-gray-200 dark:border-neutral-700">
                            {/* Scorecard Type Header */}
                            <div className="mb-3 pb-3 border-b border-gray-200 dark:border-neutral-700">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                                  {fullTicketData.agent?.position || 'Scorecard'}
                                </span>
                                {fullTicketData.scorecardVariant && (
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] ${
                                      fullTicketData.scorecardVariant === 'mentions'
                                        ? 'border-purple-400 text-purple-600 dark:text-purple-400'
                                        : 'border-blue-400 text-blue-600 dark:text-blue-400'
                                    }`}
                                  >
                                    {fullTicketData.scorecardVariant === 'mentions' ? 'Selected Mentions' : 'Use This One'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {/* Scorecard Values */}
                            <div className="space-y-2.5">
                              {(() => {
                                // Get proper labels from scorecard config
                                const position = fullTicketData.agent?.position;
                                const variant = fullTicketData.scorecardVariant;
                                const configValues = position ? getScorecardValues(position, variant) : [];
                                const configMap = {};
                                configValues.forEach(v => { configMap[v.key] = v; });

                                return Object.entries(fullTicketData.scorecardValues).map(([key, value]) => {
                                  // Get label from config or fallback to formatted key
                                  const configItem = configMap[key];
                                  const label = configItem?.label || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

                                  // Get display value and colors using same format as ScorecardEditor
                                  const displayLabel = value !== null && value !== undefined && SHORT_LABELS[value]
                                    ? SHORT_LABELS[value]
                                    : '-';

                                  // Background colors matching SCORE_COLORS
                                  const getBgClass = (idx) => {
                                    if (idx === null || idx === undefined) return 'bg-gray-100 dark:bg-neutral-700';
                                    switch (idx) {
                                      case 0: return 'bg-green-500';
                                      case 1: return 'bg-yellow-400';
                                      case 2: return 'bg-amber-500';
                                      case 3: return 'bg-red-500';
                                      case 4: return 'bg-gray-400';
                                      default: return 'bg-gray-100 dark:bg-neutral-700';
                                    }
                                  };

                                  const getTextClass = (idx) => {
                                    if (idx === null || idx === undefined) return 'text-gray-500';
                                    if (idx === 1) return 'text-gray-900'; // Yellow needs dark text
                                    return 'text-white';
                                  };

                                  return (
                                    <div key={key} className="flex items-center justify-between">
                                      <span className="text-sm text-gray-600 dark:text-neutral-400">{label}</span>
                                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${getBgClass(value)} ${getTextClass(value)}`}>
                                        {displayLabel}
                                      </span>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-16 text-gray-500">
                      Failed to load ticket details
                    </div>
                  )}
                </div>

                {/* Preview Footer */}
                <div className="flex-shrink-0 border-t border-gray-200 dark:border-neutral-800 px-6 py-3 bg-gray-50 dark:bg-neutral-800/50">
                  <p className="text-xs text-gray-500 dark:text-neutral-400 text-center">
                    Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-neutral-700 rounded text-[10px]">ESC</kbd> to close preview
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* History Panel (Right Side) */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-xl bg-white dark:bg-neutral-900 shadow-2xl z-[9999] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex-shrink-0 border-b border-gray-200 dark:border-neutral-800 px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center text-lg font-semibold">
                    {agentName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {data?.agent?.name || agentName}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-neutral-400">
                      Performance History (Last 3 Weeks)
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Quick Actions */}
              {!loading && data && (
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={expandAllWeeks}
                    className="px-3 py-1.5 text-xs text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                  >
                    Expand All
                  </button>
                  <button
                    onClick={collapseAllWeeks}
                    className="px-3 py-1.5 text-xs text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                  >
                    Collapse All
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : !data || data.summary.totalTickets === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                    <BarChart3 className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No History Available
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-neutral-400 max-w-xs">
                    No archived tickets found for this agent in the last 3 weeks.
                  </p>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 dark:bg-neutral-800/50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-neutral-400">Tickets</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {data.summary.totalTickets}
                      </p>
                    </div>

                    <div className={`rounded-xl p-4 ${getScoreBgColor(data.summary.overallAvg)}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <BarChart3 className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-neutral-400">Avg Score</span>
                      </div>
                      <p className={`text-2xl font-bold ${getScoreColor(data.summary.overallAvg)}`}>
                        {data.summary.overallAvg !== null ? `${data.summary.overallAvg}%` : '-'}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-neutral-800/50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        {getTrendIcon(data.summary.trend)}
                        <span className="text-xs text-gray-500 dark:text-neutral-400">Trend</span>
                      </div>
                      <p className={`text-sm font-medium ${
                        data.summary.trend === 'improving' ? 'text-green-600 dark:text-green-400' :
                        data.summary.trend === 'declining' ? 'text-red-600 dark:text-red-400' :
                        'text-gray-600 dark:text-neutral-400'
                      }`}>
                        {getTrendLabel(data.summary.trend, data.summary.trendValue)}
                      </p>
                    </div>
                  </div>

                  {/* Top Categories */}
                  {data.summary.topCategories?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                        Most Common Categories
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {data.summary.topCategories.map((cat, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          >
                            {cat.name} ({cat.count})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Weekly Breakdown */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                      Weekly Breakdown
                    </h4>

                    {data.weeks.map((week) => {
                      const isExpanded = expandedWeeks.has(week.weekNumber);

                      return (
                        <div
                          key={week.weekNumber}
                          className="border border-gray-200 dark:border-neutral-800 rounded-xl overflow-hidden"
                        >
                          {/* Week Header */}
                          <button
                            onClick={() => toggleWeek(week.weekNumber)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-neutral-800/50 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-1 rounded transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {week.label}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-neutral-400">
                                  {week.dateRange}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-xs text-gray-500 dark:text-neutral-400">
                                  {week.ticketCount} tickets
                                </p>
                              </div>
                              {week.avgScore !== null && (
                                <div className={`px-2.5 py-1 rounded-lg text-sm font-medium ${getScoreBgColor(week.avgScore)} ${getScoreColor(week.avgScore)}`}>
                                  {week.avgScore}%
                                </div>
                              )}
                            </div>
                          </button>

                          {/* Tickets List */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                {week.tickets.length === 0 ? (
                                  <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-neutral-400">
                                    No tickets this week
                                  </div>
                                ) : (
                                  <div className="divide-y divide-gray-100 dark:divide-neutral-800">
                                    {week.tickets.map((ticket) => (
                                      <div
                                        key={ticket._id}
                                        className={`px-4 py-4 transition-colors cursor-pointer ${
                                          selectedTicket?._id === ticket._id
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500'
                                            : 'hover:bg-gray-50 dark:hover:bg-neutral-800/30'
                                        }`}
                                        onClick={(e) => handleViewTicket(ticket, e)}
                                      >
                                        {/* Ticket Header */}
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                          <div className="flex items-center gap-2">
                                            <button
                                              onClick={(e) => handleCopyTicketId(ticket.ticketId, e)}
                                              className="text-xs font-mono text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                              title="Click to copy"
                                            >
                                              #{ticket.ticketId}
                                              {copiedId === ticket.ticketId ? (
                                                <Check className="w-3 h-3 text-green-500" />
                                              ) : (
                                                <Copy className="w-3 h-3 opacity-50" />
                                              )}
                                            </button>
                                            <span className="text-xs text-gray-400">•</span>
                                            <span className="text-xs text-gray-500 dark:text-neutral-500">
                                              {new Date(ticket.gradedDate).toLocaleDateString()}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <button
                                              onClick={(e) => handleViewTicket(ticket, e)}
                                              className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                            >
                                              <Eye className="w-3 h-3" />
                                              View
                                            </button>
                                            <div className={`px-2 py-1 rounded-lg text-xs font-medium ${getScoreBgColor(ticket.score)} ${getScoreColor(ticket.score)}`}>
                                              {ticket.score !== null ? `${ticket.score}%` : '-'}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Categories */}
                                        {ticket.categories?.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mb-2">
                                            {ticket.categories.slice(0, 4).map((cat, idx) => (
                                              <span
                                                key={idx}
                                                className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 rounded"
                                              >
                                                {cat.length > 25 ? cat.substring(0, 25) + '...' : cat}
                                              </span>
                                            ))}
                                            {ticket.categories.length > 4 && (
                                              <span className="text-[10px] text-gray-400">
                                                +{ticket.categories.length - 4}
                                              </span>
                                            )}
                                          </div>
                                        )}

                                        {/* Feedback Preview - 3 lines */}
                                        {ticket.feedbackPreview && (
                                          <div className="mt-2">
                                            <p className="text-xs text-gray-600 dark:text-neutral-400 line-clamp-3 leading-relaxed">
                                              {stripHtml(ticket.feedbackPreview)}
                                            </p>
                                          </div>
                                        )}

                                        {/* Notes Preview if no feedback */}
                                        {!ticket.feedbackPreview && ticket.notesPreview && (
                                          <div className="mt-2">
                                            <p className="text-xs text-gray-500 dark:text-neutral-500 line-clamp-2 leading-relaxed italic">
                                              Notes: {stripHtml(ticket.notesPreview)}
                                            </p>
                                          </div>
                                        )}

                                        {/* Click hint */}
                                        <p className="text-[10px] text-gray-400 dark:text-neutral-600 mt-2">
                                          Click to preview full ticket →
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-gray-200 dark:border-neutral-800 px-6 py-3 bg-gray-50 dark:bg-neutral-800/50">
              <p className="text-xs text-gray-500 dark:text-neutral-400 text-center">
                Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-neutral-700 rounded text-[10px]">ESC</kbd> to close
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default AgentHistoryPanel;
