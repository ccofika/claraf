import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Star, AlertCircle, Loader2, FileText, Hash, ArrowLeft, Tag, MessageSquare, BarChart3, Copy, Check } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Badge } from './ui/badge';
import { SCORE_COLORS, SHORT_LABELS, getScorecardValues } from '../data/scorecardConfig';
import { staggerContainer, staggerItem, fadeInUp, scaleIn, duration, easing } from '../utils/animations';

// Helper to truncate text
const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  // Strip HTML tags first
  const stripped = text.replace(/<[^>]*>/g, '');
  if (stripped.length <= maxLength) return stripped;
  return stripped.substring(0, maxLength) + '...';
};

// Helper to get score color
const getScoreColor = (score) => {
  if (score === null || score === undefined) {
    return {
      bg: 'bg-gray-100 dark:bg-zinc-700/50',
      text: 'text-gray-500 dark:text-zinc-400',
      border: 'border-gray-200 dark:border-zinc-600/30'
    };
  }
  if (score >= 80) {
    return {
      bg: 'bg-emerald-100 dark:bg-emerald-500/20',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-500/30'
    };
  }
  if (score >= 60) {
    return {
      bg: 'bg-amber-100 dark:bg-amber-500/20',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-500/30'
    };
  }
  if (score >= 40) {
    return {
      bg: 'bg-orange-100 dark:bg-orange-500/20',
      text: 'text-orange-700 dark:text-orange-400',
      border: 'border-orange-200 dark:border-orange-500/30'
    };
  }
  return {
    bg: 'bg-red-100 dark:bg-red-500/20',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-500/30'
  };
};

const RelatedTicketsPanel = ({ agentId, categories = [], currentTicketId, onCopyToTicket }) => {
  const { user } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL;

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Ticket detail state
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [fullTicketData, setFullTicketData] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // Category validation - must have at least one non-Other category
  const validCategories = (categories || []).filter(c => c && c !== 'Other');
  const isCategoryEmpty = validCategories.length === 0;

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${user?.token}` }
  });

  const fetchRelatedTickets = useCallback(async () => {
    if (isCategoryEmpty || !agentId) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      params.append('agent', agentId);
      // Send categories as comma-separated for backend to handle
      validCategories.forEach(cat => params.append('categories', cat));
      // Use relatedMode to get ALL tickets (archived + non-archived, all graders)
      params.append('relatedMode', 'true');
      params.append('limit', '50');
      params.append('sortBy', 'qualityScorePercent');
      params.append('sortOrder', 'asc'); // Worst first

      const response = await axios.get(
        `${API_URL}/api/qa/tickets?${params.toString()}`,
        getAuthHeaders()
      );

      // Filter out current ticket and sort by qualityScorePercent ascending
      let results = (response.data.tickets || [])
        .filter(t => t._id !== currentTicketId)
        .sort((a, b) => {
          // Handle null/undefined scores - put them at the end
          const scoreA = a.qualityScorePercent ?? 101;
          const scoreB = b.qualityScorePercent ?? 101;
          return scoreA - scoreB;
        });

      setTickets(results);
    } catch (err) {
      console.error('Failed to fetch related tickets:', err);
      setError('Failed to fetch related tickets');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [agentId, validCategories.join(','), currentTicketId, API_URL, user?.token, isCategoryEmpty]);

  // Fetch ticket details
  const fetchTicketDetails = useCallback(async (ticketId) => {
    try {
      setTicketLoading(true);
      const response = await axios.get(
        `${API_URL}/api/qa/tickets/${ticketId}`,
        getAuthHeaders()
      );
      setFullTicketData(response.data);
    } catch (err) {
      console.error('Failed to fetch ticket:', err);
      toast.error('Failed to load ticket details');
    } finally {
      setTicketLoading(false);
    }
  }, [API_URL, user?.token]);

  // When selecting a ticket
  useEffect(() => {
    if (selectedTicket) {
      fetchTicketDetails(selectedTicket._id);
    } else {
      setFullTicketData(null);
    }
  }, [selectedTicket, fetchTicketDetails]);

  // Copy functions
  const handleCopyAll = () => {
    if (!fullTicketData || !onCopyToTicket) return;
    onCopyToTicket({
      categories: fullTicketData.categories || [],
      feedback: fullTicketData.feedback || '',
      scorecardValues: fullTicketData.scorecardValues || {},
      scorecardVariant: fullTicketData.scorecardVariant || null
    });
    setCopiedField('all');
    toast.success('Categories, feedback & scorecard copied to ticket');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyFeedback = () => {
    if (!fullTicketData || !onCopyToTicket) return;
    onCopyToTicket({ feedback: fullTicketData.feedback || '' });
    setCopiedField('feedback');
    toast.success('Feedback copied to ticket');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyCategories = () => {
    if (!fullTicketData || !onCopyToTicket) return;
    onCopyToTicket({ categories: fullTicketData.categories || [] });
    setCopiedField('categories');
    toast.success('Categories copied to ticket');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyScorecard = () => {
    if (!fullTicketData || !onCopyToTicket) return;
    onCopyToTicket({
      scorecardValues: fullTicketData.scorecardValues || {},
      scorecardVariant: fullTicketData.scorecardVariant || null
    });
    setCopiedField('scorecard');
    toast.success('Scorecard copied to ticket');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Score helpers for detail view
  const getDetailScoreColor = (score) => {
    if (score === null || score === undefined) return 'text-gray-400';
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 80) return 'text-blue-600 dark:text-blue-400';
    if (score >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getDetailScoreBgColor = (score) => {
    if (score === null || score === undefined) return 'bg-gray-100 dark:bg-gray-800';
    if (score >= 90) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 80) return 'bg-blue-100 dark:bg-blue-900/30';
    if (score >= 70) return 'bg-amber-100 dark:bg-amber-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  // Auto-fetch when dependencies change
  useEffect(() => {
    if (!isCategoryEmpty && agentId) {
      fetchRelatedTickets();
    } else {
      setTickets([]);
      setHasSearched(false);
    }
  }, [agentId, validCategories.join(','), isCategoryEmpty]);

  // Category required message
  if (isCategoryEmpty) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center mb-4 border-2 border-red-300 dark:border-red-500/30">
          <AlertCircle className="w-7 h-7 text-red-500 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">Category Required</h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-[280px]">
          Please select a category for this ticket to view related tickets from the same agent.
        </p>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center border border-blue-200 dark:border-blue-500/20">
          <Loader2 className="w-5 h-5 text-blue-500 dark:text-blue-400 animate-spin" />
        </div>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-4">Finding related tickets...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center mb-4 border border-red-200 dark:border-red-500/20">
          <AlertCircle className="w-6 h-6 text-red-500 dark:text-red-400" />
        </div>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">{error}</p>
        <button
          type="button"
          onClick={fetchRelatedTickets}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg border border-gray-300 dark:border-zinc-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // No results
  if (tickets.length === 0 && hasSearched) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-4 border border-gray-200 dark:border-zinc-700">
          <FileText className="w-7 h-7 text-gray-400 dark:text-zinc-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-700 dark:text-zinc-300 mb-2">No Related Tickets</h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-[250px]">
          No other tickets found for this agent in the selected categories.
        </p>
      </div>
    );
  }

  // Results view
  return (
    <div className="h-full flex flex-col relative">
      {/* Ticket Detail View */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 bg-white dark:bg-neutral-900 z-10 flex flex-col"
          >
            {/* Detail Header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to results
                </button>
                {onCopyToTicket && (
                  <button
                    type="button"
                    onClick={handleCopyAll}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      copiedField === 'all'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                    }`}
                  >
                    {copiedField === 'all' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy All
                  </button>
                )}
              </div>
            </div>

            {/* Detail Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {ticketLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              ) : fullTicketData ? (
                <div className="space-y-4">
                  {/* Ticket Info */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {fullTicketData.ticketId}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-neutral-400">
                        {fullTicketData.agent?.name} • {new Date(fullTicketData.dateEntered).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg text-sm font-bold ${getDetailScoreBgColor(fullTicketData.qualityScorePercent)} ${getDetailScoreColor(fullTicketData.qualityScorePercent)}`}>
                      {fullTicketData.qualityScorePercent != null ? `${fullTicketData.qualityScorePercent}%` : '-'}
                    </div>
                  </div>

                  {/* Categories */}
                  {fullTicketData.categories && fullTicketData.categories.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-gray-400" />
                          <h4 className="text-xs font-medium text-gray-600 dark:text-neutral-400 uppercase">Categories</h4>
                        </div>
                        {onCopyToTicket && (
                          <button
                            type="button"
                            onClick={handleCopyCategories}
                            className={`p-1 rounded transition-all ${
                              copiedField === 'categories'
                                ? 'text-green-500'
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300'
                            }`}
                          >
                            {copiedField === 'categories' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {fullTicketData.categories.map(cat => (
                          <span
                            key={cat}
                            className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feedback */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        <h4 className="text-xs font-medium text-gray-600 dark:text-neutral-400 uppercase">Feedback</h4>
                      </div>
                      {onCopyToTicket && (
                        <button
                          type="button"
                          onClick={handleCopyFeedback}
                          className={`p-1 rounded transition-all ${
                            copiedField === 'feedback'
                              ? 'text-green-500'
                              : 'text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300'
                          }`}
                        >
                          {copiedField === 'feedback' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                    <div className="bg-gray-50 dark:bg-neutral-800/50 rounded-lg p-3 border border-gray-200 dark:border-neutral-700">
                      {fullTicketData.feedback ? (
                        <div
                          className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-neutral-300 text-xs"
                          dangerouslySetInnerHTML={{ __html: fullTicketData.feedback }}
                        />
                      ) : (
                        <p className="text-xs text-gray-500 dark:text-neutral-500 italic">No feedback</p>
                      )}
                    </div>
                  </div>

                  {/* Scorecard */}
                  {fullTicketData.scorecardValues && Object.keys(fullTicketData.scorecardValues).length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-gray-400" />
                          <h4 className="text-xs font-medium text-gray-600 dark:text-neutral-400 uppercase">Scorecard</h4>
                          {fullTicketData.scorecardVariant && (
                            <Badge variant="outline" className="text-[10px]">
                              {fullTicketData.scorecardVariant}
                            </Badge>
                          )}
                        </div>
                        {onCopyToTicket && (
                          <button
                            type="button"
                            onClick={handleCopyScorecard}
                            className={`p-1 rounded transition-all ${
                              copiedField === 'scorecard'
                                ? 'text-green-500'
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300'
                            }`}
                          >
                            {copiedField === 'scorecard' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                      <div className="bg-gray-50 dark:bg-neutral-800/50 rounded-lg p-3 border border-gray-200 dark:border-neutral-700">
                        <div className="space-y-1.5">
                          {(() => {
                            const position = fullTicketData.agent?.position;
                            const variant = fullTicketData.scorecardVariant;
                            const configValues = position ? getScorecardValues(position, variant) : [];
                            const configMap = {};
                            configValues.forEach(v => { configMap[v.key] = v; });

                            return Object.entries(fullTicketData.scorecardValues).map(([key, value]) => {
                              const configItem = configMap[key];
                              const label = configItem?.label || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                              const displayLabel = value !== null && value !== undefined && SHORT_LABELS[value]
                                ? SHORT_LABELS[value]
                                : '-';

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
                                if (idx === 1) return 'text-gray-900';
                                return 'text-white';
                              };

                              return (
                                <div key={key} className="flex items-center justify-between">
                                  <span className="text-xs text-gray-600 dark:text-neutral-400">{label}</span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getBgClass(value)} ${getTextClass(value)}`}>
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
                <div className="flex items-center justify-center py-12 text-gray-500">
                  Failed to load ticket
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-zinc-800/80 bg-gray-50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-500/20 dark:to-cyan-500/20 border border-blue-200 dark:border-blue-500/20">
            <Users className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-800 dark:text-zinc-200">Related Tickets</h3>
            <p className="text-xs text-gray-500 dark:text-zinc-500">
              {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} • Sorted worst to best
            </p>
          </div>
        </div>
      </div>

      {/* Ticket list */}
      <motion.div
        className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {tickets.map((ticket, index) => {
          const scoreColors = getScoreColor(ticket.qualityScorePercent);

          return (
            <motion.div
              key={ticket._id}
              className="group relative bg-white dark:bg-zinc-800/40 hover:bg-gray-50 dark:hover:bg-zinc-800/60 rounded-xl border border-gray-200 dark:border-zinc-700/50 hover:border-gray-300 dark:hover:border-zinc-600/50 transition-all duration-200 shadow-sm dark:shadow-none cursor-pointer"
              variants={staggerItem}
              whileHover={{ y: -2, transition: { duration: duration.fast } }}
              onClick={() => setSelectedTicket(ticket)}
            >
              {/* Top row - badges */}
              <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                {/* Quality score */}
                <div className={`px-2 py-0.5 rounded-md text-xs font-semibold ${scoreColors.bg} ${scoreColors.text} border ${scoreColors.border}`}>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    {ticket.qualityScorePercent !== null && ticket.qualityScorePercent !== undefined
                      ? `${ticket.qualityScorePercent}%`
                      : 'Not graded'}
                  </div>
                </div>

                {/* Ticket ID */}
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-gray-100 dark:bg-zinc-700/50 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-600/30">
                  <Hash className="w-3 h-3" />
                  {ticket.ticketId}
                </div>
              </div>

              {/* Date */}
              {ticket.dateEntered && (
                <div className="px-3 pb-1">
                  <p className="text-[11px] text-gray-500 dark:text-zinc-500">
                    {ticket.agent?.name ? `${ticket.agent.name} • ` : ''}{new Date(ticket.dateEntered).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Notes preview */}
              {ticket.notes && (
                <div className="px-3 pb-2">
                  <p className="text-xs text-gray-500 dark:text-zinc-500 leading-relaxed">
                    <span className="text-gray-400 dark:text-zinc-600 font-medium">Notes: </span>
                    {truncateText(ticket.notes, 100)}
                  </p>
                </div>
              )}

              {/* Feedback content */}
              {ticket.feedback && (
                <div className="px-3 pb-3">
                  <div className="bg-gray-50 dark:bg-zinc-900/60 rounded-lg p-3 border border-gray-200 dark:border-zinc-700/30">
                    <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {truncateText(ticket.feedback, 300)}
                    </p>
                  </div>
                </div>
              )}

              {/* No feedback placeholder */}
              {!ticket.feedback && (
                <div className="px-3 pb-3">
                  <div className="bg-gray-50 dark:bg-zinc-900/60 rounded-lg p-3 border border-gray-200 dark:border-zinc-700/30">
                    <p className="text-sm text-gray-400 dark:text-zinc-500 italic">
                      No feedback provided
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default RelatedTicketsPanel;
