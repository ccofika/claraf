import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { Send, CheckCircle, Clock, AlertCircle, Loader } from 'lucide-react';

const KYC = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [slackConnected, setSlackConnected] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Recipient email (kolega za testiranje)
  const RECIPIENT_EMAIL = 'markokrsticic@mebit.io';

  // Check Slack access and load messages on mount
  useEffect(() => {
    checkSlackAccess();
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/slack/kyc-messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ Messages loaded from database:', response.data.messages.length);

      // Transform database messages to frontend format
      const transformedMessages = response.data.messages.map(msg => ({
        id: msg._id,
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

      setMessages(transformedMessages);
    } catch (err) {
      console.error('❌ Error loading messages:', err);
    }
  };

  // Setup Socket.io connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    console.log('🔌 Connecting to Socket.io...');
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('✅ Socket.io connected:', socket.id);
      const userId = localStorage.getItem('userId');
      if (userId) {
        socket.emit('authenticate', { userId });
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket.io disconnected');
    });

    // Listen for thread replies
    socket.on('thread-reply', (data) => {
      console.log('🔔 Thread reply received:', data);
      handleThreadReply(data);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  // Auto-scroll to bottom when new message added
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

      console.log('🔍 Slack access check:', response.data);
      setSlackConnected(response.data.hasAccess);

      if (!response.data.hasAccess) {
        setError(response.data.message);
      }
    } catch (err) {
      console.error('❌ Error checking Slack access:', err);
      setError('Failed to check Slack connection');
    } finally {
      setCheckingAccess(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

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
        `${process.env.REACT_APP_API_URL}/api/slack/send-dm`,
        {
          recipientEmail: RECIPIENT_EMAIL,
          message: message.trim()
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('✅ Message sent:', response.data);

      // Add message to local state
      const newMessage = {
        id: response.data.slack.ts,
        text: message.trim(),
        status: 'pending',
        sentAt: new Date(),
        threadTs: response.data.slack.ts,
        channel: response.data.slack.channel,
        recipient: response.data.slack.recipient,
        reply: null
      };

      setMessages(prev => [...prev, newMessage]);
      setMessage('');

    } catch (err) {
      console.error('❌ Error sending message:', err);
      setError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleThreadReply = (data) => {
    console.log('🎯 Processing thread reply:', data);

    setMessages(prev => prev.map(msg => {
      if (msg.threadTs === data.threadTs) {
        console.log('✅ Matching message found, updating to resolved');
        return {
          ...msg,
          status: 'resolved',
          reply: {
            text: data.reply.text,
            user: data.reply.user,
            timestamp: new Date(data.reply.timestamp)
          }
        };
      }
      return msg;
    }));
  };

  const renderMessageCard = (msg) => {
    const isPending = msg.status === 'pending';
    const isResolved = msg.status === 'resolved';

    return (
      <div
        key={msg.id}
        className={`
          p-4 rounded-lg border transition-all duration-500 ease-in-out
          ${isResolved
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
          }
          transform hover:scale-[1.01]
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {isPending ? (
              <Clock className="text-yellow-600 dark:text-yellow-400" size={18} />
            ) : (
              <CheckCircle className="text-green-600 dark:text-green-400" size={18} />
            )}
            <span className={`text-sm font-semibold ${
              isPending
                ? 'text-yellow-700 dark:text-yellow-300'
                : 'text-green-700 dark:text-green-300'
            }`}>
              {isPending ? 'PENDING' : 'RESOLVED'}
            </span>
          </div>
          <span className="text-xs text-gray-500 dark:text-neutral-400">
            {new Date(msg.sentAt).toLocaleTimeString()}
          </span>
        </div>

        {/* Message Text */}
        <div className="mb-2">
          <p className="text-sm font-medium text-gray-600 dark:text-neutral-400 mb-1">Message:</p>
          <p className="text-sm text-gray-900 dark:text-neutral-50 whitespace-pre-wrap">
            {msg.text}
          </p>
        </div>

        {/* Recipient Info */}
        <div className="mb-2">
          <p className="text-xs text-gray-500 dark:text-neutral-400">
            Sent to: <span className="font-medium">{msg.recipient.name}</span> ({msg.recipient.email})
          </p>
        </div>

        {/* Reply (if resolved) */}
        {isResolved && msg.reply && (
          <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
            <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Reply:</p>
            <p className="text-sm text-gray-900 dark:text-neutral-50 whitespace-pre-wrap">
              {msg.reply.text}
            </p>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
              Replied at: {new Date(msg.reply.timestamp).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    );
  };

  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader className="animate-spin text-gray-600 dark:text-neutral-400" size={32} />
          <p className="text-sm text-gray-600 dark:text-neutral-400">Checking Slack connection...</p>
        </div>
      </div>
    );
  }

  if (!slackConnected) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0" size={24} />
            <div>
              <h3 className="text-lg font-bold text-red-700 dark:text-red-300 mb-2">
                Slack Not Connected
              </h3>
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                {error || 'You need to connect your Slack account to use this feature.'}
              </p>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/login';
                }}
                className="px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition-colors text-sm"
              >
                Log Out and Reconnect
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle className="text-green-600 dark:text-green-400" size={28} />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-50">
              KYC Management
            </h1>
          </div>
          <p className="text-sm text-gray-600 dark:text-neutral-400">
            Send KYC requests and track responses via Slack
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0" size={18} />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="mb-6">
          <div className="flex gap-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your KYC request message here..."
              className="flex-1 px-4 py-3 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-black text-gray-900 dark:text-neutral-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 resize-none"
              rows={3}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="px-6 py-3 bg-gray-900 dark:bg-neutral-50 text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-neutral-200 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 self-end"
            >
              {loading ? (
                <Loader className="animate-spin" size={18} />
              ) : (
                <Send size={18} />
              )}
              Send
            </button>
          </div>
        </form>

        {/* Messages List */}
        <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-neutral-400">
              <CheckCircle size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">No messages yet. Send your first KYC request above!</p>
            </div>
          ) : (
            messages.map(msg => renderMessageCard(msg))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};

export default KYC;
