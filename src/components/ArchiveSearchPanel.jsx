import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Loader2, AlertCircle, Copy, Check, Archive,
  ChevronDown, ChevronRight, X, Filter, Calendar, Tag,
  ArrowLeft, MessageSquare, ClipboardList, BarChart3,
  FileText, Sparkles, Users
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { Badge } from './ui/badge';
import { SCORE_COLORS, SHORT_LABELS, getScorecardValues } from '../data/scorecardConfig';
import { staggerContainer, staggerItem } from '../utils/animations';

const API_URL = process.env.REACT_APP_API_URL;

const ArchiveSearchPanel = ({
  onCopyToTicket,
  agents = [],
  currentCategories = []
}) => {
  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('text'); // 'text' or 'ai'
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    agent: '',
    categories: [],
    dateFrom: '',
    dateTo: ''
  });

  // Results state
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [hasSearched, setHasSearched] = useState(false);

  // Ticket detail state
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [fullTicketData, setFullTicketData] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // Category dropdown state
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const categoryDropdownRef = useRef(null);

  // Agent dropdown state
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [agentSearch, setAgentSearch] = useState('');
  const agentDropdownRef = useRef(null);

  const searchTimeoutRef = useRef(null);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  }, []);

  // All categories list
  const allCategories = [
    'Account closure', 'ACP usage', 'Account recovery', 'Affiliate program',
    'Available bonuses', 'Balance issues', 'Bet | Bet archive', 'Birthday bonus',
    'Break in play', 'Bonus crediting', 'Bonus drops', 'Casino',
    'Coin mixing | AML', 'Compliance (KYC, Terms of service, Privacy)',
    'Crypto - General', 'Crypto deposits', 'Crypto withdrawals', 'Data deletion',
    'Deposit bonus', 'Exclusion | General', 'Exclusion | Self exclusion',
    'Exclusion | Casino exclusion', 'Fiat General', 'Fiat - CAD', 'Fiat - BRL',
    'Fiat - JPY', 'Fiat - INR', 'Fiat - PEN/ARS/CLP', 'Forum', 'Funds recovery',
    'Games issues', 'Games | Providers | Rules', 'Games | Live games',
    'Hacked accounts', 'In-game chat | Third party chat', 'Monthly bonus',
    'No luck tickets | RTP', 'Phishing | Scam attempt', 'Phone removal',
    'Pre/Post monthly bonus', 'Promotions', 'Provably fair', 'Race', 'Rakeback',
    'Reload', 'Responsible gambling', 'Roles', 'Rollover',
    'Security (2FA, Password, Email codes)', 'Sportsbook', 'Stake basics',
    'Stake chat', 'Stake original', 'Tech issues | Jira cases | Bugs',
    'Tip recovery', 'VIP host', 'VIP program', 'Welcome bonus', 'Weekly bonus', 'Other'
  ];

  const filteredCategories = allCategories.filter(cat =>
    cat.toLowerCase().includes(categorySearch.toLowerCase()) &&
    !filters.categories.includes(cat)
  );

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(agentSearch.toLowerCase())
  );

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target)) {
        setShowCategoryDropdown(false);
        setCategorySearch('');
      }
      if (agentDropdownRef.current && !agentDropdownRef.current.contains(e.target)) {
        setShowAgentDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search function
  const searchArchive = useCallback(async (page = 1) => {
    if (!searchQuery.trim() && filters.categories.length === 0 && !filters.agent) {
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      if (searchMode === 'ai' && searchQuery.trim()) {
        // AI semantic search
        const params = new URLSearchParams({
          query: searchQuery,
          isArchived: 'true',
          limit: '20'
        });

        if (filters.agent) {
          params.append('agent', filters.agent);
        }
        if (filters.categories.length > 0) {
          params.append('categories', filters.categories.join(','));
        }

        const response = await axios.get(
          `${API_URL}/api/qa/ai-search?${params.toString()}`,
          getAuthHeaders()
        );
        setTickets(response.data || []);
        setPagination({ page: 1, pages: 1, total: response.data?.length || 0 });
      } else {
        // Text search with filters
        const params = new URLSearchParams({
          isArchived: 'true',
          page: page.toString(),
          limit: '20',
          sortBy: 'dateEntered',
          sortOrder: 'desc'
        });

        if (searchQuery.trim()) {
          params.append('search', searchQuery);
        }
        if (filters.agent) {
          params.append('agent', filters.agent);
        }
        if (filters.categories.length > 0) {
          params.append('categories', filters.categories.join(','));
        }
        if (filters.dateFrom) {
          params.append('dateFrom', filters.dateFrom);
        }
        if (filters.dateTo) {
          params.append('dateTo', filters.dateTo);
        }

        const response = await axios.get(
          `${API_URL}/api/qa/tickets?${params.toString()}`,
          getAuthHeaders()
        );

        setTickets(response.data.tickets || []);
        setPagination(response.data.pagination || { page: 1, pages: 1, total: 0 });
      }
    } catch (err) {
      console.error('Archive search error:', err);
      setError('Failed to search archive');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, searchMode, filters, getAuthHeaders]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim() || filters.categories.length > 0 || filters.agent) {
      searchTimeoutRef.current = setTimeout(() => {
        searchArchive(1);
      }, 500);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, filters, searchArchive]);

  // Fetch ticket details
  const fetchTicketDetails = useCallback(async (ticketId) => {
    try {
      setTicketLoading(true);
      const response = await axios.get(
        `${API_URL}/api/qa/tickets/${ticketId}`,
        getAuthHeaders()
      );
      setFullTicketData(response.data);
    } catch (err) {
      console.error('Failed to fetch ticket:', err);
      toast.error('Failed to load ticket details');
    } finally {
      setTicketLoading(false);
    }
  }, [getAuthHeaders]);

  // When selecting a ticket
  useEffect(() => {
    if (selectedTicket) {
      fetchTicketDetails(selectedTicket._id);
    } else {
      setFullTicketData(null);
    }
  }, [selectedTicket, fetchTicketDetails]);

  // Copy functions
  const handleCopyAll = () => {
    if (!fullTicketData || !onCopyToTicket) return;

    onCopyToTicket({
      categories: fullTicketData.categories || [],
      feedback: fullTicketData.feedback || '',
      scorecardValues: fullTicketData.scorecardValues || {},
      scorecardVariant: fullTicketData.scorecardVariant || null
    });

    setCopiedField('all');
    toast.success('Categories, feedback & scorecard copied to ticket');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyFeedback = () => {
    if (!fullTicketData || !onCopyToTicket) return;

    onCopyToTicket({
      feedback: fullTicketData.feedback || ''
    });

    setCopiedField('feedback');
    toast.success('Feedback copied to ticket');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyCategories = () => {
    if (!fullTicketData || !onCopyToTicket) return;

    onCopyToTicket({
      categories: fullTicketData.categories || []
    });

    setCopiedField('categories');
    toast.success('Categories copied to ticket');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyScorecard = () => {
    if (!fullTicketData || !onCopyToTicket) return;

    onCopyToTicket({
      scorecardValues: fullTicketData.scorecardValues || {},
      scorecardVariant: fullTicketData.scorecardVariant || null
    });

    setCopiedField('scorecard');
    toast.success('Scorecard copied to ticket');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Score helpers
  const getScoreColor = (score) => {
    if (score === null || score === undefined) return 'text-gray-400';
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 80) return 'text-blue-600 dark:text-blue-400';
    if (score >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score) => {
    if (score === null || score === undefined) return 'bg-gray-100 dark:bg-gray-800';
    if (score >= 90) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 80) return 'bg-blue-100 dark:bg-blue-900/30';
    if (score >= 70) return 'bg-amber-100 dark:bg-amber-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  // Strip HTML
  const stripHtml = (html) => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.agent) count++;
    if (filters.categories.length > 0) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    return count;
  };

  // Auto-search when current categories are passed
  useEffect(() => {
    if (currentCategories.length > 0 && !hasSearched) {
      setFilters(prev => ({ ...prev, categories: currentCategories }));
    }
  }, [currentCategories, hasSearched]);

  return (
    <div className="h-full flex flex-col relative">
      {/* Ticket Detail View */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 bg-white dark:bg-neutral-900 z-10 flex flex-col"
          >
            {/* Detail Header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to results
                </button>
                <button
                  type="button"
                  onClick={handleCopyAll}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    copiedField === 'all'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                  }`}
                >
                  {copiedField === 'all' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy All
                </button>
              </div>
            </div>

            {/* Detail Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {ticketLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              ) : fullTicketData ? (
                <div className="space-y-4">
                  {/* Ticket Info */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {fullTicketData.ticketId}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-neutral-400">
                        {fullTicketData.agent?.name} • {new Date(fullTicketData.dateEntered).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg text-sm font-bold ${getScoreBgColor(fullTicketData.qualityScorePercent)} ${getScoreColor(fullTicketData.qualityScorePercent)}`}>
                      {fullTicketData.qualityScorePercent != null ? `${fullTicketData.qualityScorePercent}%` : '-'}
                    </div>
                  </div>

                  {/* Categories */}
                  {fullTicketData.categories && fullTicketData.categories.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-gray-400" />
                          <h4 className="text-xs font-medium text-gray-600 dark:text-neutral-400 uppercase">Categories</h4>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyCategories}
                          className={`p-1 rounded transition-all ${
                            copiedField === 'categories'
                              ? 'text-green-500'
                              : 'text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300'
                          }`}
                        >
                          {copiedField === 'categories' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {fullTicketData.categories.map(cat => (
                          <span
                            key={cat}
                            className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feedback */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        <h4 className="text-xs font-medium text-gray-600 dark:text-neutral-400 uppercase">Feedback</h4>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyFeedback}
                        className={`p-1 rounded transition-all ${
                          copiedField === 'feedback'
                            ? 'text-green-500'
                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300'
                        }`}
                      >
                        {copiedField === 'feedback' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="bg-gray-50 dark:bg-neutral-800/50 rounded-lg p-3 border border-gray-200 dark:border-neutral-700">
                      {fullTicketData.feedback ? (
                        <div
                          className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-neutral-300 text-xs"
                          dangerouslySetInnerHTML={{ __html: fullTicketData.feedback }}
                        />
                      ) : (
                        <p className="text-xs text-gray-500 dark:text-neutral-500 italic">No feedback</p>
                      )}
                    </div>
                  </div>

                  {/* Scorecard */}
                  {fullTicketData.scorecardValues && Object.keys(fullTicketData.scorecardValues).length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-gray-400" />
                          <h4 className="text-xs font-medium text-gray-600 dark:text-neutral-400 uppercase">Scorecard</h4>
                          {fullTicketData.scorecardVariant && (
                            <Badge variant="outline" className="text-[10px]">
                              {fullTicketData.scorecardVariant}
                            </Badge>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyScorecard}
                          className={`p-1 rounded transition-all ${
                            copiedField === 'scorecard'
                              ? 'text-green-500'
                              : 'text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300'
                          }`}
                        >
                          {copiedField === 'scorecard' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="bg-gray-50 dark:bg-neutral-800/50 rounded-lg p-3 border border-gray-200 dark:border-neutral-700">
                        <div className="space-y-1.5">
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
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getBgClass(value)} ${getTextClass(value)}`}>
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
                <div className="flex items-center justify-center py-12 text-gray-500">
                  Failed to load ticket
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Search View */}
      <div className={`flex flex-col h-full ${selectedTicket ? 'invisible' : ''}`}>
        {/* Search Header */}
        <div className="flex-shrink-0 p-3 border-b border-gray-200 dark:border-neutral-800 space-y-2">
          {/* Search Input */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search archived tickets..."
                className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
            <button
              type="button"
              onClick={() => setSearchMode(searchMode === 'text' ? 'ai' : 'text')}
              className={`p-2 rounded-lg border transition-all ${
                searchMode === 'ai'
                  ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400'
                  : 'bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-500 dark:text-neutral-400 hover:border-purple-300 dark:hover:border-purple-700'
              }`}
              title={searchMode === 'ai' ? 'AI Search enabled' : 'Enable AI Search'}
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg border transition-all relative ${
                showFilters || getActiveFilterCount() > 0
                  ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400'
                  : 'bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-500 dark:text-neutral-400 hover:border-blue-300 dark:hover:border-blue-700'
              }`}
            >
              <Filter className="w-4 h-4" />
              {getActiveFilterCount() > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {getActiveFilterCount()}
                </span>
              )}
            </button>
          </div>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2 overflow-hidden"
              >
                {/* Agent Filter */}
                <div ref={agentDropdownRef} className="relative">
                  <label className="text-[10px] text-gray-500 dark:text-neutral-400 uppercase mb-0.5 block">Agent</label>
                  <button
                    type="button"
                    onClick={() => setShowAgentDropdown(!showAgentDropdown)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg"
                  >
                    <span className={filters.agent ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
                      {filters.agent ? agents.find(a => a._id === filters.agent)?.name : 'All agents'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                  {showAgentDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      <input
                        type="text"
                        value={agentSearch}
                        onChange={(e) => setAgentSearch(e.target.value)}
                        placeholder="Search..."
                        className="w-full px-2.5 py-1.5 text-xs border-b border-gray-200 dark:border-neutral-700 focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        type="button"
                        className="w-full px-2.5 py-1.5 text-xs text-left hover:bg-gray-100 dark:hover:bg-neutral-700"
                        onClick={() => {
                          setFilters(prev => ({ ...prev, agent: '' }));
                          setShowAgentDropdown(false);
                          setAgentSearch('');
                        }}
                      >
                        All agents
                      </button>
                      {filteredAgents.map(agent => (
                        <button
                          type="button"
                          key={agent._id}
                          className="w-full px-2.5 py-1.5 text-xs text-left hover:bg-gray-100 dark:hover:bg-neutral-700"
                          onClick={() => {
                            setFilters(prev => ({ ...prev, agent: agent._id }));
                            setShowAgentDropdown(false);
                            setAgentSearch('');
                          }}
                        >
                          {agent.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Categories Filter */}
                <div ref={categoryDropdownRef} className="relative">
                  <label className="text-[10px] text-gray-500 dark:text-neutral-400 uppercase mb-0.5 block">Categories</label>
                  <div
                    className="flex flex-wrap items-center gap-1 px-2 py-1.5 text-xs bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg min-h-[30px] cursor-text"
                    onClick={() => setShowCategoryDropdown(true)}
                  >
                    {filters.categories.map(cat => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded"
                      >
                        {cat}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilters(prev => ({ ...prev, categories: prev.categories.filter(c => c !== cat) }));
                          }}
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      onFocus={() => setShowCategoryDropdown(true)}
                      placeholder={filters.categories.length === 0 ? 'Add categories...' : ''}
                      className="flex-1 min-w-[60px] bg-transparent outline-none text-[11px]"
                    />
                  </div>
                  {showCategoryDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                      {filteredCategories.length > 0 ? (
                        filteredCategories.slice(0, 10).map(cat => (
                          <button
                            type="button"
                            key={cat}
                            className="w-full px-2.5 py-1.5 text-xs text-left hover:bg-gray-100 dark:hover:bg-neutral-700"
                            onClick={() => {
                              setFilters(prev => ({ ...prev, categories: [...prev.categories, cat] }));
                              setCategorySearch('');
                            }}
                          >
                            {cat}
                          </button>
                        ))
                      ) : (
                        <div className="px-2.5 py-1.5 text-xs text-gray-400">No categories found</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Clear Filters */}
                {getActiveFilterCount() > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilters({ agent: '', categories: [], dateFrom: '', dateTo: '' })}
                    className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Clear all filters
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin mb-2" />
              <p className="text-xs text-gray-500 dark:text-neutral-400">
                {searchMode === 'ai' ? 'Searching with AI...' : 'Searching...'}
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-6 h-6 text-red-400 mb-2" />
              <p className="text-xs text-gray-500 dark:text-neutral-400">{error}</p>
            </div>
          ) : !hasSearched ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                <Archive className="w-6 h-6 text-gray-400 dark:text-neutral-500" />
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-neutral-400 mb-1">
                Search Archive
              </p>
              <p className="text-xs text-gray-500 dark:text-neutral-500 max-w-[200px]">
                Search past tickets by keyword, category, or agent to find similar cases
              </p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                <Search className="w-6 h-6 text-gray-400 dark:text-neutral-500" />
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-neutral-400 mb-1">
                No Results
              </p>
              <p className="text-xs text-gray-500 dark:text-neutral-500">
                Try different search terms or filters
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-neutral-800">
              {tickets.map(ticket => (
                <button
                  type="button"
                  key={ticket._id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-900 dark:text-white">
                          {ticket.ticketId}
                        </span>
                        {ticket.similarityScore && (
                          <Badge variant="outline" className="text-[10px] border-purple-400 text-purple-600 dark:text-purple-400">
                            {Math.round(ticket.similarityScore * 100)}% match
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-neutral-400 mb-1">
                        {ticket.agent?.name} • {new Date(ticket.dateEntered).toLocaleDateString()}
                      </p>
                      {ticket.categories && ticket.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {ticket.categories.slice(0, 2).map(cat => (
                            <span
                              key={cat}
                              className="px-1.5 py-0.5 text-[10px] bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-neutral-400 rounded"
                            >
                              {cat}
                            </span>
                          ))}
                          {ticket.categories.length > 2 && (
                            <span className="text-[10px] text-gray-400">+{ticket.categories.length - 2}</span>
                          )}
                        </div>
                      )}
                      {ticket.feedback && (
                        <p className="text-[10px] text-gray-400 dark:text-neutral-500 line-clamp-1 italic">
                          {stripHtml(ticket.feedback).substring(0, 80)}{stripHtml(ticket.feedback).length > 80 ? '...' : ''}
                        </p>
                      )}
                    </div>
                    <div className={`flex-shrink-0 px-2 py-1 rounded text-xs font-bold ${getScoreBgColor(ticket.qualityScorePercent)} ${getScoreColor(ticket.qualityScorePercent)}`}>
                      {ticket.qualityScorePercent != null ? `${ticket.qualityScorePercent}%` : '-'}
                    </div>
                  </div>
                </button>
              ))}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="p-3 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => searchArchive(pagination.page - 1)}
                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-neutral-800 rounded disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="text-xs text-gray-500">
                    {pagination.page} / {pagination.pages}
                  </span>
                  <button
                    type="button"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => searchArchive(pagination.page + 1)}
                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-neutral-800 rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchiveSearchPanel;
