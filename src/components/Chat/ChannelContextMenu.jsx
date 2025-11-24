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
  const [adjustedPosition, setAdjustedPosition] = useState(position);

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

  // Adjust menu position to avoid going off-screen
  useEffect(() => {
    if (!menuRef.current) return;

    const menuRect = menuRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    let newX = position.x;
    let newY = position.y;

    // Check if menu goes beyond bottom edge
    if (position.y + menuRect.height > windowHeight) {
      // Position menu above cursor instead of below
      newY = position.y - menuRect.height;

      // If it still doesn't fit above, position it at the bottom of viewport
      if (newY < 0) {
        newY = windowHeight - menuRect.height - 10;
      }
    }

    // Check if menu goes beyond right edge
    if (position.x + menuRect.width > windowWidth) {
      newX = windowWidth - menuRect.width - 10;
    }

    // Check if menu goes beyond left edge
    if (newX < 0) {
      newX = 10;
    }

    // Check if menu goes beyond top edge
    if (newY < 0) {
      newY = 10;
    }

    setAdjustedPosition({ x: newX, y: newY });
  }, [position, showMuteSubmenu, showSectionSubmenu]);

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
    { label: 'For 15 minutes', duration: 0.25 },
    { label: 'For 1 hour', duration: 1 },
    { label: 'For 8 hours', duration: 8 },
    { label: 'For 24 hours', duration: 24 },
    { label: 'Forever', duration: -1 }
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-64 bg-white dark:bg-[#1A1D21] border border-gray-200 dark:border-neutral-700 shadow-lg py-1"
      style={{
        top: `${adjustedPosition.y}px`,
        left: `${adjustedPosition.x}px`,
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
                className="absolute w-56 bg-white dark:bg-[#1A1D21] border border-gray-200 dark:border-neutral-700 shadow-lg py-1"
                style={{
                  left: adjustedPosition.x + 256 + 56 > window.innerWidth ? 'auto' : '100%',
                  right: adjustedPosition.x + 256 + 56 > window.innerWidth ? '100%' : 'auto',
                  top: 0,
                  marginLeft: adjustedPosition.x + 256 + 56 > window.innerWidth ? 0 : '4px',
                  marginRight: adjustedPosition.x + 256 + 56 > window.innerWidth ? '4px' : 0,
                }}
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
                className="absolute w-56 bg-white dark:bg-[#1A1D21] border border-gray-200 dark:border-neutral-700 shadow-lg py-1"
                style={{
                  left: adjustedPosition.x + 256 + 56 > window.innerWidth ? 'auto' : '100%',
                  right: adjustedPosition.x + 256 + 56 > window.innerWidth ? '100%' : 'auto',
                  top: 0,
                  marginLeft: adjustedPosition.x + 256 + 56 > window.innerWidth ? 0 : '4px',
                  marginRight: adjustedPosition.x + 256 + 56 > window.innerWidth ? '4px' : 0,
                }}
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
