import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Smile } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import MessageBubble from './MessageBubble';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ThreadPanel = ({ parentMessage, onClose }) => {
  const { user } = useAuth();
  const { sendMessage, socket } = useChat();
  const [threadReplies, setThreadReplies] = useState([]);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [alsoSendToChannel, setAlsoSendToChannel] = useState(false);
  const inputRef = useRef(null);
  const repliesEndRef = useRef(null);

  // Fetch thread replies
  useEffect(() => {
    const fetchThreadReplies = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${API_URL}/api/chat/messages/${parentMessage._id}/thread`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setThreadReplies(response.data.replies || []);
      } catch (error) {
        console.error('Error fetching thread replies:', error);
      } finally {
        setLoading(false);
      }
    };

    if (parentMessage) {
      fetchThreadReplies();
    }
  }, [parentMessage]);

  // Listen for new thread replies via Socket.IO
  useEffect(() => {
    if (!socket || !parentMessage) return;

    const handleThreadReply = (data) => {
      if (data.parentMessageId === parentMessage._id) {
        setThreadReplies(prev => [...prev, data.message]);
        scrollToBottom();
      }
    };

    socket.on('thread:new_reply', handleThreadReply);

    return () => {
      socket.off('thread:new_reply', handleThreadReply);
    };
  }, [socket, parentMessage]);

  // Scroll to bottom on new replies
  const scrollToBottom = () => {
    setTimeout(() => {
      repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    if (threadReplies.length > 0) {
      scrollToBottom();
    }
  }, [threadReplies]);

  const handleSendReply = async () => {
    if (!replyContent.trim()) return;

    try {
      const metadata = {
        replyTo: parentMessage._id,
        isThreadReply: true,
        alsoSendToChannel
      };

      await sendMessage(
        parentMessage.channel,
        replyContent.trim(),
        'text',
        metadata
      );

      setReplyContent('');
      setAlsoSendToChannel(false);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending thread reply:', error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getAvatarColor = (userId) => {
    const colors = [
      'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
      'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    ];
    const hash = userId?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    return colors[hash % colors.length];
  };

  return (
    <div className="w-96 h-full bg-white dark:bg-[#1A1D21] border-l border-gray-200/60 dark:border-neutral-800/60 flex flex-col">
      {/* Thread Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-gray-200/60 dark:border-neutral-800/60 flex-shrink-0">
        <h2 className="text-[15px] font-bold text-gray-900 dark:text-white">
          Thread
        </h2>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-900 rounded transition-colors"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-neutral-400" />
        </button>
      </div>

      {/* Parent Message */}
      <div className="flex-shrink-0 border-b border-gray-200/60 dark:border-neutral-800/60">
        <div className="px-4 py-3">
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0 ${getAvatarColor(parentMessage.sender._id)}`}>
              {parentMessage.sender.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-[14px] text-gray-900 dark:text-neutral-50">
                  {parentMessage.sender.name}
                </span>
                <span className="text-[11px] font-medium text-gray-400 dark:text-neutral-500">
                  {formatTime(parentMessage.createdAt)}
                </span>
              </div>
              <div className="text-[15px] text-gray-900 dark:text-[#D1D2D3] break-words">
                {parentMessage.content}
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 py-2 bg-gray-50 dark:bg-neutral-900/30 border-t border-gray-200/60 dark:border-neutral-800/60">
          <div className="text-[13px] text-gray-600 dark:text-neutral-400">
            {threadReplies.length} {threadReplies.length === 1 ? 'reply' : 'replies'}
          </div>
        </div>
      </div>

      {/* Thread Replies */}
      <div className="flex-1 overflow-y-auto px-0 py-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : threadReplies.length === 0 ? (
          <div className="flex items-center justify-center py-8 px-4">
            <div className="text-center">
              <p className="text-[13px] text-gray-500 dark:text-neutral-400">
                No replies yet. Start the conversation!
              </p>
            </div>
          </div>
        ) : (
          <>
            {threadReplies.map((reply) => (
              <MessageBubble
                key={reply._id}
                message={reply}
                isGrouped={false}
              />
            ))}
            <div ref={repliesEndRef} />
          </>
        )}
      </div>

      {/* Reply Input */}
      <div className="flex-shrink-0 border-t border-gray-200/60 dark:border-neutral-800/60">
        <div className="p-3">
          <div className="bg-white dark:bg-neutral-900/50 border border-gray-300 dark:border-neutral-700 rounded-lg">
            <textarea
              ref={inputRef}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Reply to thread..."
              className="w-full px-3 py-2 bg-transparent border-none resize-none focus:outline-none text-[15px] text-gray-900 dark:text-neutral-50 placeholder-gray-500 dark:placeholder-neutral-500"
              rows={3}
              autoFocus
            />
            <div className="px-3 py-2 flex items-center justify-between border-t border-gray-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-[13px] text-gray-600 dark:text-neutral-400 cursor-pointer hover:text-gray-900 dark:hover:text-neutral-200">
                  <input
                    type="checkbox"
                    checked={alsoSendToChannel}
                    onChange={(e) => setAlsoSendToChannel(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-neutral-600 text-blue-600 focus:ring-blue-500"
                  />
                  Also send to channel
                </label>
              </div>
              <button
                onClick={handleSendReply}
                disabled={!replyContent.trim()}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreadPanel;
