import React, { useState } from 'react';
import { Send } from 'lucide-react';
import ShareToChatModal from './ShareToChatModal';

/**
 * ShareButton component - Add this to any element or ticket to enable sharing to chat
 *
 * Usage for Workspace Elements:
 * <ShareButton
 *   item={{
 *     _id: element._id,
 *     workspaceId: workspace._id,
 *     workspaceName: workspace.name,
 *     type: element.type,
 *     title: element.content || 'Untitled',
 *     content: element.content,
 *   }}
 *   type="element"
 * />
 *
 * Usage for QA Tickets:
 * <ShareButton
 *   item={{
 *     _id: ticket._id,
 *     title: ticket.title,
 *     description: ticket.description,
 *     status: ticket.status,
 *     priority: ticket.priority,
 *     category: ticket.category
 *   }}
 *   type="ticket"
 * />
 */
const ShareButton = ({ item, type, variant = 'button' }) => {
  const [showModal, setShowModal] = useState(false);

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowModal(true);
          }}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors"
          title="Share to chat"
        >
          <Send className="w-[18px] h-[18px] text-gray-600 dark:text-neutral-400" />
        </button>

        <ShareToChatModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          item={item}
          type={type}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowModal(true);
        }}
        className="px-3 py-1.5 text-[13px] font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2"
      >
        <Send className="w-4 h-4" />
        Share to Chat
      </button>

      <ShareToChatModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        item={item}
        type={type}
      />
    </>
  );
};

export default ShareButton;
