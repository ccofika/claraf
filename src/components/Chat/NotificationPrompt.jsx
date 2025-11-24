import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

const NotificationPrompt = () => {
  const { isSupported, permission, requestPermission } = useNotification();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if prompt should be shown
  useEffect(() => {
    // Don't show if:
    // - Not supported
    // - Already granted/denied
    // - User dismissed it
    const dismissed = localStorage.getItem('notificationPromptDismissed');

    if (isSupported && permission === 'default' && !dismissed) {
      // Show after 3 seconds delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isSupported, permission]);

  const handleEnable = async () => {
    const granted = await requestPermission();
    if (granted) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('notificationPromptDismissed', 'true');
  };

  const handleRemindLater = () => {
    setIsVisible(false);
    // Set expiry to 1 day from now
    const expiry = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem('notificationPromptDismissed', expiry.toString());
  };

  if (!isVisible || isDismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 bg-white dark:bg-[#1A1D21] border border-gray-200 dark:border-neutral-700 shadow-2xl rounded-lg overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-[#1164A3] to-[#0d4f82] flex items-center gap-3">
        <Bell className="w-5 h-5 text-white" />
        <h3 className="flex-1 text-white font-semibold text-[15px]">
          Enable Notifications
        </h3>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-white/10 rounded transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        <p className="text-[14px] text-gray-700 dark:text-neutral-300 mb-4">
          Stay up to date with direct messages, mentions, and important updates even when Clara is in the background.
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleEnable}
            className="w-full px-4 py-2.5 bg-[#1164A3] hover:bg-[#0d4f82] text-white text-[14px] font-medium rounded transition-colors"
          >
            Enable Notifications
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleRemindLater}
              className="flex-1 px-4 py-2 text-[13px] text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
            >
              Remind me later
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-2 text-[13px] text-gray-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
            >
              Don't ask again
            </button>
          </div>
        </div>
      </div>

      {/* Bottom hint */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-neutral-900/50 border-t border-gray-200 dark:border-neutral-800">
        <p className="text-[11px] text-gray-500 dark:text-neutral-500">
          You can change this later in your browser settings
        </p>
      </div>
    </div>
  );
};

export default NotificationPrompt;
