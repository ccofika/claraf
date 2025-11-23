import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
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

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Calculate total unread count
  useEffect(() => {
    const total = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
    setTotalUnreadCount(total);
  }, [unreadCounts]);

  // Fetch channels
  const fetchChannels = useCallback(async () => {
    if (!token) return;

    try {
      const response = await axios.get(`${API_URL}/api/chat/channels`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setChannels(response.data);

      // Update unread counts
      const counts = {};
      response.data.forEach(channel => {
        counts[channel._id] = channel.unreadCount || 0;
      });
      setUnreadCounts(counts);
    } catch (error) {
      console.error('Error fetching channels:', error);
      toast.error('Failed to load chat channels');
    }
  }, [token, API_URL]);

  // Fetch messages for a channel
  const fetchMessages = useCallback(async (channelId, before = null) => {
    if (!token) return;

    try {
      const params = before ? { before } : {};
      const response = await axios.get(
        `${API_URL}/api/chat/channels/${channelId}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
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
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
      return { messages: [], hasMore: false };
    }
  }, [token, API_URL]);

  // Send message
  const sendMessage = useCallback(async (channelId, content, type = 'text', metadata = {}) => {
    if (!token) return;

    try {
      const response = await axios.post(
        `${API_URL}/api/chat/messages`,
        { channelId, content, type, metadata },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Emit socket event for real-time delivery
      if (socket && isConnected) {
        socket.emit('chat:message:send', {
          channelId,
          message: response.data
        });
      }

      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      throw error;
    }
  }, [token, socket, isConnected, API_URL]);

  // Edit message
  const editMessage = useCallback(async (messageId, content) => {
    if (!token) return;

    try {
      const response = await axios.put(
        `${API_URL}/api/chat/messages/${messageId}`,
        { content },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setMessages(prev => {
        const newMessages = { ...prev };
        Object.keys(newMessages).forEach(channelId => {
          newMessages[channelId] = newMessages[channelId].map(msg =>
            msg._id === messageId ? response.data : msg
          );
        });
        return newMessages;
      });

      // Emit socket event
      if (socket && isConnected && activeChannel) {
        socket.emit('chat:message:edit', {
          messageId,
          channelId: activeChannel._id,
          content
        });
      }

      return response.data;
    } catch (error) {
      console.error('Error editing message:', error);
      toast.error('Failed to edit message');
      throw error;
    }
  }, [token, socket, isConnected, activeChannel, API_URL]);

  // Delete message
  const deleteMessage = useCallback(async (messageId, channelId) => {
    if (!token) return;

    try {
      await axios.delete(`${API_URL}/api/chat/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      setMessages(prev => ({
        ...prev,
        [channelId]: prev[channelId]?.filter(msg => msg._id !== messageId) || []
      }));

      // Emit socket event
      if (socket && isConnected) {
        socket.emit('chat:message:delete', { messageId, channelId });
      }

      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
      throw error;
    }
  }, [token, socket, isConnected, API_URL]);

  // Add reaction
  const addReaction = useCallback(async (messageId, emoji) => {
    if (!token) return;

    try {
      const response = await axios.post(
        `${API_URL}/api/chat/messages/${messageId}/reactions`,
        { emoji },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setMessages(prev => {
        const newMessages = { ...prev };
        Object.keys(newMessages).forEach(channelId => {
          newMessages[channelId] = newMessages[channelId].map(msg =>
            msg._id === messageId ? response.data : msg
          );
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
      console.error('Error adding reaction:', error);
      toast.error('Failed to add reaction');
    }
  }, [token, socket, isConnected, activeChannel, API_URL]);

  // Remove reaction
  const removeReaction = useCallback(async (messageId, emoji) => {
    if (!token) return;

    try {
      const response = await axios.delete(
        `${API_URL}/api/chat/messages/${messageId}/reactions`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { emoji }
        }
      );

      // Update local state
      setMessages(prev => {
        const newMessages = { ...prev };
        Object.keys(newMessages).forEach(channelId => {
          newMessages[channelId] = newMessages[channelId].map(msg =>
            msg._id === messageId ? response.data : msg
          );
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
      console.error('Error removing reaction:', error);
    }
  }, [token, socket, isConnected, activeChannel, API_URL]);

  // Mark messages as read
  const markAsRead = useCallback(async (channelId) => {
    if (!token) return;

    try {
      await axios.post(
        `${API_URL}/api/chat/channels/${channelId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

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
      console.error('Error marking messages as read:', error);
    }
  }, [token, socket, isConnected, API_URL]);

  // Create channel
  const createChannel = useCallback(async (type, name, description, memberIds, workspaceId) => {
    if (!token) return;

    try {
      const response = await axios.post(
        `${API_URL}/api/chat/channels`,
        { type, name, description, memberIds, workspaceId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setChannels(prev => [response.data, ...prev]);

      // Emit socket event
      if (socket && isConnected) {
        socket.emit('chat:channel:created', { channel: response.data });
      }

      toast.success('Channel created successfully');
      return response.data;
    } catch (error) {
      console.error('Error creating channel:', error);
      toast.error('Failed to create channel');
      throw error;
    }
  }, [token, socket, isConnected, API_URL]);

  // Create or get DM channel
  const createDM = useCallback(async (otherUserId) => {
    if (!token) return;

    try {
      const response = await axios.post(
        `${API_URL}/api/chat/channels`,
        { type: 'dm', memberIds: [otherUserId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Check if channel already exists in state
      const existingChannel = channels.find(ch => ch._id === response.data._id);
      if (!existingChannel) {
        setChannels(prev => [response.data, ...prev]);
      }

      return response.data;
    } catch (error) {
      console.error('Error creating DM:', error);
      toast.error('Failed to create direct message');
      throw error;
    }
  }, [token, channels, API_URL]);

  // Initialize chat when user is authenticated
  useEffect(() => {
    if (user && token && socket && isConnected && !isChatInitialized) {
      // Emit chat:init to join all user's channels
      socket.emit('chat:init');

      socket.on('chat:init:success', () => {
        console.log('✅ Chat initialized successfully');
        setIsChatInitialized(true);
        fetchChannels();
      });

      return () => {
        socket.off('chat:init:success');
      };
    }
  }, [user, token, socket, isConnected, isChatInitialized, fetchChannels]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Message received
    socket.on('chat:message:received', (data) => {
      const { channelId, message } = data;

      setMessages(prev => ({
        ...prev,
        [channelId]: [...(prev[channelId] || []), message]
      }));

      // Update unread count if not in active channel
      if (!activeChannel || activeChannel._id !== channelId) {
        setUnreadCounts(prev => ({
          ...prev,
          [channelId]: (prev[channelId] || 0) + 1
        }));
      }

      // Update channel's last message
      setChannels(prev =>
        prev.map(ch =>
          ch._id === channelId
            ? { ...ch, lastMessage: data.lastMessage || ch.lastMessage }
            : ch
        )
      );
    });

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
      setChannels(prev =>
        prev.map(ch => (ch._id === data.channel._id ? data.channel : ch))
      );
    });

    // Channel deleted
    socket.on('chat:channel:deleted', (data) => {
      setChannels(prev => prev.filter(ch => ch._id !== data.channelId));
      if (activeChannel && activeChannel._id === data.channelId) {
        setActiveChannel(null);
      }
    });

    return () => {
      socket.off('chat:message:received');
      socket.off('chat:message:edited');
      socket.off('chat:message:deleted');
      socket.off('chat:typing:update');
      socket.off('chat:reaction:added');
      socket.off('chat:user:presence');
      socket.off('chat:channel:new');
      socket.off('chat:channel:updated');
      socket.off('chat:channel:deleted');
    };
  }, [socket, isConnected, activeChannel, fetchMessages]);

  // Join/leave channel rooms
  useEffect(() => {
    if (!socket || !isConnected || !activeChannel) return;

    socket.emit('chat:channel:join', activeChannel._id);

    return () => {
      socket.emit('chat:channel:leave', activeChannel._id);
    };
  }, [socket, isConnected, activeChannel]);

  // Mark as read when active channel changes
  useEffect(() => {
    if (activeChannel) {
      markAsRead(activeChannel._id);
    }
  }, [activeChannel, markAsRead]);

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

    // Actions
    setActiveChannel,
    fetchChannels,
    fetchMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    markAsRead,
    createChannel,
    createDM,

    // Helpers
    getChannelById: (id) => channels.find(ch => ch._id === id),
    getUnreadCount: (id) => unreadCounts[id] || 0,
    getUserPresence: (userId) => userPresence[userId] || { status: 'offline' }
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
