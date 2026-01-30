import React, { useState } from 'react';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';

const CommentThread = ({ comment, replies = [], currentUser, onReply, onUpdate, onDelete, onResolve, onReact }) => {
  const [showReply, setShowReply] = useState(false);
  const [expanded, setExpanded] = useState(!comment.isResolved);

  return (
    <div className={`${comment.isResolved ? 'opacity-60' : ''}`}>
      {/* Main comment */}
      <CommentItem
        comment={comment}
        currentUser={currentUser}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onResolve={onResolve}
        onReact={onReact}
        onReply={() => setShowReply(true)}
        isThread
        replyCount={replies.length}
        isResolved={comment.isResolved}
      />

      {/* Replies */}
      {expanded && replies.length > 0 && (
        <div className="ml-6 border-l-2 border-gray-100 dark:border-gray-700">
          {replies.map(reply => (
            <CommentItem
              key={reply._id}
              comment={reply}
              currentUser={currentUser}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onReact={onReact}
              isReply
            />
          ))}
        </div>
      )}

      {/* Collapse/expand replies */}
      {replies.length > 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-6 px-2 py-1 text-xs text-blue-500 hover:text-blue-600 transition-colors"
        >
          {expanded ? 'Hide replies' : `Show ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`}
        </button>
      )}

      {/* Reply input */}
      {showReply && (
        <div className="ml-6 p-3">
          <CommentInput
            onSubmit={(content) => {
              onReply(content);
              setShowReply(false);
            }}
            onCancel={() => setShowReply(false)}
            placeholder="Write a reply..."
            autoFocus
          />
        </div>
      )}
    </div>
  );
};

export default CommentThread;
