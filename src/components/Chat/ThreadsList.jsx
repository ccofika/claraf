import React, { useState, useEffect, useCallback } from 'react';
import { useChat } from '../../context/ChatContext';
import { MessageSquare, Hash, User, Users, Loader2, RefreshCw, Bell, BellOff } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ThreadsList = () => {
  const { setActiveChannel, setThreadMessage, channels } = useChat();
  const [threads, setThreads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState(null);

  // Fetch threads
  const fetchThreads = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      const { data } = await axios.get(`${API_URL}/api/chat/threads`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setThreads(data.threads || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Error fetching threads:', err);
      setError('Failed to load threads');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // Toggle thread follow
  const handleToggleFollow = async (e, threadId, currentFollowing) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/chat/messages/${threadId}/thread/follow`,
        { follow: !currentFollowing },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setThreads(prev => prev.map(t =>
        t._id === threadId ? { ...t, isFollowing: !currentFollowing } : t
      ));
    } catch (err) {
      console.error('Error toggling thread follow:', err);
    }
  };

  // Open thread
  const handleOpenThread = (thread) => {
    // Find the channel
    const channel = channels.find(ch => ch._id === (thread.channel?._id || thread.channel));

    if (channel) {
      setActiveChannel(channel);
    }

    // Open thread panel
    setThreadMessage(thread);
  };

  // Format relative time
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get channel icon
  const getChannelIcon = (channel) => {
    if (!channel) return <Hash className="w-3.5 h-3.5" />;
    if (channel.type === 'dm') return <User className="w-3.5 h-3.5" />;
    if (channel.type === 'group') return <Users className="w-3.5 h-3.5" />;
    return <Hash className="w-3.5 h-3.5" />;
  };

  // Generate avatar color
  const getAvatarColor = (id) => {
    const colors = [
      'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
      'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    ];
    const hash = id?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    return colors[hash % colors.length];
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-8 px-4">
        <p className="text-[13px] text-red-500 mb-3">{error}</p>
        <button
          onClick={fetchThreads}
          className="flex items-center gap-2 px-3 py-1.5 text-[13px] text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-8 px-4">
        <MessageSquare className="w-10 h-10 text-gray-300 dark:text-neutral-700 mb-3" />
        <p className="text-[15px] font-medium text-gray-900 dark:text-neutral-100 mb-1">
          No threads yet
        </p>
        <p className="text-[13px] text-gray-500 dark:text-neutral-500 text-center">
          Start a thread by replying to a message
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header with unread count */}
      <div className="px-4 py-3 border-b border-gray-200/60 dark:border-neutral-800/60">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-gray-600 dark:text-neutral-400">
            {threads.length} thread{threads.length !== 1 ? 's' : ''}
          </span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-[#E01E5A] text-white text-[11px] font-bold rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>
      </div>

      {/* Threads list */}
      <div className="py-1">
        {threads.map((thread) => (
          <button
            key={thread._id}
            onClick={() => handleOpenThread(thread)}
            className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors border-b border-gray-100 dark:border-neutral-800/50 ${
              thread.hasUnread ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
            }`}
          >
            {/* Thread starter info */}
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 ${getAvatarColor(thread.sender?._id)}`}>
                {thread.sender?.name?.charAt(0).toUpperCase() || '?'}
              </div>

              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[14px] font-semibold text-gray-900 dark:text-neutral-100 truncate">
                      {thread.sender?.name || 'Unknown'}
                    </span>
                    {thread.hasUnread && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-500 dark:text-neutral-500 flex-shrink-0">
                      {formatRelativeTime(thread.lastReplyAt || thread.createdAt)}
                    </span>
                    {/* Follow/Unfollow button */}
                    <button
                      onClick={(e) => handleToggleFollow(e, thread._id, thread.isFollowing)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition-colors"
                      title={thread.isFollowing ? 'Unfollow thread' : 'Follow thread'}
                    >
                      {thread.isFollowing ? (
                        <Bell className="w-3.5 h-3.5 text-blue-500" />
                      ) : (
                        <BellOff className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Message content preview */}
                <p className="text-[13px] text-gray-600 dark:text-neutral-400 line-clamp-2 mb-2">
                  {thread.content}
                </p>

                {/* Thread meta */}
                <div className="flex items-center gap-3">
                  {/* Channel info */}
                  <div className="flex items-center gap-1.5 text-[12px] text-gray-500 dark:text-neutral-500">
                    {getChannelIcon(thread.channel)}
                    <span className="truncate max-w-[100px]">
                      {thread.channel?.name || 'Channel'}
                    </span>
                  </div>

                  {/* Reply count */}
                  <div className="flex items-center gap-1.5 text-[12px] text-[#1264A3] dark:text-blue-400 font-medium">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{thread.replyCount} {thread.replyCount === 1 ? 'reply' : 'replies'}</span>
                  </div>

                  {/* Participants */}
                  {thread.threadParticipants?.length > 0 && (
                    <div className="flex -space-x-1.5">
                      {thread.threadParticipants.slice(0, 3).map((p, idx) => (
                        <div
                          key={p._id || idx}
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border-2 border-white dark:border-[#1A1D21] ${getAvatarColor(p._id)}`}
                          title={p.name}
                        >
                          {p.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                      ))}
                      {thread.threadParticipants.length > 3 && (
                        <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-neutral-700 flex items-center justify-center text-[9px] font-bold text-gray-600 dark:text-neutral-400 border-2 border-white dark:border-[#1A1D21]">
                          +{thread.threadParticipants.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThreadsList;
