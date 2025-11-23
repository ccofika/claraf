import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { Search, Plus, ChevronLeft, ChevronRight, Hash, User, Users, Archive } from 'lucide-react';
import CreateChannelModal from './CreateChannelModal';

const ChatSidebar = ({ isCollapsed, onToggleCollapse }) => {
  const { channels, activeChannel, setActiveChannel, totalUnreadCount, getUnreadCount } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, dms, groups, unread
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filter channels based on search and filter type
  const filteredChannels = channels.filter(channel => {
    // Search filter
    const matchesSearch = channel.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      channel.members?.some(m => m.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Archived filter
    if (filter === 'archived') return channel.isArchived === true;

    // For other filters, exclude archived channels
    if (channel.isArchived) return false;

    // Type filter
    if (filter === 'dms') return channel.type === 'dm';
    if (filter === 'groups') return channel.type === 'group';
    if (filter === 'unread') return getUnreadCount(channel._id) > 0;

    return true;
  });

  // Group channels by type
  const dmChannels = filteredChannels.filter(ch => ch.type === 'dm');
  const groupChannels = filteredChannels.filter(ch => ch.type === 'group');
  const workspaceChannels = filteredChannels.filter(ch => ch.type === 'workspace');
  const qaChannels = filteredChannels.filter(ch => ch.type === 'qa');

  const getChannelIcon = (channel) => {
    if (channel.type === 'dm') return <User className="w-4 h-4" />;
    if (channel.type === 'group') return <Users className="w-4 h-4" />;
    if (channel.type === 'workspace') return <Hash className="w-4 h-4" />;
    if (channel.type === 'qa') return <Archive className="w-4 h-4" />;
    return <Hash className="w-4 h-4" />;
  };

  const getChannelName = (channel) => {
    if (channel.name) return channel.name;

    // For DMs, show other user's name
    if (channel.type === 'dm' && channel.members?.length === 2) {
      const otherMember = channel.members.find(m => m.userId._id !== channel._id);
      return otherMember?.userId?.name || 'Unknown User';
    }

    return 'Unnamed Channel';
  };

  const formatLastMessage = (channel) => {
    if (!channel.lastMessage?.content) return 'No messages yet';

    const maxLength = 40;
    const content = channel.lastMessage.content;
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const ChannelItem = ({ channel }) => {
    const isActive = activeChannel?._id === channel._id;
    const unreadCount = getUnreadCount(channel._id);

    return (
      <button
        onClick={() => setActiveChannel(channel)}
        className={`w-full px-2 py-1 flex items-center gap-2 transition-colors ${
          isActive
            ? 'bg-[#1164A3] dark:bg-[#1164A3] text-white'
            : 'text-gray-900 dark:text-[#D1D2D3] hover:bg-gray-100 dark:hover:bg-[#1A1D21]'
        }`}
      >
        <div className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-600 dark:text-neutral-400'}`}>
          {getChannelIcon(channel)}
        </div>

        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-[15px] truncate ${
              isActive ? 'text-white font-bold' : 'font-normal'
            } ${unreadCount > 0 && !isActive ? 'font-bold' : ''}`}>
              {getChannelName(channel)}
            </span>
            {channel.lastMessage?.timestamp && (
              <span className={`text-[11px] flex-shrink-0 ${
                isActive ? 'text-white/80' : 'text-gray-500 dark:text-neutral-500'
              }`}>
                {formatTime(channel.lastMessage.timestamp)}
              </span>
            )}
          </div>

          {channel.lastMessage?.content && (
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <span className={`text-[13px] truncate ${
                isActive ? 'text-white/90' : 'text-gray-600 dark:text-neutral-400'
              }`}>
                {formatLastMessage(channel)}
              </span>
              {unreadCount > 0 && (
                <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[11px] font-bold ${
                  isActive
                    ? 'bg-white text-[#1164A3]'
                    : 'bg-[#E01E5A] text-white'
                }`}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
          )}
        </div>
      </button>
    );
  };

  const ChannelSection = ({ title, channels, showCount = false }) => {
    if (channels.length === 0) return null;

    return (
      <div className="mb-3">
        <div className="px-2 py-1 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-gray-600 dark:text-neutral-400">
            {title}
          </span>
        </div>
        <div>
          {channels.map(channel => (
            <ChannelItem key={channel._id} channel={channel} />
          ))}
        </div>
      </div>
    );
  };

  if (isCollapsed) {
    return (
      <div className="w-16 bg-white dark:bg-[#1A1D21] border-r border-gray-200/60 dark:border-neutral-800/60 flex flex-col">
        <div className="h-14 flex items-center justify-center border-b border-gray-200/60 dark:border-neutral-800/60">
          <button
            onClick={onToggleCollapse}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-neutral-400" />
          </button>
        </div>

        {totalUnreadCount > 0 && (
          <div className="px-3 py-2">
            <div className="w-10 h-10 rounded-full bg-[#E01E5A] text-white flex items-center justify-center text-[11px] font-bold">
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="w-80 bg-white dark:bg-[#1A1D21] border-r border-gray-200/60 dark:border-neutral-800/60 flex flex-col">
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-gray-200/60 dark:border-neutral-800/60">
          <h1 className="text-[18px] font-bold text-gray-900 dark:text-white">Messages</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors"
              title="New conversation"
            >
              <Plus className="w-[18px] h-[18px] text-gray-600 dark:text-neutral-400" />
            </button>
            <button
              onClick={onToggleCollapse}
              className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-[18px] h-[18px] text-gray-600 dark:text-neutral-400" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-gray-200/60 dark:border-neutral-800/60">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-neutral-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-neutral-900/50 border border-gray-300 dark:border-neutral-700 text-[15px] text-gray-900 dark:text-neutral-50 placeholder-gray-500 dark:placeholder-neutral-500 focus:outline-none focus:border-[#1164A3] dark:focus:border-[#1164A3]"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-2 py-2 border-b border-gray-200/60 dark:border-neutral-800/60 flex justify-center gap-0.5">
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: 'Unread' },
            { id: 'dms', label: 'DMs' },
            { id: 'groups', label: 'Groups' },
            { id: 'archived', label: 'Archived' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex-shrink-0 px-2.5 py-1 text-[13px] font-medium transition-colors ${
                filter === tab.id
                  ? 'text-gray-900 dark:text-white border-b-2 border-[#1164A3]'
                  : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
              {tab.id === 'unread' && totalUnreadCount > 0 && (
                <span className="ml-1">({totalUnreadCount})</span>
              )}
            </button>
          ))}
        </div>

        {/* Channel List */}
        <div className="flex-1 overflow-y-auto py-2">
          {filteredChannels.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-[15px] text-gray-500 dark:text-neutral-400">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </p>
            </div>
          ) : (
            <>
              <ChannelSection title="Direct Messages" channels={dmChannels} showCount />
              <ChannelSection title="Group Chats" channels={groupChannels} showCount />
              <ChannelSection title="Workspace Channels" channels={workspaceChannels} showCount />
              <ChannelSection title="QA Tickets" channels={qaChannels} showCount />
            </>
          )}
        </div>
      </div>

      {/* Create Channel Modal */}
      {showCreateModal && (
        <CreateChannelModal onClose={() => setShowCreateModal(false)} />
      )}
    </>
  );
};

export default ChatSidebar;
