import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { MoreVertical, Reply, Edit, Trash2, Pin, Bookmark, Smile, File, Download, Image as ImageIcon, Square, Circle, Type, ArrowRight, ClipboardList } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import { useNavigate } from 'react-router-dom';

const MessageBubble = ({ message, isGrouped }) => {
  const { user } = useAuth();
  const { editMessage, deleteMessage, addReaction, removeReaction, pinMessage, setReplyingTo } = useChat();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isHovered, setIsHovered] = useState(false);

  const isOwnMessage = user?._id === message.sender._id;

  const getElementIcon = (type) => {
    switch (type) {
      case 'rectangle':
      case 'square':
        return <Square className="w-5 h-5" />;
      case 'circle':
      case 'ellipse':
        return <Circle className="w-5 h-5" />;
      case 'text':
        return <Type className="w-5 h-5" />;
      case 'arrow':
        return <ArrowRight className="w-5 h-5" />;
      default:
        return <Square className="w-5 h-5" />;
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

  const handleEdit = async () => {
    if (editContent.trim() && editContent !== message.content) {
      try {
        await editMessage(message._id, editContent);
        setIsEditing(false);
      } catch (error) {
        console.error('Failed to edit message:', error);
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await deleteMessage(message._id, message.channel);
      } catch (error) {
        console.error('Failed to delete message:', error);
      }
    }
    setShowMenu(false);
  };

  const handlePin = async () => {
    try {
      await pinMessage(message._id, message.channel);
      setShowMenu(false);
    } catch (error) {
      console.error('Failed to pin message:', error);
    }
  };

  const handleReply = () => {
    if (setReplyingTo) {
      setReplyingTo(message);
    }
  };

  const handleReaction = async (emoji) => {
    const existingReaction = message.reactions?.find(r => r.emoji === emoji);
    const userReacted = existingReaction?.users?.some(u => u._id === user._id);

    if (userReacted) {
      await removeReaction(message._id, emoji);
    } else {
      await addReaction(message._id, emoji);
    }
    setShowEmojiPicker(false);
  };

  const quickReactions = ['❤️', '😂', '👍', '🎉', '😮', '😢'];

  // Generate soft avatar color based on user ID
  const getAvatarColor = (userId) => {
    const colors = [
      'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
      'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
      'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    ];
    const hash = userId?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    return colors[hash % colors.length];
  };

  return (
    <div
      className={`group relative px-4 ${isGrouped ? 'py-0.5' : 'py-2'} hover:bg-gray-50 dark:hover:bg-[#1A1D21] transition-colors duration-100`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowMenu(false);
        setShowEmojiPicker(false);
      }}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        {!isGrouped && (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0 shadow-md ${getAvatarColor(message.sender._id)}`}>
            {message.sender.name?.charAt(0).toUpperCase()}
          </div>
        )}
        {isGrouped && <div className="w-8 flex-shrink-0" />}

        <div className="flex-1 min-w-0">
          {/* Message Header */}
          {!isGrouped && (
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-[14px] text-gray-900 dark:text-neutral-50">
                {message.sender.name}
              </span>
              <span className="text-[11px] font-medium text-gray-400 dark:text-neutral-500">
                {formatTime(message.createdAt)}
              </span>
              {message.isEdited && (
                <span className="text-[12px] text-gray-400 dark:text-neutral-600 italic font-light">
                  (edited)
                </span>
              )}
              {message.isPinned && (
                <span className="flex items-center gap-1 text-[12px] text-blue-600 dark:text-blue-400">
                  <Pin className="w-3 h-3" />
                  Pinned
                </span>
              )}
            </div>
          )}

          {/* Message Content */}
          {isEditing ? (
            <div className="bg-gray-100 dark:bg-neutral-900 rounded-lg p-3 border border-gray-200 dark:border-neutral-800">
              <input
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEdit();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
                className="w-full bg-transparent border-none focus:outline-none text-sm text-gray-900 dark:text-neutral-50"
                autoFocus
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handleEdit}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-gray-600 dark:text-neutral-400 text-xs hover:bg-gray-200 dark:hover:bg-neutral-800 rounded-lg"
                >
                  Cancel
                </button>
                <span className="text-xs text-gray-500 dark:text-neutral-500">
                  escape to cancel • enter to save
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Message Content - NO BUBBLE (Slack style) */}
              <div className="max-w-full">
                <div className="transition-all duration-100">
                  {/* Reply Preview (if replying to another message) */}
                  {message.metadata?.replyTo && (
                    <div className={`pb-2.5 mb-2.5 border-l-2 pl-3 ${
                      isOwnMessage
                        ? 'border-blue-300 dark:border-blue-600'
                        : 'border-gray-300 dark:border-neutral-600'
                    }`}>
                      <div className={`text-[12px] font-medium ${
                        isOwnMessage
                          ? 'text-blue-700 dark:text-blue-400'
                          : 'text-gray-600 dark:text-neutral-400'
                      }`}>
                        Replying to {message.metadata.replyTo.sender?.name || 'Unknown'}
                      </div>
                      <div className={`text-[12px] opacity-70 truncate ${
                        isOwnMessage ? 'text-gray-700 dark:text-neutral-300' : 'text-gray-600 dark:text-neutral-400'
                      }`}>
                        {message.metadata.replyTo.content || 'Message'}
                      </div>
                    </div>
                  )}

                  {/* Message Content */}
                  <div className="text-[15px] leading-[1.47] break-words whitespace-pre-wrap text-gray-900 dark:text-[#D1D2D3]">
                    {message.content}
                  </div>

                  {/* File Attachments */}
                  {message.metadata?.files && message.metadata.files.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.metadata.files.map((file, index) => (
                        <div key={index}>
                          {file.type?.startsWith('image/') ? (
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={file.name}
                              className="block max-w-sm border border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600 transition-colors"
                            >
                              <img
                                src={file.url}
                                alt={file.name}
                                className="w-full h-auto"
                              />
                              <div className="px-3 py-2 bg-gray-50 dark:bg-neutral-900/50 border-t border-gray-200 dark:border-neutral-700">
                                <div className="text-[13px] text-gray-900 dark:text-neutral-300 truncate">
                                  {file.name}
                                </div>
                                <div className="text-[11px] text-gray-500 dark:text-neutral-500">
                                  {(file.size / 1024).toFixed(2)} KB
                                </div>
                              </div>
                            </a>
                          ) : (
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={file.name}
                              className="flex items-center gap-3 max-w-sm px-3 py-2 border border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-900/30 transition-colors"
                            >
                              <File className="w-8 h-8 text-gray-400 dark:text-neutral-500 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-[13px] text-gray-900 dark:text-neutral-300 truncate font-medium">
                                  {file.name}
                                </div>
                                <div className="text-[11px] text-gray-500 dark:text-neutral-500">
                                  {(file.size / 1024).toFixed(2)} KB
                                </div>
                              </div>
                              <Download className="w-4 h-4 text-gray-400 dark:text-neutral-500 flex-shrink-0" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Workspace Element */}
                  {message.metadata?.element && (
                    <div className="mt-2">
                      <button
                        onClick={() => navigate(`/workspace/${message.metadata.element.workspaceId}`)}
                        className="flex items-start gap-3 w-full max-w-md px-4 py-3 border-l-4 border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-left"
                      >
                        <div className="flex-shrink-0 p-2 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                          {getElementIcon(message.metadata.element.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1">
                            Workspace Element
                          </div>
                          <div className="text-[15px] font-semibold text-gray-900 dark:text-neutral-50 mb-1">
                            {message.metadata.element.title || 'Untitled Element'}
                          </div>
                          <div className="text-[13px] text-gray-600 dark:text-neutral-400">
                            From: {message.metadata.element.workspaceName || 'Unknown Workspace'}
                          </div>
                          {message.metadata.element.preview && (
                            <div className="text-[12px] text-gray-500 dark:text-neutral-500 mt-1 truncate">
                              {message.metadata.element.preview}
                            </div>
                          )}
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 dark:text-neutral-500 flex-shrink-0 mt-1" />
                      </button>
                    </div>
                  )}

                  {/* QA Ticket */}
                  {message.metadata?.ticket && (
                    <div className="mt-2">
                      <button
                        onClick={() => navigate('/qa-manager')}
                        className="flex items-start gap-3 w-full max-w-md px-4 py-3 border-l-4 border-orange-500 dark:border-orange-400 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors text-left"
                      >
                        <div className="flex-shrink-0 p-2 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400">
                          <ClipboardList className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide mb-1">
                            QA Ticket
                          </div>
                          <div className="text-[15px] font-semibold text-gray-900 dark:text-neutral-50 mb-1">
                            {message.metadata.ticket.title || 'Untitled Ticket'}
                          </div>
                          <div className="flex items-center gap-2 text-[13px] text-gray-600 dark:text-neutral-400">
                            <span className={`px-2 py-0.5 text-[11px] font-medium ${
                              message.metadata.ticket.status === 'open' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              message.metadata.ticket.status === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                              'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                            }`}>
                              {message.metadata.ticket.status}
                            </span>
                            <span>•</span>
                            <span>{message.metadata.ticket.priority} priority</span>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 dark:text-neutral-500 flex-shrink-0 mt-1" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {message.reactions.map((reaction) => {
                const userReacted = reaction.users?.some(u => u._id === user._id);
                const count = reaction.users?.length || 0;

                return (
                  <button
                    key={reaction.emoji}
                    onClick={() => handleReaction(reaction.emoji)}
                    className={`px-2.5 py-1 rounded-full text-[13px] flex items-center gap-1.5 transition-all duration-150 hover:scale-105 ${
                      userReacted
                        ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 shadow-sm'
                        : 'bg-white dark:bg-neutral-900/50 border border-gray-200 dark:border-neutral-800/50 hover:bg-gray-50 dark:hover:bg-neutral-800/50 hover:shadow-sm'
                    }`}
                  >
                    <span className="text-base">{reaction.emoji}</span>
                    <span className={`font-medium text-[12px] ${
                      userReacted ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-neutral-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Hover Actions - Positioned to not shift content */}
      {isHovered && !isEditing && (
        <div className="absolute top-[-8px] right-4 bg-white dark:bg-[#2B2D31] border border-gray-200/70 dark:border-neutral-700/70 rounded-lg shadow-xl flex items-center gap-1 p-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {/* Quick Reactions */}
          <div className="flex items-center gap-0.5 px-1 border-r border-gray-200/50 dark:border-neutral-700/50">
            {quickReactions.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition-all duration-100 text-base hover:scale-110 active:scale-95"
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* More Emoji */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition-all duration-100 active:scale-95"
            title="More reactions"
          >
            <Smile className="w-[18px] h-[18px] text-gray-600 dark:text-neutral-300" />
          </button>

          {/* Reply */}
          <button
            onClick={handleReply}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition-all duration-100 active:scale-95"
            title="Reply"
          >
            <Reply className="w-[18px] h-[18px] text-gray-600 dark:text-neutral-300" />
          </button>

          {/* Edit (own messages only) */}
          {isOwnMessage && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition-all duration-100 active:scale-95"
              title="Edit message"
            >
              <Edit className="w-[18px] h-[18px] text-gray-600 dark:text-neutral-300" />
            </button>
          )}

          {/* More Options */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition-all duration-100 active:scale-95"
              title="More options"
            >
              <MoreVertical className="w-[18px] h-[18px] text-gray-600 dark:text-neutral-300" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-xl py-1 z-20">
                <button
                  onClick={handlePin}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                >
                  <Pin className="w-4 h-4" />
                  {message.isPinned ? 'Unpin message' : 'Pin message'}
                </button>
                <button className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 flex items-center gap-2">
                  <Bookmark className="w-4 h-4" />
                  Bookmark
                </button>
                {isOwnMessage && (
                  <button
                    onClick={handleDelete}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute top-0 right-0 z-20">
          <EmojiPicker onSelectEmoji={handleReaction} onClose={() => setShowEmojiPicker(false)} />
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
