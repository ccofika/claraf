import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Loader2, AlertCircle, RefreshCw, Bot,
  Paperclip, ArrowDown, UserRound, ShieldCheck, Info,
  Image as ImageIcon, X, Download
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { staggerContainerFast, staggerItem } from '../utils/animations';

const API_URL = process.env.REACT_APP_API_URL;

// Cache conversation data to avoid re-fetching on tab switches
const conversationCache = new Map();

const formatTime = (unix) => {
  if (!unix) return '';
  const date = new Date(unix * 1000);
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

// System event types that should show as centered labels
const SYSTEM_TYPES = new Set([
  'assignment', 'close', 'open', 'away_mode_assignment',
  'participant_added', 'participant_removed', 'conversation_rating_changed',
  'snoozed', 'unsnoozed', 'title_update', 'state_change',
  'conversation_attribute_updated_by_admin'
]);

const ConversationPanel = ({ ticketId, headerExtra }) => {
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [lightbox, setLightbox] = useState(null); // { url, name }
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  }, []);

  const fetchConversation = useCallback(async (forceRefresh = false) => {
    if (!ticketId) {
      setError('No ticket ID provided');
      return;
    }

    // Check cache
    if (!forceRefresh && conversationCache.has(ticketId)) {
      setConversation(conversationCache.get(ticketId));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${API_URL}/api/qa/intercom-conversation/${ticketId}`,
        getAuthHeaders()
      );
      setConversation(response.data);
      conversationCache.set(ticketId, response.data);

      // Limit cache size
      if (conversationCache.size > 30) {
        const firstKey = conversationCache.keys().next().value;
        conversationCache.delete(firstKey);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Conversation not found for this ticket ID');
      } else {
        setError('Failed to load conversation');
      }
    } finally {
      setLoading(false);
    }
  }, [ticketId, getAuthHeaders]);

  // Reset state when ticketId changes (e.g. navigating between tickets)
  useEffect(() => {
    setConversation(null);
    setError(null);
    setShowScrollDown(false);
    setLightbox(null);
  }, [ticketId]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  // Scroll to bottom on load
  useEffect(() => {
    if (conversation && bottomRef.current) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, [conversation]);

  // Track scroll position for "scroll to bottom" button
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollDown(scrollHeight - scrollTop - clientHeight > 150);
  }, []);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Filter messages: only show messages with body content + system events
  const visibleMessages = conversation?.messages?.filter(msg => {
    if (SYSTEM_TYPES.has(msg.type)) return true;
    return msg.body && msg.body.trim().length > 0;
  }) || [];

  // ── Loading State ──
  if (loading) {
    return (
      <div className="flex flex-col h-full p-3 sm:p-4 gap-3">
        <div className="flex items-center gap-2 text-gray-500 dark:text-neutral-400 text-xs">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Loading conversation...</span>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
            <div
              className={`rounded-2xl h-12 animate-pulse ${
                i % 2 === 0
                  ? 'w-3/4 bg-gray-200 dark:bg-neutral-800 rounded-bl-sm'
                  : 'w-2/3 bg-blue-100 dark:bg-blue-900/30 rounded-br-sm'
              }`}
            />
          </div>
        ))}
      </div>
    );
  }

  // ── Error State ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 gap-3 text-center">
        <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
        </div>
        <p className="text-sm text-gray-600 dark:text-neutral-400">{error}</p>
        <button
          onClick={() => fetchConversation(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-neutral-300 bg-gray-100 dark:bg-neutral-800 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </button>
      </div>
    );
  }

  // ── Empty State ──
  if (!conversation || visibleMessages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 gap-3 text-center">
        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-gray-400 dark:text-neutral-500" />
        </div>
        <p className="text-sm text-gray-500 dark:text-neutral-400">No conversation found</p>
        <p className="text-xs text-gray-400 dark:text-neutral-500">Enter a valid ticket ID to view the conversation</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Header bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 sm:px-4 py-2 border-b border-gray-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-sm">
        <div className="flex items-center gap-2 min-w-0">
          <MessageSquare className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500 flex-shrink-0" />
          <span className="text-xs font-medium text-gray-700 dark:text-neutral-300 truncate">
            #{conversation.id}
          </span>
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
            conversation.state === 'open'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : conversation.state === 'closed'
              ? 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400'
              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
          }`}>
            {conversation.state}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {headerExtra}
          <button
            onClick={() => fetchConversation(true)}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            title="Refresh conversation"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-1.5"
      >
        <motion.div
          variants={staggerContainerFast}
          initial="initial"
          animate="animate"
          className="space-y-1.5"
        >
          {visibleMessages.map((msg, idx) => {
            // ── System message ──
            if (SYSTEM_TYPES.has(msg.type)) {
              const label = msg.type.replace(/_/g, ' ');
              return (
                <motion.div
                  key={msg.id || idx}
                  variants={staggerItem}
                  className="flex justify-center py-1"
                >
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-neutral-800 text-[10px] text-gray-500 dark:text-neutral-500">
                    <Info className="w-2.5 h-2.5" />
                    {label}
                    {msg.authorName && msg.authorName !== 'System' && (
                      <span className="text-gray-400 dark:text-neutral-600">
                        &middot; {msg.authorName}
                      </span>
                    )}
                  </span>
                </motion.div>
              );
            }

            const isAdmin = msg.authorType === 'admin';
            const isBot = msg.authorType === 'bot';
            const isRight = isAdmin;

            // Check if previous message was from same author (for grouping)
            const prevMsg = idx > 0 ? visibleMessages[idx - 1] : null;
            const sameSender = prevMsg &&
              !SYSTEM_TYPES.has(prevMsg.type) &&
              prevMsg.authorType === msg.authorType &&
              prevMsg.authorName === msg.authorName;

            return (
              <motion.div
                key={msg.id || idx}
                variants={staggerItem}
                className={`flex flex-col ${isRight ? 'items-end' : 'items-start'} ${sameSender ? '' : 'mt-2.5'}`}
              >
                {/* Author info - only show on first message of group */}
                {!sameSender && (
                  <div className={`flex items-center gap-1.5 mb-0.5 px-1 ${isRight ? 'flex-row-reverse' : ''}`}>
                    {msg.authorAvatar ? (
                      <img
                        src={msg.authorAvatar}
                        alt={msg.authorName}
                        className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                      />
                    ) : isBot ? (
                      <Bot className="w-3.5 h-3.5 text-amber-500" />
                    ) : isAdmin ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                    ) : (
                      <UserRound className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500" />
                    )}
                    <span className="text-[10px] font-medium text-gray-500 dark:text-neutral-400">
                      {msg.authorName}
                    </span>
                  </div>
                )}

                {/* Images - rendered outside bubble, no background */}
                {msg.attachments?.filter(att =>
                  att.content_type?.startsWith('image/') ||
                  /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(att.name || att.url || '')
                ).map((att, ai) => (
                  <div key={`img-${ai}`} className="relative max-w-[85%]">
                    <img
                      src={att.url}
                      alt={att.name || 'image'}
                      loading="lazy"
                      onClick={() => setLightbox({ url: att.url, name: att.name })}
                      className={`max-w-full max-h-52 rounded-xl object-cover cursor-pointer transition-all hover:opacity-90 hover:shadow-lg border border-gray-200 dark:border-neutral-700 ${
                        isRight ? 'ml-auto' : ''
                      }`}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'none' }}
                      className="items-center gap-1 text-[11px] py-0.5 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <ImageIcon className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{att.name || 'image'}</span>
                    </a>
                  </div>
                ))}

                {/* Text bubble - only if there's text AND no images (images replace the bubble entirely) */}
                {msg.body && msg.body.trim() && !msg.attachments?.some(att =>
                  att.content_type?.startsWith('image/') ||
                  /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(att.name || att.url || '')
                ) && (
                  <div
                    className={`relative max-w-[85%] px-2.5 py-1.5 text-[13px] leading-relaxed whitespace-pre-wrap break-words ${
                      isRight
                        ? `bg-blue-500 dark:bg-blue-600 text-white ${sameSender && !msg.attachments?.some(a => a.content_type?.startsWith('image/')) ? 'rounded-2xl rounded-tr-md' : 'rounded-2xl rounded-br-sm'}`
                        : isBot
                        ? `bg-amber-50 dark:bg-amber-900/20 text-gray-800 dark:text-neutral-200 border border-amber-200/50 dark:border-amber-800/30 ${sameSender && !msg.attachments?.some(a => a.content_type?.startsWith('image/')) ? 'rounded-2xl rounded-tl-md' : 'rounded-2xl rounded-bl-sm'}`
                        : `bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-neutral-200 ${sameSender && !msg.attachments?.some(a => a.content_type?.startsWith('image/')) ? 'rounded-2xl rounded-tl-md' : 'rounded-2xl rounded-bl-sm'}`
                    }`}
                  >
                    {msg.body}

                    {/* Non-image attachments inside bubble */}
                    {msg.attachments?.filter(att =>
                      !att.content_type?.startsWith('image/') &&
                      !/\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(att.name || att.url || '')
                    ).length > 0 && (
                      <div className={`mt-1.5 pt-1.5 space-y-0.5 border-t ${
                        isRight ? 'border-blue-400/30' : 'border-gray-200 dark:border-neutral-700'
                      }`}>
                        {msg.attachments.filter(att =>
                          !att.content_type?.startsWith('image/') &&
                          !/\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(att.name || att.url || '')
                        ).map((att, ai) => (
                          <a
                            key={ai}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-1 text-[11px] py-0.5 ${
                              isRight
                                ? 'text-blue-100 hover:text-white'
                                : 'text-blue-600 dark:text-blue-400 hover:underline'
                            }`}
                          >
                            <Paperclip className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{att.name || 'attachment'}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Timestamp */}
                <span className={`text-[10px] text-gray-400 dark:text-neutral-600 mt-0.5 px-1 ${isRight ? 'text-right' : ''}`}>
                  {formatTime(msg.createdAt)}
                </span>
              </motion.div>
            );
          })}
        </motion.div>
        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom FAB */}
      <AnimatePresence>
        {showScrollDown && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 shadow-lg flex items-center justify-center text-gray-500 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors z-20"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Image Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightbox.url}
                alt={lightbox.name || 'image'}
                className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain"
              />
              <div className="absolute -top-3 -right-3 flex items-center gap-1.5">
                <a
                  href={lightbox.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 shadow-lg flex items-center justify-center text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                  title="Open in new tab"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => setLightbox(null)}
                  className="w-8 h-8 rounded-full bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 shadow-lg flex items-center justify-center text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {lightbox.name && (
                <p className="text-center text-xs text-white/60 mt-2 truncate">{lightbox.name}</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConversationPanel;
