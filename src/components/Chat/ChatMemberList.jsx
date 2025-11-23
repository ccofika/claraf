import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { Crown, Circle, UserPlus } from 'lucide-react';
import AddMemberModal from './AddMemberModal';

const ChatMemberList = ({ channel }) => {
  const { getUserPresence, fetchChannels } = useChat();
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  const getPresenceColor = (status) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400 dark:bg-neutral-600';
    }
  };

  const getMemberRole = (member) => {
    return member.role || 'member';
  };

  // Generate soft avatar color based on user ID (matching MessageBubble style)
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
    <div className="w-64 bg-white dark:bg-[#1A1D21] border-l border-gray-200/60 dark:border-neutral-800/60 flex flex-col">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-gray-200/60 dark:border-neutral-800/60">
        <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">
          Members ({channel.members?.length || 0})
        </h3>
        <button
          onClick={() => setShowAddMemberModal(true)}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors"
          title="Add member"
        >
          <UserPlus className="w-[18px] h-[18px] text-gray-600 dark:text-neutral-400" />
        </button>
      </div>

      {/* Member List */}
      <div className="flex-1 overflow-y-auto p-2">
        {channel.members?.map((member) => {
          const presence = getUserPresence(member.userId._id);
          const role = getMemberRole(member);

          return (
            <div
              key={member.userId._id}
              className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 dark:hover:bg-[#1A1D21] transition-colors cursor-pointer"
            >
              {/* Avatar with presence */}
              <div className="relative flex-shrink-0">
                <div className={`w-7 h-7 rounded flex items-center justify-center text-[13px] font-bold ${getAvatarColor(member.userId._id)}`}>
                  {member.userId.name?.charAt(0).toUpperCase()}
                </div>
                <div
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 ${getPresenceColor(
                    presence.status
                  )} rounded-full border-2 border-white dark:border-[#1A1D21]`}
                />
              </div>

              {/* Member Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-[15px] text-gray-900 dark:text-[#D1D2D3] truncate">
                    {member.userId.name}
                  </span>
                  {role === 'admin' && (
                    <Crown className="w-3 h-3 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        channel={channel}
        onMemberAdded={() => {
          fetchChannels();
          setShowAddMemberModal(false);
        }}
      />
    </div>
  );
};

export default ChatMemberList;
