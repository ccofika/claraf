import { useEffect } from 'react';

export const useKeyboardShortcuts = (shortcuts = {}) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check each shortcut
      Object.entries(shortcuts).forEach(([key, config]) => {
        const { keys, handler, description, enabled = true } = config;

        if (!enabled || !handler) return;

        // Parse key combination
        const parts = keys.toLowerCase().split('+');
        const ctrlOrCmd = parts.includes('ctrl') || parts.includes('cmd');
        const shift = parts.includes('shift');
        const alt = parts.includes('alt');
        const mainKey = parts[parts.length - 1];

        // Check if all modifiers match
        const isCtrlOrCmdPressed = (event.ctrlKey || event.metaKey) === ctrlOrCmd;
        const isShiftPressed = event.shiftKey === shift;
        const isAltPressed = event.altKey === alt;
        const isMainKeyPressed = event.key.toLowerCase() === mainKey;

        if (isCtrlOrCmdPressed && isShiftPressed && isAltPressed && isMainKeyPressed) {
          event.preventDefault();
          handler(event);
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

export const getShortcutDisplay = (keys) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  return keys
    .split('+')
    .map((key) => {
      switch (key.toLowerCase()) {
        case 'ctrl':
        case 'cmd':
          return isMac ? '⌘' : 'Ctrl';
        case 'shift':
          return isMac ? '⇧' : 'Shift';
        case 'alt':
          return isMac ? '⌥' : 'Alt';
        default:
          return key.toUpperCase();
      }
    })
    .join(isMac ? '' : '+');
};
