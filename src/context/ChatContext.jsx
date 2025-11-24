import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { useNotification } from './NotificationContext';
import { toast } from 'sonner';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user, token } = useAuth();
  const { socket, isConnected } = useSocket();
  const { showMessageNotification, showMentionNotification, permission } = useNotification();

  // State
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState({});
  const [pinnedMessages, setPinnedMessages] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [userPresence, setUserPresence] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isChatInitialized, setIsChatInitialized] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [threadMessage, setThreadMessage] = useState(null); // For thread panel
  const [starredChannels, setStarredChannels] = useState([]);
  const [recentChannels, setRecentChannels] = useState([]);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [mutedChannels, setMutedChannels] = useState([]); // Track muted channels

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Helper function to get fresh token from localStorage
  const getAuthToken = () => {
    const authToken = localStorage.getItem('token');
    if (!authToken) {
      console.warn('⚠️ No auth token available in localStorage');
    }
    return authToken;
  };

  // Calculate total unread count
  useEffect(() => {
    const total = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
    setTotalUnreadCount(total);
  }, [unreadCounts]);

  // Fetch muted channels
  const fetchMutedChannels = useCallback(async () => {
    const authToken = getAuthToken();
    if (!authToken) return;

    try {
      const { data } = await axios.get(`${API_URL}/api/chat/muted`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setMutedChannels(data.mutedChannels.map(mc => mc.channel._id || mc.channel));
    } catch (error) {
      console.error('Error fetching muted channels:', error);
    }
  }, [API_URL]);

  // Check if channel is muted
  const isChannelMuted = useCallback((channelId) => {
    return mutedChannels.includes(channelId);
  }, [mutedChannels]);

  // Check if message mentions current user
  const messageHasMention = useCallback((message) => {
    if (!message?.content || !user?.name) return false;

    // Check for @username or @all mentions
    const mentionPattern = new RegExp(`@(${user.name}|all)\\b`, 'i');
    return mentionPattern.test(message.content);
  }, [user]);

  // Fetch channels
  const fetchChannels = useCallback(async () => {
    const authToken = getAuthToken();
    if (!authToken) return;

    try {
      console.log('📡 Fetching channels...');
      const response = await axios.get(`${API_URL}/api/chat/channels`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      setChannels(response.data);

      // Update unread counts
      const counts = {};
      response.data.forEach(channel => {
        counts[channel._id] = channel.unreadCount || 0;
      });
      setUnreadCounts(counts);
    } catch (error) {
      console.error('❌ Error fetching channels:', error);
      toast.error('Failed to load chat channels');
    }
  }, [API_URL]);

  // Fetch messages for a channel
  const fetchMessages = useCallback(async (channelId, before = null) => {
    const authToken = getAuthToken();
    if (!authToken) return;

    try {
      console.log('📥 Fetching messages for channel:', channelId);
      const params = before ? { before } : {};
      const response = await axios.get(
        `${API_URL}/api/chat/channels/${channelId}/messages`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          params
        }
      );

      const { messages: newMessages, pinnedMessages: pinned, hasMore } = response.data;

      setMessages(prev => ({
        ...prev,
        [channelId]: before
          ? [...newMessages, ...(prev[channelId] || [])]
          : newMessages
      }));

      setPinnedMessages(prev => ({
        ...prev,
        [channelId]: pinned
      }));

      return { messages: newMessages, hasMore };
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      toast.error('Failed to load messages');
      return { messages: [], hasMore: false };
    }
  }, [API_URL]);

  // Send message
  const sendMessage = useCallback(async (channelId, content, type = 'text', metadata = {}) => {
    const authToken = getAuthToken();
    if (!authToken) return;

    try {
      console.log('📤 Sending message to channel:', channelId);
      const response = await axios.post(
        `${API_URL}/api/chat/messages`,
        { channelId, content, type, metadata },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      console.log('✅ Message sent successfully:', response.data);

      // Immediately add message to local state (don't wait for socket)
      setMessages(prev => ({
        ...prev,
        [channelId]: [...(prev[channelId] || []), response.data]
      }));

      // Update channel's last message and unarchive if archived
      setChannels(prev =>
        prev.map(ch => {
          if (!ch || !ch._id) return ch;
          return ch._id === channelId
            ? { ...ch,
                isArchived: false, // Auto-unarchive when sending message
                lastMessage: {
                  content: content.substring(0, 100),
                  sender: response.data.sender,
                  timestamp: new Date(),
                  type: type
                }
              }
            : ch;
        })
      );

      // Emit socket event for real-time delivery to OTHER users
      if (socket && isConnected) {
        console.log('📡 Emitting chat:message:send', { channelId, messageId: response.data._id });
        socket.emit('chat:message:send', {
          channelId,
          message: response.data
        });
      } else {
        console.warn('⚠️ Socket not connected, cannot emit message', { socket: !!socket, isConnected });
      }

      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      throw error;
    }
  }, [socket, isConnected, API_URL]);

  // Edit message
  const editMessage = useCallback(async (messageId, content) => {
    const authToken = getAuthToken();
    if (!authToken) {
      toast.error('Authentication required');
      return;
    }

    if (!content || !content.trim()) {
      toast.error('Message cannot be empty');
      return;
    }

    try {
      console.log('✏️ Editing message:', messageId);
      const response = await axios.put(
        `${API_URL}/api/chat/messages/${messageId}`,
        { content: content.trim() },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (!response.data) {
        throw new Error('No data returned from server');
      }

      console.log('✅ Message edited successfully');

      // Update local state
      setMessages(prev => {
        const newMessages = { ...prev };
        Object.keys(newMessages).forEach(channelId => {
          if (newMessages[channelId]) {
            newMessages[channelId] = newMessages[channelId].map(msg =>
              msg._id === messageId ? { ...msg, ...response.data, isEdited: true } : msg
            );
          }
        });
        return newMessages;
      });

      // Emit socket event
      if (socket && isConnected && activeChannel) {
        socket.emit('chat:message:edit', {
          messageId,
          channelId: activeChannel._id,
          content: content.trim()
        });
      }

      toast.success('Message updated');
      return response.data;
    } catch (error) {
      console.error('❌ Error editing message:', error);
      toast.error(error.response?.data?.message || 'Failed to edit message');
      throw error;
    }
  }, [socket, isConnected, activeChannel, API_URL]);

  // Delete message
  const deleteMessage = useCallback(async (messageId, channelId) => {
    const authToken = getAuthToken();
    if (!authToken) {
      toast.error('Authentication required');
      return;
    }

    if (!messageId || !channelId) {
      console.error('❌ Missing messageId or channelId');
      return;
    }

    try {
      console.log('🗑️ Deleting message:', messageId);
      await axios.delete(`${API_URL}/api/chat/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      console.log('✅ Message deleted successfully');

      // Update local state - remove message
      setMessages(prev => {
        const channelMessages = prev[channelId];
        if (!channelMessages) return prev;

        return {
          ...prev,
          [channelId]: channelMessages.filter(msg => msg._id !== messageId)
        };
      });

      // Also remove from pinned if it was pinned
      setPinnedMessages(prev => {
        const pinnedInChannel = prev[channelId];
        if (!pinnedInChannel) return prev;

        return {
          ...prev,
          [channelId]: pinnedInChannel.filter(msg => msg._id !== messageId)
        };
      });

      // Emit socket event
      if (socket && isConnected) {
        socket.emit('chat:message:delete', { messageId, channelId });
      }

      toast.success('Message deleted');
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      toast.error(error.response?.data?.message || 'Failed to delete message');
      throw error;
    }
  }, [socket, isConnected, API_URL]);

  // Add reaction
  const addReaction = useCallback(async (messageId, emoji) => {
    const authToken = getAuthToken();
    if (!authToken) {
      toast.error('Authentication required');
      return;
    }

    if (!messageId || !emoji) {
      console.error('❌ Missing messageId or emoji');
      return;
    }

    try {
      console.log('❤️ Adding reaction:', emoji, 'to message:', messageId);
      const response = await axios.post(
        `${API_URL}/api/chat/messages/${messageId}/reactions`,
        { emoji },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (!response.data) {
        throw new Error('No data returned from server');
      }

      console.log('✅ Reaction added successfully');

      // Update local state for ALL channels (message might be in any channel)
      setMessages(prev => {
        const newMessages = { ...prev };
        Object.keys(newMessages).forEach(channelId => {
          if (newMessages[channelId]) {
            newMessages[channelId] = newMessages[channelId].map(msg =>
              msg._id === messageId ? { ...msg, ...response.data } : msg
            );
          }
        });
        return newMessages;
      });

      // Emit socket event
      if (socket && isConnected && activeChannel) {
        socket.emit('chat:reaction:add', {
          messageId,
          channelId: activeChannel._id,
          emoji
        });
      }
    } catch (error) {
      console.error('❌ Error adding reaction:', error);
      toast.error(error.response?.data?.message || 'Failed to add reaction');
    }
  }, [socket, isConnected, activeChannel, API_URL]);

  // Remove reaction
  const removeReaction = useCallback(async (messageId, emoji) => {
    const authToken = getAuthToken();
    if (!authToken) {
      toast.error('Authentication required');
      return;
    }

    if (!messageId || !emoji) {
      console.error('❌ Missing messageId or emoji');
      return;
    }

    try {
      console.log('💔 Removing reaction:', emoji, 'from message:', messageId);
      const response = await axios.delete(
        `${API_URL}/api/chat/messages/${messageId}/reactions`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          data: { emoji }
        }
      );

      if (!response.data) {
        throw new Error('No data returned from server');
      }

      console.log('✅ Reaction removed successfully');

      // Update local state for ALL channels
      setMessages(prev => {
        const newMessages = { ...prev };
        Object.keys(newMessages).forEach(channelId => {
          if (newMessages[channelId]) {
            newMessages[channelId] = newMessages[channelId].map(msg =>
              msg._id === messageId ? { ...msg, ...response.data } : msg
            );
          }
        });
        return newMessages;
      });

      // Emit socket event
      if (socket && isConnected && activeChannel) {
        socket.emit('chat:reaction:remove', {
          messageId,
          channelId: activeChannel._id,
          emoji
        });
      }
    } catch (error) {
      console.error('❌ Error removing reaction:', error);
      toast.error(error.response?.data?.message || 'Failed to remove reaction');
    }
  }, [socket, isConnected, activeChannel, API_URL]);

  // Pin/Unpin message
  const pinMessage = useCallback(async (messageId, channelId) => {
    const authToken = getAuthToken();
    if (!authToken) {
      toast.error('Authentication required');
      return;
    }

    if (!messageId || !channelId) {
      console.error('❌ Missing messageId or channelId');
      return;
    }

    try {
      console.log('📌 Toggling pin for message:', messageId);
      const response = await axios.post(
        `${API_URL}/api/chat/messages/${messageId}/pin`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (!response.data) {
        throw new Error('Invalid response from server');
      }

      const updatedMessage = response.data;
      const isPinned = updatedMessage.isPinned;

      console.log(isPinned ? '✅ Message pinned' : '✅ Message unpinned');

      // Update local state with server response
      setMessages(prev => {
        const newMessages = { ...prev };
        if (newMessages[channelId]) {
          newMessages[channelId] = newMessages[channelId].map(msg =>
            msg._id === messageId ? updatedMessage : msg
          );
        }
        return newMessages;
      });

      // Update pinned messages list
      setPinnedMessages(prev => {
        const currentPinned = prev[channelId] || [];

        if (isPinned) {
          // Message was pinned - add to list
          const alreadyPinned = currentPinned.some(m => m._id === messageId);
          if (alreadyPinned) {
            // Update existing pinned message
            return {
              ...prev,
              [channelId]: currentPinned.map(m => m._id === messageId ? updatedMessage : m)
            };
          } else {
            // Add new pinned message
            return {
              ...prev,
              [channelId]: [...currentPinned, updatedMessage]
            };
          }
        } else {
          // Message was unpinned - remove from list
          return {
            ...prev,
            [channelId]: currentPinned.filter(m => m._id !== messageId)
          };
        }
      });

      // Emit socket event
      if (socket && isConnected) {
        socket.emit('chat:message:pin', { messageId, channelId, isPinned });
      }

      toast.success(isPinned ? 'Message pinned' : 'Message unpinned');
    } catch (error) {
      console.error('❌ Error toggling pin:', error);
      toast.error(error.response?.data?.message || 'Failed to pin message');
    }
  }, [socket, isConnected, API_URL]);

  // Mark messages as read
  const markAsRead = useCallback(async (channelId) => {
    const authToken = getAuthToken();
    if (!authToken) return;

    if (!channelId) {
      console.error('❌ Missing channelId');
      return;
    }

    try {
      await axios.post(
        `${API_URL}/api/chat/channels/${channelId}/read`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      console.log('✅ Messages marked as read for channel:', channelId);

      // Update unread count
      setUnreadCounts(prev => ({
        ...prev,
        [channelId]: 0
      }));

      // Emit socket event
      if (socket && isConnected) {
        socket.emit('chat:messages:read', { channelId });
      }
    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
    }
  }, [socket, isConnected, API_URL]);

  // Create channel
  const createChannel = useCallback(async (type, name, description, memberIds, workspaceId) => {
    const authToken = getAuthToken();
    if (!authToken) {
      toast.error('Authentication required');
      return;
    }

    if (!type) {
      toast.error('Channel type is required');
      return;
    }

    // Validation
    if (type === 'group' && (!name || !name.trim())) {
      toast.error('Channel name is required for group chats');
      return;
    }

    if (type === 'dm' && (!memberIds || memberIds.length !== 1)) {
      toast.error('Direct message requires exactly one member');
      return;
    }

    try {
      console.log('📡 Creating channel:', { type, name, memberIds: memberIds?.length || 0 });

      const requestData = {
        type,
        ...(name && { name: name.trim() }),
        ...(description && { description: description.trim() }),
        ...(memberIds && { memberIds }),
        ...(workspaceId && { workspaceId })
      };

      const response = await axios.post(
        `${API_URL}/api/chat/channels`,
        requestData,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (!response.data || !response.data._id) {
        throw new Error('Invalid response from server');
      }

      console.log('✅ Channel created:', response.data._id);

      // Add to channels list if not already there
      setChannels(prev => {
        const exists = prev.some(ch => ch._id === response.data._id);
        if (exists) {
          console.log('Channel already exists in list');
          return prev;
        }
        return [response.data, ...prev];
      });

      // Emit socket event
      if (socket && isConnected) {
        socket.emit('chat:channel:created', { channel: response.data });
      }

      toast.success(`${type === 'dm' ? 'Direct message' : 'Channel'} created successfully`);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating channel:', error);
      const errorMsg = error.response?.data?.message || 'Failed to create channel';
      toast.error(errorMsg);
      throw error;
    }
  }, [socket, isConnected, API_URL]);

  // Create or get DM channel
  const createDM = useCallback(async (otherUserId) => {
    const authToken = getAuthToken();
    if (!authToken) {
      toast.error('Authentication required');
      return;
    }

    if (!otherUserId) {
      toast.error('User ID is required');
      return;
    }

    try {
      console.log('💬 Creating DM with user:', otherUserId);

      const response = await axios.post(
        `${API_URL}/api/chat/channels`,
        { type: 'dm', memberIds: [otherUserId] },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (!response.data || !response.data._id) {
        throw new Error('Invalid response from server');
      }

      console.log('✅ DM created/retrieved:', response.data._id);

      // Check if channel already exists in state
      setChannels(prev => {
        const exists = prev.some(ch => ch._id === response.data._id);
        if (exists) {
          console.log('DM already exists in list');
          return prev;
        }
        return [response.data, ...prev];
      });

      return response.data;
    } catch (error) {
      console.error('❌ Error creating DM:', error);
      const errorMsg = error.response?.data?.message || 'Failed to create direct message';
      toast.error(errorMsg);
      throw error;
    }
  }, [socket, isConnected, API_URL]);

  // Toggle archive channel
  const toggleArchiveChannel = useCallback(async (channelId) => {
    const authToken = getAuthToken();
    if (!authToken) {
      toast.error('Authentication required');
      return;
    }

    if (!channelId) {
      console.error('❌ Missing channelId');
      return;
    }

    try {
      console.log('📦 Toggling archive for channel:', channelId);
      const response = await axios.post(
        `${API_URL}/api/chat/channels/${channelId}/archive`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      const { archived } = response.data;
      console.log(archived ? '✅ Channel archived' : '✅ Channel unarchived');

      // Remove channel from list if archived
      if (archived) {
        setChannels(prev => prev.filter(ch => ch._id !== channelId));

        // If it was active channel, clear it
        if (activeChannel?._id === channelId) {
          setActiveChannel(null);
        }

        toast.success('Conversation archived');
      } else {
        toast.success('Conversation unarchived');
        // Refresh channels to get it back
        fetchChannels();
      }
    } catch (error) {
      console.error('❌ Error toggling archive:', error);
      toast.error(error.response?.data?.message || 'Failed to archive conversation');
    }
  }, [activeChannel, API_URL, fetchChannels]);

  // Initialize chat when user is authenticated
  useEffect(() => {
    // Check token from localStorage directly (more reliable than state)
    const authToken = localStorage.getItem('token');

    if (user && authToken && !isChatInitialized) {
      console.log('🔄 Initializing chat...');
      console.log('🔑 User:', user.email || user.name);
      console.log('🔑 Token exists:', !!authToken);

      // Fetch channels immediately
      fetchChannels();
      setIsChatInitialized(true);
    }
  }, [user, isChatInitialized, fetchChannels]);

  // Listen for chat initialization success
  useEffect(() => {
    if (!socket || !isConnected || !isChatInitialized) return;

    // Note: chat:init is now emitted automatically in SocketContext after 'authenticated' event
    // This ensures it happens on both initial connection AND reconnections

    const handleInitSuccess = (data) => {
      console.log('✅ Chat socket initialized - joined all channels', data);
    };

    const handleChatError = (error) => {
      console.error('❌ Chat error:', error);
    };

    socket.on('chat:init:success', handleInitSuccess);
    socket.on('chat:error', handleChatError);

    return () => {
      socket.off('chat:init:success', handleInitSuccess);
      socket.off('chat:error', handleChatError);
    };
  }, [socket, isConnected, isChatInitialized]);

  // Restore active channel after channels are loaded (after refresh)
  useEffect(() => {
    if (channels.length > 0 && !activeChannel) {
      const lastChannelId = localStorage.getItem('lastActiveChannelId');

      if (lastChannelId) {
        const channel = channels.find(ch => ch._id === lastChannelId);
        if (channel) {
          console.log('🔄 Restoring last active channel:', channel.name || channel._id);
          setActiveChannel(channel);
        } else {
          // If saved channel not found, select first channel
          console.log('📌 Selecting first channel (saved not found)');
          setActiveChannel(channels[0]);
        }
      } else {
        // No saved channel, select first one
        console.log('📌 Selecting first channel (no saved)');
        setActiveChannel(channels[0]);
      }
    }
  }, [channels, activeChannel]);

  // Save active channel ID to localStorage when it changes
  useEffect(() => {
    if (activeChannel?._id) {
      localStorage.setItem('lastActiveChannelId', activeChannel._id);
      console.log('💾 Saved active channel:', activeChannel._id);
    }
  }, [activeChannel]);

  // Create activity entry (must be before socket listeners that use it)
  const createActivity = useCallback(async (message, channel, type = 'message') => {
    const authToken = getAuthToken();
    if (!authToken) return;

    try {
      await axios.post(
        `${API_URL}/api/activities`,
        {
          type,
          channelId: channel._id,
          messageId: message._id,
          triggeredById: message.sender._id,
          metadata: {
            excerpt: message.content?.substring(0, 200) || '',
            emoji: type === 'reaction' ? message.metadata?.emoji : undefined
          }
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
    } catch (error) {
      console.error('Error creating activity:', error);
    }
  }, [API_URL]);

  // Refs for stable values in socket handlers
  const channelsRef = React.useRef(channels);
  const activeChannelRef = React.useRef(activeChannel);
  const userRef = React.useRef(user);
  const permissionRef = React.useRef(permission);

  React.useEffect(() => {
    channelsRef.current = channels;
  }, [channels]);

  React.useEffect(() => {
    activeChannelRef.current = activeChannel;
  }, [activeChannel]);

  React.useEffect(() => {
    userRef.current = user;
  }, [user]);

  React.useEffect(() => {
    permissionRef.current = permission;
  }, [permission]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log('🎧 Registering socket event listeners...');

    // Message received
    const handleMessageReceived = (data) => {
      console.log('🔔 SOCKET EVENT: chat:message:received', data);
      const { channelId, message } = data;

      setMessages(prev => {
        const existingMessages = prev[channelId] || [];

        // Check if message already exists (avoid duplicates)
        const messageExists = existingMessages.some(msg => msg._id === message._id);

        if (messageExists) {
          // Don't log if it's from the sender (expected duplicate from local add + socket echo)
          if (message.sender?._id !== userRef.current?._id) {
            console.log('⚠️ Message already exists, skipping duplicate:', message._id);
          }
          return prev;
        }

        console.log('✅ Adding new message to state:', message._id);
        return {
          ...prev,
          [channelId]: [...existingMessages, message]
        };
      });

      // Find the channel for this message
      const channel = channelsRef.current.find(ch => ch._id === channelId);

      // Update unread count if not in active channel
      const isInActiveChannel = activeChannelRef.current && activeChannelRef.current._id === channelId;
      if (!isInActiveChannel) {
        setUnreadCounts(prev => ({
          ...prev,
          [channelId]: (prev[channelId] || 0) + 1
        }));

        // Show browser notification if:
        // 1. Channel is not muted
        // 2. Message is from another user (not self)
        // 3. Permission is granted
        // Note: forceShow=true allows notifications even when window is focused (for cross-channel messages)
        if (channel && !isChannelMuted(channelId) && message.sender?._id !== userRef.current?._id && permissionRef.current === 'granted') {
          const hasMention = messageHasMention(message);

          console.log('🔔 Showing browser notification for message in channel:', channelId);

          // Show mention notification (higher priority) or regular message notification
          if (hasMention) {
            showMentionNotification(message, channel, () => {
              // On click, switch to this channel
              setActiveChannel(channel);
            }, true); // forceShow=true for mentions
          } else if (channel.type === 'dm') {
            // Always notify for DMs
            showMessageNotification(message, channel, () => {
              setActiveChannel(channel);
            }, true); // forceShow=true for DMs
          } else if (channel.type === 'group') {
            // Notify for group messages
            showMessageNotification(message, channel, () => {
              setActiveChannel(channel);
            }, true); // forceShow=true for group messages in inactive channels
          }

          // Activity creation is handled by backend automatically
          // No need to call from frontend
        }
      }

      // Update channel's last message
      setChannels(prev =>
        prev.map(ch => {
          if (!ch || !ch._id) return ch; // Safety check
          return ch._id === channelId
            ? { ...ch, lastMessage: data.lastMessage || ch.lastMessage }
            : ch;
        })
      );
    };

    socket.on('chat:message:received', handleMessageReceived);

    // Message edited
    socket.on('chat:message:edited', (data) => {
      const { messageId, channelId, content } = data;

      setMessages(prev => ({
        ...prev,
        [channelId]: prev[channelId]?.map(msg =>
          msg._id === messageId
            ? { ...msg, content, isEdited: true, editedAt: data.editedAt }
            : msg
        )
      }));
    });

    // Message deleted
    socket.on('chat:message:deleted', (data) => {
      const { messageId, channelId } = data;

      setMessages(prev => ({
        ...prev,
        [channelId]: prev[channelId]?.filter(msg => msg._id !== messageId)
      }));
    });

    // Typing indicators
    socket.on('chat:typing:update', (data) => {
      const { channelId, typingUsers: users } = data;
      setTypingUsers(prev => ({
        ...prev,
        [channelId]: users
      }));
    });

    // Reactions
    socket.on('chat:reaction:added', (data) => {
      const { messageId, channelId } = data;
      // Refetch the message or update locally
      // For simplicity, we'll refetch messages
      if (activeChannel && activeChannel._id === channelId) {
        fetchMessages(channelId);
      }
    });

    // User presence
    socket.on('chat:user:presence', (data) => {
      const { userId, status, lastSeen } = data;
      setUserPresence(prev => ({
        ...prev,
        [userId]: { status, lastSeen }
      }));
    });

    // New channel
    socket.on('chat:channel:new', (data) => {
      setChannels(prev => {
        const exists = prev.find(ch => ch._id === data.channel._id);
        if (exists) return prev;
        return [data.channel, ...prev];
      });
    });

    // Channel updated
    socket.on('chat:channel:updated', (data) => {
      if (!data || !data.channel) return; // Safety check

      setChannels(prev =>
        prev.map(ch => {
          if (!ch || !ch._id) return ch; // Safety check
          return ch._id === data.channel._id ? data.channel : ch;
        })
      );
    });

    // Channel deleted
    socket.on('chat:channel:deleted', (data) => {
      if (!data || !data.channelId) return; // Safety check

      setChannels(prev => prev.filter(ch => ch && ch._id && ch._id !== data.channelId));
      if (activeChannel && activeChannel._id === data.channelId) {
        setActiveChannel(null);
      }
    });

    return () => {
      console.log('🔌 Cleaning up socket event listeners...');
      socket.off('chat:message:received', handleMessageReceived);
      socket.off('chat:message:edited');
      socket.off('chat:message:deleted');
      socket.off('chat:typing:update');
      socket.off('chat:reaction:added');
      socket.off('chat:user:presence');
      socket.off('chat:channel:new');
      socket.off('chat:channel:updated');
      socket.off('chat:channel:deleted');
    };
  }, [socket, isConnected]); // Minimal dependencies to avoid re-registering

  // Note: Users are automatically joined to ALL their channels via chat:init on backend
  // No need to join/leave individual channel rooms when switching views
  // This ensures users receive real-time messages from all channels, not just the active one

  // Fetch messages when active channel changes
  useEffect(() => {
    if (activeChannel && activeChannel._id) {
      // Check if messages are already loaded for this channel
      if (!messages[activeChannel._id] || messages[activeChannel._id].length === 0) {
        console.log('📥 Loading messages for channel:', activeChannel._id);
        fetchMessages(activeChannel._id);
      }
    }
  }, [activeChannel]);

  // Update recent channels when active channel changes
  const updateRecentChannels = useCallback((channel) => {
    setRecentChannels(prev => {
      // Remove if already exists
      const filtered = prev.filter(ch => ch._id !== channel._id);
      // Add to beginning
      return [channel, ...filtered].slice(0, 10); // Keep max 10 recent
    });
  }, []);

  // Mark as read when active channel changes
  useEffect(() => {
    if (activeChannel) {
      markAsRead(activeChannel._id);
      // Track as recent channel
      updateRecentChannels(activeChannel);
    }
  }, [activeChannel?._id, markAsRead, updateRecentChannels]); // Include stable callback dependencies

  // Star/Unstar channel
  const toggleStarChannel = useCallback(async (channelId) => {
    const authToken = getAuthToken();
    if (!authToken) return;

    try {
      const isStarred = starredChannels.some(ch => ch._id === channelId);

      if (isStarred) {
        // Unstar
        await axios.delete(`${API_URL}/api/chat/channels/${channelId}/star`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        setStarredChannels(prev => prev.filter(ch => ch._id !== channelId));
      } else {
        // Star
        await axios.post(`${API_URL}/api/chat/channels/${channelId}/star`, {}, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        const channel = channels.find(ch => ch._id === channelId);
        if (channel) {
          setStarredChannels(prev => [...prev, channel]);
        }
      }
    } catch (error) {
      console.error('Error toggling star:', error);
      toast.error('Failed to update starred channels');
    }
  }, [starredChannels, channels, API_URL]);

  // Fetch starred channels
  const fetchStarredChannels = useCallback(async () => {
    const authToken = getAuthToken();
    if (!authToken) return;

    try {
      const response = await axios.get(`${API_URL}/api/chat/starred`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setStarredChannels(response.data);
    } catch (error) {
      console.error('Error fetching starred channels:', error);
    }
  }, [API_URL]);

  // Update user's own presence status
  const updateMyPresence = useCallback(async (status, customStatus = null) => {
    const authToken = getAuthToken();
    if (!authToken || !user) return;

    try {
      await axios.put(`${API_URL}/api/user/presence`, {
        status,
        customStatus
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      // Update local state
      setUserPresence(prev => ({
        ...prev,
        [user._id]: {
          status,
          customStatus,
          isOnline: status === 'active' || status === 'dnd',
          lastActiveAt: new Date()
        }
      }));

      // Emit via socket
      if (socket && isConnected) {
        socket.emit('user:presence:update', {
          userId: user._id,
          status,
          customStatus
        });
      }
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }, [user, socket, isConnected, API_URL]);

  // Auto-away timer - set to away after 10 minutes of inactivity
  useEffect(() => {
    const handleActivity = () => {
      setLastActivityTime(Date.now());
      // If user was away, set them back to active
      if (user && userPresence[user._id]?.status === 'away') {
        updateMyPresence('active');
      }
    };

    // Track various activity events
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [user, userPresence, updateMyPresence]);

  // Check for inactivity every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const inactiveTime = Date.now() - lastActivityTime;
      const TEN_MINUTES = 10 * 60 * 1000;

      if (inactiveTime > TEN_MINUTES && user && userPresence[user._id]?.status === 'active') {
        updateMyPresence('away');
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [lastActivityTime, user, userPresence, updateMyPresence]);

  // Socket listener for presence updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handlePresenceUpdate = (data) => {
      const { userId, status, customStatus } = data;
      setUserPresence(prev => ({
        ...prev,
        [userId]: {
          status,
          customStatus,
          isOnline: status === 'active' || status === 'dnd',
          lastActiveAt: new Date()
        }
      }));
    };

    socket.on('user:presence:updated', handlePresenceUpdate);

    return () => {
      socket.off('user:presence:updated', handlePresenceUpdate);
    };
  }, [socket, isConnected]);

  // Fetch starred channels on mount
  useEffect(() => {
    if (user) {
      fetchStarredChannels();
      fetchMutedChannels();
    }
  }, [user, fetchStarredChannels, fetchMutedChannels]);

  const value = {
    // State
    channels,
    activeChannel,
    messages: messages[activeChannel?._id] || [],
    pinnedMessages: pinnedMessages[activeChannel?._id] || [],
    typingUsers: typingUsers[activeChannel?._id] || [],
    unreadCounts,
    totalUnreadCount,
    userPresence,
    isLoading,
    replyingTo,
    threadMessage,
    starredChannels,
    recentChannels,

    // Actions
    setActiveChannel,
    fetchChannels,
    fetchMessages,
    sendMessage,
    editMessage,
    pinMessage,
    setReplyingTo,
    setThreadMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    markAsRead,
    createChannel,
    createDM,
    toggleArchiveChannel,
    toggleStarChannel,
    updateMyPresence,

    // Helpers
    getChannelById: (id) => channels.find(ch => ch._id === id),
    getUnreadCount: (id) => unreadCounts[id] || 0,
    getUserPresence: (userId) => userPresence[userId] || { status: 'offline' },
    isChannelStarred: (id) => starredChannels.some(ch => ch._id === id),
    isChannelMuted,
    fetchMutedChannels
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
