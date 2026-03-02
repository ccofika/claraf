import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, History, Calendar, User, Users, FileText, CheckCircle, XCircle,
  MessageSquare, ChevronDown, ChevronUp, Filter, TrendingUp, TrendingDown, Minus,
  Loader2, BarChart2, Target, Activity, ShieldCheck
} from 'lucide-react';
import { useQAManager } from '../../context/QAManagerContext';
import { EmptyState, QualityScoreBadge, Button, Pagination } from './components';

// ─── KPI Cards ───────────────────────────────────────────────
const KPICard = ({ label, value, subtitle, icon: Icon, color = 'purple' }) => {
  const colorMap = {
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    gray: 'bg-gray-50 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400',
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`p-2 rounded-lg ${colorMap[color]}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );
};

const KPISkeleton = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-4 animate-pulse">
        <div className="w-20 h-3 bg-gray-200 dark:bg-neutral-700 rounded mb-2" />
        <div className="w-16 h-7 bg-gray-200 dark:bg-neutral-700 rounded" />
      </div>
    ))}
  </div>
);

const QAReviewHistory = () => {
  const navigate = useNavigate();
  const { isReviewer, agents, graders, fetchReviewHistory, fetchReviewHistoryStats, fetchReviewReviewers } = useQAManager();

  // Data
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 30, total: 0, pages: 0 });
  const [reviewers, setReviewers] = useState([]);
  const [stats, setStats] = useState(null);
  const [expandedTicket, setExpandedTicket] = useState(null);

  // Loading states
  const [initialLoading, setInitialLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters
  const [selectedReviewer, setSelectedReviewer] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedGrader, setSelectedGrader] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const reviewersLoaded = useRef(false);

  // Redirect if not a reviewer
  useEffect(() => {
    if (!isReviewer) {
      navigate('/qa-manager/tickets');
    }
  }, [isReviewer, navigate]);

  // Load reviewers list once
  useEffect(() => {
    if (!isReviewer || reviewersLoaded.current) return;
    reviewersLoaded.current = true;
    fetchReviewReviewers().then(data => {
      if (data) setReviewers(data);
    });
  }, [isReviewer, fetchReviewReviewers]);

  // Build current filter object
  const currentFilters = useCallback(() => ({
    reviewer: selectedReviewer || undefined,
    agent: selectedAgent || undefined,
    grader: selectedGrader || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  }), [selectedReviewer, selectedAgent, selectedGrader, dateFrom, dateTo]);

  // Fetch page data
  const loadPage = useCallback(async (pageNum, isInitial = false) => {
    if (!isReviewer) return;
    if (isInitial) setInitialLoading(true);
    else setPageLoading(true);

    const data = await fetchReviewHistory({ ...currentFilters(), page: pageNum, limit: 30 });
    if (data) {
      setTickets(data.tickets);
      setPagination(data.pagination);
      setExpandedTicket(null);
    }

    setInitialLoading(false);
    setPageLoading(false);
  }, [isReviewer, fetchReviewHistory, currentFilters]);

  // Fetch stats (parallel with page data)
  const loadStats = useCallback(async () => {
    if (!isReviewer) return;
    setStatsLoading(true);
    const data = await fetchReviewHistoryStats(currentFilters());
    if (data) setStats(data);
    setStatsLoading(false);
  }, [isReviewer, fetchReviewHistoryStats, currentFilters]);

  // On filter change: load page 1 + stats in parallel
  useEffect(() => {
    loadPage(1, true);
    loadStats();
  }, [selectedReviewer, selectedAgent, selectedGrader, dateFrom, dateTo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Page change (not initial, no stats reload)
  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
    loadPage(newPage, false);
  }, [loadPage]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [selectedReviewer, selectedAgent, selectedGrader, dateFrom, dateTo]);

  const clearFilters = () => {
    setSelectedReviewer('');
    setSelectedAgent('');
    setSelectedGrader('');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = selectedReviewer || selectedAgent || selectedGrader || dateFrom || dateTo;

  if (!isReviewer) return null;

  // ─── Contextual KPI config ───────────────────────────────────
  const getKPICards = () => {
    if (!stats) return [];

    const approvalPct = stats.approvalRate?.toFixed(1) ?? '0';
    const denialPct = stats.totalTickets > 0
      ? ((stats.deniedCount / stats.totalTickets) * 100).toFixed(1)
      : '0';

    // Reviewer selected: focus on their strictness & workload
    if (selectedReviewer) {
      const reviewerName = reviewers.find(r => r._id === selectedReviewer)?.name || 'Reviewer';
      return [
        { label: 'Tickets Reviewed', value: stats.totalTickets, subtitle: `by ${reviewerName}`, icon: ShieldCheck, color: 'purple' },
        { label: 'Approval Rate', value: `${approvalPct}%`, subtitle: `${stats.approvedCount} approved, ${stats.deniedCount} denied`, icon: CheckCircle, color: 'green' },
        { label: 'Avg Score Adjustment', value: `${stats.avgAbsScoreDiff}%`, subtitle: stats.avgScoreDiff > 0 ? `Tends to increase (+${stats.avgScoreDiff}%)` : stats.avgScoreDiff < 0 ? `Tends to decrease (${stats.avgScoreDiff}%)` : 'No net change', icon: Activity, color: stats.avgAbsScoreDiff > 5 ? 'red' : 'blue' },
        { label: 'Avg Final Score', value: `${stats.avgFinalScore}%`, subtitle: `from ${stats.avgOriginalScore}% original`, icon: Target, color: 'blue' },
      ];
    }

    // Grader selected: focus on their quality & how much gets changed
    if (selectedGrader) {
      const graderName = graders.find(g => g._id === selectedGrader)?.name || 'Grader';
      return [
        { label: 'Tickets in Review', value: stats.totalTickets, subtitle: `from ${graderName}`, icon: FileText, color: 'purple' },
        { label: 'Approval Rate', value: `${approvalPct}%`, subtitle: `${stats.deniedCount} denied back`, icon: CheckCircle, color: parseFloat(approvalPct) >= 80 ? 'green' : parseFloat(approvalPct) >= 50 ? 'amber' : 'red' },
        { label: 'Avg Submitted Score', value: `${stats.avgOriginalScore}%`, subtitle: 'Score when entering review', icon: BarChart2, color: 'blue' },
        { label: 'Avg Reviewer Change', value: `${stats.avgAbsScoreDiff}%`, subtitle: stats.avgAbsScoreDiff <= 2 ? 'Minimal corrections needed' : stats.avgAbsScoreDiff <= 5 ? 'Moderate corrections' : 'Significant corrections', icon: Activity, color: stats.avgAbsScoreDiff > 5 ? 'red' : stats.avgAbsScoreDiff > 2 ? 'amber' : 'green' },
      ];
    }

    // Agent selected: focus on agent's ticket quality through review
    if (selectedAgent) {
      const agentName = agents.find(a => a._id === selectedAgent)?.name || 'Agent';
      return [
        { label: 'Total Reviews', value: stats.totalTickets, subtitle: `for ${agentName}`, icon: FileText, color: 'purple' },
        { label: 'Approval Rate', value: `${approvalPct}%`, subtitle: `${stats.approvedCount} approved`, icon: CheckCircle, color: parseFloat(approvalPct) >= 80 ? 'green' : 'amber' },
        { label: 'Avg Score', value: `${stats.avgFinalScore}%`, subtitle: `from ${stats.avgOriginalScore}% submitted`, icon: Target, color: 'blue' },
        { label: 'Score Change', value: `${stats.avgAbsScoreDiff}%`, subtitle: `${stats.uniqueGraderCount} grader${stats.uniqueGraderCount !== 1 ? 's' : ''}, ${stats.uniqueReviewerCount} reviewer${stats.uniqueReviewerCount !== 1 ? 's' : ''}`, icon: Activity, color: stats.avgAbsScoreDiff > 5 ? 'red' : 'blue' },
      ];
    }

    // No filter: overview
    return [
      { label: 'Total Reviewed', value: stats.totalTickets, subtitle: `${stats.uniqueAgentCount} agents, ${stats.uniqueGraderCount} graders`, icon: FileText, color: 'purple' },
      { label: 'Approval Rate', value: `${approvalPct}%`, subtitle: `${stats.approvedCount} approved, ${stats.deniedCount} denied`, icon: CheckCircle, color: parseFloat(approvalPct) >= 80 ? 'green' : 'amber' },
      { label: 'Avg Score Change', value: `${stats.avgAbsScoreDiff}%`, subtitle: stats.avgScoreDiff > 0 ? `Net: +${stats.avgScoreDiff}%` : stats.avgScoreDiff < 0 ? `Net: ${stats.avgScoreDiff}%` : 'No net change', icon: Activity, color: stats.avgAbsScoreDiff > 5 ? 'red' : 'blue' },
      { label: 'Denial Rate', value: `${denialPct}%`, subtitle: `${stats.deniedCount} ticket${stats.deniedCount !== 1 ? 's' : ''} sent back`, icon: XCircle, color: parseFloat(denialPct) > 30 ? 'red' : parseFloat(denialPct) > 15 ? 'amber' : 'gray' },
    ];
  };

  // ─── Helpers ─────────────────────────────────────────────────
  const getActionBadge = (action) => {
    if (action === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle className="w-3 h-3" />
          Approved
        </span>
      );
    }
    if (action === 'denied') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          <XCircle className="w-3 h-3" />
          Denied
        </span>
      );
    }
    if (action === 'sent_to_review') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          Sent to Review
        </span>
      );
    }
    return null;
  };

  const getScoreDiffDisplay = (diff) => {
    if (diff == null) return { text: '-', color: 'text-gray-400', Icon: Minus };
    if (diff === 0) return { text: '0%', color: 'text-gray-500 dark:text-neutral-400', Icon: Minus };
    if (diff > 0) return { text: `+${diff.toFixed(1)}%`, color: 'text-green-600 dark:text-green-400', Icon: TrendingUp };
    return { text: `${diff.toFixed(1)}%`, color: 'text-red-600 dark:text-red-400', Icon: TrendingDown };
  };

  const InitialSkeleton = () => (
    <div className="space-y-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-20 h-4 bg-gray-200 dark:bg-neutral-700 rounded" />
            <div className="w-24 h-4 bg-gray-200 dark:bg-neutral-700 rounded" />
            <div className="w-20 h-4 bg-gray-200 dark:bg-neutral-700 rounded" />
            <div className="w-16 h-4 bg-gray-200 dark:bg-neutral-700 rounded" />
            <div className="flex-1" />
            <div className="w-12 h-4 bg-gray-200 dark:bg-neutral-700 rounded" />
          </div>
        </div>
      ))}
    </div>
  );

  const kpiCards = getKPICards();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/qa-manager/review')}
            className="flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Back to Review</span>
          </Button>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Review History</h2>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5 hidden sm:block">
              Chronological log of all tickets that passed through review
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">Filters</span>
          {hasActiveFilters && (
            <span className="text-xs text-purple-600 dark:text-purple-400">
              ({[selectedReviewer, selectedAgent, selectedGrader, dateFrom, dateTo].filter(Boolean).length} active)
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400 hidden xs:block" />
            <select
              value={selectedReviewer}
              onChange={(e) => setSelectedReviewer(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-1.5 text-sm bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Reviewers</option>
              {reviewers.map((r) => (
                <option key={r._id} value={r._id}>{r.name || r.email}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400 hidden xs:block" />
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-1.5 text-sm bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Agents</option>
              {agents.map((a) => (
                <option key={a._id} value={a._id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400 hidden xs:block" />
            <select
              value={selectedGrader}
              onChange={(e) => setSelectedGrader(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-1.5 text-sm bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Graders</option>
              {graders.map((g) => (
                <option key={g._id} value={g._id}>{g.name || g.email}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400 hidden xs:block" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <span className="text-gray-400 text-center hidden xs:block">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full sm:w-auto">
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      {statsLoading ? (
        <KPISkeleton />
      ) : stats && stats.totalTickets > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpiCards.map((card, i) => (
            <KPICard key={i} {...card} />
          ))}
        </div>
      ) : null}

      {/* Content */}
      {initialLoading ? (
        <InitialSkeleton />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={History}
          title="No review history"
          description="No tickets have been reviewed yet, or no tickets match your filters."
        />
      ) : (
        <div className="space-y-4 relative">
          {pageLoading && (
            <div className="absolute inset-0 bg-white/60 dark:bg-neutral-900/60 z-10 flex items-start justify-center pt-20 rounded-lg backdrop-blur-[1px]">
              <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 rounded-full shadow-lg border border-gray-200 dark:border-neutral-700">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                <span className="text-sm text-gray-600 dark:text-neutral-300">Loading page {page}...</span>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-500 dark:text-neutral-400">
            {pagination.total} reviewed ticket{pagination.total !== 1 ? 's' : ''}
            {pagination.pages > 1 && ` — page ${pagination.page} of ${pagination.pages}`}
          </p>

          {/* Mobile Cards */}
          <div className="block md:hidden space-y-3">
            {tickets.map((ticket) => {
              const lastAction = [...(ticket.reviewHistory || [])].reverse().find(
                h => h.action === 'approved' || h.action === 'denied'
              );
              const isExpanded = expandedTicket === ticket._id;
              const diff = getScoreDiffDisplay(ticket.scoreDiff);
              const DiffIcon = diff.Icon;

              return (
                <div
                  key={ticket._id}
                  className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 overflow-hidden"
                >
                  <div
                    className="p-3 cursor-pointer"
                    onClick={() => setExpandedTicket(isExpanded ? null : ticket._id)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{ticket.ticketId}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {lastAction && getActionBadge(lastAction.action)}
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>
                    <div className="space-y-1 text-xs text-gray-500 dark:text-neutral-400">
                      <p><span className="text-gray-400">Agent:</span> {ticket.agent?.name || 'Unknown'}</p>
                      <p><span className="text-gray-400">Grader:</span> {ticket.grader?.name || ticket.grader?.email || 'Unknown'}</p>
                      <p><span className="text-gray-400">Reviewer:</span> {lastAction?.reviewedBy?.name || lastAction?.reviewedBy?.email || 'Unknown'}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-gray-400">{ticket.originalReviewScore != null ? `${ticket.originalReviewScore}%` : '-'}</span>
                        <span className="text-gray-400">→</span>
                        <QualityScoreBadge score={ticket.qualityScorePercent} />
                        <span className={`flex items-center gap-0.5 font-medium ${diff.color}`}>
                          <DiffIcon className="w-3 h-3" />{diff.text}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-neutral-800 p-3 bg-gray-50 dark:bg-neutral-950">
                      <p className="text-xs font-medium text-gray-700 dark:text-neutral-300 mb-2">Review Timeline</p>
                      <div className="space-y-2">
                        {[...(ticket.reviewHistory || [])].reverse().map((entry, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <div className="mt-0.5">{getActionBadge(entry.action)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-700 dark:text-neutral-300">
                                <span className="font-medium">{entry.reviewedBy?.name || entry.reviewedBy?.email || 'System'}</span>
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {new Date(entry.date).toLocaleString()} — Score: {entry.scoreAtAction ?? '-'}%
                              </p>
                              {entry.note && (
                                <div className="mt-1 flex items-start gap-1 text-xs text-amber-600 dark:text-amber-400">
                                  <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" /><span>{entry.note}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {ticket.additionalNote && (
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-neutral-800">
                          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1">
                            <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span><strong>Reviewer Note:</strong> {ticket.additionalNote}</span>
                          </p>
                        </div>
                      )}
                      {ticket.notes && (
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-neutral-800">
                          <p className="text-xs text-gray-600 dark:text-neutral-400"><strong>Ticket Notes:</strong> {ticket.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Ticket</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Agent</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Grader</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Reviewer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Original</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Final</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Diff</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Notes</th>
                  <th className="px-4 py-3 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                {tickets.map((ticket) => {
                  const lastAction = [...(ticket.reviewHistory || [])].reverse().find(
                    h => h.action === 'approved' || h.action === 'denied'
                  );
                  const isExpanded = expandedTicket === ticket._id;
                  const diff = getScoreDiffDisplay(ticket.scoreDiff);
                  const DiffIcon = diff.Icon;

                  return (
                    <React.Fragment key={ticket._id}>
                      <tr
                        className="hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                        onClick={() => setExpandedTicket(isExpanded ? null : ticket._id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{ticket.ticketId}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{ticket.agent?.name || 'Unknown'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-neutral-400">{ticket.grader?.name || ticket.grader?.email || 'Unknown'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-neutral-400">{lastAction?.reviewedBy?.name || lastAction?.reviewedBy?.email || 'Unknown'}</td>
                        <td className="px-4 py-3">{lastAction && getActionBadge(lastAction.action)}</td>
                        <td className="px-4 py-3">
                          {ticket.originalReviewScore != null
                            ? <QualityScoreBadge score={ticket.originalReviewScore} />
                            : <span className="text-xs text-gray-400">-</span>
                          }
                        </td>
                        <td className="px-4 py-3"><QualityScoreBadge score={ticket.qualityScorePercent} /></td>
                        <td className="px-4 py-3">
                          <div className={`flex items-center gap-1 text-sm font-medium ${diff.color}`}>
                            <DiffIcon className="w-3.5 h-3.5" /><span>{diff.text}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-neutral-400">
                          {lastAction?.date
                            ? new Date(lastAction.date).toLocaleDateString()
                            : ticket.firstReviewDate
                              ? new Date(ticket.firstReviewDate).toLocaleDateString()
                              : '-'}
                        </td>
                        <td className="px-4 py-3">
                          {(ticket.additionalNote || lastAction?.note) ? (
                            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                              <MessageSquare className="w-3.5 h-3.5" /><span className="text-xs">Has notes</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={11} className="px-0 py-0">
                            <div className="bg-gray-50 dark:bg-neutral-950 px-6 py-4 border-t border-gray-100 dark:border-neutral-800">
                              <p className="text-xs font-semibold text-gray-700 dark:text-neutral-300 mb-3 uppercase tracking-wider">Review Timeline</p>
                              <div className="relative pl-4">
                                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200 dark:bg-neutral-700" />
                                <div className="space-y-4">
                                  {[...(ticket.reviewHistory || [])].reverse().map((entry, idx) => (
                                    <div key={idx} className="relative flex items-start gap-3">
                                      <div className={`absolute -left-4 mt-1.5 w-2.5 h-2.5 rounded-full border-2 ${
                                        entry.action === 'approved'
                                          ? 'bg-green-500 border-green-300 dark:border-green-700'
                                          : entry.action === 'denied'
                                            ? 'bg-red-500 border-red-300 dark:border-red-700'
                                            : 'bg-blue-500 border-blue-300 dark:border-blue-700'
                                      }`} />
                                      <div className="flex-1 min-w-0 ml-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          {getActionBadge(entry.action)}
                                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {entry.reviewedBy?.name || entry.reviewedBy?.email || 'System'}
                                          </span>
                                          <span className="text-xs text-gray-400">{new Date(entry.date).toLocaleString()}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">Score at action: {entry.scoreAtAction ?? '-'}%</p>
                                        {entry.note && (
                                          <div className="mt-1.5 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                                            <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1">
                                              <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" /><span>{entry.note}</span>
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {(ticket.additionalNote || ticket.notes) && (
                                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-neutral-800 space-y-2">
                                  {ticket.additionalNote && (
                                    <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                                      <p className="text-xs text-amber-700 dark:text-amber-400"><strong>Reviewer Note:</strong> {ticket.additionalNote}</p>
                                    </div>
                                  )}
                                  {ticket.notes && (
                                    <div className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-md">
                                      <p className="text-xs text-gray-600 dark:text-neutral-400"><strong>Ticket Notes:</strong> {ticket.notes}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default QAReviewHistory;
