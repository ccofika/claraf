import React from 'react';
import { useChat } from '../../context/ChatContext';
import { Crown, Circle } from 'lucide-react';

const ChatMemberList = ({ channel }) => {
  const { getUserPresence } = useChat();

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

  return (
    <div className="w-64 bg-gray-50 dark:bg-neutral-950 border-l border-gray-200 dark:border-neutral-800 flex flex-col">
      {/* Header */}
      <div className="h-14 px-4 flex items-center border-b border-gray-200 dark:border-neutral-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-neutral-50">
          Members ({channel.members?.length || 0})
        </h3>
      </div>

      {/* Member List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {channel.members?.map((member) => {
          const presence = getUserPresence(member.userId._id);
          const role = getMemberRole(member);

          return (
            <div
              key={member.userId._id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
            >
              {/* Avatar with presence */}
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                  {member.userId.name?.charAt(0).toUpperCase()}
                </div>
                <div
                  className={`absolute bottom-0 right-0 w-3 h-3 ${getPresenceColor(
                    presence.status
                  )} rounded-full border-2 border-gray-50 dark:border-neutral-950`}
                />
              </div>

              {/* Member Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-neutral-50 truncate">
                    {member.userId.name}
                  </span>
                  {role === 'admin' && (
                    <Crown className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Circle
                    className={`w-2 h-2 ${
                      presence.status === 'online'
                        ? 'fill-green-500 text-green-500'
                        : presence.status === 'away'
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'fill-gray-400 text-gray-400 dark:fill-neutral-600 dark:text-neutral-600'
                    }`}
                  />
                  <span className="text-xs text-gray-500 dark:text-neutral-400">
                    {presence.status === 'online'
                      ? 'Online'
                      : presence.status === 'away'
                      ? 'Away'
                      : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatMemberList;
