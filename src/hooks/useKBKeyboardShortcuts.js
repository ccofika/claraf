import { useEffect, useCallback, useRef } from 'react';

/**
 * KB-specific keyboard shortcuts hook
 * Provides shortcuts for page editing, block navigation, and global KB actions
 */
export const useKBKeyboardShortcuts = ({
  onSave,
  onUndo,
  onRedo,
  onSearch,
  onNewBlock,
  onDeleteBlock,
  onMoveBlockUp,
  onMoveBlockDown,
  onTogglePublish,
  onShowShortcuts,
  onEscape,
  enabled = true
} = {}) => {
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const maxHistorySize = 50;

  // Push state to undo stack
  const pushToUndo = useCallback((state) => {
    undoStackRef.current = [
      ...undoStackRef.current.slice(-maxHistorySize + 1),
      state
    ];
    redoStackRef.current = [];
  }, []);

  // Undo
  const undo = useCallback(() => {
    if (undoStackRef.current.length === 0) return null;
    const state = undoStackRef.current.pop();
    redoStackRef.current.push(state);
    return state;
  }, []);

  // Redo
  const redo = useCallback(() => {
    if (redoStackRef.current.length === 0) return null;
    const state = redoStackRef.current.pop();
    undoStackRef.current.push(state);
    return state;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      const isMod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Cmd/Ctrl + S - Save
      if (isMod && key === 's') {
        e.preventDefault();
        onSave?.();
        return;
      }

      // Cmd/Ctrl + Z - Undo
      if (isMod && !e.shiftKey && key === 'z') {
        e.preventDefault();
        const state = undo();
        if (state) onUndo?.(state);
        return;
      }

      // Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y - Redo
      if ((isMod && e.shiftKey && key === 'z') || (isMod && key === 'y')) {
        e.preventDefault();
        const state = redo();
        if (state) onRedo?.(state);
        return;
      }

      // Cmd/Ctrl + K - Search
      if (isMod && key === 'k') {
        e.preventDefault();
        onSearch?.();
        return;
      }

      // Cmd/Ctrl + Shift + P - Toggle publish
      if (isMod && e.shiftKey && key === 'p') {
        e.preventDefault();
        onTogglePublish?.();
        return;
      }

      // ? key (not in an input) - Show shortcuts reference
      if (key === '?' && !e.shiftKey && !isMod) {
        const tag = e.target.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && !e.target.isContentEditable) {
          e.preventDefault();
          onShowShortcuts?.();
          return;
        }
      }

      // Escape - Exit editing / close modals
      if (key === 'escape') {
        onEscape?.();
        return;
      }

      // / key (not in an input) - New block menu
      if (key === '/' && !isMod) {
        const tag = e.target.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && !e.target.isContentEditable) {
          e.preventDefault();
          onNewBlock?.();
          return;
        }
      }

      // Alt + Backspace - Delete current block
      if (e.altKey && key === 'backspace') {
        const tag = e.target.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault();
          onDeleteBlock?.();
          return;
        }
      }

      // Alt + ArrowUp - Move block up
      if (e.altKey && key === 'arrowup') {
        e.preventDefault();
        onMoveBlockUp?.();
        return;
      }

      // Alt + ArrowDown - Move block down
      if (e.altKey && key === 'arrowdown') {
        e.preventDefault();
        onMoveBlockDown?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onSave, onUndo, onRedo, onSearch, onNewBlock, onDeleteBlock,
      onMoveBlockUp, onMoveBlockDown, onTogglePublish, onShowShortcuts, onEscape, undo, redo]);

  return { pushToUndo, undo, redo, undoStackRef, redoStackRef };
};

// Shortcut definitions for the reference modal
export const KB_SHORTCUTS = [
  { category: 'General', shortcuts: [
    { keys: 'Ctrl+S', mac: '⌘S', description: 'Save page' },
    { keys: 'Ctrl+K', mac: '⌘K', description: 'Open search' },
    { keys: 'Ctrl+Z', mac: '⌘Z', description: 'Undo' },
    { keys: 'Ctrl+Shift+Z', mac: '⌘⇧Z', description: 'Redo' },
    { keys: 'Esc', mac: 'Esc', description: 'Close modal / Exit edit' },
    { keys: '?', mac: '?', description: 'Show keyboard shortcuts' },
  ]},
  { category: 'Editing', shortcuts: [
    { keys: '/', mac: '/', description: 'Open block menu' },
    { keys: 'Alt+Backspace', mac: '⌥⌫', description: 'Delete block' },
    { keys: 'Alt+↑', mac: '⌥↑', description: 'Move block up' },
    { keys: 'Alt+↓', mac: '⌥↓', description: 'Move block down' },
    { keys: 'Ctrl+Shift+P', mac: '⌘⇧P', description: 'Toggle publish' },
  ]},
  { category: 'Text Formatting', shortcuts: [
    { keys: 'Ctrl+B', mac: '⌘B', description: 'Bold' },
    { keys: 'Ctrl+I', mac: '⌘I', description: 'Italic' },
    { keys: 'Ctrl+U', mac: '⌘U', description: 'Underline' },
    { keys: 'Ctrl+E', mac: '⌘E', description: 'Inline code' },
    { keys: 'Ctrl+Shift+H', mac: '⌘⇧H', description: 'Highlight' },
  ]}
];

export default useKBKeyboardShortcuts;
