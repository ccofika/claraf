import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import {
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader,
  User,
  MessageSquare,
  Search,
  History,
  X,
  ExternalLink
} from 'lucide-react';

const KYC = () => {
  // Form state
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');

  // UI state
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [slackConnected, setSlackConnected] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [existingThread, setExistingThread] = useState(null);
  const [checkingThread, setCheckingThread] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Thread modal state
  const [selectedThread, setSelectedThread] = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Recipient email (za sada - kasnije će biti kanal)
  const RECIPIENT_EMAIL = 'vasilijevitorovic@mebit.io';

  // Load messages on mount
  useEffect(() => {
    checkSlackAccess();
    loadMessages();
  }, []);

  // Setup Socket.io connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      // Get JWT token from localStorage
      const token = localStorage.getItem('token');

      if (token) {
        // Authenticate with JWT token (backend will verify and extract userId)
        socket.emit('authenticate', { token });
      } else {
        console.warn('⚠️ No token found in localStorage - Socket.io authentication will fail');
      }
    });

    socket.on('authenticated', (data) => {
    });

    socket.on('auth_error', (error) => {
      console.error('❌ Socket authentication failed:', error);
    });

    socket.on('disconnect', () => {
    });

    socket.on('thread-reply', (data) => {
      handleThreadReply(data);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket.io connection error:', error);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check for existing thread when username changes
  useEffect(() => {
    const checkThread = async () => {
      if (username.trim().length >= 3) {
        setCheckingThread(true);
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/slack/check-thread/${username}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (response.data.exists) {
            setExistingThread(response.data.thread);
          } else {
            setExistingThread(null);
          }
        } catch (err) {
          console.error('Error checking thread:', err);
          setExistingThread(null);
        } finally {
          setCheckingThread(false);
        }
      } else {
        setExistingThread(null);
      }
    };

    const timer = setTimeout(checkThread, 500);
    return () => clearTimeout(timer);
  }, [username]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkSlackAccess = async () => {
    try {
      setCheckingAccess(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/slack/check-access`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSlackConnected(response.data.hasAccess);

      if (!response.data.hasAccess) {
        setError(response.data.message);
      }
    } catch (err) {
      console.error('Error checking Slack access:', err);
      setError('Failed to check Slack connection');
    } finally {
      setCheckingAccess(false);
    }
  };

  const loadMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/slack/kyc-messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const transformedMessages = response.data.messages.map(msg => ({
        id: msg._id,
        username: msg.username || 'Unknown',
        text: msg.messageText,
        status: msg.status,
        sentAt: new Date(msg.sentAt),
        threadTs: msg.slackThreadTs,
        channel: msg.slackChannel,
        recipient: {
          id: msg.recipientSlackId,
          name: msg.recipientName,
          email: msg.recipientEmail
        },
        reply: msg.reply ? {
          text: msg.reply.text,
          user: msg.reply.slackUserId,
          timestamp: new Date(msg.reply.timestamp)
        } : null
      }));

      // Sort by sentAt ascending (oldest first, newest at bottom)
      transformedMessages.sort((a, b) => a.sentAt - b.sentAt);

      setMessages(transformedMessages);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    if (!slackConnected) {
      setError('Slack not connected. Please log out and log back in.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/slack/send-kyc-request`,
        {
          username: username.trim(),
          message: message.trim(),
          recipientEmail: RECIPIENT_EMAIL,
          existingThreadTs: existingThread?.threadTs
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const newMessage = {
        id: response.data.messageId, // Use MongoDB _id for consistency
        username: username.trim(),
        text: message.trim(),
        status: 'pending',
        sentAt: new Date(),
        threadTs: response.data.slack.threadTs,
        channel: response.data.slack.channel,
        recipient: response.data.slack.recipient,
        reply: null
      };

      setMessages(prev => [...prev, newMessage]);

      // Clear form
      setMessage('');
      setUsername('');
      setExistingThread(null);

    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleThreadReply = (data) => {
    setMessages(prev => {
      // Try to find by messageId first (most precise)
      let targetMessage = prev.find(msg => msg.id === data.messageId);

      if (targetMessage) {
        // Found by messageId
      } else {

        // Fallback: Find LATEST pending message with matching threadTs
        const messagesInThread = prev.filter(msg => msg.threadTs === data.threadTs);
        targetMessage = messagesInThread
          .filter(msg => msg.status === 'pending')
          .sort((a, b) => b.sentAt - a.sentAt)[0];

        if (targetMessage) {
          // Found by threadTs
        } else {
          console.warn('⚠️ No pending message found in thread! Thread reply will not update any cards.');
          return prev;
        }
      }

      // Update the specific message
      const updated = prev.map(msg => {
        if (msg.id === targetMessage.id) {
          return {
            ...msg,
            status: 'answered',
            reply: {
              text: data.reply.text,
              user: data.reply.user,
              timestamp: new Date(data.reply.timestamp)
            }
          };
        }
        return msg;
      });

      const answeredCount = updated.filter(m => m.status === 'answered').length;

      return updated;
    });
  };

  const openThreadModal = async (msg) => {
    setSelectedThread(msg);
    setLoadingThread(true);

    try {
      const token = localStorage.getItem('token');
      const apiUrl = `${process.env.REACT_APP_API_URL}/api/slack/thread/${msg.threadTs}`;


      const response = await axios.get(apiUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setThreadMessages(response.data.messages || []);

      if (!response.data.messages || response.data.messages.length === 0) {
        console.warn('⚠️ No messages returned from backend for thread:', msg.threadTs);
      }
    } catch (err) {
      console.error('❌ Error loading thread:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setThreadMessages([]);

      // Show error to user
      setError(`Failed to load thread: ${err.response?.data?.message || err.message}`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoadingThread(false);
    }
  };

  const closeThreadModal = () => {
    setSelectedThread(null);
    setThreadMessages([]);
  };

  const handleMarkAsResolved = async (messageId, event) => {
    // Stop propagation to prevent opening thread modal
    event.stopPropagation();

    try {

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/slack/kyc-messages/${messageId}/resolve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {

        // Update local state
        setMessages(prev => prev.map(msg =>
          msg.id === messageId
            ? { ...msg, status: 'resolved' }
            : msg
        ));
      }

      // Handle legacy message deletion
      if (response.data.deleted) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        setError('Legacy message removed. Please use the new format for future messages.');
        setTimeout(() => setError(''), 5000);
      }
    } catch (err) {
      console.error('❌ Error marking message as resolved:', err);

      // Handle legacy message deletion response
      if (err.response?.data?.deleted) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        setError(err.response.data.message || 'Legacy message removed.');
        setTimeout(() => setError(''), 5000);
      } else {
        setError(err.response?.data?.message || 'Failed to mark message as resolved');
        setTimeout(() => setError(''), 5000);
      }
    }
  };

  const filteredMessages = messages.filter(msg => {
    // Resolved messages are ONLY shown when explicitly filtered for 'resolved'
    if (msg.status === 'resolved' && filterStatus !== 'resolved') {
      return false;
    }

    // If 'all' is selected, show pending and answered (resolved already filtered out above)
    if (filterStatus === 'all') {
      const matchesSearch = !searchQuery ||
        msg.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.text.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    }

    // Otherwise, match the specific filter
    const matchesFilter = msg.status === filterStatus;
    const matchesSearch = !searchQuery ||
      msg.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.text.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: messages.length,
    pending: messages.filter(m => m.status === 'pending').length,
    answered: messages.filter(m => m.status === 'answered').length,
    resolved: messages.filter(m => m.status === 'resolved').length
  };

  if (checkingAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Checking Slack connection...</p>
        </div>
      </div>
    );
  }

  if (!slackConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-destructive/10 p-2 flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold mb-2">Slack Not Connected</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please go to your profile page to connect your Slack account and use this feature.
              </p>
              <button
                onClick={() => {
                  window.location.href = '/profile';
                }}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
              >
                Go to Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">KYC Management</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Accelerated verification requests
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-3 sm:gap-6 justify-around sm:justify-end">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-amber-600">{stats.pending}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.answered}</div>
                <div className="text-xs text-muted-foreground">Answered</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-emerald-600">{stats.resolved}</div>
                <div className="text-xs text-muted-foreground">Resolved</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Error Alert */}
        {error && (
          <div className="mb-4 sm:mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive flex-1 min-w-0 break-words">{error}</p>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid lg:grid-cols-5 gap-4 sm:gap-6">
          {/* Left Panel - Request Form */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24 rounded-lg border bg-card p-4 sm:p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 sm:mb-6">New Request</h2>

              <form onSubmit={handleSendMessage} className="space-y-4 sm:space-y-5">
                {/* Username Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter customer username"
                      className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={loading}
                    />
                  </div>

                  {/* Thread Detection */}
                  {checkingThread && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader className="h-3 w-3 animate-spin" />
                      Checking for existing conversation...
                    </div>
                  )}

                  {existingThread && (
                    <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 p-3">
                      <div className="flex items-start gap-2">
                        <History className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                            Existing Thread Found
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                            This message will continue the existing conversation
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Message Textarea */}
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe the verification issue or request..."
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    disabled={loading}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !message.trim() || !username.trim()}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
                >
                  {loading ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Request
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Panel - Messages Feed */}
          <div className="lg:col-span-3">
            {/* Filter Bar */}
            <div className="mb-4 sm:mb-6 rounded-lg border bg-card p-3 sm:p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by username or message..."
                    className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-full sm:w-auto"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="answered">Answered</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            {/* Messages List */}
            <div className="space-y-3 sm:space-y-4 max-h-[calc(100vh-320px)] sm:max-h-[calc(100vh-280px)] overflow-y-auto pr-1 sm:pr-2">
              {filteredMessages.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-card p-8 sm:p-12 text-center">
                  <MessageSquare className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50 mb-3 sm:mb-4" />
                  <h3 className="font-medium mb-2 text-sm sm:text-base">
                    {searchQuery || filterStatus !== 'all'
                      ? 'No messages found'
                      : 'No messages yet'
                    }
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {searchQuery || filterStatus !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Send your first KYC request to get started'
                    }
                  </p>
                </div>
              ) : (
                filteredMessages.map(msg => (
                  <div
                    key={msg.id}
                    className="rounded-lg border bg-card p-4 sm:p-5 shadow-sm hover:shadow-md transition-all relative group"
                  >
                    {/* X Button - absolute positioned in top-right */}
                    <button
                      onClick={(e) => handleMarkAsResolved(msg.id, e)}
                      className="absolute top-3 right-3 rounded-full p-1.5 bg-background border border-input hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors opacity-0 group-hover:opacity-100 z-10"
                      title="Mark as resolved"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>

                    {/* Card content - clickable */}
                    <div onClick={() => openThreadModal(msg)} className="cursor-pointer">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3 sm:mb-4 gap-3 pr-8">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <div className="rounded-full bg-primary/10 p-1.5 sm:p-2 flex-shrink-0">
                            <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-sm sm:text-base truncate">{msg.username}</div>
                            <div className="flex items-center gap-2 mt-1">
                              {msg.status === 'pending' && (
                                <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-950 px-2 py-0.5 sm:py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                                  <Clock className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                  Pending
                                </span>
                              )}
                              {msg.status === 'answered' && (
                                <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-950 px-2 py-0.5 sm:py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                                  <CheckCircle className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                  Answered
                                </span>
                              )}
                              {msg.status === 'resolved' && (
                                <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 sm:py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                  <CheckCircle className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                  Resolved
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground flex-shrink-0">
                          <div className="hidden sm:block">{new Date(msg.sentAt).toLocaleDateString()}</div>
                          <div>{new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </div>

                      {/* Message Text */}
                      <div className="mb-3 sm:mb-4">
                        <p className="text-sm leading-relaxed line-clamp-3">
                          {msg.text}
                        </p>
                      </div>

                      {/* Reply Preview */}
                      {(msg.status === 'answered' || msg.status === 'resolved') && msg.reply && (
                        <div className="pt-3 sm:pt-4 border-t">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className="rounded-full bg-emerald-100 dark:bg-emerald-950 p-1 sm:p-1.5 flex-shrink-0">
                              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                KYC Agent Response
                              </p>
                              <p className="text-sm leading-relaxed line-clamp-2">
                                {msg.reply.text}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Click to view thread indicator */}
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Click to view full thread</span>
                          <ExternalLink className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </div>

      {/* Thread Modal */}
      {selectedThread && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative w-full max-w-3xl rounded-lg border bg-card shadow-lg">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b p-4 sm:p-6">
                  <div className="min-w-0 flex-1 pr-4">
                    <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 flex-shrink-0" />
                      <span className="truncate">Thread for {selectedThread.username}</span>
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(selectedThread.sentAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={closeThreadModal}
                    className="rounded-md p-2 hover:bg-accent transition-colors flex-shrink-0"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
                  {loadingThread ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* All Thread Messages from Slack */}
                      {threadMessages.length > 0 ? (
                        threadMessages.map((threadMsg, idx) => {
                          const isFromOurApp = threadMsg.isFromOurApp;
                          const isInitial = threadMsg.isInitial || idx === 0;

                          return (
                            <div
                              key={idx}
                              className={`rounded-lg border p-4 ${
                                isFromOurApp
                                  ? 'bg-muted/50'
                                  : 'bg-emerald-50 dark:bg-emerald-950/20'
                              }`}
                            >
                              <div className="flex items-start gap-3 mb-3">
                                <div className={`rounded-full p-2 flex-shrink-0 ${
                                  isFromOurApp
                                    ? 'bg-primary/10'
                                    : 'bg-emerald-100 dark:bg-emerald-950'
                                }`}>
                                  {isFromOurApp ? (
                                    <User className="h-4 w-4 text-primary" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm">
                                    {threadMsg.userName}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(threadMsg.timestamp).toLocaleString()}
                                  </div>
                                  <div className="mt-1">
                                    {isInitial && (
                                      <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-950 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300 mr-2">
                                        Initial Request
                                      </span>
                                    )}
                                    {isFromOurApp ? (
                                      <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Customer Support
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                        KYC Agent
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {threadMsg.text}
                              </p>
                            </div>
                          );
                        })
                      ) : (
                        !loadingThread && (
                          <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No messages in this thread</p>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="border-t p-4 sm:p-6 flex justify-end">
                  <button
                    onClick={closeThreadModal}
                    className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KYC;
