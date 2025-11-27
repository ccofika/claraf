import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useChat } from '../../context/ChatContext';
import MessageBubble from './MessageBubble';
import { Loader2 } from 'lucide-react';

const MessageList = () => {
  const { messages, activeChannel, fetchMessages, highlightedMessageId } = useChat();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messageRefs = useRef({});
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [localHighlightId, setLocalHighlightId] = useState(null);

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initial scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [activeChannel]);

  // Auto-scroll on new message (only if already at bottom)
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages.length]);

  // Scroll to specific message function
  const scrollToSpecificMessage = useCallback((messageId) => {
    const messageElement = messageRefs.current[messageId];
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setLocalHighlightId(messageId);

      // Clear highlight after 3 seconds
      setTimeout(() => {
        setLocalHighlightId(null);
      }, 3000);
    } else {
      console.log('Message element not found for ID:', messageId);
    }
  }, []);

  // Listen for scrollToMessage event
  useEffect(() => {
    const handleScrollToMessage = (event) => {
      const { messageId } = event.detail;
      console.log('📜 MessageList received scrollToMessage event:', messageId);

      // Small delay to ensure DOM is updated
      setTimeout(() => {
        scrollToSpecificMessage(messageId);
      }, 100);
    };

    window.addEventListener('scrollToMessage', handleScrollToMessage);

    return () => {
      window.removeEventListener('scrollToMessage', handleScrollToMessage);
    };
  }, [scrollToSpecificMessage]);

  // Also respond to highlightedMessageId from context
  useEffect(() => {
    if (highlightedMessageId) {
      setTimeout(() => {
        scrollToSpecificMessage(highlightedMessageId);
      }, 100);
    }
  }, [highlightedMessageId, scrollToSpecificMessage]);

  // Load more messages on scroll to top
  const handleScroll = async (e) => {
    const { scrollTop } = e.target;

    if (scrollTop === 0 && !isLoadingMore && hasMore && messages.length > 0) {
      setIsLoadingMore(true);

      try {
        const oldestMessage = messages[0];
        const result = await fetchMessages(activeChannel._id, oldestMessage.createdAt);

        setHasMore(result?.hasMore || false);
      } catch (error) {
        console.error('Error loading more messages:', error);
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

  // Group messages by date
  const groupMessagesByDate = (messages) => {
    const groups = [];
    let currentDate = null;

    messages.forEach((message) => {
      const messageDate = new Date(message.createdAt).toDateString();

      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({
          type: 'date',
          date: new Date(message.createdAt)
        });
      }

      groups.push({
        type: 'message',
        data: message
      });
    });

    return groups;
  };

  const formatDateDivider = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const messageDate = new Date(date);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  // Check if messages should be grouped (same sender, within 5 minutes)
  const shouldGroupWithPrevious = (currentMessage, previousMessage) => {
    if (!previousMessage || previousMessage.type === 'date') return false;
    if (previousMessage.data.sender._id !== currentMessage.sender._id) return false;

    const timeDiff = new Date(currentMessage.createdAt) - new Date(previousMessage.data.createdAt);
    return timeDiff < 5 * 60 * 1000; // 5 minutes
  };

  const groupedMessages = groupMessagesByDate(messages);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 bg-white dark:bg-[#1A1D21]">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gray-50 dark:bg-neutral-900/50 flex items-center justify-center border border-gray-200/50 dark:border-neutral-800/50">
            <svg
              className="w-10 h-10 text-gray-300 dark:text-neutral-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="text-[15px] font-medium text-gray-900 dark:text-neutral-50 mb-2">
            No messages yet
          </h3>
          <p className="text-[13px] text-gray-400 dark:text-neutral-500">
            Send a message to start the conversation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={messagesContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto overflow-x-hidden px-0 py-2 bg-white dark:bg-[#1A1D21]"
      style={{ minHeight: 0 }}
    >
      {/* Loading indicator at top */}
      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 text-gray-300 dark:text-neutral-700 animate-spin" />
        </div>
      )}

      {/* Messages */}
      {groupedMessages.map((item, index) => {
        if (item.type === 'date') {
          return (
            <div key={`date-${index}`} className="flex items-center justify-center my-8">
              <div className="relative">
                <div className="px-4 py-1.5 bg-white dark:bg-neutral-900/50 rounded-full border border-gray-200/60 dark:border-neutral-800/60 shadow-sm">
                  <span className="text-[12px] font-medium text-gray-500 dark:text-neutral-400">
                    {formatDateDivider(item.date)}
                  </span>
                </div>
              </div>
            </div>
          );
        }

        const message = item.data;
        const previousItem = groupedMessages[index - 1];
        const isGrouped = shouldGroupWithPrevious(message, previousItem);
        const isHighlighted = localHighlightId === message._id || highlightedMessageId === message._id;

        return (
          <div
            key={message._id}
            ref={(el) => { messageRefs.current[message._id] = el; }}
            className={`transition-all duration-500 ${
              isHighlighted
                ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-400 dark:ring-blue-500 ring-inset rounded-lg'
                : ''
            }`}
          >
            <MessageBubble
              message={message}
              isGrouped={isGrouped}
            />
          </div>
        );
      })}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
