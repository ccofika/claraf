import React, { useState, useCallback } from 'react';
import { Sparkles, Copy, Loader2, AlertCircle, Check, FileText, User, Star, Search } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Cache for similar feedbacks results - persists across component remounts
const resultsCache = new Map();

const SimilarFeedbacksPanel = ({ notes, ticketId, onCopyFeedback }) => {
  const { user } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL;

  // Strip HTML helper
  const stripHtml = (html) => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${user?.token}` }
  });

  // Manual search function - triggered by button click
  const handleSearch = useCallback(async () => {
    const plainText = stripHtml(notes);
    const cacheKey = plainText?.trim();

    if (!plainText || plainText.trim().length < 10) {
      setError('Please add at least 10 characters of notes first');
      return;
    }

    setHasSearched(true);

    // Check cache first
    if (resultsCache.has(cacheKey)) {
      setResults(resultsCache.get(cacheKey));
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
  }, [notes, ticketId, API_URL, user?.token]);

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
    if (score >= 70) return {
      bg: 'bg-emerald-100 dark:bg-emerald-500/20',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-300 dark:border-emerald-500/30'
    };
    if (score >= 50) return {
      bg: 'bg-amber-100 dark:bg-amber-500/20',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-300 dark:border-amber-500/30'
    };
    return {
      bg: 'bg-orange-100 dark:bg-orange-500/20',
      text: 'text-orange-700 dark:text-orange-400',
      border: 'border-orange-300 dark:border-orange-500/30'
    };
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    const plain = stripHtml(text);
    if (plain.length <= maxLength) return plain;
    return plain.substring(0, maxLength).trim() + '...';
  };

  const plainNotes = stripHtml(notes);
  const hasMinimumNotes = plainNotes && plainNotes.trim().length >= 10;

  // Initial state - show search button (only if never searched)
  if (!hasSearched && !loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-500/10 dark:to-fuchsia-500/10 flex items-center justify-center mb-4 border border-violet-200 dark:border-violet-500/20">
          <Sparkles className="w-7 h-7 text-violet-500 dark:text-violet-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-700 dark:text-zinc-300 mb-2">AI Similar Feedbacks</h3>
        <p className="text-sm text-gray-500 dark:text-zinc-500 max-w-[250px] mb-4">
          {hasMinimumNotes
            ? 'Click to find similar feedbacks from previously graded tickets'
            : 'Add notes to the ticket first (min 10 characters)'}
        </p>
        <button
          type="button"
          onClick={handleSearch}
          disabled={!hasMinimumNotes || loading}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
            hasMinimumNotes
              ? 'bg-violet-500 hover:bg-violet-600 text-white shadow-md hover:shadow-lg'
              : 'bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 cursor-not-allowed'
          }`}
        >
          <Search className="w-4 h-4" />
          Find Similar Feedbacks
        </button>
        {!hasMinimumNotes && (
          <div className="mt-3 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700/50">
            <span className="text-xs text-gray-500 dark:text-zinc-500">
              {plainNotes ? `${plainNotes.trim().length}/10 characters` : '0/10 characters'}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-500/20 dark:to-fuchsia-500/20 flex items-center justify-center border border-violet-200 dark:border-violet-500/20">
            <Loader2 className="w-5 h-5 text-violet-500 dark:text-violet-400 animate-spin" />
          </div>
          <div className="absolute -inset-2 rounded-2xl bg-violet-100 dark:bg-violet-500/5 animate-pulse" />
        </div>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-4">Analyzing similar tickets...</p>
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
          onClick={handleSearch}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg border border-gray-300 dark:border-zinc-700 transition-colors"
        >
          <Search className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  // No results state
  if (results.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-100 to-cyan-100 dark:from-sky-500/10 dark:to-cyan-500/10 flex items-center justify-center mb-4 border border-sky-200 dark:border-sky-500/20">
          <FileText className="w-7 h-7 text-sky-500 dark:text-sky-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-700 dark:text-zinc-300 mb-2">Unique Case</h3>
        <p className="text-sm text-gray-500 dark:text-zinc-500 max-w-[250px] mb-4">
          No similar feedbacks found. This appears to be a unique ticket scenario.
        </p>
        <button
          type="button"
          onClick={handleSearch}
          disabled={!hasMinimumNotes || loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-400 transition-colors"
        >
          <Search className="w-4 h-4" />
          Search Again
        </button>
      </div>
    );
  }

  // Results state
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-zinc-800/80 bg-gray-50 dark:bg-zinc-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-500/20 dark:to-fuchsia-500/20 border border-violet-200 dark:border-violet-500/20">
              <Sparkles className="w-4 h-4 text-violet-500 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-800 dark:text-zinc-200">Similar Feedbacks</h3>
              <p className="text-xs text-gray-500 dark:text-zinc-500">{results.length} match{results.length !== 1 ? 'es' : ''} found</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="p-1.5 rounded-lg text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
            title="Search again"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Results list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        {results.map((result, index) => {
          const simColors = getSimilarityColor(result.similarityScore);
          const isCopied = copiedId === result._id;

          return (
            <div
              key={result._id}
              className="group relative bg-white dark:bg-zinc-800/40 hover:bg-gray-50 dark:hover:bg-zinc-800/60 rounded-xl border border-gray-200 dark:border-zinc-700/50 hover:border-gray-300 dark:hover:border-zinc-600/50 transition-all duration-200 shadow-sm dark:shadow-none"
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
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-gray-100 dark:bg-zinc-700/50 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-600/30">
                    <Star className="w-3 h-3" />
                    {result.qualityScorePercent}%
                  </div>
                )}

                {/* Agent name */}
                {result.agentName && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-gray-100 dark:bg-zinc-700/50 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-600/30">
                    <User className="w-3 h-3" />
                    {result.agentName}
                  </div>
                )}
              </div>

              {/* Original notes preview */}
              {result.notes && (
                <div className="px-3 pb-2">
                  <p className="text-xs text-gray-500 dark:text-zinc-500 leading-relaxed">
                    <span className="text-gray-400 dark:text-zinc-600 font-medium">Notes: </span>
                    {truncateText(result.notes, 100)}
                  </p>
                </div>
              )}

              {/* Feedback content */}
              <div className="px-3 pb-3">
                <div className="bg-gray-50 dark:bg-zinc-900/60 rounded-lg p-3 border border-gray-200 dark:border-zinc-700/30">
                  <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
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
                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'
                    : 'bg-gray-100 dark:bg-zinc-700/50 text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-200 dark:hover:bg-zinc-700 border border-transparent opacity-0 group-hover:opacity-100'
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
