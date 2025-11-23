import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../../context/ChatContext';
import MessageBubble from './MessageBubble';
import { Loader2 } from 'lucide-react';

const MessageList = () => {
  const { messages, activeChannel, fetchMessages } = useChat();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

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
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-neutral-900 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400 dark:text-neutral-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-neutral-50 mb-1">
            No messages yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-neutral-400">
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
      className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
    >
      {/* Loading indicator at top */}
      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 text-gray-400 dark:text-neutral-600 animate-spin" />
        </div>
      )}

      {/* Messages */}
      {groupedMessages.map((item, index) => {
        if (item.type === 'date') {
          return (
            <div key={`date-${index}`} className="flex items-center justify-center my-6">
              <div className="px-3 py-1 bg-gray-100 dark:bg-neutral-900 rounded-full">
                <span className="text-xs font-medium text-gray-600 dark:text-neutral-400">
                  {formatDateDivider(item.date)}
                </span>
              </div>
            </div>
          );
        }

        const message = item.data;
        const previousItem = groupedMessages[index - 1];
        const isGrouped = shouldGroupWithPrevious(message, previousItem);

        return (
          <MessageBubble
            key={message._id}
            message={message}
            isGrouped={isGrouped}
          />
        );
      })}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
