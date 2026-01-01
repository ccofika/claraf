import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Copy, Loader2, AlertCircle, Check, FileText, User, Star } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Cache for similar feedbacks results - persists across component remounts
const resultsCache = new Map();

const SimilarFeedbacksPanel = ({ notes, ticketId, onCopyFeedback }) => {
  const { user } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL;

  // Strip HTML helper (needed for cache key computation)
  const stripHtml = (html) => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  // Initialize from cache if available
  const getInitialResults = () => {
    const plainNotes = stripHtml(notes)?.trim();
    if (plainNotes && resultsCache.has(plainNotes)) {
      return resultsCache.get(plainNotes);
    }
    return [];
  };

  const [results, setResults] = useState(getInitialResults);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const debounceRef = useRef(null);
  const lastFetchedNotesRef = useRef(
    (() => {
      const plainNotes = stripHtml(notes)?.trim();
      return resultsCache.has(plainNotes) ? plainNotes : '';
    })()
  );

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${user?.token}` }
  });

  const fetchSimilarFeedbacks = useCallback(async (notesText) => {
    const plainText = stripHtml(notesText);
    const cacheKey = plainText?.trim();

    if (!plainText || plainText.trim().length < 10) {
      setResults([]);
      setError(null);
      return;
    }

    // Skip if we already fetched for these exact notes
    if (cacheKey === lastFetchedNotesRef.current) {
      return;
    }

    // Check cache first
    if (resultsCache.has(cacheKey)) {
      setResults(resultsCache.get(cacheKey));
      lastFetchedNotesRef.current = cacheKey;
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_URL}/api/qa/tickets/similar-feedbacks`,
        {
          notes: plainText,
          excludeTicketId: ticketId,
          limit: 10
        },
        getAuthHeaders()
      );
      const fetchedResults = response.data.results || [];
      setResults(fetchedResults);

      // Cache the results
      resultsCache.set(cacheKey, fetchedResults);
      lastFetchedNotesRef.current = cacheKey;

      // Limit cache size to prevent memory issues (keep last 20 searches)
      if (resultsCache.size > 20) {
        const firstKey = resultsCache.keys().next().value;
        resultsCache.delete(firstKey);
      }
    } catch (err) {
      setError('Failed to fetch similar feedbacks');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [ticketId, API_URL, user?.token]);

  // Fetch on mount and debounced updates
  useEffect(() => {
    const plainNotes = stripHtml(notes);
    const cacheKey = plainNotes?.trim();

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (plainNotes && plainNotes.trim().length >= 10) {
      // Check cache immediately on mount - no loading state needed
      if (resultsCache.has(cacheKey)) {
        setResults(resultsCache.get(cacheKey));
        lastFetchedNotesRef.current = cacheKey;
        return;
      }

      // Only fetch if notes changed from last fetch
      if (cacheKey !== lastFetchedNotesRef.current) {
        debounceRef.current = setTimeout(() => {
          fetchSimilarFeedbacks(notes);
        }, 500);
      }
    } else {
      setResults([]);
      setError(null);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [notes, ticketId, fetchSimilarFeedbacks]);

  const handleCopy = async (feedback, id) => {
    try {
      // Copy to clipboard
      await navigator.clipboard.writeText(feedback);

      // Call callback to append to existing feedback
      if (onCopyFeedback) {
        onCopyFeedback(feedback);
      }

      setCopiedId(id);
      toast.success('Feedback copied & appended');

      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error('Failed to copy feedback');
    }
  };

  const getSimilarityColor = (score) => {
    if (score >= 70) return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' };
    if (score >= 50) return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' };
    return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' };
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    const plain = stripHtml(text);
    if (plain.length <= maxLength) return plain;
    return plain.substring(0, maxLength).trim() + '...';
  };

  const plainNotes = stripHtml(notes);
  const hasMinimumNotes = plainNotes && plainNotes.trim().length >= 10;

  // Empty state - no notes
  if (!hasMinimumNotes) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 flex items-center justify-center mb-4 border border-violet-500/20">
          <Sparkles className="w-7 h-7 text-violet-400" />
        </div>
        <h3 className="text-lg font-medium text-zinc-300 mb-2">AI Similar Feedbacks</h3>
        <p className="text-sm text-zinc-500 max-w-[250px]">
          Add notes to the ticket to find similar feedbacks from previously graded tickets
        </p>
        <div className="mt-4 px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50">
          <span className="text-xs text-zinc-500">Minimum 10 characters required</span>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center border border-violet-500/20">
            <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
          </div>
          <div className="absolute -inset-2 rounded-2xl bg-violet-500/5 animate-pulse" />
        </div>
        <p className="text-sm text-zinc-400 mt-4">Analyzing similar tickets...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-xl bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <p className="text-sm text-zinc-400 mb-4">{error}</p>
        <button
          onClick={() => fetchSimilarFeedbacks(notes)}
          className="px-4 py-2 text-sm font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // No results state
  if (results.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500/10 to-cyan-500/10 flex items-center justify-center mb-4 border border-sky-500/20">
          <FileText className="w-7 h-7 text-sky-400" />
        </div>
        <h3 className="text-lg font-medium text-zinc-300 mb-2">Unique Case</h3>
        <p className="text-sm text-zinc-500 max-w-[250px]">
          No similar feedbacks found. This appears to be a unique ticket scenario.
        </p>
      </div>
    );
  }

  // Results state
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-zinc-800/80 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20">
            <Sparkles className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-200">Similar Feedbacks</h3>
            <p className="text-xs text-zinc-500">{results.length} match{results.length !== 1 ? 'es' : ''} found</p>
          </div>
        </div>
      </div>

      {/* Results list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        {results.map((result, index) => {
          const simColors = getSimilarityColor(result.similarityScore);
          const isCopied = copiedId === result._id;

          return (
            <div
              key={result._id}
              className="group relative bg-zinc-800/40 hover:bg-zinc-800/60 rounded-xl border border-zinc-700/50 hover:border-zinc-600/50 transition-all duration-200"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Top row - badges */}
              <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                {/* Similarity score */}
                <div className={`px-2 py-0.5 rounded-md text-xs font-semibold ${simColors.bg} ${simColors.text} border ${simColors.border}`}>
                  {result.similarityScore}% match
                </div>

                {/* Quality score */}
                {result.qualityScorePercent !== undefined && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-zinc-700/50 text-zinc-400 border border-zinc-600/30">
                    <Star className="w-3 h-3" />
                    {result.qualityScorePercent}%
                  </div>
                )}

                {/* Agent name */}
                {result.agentName && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-zinc-700/50 text-zinc-400 border border-zinc-600/30">
                    <User className="w-3 h-3" />
                    {result.agentName}
                  </div>
                )}
              </div>

              {/* Original notes preview */}
              {result.notes && (
                <div className="px-3 pb-2">
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    <span className="text-zinc-600 font-medium">Notes: </span>
                    {truncateText(result.notes, 100)}
                  </p>
                </div>
              )}

              {/* Feedback content */}
              <div className="px-3 pb-3">
                <div className="bg-zinc-900/60 rounded-lg p-3 border border-zinc-700/30">
                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {stripHtml(result.feedback)}
                  </p>
                </div>
              </div>

              {/* Copy button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCopy(stripHtml(result.feedback), result._id);
                }}
                className={`absolute top-3 right-3 p-2 rounded-lg transition-all duration-200 ${
                  isCopied
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 border border-transparent opacity-0 group-hover:opacity-100'
                }`}
                title={isCopied ? 'Copied!' : 'Copy & append feedback'}
              >
                {isCopied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SimilarFeedbacksPanel;
