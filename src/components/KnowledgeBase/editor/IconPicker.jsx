import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';

// Comprehensive icon library organized by category
const iconLibrary = {
  'Account & Customer': [
    '👤', '👥', '🧑', '👨', '👩', '🧑‍💼', '👨‍💼', '👩‍💼', '🙋', '🙋‍♂️', '🙋‍♀️',
    '🆔', '📋', '📇', '🪪', '📛', '🏷️', '👤', '👥', '🫂', '🤝',
    '📝', '✍️', '📄', '📃', '📑', '🗂️', '📂', '📁', '🗃️', '🗄️',
    '👋', '✋', '🤚', '🖐️', '👆', '👇', '👈', '👉', '👍', '👎',
    '🔐', '🔑', '🗝️', '🔒', '🔓', '🛡️', '⚙️', '🎫', '🎟️', '📧',
    '✉️', '📩', '📨', '💌', '📮', '📪', '📬', '📭', '📯', '🔔',
    '🔕', '📢', '📣', '💬', '💭', '🗯️', '👁️', '👀', '🕵️', '🔍'
  ],
  'Payments & Finance': [
    '💰', '💵', '💴', '💶', '💷', '💸', '💳', '🪙', '💲', '🏦',
    '🏧', '💹', '📈', '📉', '📊', '💱', '🧾', '🧮', '💎', '🤑',
    '💵', '💴', '💶', '💷', '🏛️', '🏢', '📦', '🎁', '🛒', '🛍️',
    '🧾', '📃', '📄', '📑', '📜', '📝', '✍️', '🖊️', '🖋️', '✒️',
    '💹', '📈', '📉', '📊', '🔢', '🔣', '💯', '✅', '☑️', '✔️',
    '❌', '❎', '⭕', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫'
  ],
  'Bonuses & Rewards': [
    '🎁', '🎀', '🎊', '🎉', '🎈', '🎄', '🎃', '🎗️', '🏆', '🥇',
    '🥈', '🥉', '🏅', '🎖️', '🏵️', '⭐', '🌟', '✨', '💫', '⚡',
    '🔥', '💥', '💢', '💝', '💖', '💗', '💓', '💞', '💕', '💘',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '🎰', '🎲', '🎯', '🎪', '🎠', '🎡', '🎢', '💎', '👑', '🎩',
    '🎭', '🎨', '🖼️', '🃏', '🀄', '🎴', '📣', '📢', '🔔', '🔕'
  ],
  'Marketing & Affiliate': [
    '📢', '📣', '📡', '🔊', '🔉', '🔈', '🔇', '📻', '📺', '📱',
    '💻', '🖥️', '🖨️', '📠', '📞', '☎️', '📟', '📧', '✉️', '💌',
    '🌐', '🔗', '⛓️', '🧲', '🎯', '📌', '📍', '🗺️', '🧭', '🔮',
    '💡', '🔦', '🕯️', '🪔', '🔆', '🔅', '📸', '📷', '📹', '🎥',
    '🎬', '📽️', '🎞️', '📼', '💿', '📀', '💾', '💽', '🖱️', '🖲️',
    '🎙️', '🎚️', '🎛️', '📊', '📈', '📉', '💹', '📋', '📃', '📄'
  ],
  'Casino & Games': [
    '🎰', '🎲', '🃏', '🀄', '🎴', '🎯', '🎱', '🎮', '🕹️', '👾',
    '🎪', '🎠', '🎡', '🎢', '🎳', '🏓', '🏸', '🏒', '🏑', '🥍',
    '🏏', '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏',
    '♠️', '♥️', '♦️', '♣️', '🂡', '🂱', '🃁', '🃑', '🎭', '🎨',
    '🖼️', '🎩', '🪄', '🔮', '🧿', '💎', '👑', '🏆', '🥇', '🥈',
    '🥉', '🏅', '🎖️', '⭐', '🌟', '✨', '💫', '🔥', '💥', '💰'
  ],
  'Sports & Betting': [
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
    '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '⛳', '🪃', '🏹', '🎣',
    '🥊', '🥋', '🎽', '⛸️', '🥌', '🛷', '🎿', '⛷️', '🏂', '🏋️',
    '🤸', '🤺', '⛹️', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽',
    '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️',
    '📊', '📈', '📉', '💹', '🔢', '🎯', '🎲', '💰', '💵', '💳'
  ],
  'Technical & Support': [
    '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪓', '🔩', '⚙️', '🗜️', '🔗',
    '⛓️', '🧰', '🪛', '🪚', '🔌', '💡', '🔦', '🕯️', '🧯', '🪤',
    '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '💾', '💿', '📀', '📼',
    '📱', '📲', '☎️', '📞', '📟', '📠', '📡', '🔋', '🔌', '💡',
    '❓', '❔', '❗', '❕', '⁉️', '‼️', '🆘', '🆕', '🆓', '🔰',
    '⚠️', '🚨', '🔔', '🔕', '📢', '📣', '✅', '❌', '⭕', '🔴'
  ],
  'Customer Service': [
    '🎧', '🎤', '🎙️', '📞', '☎️', '📱', '💬', '💭', '🗯️', '🗨️',
    '👋', '🤝', '🙏', '👍', '👎', '✋', '🖐️', '👐', '🤲', '🙌',
    '📧', '✉️', '📩', '📨', '💌', '📮', '📪', '📬', '📭', '📯',
    '🔔', '🔕', '📢', '📣', '👂', '👀', '🗣️', '💁', '💁‍♂️', '💁‍♀️',
    '🙋', '🙋‍♂️', '🙋‍♀️', '🙆', '🙆‍♂️', '🙆‍♀️', '🙅', '🙅‍♂️', '🙅‍♀️', '🤷',
    '😊', '😀', '😃', '😄', '😁', '🙂', '😉', '😌', '😍', '🥰'
  ],
  'Key Systems': [
    '🔑', '🗝️', '🔐', '🔒', '🔓', '🛡️', '⚔️', '🏰', '🏯', '🏛️',
    '🖥️', '💻', '⌨️', '🖱️', '🖲️', '💾', '💿', '📀', '🗄️', '📁',
    '📂', '🗃️', '📋', '📊', '📈', '📉', '🗺️', '🧭', '🌐', '🔗',
    '⛓️', '🔌', '🔋', '⚡', '💡', '🔦', '🔬', '🔭', '📡', '🛰️',
    '🚀', '✈️', '🛩️', '🚁', '⚙️', '🔧', '🔨', '🛠️', '🧰', '⚗️',
    '🧪', '🧫', '🧬', '🔬', '📐', '📏', '🖊️', '✏️', '📝', '📓'
  ],
  'Documents & Files': [
    '📄', '📃', '📑', '📜', '📋', '📂', '📁', '🗂️', '🗃️', '🗄️',
    '📓', '📔', '📒', '📕', '📗', '📘', '📙', '📚', '📖', '🔖',
    '📰', '🗞️', '📑', '🔗', '📎', '🖇️', '📌', '📍', '✂️', '🖊️',
    '🖋️', '✒️', '🖌️', '🖍️', '📝', '✏️', '🔍', '🔎', '🔏', '🔐',
    '🔒', '🔓', '📤', '📥', '📦', '📫', '📪', '📬', '📭', '📮'
  ],
  'Status & Indicators': [
    '✅', '❌', '⭕', '❗', '❓', '❕', '❔', '⁉️', '‼️', '🔴',
    '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔺', '🔻',
    '🔸', '🔹', '🔶', '🔷', '💠', '🔘', '🔲', '🔳', '◼️', '◻️',
    '▪️', '▫️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜',
    '🚫', '⛔', '🚷', '🚯', '🚳', '🚱', '📵', '🔞', '☢️', '☣️',
    '⚠️', '🚨', '🔔', '🔕', '💯', '🔢', '🔣', '🔤', '🆗', '🆘'
  ],
  'Time & Calendar': [
    '⏰', '⏱️', '⏲️', '🕰️', '⌚', '⏳', '⌛', '📅', '📆', '🗓️',
    '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙',
    '🕚', '🕛', '🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢', '🕣',
    '📊', '📈', '📉', '🗒️', '🗓️', '📋', '📌', '📍', '✏️', '📝'
  ],
  'Communication': [
    '📧', '✉️', '📩', '📨', '💌', '📮', '📪', '📫', '📬', '📭',
    '📯', '📞', '☎️', '📱', '📲', '📟', '📠', '💬', '💭', '🗨️',
    '🗯️', '📢', '📣', '🔔', '🔕', '🎤', '🎧', '🎙️', '📻', '📺',
    '💻', '🖥️', '🌐', '🔗', '📡', '🛰️', '🗣️', '👂', '👀', '🗒️'
  ],
  'Security & Protection': [
    '🔒', '🔓', '🔐', '🔑', '🗝️', '🛡️', '⚔️', '🗡️', '🔫', '🛡️',
    '🚨', '🚔', '🚓', '👮', '👮‍♂️', '👮‍♀️', '🕵️', '🕵️‍♂️', '🕵️‍♀️', '💂',
    '💂‍♂️', '💂‍♀️', '🦺', '🧥', '👁️', '👀', '🔍', '🔎', '⚠️', '🚫',
    '⛔', '🚷', '📵', '🔞', '☢️', '☣️', '🚧', '🔏', '🔐', '🔒'
  ],
  'Arrows & Navigation': [
    '⬆️', '⬇️', '⬅️', '➡️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️',
    '↩️', '↪️', '⤴️', '⤵️', '🔄', '🔃', '🔀', '🔁', '🔂', '▶️',
    '⏩', '⏭️', '⏯️', '◀️', '⏪', '⏮️', '🔼', '⏫', '🔽', '⏬',
    '⏸️', '⏹️', '⏺️', '⏏️', '🎦', '🔅', '🔆', '📶', '📳', '📴'
  ],
  'Objects & Tools': [
    '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪓', '🔩', '⚙️', '🗜️', '🔗',
    '⛓️', '🧰', '🪛', '🪚', '🔌', '💡', '🔦', '🕯️', '🧯', '🪤',
    '🧲', '🪜', '🧪', '🧫', '🧬', '🔬', '🔭', '📡', '💉', '🩸',
    '💊', '🩹', '🩺', '🚪', '🛏️', '🛋️', '🪑', '🚽', '🚿', '🛁'
  ],
  'Misc & General': [
    '📄', '📝', '📋', '📊', '📈', '📉', '🗒️', '🗓️', '📅', '📆',
    '🔖', '🏷️', '💼', '👔', '👕', '👖', '🧥', '🥼', '🦺', '👗',
    '🌈', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️',
    '🌪️', '🌫️', '🌬️', '🌀', '🌊', '💧', '💦', '☔', '🔥', '✨'
  ]
};

// Flatten all icons for search
const allIcons = Object.entries(iconLibrary).flatMap(([category, icons]) =>
  icons.map(icon => ({ icon, category }))
);

const IconPicker = ({ isOpen, onClose, onSelect, currentIcon }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const searchInputRef = useRef(null);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedCategory('all');
    }
  }, [isOpen]);

  // Filter icons based on search query and category
  const filteredIcons = useMemo(() => {
    let icons = selectedCategory === 'all'
      ? allIcons
      : iconLibrary[selectedCategory]?.map(icon => ({ icon, category: selectedCategory })) || [];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      icons = icons.filter(({ icon, category }) =>
        category.toLowerCase().includes(query) ||
        // Match common emoji names
        getEmojiName(icon).toLowerCase().includes(query)
      );
    }

    return icons;
  }, [searchQuery, selectedCategory]);

  // Get approximate emoji name for search (basic mapping)
  function getEmojiName(emoji) {
    const emojiNames = {
      '💰': 'money cash dollar', '💵': 'money dollar bill', '💳': 'credit card payment',
      '🎰': 'slot machine casino', '🎲': 'dice game', '⚽': 'soccer football ball',
      '🏀': 'basketball ball', '🔧': 'wrench tool', '🔨': 'hammer tool',
      '📧': 'email mail', '📞': 'phone telephone', '💬': 'chat message',
      '🔒': 'lock secure', '🔑': 'key access', '👤': 'user person account',
      '📄': 'document file page', '📊': 'chart graph statistics', '✅': 'check done complete',
      '❌': 'cross error wrong', '⭐': 'star favorite', '🎁': 'gift present bonus',
      '🏆': 'trophy winner award', '💎': 'diamond gem vip', '🔥': 'fire hot trending',
      '⚙️': 'settings gear config', '🛠️': 'tools repair', '💡': 'idea light bulb',
      '🎧': 'headphones support', '🎤': 'microphone voice', '🌐': 'globe world internet',
      '🔗': 'link chain', '📱': 'phone mobile', '💻': 'laptop computer',
      '🎯': 'target goal aim', '📈': 'growth increase up', '📉': 'decrease down loss',
    };
    return emojiNames[emoji] || '';
  }

  const handleSelect = (icon) => {
    onSelect(icon);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
        onClick={onClose}
        onKeyDown={handleKeyDown}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-neutral-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Choose Page Icon
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search */}
          <div className="px-6 py-3 border-b border-gray-100 dark:border-neutral-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search icons..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-neutral-800
                  border-none rounded-lg text-gray-900 dark:text-white
                  placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="px-6 py-2 border-b border-gray-100 dark:border-neutral-800 overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800'
                }`}
              >
                All
              </button>
              {Object.keys(iconLibrary).map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Icons Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredIcons.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 mx-auto text-gray-300 dark:text-neutral-600 mb-3" />
                <p className="text-gray-500 dark:text-neutral-400">No icons found</p>
                <p className="text-sm text-gray-400 dark:text-neutral-500 mt-1">
                  Try a different search term
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-10 gap-1">
                {filteredIcons.map(({ icon }, index) => (
                  <button
                    key={`${icon}-${index}`}
                    onClick={() => handleSelect(icon)}
                    className={`w-10 h-10 flex items-center justify-center text-2xl
                      rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-neutral-800
                      hover:scale-110 ${
                        currentIcon === icon
                          ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500'
                          : ''
                      }`}
                    title={icon}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-100 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/50">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{filteredIcons.length} icons available</span>
              <span>Click an icon to select</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default IconPicker;
