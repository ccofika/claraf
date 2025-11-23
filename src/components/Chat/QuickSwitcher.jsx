import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '../../context/ChatContext';
import { Search, Hash, User, Users, Clock, Star, X } from 'lucide-react';
import PresenceIndicator from './PresenceIndicator';

/**
 * QuickSwitcher - Slack-style quick channel/DM switcher
 * Triggered by Ctrl+K (Cmd+K on Mac)
 *
 * Features:
 * - Multi-word search in any order
 * - Recent channels shown first
 * - Keyboard navigation (arrow keys, Enter)
 * - Shows unread badges
 * - Shows presence status
 */
const QuickSwitcher = ({ isOpen, onClose }) => {
  const {
    channels,
    setActiveChannel,
    getUnreadCount,
    recentChannels = []
  } = useChat();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Filter and rank channels
  const filteredChannels = React.useMemo(() => {
    if (!query.trim()) {
      // Show recent channels first when no query
      return recentChannels.slice(0, 10);
    }

    // Multi-word search: split query into words
    const queryWords = query.toLowerCase().split(/\s+/).filter(Boolean);

    const scored = channels
      .map(channel => {
        const name = getChannelName(channel).toLowerCase();
        const members = channel.members?.map(m => m.userId?.name?.toLowerCase()).join(' ') || '';
        const searchText = `${name} ${members}`;

        // Score based on how many words match
        let score = 0;
        let matchedWords = 0;

        queryWords.forEach(word => {
          if (name.includes(word)) {
            score += 100; // Exact name match gets highest score
            matchedWords++;
          } else if (name.startsWith(word)) {
            score += 50; // Starts with gets medium score
            matchedWords++;
          } else if (searchText.includes(word)) {
            score += 10; // Member name match gets low score
            matchedWords++;
          }
        });

        // Bonus for matching all words
        if (matchedWords === queryWords.length) {
          score += 200;
        }

        // Bonus for recent channels
        const recentIndex = recentChannels.findIndex(rc => rc._id === channel._id);
        if (recentIndex !== -1) {
          score += (10 - recentIndex) * 5;
        }

        // Bonus for unread
        if (getUnreadCount(channel._id) > 0) {
          score += 20;
        }

        return { channel, score, matchedWords };
      })
      .filter(item => item.matchedWords > 0 || !query.trim())
      .sort((a, b) => b.score - a.score);

    return scored.map(item => item.channel).slice(0, 20);
  }, [query, channels, recentChannels, getUnreadCount]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredChannels]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && filteredChannels.length > 0) {
      const selectedElement = listRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex, filteredChannels]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredChannels.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
        break;

      case 'Enter':
        e.preventDefault();
        if (filteredChannels[selectedIndex]) {
          selectChannel(filteredChannels[selectedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        onClose();
        break;

      default:
        break;
    }
  }, [isOpen, selectedIndex, filteredChannels, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const selectChannel = (channel) => {
    setActiveChannel(channel);
    setQuery('');
    onClose();
  };

  const getChannelIcon = (channel) => {
    if (channel.type === 'dm') return <User className="w-4 h-4" />;
    if (channel.type === 'group') return <Users className="w-4 h-4" />;
    return <Hash className="w-4 h-4" />;
  };

  const getChannelName = (channel) => {
    if (channel.name) return channel.name;
    if (channel.type === 'dm' && channel.members?.length === 2) {
      const otherMember = channel.members.find(m => m.userId._id !== channel._id);
      return otherMember?.userId?.name || 'Unknown User';
    }
    return 'Unnamed Channel';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] pointer-events-none">
        <div
          className="bg-white dark:bg-[#1A1D21] rounded-lg shadow-2xl w-full max-w-2xl pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="relative border-b border-gray-200 dark:border-neutral-800">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-neutral-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Jump to a channel or direct message..."
              className="w-full pl-12 pr-12 py-4 bg-transparent text-[16px] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-neutral-500 focus:outline-none"
            />
            <button
              onClick={onClose}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-400 dark:text-neutral-500" />
            </button>
          </div>

          {/* Results List */}
          <div
            ref={listRef}
            className="max-h-[60vh] overflow-y-auto"
          >
            {filteredChannels.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[15px] text-gray-500 dark:text-neutral-400">
                  {query ? 'No channels or direct messages found' : 'Start typing to search...'}
                </p>
              </div>
            ) : (
              <>
                {!query && recentChannels.length > 0 && (
                  <div className="px-4 pt-3 pb-1">
                    <span className="text-[12px] font-semibold text-gray-500 dark:text-neutral-500 uppercase tracking-wide">
                      Recent
                    </span>
                  </div>
                )}

                {filteredChannels.map((channel, index) => {
                  const isSelected = index === selectedIndex;
                  const unreadCount = getUnreadCount(channel._id);
                  const isRecent = recentChannels.some(rc => rc._id === channel._id);

                  return (
                    <button
                      key={channel._id}
                      onClick={() => selectChannel(channel)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors ${
                        isSelected
                          ? 'bg-[#1164A3] text-white'
                          : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {/* Icon */}
                      <div className={`flex-shrink-0 ${
                        isSelected ? 'text-white' : 'text-gray-600 dark:text-neutral-400'
                      }`}>
                        {getChannelIcon(channel)}
                      </div>

                      {/* Presence (for DMs) */}
                      {channel.type === 'dm' && channel.members?.length === 2 && (
                        <div className="flex-shrink-0 -ml-1">
                          <PresenceIndicator
                            userId={channel.members.find(m => m.userId._id !== channel._id)?.userId._id}
                            size="sm"
                          />
                        </div>
                      )}

                      {/* Name */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <span className={`text-[15px] truncate ${
                            unreadCount > 0 ? 'font-bold' : 'font-normal'
                          }`}>
                            {getChannelName(channel)}
                          </span>

                          {isRecent && !query && (
                            <Clock className={`w-3 h-3 flex-shrink-0 ${
                              isSelected ? 'text-white/70' : 'text-gray-400 dark:text-neutral-500'
                            }`} />
                          )}
                        </div>
                      </div>

                      {/* Unread Badge */}
                      {unreadCount > 0 && (
                        <span className={`flex-shrink-0 px-2 py-0.5 rounded text-[11px] font-bold ${
                          isSelected
                            ? 'bg-white text-[#1164A3]'
                            : 'bg-[#E01E5A] text-white'
                        }`}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </>
            )}
          </div>

          {/* Footer Hint */}
          <div className="px-4 py-2 border-t border-gray-200 dark:border-neutral-800 flex items-center justify-between bg-gray-50 dark:bg-neutral-900/50">
            <div className="flex items-center gap-4 text-[12px] text-gray-500 dark:text-neutral-500">
              <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded text-[10px]">↑↓</kbd> Navigate</span>
              <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded text-[10px]">Enter</kbd> Select</span>
              <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded text-[10px]">Esc</kbd> Close</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuickSwitcher;
