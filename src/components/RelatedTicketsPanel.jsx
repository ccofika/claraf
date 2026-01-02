import React, { useState, useEffect, useCallback } from 'react';
import { Users, Star, AlertCircle, Loader2, FileText, Hash } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

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

const RelatedTicketsPanel = ({ agentId, category, currentTicketId }) => {
  const { user } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL;

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Category validation
  const isCategoryEmpty = !category || category.trim() === '' || category === 'Other';

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
      params.append('category', category);
      params.append('isArchived', 'false');
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
  }, [agentId, category, currentTicketId, API_URL, user?.token, isCategoryEmpty]);

  // Auto-fetch when dependencies change
  useEffect(() => {
    if (!isCategoryEmpty && agentId) {
      fetchRelatedTickets();
    } else {
      setTickets([]);
      setHasSearched(false);
    }
  }, [agentId, category, isCategoryEmpty]);

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
          No other tickets found for this agent in the "{category}" category.
        </p>
      </div>
    );
  }

  // Results view
  return (
    <div className="h-full flex flex-col">
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
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        {tickets.map((ticket, index) => {
          const scoreColors = getScoreColor(ticket.qualityScorePercent);

          return (
            <div
              key={ticket._id}
              className="group relative bg-white dark:bg-zinc-800/40 hover:bg-gray-50 dark:hover:bg-zinc-800/60 rounded-xl border border-gray-200 dark:border-zinc-700/50 hover:border-gray-300 dark:hover:border-zinc-600/50 transition-all duration-200 shadow-sm dark:shadow-none"
              style={{ animationDelay: `${index * 50}ms` }}
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
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RelatedTicketsPanel;
