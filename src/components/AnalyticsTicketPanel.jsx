import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  X,
  TrendingUp,
  TrendingDown,
  FileText,
  Loader2,
  BarChart3,
  MessageSquare,
  ClipboardList,
  Tag,
  Calendar,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from './ui/badge';
import { SCORE_COLORS, SHORT_LABELS, getScorecardValues } from '../data/scorecardConfig';

const API_URL = process.env.REACT_APP_API_URL;

const AnalyticsTicketPanel = ({ ticket, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [fullTicketData, setFullTicketData] = useState(null);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  }, []);

  const fetchTicketDetails = useCallback(async (ticketId) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/api/qa/tickets/${ticketId}`,
        getAuthHeaders()
      );
      setFullTicketData(response.data);
    } catch (error) {
      console.error('Failed to fetch ticket:', error);
      toast.error('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    if (isOpen && ticket?._id) {
      fetchTicketDetails(ticket._id);
    }
  }, [isOpen, ticket?._id, fetchTicketDetails]);

  useEffect(() => {
    if (!isOpen) {
      setFullTicketData(null);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

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

  const getScoreDifferenceDisplay = (diff) => {
    if (diff === 0) return { text: 'No change', color: 'text-gray-500', icon: null };
    if (diff > 0) return {
      text: `+${diff.toFixed(1)}%`,
      color: 'text-green-600 dark:text-green-400',
      icon: TrendingUp
    };
    return {
      text: `${diff.toFixed(1)}%`,
      color: 'text-red-600 dark:text-red-400',
      icon: TrendingDown
    };
  };

  if (!isOpen) return null;

  const diffDisplay = ticket ? getScoreDifferenceDisplay(ticket.scoreDifference || 0) : null;
  const DiffIcon = diffDisplay?.icon;

  // Get reviewer name from ticket data
  const reviewerName = ticket?.reviewerName || null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998]"
          />

          {/* Panel (Right Side) */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-neutral-900 shadow-2xl z-[9999] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex-shrink-0 border-b border-gray-200 dark:border-neutral-800 px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      Ticket #{ticket?.ticketId}
                      <span className={`px-2 py-0.5 rounded-lg text-sm font-medium ${getScoreBgColor(ticket?.finalScore)} ${getScoreColor(ticket?.finalScore)}`}>
                        {ticket?.finalScore !== null && ticket?.finalScore !== undefined ? `${ticket.finalScore}%` : '-'}
                      </span>
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-neutral-400">
                      {ticket?.agentName} - {ticket?.firstReviewDate
                        ? new Date(ticket.firstReviewDate).toLocaleDateString()
                        : '-'}
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
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Score Comparison */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 dark:bg-neutral-800/50 rounded-xl p-4">
                      <p className="text-xs text-gray-500 dark:text-neutral-400 mb-1">Original Score</p>
                      <p className={`text-2xl font-bold ${getScoreColor(ticket?.originalScore)}`}>
                        {ticket?.originalScore !== null && ticket?.originalScore !== undefined
                          ? `${ticket.originalScore}%`
                          : '-'}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-neutral-800/50 rounded-xl p-4">
                      <p className="text-xs text-gray-500 dark:text-neutral-400 mb-1">Final Score</p>
                      <p className={`text-2xl font-bold ${getScoreColor(ticket?.finalScore)}`}>
                        {ticket?.finalScore !== null && ticket?.finalScore !== undefined
                          ? `${ticket.finalScore}%`
                          : '-'}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-neutral-800/50 rounded-xl p-4">
                      <p className="text-xs text-gray-500 dark:text-neutral-400 mb-1">Difference</p>
                      <p className={`text-2xl font-bold flex items-center gap-1 ${diffDisplay?.color}`}>
                        {DiffIcon && <DiffIcon className="w-5 h-5" />}
                        {diffDisplay?.text}
                      </p>
                    </div>
                  </div>

                  {/* Reviewer Note */}
                  {(ticket?.additionalNote || fullTicketData?.additionalNote) && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">
                          Reviewer Note{reviewerName ? ` - ${reviewerName}` : ''}
                        </h3>
                      </div>
                      <p className="text-sm text-amber-900 dark:text-amber-200">
                        {ticket?.additionalNote || fullTicketData?.additionalNote}
                      </p>
                    </div>
                  )}

                  {/* Categories */}
                  {(ticket?.categories?.length > 0 || fullTicketData?.categories?.length > 0) && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="w-4 h-4 text-gray-400" />
                        <h3 className="text-sm font-medium text-gray-700 dark:text-neutral-300">Categories</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(fullTicketData?.categories || ticket?.categories || []).map((cat, idx) => (
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
                      {(fullTicketData?.notes || ticket?.notes) ? (
                        <div
                          className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-neutral-300"
                          dangerouslySetInnerHTML={{ __html: fullTicketData?.notes || ticket?.notes }}
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
                      {(fullTicketData?.feedback || ticket?.feedback) ? (
                        <div
                          className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-neutral-300"
                          dangerouslySetInnerHTML={{ __html: fullTicketData?.feedback || ticket?.feedback }}
                        />
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-neutral-500 italic">No feedback available</p>
                      )}
                    </div>
                  </div>

                  {/* Scorecard if available */}
                  {(fullTicketData?.scorecardValues || ticket?.scorecardValues) &&
                    Object.keys(fullTicketData?.scorecardValues || ticket?.scorecardValues).length > 0 && (
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
                              {fullTicketData?.agent?.position || ticket?.agentPosition || 'Scorecard'}
                            </span>
                            {(fullTicketData?.scorecardVariant || ticket?.scorecardVariant) && (
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  (fullTicketData?.scorecardVariant || ticket?.scorecardVariant) === 'mentions'
                                    ? 'border-purple-400 text-purple-600 dark:text-purple-400'
                                    : 'border-blue-400 text-blue-600 dark:text-blue-400'
                                }`}
                              >
                                {(fullTicketData?.scorecardVariant || ticket?.scorecardVariant) === 'mentions'
                                  ? 'Selected Mentions'
                                  : 'Use This One'}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {/* Scorecard Values */}
                        <div className="space-y-2.5">
                          {(() => {
                            const position = fullTicketData?.agent?.position || ticket?.agentPosition;
                            const variant = fullTicketData?.scorecardVariant || ticket?.scorecardVariant;
                            const values = fullTicketData?.scorecardValues || ticket?.scorecardValues;
                            const configValues = position ? getScorecardValues(position, variant) : [];
                            const configMap = {};
                            configValues.forEach(v => { configMap[v.key] = v; });

                            return Object.entries(values).map(([key, value]) => {
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

export default AnalyticsTicketPanel;
