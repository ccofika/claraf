import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Search, Plus, ChevronLeft, ChevronRight, Hash, User, Users, Archive, Star, MessageSquare, Bell, BellOff, MoreVertical, MessagesSquare } from 'lucide-react';
import CreateChannelModal from './CreateChannelModal';
import PresenceIndicator from './PresenceIndicator';
import ChannelContextMenu from './ChannelContextMenu';
import SectionHeader from './SectionHeader';
import SectionModal from './SectionModal';
import ThreadsList from './ThreadsList';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ChatSidebar = ({ isCollapsed, onToggleCollapse, chatView = 'messages', onChatViewChange }) => {
  const { user } = useAuth();
  const {
    channels,
    activeChannel,
    setActiveChannel,
    totalUnreadCount,
    getUnreadCount,
    starredChannels,
    toggleStarChannel,
    isChannelStarred,
    fetchChannels
  } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, dms, groups, unread
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [mutedChannels, setMutedChannels] = useState([]);
  const [sections, setSections] = useState([]);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [unreadThreadCount, setUnreadThreadCount] = useState(0);

  // Fetch unread thread count
  useEffect(() => {
    const fetchUnreadThreadCount = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`${API_URL}/api/chat/threads/unread-count`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUnreadThreadCount(data.unreadCount || 0);
      } catch (error) {
        console.error('Error fetching unread thread count:', error);
      }
    };
    fetchUnreadThreadCount();

    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadThreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch muted channels
  useEffect(() => {
    const fetchMutedChannels = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`${API_URL}/api/chat/muted`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMutedChannels(data.mutedChannels.map(mc => mc.channel._id || mc.channel));
      } catch (error) {
        console.error('Error fetching muted channels:', error);
      }
    };
    fetchMutedChannels();
  }, []);

  // Fetch sections
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`${API_URL}/api/sections`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSections(data.sections || []);
      } catch (error) {
        console.error('Error fetching sections:', error);
      }
    };
    if (chatView === 'messages') {
      fetchSections();
    }
  }, [chatView]);

  // Check if channel is muted
  const isChannelMuted = (channelId) => {
    return mutedChannels.includes(channelId);
  };

  // Section management functions
  const handleCreateSection = async (data) => {
    try {
      const token = localStorage.getItem('token');
      const { data: response } = await axios.post(
        `${API_URL}/api/sections`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSections(prev => [...prev, response.section]);
      setShowSectionModal(false);
      setEditingSection(null);
    } catch (error) {
      console.error('Error creating section:', error);
      alert('Failed to create section');
    }
  };

  const handleEditSection = async (sectionId, data) => {
    try {
      const token = localStorage.getItem('token');
      const { data: response } = await axios.put(
        `${API_URL}/api/sections/${sectionId}`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSections(prev => prev.map(s => s._id === sectionId ? response.section : s));
      setShowSectionModal(false);
      setEditingSection(null);
    } catch (error) {
      console.error('Error editing section:', error);
      alert('Failed to update section');
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Are you sure you want to delete this section? Channels will be moved back to their default sections.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_URL}/api/sections/${sectionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSections(prev => prev.filter(s => s._id !== sectionId));
      setCollapsedSections(prev => {
        const newState = { ...prev };
        delete newState[sectionId];
        return newState;
      });
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('Failed to delete section');
    }
  };

  const handleToggleSectionCollapse = async (sectionId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/sections/${sectionId}/toggle-collapse`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCollapsedSections(prev => ({
        ...prev,
        [sectionId]: !prev[sectionId]
      }));
    } catch (error) {
      console.error('Error toggling section collapse:', error);
    }
  };

  const handleSaveSection = (data) => {
    if (editingSection) {
      handleEditSection(editingSection._id, data);
    } else {
      handleCreateSection(data);
    }
  };

  // Handle context menu actions
  const handleContextMenuAction = async (action, ...args) => {
    const token = localStorage.getItem('token');
    const channelId = contextMenu.channel._id;

    try {
      switch (action) {
        case 'open':
          setActiveChannel(contextMenu.channel);
          break;

        case 'markRead':
          await axios.post(
            `${API_URL}/api/chat/channels/${channelId}/read`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          await fetchChannels();
          break;

        case 'toggleStar':
          await toggleStarChannel(channelId);
          break;

        case 'mute':
          const duration = args[0];
          await axios.post(
            `${API_URL}/api/chat/channels/${channelId}/mute`,
            { duration },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (duration === 0) {
            // Unmute
            setMutedChannels(prev => prev.filter(id => id !== channelId));
          } else {
            // Mute
            setMutedChannels(prev => [...prev, channelId]);
          }
          break;

        case 'toggleArchive':
          await axios.post(
            `${API_URL}/api/chat/channels/${channelId}/archive`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          await fetchChannels();
          break;

        case 'leave':
          if (window.confirm(`Are you sure you want to leave ${contextMenu.channel.name}?`)) {
            await axios.delete(
              `${API_URL}/api/chat/channels/${channelId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchChannels();
          }
          break;

        case 'copyLink':
          const link = `${window.location.origin}/chat/${channelId}`;
          navigator.clipboard.writeText(link);
          break;

        case 'addToSection':
          const sectionId = args[0];
          console.log('📌 Adding channel to section:', { channelId, sectionId });

          const addResponse = await axios.post(
            `${API_URL}/api/sections/${sectionId}/channels`,
            { channelId },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          console.log('✅ Channel added to section:', addResponse.data);

          // Refresh sections to show updated channel list
          const { data } = await axios.get(`${API_URL}/api/sections`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setSections(data.sections || []);

          // Show success message
          const addedSection = sections.find(s => s._id === sectionId);
          if (addedSection) {
            alert(`Channel added to section "${addedSection.name}"`);
          }
          break;

        default:
          console.warn(`Unknown action: ${action}`);
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
    }
  };

  // Handle right-click
  const handleContextMenu = (e, channel) => {
    e.preventDefault();
    setContextMenu({
      channel,
      position: { x: e.clientX, y: e.clientY }
    });
  };

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

  // Get channels that are in custom sections
  const channelsInSections = new Set();
  sections.forEach(section => {
    section.channels?.forEach(channelId => {
      channelsInSections.add(channelId);
    });
  });

  // Filter out channels that are in custom sections from regular channel lists
  const filteredChannelsNotInSections = filteredChannels.filter(
    ch => !channelsInSections.has(ch._id)
  );

  // Group channels by type (excluding channels in custom sections)
  const dmChannels = filteredChannelsNotInSections.filter(ch => ch.type === 'dm');
  const groupChannels = filteredChannelsNotInSections.filter(ch => ch.type === 'group');
  const workspaceChannels = filteredChannelsNotInSections.filter(ch => ch.type === 'workspace');
  const qaChannels = filteredChannelsNotInSections.filter(ch => ch.type === 'qa');

  const getChannelIcon = (channel) => {
    if (channel.type === 'dm') return <User className="w-4 h-4" />;
    if (channel.type === 'group') return <Users className="w-4 h-4" />;
    if (channel.type === 'workspace') return <Hash className="w-4 h-4" />;
    if (channel.type === 'qa') return <Archive className="w-4 h-4" />;
    return <Hash className="w-4 h-4" />;
  };

  const getChannelName = (channel) => {
    if (channel.name) return channel.name;

    // For DMs, show other user's name (not the current user)
    if (channel.type === 'dm' && channel.members?.length >= 2 && user?._id) {
      const otherMember = channel.members.find(m => m.userId?._id && m.userId._id !== user._id);
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
    const isStarred = isChannelStarred(channel._id);
    const isMuted = isChannelMuted(channel._id);
    const [isHovered, setIsHovered] = useState(false);

    // Get other user ID for DM channels
    const getOtherUserId = () => {
      if (channel.type === 'dm' && channel.members?.length >= 2 && user?._id) {
        const otherMember = channel.members.find(m => m.userId?._id && m.userId._id !== user._id);
        return otherMember?.userId?._id;
      }
      return null;
    };

    const handleStarClick = (e) => {
      e.stopPropagation(); // Prevent channel selection
      e.preventDefault();
      toggleStarChannel(channel._id);
    };

    const handleMenuClick = (e) => {
      e.stopPropagation(); // Prevent channel selection
      e.preventDefault();
      handleContextMenu(e, channel);
    };

    return (
      <div
        className="relative group/channel"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          onClick={() => setActiveChannel(channel)}
          onContextMenu={(e) => handleContextMenu(e, channel)}
          className={`w-full px-2 py-1 flex items-center gap-2 transition-colors ${
            isActive
              ? 'bg-[#1164A3] dark:bg-[#1164A3] text-white'
              : isMuted
              ? 'opacity-50 text-gray-900 dark:text-[#D1D2D3] hover:bg-gray-100 dark:hover:bg-[#1A1D21]'
              : 'text-gray-900 dark:text-[#D1D2D3] hover:bg-gray-100 dark:hover:bg-[#1A1D21]'
          }`}
        >
          <div className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-600 dark:text-neutral-400'}`}>
            {getChannelIcon(channel)}
          </div>

          {/* Presence indicator for DMs */}
          {channel.type === 'dm' && getOtherUserId() && (
            <div className="flex-shrink-0 -ml-1">
              <PresenceIndicator userId={getOtherUserId()} size="sm" />
            </div>
          )}

          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                {/* Star icon (always visible for starred, on hover for others) */}
                <span
                  onClick={handleStarClick}
                  className={`flex-shrink-0 transition-opacity cursor-pointer ${
                    isStarred || isHovered ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      isStarred
                        ? 'fill-yellow-400 text-yellow-400'
                        : isActive
                        ? 'text-white hover:text-yellow-400'
                        : 'text-gray-400 dark:text-neutral-500 hover:text-yellow-400'
                    }`}
                  />
                </span>

                <span className={`text-[15px] truncate ${
                  isActive ? 'text-white font-bold' : 'font-normal'
                } ${unreadCount > 0 && !isActive ? 'font-bold' : ''}`}>
                  {getChannelName(channel)}
                </span>

                {/* Mute indicator */}
                {isMuted && (
                  <BellOff className={`w-3 h-3 flex-shrink-0 ${
                    isActive ? 'text-white/70' : 'text-gray-400 dark:text-neutral-500'
                  }`} />
                )}
              </div>

              <div className="flex items-center gap-1">
                {channel.lastMessage?.timestamp && (
                  <span className={`text-[11px] flex-shrink-0 ${
                    isActive ? 'text-white/80' : 'text-gray-500 dark:text-neutral-500'
                  }`}>
                    {formatTime(channel.lastMessage.timestamp)}
                  </span>
                )}
                {/* 3-dot menu button */}
                <span
                  onClick={handleMenuClick}
                  className={`flex-shrink-0 p-0.5 rounded transition-opacity cursor-pointer ${
                    isHovered ? 'opacity-100' : 'opacity-0'
                  } ${
                    isActive
                      ? 'hover:bg-white/20 text-white'
                      : 'hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-600 dark:text-neutral-400'
                  }`}
                  title="More options"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </span>
              </div>
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
      </div>
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
        {/* Header with View Switcher */}
        <div className="border-b border-gray-200/60 dark:border-neutral-800/60">
          <div className="h-14 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onChatViewChange?.('messages')}
                className={`flex items-center gap-1.5 px-2 py-1 transition-colors ${
                  chatView === 'messages'
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                title="Messages"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-[14px] font-semibold">Messages</span>
              </button>
              <button
                onClick={() => onChatViewChange?.('threads')}
                className={`flex items-center gap-1.5 px-2 py-1 transition-colors relative ${
                  chatView === 'threads'
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                title="Threads"
              >
                <MessagesSquare className="w-4 h-4" />
                <span className="text-[14px] font-semibold">Threads</span>
                {unreadThreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-[#E01E5A] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadThreadCount > 9 ? '9+' : unreadThreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => onChatViewChange?.('activity')}
                className={`flex items-center gap-1.5 px-2 py-1 transition-colors ${
                  chatView === 'activity'
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                title="Activity"
              >
                <Bell className="w-4 h-4" />
                <span className="text-[14px] font-semibold">Activity</span>
              </button>
            </div>
            <div className="flex items-center gap-1">
              {chatView === 'messages' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors"
                  title="New conversation"
                >
                  <Plus className="w-[18px] h-[18px] text-gray-600 dark:text-neutral-400" />
                </button>
              )}
              <button
                onClick={onToggleCollapse}
                className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-[18px] h-[18px] text-gray-600 dark:text-neutral-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar (only show for messages view) */}
        {chatView === 'messages' && (
          <>
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
          </>
        )}

        {/* Threads List (only show for threads view) */}
        {chatView === 'threads' && (
          <ThreadsList />
        )}

        {/* Channel List (only show for messages view) */}
        {chatView === 'messages' && (
          <div className="flex-1 overflow-y-auto py-2">
            {filteredChannels.length === 0 && starredChannels.length === 0 && sections.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <p className="text-[15px] text-gray-500 dark:text-neutral-400">
                  {searchQuery ? 'No conversations found' : 'No conversations yet'}
                </p>
              </div>
            ) : (
              <>
                {/* Starred Section - always show at top if has starred channels */}
                {starredChannels.length > 0 && filter === 'all' && !searchQuery && (
                  <ChannelSection title="Starred" channels={starredChannels} showCount />
                )}

                {/* Custom Sections */}
                {sections.length > 0 && filter === 'all' && !searchQuery && sections.map(section => {
                  const sectionChannels = channels.filter(ch =>
                    section.channels?.includes(ch._id)
                  );
                  const isCollapsed = collapsedSections[section._id];

                  return (
                    <div key={section._id} className="mb-3">
                      <SectionHeader
                        section={section}
                        isCollapsed={isCollapsed}
                        onToggleCollapse={() => handleToggleSectionCollapse(section._id)}
                        onEdit={() => {
                          setEditingSection(section);
                          setShowSectionModal(true);
                        }}
                        onDelete={() => handleDeleteSection(section._id)}
                        channelCount={sectionChannels.length}
                      />
                      {!isCollapsed && (
                        <div>
                          {sectionChannels.length === 0 ? (
                            <div className="px-4 py-3">
                              <p className="text-[13px] text-gray-500 dark:text-neutral-500 italic text-center">
                                No channels in this section
                              </p>
                              <p className="text-[11px] text-gray-400 dark:text-neutral-600 mt-1 text-center">
                                Right-click a channel and select "Add to section"
                              </p>
                            </div>
                          ) : (
                            sectionChannels.map(channel => (
                              <ChannelItem key={channel._id} channel={channel} />
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* New Section Button */}
                {filter === 'all' && !searchQuery && (
                  <div className="px-2 py-1 mb-3">
                    <button
                      onClick={() => {
                        setEditingSection(null);
                        setShowSectionModal(true);
                      }}
                      className="w-full px-2 py-1.5 flex items-center gap-2 text-[14px] text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New Section</span>
                    </button>
                  </div>
                )}

                <ChannelSection title="Direct Messages" channels={dmChannels} showCount />
                <ChannelSection title="Group Chats" channels={groupChannels} showCount />
                <ChannelSection title="Workspace Channels" channels={workspaceChannels} showCount />
                <ChannelSection title="QA Tickets" channels={qaChannels} showCount />
              </>
            )}
          </div>
        )}
      </div>

      {/* Create Channel Modal */}
      {showCreateModal && (
        <CreateChannelModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ChannelContextMenu
          channel={contextMenu.channel}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onAction={handleContextMenuAction}
          isStarred={isChannelStarred(contextMenu.channel._id)}
          isMuted={isChannelMuted(contextMenu.channel._id)}
          isArchived={contextMenu.channel.isArchived || false}
          sections={sections}
        />
      )}

      {/* Section Modal */}
      {showSectionModal && (
        <SectionModal
          section={editingSection}
          onClose={() => {
            setShowSectionModal(false);
            setEditingSection(null);
          }}
          onSave={handleSaveSection}
        />
      )}
    </>
  );
};

export default ChatSidebar;
