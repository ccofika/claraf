import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import axios from 'axios';

const NotificationContext = createContext();

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Helper function to convert VAPID public key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [permission, setPermission] = useState('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState(null);
  const [pushSubscription, setPushSubscription] = useState(null);
  const subscriptionSentRef = useRef(false);

  // Check if browser supports notifications and service workers
  useEffect(() => {
    const checkSupport = async () => {
      // Basic notification support
      if ('Notification' in window) {
        setIsSupported(true);
        setPermission(Notification.permission);
      }

      // Push notification support (requires Service Worker)
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        setIsPushSupported(true);
      }
    };

    checkSupport();
  }, []);

  // Register Service Worker
  useEffect(() => {
    const registerServiceWorker = async () => {
      if (!isPushSupported) return;

      try {
        // Register service worker
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/'
        });

        console.log('✅ Service Worker registered:', registration.scope);
        setServiceWorkerRegistration(registration);

        // Wait for the service worker to be ready
        const swRegistration = await navigator.serviceWorker.ready;
        console.log('✅ Service Worker ready');

        // Check for existing push subscription
        const existingSubscription = await swRegistration.pushManager.getSubscription();
        if (existingSubscription) {
          console.log('✅ Existing push subscription found');
          setPushSubscription(existingSubscription);
        }
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    };

    registerServiceWorker();
  }, [isPushSupported]);

  // Subscribe to push notifications when user logs in and permission is granted
  useEffect(() => {
    const subscribeToPush = async () => {
      if (!user || !serviceWorkerRegistration || permission !== 'granted') {
        return;
      }

      // Prevent duplicate subscriptions
      if (subscriptionSentRef.current) {
        return;
      }

      try {
        // Get VAPID public key from server
        const { data: vapidData } = await axios.get(`${API_URL}/api/push/vapid-public-key`);

        if (!vapidData.publicKey) {
          console.warn('⚠️ VAPID public key not available');
          return;
        }

        const swRegistration = await navigator.serviceWorker.ready;

        // Check if already subscribed
        let subscription = await swRegistration.pushManager.getSubscription();

        if (!subscription) {
          // Subscribe to push notifications
          subscription = await swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidData.publicKey)
          });

          console.log('✅ Push subscription created');
        }

        setPushSubscription(subscription);

        // Send subscription to server
        const token = localStorage.getItem('token');
        await axios.post(
          `${API_URL}/api/push/subscribe`,
          { subscription: subscription.toJSON() },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        subscriptionSentRef.current = true;
        console.log('✅ Push subscription sent to server');
      } catch (error) {
        console.error('❌ Failed to subscribe to push notifications:', error);
      }
    };

    subscribeToPush();
  }, [user, serviceWorkerRegistration, permission]);

  // Reset subscription sent flag when user changes
  useEffect(() => {
    if (!user) {
      subscriptionSentRef.current = false;
    }
  }, [user]);

  // Listen for messages from Service Worker
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event) => {
      console.log('📨 Message from Service Worker:', event.data);

      if (event.data.type === 'NOTIFICATION_CLICK') {
        // Handle notification click - navigate to channel
        const { channelId } = event.data;
        if (channelId) {
          // Dispatch custom event for ChatContext to handle
          window.dispatchEvent(new CustomEvent('navigateToChannel', {
            detail: { channelId }
          }));
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  // Request notification permission and subscribe to push
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

        // Try to subscribe to push notifications
        if (isPushSupported && serviceWorkerRegistration && user) {
          try {
            const { data: vapidData } = await axios.get(`${API_URL}/api/push/vapid-public-key`);

            if (vapidData.publicKey) {
              const swRegistration = await navigator.serviceWorker.ready;
              const subscription = await swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidData.publicKey)
              });

              setPushSubscription(subscription);

              // Send subscription to server
              const token = localStorage.getItem('token');
              await axios.post(
                `${API_URL}/api/push/subscribe`,
                { subscription: subscription.toJSON() },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              subscriptionSentRef.current = true;
              console.log('✅ Push subscription created and sent');
            }
          } catch (pushError) {
            console.error('❌ Failed to set up push:', pushError);
          }
        }

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
  }, [isSupported, permission, isPushSupported, serviceWorkerRegistration, user]);

  // Unsubscribe from push notifications
  const unsubscribePush = useCallback(async () => {
    if (!pushSubscription) return;

    try {
      // Unsubscribe from browser
      await pushSubscription.unsubscribe();

      // Remove from server
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/push/unsubscribe`,
        { endpoint: pushSubscription.endpoint },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPushSubscription(null);
      subscriptionSentRef.current = false;
      console.log('✅ Unsubscribed from push notifications');
    } catch (error) {
      console.error('❌ Failed to unsubscribe:', error);
    }
  }, [pushSubscription]);

  // Show notification (fallback for when push is not available)
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

      // Try to use Service Worker for notification if available
      if (serviceWorkerRegistration) {
        serviceWorkerRegistration.showNotification(title, {
          icon: iconPath,
          badge: badgePath,
          vibrate: [200, 100, 200],
          requireInteraction: false,
          silent: false,
          tag: options.tag || 'clara-chat',
          renotify: false,
          ...options
        });
        return { close: () => {} }; // Return mock notification object
      }

      // Fallback to regular Notification API
      const notification = new Notification(title, {
        icon: iconPath,
        badge: badgePath,
        vibrate: [200, 100, 200],
        requireInteraction: false,
        silent: false,
        tag: options.tag || 'clara-chat',
        renotify: false,
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
  }, [isSupported, permission, serviceWorkerRegistration]);

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
    isPushSupported,
    permission,
    pushSubscription,
    serviceWorkerRegistration,
    requestPermission,
    unsubscribePush,
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
