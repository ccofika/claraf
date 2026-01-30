import React, { useState } from 'react';
import { MoreHorizontal, Reply, CheckCircle, Trash2, Edit3, Smile } from 'lucide-react';

const REACTIONS = ['👍', '👎', '❤️', '🎉', '🤔', '👀'];

const CommentItem = ({
  comment,
  currentUser,
  onUpdate,
  onDelete,
  onResolve,
  onReact,
  onReply,
  isThread,
  isReply,
  replyCount = 0,
  isResolved
}) => {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const isAuthor = currentUser?._id === (comment.author?._id || comment.author);
  const authorName = comment.author?.name || comment.author?.email || 'Unknown';
  const timeAgo = getTimeAgo(comment.createdAt);

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== comment.content) {
      onUpdate?.(comment._id, editContent.trim());
    }
    setEditing(false);
  };

  return (
    <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 group transition-colors">
      <div className="flex items-start gap-2.5">
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400 shrink-0">
          {authorName.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-gray-900 dark:text-white">{authorName}</span>
            <span className="text-[10px] text-gray-400">{timeAgo}</span>
            {comment.isEdited && <span className="text-[10px] text-gray-400">(edited)</span>}
          </div>

          {/* Content */}
          {editing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
                autoFocus
              />
              <div className="flex gap-1">
                <button onClick={handleSaveEdit} className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
                <button onClick={() => { setEditing(false); setEditContent(comment.content); }} className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">Cancel</button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{comment.content}</p>
          )}

          {/* Reactions */}
          {comment.reactions && comment.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {comment.reactions.map((r, idx) => (
                <button
                  key={idx}
                  onClick={() => onReact?.(comment._id, r.emoji)}
                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors ${
                    r.users?.includes(currentUser?._id)
                      ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>{r.emoji}</span>
                  <span className="text-gray-500">{r.users?.length || 0}</span>
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Reaction picker */}
            <div className="relative">
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
              >
                <Smile className="w-3.5 h-3.5 text-gray-400" />
              </button>
              {showReactions && (
                <div className="absolute bottom-full left-0 mb-1 flex gap-0.5 p-1 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                  {REACTIONS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onReact?.(comment._id, emoji);
                        setShowReactions(false);
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-sm"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isThread && onReply && (
              <button onClick={onReply} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">
                <Reply className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}

            {isThread && onResolve && (
              <button
                onClick={() => onResolve?.(comment._id)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                title={isResolved ? 'Reopen' : 'Resolve'}
              >
                <CheckCircle className={`w-3.5 h-3.5 ${isResolved ? 'text-green-500' : 'text-gray-400'}`} />
              </button>
            )}

            {isAuthor && (
              <>
                <button onClick={() => setEditing(true)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">
                  <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                </button>
                <button onClick={() => onDelete?.(comment._id)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function getTimeAgo(date) {
  if (!date) return '';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default CommentItem;
