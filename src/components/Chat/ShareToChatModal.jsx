import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Send, Search, Hash, User, Users, Loader2 } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { toast } from 'sonner';

const ShareToChatModal = ({ isOpen, onClose, item, type }) => {
  const { channels, sendMessage } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedChannel(null);
    }
  }, [isOpen]);

  const getChannelIcon = (channel) => {
    if (channel.type === 'dm') return <User className="w-4 h-4" />;
    if (channel.type === 'group') return <Users className="w-4 h-4" />;
    return <Hash className="w-4 h-4" />;
  };

  const getChannelName = (channel) => {
    if (channel.name) return channel.name;
    if (channel.type === 'dm' && channel.members?.length === 2) {
      const otherMember = channel.members.find(m => m.userId._id !== channel._id);
      return otherMember?.userId?.name || 'Unknown User';
    }
    return 'Unnamed Channel';
  };

  // Filter non-archived channels
  const availableChannels = channels.filter(ch => {
    if (ch.isArchived) return false;
    if (!searchQuery) return true;
    const channelName = getChannelName(ch).toLowerCase();
    return channelName.includes(searchQuery.toLowerCase());
  });

  // Helper function to strip HTML tags
  const stripHtml = (html) => {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const handleShare = async () => {
    if (!selectedChannel || !item) return;

    setIsSending(true);
    try {
      let content, metadata, messageType;

      if (type === 'element') {
        // Strip HTML only for the text message content, keep HTML in metadata
        const cleanTitle = stripHtml(item.title || 'Untitled');

        content = `Shared workspace element: ${cleanTitle}`;
        messageType = 'element';
        metadata = {
          element: {
            elementId: item._id || item.id,
            workspaceId: item.workspaceId,
            workspaceName: item.workspaceName,
            type: item.type,
            title: item.title || 'Untitled', // Keep HTML
            preview: item.content || '', // Keep HTML
            description: item.description || '', // Keep HTML
            macro: item.macro || '', // Keep HTML
            example: item.example || null,
            exampleIndex: item.exampleIndex !== null && item.exampleIndex !== undefined ? item.exampleIndex : null,
            thumbnailUrl: item.thumbnailUrl || null
          }
        };
      } else if (type === 'ticket') {
        content = `Shared QA ticket: ${item.title || 'Untitled'}`;
        messageType = 'ticket';
        metadata = {
          ticket: {
            ticketId: item._id || item.id,
            title: item.title,
            description: item.description?.substring(0, 100) || '',
            status: item.status,
            priority: item.priority?.toLowerCase() || 'medium', // Convert to lowercase for enum
            category: item.category
          }
        };
      }

      await sendMessage(selectedChannel._id, content, messageType, metadata);
      toast.success(`Shared to ${getChannelName(selectedChannel)}`);
      onClose();
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white dark:bg-[#1A1D21] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200/60 dark:border-neutral-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-gray-900 dark:text-white" />
            <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">
              Share to Chat
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-neutral-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200/60 dark:border-neutral-800/60">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-neutral-900/50 border border-gray-300 dark:border-neutral-700 text-[15px] text-gray-900 dark:text-neutral-50 placeholder-gray-500 dark:placeholder-neutral-500 focus:outline-none focus:border-[#1164A3]"
              autoFocus
            />
          </div>
        </div>

        {/* Channel List */}
        <div className="flex-1 overflow-y-auto">
          {availableChannels.length === 0 ? (
            <div className="p-16 text-center text-gray-500 dark:text-neutral-400">
              <p className="text-[15px]">No conversations found</p>
            </div>
          ) : (
            <div>
              {availableChannels.map((channel) => (
                <button
                  key={channel._id}
                  onClick={() => setSelectedChannel(channel)}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-[#1A1D21] transition-colors border-b border-gray-100 dark:border-neutral-900 ${
                    selectedChannel?._id === channel._id ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                  }`}
                >
                  <div className="flex-shrink-0 text-gray-600 dark:text-neutral-400">
                    {getChannelIcon(channel)}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-[15px] font-medium text-gray-900 dark:text-neutral-50 truncate">
                      {getChannelName(channel)}
                    </div>
                    {channel.type === 'group' && channel.members && (
                      <div className="text-[13px] text-gray-500 dark:text-neutral-500">
                        {channel.members.length} members
                      </div>
                    )}
                  </div>
                  {selectedChannel?._id === channel._id && (
                    <div className="w-5 h-5 rounded-full bg-[#1164A3] flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200/60 dark:border-neutral-800/60 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[15px] font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={!selectedChannel || isSending}
            className="px-4 py-2 text-[15px] font-medium text-white bg-[#1164A3] hover:bg-[#0E5A8A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Share
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ShareToChatModal;
