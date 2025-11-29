import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { MoreVertical, Users, Search, Pin, Archive, Settings, Hash } from 'lucide-react';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import SearchModal from './SearchModal';
import PinnedMessagesModal from './PinnedMessagesModal';
import ChannelSettingsModal from './ChannelSettingsModal';

const ChatMessageArea = ({ showMemberList, onToggleMemberList }) => {
  const { activeChannel, messages, pinnedMessages, typingUsers, toggleArchiveChannel } = useChat();
  const [showChannelMenu, setShowChannelMenu] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showPinnedModal, setShowPinnedModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

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
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#1A1D21]">
      {/* Channel Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200/60 dark:border-neutral-800/60 flex-shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {activeChannel.type !== 'dm' && (
                <Hash className="w-4 h-4 text-gray-500 dark:text-neutral-500 flex-shrink-0" />
              )}
              <h2 className="text-[15px] font-bold text-gray-900 dark:text-white truncate">
                {getChannelName(activeChannel)}
              </h2>
            </div>
            {/* Show topic if available, otherwise show description */}
            {(activeChannel.topic || getChannelDescription(activeChannel)) && (
              <p
                className="text-[13px] text-gray-600 dark:text-neutral-400 truncate cursor-pointer hover:text-gray-800 dark:hover:text-neutral-300"
                onClick={() => setShowSettingsModal(true)}
                title={activeChannel.topic || getChannelDescription(activeChannel)}
              >
                {activeChannel.topic || getChannelDescription(activeChannel)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          {/* Search Messages */}
          <button
            onClick={() => setShowSearchModal(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors"
            title="Search in conversation"
          >
            <Search className="w-[18px] h-[18px] text-gray-600 dark:text-neutral-400" />
          </button>

          {/* Toggle Member List */}
          {activeChannel.type !== 'dm' && (
            <button
              onClick={onToggleMemberList}
              className={`p-2 transition-colors ${
                showMemberList
                  ? 'bg-[#1164A3]/10 dark:bg-[#1164A3]/20 text-[#1164A3]'
                  : 'hover:bg-gray-100 dark:hover:bg-neutral-900 text-gray-600 dark:text-neutral-400'
              }`}
              title="Toggle member list"
            >
              <Users className="w-[18px] h-[18px]" />
            </button>
          )}

          {/* Channel Menu */}
          <div className="relative">
            <button
              onClick={() => setShowChannelMenu(!showChannelMenu)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors"
              title="Channel options"
            >
              <MoreVertical className="w-[18px] h-[18px] text-gray-600 dark:text-neutral-400" />
            </button>

            {showChannelMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-900 border border-gray-200/60 dark:border-neutral-700 shadow-xl py-1 z-10">
                <button
                  onClick={() => {
                    setShowSettingsModal(true);
                    setShowChannelMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-[15px] text-gray-900 dark:text-neutral-300 hover:bg-[#1164A3] hover:text-white dark:hover:bg-[#1164A3] flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  {activeChannel.type === 'dm' ? 'Conversation Settings' : 'Channel Settings'}
                </button>
                <button
                  onClick={() => {
                    setShowPinnedModal(true);
                    setShowChannelMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-[15px] text-gray-900 dark:text-neutral-300 hover:bg-[#1164A3] hover:text-white dark:hover:bg-[#1164A3] flex items-center gap-2"
                >
                  <Pin className="w-4 h-4" />
                  View Pinned Messages
                </button>
                <div className="my-1 border-t border-gray-200 dark:border-neutral-700" />
                <button
                  onClick={async () => {
                    try {
                      await toggleArchiveChannel(activeChannel._id);
                      setShowChannelMenu(false);
                    } catch (error) {
                      console.error('Failed to archive channel:', error);
                    }
                  }}
                  className="w-full px-3 py-2 text-left text-[15px] text-gray-900 dark:text-neutral-300 hover:bg-[#1164A3] hover:text-white dark:hover:bg-[#1164A3] flex items-center gap-2"
                >
                  <Archive className="w-4 h-4" />
                  Archive Conversation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pinned Messages Banner */}
      {(pinnedMessages[activeChannel?._id]?.length || 0) > 0 && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 text-sm text-blue-900 dark:text-blue-300">
            <Pin className="w-4 h-4" />
            <span className="font-medium">{pinnedMessages[activeChannel._id].length} pinned message{pinnedMessages[activeChannel._id].length > 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {/* Message List */}
      <MessageList />

      {/* Typing Indicator */}
      {activeChannel && typingUsers[activeChannel._id]?.length > 0 && (
        <div className="px-4 py-2 text-sm text-gray-500 dark:text-neutral-400 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 dark:bg-neutral-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-gray-400 dark:bg-neutral-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-gray-400 dark:bg-neutral-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
            <span>
              {typingUsers[activeChannel._id].length === 1
                ? `${typingUsers[activeChannel._id][0].name} is typing...`
                : `${typingUsers[activeChannel._id].length} people are typing...`}
            </span>
          </div>
        </div>
      )}

      {/* Typing Indicator */}
      {typingUsers && typingUsers.length > 0 && (
        <div className="px-4 py-2 text-sm text-gray-600 dark:text-neutral-400 bg-gray-50 dark:bg-[#1A1D21] border-t border-gray-200/60 dark:border-neutral-800/60">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-gray-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-gray-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
            <span>
              {typingUsers.length === 1
                ? `${typingUsers[0].name} is typing...`
                : typingUsers.length === 2
                ? `${typingUsers[0].name} and ${typingUsers[1].name} are typing...`
                : `${typingUsers.length} people are typing...`}
            </span>
          </div>
        </div>
      )}

      {/* Chat Input */}
      <div className="flex-shrink-0">
        <ChatInput />
      </div>

      {/* Modals */}
      <SearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
      <PinnedMessagesModal
        isOpen={showPinnedModal}
        onClose={() => setShowPinnedModal(false)}
        pinnedMessages={pinnedMessages[activeChannel._id] || []}
      />
      <ChannelSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        channel={activeChannel}
      />
    </div>
  );
};

export default ChatMessageArea;
