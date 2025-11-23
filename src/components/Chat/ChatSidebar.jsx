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
        className={`w-full px-3 py-2 flex items-center gap-3 rounded-lg transition-all ${
          isActive
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800'
        }`}
      >
        <div className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 dark:text-neutral-400'}`}>
          {getChannelIcon(channel)}
        </div>

        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className={`text-sm font-semibold truncate ${isActive ? 'text-white' : ''}`}>
              {getChannelName(channel)}
            </span>
            {channel.lastMessage?.timestamp && (
              <span className={`text-xs flex-shrink-0 ${
                isActive ? 'text-blue-200' : 'text-gray-500 dark:text-neutral-500'
              }`}>
                {formatTime(channel.lastMessage.timestamp)}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs truncate ${
              isActive ? 'text-blue-100' : 'text-gray-500 dark:text-neutral-400'
            }`}>
              {formatLastMessage(channel)}
            </span>
            {unreadCount > 0 && (
              <span className={`flex-shrink-0 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                isActive
                  ? 'bg-white text-blue-600'
                  : 'bg-blue-600 text-white'
              }`}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  const ChannelSection = ({ title, channels, showCount = false }) => {
    if (channels.length === 0) return null;

    return (
      <div className="mb-4">
        <div className="px-3 mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
            {title} {showCount && `(${channels.length})`}
          </span>
        </div>
        <div className="space-y-1">
          {channels.map(channel => (
            <ChannelItem key={channel._id} channel={channel} />
          ))}
        </div>
      </div>
    );
  };

  if (isCollapsed) {
    return (
      <div className="w-16 bg-gray-50 dark:bg-neutral-950 border-r border-gray-200 dark:border-neutral-800 flex flex-col">
        <div className="h-14 flex items-center justify-center border-b border-gray-200 dark:border-neutral-800">
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-neutral-400" />
          </button>
        </div>

        {totalUnreadCount > 0 && (
          <div className="px-3 py-2">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="w-80 bg-gray-50 dark:bg-neutral-950 border-r border-gray-200 dark:border-neutral-800 flex flex-col">
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-gray-200 dark:border-neutral-800">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-neutral-50">Messages</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors"
              title="New conversation"
            >
              <Plus className="w-5 h-5 text-gray-600 dark:text-neutral-400" />
            </button>
            <button
              onClick={onToggleCollapse}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-neutral-400" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-gray-200 dark:border-neutral-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-neutral-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg text-sm text-gray-900 dark:text-neutral-50 placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-3 py-2 border-b border-gray-200 dark:border-neutral-800 flex gap-2">
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: 'Unread' },
            { id: 'dms', label: 'DMs' },
            { id: 'groups', label: 'Groups' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filter === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-gray-300 dark:hover:bg-neutral-700'
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
        <div className="flex-1 overflow-y-auto py-3">
          {filteredChannels.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-sm text-gray-500 dark:text-neutral-400">
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
