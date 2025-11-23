import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useChat } from '../../context/ChatContext';

const SearchModal = ({ isOpen, onClose }) => {
  const { activeChannel } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeChannel]);

  const performSearch = async () => {
    if (!searchQuery.trim() || !activeChannel) return;

    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/chat/search`,
        {
          params: {
            query: searchQuery,
            channelId: activeChannel._id,
            limit: 20
          },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSearchResults(response.data || []);
    } catch (error) {
      console.error('❌ Error searching messages:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/50 text-gray-900 dark:text-white">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // Generate soft avatar color based on user ID
  const getAvatarColor = (userId) => {
    const colors = [
      'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
      'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
      'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    ];
    const hash = userId?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    return colors[hash % colors.length];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60" onClick={onClose}>
      <div className="w-full max-w-2xl bg-white dark:bg-[#1A1D21] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200/60 dark:border-neutral-800/60 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400 dark:text-neutral-500" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="flex-1 bg-transparent border-none focus:outline-none text-[15px] text-gray-900 dark:text-neutral-50 placeholder-gray-500 dark:placeholder-neutral-500"
          />
          {isSearching && (
            <Loader2 className="w-5 h-5 text-gray-400 dark:text-neutral-500 animate-spin" />
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-neutral-400" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[28rem] overflow-y-auto">
          {searchQuery.trim().length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-neutral-400">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-[15px]">Type to search messages...</p>
            </div>
          ) : searchResults.length === 0 && !isSearching ? (
            <div className="p-12 text-center text-gray-500 dark:text-neutral-400">
              <p className="text-[15px]">No messages found</p>
            </div>
          ) : (
            <div>
              {searchResults.map((message) => (
                <div
                  key={message._id}
                  className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#1A1D21] transition-colors cursor-pointer border-b border-gray-100 dark:border-neutral-900"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0 ${getAvatarColor(message.sender?._id)}`}>
                      {message.sender?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[14px] font-semibold text-gray-900 dark:text-neutral-50">
                          {message.sender?.name}
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-neutral-500">
                          {formatTime(message.createdAt)}
                        </span>
                      </div>
                      <div className="text-[15px] text-gray-700 dark:text-neutral-300">
                        {highlightMatch(message.content, searchQuery)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
