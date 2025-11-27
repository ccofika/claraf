// Clara Push Notification Service Worker
// This runs in the background even when the tab is closed

const CACHE_NAME = 'clara-push-v1';

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing...');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  let data = {
    title: 'Clara',
    body: 'You have a new notification',
    icon: '/LOGO-MAIN-WHITE.png',
    badge: '/LOGO-MAIN-WHITE.png',
    tag: 'clara-notification',
    data: {}
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      console.log('[SW] Push data parsed:', pushData);
      data = { ...data, ...pushData };
    } catch (e) {
      console.error('[SW] Error parsing push data:', e);
      data.body = event.data.text();
    }
  }

  // Show the notification
  // We check if user is on the same chat channel in the app itself (via Socket.IO)
  // Service Worker push notifications are for when the app/tab is in background
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const channelId = data.data?.channelId;
        console.log('[SW] Checking clients, channelId:', channelId);
        console.log('[SW] Number of clients:', clients.length);

        // Check if any client is focused AND on the chat page with the same channel
        for (const client of clients) {
          const url = new URL(client.url);
          const isOnChatPage = url.pathname === '/chat' || url.pathname.startsWith('/chat');
          const currentChannel = url.searchParams.get('channel');

          console.log('[SW] Client:', {
            url: client.url,
            focused: client.focused,
            visibilityState: client.visibilityState,
            isOnChatPage,
            currentChannel,
            targetChannel: channelId
          });

          // Only skip notification if:
          // 1. Client is focused (user is actively viewing)
          // 2. User is on the chat page
          // 3. User is viewing the SAME channel that the message is for
          if (client.focused && isOnChatPage && currentChannel === channelId) {
            console.log('[SW] User is viewing this exact channel, skipping notification');
            return; // Don't show notification - app will handle it
          }
        }

        // Show the notification for all other cases:
        // - User on different page
        // - User on chat but different channel
        // - Tab not focused
        // - No clients (tab closed)
        console.log('[SW] Showing notification:', data.title);

        const options = {
          body: data.body,
          icon: data.icon,
          badge: data.badge,
          tag: data.tag,
          renotify: true, // Always notify for new messages
          requireInteraction: data.data?.type === 'mention', // Mentions stay visible
          vibrate: [200, 100, 200],
          data: data.data,
          actions: [
            {
              action: 'open',
              title: 'Open'
            },
            {
              action: 'dismiss',
              title: 'Dismiss'
            }
          ]
        };

        return self.registration.showNotification(data.title, options);
      })
      .catch((error) => {
        console.error('[SW] Error showing notification:', error);
        // Still try to show notification on error
        return self.registration.showNotification(data.title, {
          body: data.body,
          icon: data.icon
        });
      })
  );
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Get the URL to open
  const notificationData = event.notification.data || {};
  const urlToOpen = notificationData.url || '/chat';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          const clientUrl = new URL(client.url);

          // If we have a Clara window open, focus it and navigate
          if (clientUrl.origin === self.location.origin) {
            // Navigate to the specific channel if needed
            if (notificationData.channelId) {
              client.postMessage({
                type: 'NOTIFICATION_CLICK',
                channelId: notificationData.channelId,
                messageId: notificationData.messageId
              });
            }
            return client.focus();
          }
        }

        // No window open, open a new one
        const fullUrl = new URL(urlToOpen, self.location.origin).href;
        return self.clients.openWindow(fullUrl);
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed');
});

// Message event - communication with main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Background sync for offline message sending (future feature)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'send-pending-messages') {
    // event.waitUntil(sendPendingMessages());
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);

  if (event.tag === 'check-notifications') {
    // event.waitUntil(checkForNewNotifications());
  }
});

console.log('[SW] Service Worker loaded');
