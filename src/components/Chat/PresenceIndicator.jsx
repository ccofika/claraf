import React from 'react';
import { useChat } from '../../context/ChatContext';

/**
 * PresenceIndicator - Shows user online status
 *
 * Status types:
 * - active: Green dot (user is online and active)
 * - away: Hollow circle (user is offline or inactive)
 * - dnd: Green dot with moon icon (do not disturb - online but busy)
 */
const PresenceIndicator = ({ userId, size = 'sm', showCustomStatus = false, className = '' }) => {
  const { userPresence } = useChat();
  const presence = userPresence[userId] || { status: 'away', isOnline: false };

  const sizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const iconSize = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3'
  };

  const renderStatusIndicator = () => {
    if (presence.status === 'active') {
      return (
        <div
          className={`${sizeClasses[size]} ${className} rounded-full bg-green-500 border-2 border-white dark:border-[#1A1D21]`}
          title="Active"
        />
      );
    }

    if (presence.status === 'dnd') {
      return (
        <div
          className={`${sizeClasses[size]} ${className} rounded-full bg-green-500 border-2 border-white dark:border-[#1A1D21] flex items-center justify-center relative`}
          title="Do not disturb"
        >
          {/* DND moon icon overlay */}
          <svg
            className={`${iconSize[size]} absolute text-white`}
            fill="currentColor"
            viewBox="0 0 12 12"
          >
            <path d="M10.5 7.5c-1.5 1.5-4 1.5-5.5 0s-1.5-4 0-5.5c-2.5.5-4 3-3.5 5.5s3 4 5.5 3.5c-.5-1-0.5-2.5.5-3.5z" />
          </svg>
        </div>
      );
    }

    // Away status - hollow circle
    return (
      <div
        className={`${sizeClasses[size]} ${className} rounded-full border-2 border-gray-400 dark:border-gray-600 bg-white dark:bg-[#1A1D21]`}
        title="Away"
      />
    );
  };

  return (
    <div className="relative inline-flex items-center gap-1">
      {renderStatusIndicator()}

      {showCustomStatus && presence.customStatus && (
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {presence.customStatus.emoji && <span className="mr-1">{presence.customStatus.emoji}</span>}
          {presence.customStatus.text}
        </span>
      )}
    </div>
  );
};

export default PresenceIndicator;
