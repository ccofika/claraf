import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  X,
  Loader2,
  BarChart3,
  Eye,
  MessageSquare,
  ClipboardList,
  Tag,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from './ui/badge';
import { SCORE_COLORS, SHORT_LABELS, getScorecardValues } from '../data/scorecardConfig';
import AgentHistoryContent, { getScoreColor, getScoreBgColor } from './AgentHistoryContent';

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

            {/* Content - using shared AgentHistoryContent */}
            <div className="flex-1 overflow-y-auto">
              <AgentHistoryContent
                data={data}
                loading={loading}
                expandedWeeks={expandedWeeks}
                onToggleWeek={toggleWeek}
                onExpandAll={expandAllWeeks}
                onCollapseAll={collapseAllWeeks}
                selectedTicketId={selectedTicket?._id}
                onTicketSelect={handleViewTicket}
                copiedId={copiedId}
                onCopyId={handleCopyTicketId}
              />
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
