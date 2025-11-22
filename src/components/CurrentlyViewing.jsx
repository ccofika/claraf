import React from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

// Generate avatar color from user name
const getAvatarColor = (name) => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-amber-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-teal-500',
    'bg-orange-500',
  ];

  const hash = name.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return colors[Math.abs(hash) % colors.length];
};

// Get initials from name
const getInitials = (name) => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const CurrentlyViewing = ({ isCollapsed = false }) => {
  const { workspaceUsers, isConnected } = useSocket();
  const { user } = useAuth();

  // Filter out current user from the list
  const otherUsers = workspaceUsers.filter(u => u.userId !== user?._id);

  if (!isConnected) {
    return null;
  }

  // If collapsed, show just avatars
  if (isCollapsed) {
    if (otherUsers.length === 0) return null;

    return (
      <div className="flex flex-col items-center gap-1 py-2">
        {otherUsers.slice(0, 3).map((u) => (
          <div
            key={u.userId}
            className={`relative w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold ${getAvatarColor(u.userName)} cursor-help`}
            title={`${u.userName} online`}
          >
            {getInitials(u.userName)}
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 border border-white dark:border-black rounded-full" />
          </div>
        ))}
        {otherUsers.length > 3 && (
          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-neutral-700 flex items-center justify-center text-gray-600 dark:text-neutral-300 text-[9px] font-semibold">
            +{otherUsers.length - 3}
          </div>
        )}
      </div>
    );
  }

  // If expanded, show full info
  return (
    <div className="w-full px-3 py-2">
      {otherUsers.length === 0 ? (
        <div className="text-xs text-gray-400 dark:text-neutral-500 text-center">
          No one else here
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-xs text-gray-500 dark:text-neutral-400 font-medium">
            Active now ({otherUsers.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {otherUsers.slice(0, 4).map((u) => (
              <div
                key={u.userId}
                className={`relative w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold ${getAvatarColor(u.userName)} cursor-help`}
                title={`${u.userName} (${u.userEmail})`}
              >
                {getInitials(u.userName)}
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 border border-white dark:border-black rounded-full" />
              </div>
            ))}
            {otherUsers.length > 4 && (
              <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-neutral-700 flex items-center justify-center text-gray-600 dark:text-neutral-300 text-[10px] font-semibold">
                +{otherUsers.length - 4}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentlyViewing;
