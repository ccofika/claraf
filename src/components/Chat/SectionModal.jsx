import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const EMOJI_OPTIONS = [
  '📁', '💼', '🏢', '🎯', '⭐', '🔥', '💡', '🚀',
  '📊', '📈', '🎨', '🔧', '⚙️', '🌟', '💬', '📝',
  '🏆', '🎉', '📌', '🔔', '💻', '📱', '🌐', '🔒'
];

const COLOR_OPTIONS = [
  '#1E90FF', // Blue
  '#FF6347', // Red
  '#32CD32', // Green
  '#FFD700', // Gold
  '#9370DB', // Purple
  '#FF69B4', // Pink
  '#20B2AA', // Teal
  '#FF8C00', // Orange
];

const SectionModal = ({ section, onClose, onSave }) => {
  const [name, setName] = useState(section?.name || '');
  const [emoji, setEmoji] = useState(section?.emoji || '📁');
  const [color, setColor] = useState(section?.color || '');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleSave = () => {
    if (!name.trim()) {
      alert('Section name is required');
      return;
    }

    onSave({
      name: name.trim(),
      emoji,
      color: color || null
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-[#1A1D21] border border-gray-200 dark:border-neutral-700 w-full max-w-md mx-4 shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-700 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-gray-900 dark:text-white">
            {section ? 'Edit Section' : 'Create Section'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-neutral-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Section Name */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700 dark:text-neutral-300 mb-1.5">
              Section Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Work Projects"
              maxLength={50}
              className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 text-gray-900 dark:text-neutral-50 placeholder-gray-500 dark:placeholder-neutral-500 focus:outline-none focus:border-[#1164A3] dark:focus:border-[#1164A3]"
              autoFocus
            />
            <p className="mt-1 text-[11px] text-gray-500 dark:text-neutral-500">
              {name.length}/50 characters
            </p>
          </div>

          {/* Emoji Picker */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700 dark:text-neutral-300 mb-1.5">
              Emoji (optional)
            </label>
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="px-4 py-2 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 text-[24px] hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
              >
                {emoji}
              </button>

              {showEmojiPicker && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowEmojiPicker(false)}
                  />
                  <div className="absolute left-0 top-full mt-1 p-2 bg-white dark:bg-[#1A1D21] border border-gray-200 dark:border-neutral-700 shadow-lg grid grid-cols-8 gap-1 z-20">
                    {EMOJI_OPTIONS.map((em) => (
                      <button
                        key={em}
                        onClick={() => {
                          setEmoji(em);
                          setShowEmojiPicker(false);
                        }}
                        className="w-8 h-8 text-[20px] hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700 dark:text-neutral-300 mb-1.5">
              Color (optional)
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-10 h-10 border-2 border-gray-300 dark:border-neutral-700 hover:border-[#1164A3] transition-colors"
                style={{ backgroundColor: color || '#6B7280' }}
              />

              {showColorPicker && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowColorPicker(false)}
                  />
                  <div className="absolute left-0 top-full mt-1 p-2 bg-white dark:bg-[#1A1D21] border border-gray-200 dark:border-neutral-700 shadow-lg flex gap-2 z-20">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setColor(c);
                          setShowColorPicker(false);
                        }}
                        className="w-8 h-8 border-2 border-gray-300 dark:border-neutral-700 hover:border-[#1164A3] transition-colors"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </>
              )}

              {color && (
                <button
                  onClick={() => setColor('')}
                  className="text-[13px] text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-neutral-700 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[14px] font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-[14px] font-medium text-white bg-[#1164A3] hover:bg-[#0D5189] transition-colors"
          >
            {section ? 'Save Changes' : 'Create Section'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SectionModal;
