import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { MoreVertical, Reply, Edit, Trash2, Pin, Bookmark, Smile } from 'lucide-react';
import EmojiPicker from './EmojiPicker';

const MessageBubble = ({ message, isGrouped }) => {
  const { user } = useAuth();
  const { editMessage, deleteMessage, addReaction, removeReaction } = useChat();
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isHovered, setIsHovered] = useState(false);

  const isOwnMessage = user?._id === message.sender._id;

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

  return (
    <div
      className={`group relative ${isGrouped ? 'mt-0.5' : 'mt-4'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        {!isGrouped && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {message.sender.name?.charAt(0).toUpperCase()}
          </div>
        )}
        {isGrouped && <div className="w-8 flex-shrink-0" />}

        <div className="flex-1 min-w-0">
          {/* Message Header */}
          {!isGrouped && (
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm text-gray-900 dark:text-neutral-50">
                {message.sender.name}
              </span>
              <span className="text-xs text-gray-500 dark:text-neutral-500">
                {formatTime(message.createdAt)}
              </span>
              {message.isEdited && (
                <span className="text-xs text-gray-400 dark:text-neutral-600 italic">
                  (edited)
                </span>
              )}
            </div>
          )}

          {/* Message Content */}
          {isEditing ? (
            <div className="bg-gray-100 dark:bg-neutral-900 rounded-lg p-2">
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
              <div className="text-sm text-gray-900 dark:text-neutral-50 break-words">
                {message.content}
              </div>

              {/* Time on hover for grouped messages */}
              {isGrouped && isHovered && (
                <span className="text-xs text-gray-400 dark:text-neutral-600 ml-2">
                  {formatTime(message.createdAt)}
                </span>
              )}
            </>
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {message.reactions.map((reaction) => {
                const userReacted = reaction.users?.some(u => u._id === user._id);
                const count = reaction.users?.length || 0;

                return (
                  <button
                    key={reaction.emoji}
                    onClick={() => handleReaction(reaction.emoji)}
                    className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition-all ${
                      userReacted
                        ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700'
                        : 'bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <span>{reaction.emoji}</span>
                    <span className={`font-medium ${
                      userReacted ? 'text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-neutral-400'
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

      {/* Hover Actions */}
      {isHovered && !isEditing && (
        <div className="absolute -top-3 right-4 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-lg flex items-center gap-1 p-1">
          {/* Quick Reactions */}
          <div className="flex items-center gap-0.5 px-1 border-r border-gray-200 dark:border-neutral-800">
            {quickReactions.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors text-base"
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* More Emoji */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
            title="More reactions"
          >
            <Smile className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
          </button>

          {/* Reply */}
          <button
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
            title="Reply"
          >
            <Reply className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
          </button>

          {/* Edit (own messages only) */}
          {isOwnMessage && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
              title="Edit message"
            >
              <Edit className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
            </button>
          )}

          {/* More Options */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
              title="More options"
            >
              <MoreVertical className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-lg py-1 z-10">
                <button className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center gap-2">
                  <Pin className="w-4 h-4" />
                  Pin message
                </button>
                <button className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center gap-2">
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
