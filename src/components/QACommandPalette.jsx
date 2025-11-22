import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Sparkles, X, MessageSquare, Clock, Bookmark, Star,
  TrendingUp, Users, FileText, Target, Tag, Calendar, Filter,
  BarChart3, Download, Archive, RotateCcw, Zap, ChevronRight,
  BookmarkPlus, Trash2
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useQASearchHistory } from '../hooks/useQASearchHistory';
import { useQASavedSearches } from '../hooks/useQASavedSearches';

const QACommandPalette = ({ isOpen, onClose, onTicketSelect, currentFilters }) => {
  const API_URL = process.env.REACT_APP_API_URL;

  // State
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'ai-assistant'
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState('ai'); // 'ai' or 'text'
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // AI Assistant state
  const [messages, setMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiSessionId, setAiSessionId] = useState(null);
  const [aiSessions, setAiSessions] = useState([]);
  const [showSessions, setShowSessions] = useState(false);

  // Saved searches
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');

  // Hooks
  const { searchHistory, addToHistory, getRecentSearches } = useQASearchHistory();
  const { savedSearches, saveSearch, deleteSearch, incrementUsageCount, getPopularSearches } = useQASavedSearches();

  // Refs
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const debounceTimer = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (activeTab === 'search' && query.trim().length > 0) {
      debounceTimer.current = setTimeout(() => {
        performSearch(query);
      }, 300);
    } else {
      setResults([]);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, searchMode, activeTab]);

  // Load AI sessions
  useEffect(() => {
    if (isOpen) {
      loadAiSessions();
    }
  }, [isOpen]);

  const loadAiSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/qa/ai-sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAiSessions(response.data);
    } catch (error) {
      console.error('Error loading AI sessions:', error);
    }
  };

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = searchMode === 'ai' ? '/api/qa/ai-search' : '/api/qa/tickets';

      const params = {
        ...(searchMode === 'ai' ? { query: searchQuery } : { search: searchQuery }),
        ...currentFilters,
        limit: 50
      };

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
      const ticketsArray = Array.isArray(ticketData) ? ticketData : [];
      setResults(ticketsArray);
      setSelectedIndex(0);

      // Add to history
      addToHistory(searchQuery, currentFilters, ticketsArray.length);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAiMessage = async () => {
    if (!aiInput.trim()) return;

    const userMessage = {
      role: 'user',
      content: aiInput,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setAiInput('');
    setIsAiThinking(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/qa/ai-assistant`,
        {
          message: aiInput,
          conversationHistory: messages,
          sessionId: aiSessionId,
          currentFilters
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { reply, searchResults, sessionId, suggestedFilters } = response.data;

      const assistantMessage = {
        role: 'assistant',
        content: reply,
        searchResults: searchResults || [],
        suggestedFilters: suggestedFilters || {},
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (sessionId && !aiSessionId) {
        setAiSessionId(sessionId);
        loadAiSessions();
      }
    } catch (error) {
      console.error('AI assistant error:', error);
      toast.error('AI assistant failed');
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleKeyDown = (e) => {
    if (activeTab === 'ai-assistant') {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleAiMessage();
      }
      return;
    }

    // Search tab keyboard navigation
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      handleResultClick(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (query) {
        setShowSaveDialog(true);
      }
    }
  };

  const handleResultClick = (ticket) => {
    onTicketSelect?.(ticket);
    onClose();
  };

  const handleSavedSearchClick = (search) => {
    setQuery(search.query);
    setSearchMode(search.searchMode);
    incrementUsageCount(search.id);
    performSearch(search.query);
  };

  const handleSaveCurrentSearch = () => {
    if (!saveSearchName.trim() || !query.trim()) {
      toast.error('Please provide a name for your saved search');
      return;
    }

    saveSearch(saveSearchName, query, currentFilters, searchMode);
    toast.success('Search saved successfully');
    setShowSaveDialog(false);
    setSaveSearchName('');
  };

  const loadAiSession = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/qa/ai-sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data.messages || []);
      setAiSessionId(sessionId);
      setShowSessions(false);
      setActiveTab('ai-assistant');
    } catch (error) {
      console.error('Error loading session:', error);
      toast.error('Failed to load session');
    }
  };

  const deleteAiSession = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/qa/ai-sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAiSessions(prev => prev.filter(s => s._id !== sessionId));
      toast.success('Session deleted');
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    }
  };

  const QualityScoreBadge = ({ score }) => {
    if (score === null || score === undefined) {
      return <span className="text-xs text-gray-500 dark:text-neutral-500">Not graded</span>;
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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 animate-fadeIn"
        onClick={onClose}
      />

      {/* Command Palette */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 pointer-events-none">
        <div
          className="w-full max-w-3xl bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border-2 border-gray-200 dark:border-neutral-800 flex flex-col max-h-[80vh] pointer-events-auto animate-slideDown"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-2 p-3 border-b border-gray-200 dark:border-neutral-800">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-neutral-800 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('search')}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                  ${activeTab === 'search'
                    ? 'bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                <Search className="w-4 h-4" />
                Search
              </button>
              <button
                onClick={() => setActiveTab('ai-assistant')}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                  ${activeTab === 'ai-assistant'
                    ? 'bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                <Sparkles className="w-4 h-4" />
                AI Assistant
              </button>
            </div>

            <div className="flex-1" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
            </button>
          </div>

          {/* Content */}
          {activeTab === 'search' ? (
            <>
              {/* Search Input */}
              <div className="p-3 border-b border-gray-200 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  {searchMode === 'ai' ? (
                    <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  ) : (
                    <Search className="w-5 h-5 text-gray-600 dark:text-neutral-400" />
                  )}
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Search tickets... (${searchMode === 'ai' ? 'AI-powered' : 'Text search'})`}
                    className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-neutral-400 outline-none text-base"
                  />
                  {isSearching && (
                    <div className="w-5 h-5 border-2 border-gray-300 dark:border-neutral-600 border-t-black dark:border-t-white rounded-full animate-spin" />
                  )}
                  {query && (
                    <button
                      onClick={() => setQuery('')}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-neutral-800 rounded-md p-0.5">
                    <button
                      onClick={() => setSearchMode('ai')}
                      className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                        searchMode === 'ai'
                          ? 'bg-purple-600 dark:bg-purple-500 text-white'
                          : 'text-gray-600 dark:text-neutral-400'
                      }`}
                    >
                      AI
                    </button>
                    <button
                      onClick={() => setSearchMode('text')}
                      className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                        searchMode === 'text'
                          ? 'bg-black dark:bg-white text-white dark:text-black'
                          : 'text-gray-600 dark:text-neutral-400'
                      }`}
                    >
                      Text
                    </button>
                  </div>
                  {query && (
                    <button
                      onClick={() => setShowSaveDialog(true)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
                      title="Save search (Ctrl+S)"
                    >
                      <BookmarkPlus className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Results */}
              <div ref={resultsRef} className="flex-1 overflow-y-auto">
                {/* Show recent/saved searches when no query */}
                {!query && (
                  <div className="p-4 space-y-6">
                    {/* Saved Searches */}
                    {savedSearches.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Bookmark className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Saved Searches</h3>
                        </div>
                        <div className="space-y-1">
                          {getPopularSearches(5).map((search) => (
                            <div
                              key={search.id}
                              className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg cursor-pointer group"
                            >
                              <button
                                onClick={() => handleSavedSearchClick(search)}
                                className="flex-1 flex items-center gap-2 text-left"
                              >
                                <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-500" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">{search.name}</p>
                                  <p className="text-xs text-gray-500 dark:text-neutral-500">{search.query}</p>
                                </div>
                                {search.usageCount > 0 && (
                                  <span className="text-xs text-gray-500 dark:text-neutral-500">
                                    Used {search.usageCount}x
                                  </span>
                                )}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSearch(search.id);
                                  toast.success('Search deleted');
                                }}
                                className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent Searches */}
                    {getRecentSearches(5).length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Searches</h3>
                        </div>
                        <div className="space-y-1">
                          {getRecentSearches(5).map((item) => (
                            <button
                              key={item.timestamp}
                              onClick={() => setQuery(item.query)}
                              className="w-full flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg text-left"
                            >
                              <div className="flex-1">
                                <p className="text-sm text-gray-900 dark:text-white">{item.query}</p>
                                <p className="text-xs text-gray-500 dark:text-neutral-500">
                                  {item.results} result{item.results !== 1 ? 's' : ''}
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Search Results */}
                {query && results.length > 0 && (
                  <div className="p-2">
                    <div className="px-2 py-1.5 mb-2 text-xs text-gray-600 dark:text-neutral-400">
                      {results.length} result{results.length !== 1 ? 's' : ''} found
                    </div>
                    {results.map((ticket, index) => (
                      <div
                        key={ticket._id}
                        onClick={() => handleResultClick(ticket)}
                        className={`
                          px-3 py-2.5 mb-1 cursor-pointer transition-all rounded-lg
                          ${index === selectedIndex
                            ? 'bg-black dark:bg-white text-white dark:text-black'
                            : 'hover:bg-gray-100 dark:hover:bg-neutral-800'
                          }
                        `}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-sm font-mono font-semibold ${index === selectedIndex ? 'text-white dark:text-black' : 'text-gray-900 dark:text-white'}`}>
                                {ticket.ticketId}
                              </span>
                              {ticket.relevanceScore && searchMode === 'ai' && (
                                <span className={`text-xs px-1.5 py-0.5 rounded ${index === selectedIndex ? 'bg-white/20 dark:bg-black/20' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'}`}>
                                  {ticket.relevanceScore}% match
                                </span>
                              )}
                              <QualityScoreBadge score={ticket.qualityScorePercent} />
                            </div>
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
                            </div>
                            {ticket.shortDescription && (
                              <p className={`text-sm line-clamp-2 ${index === selectedIndex ? 'text-white/90 dark:text-black/90' : 'text-gray-700 dark:text-neutral-300'}`}>
                                {ticket.shortDescription}
                              </p>
                            )}
                          </div>
                          <div className={`text-xs whitespace-nowrap ${index === selectedIndex ? 'text-white/70 dark:text-black/70' : 'text-gray-500 dark:text-neutral-500'}`}>
                            <Clock className="w-3 h-3 inline mr-1" />
                            {new Date(ticket.dateEntered || ticket.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No Results */}
                {query && results.length === 0 && !isSearching && (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <Search className="w-12 h-12 text-gray-400 dark:text-neutral-600 mb-3" />
                    <p className="text-gray-600 dark:text-neutral-400 text-sm font-medium">
                      No tickets found for "{query}"
                    </p>
                    <p className="text-gray-500 dark:text-neutral-500 text-xs mt-1">
                      Try adjusting your search or use different keywords
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* AI Assistant Tab */
            <>
              {showSessions ? (
                /* Sessions List */
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AI Sessions</h3>
                    <button
                      onClick={() => setShowSessions(false)}
                      className="text-xs text-gray-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                    >
                      Back to chat
                    </button>
                  </div>
                  <div className="space-y-2">
                    {aiSessions.map((session) => (
                      <div
                        key={session._id}
                        className="flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg group"
                      >
                        <button
                          onClick={() => loadAiSession(session._id)}
                          className="flex-1 text-left"
                        >
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {session.title || 'Untitled Session'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-neutral-500">
                            {new Date(session.lastMessageAt || session.createdAt).toLocaleString()} • {session.messages?.length || 0} messages
                          </p>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAiSession(session._id);
                          }}
                          className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    ))}
                    {aiSessions.length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-neutral-500 text-sm">
                        No saved sessions yet
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Chat Interface */
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
                          <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                          QA AI Assistant
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-neutral-400 max-w-md">
                          Ask me anything about your tickets, agents, or quality metrics. I can help you find information, analyze performance, and provide insights.
                        </p>
                        <div className="mt-6 grid grid-cols-2 gap-2 max-w-md">
                          {[
                            'Show me low-scoring tickets',
                            'Analyze agent performance',
                            'Find tickets from this week',
                            'What are common feedback themes?'
                          ].map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => setAiInput(suggestion)}
                              className="p-2 text-xs text-left bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        {messages.map((message, idx) => (
                          <div key={idx} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] ${message.role === 'user' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white'} rounded-lg p-3`}>
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              {message.searchResults && message.searchResults.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-white/20 dark:border-black/20 space-y-2">
                                  <p className="text-xs opacity-70">Related tickets:</p>
                                  {message.searchResults.slice(0, 3).map((ticket) => (
                                    <button
                                      key={ticket._id}
                                      onClick={() => handleResultClick(ticket)}
                                      className="w-full p-2 bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 rounded text-left transition-colors"
                                    >
                                      <p className="text-xs font-mono">{ticket.ticketId}</p>
                                      <p className="text-xs opacity-70 line-clamp-1">{ticket.shortDescription}</p>
                                    </button>
                                  ))}
                                </div>
                              )}
                              <p className="text-xs opacity-50 mt-2">
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        {isAiThinking && (
                          <div className="flex justify-start">
                            <div className="bg-gray-100 dark:bg-neutral-800 rounded-lg p-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gray-600 dark:bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-gray-600 dark:bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-gray-600 dark:bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Input */}
                  <div className="p-3 border-t border-gray-200 dark:border-neutral-800">
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => setShowSessions(true)}
                        className="text-xs text-gray-600 dark:text-neutral-400 hover:text-black dark:hover:text-white flex items-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Sessions ({aiSessions.length})
                      </button>
                      {messages.length > 0 && (
                        <button
                          onClick={() => {
                            setMessages([]);
                            setAiSessionId(null);
                          }}
                          className="text-xs text-gray-600 dark:text-neutral-400 hover:text-black dark:hover:text-white flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          New Chat
                        </button>
                      )}
                    </div>
                    <div className="flex items-end gap-2">
                      <textarea
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask me anything about your QA data..."
                        rows={2}
                        className="flex-1 px-3 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white rounded-lg resize-none outline-none text-sm"
                      />
                      <button
                        onClick={handleAiMessage}
                        disabled={!aiInput.trim() || isAiThinking}
                        className="p-2.5 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Sparkles className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-neutral-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded">Enter</kbd>
                  Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded">Esc</kbd>
                  Close
                </span>
              </div>
              {activeTab === 'search' && query && (
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded">Ctrl+S</kbd>
                  Save search
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 max-w-md w-full border-2 border-gray-200 dark:border-neutral-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Save Search</h3>
            <input
              type="text"
              value={saveSearchName}
              onChange={(e) => setSaveSearchName(e.target.value)}
              placeholder="Enter a name for this search..."
              className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-950 text-gray-900 dark:text-white mb-4"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setSaveSearchName('');
                }}
                className="px-4 py-2 text-sm text-gray-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCurrentSearch}
                className="px-4 py-2 text-sm bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QACommandPalette;
