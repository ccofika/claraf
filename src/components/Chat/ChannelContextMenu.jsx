import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  CheckCircle,
  Circle,
  Star,
  Bell,
  BellOff,
  LogOut,
  Archive,
  Link,
  Trash2,
  FolderPlus
} from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ChannelContextMenu = ({
  channel,
  position,
  onClose,
  onAction,
  isStarred,
  isMuted,
  isArchived,
  sections = []
}) => {
  const menuRef = useRef(null);
  const [showMuteSubmenu, setShowMuteSubmenu] = useState(false);
  const [showSectionSubmenu, setShowSectionSubmenu] = useState(false);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleAction = async (action, ...args) => {
    try {
      await onAction(action, ...args);
      onClose();
    } catch (error) {
      console.error(`Error performing action ${action}:`, error);
    }
  };

  const menuItems = [
    {
      icon: MessageSquare,
      label: 'Open',
      action: () => handleAction('open'),
      show: true
    },
    { divider: true },
    {
      icon: isArchived ? Circle : CheckCircle,
      label: isArchived ? 'Mark as unread' : 'Mark as read',
      action: () => handleAction('markRead', !isArchived),
      show: true
    },
    {
      icon: Star,
      label: isStarred ? 'Remove from starred' : 'Add to starred',
      action: () => handleAction('toggleStar'),
      show: true,
      className: isStarred ? 'text-yellow-600 dark:text-yellow-500' : ''
    },
    { divider: true },
    {
      icon: isMuted ? Bell : BellOff,
      label: isMuted ? 'Unmute notifications' : 'Mute notifications',
      action: () => setShowMuteSubmenu(!showMuteSubmenu),
      hasSubmenu: true,
      show: true
    },
    {
      icon: FolderPlus,
      label: 'Add to section',
      action: () => setShowSectionSubmenu(!showSectionSubmenu),
      hasSubmenu: true,
      show: sections.length > 0
    },
    { divider: true },
    {
      icon: Archive,
      label: isArchived ? 'Unarchive' : 'Archive',
      action: () => handleAction('toggleArchive'),
      show: true
    },
    {
      icon: LogOut,
      label: 'Leave channel',
      action: () => handleAction('leave'),
      show: channel?.type !== 'dm', // Don't show "Leave" for DMs
      className: 'text-red-600 dark:text-red-500'
    },
    { divider: true },
    {
      icon: Link,
      label: 'Copy link',
      action: () => handleAction('copyLink'),
      show: true
    }
  ];

  const muteOptions = [
    { label: 'For 1 hour', duration: 1 },
    { label: 'For 2 hours', duration: 2 },
    { label: 'For 8 hours', duration: 8 },
    { label: 'Until tomorrow', duration: 24 },
    { label: 'Forever', duration: -1 }
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-64 bg-white dark:bg-[#1A1D21] border border-gray-200 dark:border-neutral-700 shadow-lg py-1"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
      }}
    >
      {menuItems.map((item, index) => {
        if (!item.show) return null;

        if (item.divider) {
          return (
            <div
              key={`divider-${index}`}
              className="my-1 border-t border-gray-200 dark:border-neutral-700"
            />
          );
        }

        const Icon = item.icon;

        return (
          <div key={index} className="relative">
            <button
              onClick={item.action}
              className={`w-full px-3 py-2 flex items-center gap-3 text-[14px] hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors ${
                item.className || 'text-gray-900 dark:text-neutral-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.hasSubmenu && (
                <svg
                  className="w-4 h-4 text-gray-400 dark:text-neutral-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
            </button>

            {/* Mute Submenu */}
            {item.label === 'Mute notifications' && item.hasSubmenu && showMuteSubmenu && (
              <div
                className="absolute left-full top-0 ml-1 w-56 bg-white dark:bg-[#1A1D21] border border-gray-200 dark:border-neutral-700 shadow-lg py-1"
              >
                {isMuted ? (
                  <button
                    onClick={() => handleAction('mute', 0)}
                    className="w-full px-3 py-2 flex items-center gap-3 text-[14px] hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors text-gray-900 dark:text-neutral-100"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Unmute</span>
                  </button>
                ) : (
                  muteOptions.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAction('mute', option.duration)}
                      className="w-full px-3 py-2 flex items-center gap-3 text-[14px] hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors text-gray-900 dark:text-neutral-100"
                    >
                      <BellOff className="w-4 h-4" />
                      <span>{option.label}</span>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Section Submenu */}
            {item.label === 'Add to section' && item.hasSubmenu && showSectionSubmenu && (
              <div
                className="absolute left-full top-0 ml-1 w-56 bg-white dark:bg-[#1A1D21] border border-gray-200 dark:border-neutral-700 shadow-lg py-1"
              >
                {sections.map((section) => (
                  <button
                    key={section._id}
                    onClick={() => handleAction('addToSection', section._id)}
                    className="w-full px-3 py-2 flex items-center gap-3 text-[14px] hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors text-gray-900 dark:text-neutral-100"
                  >
                    {section.emoji && <span className="text-base">{section.emoji}</span>}
                    <span className={section.color ? '' : ''} style={section.color ? { color: section.color } : {}}>
                      {section.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ChannelContextMenu;
