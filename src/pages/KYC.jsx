import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import {
  Send, CheckCircle, Clock, AlertCircle, Loader, User, MessageSquare,
  Search, History, X, ExternalLink, CheckCheck
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

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

  const RECIPIENT_EMAIL = 'vasilijevitorovic@mebit.io';

  useEffect(() => {
    checkSlackAccess();
    loadMessages();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      const token = localStorage.getItem('token');
      if (token) {
        socket.emit('authenticate', { token });
      }
    });

    socket.on('thread-reply', (data) => {
      handleThreadReply(data);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

      transformedMessages.sort((a, b) => a.sentAt - b.sentAt);

      setMessages(transformedMessages);
    } catch (err) {
      console.error('Error loading messages:', err);
      toast.error('Failed to load messages');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }

    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (!slackConnected) {
      toast.error('Slack not connected. Please log out and log back in.');
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
        id: response.data.messageId,
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

      setMessage('');
      setUsername('');
      setExistingThread(null);

      toast.success('Request sent successfully');
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleThreadReply = (data) => {
    setMessages(prev => {
      let targetMessage = prev.find(msg => msg.id === data.messageId);

      if (!targetMessage) {
        const messagesInThread = prev.filter(msg => msg.threadTs === data.threadTs);
        targetMessage = messagesInThread
          .filter(msg => msg.status === 'pending')
          .sort((a, b) => b.sentAt - a.sentAt)[0];

        if (!targetMessage) {
          return prev;
        }
      }

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

      return updated;
    });
    toast.success('Reply received!');
  };

  const openThreadModal = async (msg) => {
    setSelectedThread(msg);
    setLoadingThread(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/slack/thread/${msg.threadTs}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setThreadMessages(response.data.messages || []);
    } catch (err) {
      console.error('Error loading thread:', err);
      setThreadMessages([]);
      toast.error('Failed to load thread');
    } finally {
      setLoadingThread(false);
    }
  };

  const closeThreadModal = () => {
    setSelectedThread(null);
    setThreadMessages([]);
  };

  const handleMarkAsResolved = async (messageId, event) => {
    event.stopPropagation();

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/slack/kyc-messages/${messageId}/resolve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMessages(prev => prev.map(msg =>
          msg.id === messageId
            ? { ...msg, status: 'resolved' }
            : msg
        ));
        toast.success('Marked as resolved');
      }

      if (response.data.deleted) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        toast.info('Legacy message removed');
      }
    } catch (err) {
      console.error('Error marking message as resolved:', err);

      if (err.response?.data?.deleted) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        toast.info('Legacy message removed');
      } else {
        toast.error('Failed to mark as resolved');
      }
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (msg.status === 'resolved' && filterStatus !== 'resolved') {
      return false;
    }

    if (filterStatus === 'all') {
      const matchesSearch = !searchQuery ||
        msg.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.text.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    }

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

  // Loading Skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4 animate-pulse">
      <div className="h-32 bg-muted/30 rounded-lg"></div>
      <div className="h-32 bg-muted/30 rounded-lg"></div>
      <div className="h-32 bg-muted/30 rounded-lg"></div>
    </div>
  );

  // Empty State
  const EmptyState = ({ icon: Icon, title, description, action }) => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground/70" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">{description}</p>
      {action}
    </div>
  );

  // Status Badge Component
  const StatusBadge = ({ status }) => {
    const config = {
      'pending': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800', icon: Clock },
      'answered': { color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800', icon: CheckCircle },
      'resolved': { color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800', icon: CheckCheck }
    };

    const { color, icon: Icon } = config[status] || config['pending'];

    return (
      <Badge variant="outline" className={`${color} border flex items-center gap-1 px-2 py-0.5`}>
        <Icon className="w-3 h-3" />
        <span className="text-xs font-medium capitalize">{status}</span>
      </Badge>
    );
  };

  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  if (!slackConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6">
            <EmptyState
              icon={AlertCircle}
              title="Slack Not Connected"
              description="Please go to your profile page to connect your Slack account and use this feature."
              action={
                <button
                  onClick={() => window.location.href = '/profile'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Profile
                </button>
              }
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">KYC Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Accelerated verification requests
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Requests</p>
                  <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
                </div>
                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                  <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Answered</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.answered}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Resolved</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.resolved}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <CheckCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive flex-1">{error}</p>
              <button
                onClick={() => setError('')}
                className="text-destructive hover:text-destructive/80"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Request Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader className="border-b">
                <CardTitle className="text-lg font-semibold">New Request</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSendMessage} className="space-y-5">
                  {/* Username Input */}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium text-card-foreground">
                      Username <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter customer username"
                        className="pl-9"
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
                    <Label htmlFor="message" className="text-sm font-medium text-card-foreground">
                      Message <span className="text-red-500">*</span>
                    </Label>
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe the verification issue or request..."
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-card text-foreground px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      disabled={loading}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || !message.trim() || !username.trim()}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 w-full"
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
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Messages Feed */}
          <div className="lg:col-span-2">
            {/* Filter Bar */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by username or message..."
                      className="pl-9 h-9"
                    />
                  </div>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="flex h-9 rounded-md border border-input bg-card text-foreground px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-full sm:w-auto"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="answered">Answered</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Messages List */}
            {filteredMessages.length === 0 ? (
              <Card>
                <CardContent className="p-0">
                  <EmptyState
                    icon={MessageSquare}
                    title={searchQuery || filterStatus !== 'all' ? "No messages found" : "No messages yet"}
                    description={searchQuery || filterStatus !== 'all' ? "Try adjusting your filters" : "Send your first KYC request to get started"}
                    action={null}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto">
                {filteredMessages.map(msg => (
                  <Card key={msg.id} className="group hover:shadow-md transition-all relative">
                    <CardContent className="p-5">
                      {/* X Button */}
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
                        <div className="flex items-start justify-between mb-4 gap-3 pr-8">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 p-2 flex-shrink-0">
                              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-sm truncate">{msg.username}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <StatusBadge status={msg.status} />
                              </div>
                            </div>
                          </div>
                          <div className="text-right text-xs text-muted-foreground flex-shrink-0">
                            <div className="hidden sm:block">{new Date(msg.sentAt).toLocaleDateString()}</div>
                            <div>{new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        </div>

                        {/* Message Text */}
                        <div className="mb-4">
                          <p className="text-sm leading-relaxed line-clamp-3">
                            {msg.text}
                          </p>
                        </div>

                        {/* Reply Preview */}
                        {(msg.status === 'answered' || msg.status === 'resolved') && msg.reply && (
                          <div className="pt-4 border-t">
                            <div className="flex items-start gap-3">
                              <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-1.5 flex-shrink-0">
                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
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
                    </CardContent>
                  </Card>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Thread Modal */}
      {selectedThread && (
        <Dialog open={!!selectedThread} onOpenChange={closeThreadModal}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <DialogTitle className="text-xl">Thread for {selectedThread.username}</DialogTitle>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(selectedThread.sentAt).toLocaleString()}
              </p>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto py-4">
              {loadingThread ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : threadMessages.length > 0 ? (
                <div className="space-y-4">
                  {threadMessages.map((threadMsg, idx) => {
                    const isFromOurApp = threadMsg.isFromOurApp;
                    const isInitial = threadMsg.isInitial || idx === 0;

                    return (
                      <div
                        key={idx}
                        className={`rounded-lg border p-4 ${
                          isFromOurApp
                            ? 'bg-muted/50'
                            : 'bg-green-50 dark:bg-green-950/20'
                        }`}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`rounded-full p-2 flex-shrink-0 ${
                            isFromOurApp
                              ? 'bg-blue-100 dark:bg-blue-900/20'
                              : 'bg-green-100 dark:bg-green-950'
                          }`}>
                            {isFromOurApp ? (
                              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm">
                              {threadMsg.userName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(threadMsg.timestamp).toLocaleString()}
                            </div>
                            <div className="mt-1 flex gap-2">
                              {isInitial && (
                                <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                                  Initial Request
                                </Badge>
                              )}
                              {isFromOurApp ? (
                                <Badge variant="secondary" className="text-xs">
                                  Customer Support
                                </Badge>
                              ) : (
                                <Badge className="text-xs bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                                  KYC Agent
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {threadMsg.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={MessageSquare}
                  title="No messages in this thread"
                  description="There are no messages available for this conversation"
                  action={null}
                />
              )}
            </div>

            <DialogFooter>
              <button
                onClick={closeThreadModal}
                className="px-4 py-2 text-card-foreground border border-input rounded-lg hover:bg-muted/50 transition-colors"
              >
                Close
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default KYC;
