import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Loader2, AlertTriangle, TrendingUp, TrendingDown, Minus,
  ChevronRight, BarChart3, Target, FileText, X, ExternalLink,
  CheckCircle2, AlertCircle, User
} from 'lucide-react';
import { toast } from 'sonner';
import { useTL } from './TLLayout';
import { ScorecardAnalysis, TopCategories, ScoreDistribution } from './TLDashboard';
import { Badge } from '../../components/ui/badge';
import { SCORE_COLORS, SHORT_LABELS, getScorecardValues } from '../../data/scorecardConfig';
import { TicketContentDisplay } from '../../components/TicketRichTextEditor';

const API_URL = process.env.REACT_APP_API_URL;

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

const getScoreColor = (score) => {
  if (score >= 90) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (score >= 70) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  if (score >= 50) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
};

const getScoreTextColor = (score) => {
  if (score == null) return 'text-gray-400';
  if (score >= 90) return 'text-green-600 dark:text-green-400';
  if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
  if (score >= 50) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
};

const TLAgentDetail = () => {
  const { agentId } = useParams();
  const { period } = useTL();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ticket preview
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [fullTicketData, setFullTicketData] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(false);

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState({
    critical: true,
    bad: true,
    moderate: false
  });

  const fetchAgentDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/api/tl/agent/${agentId}?period=${period}`,
        getAuthHeaders()
      );
      setData(response.data);
    } catch (err) {
      console.error('Error fetching agent detail:', err);
      if (err.response?.status === 403) {
        toast.error('Nemas pristup ovom agentu');
        navigate('/tl');
      } else {
        toast.error('Greska pri ucitavanju agenta');
      }
    } finally {
      setLoading(false);
    }
  }, [agentId, period, navigate]);

  useEffect(() => {
    fetchAgentDetail();
  }, [fetchAgentDetail]);

  // Fetch ticket details
  const fetchTicketDetails = useCallback(async (ticketId) => {
    setTicketLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/qa/tickets/${ticketId}`,
        getAuthHeaders()
      );
      setFullTicketData(response.data);
    } catch (err) {
      console.error('Error fetching ticket:', err);
      toast.error('Greska pri ucitavanju tiketa');
    } finally {
      setTicketLoading(false);
    }
  }, []);

  const handleTicketClick = (ticket) => {
    setSelectedTicket(ticket);
    fetchTicketDetails(ticket._id);
  };

  // ESC to close ticket preview
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedTicket) {
        setSelectedTicket(null);
        setFullTicketData(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTicket]);

  const getTrendIcon = (trend) => {
    if (trend === 'improving') return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (trend === 'declining') return <TrendingDown className="w-5 h-5 text-red-500" />;
    return <Minus className="w-5 h-5 text-gray-400" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-16 h-16 mx-auto text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Greska</h2>
        <p className="text-gray-500 dark:text-neutral-400">Agent nije pronadjen</p>
      </div>
    );
  }

  const { agent, summary, scorecardAnalysis, topCategories, severityGroups, scoreDistribution } = data;

  return (
    <div className="space-y-6">
      {/* Agent Info */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{agent.name}</h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            {agent.position || 'Agent'} | {agent.team}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Stats */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-4 sm:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wide">Ukupno tiketa</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{summary.totalTickets}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wide">Sa problemima</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{summary.ticketsWithIssues}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wide">Prosecan score</p>
                <p className={`text-2xl font-bold mt-1 ${getScoreTextColor(summary.avgScore)}`}>
                  {summary.avgScore != null ? `${summary.avgScore}%` : '-'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wide">Trend</p>
                <div className="flex items-center gap-2 mt-1">
                  {getTrendIcon(summary.trend)}
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {summary.trendValue}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Scorecard Analysis */}
          <ScorecardAnalysis data={scorecardAnalysis} />

          {/* Tickets with Problems */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" />
              Tiketi sa Problemima
            </h3>

            <div className="space-y-4">
              {/* Critical */}
              {severityGroups.critical?.length > 0 && (
                <SeveritySection
                  label="Kriticni (<50%)"
                  tickets={severityGroups.critical}
                  color="red"
                  expanded={expandedSections.critical}
                  onToggle={() => setExpandedSections(prev => ({ ...prev, critical: !prev.critical }))}
                  onTicketClick={handleTicketClick}
                />
              )}

              {/* Bad */}
              {severityGroups.bad?.length > 0 && (
                <SeveritySection
                  label="Losi (50-70%)"
                  tickets={severityGroups.bad}
                  color="orange"
                  expanded={expandedSections.bad}
                  onToggle={() => setExpandedSections(prev => ({ ...prev, bad: !prev.bad }))}
                  onTicketClick={handleTicketClick}
                />
              )}

              {/* Moderate */}
              {severityGroups.moderate?.length > 0 && (
                <SeveritySection
                  label="Umereni (70-90%)"
                  tickets={severityGroups.moderate}
                  color="yellow"
                  expanded={expandedSections.moderate}
                  onToggle={() => setExpandedSections(prev => ({ ...prev, moderate: !prev.moderate }))}
                  onTicketClick={handleTicketClick}
                />
              )}

              {summary.ticketsWithIssues === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-neutral-400">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
                  <p>Nema tiketa sa ocenom ispod 90%</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <TopCategories categories={topCategories} />
          <ScoreDistribution data={scoreDistribution} />
        </div>
      </div>

      {/* Ticket Preview Portal */}
      {selectedTicket && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex"
          >
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => {
                setSelectedTicket(null);
                setFullTicketData(null);
              }}
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-full sm:w-[600px] bg-white dark:bg-neutral-900 shadow-2xl sm:border-l border-gray-200 dark:border-neutral-800 flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Ticket #{selectedTicket.ticketId}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-neutral-400">
                    {new Date(selectedTicket.gradedDate).toLocaleDateString('sr-RS')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://app.intercom.com/a/inbox/cx1ywgf2/inbox/conversation/${selectedTicket.ticketId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    title="Open in Intercom"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-500" />
                  </a>
                  <button
                    onClick={() => {
                      setSelectedTicket(null);
                      setFullTicketData(null);
                    }}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {ticketLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  </div>
                ) : fullTicketData ? (
                  <>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`px-3 py-1.5 text-lg font-bold rounded-lg ${getScoreColor(fullTicketData.qualityScorePercent)}`}>
                        {fullTicketData.qualityScorePercent}%
                      </span>
                      {fullTicketData.categories?.map((cat) => (
                        <Badge key={cat} variant="outline" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>

                    {fullTicketData.notes && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          Notes
                        </h4>
                        <div className="bg-gray-50 dark:bg-neutral-800/50 rounded-lg p-4 border border-gray-200 dark:border-neutral-700">
                          <TicketContentDisplay
                            content={fullTicketData.notes}
                            className="text-sm text-gray-700 dark:text-neutral-300"
                          />
                        </div>
                      </div>
                    )}

                    {fullTicketData.feedback && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-400" />
                          Feedback
                        </h4>
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                          <TicketContentDisplay
                            content={fullTicketData.feedback}
                            className="text-sm text-gray-700 dark:text-neutral-300"
                          />
                        </div>
                      </div>
                    )}

                    {fullTicketData.scorecardValues && Object.keys(fullTicketData.scorecardValues).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-gray-400" />
                          Scorecard
                        </h4>
                        <div className="bg-gray-50 dark:bg-neutral-800/50 rounded-lg p-4 border border-gray-200 dark:border-neutral-700 space-y-2">
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
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-neutral-400">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Greska pri ucitavanju tiketa</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

// Severity Section Component
const SeveritySection = ({ label, tickets, color, expanded, onToggle, onTicketClick }) => {
  const colorMap = {
    red: {
      border: 'border-red-200 dark:border-red-800',
      bg: 'bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40',
      text: 'text-red-700 dark:text-red-400',
      icon: <AlertCircle className="w-4 h-4" />,
      divider: 'divide-red-100 dark:divide-red-900/30'
    },
    orange: {
      border: 'border-orange-200 dark:border-orange-800',
      bg: 'bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/40',
      text: 'text-orange-700 dark:text-orange-400',
      icon: <AlertTriangle className="w-4 h-4" />,
      divider: 'divide-orange-100 dark:divide-orange-900/30'
    },
    yellow: {
      border: 'border-yellow-200 dark:border-yellow-800',
      bg: 'bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/40',
      text: 'text-yellow-700 dark:text-yellow-400',
      icon: <Minus className="w-4 h-4" />,
      divider: 'divide-yellow-100 dark:divide-yellow-900/30'
    }
  };

  const c = colorMap[color];

  return (
    <div className={`border ${c.border} rounded-lg overflow-hidden`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-3 ${c.bg} transition-colors`}
      >
        <span className={`flex items-center gap-2 text-sm font-medium ${c.text}`}>
          {c.icon}
          {label} - {tickets.length} tiketa
        </span>
        <ChevronRight className={`w-4 h-4 ${c.text} transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>
      {expanded && (
        <div className={`divide-y ${c.divider}`}>
          {tickets.map((ticket) => (
            <TicketRow key={ticket._id} ticket={ticket} onClick={() => onTicketClick(ticket)} />
          ))}
        </div>
      )}
    </div>
  );
};

// Ticket Row Component
const TicketRow = ({ ticket, onClick }) => {
  const getScoreBadgeColor = (score) => {
    if (score >= 90) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (score >= 70) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (score >= 50) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  };

  return (
    <button
      onClick={onClick}
      className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm text-gray-900 dark:text-white">
              #{ticket.ticketId}
            </span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${getScoreBadgeColor(ticket.score)}`}>
              {ticket.score}%
            </span>
            <span className="text-xs text-gray-400 dark:text-neutral-500">
              {new Date(ticket.gradedDate).toLocaleDateString('sr-RS')}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-neutral-400 line-clamp-2">
            {ticket.feedbackPreview || 'Nema feedback-a'}
          </p>
          {ticket.categories?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {ticket.categories.slice(0, 3).map((cat) => (
                <span key={cat} className="px-1.5 py-0.5 text-[10px] bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-neutral-400 rounded">
                  {cat}
                </span>
              ))}
              {ticket.categories.length > 3 && (
                <span className="px-1.5 py-0.5 text-[10px] text-gray-400 dark:text-neutral-500">
                  +{ticket.categories.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
      </div>
    </button>
  );
};

export default TLAgentDetail;
