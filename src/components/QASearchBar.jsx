import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Sparkles, X, Filter, Calendar, Tag,
  TrendingUp, Users, FileText, Clock, Target
} from 'lucide-react';
import axios from 'axios';
import { Badge } from './ui/badge';

const QASearchBar = ({ onTicketSelect, currentFilters = {}, onFilterChange }) => {
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState('ai'); // 'ai' or 'text'
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const searchInputRef = useRef(null);
  const resultsRef = useRef(null);
  const debounceTimer = useRef(null);

  // Advanced filters
  const [advancedFilters, setAdvancedFilters] = useState({
    category: '',
    priority: '',
    tags: '',
    scoreMin: '',
    scoreMax: '',
    dateFrom: '',
    dateTo: '',
    status: '',
    agent: ''
  });

  const API_URL = process.env.REACT_APP_API_URL;

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (query.trim().length === 0) {
      setResults([]);
      setShowResults(false);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(query);
    }, 400);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, searchMode, advancedFilters]);

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = searchMode === 'ai' ? '/api/qa/ai-search' : '/api/qa/tickets';

      const params = {
        ...(searchMode === 'ai' ? { query: searchQuery } : { search: searchQuery }),
        ...advancedFilters,
        limit: 20
      };

      // Remove empty params
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await axios.get(`${API_URL}${endpoint}`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });

      const ticketData = searchMode === 'ai' ? response.data : response.data.tickets || response.data;
      setResults(Array.isArray(ticketData) ? ticketData : []);
      setShowResults(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!showResults || results.length === 0) {
      if (e.key === 'Escape') {
        setShowResults(false);
        setQuery('');
        searchInputRef.current?.blur();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowResults(false);
        setQuery('');
        searchInputRef.current?.blur();
        break;
      default:
        break;
    }
  };

  const handleResultClick = (ticket) => {
    onTicketSelect?.(ticket);
    setShowResults(false);
    setQuery('');
    searchInputRef.current?.blur();
  };

  const handleFilterChange = (key, value) => {
    setAdvancedFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setAdvancedFilters({
      category: '',
      priority: '',
      tags: '',
      scoreMin: '',
      scoreMax: '',
      dateFrom: '',
      dateTo: '',
      status: '',
      agent: ''
    });
    setQuery('');
  };

  const getActiveFilterCount = () => {
    return Object.values(advancedFilters).filter(v => v !== '' && v !== null && v !== undefined).length;
  };

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(e.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const QualityScoreBadge = ({ score }) => {
    if (score === null || score === undefined) {
      return <Badge variant="outline" className="text-xs">Not graded</Badge>;
    }

    let color = 'bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-neutral-300';
    if (score >= 80) color = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
    else if (score >= 60) color = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
    else color = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';

    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${color}`}>
        {score}%
      </span>
    );
  };

  return (
    <div className="relative w-full">
      {/* Main Search Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <div
            className={`
              flex items-center gap-2 px-3 py-2
              rounded-lg
              bg-white dark:bg-neutral-900
              border-2 ${showResults ? 'border-black dark:border-white' : 'border-gray-200 dark:border-neutral-800'}
              transition-all duration-200
              ${showResults ? 'shadow-lg' : 'shadow-sm'}
            `}
          >
            {/* Search Icon */}
            {searchMode === 'ai' ? (
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            ) : (
              <Search className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
            )}

            {/* Search Input */}
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => query && setShowResults(true)}
              placeholder={`${searchMode === 'ai' ? 'AI-powered semantic search' : 'Search tickets'}... (${searchMode === 'ai' ? 'Smart' : 'Text'})`}
              className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-neutral-400 outline-none text-sm"
            />

            {/* Loading Spinner */}
            {isSearching && (
              <div className="w-4 h-4 border-2 border-gray-300 dark:border-neutral-600 border-t-black dark:border-t-white rounded-full animate-spin" />
            )}

            {/* Clear Button */}
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
              </button>
            )}

            {/* Divider */}
            <div className="w-px h-5 bg-gray-300 dark:bg-neutral-700" />

            {/* AI / Text Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-neutral-800 rounded-md p-0.5">
              <button
                onClick={() => setSearchMode('ai')}
                className={`
                  flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
                  transition-all duration-200
                  ${searchMode === 'ai'
                    ? 'bg-purple-600 dark:bg-purple-500 text-white shadow-sm'
                    : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                <Sparkles className="w-3 h-3" />
                AI
              </button>
              <button
                onClick={() => setSearchMode('text')}
                className={`
                  flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
                  transition-all duration-200
                  ${searchMode === 'text'
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
                    : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                <Search className="w-3 h-3" />
                Text
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={`
            relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
            transition-all duration-200
            ${showAdvancedFilters
              ? 'bg-black dark:bg-white text-white dark:text-black'
              : 'bg-white dark:bg-neutral-900 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-neutral-800'
            }
          `}
        >
          <Filter className="w-4 h-4" />
          Filters
          {getActiveFilterCount() > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 dark:bg-purple-500 text-white text-xs rounded-full flex items-center justify-center">
              {getActiveFilterCount()}
            </span>
          )}
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="mt-2 p-4 bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-800 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Advanced Filters</h3>
            <button
              onClick={clearAllFilters}
              className="text-xs text-gray-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">
                <Tag className="w-3 h-3 inline mr-1" />
                Category
              </label>
              <select
                value={advancedFilters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950 text-gray-900 dark:text-white"
              >
                <option value="">All categories</option>
                <option value="Technical">Technical</option>
                <option value="Billing">Billing</option>
                <option value="Account">Account</option>
                <option value="General">General</option>
                <option value="Complaint">Complaint</option>
                <option value="Feature Request">Feature Request</option>
                <option value="Bug Report">Bug Report</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                Priority
              </label>
              <select
                value={advancedFilters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950 text-gray-900 dark:text-white"
              >
                <option value="">All priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">
                <FileText className="w-3 h-3 inline mr-1" />
                Status
              </label>
              <select
                value={advancedFilters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950 text-gray-900 dark:text-white"
              >
                <option value="">All statuses</option>
                <option value="Selected">Selected</option>
                <option value="Graded">Graded</option>
              </select>
            </div>

            {/* Score Range */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">
                <Target className="w-3 h-3 inline mr-1" />
                Min Score
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={advancedFilters.scoreMin}
                onChange={(e) => handleFilterChange('scoreMin', e.target.value)}
                placeholder="0"
                className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">
                <Target className="w-3 h-3 inline mr-1" />
                Max Score
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={advancedFilters.scoreMax}
                onChange={(e) => handleFilterChange('scoreMax', e.target.value)}
                placeholder="100"
                className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950 text-gray-900 dark:text-white"
              />
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">
                <Calendar className="w-3 h-3 inline mr-1" />
                Date From
              </label>
              <input
                type="date"
                value={advancedFilters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">
                <Calendar className="w-3 h-3 inline mr-1" />
                Date To
              </label>
              <input
                type="date"
                value={advancedFilters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 rounded-lg bg-white dark:bg-neutral-900 border-2 border-black dark:border-white shadow-2xl max-h-96 overflow-y-auto z-50"
        >
          <div className="p-2">
            <div className="flex items-center justify-between px-2 py-1.5 mb-2 border-b border-gray-200 dark:border-neutral-800">
              <span className="text-xs font-semibold text-gray-900 dark:text-white">
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </span>
              {searchMode === 'ai' && (
                <span className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI-powered
                </span>
              )}
            </div>

            {results.map((ticket, index) => (
              <div
                key={ticket._id}
                onClick={() => handleResultClick(ticket)}
                className={`
                  px-3 py-2 mb-1 cursor-pointer transition-all duration-150 rounded-md
                  ${index === selectedIndex
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : 'hover:bg-gray-100 dark:hover:bg-neutral-800'
                  }
                `}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Ticket ID & Relevance */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-mono font-semibold ${index === selectedIndex ? 'text-white dark:text-black' : 'text-gray-900 dark:text-white'}`}>
                        {ticket.ticketId}
                      </span>
                      {ticket.relevanceScore && searchMode === 'ai' && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${index === selectedIndex ? 'bg-white/20 dark:bg-black/20' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'}`}>
                          {ticket.relevanceScore}% match
                        </span>
                      )}
                      <QualityScoreBadge score={ticket.qualityScorePercent} />
                    </div>

                    {/* Agent & Category */}
                    <div className="flex items-center gap-2 mb-1 text-xs">
                      {ticket.agent?.name && (
                        <span className={index === selectedIndex ? 'text-white/80 dark:text-black/80' : 'text-gray-600 dark:text-neutral-400'}>
                          <Users className="w-3 h-3 inline mr-1" />
                          {ticket.agent.name}
                        </span>
                      )}
                      {ticket.category && (
                        <span className={index === selectedIndex ? 'text-white/80 dark:text-black/80' : 'text-gray-600 dark:text-neutral-400'}>
                          • {ticket.category}
                        </span>
                      )}
                      {ticket.priority && (
                        <span className={`${index === selectedIndex ? 'text-white/80 dark:text-black/80' : 'text-gray-600 dark:text-neutral-400'}`}>
                          • {ticket.priority}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {ticket.shortDescription && (
                      <p className={`text-xs line-clamp-2 ${index === selectedIndex ? 'text-white/90 dark:text-black/90' : 'text-gray-700 dark:text-neutral-300'}`}>
                        {ticket.shortDescription}
                      </p>
                    )}

                    {/* Feedback preview */}
                    {ticket.feedback && (
                      <p className={`text-xs line-clamp-1 mt-1 italic ${index === selectedIndex ? 'text-white/70 dark:text-black/70' : 'text-gray-500 dark:text-neutral-500'}`}>
                        Feedback: {ticket.feedback}
                      </p>
                    )}
                  </div>

                  {/* Date */}
                  <div className={`text-xs whitespace-nowrap ${index === selectedIndex ? 'text-white/70 dark:text-black/70' : 'text-gray-500 dark:text-neutral-500'}`}>
                    <Clock className="w-3 h-3 inline mr-1" />
                    {new Date(ticket.dateEntered || ticket.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results Message */}
      {showResults && results.length === 0 && !isSearching && query && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 rounded-lg bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-800 shadow-xl px-4 py-6 text-center z-50"
        >
          <Search className="w-8 h-8 text-gray-400 dark:text-neutral-600 mx-auto mb-2" />
          <p className="text-gray-600 dark:text-neutral-400 text-sm font-medium">No tickets found for "{query}"</p>
          <p className="text-gray-500 dark:text-neutral-500 text-xs mt-1">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
};

export default QASearchBar;
