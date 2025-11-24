import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [permission, setPermission] = useState(Notification.permission);
  const [isSupported, setIsSupported] = useState(false);

  // Check if browser supports notifications
  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error('Browser notifications are not supported');
      return false;
    }

    if (permission === 'granted') {
      return true;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        toast.success('Notifications enabled!');
        return true;
      } else if (result === 'denied') {
        toast.error('Notification permission denied');
        return false;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to request notification permission');
      return false;
    }
  }, [isSupported, permission]);

  // Show notification
  const showNotification = useCallback((title, options = {}, forceShow = false) => {
    console.log('🔔 showNotification called:', { title, forceShow, isSupported, permission, documentHidden: document.hidden });

    // Don't show notification if:
    // - Not supported
    // - Permission not granted
    // - Window is focused (user is actively using the app) - UNLESS forceShow is true
    if (!isSupported || permission !== 'granted') {
      console.log('❌ Notification blocked: not supported or permission not granted');
      return null;
    }

    // Only check document.hidden if forceShow is false
    if (!forceShow && !document.hidden) {
      console.log('❌ Notification blocked: window is focused and forceShow is false');
      return null;
    }

    try {
      console.log('✅ Creating browser notification:', title);

      // Use our app logo as icon (use absolute path)
      const iconPath = `${window.location.origin}/LOGO-MAIN-WHITE.png`;
      const badgePath = `${window.location.origin}/LOGO-MAIN-WHITE.png`;

      const notification = new Notification(title, {
        icon: iconPath,
        badge: badgePath,
        vibrate: [200, 100, 200],
        requireInteraction: false,
        silent: false,
        tag: options.tag || 'clara-chat', // Group notifications
        renotify: false, // Don't vibrate/sound for same tag
        ...options
      });

      // Auto close after 8 seconds (like Slack)
      setTimeout(() => {
        notification.close();
      }, 8000);

      return notification;
    } catch (error) {
      console.error('❌ Error showing notification:', error);
      return null;
    }
  }, [isSupported, permission]);

  // Show message notification
  const showMessageNotification = useCallback((message, channel, onClick = null, forceShow = false) => {
    if (!message || !channel) return null;

    const senderName = message.sender?.name || 'Someone';
    const channelName = channel.name || 'a conversation';
    const channelType = channel.type;

    let title = '';
    let body = message.content || '📎 Sent a file';

    // Format title based on channel type (like Slack)
    if (channelType === 'dm') {
      title = `💬 ${senderName}`; // DM with emoji
    } else {
      title = `#${channelName}`; // Channel name first (like Slack)
    }

    // Format body with sender name for channels
    if (channelType !== 'dm') {
      body = `${senderName}: ${body}`;
    }

    // Truncate long messages
    if (body.length > 150) {
      body = body.substring(0, 150) + '...';
    }

    const notification = showNotification(title, {
      body,
      tag: `clara-message-${channel._id}`, // Group notifications by channel
      data: {
        channelId: channel._id,
        messageId: message._id
      }
    }, forceShow);

    if (notification && onClick) {
      notification.onclick = () => {
        window.focus();
        onClick(message, channel);
        notification.close();
      };
    }

    return notification;
  }, [showNotification]);

  // Show mention notification
  const showMentionNotification = useCallback((message, channel, onClick = null, forceShow = true) => {
    if (!message || !channel) return null;

    const senderName = message.sender?.name || 'Someone';
    const channelName = channel.name || 'a conversation';
    const channelType = channel.type;

    // Format like Slack: "@ #channel-name" or "@ Direct Message"
    const title = channelType === 'dm'
      ? `@ ${senderName}`
      : `@ #${channelName}`;

    // Body shows who mentioned and the message
    const body = `${senderName} mentioned you: ${message.content?.substring(0, 120) || ''}`;

    const notification = showNotification(title, {
      body,
      tag: `clara-mention-${channel._id}`,
      requireInteraction: true, // Mention notifications are more important - stay visible
      data: {
        channelId: channel._id,
        messageId: message._id,
        type: 'mention'
      }
    }, forceShow);

    if (notification && onClick) {
      notification.onclick = () => {
        window.focus();
        onClick(message, channel);
        notification.close();
      };
    }

    return notification;
  }, [showNotification]);

  const value = {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    showMessageNotification,
    showMentionNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
