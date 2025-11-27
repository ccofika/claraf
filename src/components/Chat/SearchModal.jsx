import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, X, Loader2, Hash, User, Calendar, FileText,
  MessageSquare, Image, Link2, Pin, Filter, ChevronDown,
  Clock, ArrowRight, Users, Smile
} from 'lucide-react';
import axios from 'axios';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const SEARCH_HISTORY_KEY = 'clara_search_history';
const MAX_HISTORY_ITEMS = 10;

const SearchModal = ({ isOpen, onClose }) => {
  const { channels, setActiveChannel, scrollToMessage } = useChat();
  const { user } = useAuth();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [fileResults, setFileResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('messages'); // messages, files
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dateRange, setDateRange] = useState({ after: '', before: '' });
  const [hasFilters, setHasFilters] = useState({
    reaction: false,
    file: false,
    link: false,
    pin: false
  });

  // Search history
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // UI state
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef(null);
  const resultsRef = useRef(null);

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading search history:', e);
      }
    }
  }, []);

  // Save search to history
  const saveToHistory = useCallback((query) => {
    if (!query.trim()) return;

    setSearchHistory(prev => {
      const filtered = prev.filter(h => h.query !== query);
      const newHistory = [
        { query, timestamp: Date.now() },
        ...filtered
      ].slice(0, MAX_HISTORY_ITEMS);

      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  // Clear search history
  const clearHistory = useCallback(() => {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
    setSearchHistory([]);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
      setShowHistory(true);
    }
  }, [isOpen]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setFileResults([]);
      setSelectedChannel(null);
      setSelectedUser(null);
      setDateRange({ after: '', before: '' });
      setHasFilters({ reaction: false, file: false, link: false, pin: false });
      setShowFilters(false);
      setActiveTab('messages');
      setCurrentPage(1);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch();
        setShowHistory(false);
      } else if (searchQuery.trim().length === 0) {
        setSearchResults([]);
        setFileResults([]);
        setTotalResults(0);
        setShowHistory(true);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedChannel, selectedUser, dateRange, hasFilters, currentPage, activeTab]);

  // Perform search
  const performSearch = async () => {
    setIsSearching(true);

    try {
      const token = localStorage.getItem('token');
      const params = {
        query: searchQuery,
        page: currentPage,
        limit: 20
      };

      // Add filters
      if (selectedChannel) {
        params.inChannelId = selectedChannel._id;
      }
      if (selectedUser) {
        params.fromUserId = selectedUser._id;
      }
      if (dateRange.after) {
        params.afterDate = dateRange.after;
      }
      if (dateRange.before) {
        params.beforeDate = dateRange.before;
      }
      if (hasFilters.reaction) {
        params.hasReaction = 'true';
      }
      if (hasFilters.file) {
        params.hasFile = 'true';
      }
      if (hasFilters.link) {
        params.hasLink = 'true';
      }
      if (hasFilters.pin) {
        params.isPinned = 'true';
      }

      if (activeTab === 'messages') {
        const response = await axios.get(`${API_URL}/api/chat/search`, {
          params,
          headers: { Authorization: `Bearer ${token}` }
        });

        setSearchResults(response.data.messages || []);
        setTotalResults(response.data.total || 0);
        setTotalPages(response.data.totalPages || 0);
      } else if (activeTab === 'files') {
        const response = await axios.get(`${API_URL}/api/chat/search/files`, {
          params: { query: searchQuery, page: currentPage, limit: 20 },
          headers: { Authorization: `Bearer ${token}` }
        });

        setFileResults(response.data.files || []);
        setTotalResults(response.data.total || 0);
        setTotalPages(response.data.totalPages || 0);
      }

      // Save to history on successful search
      if (searchQuery.trim().length >= 2) {
        saveToHistory(searchQuery);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setFileResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Navigate to message
  const handleNavigateToMessage = async (message) => {
    // Get channel ID
    const channelId = message.channel?._id || message.channel;

    // Close search modal first
    onClose();

    // Use scrollToMessage which handles channel switching and scrolling
    if (scrollToMessage) {
      // scrollToMessage will switch channel if needed and scroll to message
      await scrollToMessage(message._id, channelId);
    } else {
      // Fallback: find channel and set it, then dispatch event
      const channel = channels.find(ch => ch._id === channelId);
      if (channel) {
        setActiveChannel(channel);
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('scrollToMessage', {
            detail: { messageId: message._id, channelId: channelId }
          }));
        }, 300);
      }
    }
  };

  // Handle history item click
  const handleHistoryClick = (historyItem) => {
    setSearchQuery(historyItem.query);
    setShowHistory(false);
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    const results = activeTab === 'messages' ? searchResults : fileResults;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          if (activeTab === 'messages') {
            handleNavigateToMessage(results[selectedIndex]);
          } else {
            // Open file
            window.open(fileResults[selectedIndex].url, '_blank');
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      default:
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // Format time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Highlight match in text
  const highlightMatch = (text, query) => {
    if (!query || !text) return text;

    // Remove modifiers from query for highlighting
    const cleanQuery = query
      .replace(/from:@?\S+/gi, '')
      .replace(/in:#?\S+/gi, '')
      .replace(/before:\S+/gi, '')
      .replace(/after:\S+/gi, '')
      .replace(/has:\S+/gi, '')
      .trim();

    if (!cleanQuery) return text;

    const parts = text.split(new RegExp(`(${cleanQuery})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === cleanQuery.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/50 text-gray-900 dark:text-white px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // Get avatar color
  const getAvatarColor = (id) => {
    const colors = [
      'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
      'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
      'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    ];
    const hash = id?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    return colors[hash % colors.length];
  };

  // Get channel name
  const getChannelDisplayName = (channel) => {
    if (!channel) return 'Unknown';
    if (channel.name) return channel.name;
    if (channel.type === 'dm' && channel.members?.length === 2) {
      const other = channel.members.find(m => m.userId?._id !== user?._id);
      return other?.userId?.name || 'Direct Message';
    }
    return 'Unnamed Channel';
  };

  // Get all users from channels for filter
  const allUsers = React.useMemo(() => {
    const usersMap = new Map();
    channels.forEach(ch => {
      ch.members?.forEach(m => {
        if (m.userId && m.userId._id !== user?._id) {
          usersMap.set(m.userId._id, m.userId);
        }
      });
    });
    return Array.from(usersMap.values());
  }, [channels, user]);

  // Check if any filter is active
  const hasActiveFilters = selectedChannel || selectedUser || dateRange.after || dateRange.before ||
    hasFilters.reaction || hasFilters.file || hasFilters.link || hasFilters.pin;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-3xl bg-white dark:bg-[#1A1D21] rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div className="border-b border-gray-200/60 dark:border-neutral-800/60">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3">
            <Search className="w-5 h-5 text-gray-400 dark:text-neutral-500 flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
                setSelectedIndex(0);
              }}
              placeholder="Search messages... (try: from:@user in:#channel before:yesterday)"
              className="flex-1 bg-transparent border-none focus:outline-none text-[15px] text-gray-900 dark:text-neutral-50 placeholder-gray-400 dark:placeholder-neutral-500"
            />
            {isSearching && (
              <Loader2 className="w-5 h-5 text-gray-400 dark:text-neutral-500 animate-spin flex-shrink-0" />
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 rounded transition-colors flex-shrink-0 ${
                showFilters || hasActiveFilters
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 dark:text-neutral-400'
              }`}
              title="Toggle filters"
            >
              <Filter className="w-4 h-4" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-neutral-400" />
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="px-4 py-3 bg-gray-50 dark:bg-neutral-900/50 border-t border-gray-200/60 dark:border-neutral-800/60">
              <div className="flex flex-wrap gap-3">
                {/* Channel Filter */}
                <div className="relative">
                  <select
                    value={selectedChannel?._id || ''}
                    onChange={(e) => {
                      const ch = channels.find(c => c._id === e.target.value);
                      setSelectedChannel(ch || null);
                      setCurrentPage(1);
                    }}
                    className="appearance-none pl-8 pr-8 py-1.5 text-[13px] bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  >
                    <option value="">All channels</option>
                    {channels.map(ch => (
                      <option key={ch._id} value={ch._id}>
                        {ch.type === 'dm' ? '@ ' : '# '}{getChannelDisplayName(ch)}
                      </option>
                    ))}
                  </select>
                  <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                </div>

                {/* User Filter */}
                <div className="relative">
                  <select
                    value={selectedUser?._id || ''}
                    onChange={(e) => {
                      const u = allUsers.find(u => u._id === e.target.value);
                      setSelectedUser(u || null);
                      setCurrentPage(1);
                    }}
                    className="appearance-none pl-8 pr-8 py-1.5 text-[13px] bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  >
                    <option value="">Anyone</option>
                    {allUsers.map(u => (
                      <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                  </select>
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                </div>

                {/* Date Range */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="date"
                      value={dateRange.after}
                      onChange={(e) => {
                        setDateRange(prev => ({ ...prev, after: e.target.value }));
                        setCurrentPage(1);
                      }}
                      className="pl-8 pr-3 py-1.5 text-[13px] bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                      placeholder="After"
                    />
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <span className="text-gray-400 text-[13px]">to</span>
                  <div className="relative">
                    <input
                      type="date"
                      value={dateRange.before}
                      onChange={(e) => {
                        setDateRange(prev => ({ ...prev, before: e.target.value }));
                        setCurrentPage(1);
                      }}
                      className="pl-8 pr-3 py-1.5 text-[13px] bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                      placeholder="Before"
                    />
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  </div>
                </div>

                {/* Has filters */}
                <div className="flex items-center gap-2">
                  {[
                    { key: 'reaction', icon: Smile, label: 'Reactions' },
                    { key: 'file', icon: FileText, label: 'Files' },
                    { key: 'link', icon: Link2, label: 'Links' },
                    { key: 'pin', icon: Pin, label: 'Pinned' }
                  ].map(({ key, icon: Icon, label }) => (
                    <button
                      key={key}
                      onClick={() => {
                        setHasFilters(prev => ({ ...prev, [key]: !prev[key] }));
                        setCurrentPage(1);
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] rounded-md transition-colors ${
                        hasFilters[key]
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700'
                          : 'bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Clear filters */}
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setSelectedChannel(null);
                      setSelectedUser(null);
                      setDateRange({ after: '', before: '' });
                      setHasFilters({ reaction: false, file: false, link: false, pin: false });
                      setCurrentPage(1);
                    }}
                    className="px-2.5 py-1.5 text-[13px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-center gap-1 px-4 py-2 bg-gray-50 dark:bg-neutral-900/30 border-t border-gray-200/60 dark:border-neutral-800/60">
            <button
              onClick={() => { setActiveTab('messages'); setCurrentPage(1); }}
              className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
                activeTab === 'messages'
                  ? 'bg-white dark:bg-neutral-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 inline mr-1.5" />
              Messages
            </button>
            <button
              onClick={() => { setActiveTab('files'); setCurrentPage(1); }}
              className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
                activeTab === 'files'
                  ? 'bg-white dark:bg-neutral-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 inline mr-1.5" />
              Files
            </button>

            {totalResults > 0 && (
              <span className="ml-auto text-[12px] text-gray-500 dark:text-neutral-500">
                {totalResults} result{totalResults !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto" ref={resultsRef}>
          {/* Search History (when no query) */}
          {showHistory && searchQuery.trim().length === 0 && searchHistory.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-2 flex items-center justify-between">
                <span className="text-[12px] font-semibold text-gray-500 dark:text-neutral-500 uppercase tracking-wide">
                  Recent Searches
                </span>
                <button
                  onClick={clearHistory}
                  className="text-[12px] text-gray-500 dark:text-neutral-500 hover:text-red-600 dark:hover:text-red-400"
                >
                  Clear
                </button>
              </div>
              {searchHistory.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleHistoryClick(item)}
                  className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-neutral-900/50 text-left transition-colors"
                >
                  <Clock className="w-4 h-4 text-gray-400 dark:text-neutral-500 flex-shrink-0" />
                  <span className="text-[14px] text-gray-700 dark:text-neutral-300 truncate flex-1">
                    {item.query}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400 dark:text-neutral-500 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Search Tips (when no query and no history) */}
          {searchQuery.trim().length === 0 && searchHistory.length === 0 && (
            <div className="p-8 text-center">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-neutral-600" />
              <p className="text-[15px] font-medium text-gray-900 dark:text-white mb-2">
                Search messages and files
              </p>
              <p className="text-[13px] text-gray-500 dark:text-neutral-400 mb-4">
                Try using search modifiers:
              </p>
              <div className="text-left max-w-sm mx-auto space-y-2">
                {[
                  { modifier: 'from:@name', desc: 'Messages from a specific person' },
                  { modifier: 'in:#channel', desc: 'Messages in a specific channel' },
                  { modifier: 'before:yesterday', desc: 'Messages before a date' },
                  { modifier: 'after:2024-01-01', desc: 'Messages after a date' },
                  { modifier: 'has:file', desc: 'Messages with files' },
                  { modifier: 'has:link', desc: 'Messages with links' },
                  { modifier: 'has:reaction', desc: 'Messages with reactions' },
                ].map(({ modifier, desc }) => (
                  <div key={modifier} className="flex items-start gap-2">
                    <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-neutral-800 text-[12px] text-gray-700 dark:text-neutral-300 rounded flex-shrink-0">
                      {modifier}
                    </code>
                    <span className="text-[12px] text-gray-500 dark:text-neutral-500">
                      {desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading state */}
          {isSearching && searchQuery.trim().length >= 2 && (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-3 text-gray-400 dark:text-neutral-500 animate-spin" />
              <p className="text-[14px] text-gray-500 dark:text-neutral-400">Searching...</p>
            </div>
          )}

          {/* No results */}
          {!isSearching && searchQuery.trim().length >= 2 &&
            ((activeTab === 'messages' && searchResults.length === 0) ||
             (activeTab === 'files' && fileResults.length === 0)) && (
            <div className="p-8 text-center">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-neutral-600" />
              <p className="text-[15px] font-medium text-gray-900 dark:text-white mb-1">
                No results found
              </p>
              <p className="text-[13px] text-gray-500 dark:text-neutral-400">
                Try different keywords or adjust your filters
              </p>
            </div>
          )}

          {/* Message Results */}
          {activeTab === 'messages' && searchResults.length > 0 && (
            <div>
              {searchResults.map((message, index) => (
                <button
                  key={message._id}
                  onClick={() => handleNavigateToMessage(message)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full px-4 py-3 flex items-start gap-3 text-left transition-colors border-b border-gray-100 dark:border-neutral-900 ${
                    index === selectedIndex
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-neutral-900/50'
                  }`}
                >
                  {/* Avatar */}
                  {message.sender?.avatar ? (
                    <img
                      src={message.sender.avatar}
                      alt={message.sender.name}
                      className="w-9 h-9 rounded-full flex-shrink-0"
                    />
                  ) : (
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold flex-shrink-0 ${getAvatarColor(message.sender?._id)}`}>
                      {message.sender?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[14px] font-semibold text-gray-900 dark:text-white truncate">
                        {message.sender?.name || 'Unknown'}
                      </span>
                      <span className="text-[11px] text-gray-400 dark:text-neutral-500 flex-shrink-0">
                        {formatTime(message.createdAt)}
                      </span>
                      {message.isPinned && (
                        <Pin className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                      )}
                    </div>

                    {/* Channel indicator */}
                    <div className="flex items-center gap-1.5 mb-1">
                      {message.channel?.type === 'dm' ? (
                        <User className="w-3 h-3 text-gray-400 dark:text-neutral-500" />
                      ) : (
                        <Hash className="w-3 h-3 text-gray-400 dark:text-neutral-500" />
                      )}
                      <span className="text-[12px] text-gray-500 dark:text-neutral-500 truncate">
                        {getChannelDisplayName(message.channel)}
                      </span>
                    </div>

                    {/* Message content */}
                    <div className="text-[14px] text-gray-700 dark:text-neutral-300 line-clamp-2">
                      {highlightMatch(message.content, searchQuery)}
                    </div>

                    {/* Indicators */}
                    <div className="flex items-center gap-2 mt-1.5">
                      {message.reactions?.length > 0 && (
                        <span className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-neutral-500">
                          <Smile className="w-3 h-3" />
                          {message.reactions.length}
                        </span>
                      )}
                      {message.metadata?.files?.length > 0 && (
                        <span className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-neutral-500">
                          <FileText className="w-3 h-3" />
                          {message.metadata.files.length} file{message.metadata.files.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Navigate arrow */}
                  <ArrowRight className="w-4 h-4 text-gray-400 dark:text-neutral-500 flex-shrink-0 mt-1" />
                </button>
              ))}
            </div>
          )}

          {/* File Results */}
          {activeTab === 'files' && fileResults.length > 0 && (
            <div>
              {fileResults.map((file, index) => (
                <button
                  key={`${file.messageId}-${file.url}`}
                  onClick={() => window.open(file.url, '_blank')}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors border-b border-gray-100 dark:border-neutral-900 ${
                    index === selectedIndex
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-neutral-900/50'
                  }`}
                >
                  {/* File icon/thumbnail */}
                  {file.type?.startsWith('image/') && file.thumbnailUrl ? (
                    <img
                      src={file.thumbnailUrl || file.url}
                      alt={file.name}
                      className="w-12 h-12 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-gray-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-gray-400 dark:text-neutral-500" />
                    </div>
                  )}

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium text-gray-900 dark:text-white truncate">
                      {highlightMatch(file.name || 'Unnamed file', searchQuery)}
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-gray-500 dark:text-neutral-500">
                      <span>{file.sender?.name}</span>
                      <span>•</span>
                      <span>#{file.channelName}</span>
                      <span>•</span>
                      <span>{formatTime(file.createdAt)}</span>
                    </div>
                  </div>

                  {/* Open arrow */}
                  <ArrowRight className="w-4 h-4 text-gray-400 dark:text-neutral-500 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200/60 dark:border-neutral-800/60 flex items-center justify-between bg-gray-50 dark:bg-neutral-900/30">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-[13px] font-medium bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
            >
              Previous
            </button>
            <span className="text-[13px] text-gray-600 dark:text-neutral-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-[13px] font-medium bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {/* Footer hints */}
        <div className="px-4 py-2 border-t border-gray-200/60 dark:border-neutral-800/60 flex items-center justify-between bg-gray-50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-4 text-[11px] text-gray-500 dark:text-neutral-500">
            <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded text-[10px]">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded text-[10px]">Enter</kbd> Open</span>
            <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded text-[10px]">Esc</kbd> Close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
