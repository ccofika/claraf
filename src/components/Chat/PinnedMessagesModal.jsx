import React from 'react';
import { X, Pin } from 'lucide-react';
import MessageBubble from './MessageBubble';

const PinnedMessagesModal = ({ isOpen, onClose, pinnedMessages }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-3xl max-h-[85vh] bg-white dark:bg-[#1A1D21] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200/60 dark:border-neutral-800/60 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Pin className="w-5 h-5 text-gray-900 dark:text-white" />
            <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">
              Pinned Messages
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-neutral-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!pinnedMessages || pinnedMessages.length === 0 ? (
            <div className="p-16 text-center">
              <Pin className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-neutral-700" />
              <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-2">
                No pinned messages
              </h3>
              <p className="text-[13px] text-gray-600 dark:text-neutral-400">
                Pin important messages to find them easily later
              </p>
            </div>
          ) : (
            <div className="py-2">
              {pinnedMessages.map((message) => (
                <MessageBubble key={message._id} message={message} isGrouped={false} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PinnedMessagesModal;
