import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash, Loader2, AlertCircle, Copy, Check, Star, TrendingUp, Users, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useMacros } from '../hooks/useMacros';
import { staggerContainer, staggerItem, fadeInUp, scaleIn, duration, easing } from '../utils/animations';

// Cache for suggestions - persists across component remounts
const suggestionsCache = new Map();

const MacroSuggestionsPanel = ({
  categories = [],
  onSelectMacro,
  agentPosition = null,
  currentScorecardVariant = null
}) => {
  const { fetchMacroSuggestions } = useMacros();

  const [suggestions, setSuggestions] = useState([]);
  const [frequentlyUsed, setFrequentlyUsed] = useState([]);
  const [teamFavorites, setTeamFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [expandedMacroId, setExpandedMacroId] = useState(null);

  // Strip HTML helper
  const stripHtml = (html) => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  // Truncate text helper
  const truncateText = (text, maxLength = 100) => {
    const plain = stripHtml(text);
    if (plain.length <= maxLength) return plain;
    return plain.substring(0, maxLength) + '...';
  };

  // Fetch suggestions when categories change
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (categories.length === 0) {
        setSuggestions([]);
        setFrequentlyUsed([]);
        setTeamFavorites([]);
        setHasFetched(false);
        return;
      }

      const cacheKey = categories.sort().join(',');

      // Check cache first
      if (suggestionsCache.has(cacheKey)) {
        const cached = suggestionsCache.get(cacheKey);
        setSuggestions(cached.suggestions || []);
        setFrequentlyUsed(cached.frequentlyUsed || []);
        setTeamFavorites(cached.teamFavorites || []);
        setHasFetched(true);
        return;
      }

      setLoading(true);
      setError(null);
      setHasFetched(true);

      try {
        const data = await fetchMacroSuggestions(categories);
        setSuggestions(data.suggestions || []);
        setFrequentlyUsed(data.frequentlyUsed || []);
        setTeamFavorites(data.teamFavorites || []);

        // Cache results
        suggestionsCache.set(cacheKey, data);

        // Limit cache size
        if (suggestionsCache.size > 20) {
          const firstKey = suggestionsCache.keys().next().value;
          suggestionsCache.delete(firstKey);
        }
      } catch (err) {
        setError('Failed to fetch macro suggestions');
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [categories, fetchMacroSuggestions]);

  const handleSelectMacro = (macro) => {
    if (onSelectMacro) {
      onSelectMacro(macro, {
        applyCategories: false,
        applyScorecard: true,
        scorecardVariant: currentScorecardVariant
      });
      setCopiedId(macro._id);
      toast.success('Macro applied');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const hasAnyResults = suggestions.length > 0 || frequentlyUsed.length > 0 || teamFavorites.length > 0;

  // Get usage display text based on macro type
  const getUsageText = (macro) => {
    if (macro.usageCount > 0) return `${macro.usageCount} uses`;
    if (macro.userUsageCount > 0) return `${macro.userUsageCount} uses by you`;
    if (macro.weeklyUsage > 0) return `${macro.weeklyUsage} this week`;
    return null;
  };

  // Macro card component
  const MacroCard = ({ macro, icon: Icon, iconColor = 'text-blue-500' }) => {
    const isExpanded = expandedMacroId === macro._id;
    const isCopied = copiedId === macro._id;
    const usageText = getUsageText(macro);

    return (
      <motion.div
        variants={staggerItem}
        className="group relative bg-white dark:bg-neutral-800/50 rounded-lg border border-gray-200 dark:border-neutral-700 p-3 hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer"
        onClick={() => setExpandedMacroId(isExpanded ? null : macro._id)}
      >
        <div className="flex items-start gap-2">
          <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconColor}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {macro.title}
              </h4>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectMacro(macro);
                }}
                className={`flex-shrink-0 p-1.5 rounded-md transition-all ${
                  isCopied
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-neutral-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {macro.categories && macro.categories.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {macro.categories.slice(0, 3).map(cat => (
                  <span
                    key={cat}
                    className="inline-block px-1.5 py-0.5 text-[10px] bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-neutral-400 rounded"
                  >
                    {cat}
                  </span>
                ))}
                {macro.categories.length > 3 && (
                  <span className="text-[10px] text-gray-500 dark:text-neutral-500">
                    +{macro.categories.length - 3}
                  </span>
                )}
              </div>
            )}

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="text-xs text-gray-600 dark:text-neutral-400 mt-2 pt-2 border-t border-gray-100 dark:border-neutral-700">
                    {stripHtml(macro.feedback)}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {!isExpanded && (
              <p className="text-xs text-gray-500 dark:text-neutral-500 mt-1 line-clamp-2">
                {truncateText(macro.feedback, 80)}
              </p>
            )}
          </div>
        </div>

        {usageText && (
          <div className="absolute top-2 right-10 text-[10px] text-gray-400 dark:text-neutral-500">
            {usageText}
          </div>
        )}
      </motion.div>
    );
  };

  // Section component
  const Section = ({ title, icon: Icon, iconColor, macros, emptyText }) => {
    if (macros.length === 0) return null;

    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2 px-1">
          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
          <h3 className="text-xs font-medium text-gray-600 dark:text-neutral-400 uppercase tracking-wider">
            {title}
          </h3>
          <span className="text-xs text-gray-400 dark:text-neutral-500">({macros.length})</span>
        </div>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="space-y-2"
        >
          {macros.map(macro => (
            <MacroCard key={macro._id} macro={macro} icon={Icon} iconColor={iconColor} />
          ))}
        </motion.div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {/* Loading state */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
            <p className="text-sm text-gray-500 dark:text-neutral-400">
              Finding relevant macros...
            </p>
          </motion.div>
        )}

        {/* Error state */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
            <p className="text-sm text-gray-600 dark:text-neutral-400 text-center">
              {error}
            </p>
          </motion.div>
        )}

        {/* No categories selected */}
        {!loading && !error && categories.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
              <Hash className="w-6 h-6 text-gray-400 dark:text-neutral-500" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-neutral-400 mb-1">
              Select Categories
            </p>
            <p className="text-xs text-gray-500 dark:text-neutral-500 max-w-[200px]">
              Add categories to the ticket to see macro suggestions
            </p>
          </motion.div>
        )}

        {/* No results */}
        {!loading && !error && hasFetched && categories.length > 0 && !hasAnyResults && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
              <Search className="w-6 h-6 text-gray-400 dark:text-neutral-500" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-neutral-400 mb-1">
              No Macros Found
            </p>
            <p className="text-xs text-gray-500 dark:text-neutral-500 max-w-[200px]">
              No macros match the selected categories
            </p>
          </motion.div>
        )}

        {/* Results */}
        {!loading && !error && hasAnyResults && (
          <div>
            <Section
              title="Category Matches"
              icon={Hash}
              iconColor="text-blue-500"
              macros={suggestions}
            />
            <Section
              title="Your Frequently Used"
              icon={Star}
              iconColor="text-amber-500"
              macros={frequentlyUsed}
            />
            <Section
              title="Team Favorites"
              icon={Users}
              iconColor="text-purple-500"
              macros={teamFavorites}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MacroSuggestionsPanel;
