import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import {
  Play, Loader2, CheckCircle, XCircle, Clock, Eye, RefreshCw,
  ChevronRight, ChevronDown, AlertTriangle, Zap, DollarSign,
  FileText, Brain, Shield, Tag, MessageSquare, BarChart3,
  ArrowLeft, Trash2, RotateCcw, Filter, Info
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Badge } from './ui/badge';

const API_URL = process.env.REACT_APP_API_URL;

// Finding type badge - defined outside component for reuse
const TypeBadge = ({ type }) => {
  const config = {
    violation: { color: 'bg-red-500', label: 'Violation' },
    potential_violation: { color: 'bg-yellow-500', label: 'Potential' },
    improvement: { color: 'bg-blue-500', label: 'Improvement' },
    positive: { color: 'bg-green-500', label: 'Positive' },
    note: { color: 'bg-gray-500', label: 'Note' }
  };

  const cfg = config[type] || config.note;
  return (
    <span className={`px-1.5 py-0.5 text-xs font-medium rounded text-white ${cfg.color}`}>
      {cfg.label}
    </span>
  );
};

// Finding severity badge - defined outside component for reuse
const SeverityBadge = ({ severity }) => {
  const config = {
    critical: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
    high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    low: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
  };

  return (
    <span className={`px-1.5 py-0.5 text-xs font-medium rounded border ${config[severity] || config.medium}`}>
      {severity}
    </span>
  );
};

const QAEvaluationSessions = ({ sessions = [] }) => {
  // State
  const [evaluationStatus, setEvaluationStatus] = useState({});
  const [selectedSession, setSelectedSession] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [evaluationProgress, setEvaluationProgress] = useState({});
  const [costSummary, setCostSummary] = useState(null);
  const [showCostDialog, setShowCostDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // Socket ref
  const socketRef = useRef(null);

  // Auth headers
  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  // Fetch evaluation status for all sessions
  const fetchAllStatuses = useCallback(async () => {
    const completedSessions = sessions.filter(s => s.status === 'completed');

    for (const session of completedSessions) {
      try {
        const response = await axios.get(
          `${API_URL}/api/qa/scrape/sessions/${session._id}/evaluation-status`,
          getAuthHeaders()
        );
        setEvaluationStatus(prev => ({
          ...prev,
          [session._id]: response.data
        }));
      } catch (error) {
        console.error(`Error fetching status for ${session._id}:`, error);
      }
    }
  }, [sessions]);

  // Fetch cost summary
  const fetchCostSummary = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/qa/scrape/evaluations/cost-summary?days=30`,
        getAuthHeaders()
      );
      setCostSummary(response.data);
    } catch (error) {
      console.error('Error fetching cost summary:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAllStatuses();
    fetchCostSummary();
  }, [fetchAllStatuses, fetchCostSummary]);

  // Socket.io for real-time evaluation progress
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    socketRef.current = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected for evaluation progress');
    });

    // Listen for evaluation events
    sessions.forEach(session => {
      socketRef.current.on(`evaluation:${session._id}:started`, (data) => {
        setEvaluationProgress(prev => ({
          ...prev,
          [session._id]: { ...data, status: 'running' }
        }));
        toast.info(`Evaluation started for ${session.agent?.name || 'session'}`);
      });

      socketRef.current.on(`evaluation:${session._id}:progress`, (data) => {
        setEvaluationProgress(prev => ({
          ...prev,
          [session._id]: { ...data, status: 'running' }
        }));
      });

      socketRef.current.on(`evaluation:${session._id}:completed`, (data) => {
        setEvaluationProgress(prev => ({
          ...prev,
          [session._id]: { ...data, status: 'completed' }
        }));
        toast.success(`Evaluation completed! ${data.fail} issues found.`);
        fetchAllStatuses();
        fetchCostSummary();
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [sessions, fetchAllStatuses, fetchCostSummary]);

  // Start evaluation for a session
  const handleStartEvaluation = async (sessionId) => {
    try {
      await axios.post(
        `${API_URL}/api/qa/scrape/sessions/${sessionId}/evaluate`,
        {},
        getAuthHeaders()
      );
      // Progress will be tracked via WebSocket
    } catch (error) {
      console.error('Error starting evaluation:', error);
      toast.error(error.response?.data?.message || 'Failed to start evaluation');
    }
  };

  // Delete evaluations for a session
  const handleDeleteEvaluations = async (sessionId) => {
    if (!window.confirm('Delete all evaluations for this session? You can re-run evaluation after.')) {
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/api/qa/scrape/sessions/${sessionId}/evaluations`,
        getAuthHeaders()
      );
      toast.success('Evaluations deleted');
      fetchAllStatuses();
      setSelectedSession(null);
      setEvaluations([]);
    } catch (error) {
      console.error('Error deleting evaluations:', error);
      toast.error('Failed to delete evaluations');
    }
  };

  // Fetch evaluations for a session
  const fetchEvaluations = async (sessionId, filter = 'all') => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const response = await axios.get(
        `${API_URL}/api/qa/scrape/sessions/${sessionId}/evaluations${params}`,
        getAuthHeaders()
      );
      setEvaluations(response.data.evaluations || []);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      toast.error('Failed to load evaluations');
    } finally {
      setLoading(false);
    }
  };

  // View session evaluations
  const handleViewSession = (session) => {
    setSelectedSession(session);
    setStatusFilter('all');
    fetchEvaluations(session._id);
  };

  // Re-evaluate single ticket
  const handleReEvaluate = async (evaluationId) => {
    try {
      await axios.post(
        `${API_URL}/api/qa/scrape/evaluations/${evaluationId}/re-evaluate`,
        {},
        getAuthHeaders()
      );
      toast.success('Re-evaluation completed');
      if (selectedSession) {
        fetchEvaluations(selectedSession._id, statusFilter);
      }
    } catch (error) {
      console.error('Error re-evaluating:', error);
      toast.error('Failed to re-evaluate');
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    if (typeof value === 'string') return value;
    return `$${value.toFixed(4)}`;
  };

  // Format number with commas
  const formatNumber = (num) => {
    return num?.toLocaleString() || '0';
  };

  // Status badge component
  const EvalStatusBadge = ({ status, stats }) => {
    if (!stats || stats.status === 'not_started') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
          <Clock className="w-3 h-3" />
          Not Evaluated
        </span>
      );
    }

    if (stats.status === 'in_progress' || evaluationProgress[stats.sessionId]?.status === 'running') {
      const progress = evaluationProgress[stats.sessionId];
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
          <Loader2 className="w-3 h-3 animate-spin" />
          Evaluating {progress?.percent || 0}%
        </span>
      );
    }

    const evalStats = stats.evaluation || stats;
    const results = stats.results || {};

    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
          <CheckCircle className="w-3 h-3" />
          Evaluated
        </span>
        {results.fail > 0 && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
            {results.fail} fail
          </span>
        )}
        {results.needs_review > 0 && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
            {results.needs_review} review
          </span>
        )}
      </div>
    );
  };

  // If viewing a specific session's evaluations
  if (selectedSession) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setSelectedSession(null);
                setEvaluations([]);
                setSelectedEvaluation(null);
              }}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedSession.agent?.name} - Evaluations
              </h2>
              <p className="text-sm text-gray-500 dark:text-neutral-400">
                {evaluations.length} tickets evaluated
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                fetchEvaluations(selectedSession._id, e.target.value);
              }}
              className="px-3 py-1.5 text-sm border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
              <option value="needs_review">Needs Review</option>
            </select>
            <button
              onClick={() => fetchEvaluations(selectedSession._id, statusFilter)}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteEvaluations(selectedSession._id)}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              title="Delete all evaluations"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cost summary for this session */}
        {evaluationStatus[selectedSession._id]?.cost && (
          <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-gray-500 dark:text-neutral-400">Tokens:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatNumber(evaluationStatus[selectedSession._id]?.token_usage?.total_tokens)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="text-gray-500 dark:text-neutral-400">Cost:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {evaluationStatus[selectedSession._id]?.cost?.total}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <span className="text-gray-500 dark:text-neutral-400">Avg/ticket:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatNumber(evaluationStatus[selectedSession._id]?.token_usage?.avg_tokens_per_ticket)} tokens
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}

        {/* Evaluations list */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Evaluations list */}
            <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
              <div className="p-3 border-b border-gray-200 dark:border-neutral-800">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Evaluated Tickets ({evaluations.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-neutral-800 max-h-[600px] overflow-y-auto">
                {evaluations.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-neutral-400">
                    No evaluations found
                  </div>
                ) : (
                  evaluations.map((evaluation) => (
                    <button
                      key={evaluation._id}
                      onClick={() => setSelectedEvaluation(evaluation)}
                      className={`
                        w-full p-3 text-left transition-colors
                        ${selectedEvaluation?._id === evaluation._id
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-neutral-800'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-sm text-gray-900 dark:text-white">
                          #{evaluation.ticket_id}
                        </span>
                        <span className={`
                          px-2 py-0.5 text-xs font-medium rounded
                          ${evaluation.overall_status === 'pass'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : evaluation.overall_status === 'fail'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                          }
                        `}>
                          {evaluation.overall_status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-neutral-400">
                        <span>{evaluation.agent_name}</span>
                        <span>|</span>
                        <span>{evaluation.findings_summary?.total || 0} findings</span>
                        {evaluation.findings_summary?.violations > 0 && (
                          <span className="text-red-500">
                            ({evaluation.findings_summary.violations} violations)
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Right: Evaluation detail */}
            <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
              {selectedEvaluation ? (
                <EvaluationDetail
                  evaluation={selectedEvaluation}
                  onReEvaluate={() => handleReEvaluate(selectedEvaluation._id)}
                />
              ) : (
                <div className="flex items-center justify-center h-full min-h-[400px] text-gray-500 dark:text-neutral-400">
                  <div className="text-center">
                    <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Select an evaluation to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Sessions list view
  const completedSessions = sessions.filter(s => s.status === 'completed');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Evaluation Sessions</h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            {completedSessions.length} session{completedSessions.length !== 1 ? 's' : ''} ready for evaluation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAllStatuses}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCostDialog(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <DollarSign className="w-4 h-4" />
            Cost Summary
          </button>
        </div>
      </div>

      {/* Empty state */}
      {completedSessions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
            <Brain className="w-8 h-8 text-gray-400 dark:text-neutral-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Sessions Ready
          </h3>
          <p className="text-sm text-gray-500 dark:text-neutral-400 text-center max-w-md">
            Complete an import session first. Once scraping is done, you can run AI evaluation on the tickets.
          </p>
        </div>
      )}

      {/* Sessions list */}
      {completedSessions.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-neutral-800">
            {completedSessions.map((session) => {
              const status = evaluationStatus[session._id];
              const progress = evaluationProgress[session._id];
              const isEvaluating = progress?.status === 'running';
              const hasEvaluations = status?.evaluation?.evaluated > 0;

              return (
                <motion.div
                  key={session._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                        <Brain className="w-5 h-5 text-gray-500 dark:text-neutral-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {session.agent?.name || 'Unknown Agent'}
                          </span>
                          <EvalStatusBadge status={status?.evaluation?.status} stats={status} />
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-neutral-400">
                          <span>{session.scrapedCount || session.totalConversations} tickets</span>
                          <span className="text-gray-300 dark:text-neutral-600">|</span>
                          <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                          {status?.cost?.total && (
                            <>
                              <span className="text-gray-300 dark:text-neutral-600">|</span>
                              <span className="text-green-600 dark:text-green-400">
                                {status.cost.total}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Progress bar when evaluating */}
                        {isEvaluating && (
                          <div className="mt-2 w-64">
                            <div className="h-1.5 bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 transition-all duration-300"
                                style={{ width: `${progress?.percent || 0}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                              {progress?.completed || 0}/{progress?.total || 0} tickets
                              {progress?.fail > 0 && (
                                <span className="text-red-500 ml-2">
                                  ({progress.fail} issues found)
                                </span>
                              )}
                            </p>
                          </div>
                        )}

                        {/* Stats when evaluated */}
                        {hasEvaluations && !isEvaluating && status?.results && (
                          <div className="flex items-center gap-3 mt-1 text-xs">
                            <span className="text-green-600 dark:text-green-400">
                              {status.results.pass} pass
                            </span>
                            <span className="text-red-500">
                              {status.results.fail} fail
                            </span>
                            <span className="text-yellow-600 dark:text-yellow-400">
                              {status.results.needs_review} review
                            </span>
                            <span className="text-gray-400">
                              | {status.results.total_violations} violations
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {!hasEvaluations && !isEvaluating && (
                        <button
                          onClick={() => handleStartEvaluation(session._id)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                        >
                          <Play className="w-4 h-4" />
                          Run Evaluation
                        </button>
                      )}
                      {hasEvaluations && !isEvaluating && (
                        <>
                          <button
                            onClick={() => handleViewSession(session)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View Results
                          </button>
                          <button
                            onClick={() => handleDeleteEvaluations(session._id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete & Re-run"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cost Summary Dialog */}
      <Dialog open={showCostDialog} onOpenChange={setShowCostDialog}>
        <DialogContent className="bg-white dark:bg-neutral-900 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              AI Cost Summary (Last 30 Days)
            </DialogTitle>
          </DialogHeader>

          {costSummary && (
            <div className="space-y-4 py-4">
              {/* Totals */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
                  <p className="text-sm text-gray-500 dark:text-neutral-400">Total Evaluations</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(costSummary.totals?.evaluations)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
                  <p className="text-sm text-gray-500 dark:text-neutral-400">Total Cost</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {costSummary.totals?.cost}
                  </p>
                </div>
              </div>

              {/* Token breakdown */}
              <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Token Usage</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-neutral-400">Input tokens</span>
                    <span className="text-gray-900 dark:text-white">{formatNumber(costSummary.totals?.prompt_tokens)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-neutral-400">Output tokens</span>
                    <span className="text-gray-900 dark:text-white">{formatNumber(costSummary.totals?.completion_tokens)}</span>
                  </div>
                  <div className="flex justify-between font-medium pt-2 border-t border-gray-200 dark:border-neutral-700">
                    <span className="text-gray-900 dark:text-white">Total tokens</span>
                    <span className="text-gray-900 dark:text-white">{formatNumber(costSummary.totals?.total_tokens)}</span>
                  </div>
                </div>
              </div>

              {/* Averages */}
              <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Averages per Evaluation</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-neutral-400">Tokens</span>
                    <span className="text-gray-900 dark:text-white">{formatNumber(costSummary.averages?.tokens_per_evaluation)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-neutral-400">Cost</span>
                    <span className="text-gray-900 dark:text-white">{costSummary.averages?.cost_per_evaluation}</span>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="text-xs text-gray-500 dark:text-neutral-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">Pricing (gpt-5-nano)</p>
                <p>Input: {costSummary.pricing?.input_per_1m_tokens}/1M tokens</p>
                <p>Cached: {costSummary.pricing?.cached_input_per_1m_tokens}/1M tokens</p>
                <p>Output: {costSummary.pricing?.output_per_1m_tokens}/1M tokens</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Evaluation Detail Component
const EvaluationDetail = ({ evaluation, onReEvaluate }) => {
  const [expandedSections, setExpandedSections] = useState({
    findings: true,
    rules: false,
    debug: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              Ticket #{evaluation.ticket_id}
            </h3>
            <p className="text-xs text-gray-500 dark:text-neutral-400">
              {evaluation.category} {evaluation.subcategory && `> ${evaluation.subcategory}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`
              px-2 py-1 text-xs font-medium rounded
              ${evaluation.overall_status === 'pass'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : evaluation.overall_status === 'fail'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
              }
            `}>
              {evaluation.overall_status.toUpperCase()}
            </span>
            <button
              onClick={onReEvaluate}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded"
              title="Re-evaluate"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-2">
            <p className="text-xs text-gray-500 dark:text-neutral-400">Confidence</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {Math.round((evaluation.confidence || 0) * 100)}%
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-2">
            <p className="text-xs text-gray-500 dark:text-neutral-400">Findings</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {evaluation.findings_summary?.total || 0}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-2">
            <p className="text-xs text-gray-500 dark:text-neutral-400">Violations</p>
            <p className="text-lg font-bold text-red-600 dark:text-red-400">
              {evaluation.findings_summary?.violations || 0}
            </p>
          </div>
        </div>

        {/* Findings Section */}
        <div className="border border-gray-200 dark:border-neutral-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('findings')}
            className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800 text-left"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              Findings ({evaluation.findings?.length || 0})
            </span>
            {expandedSections.findings ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <AnimatePresence>
            {expandedSections.findings && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 space-y-3">
                  {evaluation.findings?.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-neutral-400 text-center py-2">
                      No findings
                    </p>
                  ) : (
                    evaluation.findings?.map((finding, i) => (
                      <div key={i} className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <TypeBadge type={finding.type} />
                          <SeverityBadge severity={finding.severity} />
                          <span className="text-xs text-gray-500 dark:text-neutral-400 font-mono">
                            {finding.rule_id}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {finding.rule_title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-neutral-300">
                          {finding.explanation}
                        </p>
                        {finding.rule_text_excerpt && (
                          <div className="text-xs bg-white dark:bg-neutral-900 rounded p-2 border border-gray-200 dark:border-neutral-700">
                            <p className="text-gray-500 dark:text-neutral-400 mb-1">Rule text:</p>
                            <p className="text-gray-700 dark:text-neutral-300">{finding.rule_text_excerpt}</p>
                          </div>
                        )}
                        {finding.ticket_evidence?.length > 0 && (
                          <div className="text-xs bg-blue-50 dark:bg-blue-900/20 rounded p-2">
                            <p className="text-blue-600 dark:text-blue-400 mb-1">Evidence from ticket:</p>
                            {finding.ticket_evidence.map((ev, j) => (
                              <p key={j} className="text-blue-800 dark:text-blue-300">
                                [{ev.speaker}]: "{ev.excerpt}"
                              </p>
                            ))}
                          </div>
                        )}
                        {finding.recommended_fix && (
                          <div className="text-xs bg-green-50 dark:bg-green-900/20 rounded p-2">
                            <p className="text-green-600 dark:text-green-400 mb-1">Recommended fix:</p>
                            <p className="text-green-800 dark:text-green-300">{finding.recommended_fix}</p>
                          </div>
                        )}
                        {finding.verification_needed && (
                          <div className="text-xs bg-yellow-50 dark:bg-yellow-900/20 rounded p-2">
                            <p className="text-yellow-600 dark:text-yellow-400 mb-1">Verification needed:</p>
                            <p className="text-yellow-800 dark:text-yellow-300">{finding.what_to_verify}</p>
                            {finding.why_uncertain && (
                              <p className="text-yellow-700 dark:text-yellow-400 mt-1 italic">
                                Why uncertain: {finding.why_uncertain}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Retrieved Rules Section */}
        <div className="border border-gray-200 dark:border-neutral-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('rules')}
            className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800 text-left"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
              <FileText className="w-4 h-4 text-blue-500" />
              Retrieved Rules ({evaluation.debug?.retrieved_rules?.length || 0})
            </span>
            {expandedSections.rules ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <AnimatePresence>
            {expandedSections.rules && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 space-y-2">
                  {evaluation.debug?.retrieved_rules?.map((rule, i) => (
                    <div key={i} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-neutral-800 rounded p-2">
                      <div>
                        <span className="font-mono text-xs text-gray-500 dark:text-neutral-400">
                          {rule.rule_id}
                        </span>
                        <p className="text-gray-900 dark:text-white">{rule.title}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {rule.source}
                        </Badge>
                        {rule.similarity && (
                          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                            {Math.round(rule.similarity * 100)}% match
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Debug Section */}
        <div className="border border-gray-200 dark:border-neutral-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('debug')}
            className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800 text-left"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
              <Info className="w-4 h-4 text-purple-500" />
              Technical Details
            </span>
            {expandedSections.debug ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <AnimatePresence>
            {expandedSections.debug && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 space-y-3 text-xs">
                  {/* Token Usage */}
                  <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-3">
                    <p className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Zap className="w-3 h-3 text-yellow-500" />
                      Token Usage
                    </p>
                    <div className="space-y-1 text-gray-600 dark:text-neutral-300">
                      <div className="flex justify-between">
                        <span>Input tokens:</span>
                        <span>{evaluation.debug?.token_usage?.prompt_tokens?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Output tokens:</span>
                        <span>{evaluation.debug?.token_usage?.completion_tokens?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-medium text-gray-900 dark:text-white pt-1 border-t border-gray-200 dark:border-neutral-700">
                        <span>Total:</span>
                        <span>{evaluation.debug?.token_usage?.total_tokens?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-green-600 dark:text-green-400">
                        <span>Cost:</span>
                        <span>{evaluation.debug?.token_usage?.cost_formatted}</span>
                      </div>
                    </div>
                  </div>

                  {/* Timing */}
                  <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-3">
                    <p className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Clock className="w-3 h-3 text-blue-500" />
                      Timing
                    </p>
                    <div className="space-y-1 text-gray-600 dark:text-neutral-300">
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span>{evaluation.debug?.evaluation_duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Model:</span>
                        <span>{evaluation.debug?.model_used}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ticket Facts */}
                  {evaluation.debug?.ticket_facts && (
                    <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-3">
                      <p className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <Shield className="w-3 h-3 text-green-500" />
                        Ticket Facts
                      </p>
                      <div className="space-y-1 text-gray-600 dark:text-neutral-300">
                        {Object.entries(evaluation.debug.ticket_facts || {}).map(([key, value]) => (
                          value && value !== 'unknown' && (
                            <div key={key} className="flex justify-between">
                              <span>{key}:</span>
                              <span className="font-mono">{String(value)}</span>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Guardrail Findings */}
                  {evaluation.debug?.guardrail_findings?.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                      <p className="font-medium text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                        <Shield className="w-3 h-3" />
                        Guardrail Detections
                      </p>
                      <div className="space-y-1 text-red-600 dark:text-red-300">
                        {evaluation.debug.guardrail_findings.map((gf, i) => (
                          <p key={i}>• {gf.description}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default QAEvaluationSessions;
