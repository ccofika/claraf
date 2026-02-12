import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Loader2, AlertTriangle, TrendingUp, TrendingDown, Minus,
  ChevronRight, BarChart3, FileText, X, ExternalLink,
  CheckCircle2, AlertCircle, User
} from 'lucide-react';
import { toast } from 'sonner';
import { useTL } from './TLLayout';
import { ScorecardAnalysis, TopCategories, ScoreDistribution } from './TLDashboard';
import { Badge } from '../../components/ui/badge';
import { SHORT_LABELS, getScorecardValues } from '../../data/scorecardConfig';
import { TicketContentDisplay } from '../../components/TicketRichTextEditor';

const API_URL = process.env.REACT_APP_API_URL;

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

const getScoreColor = (score) => {
  if (score >= 90) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';
  if (score >= 70) return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
  if (score >= 50) return 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400';
  return 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400';
};

const getScoreTextColor = (score) => {
  if (score == null) return 'text-gray-400 dark:text-[#5B5D67]';
  if (score >= 90) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 70) return 'text-amber-600 dark:text-amber-400';
  if (score >= 50) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
};

const TLAgentDetail = () => {
  const { agentId } = useParams();
  const { period } = useTL();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [fullTicketData, setFullTicketData] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(false);

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
    if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />;
    if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-500 dark:text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400 dark:text-[#5B5D67]" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400 dark:text-[#5B5D67]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-10 h-10 mx-auto text-red-300 dark:text-red-400/30 mb-3" />
        <h2 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] mb-1">Greska</h2>
        <p className="text-sm text-gray-500 dark:text-[#6B6D77]">Agent nije pronadjen</p>
      </div>
    );
  }

  const { agent, summary, scorecardAnalysis, topCategories, severityGroups, scoreDistribution } = data;

  return (
    <div className="space-y-12">
      {/* Agent Info */}
      <section>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-gray-100 dark:bg-[#1E1E28] rounded flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-gray-500 dark:text-[#6B6D77]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900 dark:text-[#E8E9ED] truncate">{agent.name}</h2>
            <p className="text-sm text-gray-500 dark:text-[#6B6D77] truncate">
              {agent.position || 'Agent'}
              <span className="inline-block w-1 h-1 rounded-full bg-gray-300 dark:bg-[#3A3A45] mx-1.5 align-middle" />
              {agent.team}
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-400 dark:text-[#5B5D67] mt-2">
          {summary.totalTickets} tiketa · {summary.ticketsWithIssues} sa problemima
          {summary.avgScore != null && <> · <span className={getScoreTextColor(summary.avgScore)}>Avg: {summary.avgScore}%</span></>}
          {summary.trendValue != null && (
            <> · <span className="inline-flex items-center gap-1">{getTrendIcon(summary.trend)} {summary.trendValue}%</span></>
          )}
        </p>
      </section>

      {/* Main Content */}
      <section>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8 items-start">
          {/* Scorecard Analysis */}
          <ScorecardAnalysis data={scorecardAnalysis} />

          {/* Tickets with Problems */}
          <div className="bg-gray-50 dark:bg-[#111116] rounded-lg p-5 sm:p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400 dark:text-[#6B6D77]" />
              Tiketi sa Problemima
            </h3>

            <div className="space-y-3">
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
                <div className="text-center py-8 text-gray-500 dark:text-[#6B6D77]">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-400/40 dark:text-emerald-400/20" />
                  <p className="text-sm">Nema tiketa sa ocenom ispod 90%</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <TopCategories categories={topCategories} scope="agent" agentId={agentId} />
          <ScoreDistribution data={scoreDistribution} />
        </div>
      </section>

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
              className="absolute inset-0 bg-black/15"
              onClick={() => {
                setSelectedTicket(null);
                setFullTicketData(null);
              }}
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="absolute right-0 top-0 bottom-0 w-full sm:w-[480px] bg-white dark:bg-[#141419] shadow-xl sm:border-l border-gray-200 dark:border-[#1E1E28] flex flex-col"
            >
              <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-gray-200 dark:border-[#1E1E28]">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E8E9ED] truncate">
                    Ticket #{selectedTicket.ticketId}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-[#6B6D77] mt-0.5">
                    {new Date(selectedTicket.gradedDate).toLocaleDateString('sr-RS')}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <a
                    href={`https://app.intercom.com/a/inbox/cx1ywgf2/inbox/conversation/${selectedTicket.ticketId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#1E1E28] rounded"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-500 dark:text-[#6B6D77]" />
                  </a>
                  <button
                    onClick={() => {
                      setSelectedTicket(null);
                      setFullTicketData(null);
                    }}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#1E1E28] rounded"
                  >
                    <X className="w-4 h-4 text-gray-400 dark:text-[#6B6D77]" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                {ticketLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400 dark:text-[#5B5D67]" />
                  </div>
                ) : fullTicketData ? (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-1 text-sm font-bold rounded ${getScoreColor(fullTicketData.qualityScorePercent)}`}>
                        {fullTicketData.qualityScorePercent}%
                      </span>
                      {fullTicketData.categories?.map((cat) => (
                        <Badge key={cat} variant="outline" className="text-xs rounded">
                          {cat}
                        </Badge>
                      ))}
                    </div>

                    {fullTicketData.notes && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-[#6B6D77] mb-1.5">Notes</h4>
                        <div className="bg-gray-50 dark:bg-[#1A1A21] rounded p-3 border border-gray-100 dark:border-[#1E1E28]">
                          <TicketContentDisplay
                            content={fullTicketData.notes}
                            className="text-sm text-gray-700 dark:text-[#A0A2AC]"
                          />
                        </div>
                      </div>
                    )}

                    {fullTicketData.feedback && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-[#6B6D77] mb-1.5">Feedback</h4>
                        <div className="bg-blue-50/50 dark:bg-blue-500/5 rounded p-3 border border-blue-100/50 dark:border-blue-500/10">
                          <TicketContentDisplay
                            content={fullTicketData.feedback}
                            className="text-sm text-gray-700 dark:text-[#A0A2AC]"
                          />
                        </div>
                      </div>
                    )}

                    {fullTicketData.scorecardValues && Object.keys(fullTicketData.scorecardValues).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-[#6B6D77] mb-1.5">Scorecard</h4>
                        <div className="bg-gray-50 dark:bg-[#1A1A21] rounded p-3 border border-gray-100 dark:border-[#1E1E28] space-y-1.5">
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
                                if (idx === null || idx === undefined) return 'bg-gray-100 dark:bg-[#252530]';
                                switch (idx) {
                                  case 0: return 'bg-emerald-500';
                                  case 1: return 'bg-amber-400';
                                  case 2: return 'bg-amber-500';
                                  case 3: return 'bg-red-500';
                                  case 4: return 'bg-gray-400 dark:bg-gray-500';
                                  default: return 'bg-gray-100 dark:bg-[#252530]';
                                }
                              };

                              const getTextClass = (idx) => {
                                if (idx === null || idx === undefined) return 'text-gray-500 dark:text-[#6B6D77]';
                                if (idx === 1) return 'text-gray-900';
                                return 'text-white';
                              };

                              return (
                                <div key={key} className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600 dark:text-[#8B8D97] truncate pr-2">{label}</span>
                                  <span className={`px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 ${getBgClass(value)} ${getTextClass(value)}`}>
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
                  <div className="text-center py-10 text-gray-500 dark:text-[#6B6D77]">
                    <AlertTriangle className="w-6 h-6 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Greska pri ucitavanju tiketa</p>
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
      text: 'text-red-700 dark:text-red-400',
      headerBg: 'hover:bg-red-50/50 dark:hover:bg-red-500/5',
      icon: <AlertCircle className="w-4 h-4" />
    },
    orange: {
      text: 'text-orange-700 dark:text-orange-400',
      headerBg: 'hover:bg-orange-50/50 dark:hover:bg-orange-500/5',
      icon: <AlertTriangle className="w-4 h-4" />
    },
    yellow: {
      text: 'text-amber-700 dark:text-amber-400',
      headerBg: 'hover:bg-amber-50/50 dark:hover:bg-amber-500/5',
      icon: <Minus className="w-4 h-4" />
    }
  };

  const c = colorMap[color];

  return (
    <div>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between py-2.5 ${c.headerBg} transition-colors rounded`}
      >
        <span className={`flex items-center gap-2 text-sm font-medium ${c.text}`}>
          {c.icon}
          {label} - {tickets.length} tiketa
        </span>
        <ChevronRight className={`w-4 h-4 ${c.text} transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
      </button>
      {expanded && (
        <div className="divide-y divide-gray-200/40 dark:divide-[#1E1E28]">
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
    if (score >= 90) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';
    if (score >= 70) return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
    if (score >= 50) return 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400';
    return 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400';
  };

  return (
    <button
      onClick={onClick}
      className="w-full py-3 text-left hover:bg-white/60 dark:hover:bg-[#1A1A21] transition-colors rounded"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="font-mono text-sm text-gray-900 dark:text-[#E8E9ED] font-medium">
              #{ticket.ticketId}
            </span>
            <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getScoreBadgeColor(ticket.score)}`}>
              {ticket.score}%
            </span>
            <span className="text-xs text-gray-400 dark:text-[#5B5D67]">
              {new Date(ticket.gradedDate).toLocaleDateString('sr-RS')}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-[#6B6D77] line-clamp-2">
            {ticket.feedbackPreview || 'Nema feedback-a'}
          </p>
          {ticket.categories?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {ticket.categories.slice(0, 3).map((cat) => (
                <span key={cat} className="px-2 py-0.5 text-[10px] bg-white dark:bg-[#1A1A21] text-gray-500 dark:text-[#6B6D77] rounded">
                  {cat}
                </span>
              ))}
              {ticket.categories.length > 3 && (
                <span className="px-2 py-0.5 text-[10px] text-gray-400 dark:text-[#5B5D67]">
                  +{ticket.categories.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 dark:text-[#3A3A45] flex-shrink-0 mt-0.5" />
      </div>
    </button>
  );
};

export default TLAgentDetail;
