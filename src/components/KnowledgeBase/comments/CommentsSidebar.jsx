import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Filter, Plus } from 'lucide-react';
import CommentThread from './CommentThread';
import CommentInput from './CommentInput';

const CommentsSidebar = ({
  pageId,
  comments = [],
  currentUser,
  onFetchComments,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onResolveComment,
  onReactToComment,
  onClose
}) => {
  const [filter, setFilter] = useState('all'); // all | open | resolved
  const [showNewComment, setShowNewComment] = useState(false);

  useEffect(() => {
    if (pageId && onFetchComments) {
      onFetchComments(pageId);
    }
  }, [pageId]);

  // Separate top-level comments from replies
  const topLevelComments = comments.filter(c => !c.parentComment);

  const filtered = topLevelComments.filter(c => {
    if (filter === 'open') return !c.isResolved;
    if (filter === 'resolved') return c.isResolved;
    return true;
  });

  const openCount = topLevelComments.filter(c => !c.isResolved).length;
  const resolvedCount = topLevelComments.filter(c => c.isResolved).length;

  return (
    <div className="fixed inset-0 z-50 flex bg-black/30">
      <div className="ml-auto w-[400px] max-w-full bg-white dark:bg-gray-800 shadow-2xl flex flex-col h-full border-l border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Comments</h2>
            {openCount > 0 && (
              <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                {openCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowNewComment(true)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              title="New comment"
            >
              <Plus className="w-4 h-4 text-gray-500" />
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 p-2 border-b border-gray-100 dark:border-gray-700">
          {[
            { id: 'all', label: `All (${topLevelComments.length})` },
            { id: 'open', label: `Open (${openCount})` },
            { id: 'resolved', label: `Resolved (${resolvedCount})` },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                filter === f.id
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* New Comment Input */}
        {showNewComment && (
          <div className="p-3 border-b border-gray-100 dark:border-gray-700">
            <CommentInput
              onSubmit={(content) => {
                onAddComment?.({ content });
                setShowNewComment(false);
              }}
              onCancel={() => setShowNewComment(false)}
              placeholder="Add a page comment..."
              autoFocus
            />
          </div>
        )}

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
              <MessageCircle className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">
                {filter === 'resolved' ? 'No resolved comments' :
                 filter === 'open' ? 'No open comments' :
                 'No comments yet'}
              </p>
              <p className="text-xs mt-1">Start a discussion about this page</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map(comment => (
                <CommentThread
                  key={comment._id}
                  comment={comment}
                  replies={comments.filter(c => c.parentComment === comment._id)}
                  currentUser={currentUser}
                  onReply={(content) => onAddComment?.({ content, parentComment: comment._id })}
                  onUpdate={onUpdateComment}
                  onDelete={onDeleteComment}
                  onResolve={onResolveComment}
                  onReact={onReactToComment}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentsSidebar;
