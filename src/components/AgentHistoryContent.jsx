import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  ChevronRight,
  Loader2,
  BarChart3,
  Copy,
  Check,
  Eye,
  Tag,
  MessageSquare,
  ClipboardList,
  ArrowLeft
} from 'lucide-react';
import { Badge } from './ui/badge';
import { SCORE_COLORS, SHORT_LABELS, getScorecardValues } from '../data/scorecardConfig';

// Shared helper functions
export const getScoreColor = (score) => {
  if (score === null || score === undefined) return 'text-gray-400';
  if (score >= 90) return 'text-green-600 dark:text-green-400';
  if (score >= 80) return 'text-blue-600 dark:text-blue-400';
  if (score >= 70) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
};

export const getScoreBgColor = (score) => {
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

export const stripHtml = (html) => {
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

/**
 * Shared history content component used by both AgentHistoryPanel (modal) and ThrowbackPanel (inline).
 *
 * Props:
 * - data: API response data (summary + weeks)
 * - loading: boolean
 * - compact: boolean - smaller sizing for Throwback panel
 * - expandedWeeks: Set of expanded week numbers
 * - onToggleWeek: (weekNum) => void
 * - onExpandAll: () => void
 * - onCollapseAll: () => void
 * - selectedTicketId: string | null - currently selected ticket _id
 * - onTicketSelect: (ticket, event) => void
 * - copiedId: string | null
 * - onCopyId: (ticketId, event) => void
 */
const AgentHistoryContent = ({
  data,
  loading,
  compact = false,
  expandedWeeks,
  onToggleWeek,
  onExpandAll,
  onCollapseAll,
  selectedTicketId,
  onTicketSelect,
  copiedId,
  onCopyId
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data || data.summary.totalTickets === 0) {
    return (
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
    );
  }

  return (
    <div className={compact ? 'p-4 space-y-4' : 'p-6 space-y-6'}>
      {/* Summary Cards */}
      <div className={compact ? 'grid grid-cols-3 gap-2' : 'grid grid-cols-3 gap-3'}>
        <div className={`bg-gray-50 dark:bg-neutral-800/50 rounded-xl ${compact ? 'p-3' : 'p-4'}`}>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500 dark:text-neutral-400">Tickets</span>
          </div>
          <p className={`font-bold text-gray-900 dark:text-white ${compact ? 'text-xl' : 'text-2xl'}`}>
            {data.summary.totalTickets}
          </p>
        </div>

        <div className={`rounded-xl ${compact ? 'p-3' : 'p-4'} ${getScoreBgColor(data.summary.overallAvg)}`}>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500 dark:text-neutral-400">Avg Score</span>
          </div>
          <p className={`font-bold ${compact ? 'text-xl' : 'text-2xl'} ${getScoreColor(data.summary.overallAvg)}`}>
            {data.summary.overallAvg !== null ? `${data.summary.overallAvg}%` : '-'}
          </p>
        </div>

        <div className={`bg-gray-50 dark:bg-neutral-800/50 rounded-xl ${compact ? 'p-3' : 'p-4'}`}>
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
                onClick={() => onToggleWeek(week.weekNumber)}
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
                              selectedTicketId === ticket._id
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500'
                                : 'hover:bg-gray-50 dark:hover:bg-neutral-800/30'
                            }`}
                            onClick={(e) => onTicketSelect(ticket, e)}
                          >
                            {/* Ticket Header */}
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => onCopyId(ticket.ticketId, e)}
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
                                {!compact && (
                                  <button
                                    onClick={(e) => onTicketSelect(ticket, e)}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                  >
                                    <Eye className="w-3 h-3" />
                                    View
                                  </button>
                                )}
                                <div className={`px-2 py-1 rounded-lg text-xs font-medium ${getScoreBgColor(ticket.score)} ${getScoreColor(ticket.score)}`}>
                                  {ticket.score !== null ? `${ticket.score}%` : '-'}
                                </div>
                              </div>
                            </div>

                            {/* Categories */}
                            {ticket.categories?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {ticket.categories.slice(0, compact ? 3 : 4).map((cat, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 rounded"
                                  >
                                    {cat.length > 25 ? cat.substring(0, 25) + '...' : cat}
                                  </span>
                                ))}
                                {ticket.categories.length > (compact ? 3 : 4) && (
                                  <span className="text-[10px] text-gray-400">
                                    +{ticket.categories.length - (compact ? 3 : 4)}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Feedback Preview */}
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
                            {!compact && (
                              <p className="text-[10px] text-gray-400 dark:text-neutral-600 mt-2">
                                Click to preview full ticket →
                              </p>
                            )}
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
  );
};

/**
 * Inline ticket preview component for ThrowbackPanel (renders inside the panel, not as a portal).
 */
export const TicketPreviewInline = ({
  ticket,
  fullTicketData,
  ticketLoading,
  onClose
}) => {
  if (!ticket) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="flex flex-col h-full"
    >
      {/* Preview Header */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-neutral-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-500" />
            </button>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                Ticket #{ticket.ticketId}
                <span className={`px-1.5 py-0.5 rounded-lg text-xs font-medium ${getScoreBgColor(ticket.score)} ${getScoreColor(ticket.score)}`}>
                  {ticket.score !== null ? `${ticket.score}%` : '-'}
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-neutral-400">
                {new Date(ticket.gradedDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {ticketLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : fullTicketData ? (
          <div className="space-y-4">
            {/* Categories */}
            {fullTicketData.categories?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-3.5 h-3.5 text-gray-400" />
                  <h4 className="text-xs font-medium text-gray-700 dark:text-neutral-300">Categories</h4>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {fullTicketData.categories.map((cat, idx) => (
                    <Badge key={idx} variant="secondary" className="text-[10px]">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="w-3.5 h-3.5 text-gray-400" />
                <h4 className="text-xs font-medium text-gray-700 dark:text-neutral-300">Notes</h4>
              </div>
              <div className="bg-gray-50 dark:bg-neutral-800/50 rounded-xl p-3 border border-gray-200 dark:border-neutral-700">
                {fullTicketData.notes ? (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-neutral-300 text-xs"
                    dangerouslySetInnerHTML={{ __html: fullTicketData.notes }}
                  />
                ) : (
                  <p className="text-xs text-gray-500 dark:text-neutral-500 italic">No notes available</p>
                )}
              </div>
            </div>

            {/* Feedback */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                <h4 className="text-xs font-medium text-gray-700 dark:text-neutral-300">Feedback</h4>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
                {fullTicketData.feedback ? (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-neutral-300 text-xs"
                    dangerouslySetInnerHTML={{ __html: fullTicketData.feedback }}
                  />
                ) : (
                  <p className="text-xs text-gray-500 dark:text-neutral-500 italic">No feedback available</p>
                )}
              </div>
            </div>

            {/* Scorecard */}
            {fullTicketData.scorecardValues && Object.keys(fullTicketData.scorecardValues).length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-3.5 h-3.5 text-gray-400" />
                  <h4 className="text-xs font-medium text-gray-700 dark:text-neutral-300">Scorecard</h4>
                </div>
                <div className="bg-gray-50 dark:bg-neutral-800/50 rounded-xl p-3 border border-gray-200 dark:border-neutral-700">
                  <div className="mb-2 pb-2 border-b border-gray-200 dark:border-neutral-700">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                        {fullTicketData.agent?.position || 'Scorecard'}
                      </span>
                      {fullTicketData.scorecardVariant && (
                        <Badge
                          variant="outline"
                          className={`text-[9px] ${
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
                  <div className="space-y-2">
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
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${getBgClass(value)} ${getTextClass(value)}`}>
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
          <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
            Failed to load ticket details
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AgentHistoryContent;
