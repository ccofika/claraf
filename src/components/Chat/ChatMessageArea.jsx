import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { MoreVertical, Users, Search, Pin, Archive } from 'lucide-react';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

const ChatMessageArea = ({ showMemberList, onToggleMemberList }) => {
  const { activeChannel, messages, pinnedMessages, typingUsers } = useChat();
  const [showChannelMenu, setShowChannelMenu] = useState(false);

  const getChannelName = (channel) => {
    if (channel.name) return channel.name;

    // For DMs, show other user's name
    if (channel.type === 'dm' && channel.members?.length === 2) {
      const otherMember = channel.members.find(m => m.userId._id !== channel._id);
      return otherMember?.userId?.name || 'Unknown User';
    }

    return 'Unnamed Channel';
  };

  const getChannelDescription = (channel) => {
    if (channel.description) return channel.description;

    if (channel.type === 'dm' && channel.members?.length === 2) {
      const otherMember = channel.members.find(m => m.userId._id !== channel._id);
      return otherMember?.userId?.email || '';
    }

    if (channel.type === 'group') {
      return `${channel.members?.length || 0} members`;
    }

    return '';
  };

  if (!activeChannel) return null;

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-black">
      {/* Channel Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-gray-200 dark:border-neutral-800">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-gray-900 dark:text-neutral-50 truncate">
              {getChannelName(activeChannel)}
            </h2>
            {getChannelDescription(activeChannel) && (
              <p className="text-xs text-gray-500 dark:text-neutral-400 truncate">
                {getChannelDescription(activeChannel)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Messages */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors"
            title="Search in conversation"
          >
            <Search className="w-5 h-5 text-gray-600 dark:text-neutral-400" />
          </button>

          {/* Toggle Member List */}
          {activeChannel.type !== 'dm' && (
            <button
              onClick={onToggleMemberList}
              className={`p-2 rounded-lg transition-colors ${
                showMemberList
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'hover:bg-gray-100 dark:hover:bg-neutral-900 text-gray-600 dark:text-neutral-400'
              }`}
              title="Toggle member list"
            >
              <Users className="w-5 h-5" />
            </button>
          )}

          {/* Channel Menu */}
          <div className="relative">
            <button
              onClick={() => setShowChannelMenu(!showChannelMenu)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors"
              title="Channel options"
            >
              <MoreVertical className="w-5 h-5 text-gray-600 dark:text-neutral-400" />
            </button>

            {showChannelMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-lg py-1 z-10">
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center gap-2">
                  <Pin className="w-4 h-4" />
                  View Pinned Messages
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center gap-2">
                  <Archive className="w-4 h-4" />
                  Archive Conversation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pinned Messages Banner */}
      {pinnedMessages.length > 0 && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 text-sm text-blue-900 dark:text-blue-300">
            <Pin className="w-4 h-4" />
            <span className="font-medium">{pinnedMessages.length} pinned message{pinnedMessages.length > 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {/* Message List */}
      <MessageList />

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-2 text-sm text-gray-500 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 dark:bg-neutral-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-gray-400 dark:bg-neutral-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-gray-400 dark:bg-neutral-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
            <span>
              {typingUsers.length === 1
                ? 'Someone is typing...'
                : `${typingUsers.length} people are typing...`}
            </span>
          </div>
        </div>
      )}

      {/* Chat Input */}
      <ChatInput />
    </div>
  );
};

export default ChatMessageArea;
