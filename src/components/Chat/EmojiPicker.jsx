import React, { useEffect, useRef } from 'react';

const EmojiPicker = ({ onSelectEmoji, onClose }) => {
  const pickerRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const emojiCategories = {
    'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙'],
    'Gestures': ['👍', '👎', '👏', '🙌', '👐', '🤝', '🙏', '✌️', '🤞', '🤟', '🤘', '👌', '🤏', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚'],
    'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
    'Objects': ['🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⭐', '🌟', '✨', '💫', '🔥', '💯', '✅', '❌', '⚠️', '📌', '📍', '🔔']
  };

  return (
    <div
      ref={pickerRef}
      className="w-80 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-xl p-3"
    >
      <div className="max-h-80 overflow-y-auto">
        {Object.entries(emojiCategories).map(([category, emojis]) => (
          <div key={category} className="mb-4 last:mb-0">
            <div className="text-xs font-semibold text-gray-500 dark:text-neutral-400 mb-2 px-1">
              {category}
            </div>
            <div className="grid grid-cols-8 gap-1">
              {emojis.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => onSelectEmoji(emoji)}
                  className="w-8 h-8 flex items-center justify-center text-xl hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;
