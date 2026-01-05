import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Flag, CheckCircle, XCircle, AlertTriangle, Download, Eye,
  Loader2, RefreshCw, ChevronRight, Filter, MessageSquare,
  ThumbsUp, ThumbsDown, HelpCircle, FileText
} from 'lucide-react';
import { Badge } from './ui/badge';

const API_URL = process.env.REACT_APP_API_URL;

const QAFlaggedTickets = ({ sessions }) => {
  const [selectedSession, setSelectedSession] = useState(null);
  const [flaggedTickets, setFlaggedTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, good, bad, needs_review
  const [selectedTickets, setSelectedTickets] = useState([]);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  // Fetch flagged tickets for session
  const fetchFlaggedTickets = useCallback(async (sessionId) => {
    if (!sessionId) return;

    try {
      setLoading(true);
      const [ticketsRes, statsRes] = await Promise.all([
        axios.get(
          `${API_URL}/api/qa/knowledge/flagged/${sessionId}${filter !== 'all' ? `?flag=${filter}` : ''}`,
          getAuthHeaders()
        ),
        axios.get(
          `${API_URL}/api/qa/knowledge/flagged/${sessionId}/stats`,
          getAuthHeaders()
        )
      ]);

      setFlaggedTickets(ticketsRes.data.tickets || []);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching flagged tickets:', error);
      // Don't show error for 404 (no flagged tickets yet)
      if (error.response?.status !== 404) {
        toast.error('Failed to load flagged tickets');
      }
      setFlaggedTickets([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Load flagged tickets when session changes
  useEffect(() => {
    if (selectedSession) {
      fetchFlaggedTickets(selectedSession._id);
    }
  }, [selectedSession, fetchFlaggedTickets]);

  // Toggle ticket selection
  const toggleTicketSelection = (ticketId) => {
    setSelectedTickets(prev => {
      if (prev.includes(ticketId)) {
        return prev.filter(id => id !== ticketId);
      }
      return [...prev, ticketId];
    });
  };

  // Select all visible tickets
  const selectAllTickets = () => {
    const allIds = flaggedTickets.map(t => t._id);
    setSelectedTickets(allIds);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedTickets([]);
  };

  // Bulk import selected tickets
  const handleBulkImport = async () => {
    if (selectedTickets.length === 0) {
      toast.error('No tickets selected');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/qa/knowledge/flagged/bulk-import`,
        { ticketIds: selectedTickets },
        getAuthHeaders()
      );

      toast.success(response.data.message);
      setSelectedTickets([]);
      fetchFlaggedTickets(selectedSession._id);
    } catch (error) {
      console.error('Error importing tickets:', error);
      toast.error(error.response?.data?.message || 'Failed to import tickets');
    }
  };

  // Get flag badge
  const FlagBadge = ({ flag }) => {
    const config = {
      good: { color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', icon: ThumbsUp, label: 'Good' },
      bad: { color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', icon: ThumbsDown, label: 'Bad' },
      needs_review: { color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400', icon: HelpCircle, label: 'Review' }
    };

    const c = config[flag] || config.needs_review;
    const Icon = c.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${c.color}`}>
        <Icon className="w-3 h-3" />
        {c.label}
      </span>
    );
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // No sessions available
  if (!sessions || sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
          <Flag className="w-8 h-8 text-gray-400 dark:text-neutral-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Sessions Available
        </h3>
        <p className="text-sm text-gray-500 dark:text-neutral-400 text-center max-w-md">
          Import some tickets first to see flagged results here. After AI evaluation, flagged tickets will appear for review.
        </p>
      </div>
    );
  }

  // Session selector view
  if (!selectedSession) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Flag className="w-5 h-5" />
            Flagged Tickets
          </h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            Select a scrape session to view AI-flagged tickets
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
          {sessions.filter(s => s.status === 'completed').map((session) => (
            <button
              key={session._id}
              onClick={() => setSelectedSession(session)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors border-b border-gray-100 dark:border-neutral-800 last:border-b-0"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-gray-500 dark:text-neutral-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {session.agent?.name || 'Unknown Agent'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-neutral-400">
                    {session.scrapedCount} conversations | {formatDate(session.createdAt)}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}

          {sessions.filter(s => s.status === 'completed').length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-neutral-400">
              No completed sessions yet. Wait for scraping to complete.
            </div>
          )}
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Flagged tickets view
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedSession(null)}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200 flex items-center gap-1"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back
          </button>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedSession.agent?.name} - Flagged Tickets
            </h2>
            <p className="text-sm text-gray-500 dark:text-neutral-400">
              {formatDate(selectedSession.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchFlaggedTickets(selectedSession._id)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
            <div className="text-sm text-gray-500 dark:text-neutral-400">Total Evaluated</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.good}</div>
            <div className="text-sm text-green-600 dark:text-green-500">Good</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.bad}</div>
            <div className="text-sm text-red-600 dark:text-red-500">Bad</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.needsReview}</div>
            <div className="text-sm text-yellow-600 dark:text-yellow-500">Needs Review</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.imported}</div>
            <div className="text-sm text-blue-600 dark:text-blue-500">Imported</div>
          </div>
        </div>
      )}

      {/* Filter and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Tickets</option>
            <option value="good">Good Only</option>
            <option value="bad">Bad Only</option>
            <option value="needs_review">Needs Review</option>
          </select>
        </div>

        {selectedTickets.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-neutral-400">
              {selectedTickets.length} selected
            </span>
            <button
              onClick={clearSelection}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              Clear
            </button>
            <button
              onClick={handleBulkImport}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              Import Selected
            </button>
          </div>
        )}
      </div>

      {/* Tickets list */}
      {flaggedTickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg">
          <div className="w-16 h-16 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
            <Flag className="w-8 h-8 text-gray-400 dark:text-neutral-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Flagged Tickets Yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-neutral-400 text-center max-w-md">
            AI hasn't evaluated any tickets from this session yet. Run the evaluation process to see results here.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
          {/* Header row */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 text-xs font-medium text-gray-500 dark:text-neutral-400">
            <div className="w-8">
              <input
                type="checkbox"
                checked={selectedTickets.length === flaggedTickets.length}
                onChange={(e) => e.target.checked ? selectAllTickets() : clearSelection()}
                className="rounded border-gray-300 dark:border-neutral-600"
              />
            </div>
            <div className="w-32">Conversation</div>
            <div className="w-24">Flag</div>
            <div className="w-32">Category</div>
            <div className="flex-1">Reasoning</div>
            <div className="w-24 text-right">Confidence</div>
            <div className="w-20">Status</div>
          </div>

          {/* Ticket rows */}
          {flaggedTickets.map((ticket) => (
            <motion.div
              key={ticket._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`
                flex items-center gap-4 p-3 border-b border-gray-100 dark:border-neutral-800 last:border-b-0
                hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors
                ${selectedTickets.includes(ticket._id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
              `}
            >
              <div className="w-8">
                <input
                  type="checkbox"
                  checked={selectedTickets.includes(ticket._id)}
                  onChange={() => toggleTicketSelection(ticket._id)}
                  className="rounded border-gray-300 dark:border-neutral-600"
                />
              </div>
              <div className="w-32 font-mono text-sm text-gray-900 dark:text-white">
                #{ticket.conversationId}
              </div>
              <div className="w-24">
                <FlagBadge flag={ticket.evaluation?.flag} />
              </div>
              <div className="w-32 text-sm text-gray-600 dark:text-neutral-400 truncate">
                {ticket.evaluation?.category || '-'}
              </div>
              <div className="flex-1 text-sm text-gray-600 dark:text-neutral-400 truncate">
                {ticket.evaluation?.reasoning || '-'}
              </div>
              <div className="w-24 text-right">
                <span className={`
                  text-sm font-medium
                  ${ticket.evaluation?.confidence >= 80 ? 'text-green-600 dark:text-green-400' :
                    ticket.evaluation?.confidence >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'}
                `}>
                  {ticket.evaluation?.confidence || 0}%
                </span>
              </div>
              <div className="w-20">
                {ticket.imported ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                    <CheckCircle className="w-3 h-3" />
                    Imported
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-neutral-400">
                    Pending
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QAFlaggedTickets;
