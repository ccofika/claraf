import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Search } from 'lucide-react';

// Emoji data with searchable names
const EMOJI_DATA = {
  'Smileys & People': [
    { e: '😀', n: 'grinning face happy' },
    { e: '😃', n: 'smiley face happy' },
    { e: '😄', n: 'smile happy grin' },
    { e: '😁', n: 'beaming grin teeth' },
    { e: '😆', n: 'laughing squint happy' },
    { e: '😅', n: 'sweat smile nervous' },
    { e: '🤣', n: 'rofl rolling laughing' },
    { e: '😂', n: 'joy tears laughing cry' },
    { e: '🙂', n: 'slightly smiling' },
    { e: '🙃', n: 'upside down face' },
    { e: '😉', n: 'wink winking' },
    { e: '😊', n: 'blush happy shy' },
    { e: '😇', n: 'angel halo innocent' },
    { e: '🥰', n: 'love hearts face' },
    { e: '😍', n: 'heart eyes love' },
    { e: '🤩', n: 'star struck excited' },
    { e: '😘', n: 'kiss blowing' },
    { e: '😗', n: 'kissing' },
    { e: '😚', n: 'kissing closed eyes' },
    { e: '😙', n: 'kissing smiling' },
    { e: '🥲', n: 'smile tear happy sad' },
    { e: '😋', n: 'yum delicious tongue' },
    { e: '😛', n: 'tongue out playful' },
    { e: '😜', n: 'wink tongue crazy' },
    { e: '🤪', n: 'zany crazy wild' },
    { e: '😝', n: 'squinting tongue' },
    { e: '🤑', n: 'money mouth rich' },
    { e: '🤗', n: 'hugging hug' },
    { e: '🤭', n: 'hand over mouth oops' },
    { e: '🤫', n: 'shushing quiet secret' },
    { e: '🤔', n: 'thinking hmm' },
    { e: '🫡', n: 'salute respect' },
    { e: '🤐', n: 'zipper mouth shut' },
    { e: '🤨', n: 'raised eyebrow skeptical' },
    { e: '😐', n: 'neutral face blank' },
    { e: '😑', n: 'expressionless blank' },
    { e: '😶', n: 'no mouth silent' },
    { e: '🫥', n: 'dotted line invisible' },
    { e: '😏', n: 'smirk smug' },
    { e: '😒', n: 'unamused annoyed' },
    { e: '🙄', n: 'eye roll annoyed' },
    { e: '😬', n: 'grimace awkward cringe' },
    { e: '😮‍💨', n: 'exhale sigh relief' },
    { e: '🤥', n: 'liar lying pinocchio' },
    { e: '😌', n: 'relieved peaceful calm' },
    { e: '😔', n: 'pensive sad thoughtful' },
    { e: '😪', n: 'sleepy tired' },
    { e: '🤤', n: 'drooling' },
    { e: '😴', n: 'sleeping zzz' },
    { e: '😷', n: 'mask sick medical' },
    { e: '🤒', n: 'thermometer sick fever' },
    { e: '🤕', n: 'bandage hurt injured' },
    { e: '🤢', n: 'nauseated sick green' },
    { e: '🤮', n: 'vomiting throwing up sick' },
    { e: '🥵', n: 'hot face overheated' },
    { e: '🥶', n: 'cold face freezing' },
    { e: '🥴', n: 'woozy drunk dizzy' },
    { e: '😵', n: 'dizzy knocked out' },
    { e: '😵‍💫', n: 'face spiral dizzy' },
    { e: '🤯', n: 'mind blown exploding head' },
    { e: '🤠', n: 'cowboy hat' },
    { e: '🥳', n: 'party celebration birthday' },
    { e: '🥸', n: 'disguise glasses nose' },
    { e: '😎', n: 'cool sunglasses' },
    { e: '🤓', n: 'nerd glasses' },
    { e: '🧐', n: 'monocle curious' },
    { e: '😕', n: 'confused' },
    { e: '🫤', n: 'diagonal mouth unsure' },
    { e: '😟', n: 'worried concerned' },
    { e: '🙁', n: 'slightly frowning sad' },
    { e: '☹️', n: 'frowning sad' },
    { e: '😮', n: 'open mouth surprised' },
    { e: '😯', n: 'hushed surprised' },
    { e: '😲', n: 'astonished shocked' },
    { e: '😳', n: 'flushed embarrassed' },
    { e: '🥺', n: 'pleading puppy eyes' },
    { e: '🥹', n: 'holding back tears emotional' },
    { e: '😦', n: 'frowning mouth open' },
    { e: '😧', n: 'anguished distressed' },
    { e: '😨', n: 'fearful scared' },
    { e: '😰', n: 'anxious sweat worried' },
    { e: '😥', n: 'sad relieved sweat' },
    { e: '😢', n: 'crying tear sad' },
    { e: '😭', n: 'sobbing crying loud' },
    { e: '😱', n: 'screaming fear scared' },
    { e: '😖', n: 'confounded frustrated' },
    { e: '😣', n: 'persevering struggling' },
    { e: '😞', n: 'disappointed sad' },
    { e: '😓', n: 'downcast sweat sad' },
    { e: '😩', n: 'weary tired exhausted' },
    { e: '😫', n: 'tired exhausted' },
    { e: '🥱', n: 'yawning bored tired' },
    { e: '😤', n: 'angry huffing triumph' },
    { e: '😡', n: 'angry mad red' },
    { e: '😠', n: 'angry face mad' },
    { e: '🤬', n: 'cursing swearing angry' },
    { e: '😈', n: 'devil smiling horns' },
    { e: '👿', n: 'devil angry imp' },
    { e: '💀', n: 'skull dead death' },
    { e: '☠️', n: 'skull crossbones death' },
    { e: '💩', n: 'poop poo' },
    { e: '🤡', n: 'clown face' },
    { e: '👹', n: 'ogre monster' },
    { e: '👻', n: 'ghost boo' },
    { e: '👽', n: 'alien ufo' },
    { e: '🤖', n: 'robot' },
    { e: '🫠', n: 'melting face hot' },
  ],
  'Gestures & Body': [
    { e: '👍', n: 'thumbs up like good yes' },
    { e: '👎', n: 'thumbs down dislike bad no' },
    { e: '👏', n: 'clap clapping bravo' },
    { e: '🙌', n: 'raising hands celebration hooray' },
    { e: '👐', n: 'open hands' },
    { e: '🤝', n: 'handshake deal agreement' },
    { e: '🙏', n: 'pray please thank you folded hands' },
    { e: '✌️', n: 'peace victory two' },
    { e: '🤞', n: 'crossed fingers luck hope' },
    { e: '🤟', n: 'love you gesture hand' },
    { e: '🤘', n: 'rock on horns metal' },
    { e: '👌', n: 'ok okay perfect' },
    { e: '🤏', n: 'pinching small little' },
    { e: '👈', n: 'pointing left' },
    { e: '👉', n: 'pointing right' },
    { e: '👆', n: 'pointing up' },
    { e: '👇', n: 'pointing down' },
    { e: '☝️', n: 'index pointing up one' },
    { e: '✋', n: 'raised hand stop high five' },
    { e: '🤚', n: 'raised back of hand' },
    { e: '🖐️', n: 'hand fingers splayed' },
    { e: '🖖', n: 'vulcan salute spock' },
    { e: '👋', n: 'wave waving hello bye' },
    { e: '🤙', n: 'call me hand shaka' },
    { e: '💪', n: 'muscle flexed strong arm' },
    { e: '🦾', n: 'mechanical arm prosthetic' },
    { e: '🖕', n: 'middle finger' },
    { e: '✍️', n: 'writing hand' },
    { e: '🤳', n: 'selfie' },
    { e: '💅', n: 'nail polish' },
    { e: '🫶', n: 'heart hands love' },
    { e: '🫰', n: 'hand with index finger and thumb crossed money' },
    { e: '🫱', n: 'rightward hand' },
    { e: '🫲', n: 'leftward hand' },
    { e: '🫳', n: 'palm down hand' },
    { e: '🫴', n: 'palm up hand' },
    { e: '🫵', n: 'index pointing at viewer you' },
    { e: '👀', n: 'eyes looking see' },
    { e: '👁️', n: 'eye' },
    { e: '👄', n: 'mouth lips kiss' },
    { e: '🧠', n: 'brain smart think' },
    { e: '🦷', n: 'tooth teeth' },
    { e: '👂', n: 'ear listen hearing' },
    { e: '👃', n: 'nose smell' },
  ],
  'Hearts & Emotions': [
    { e: '❤️', n: 'red heart love' },
    { e: '🧡', n: 'orange heart' },
    { e: '💛', n: 'yellow heart' },
    { e: '💚', n: 'green heart' },
    { e: '💙', n: 'blue heart' },
    { e: '💜', n: 'purple heart' },
    { e: '🖤', n: 'black heart dark' },
    { e: '🤍', n: 'white heart' },
    { e: '🤎', n: 'brown heart' },
    { e: '🩷', n: 'pink heart' },
    { e: '🩵', n: 'light blue heart' },
    { e: '🩶', n: 'grey heart' },
    { e: '💔', n: 'broken heart' },
    { e: '❣️', n: 'heart exclamation' },
    { e: '💕', n: 'two hearts love' },
    { e: '💞', n: 'revolving hearts love' },
    { e: '💓', n: 'beating heart love' },
    { e: '💗', n: 'growing heart love' },
    { e: '💖', n: 'sparkling heart love' },
    { e: '💘', n: 'heart with arrow cupid love' },
    { e: '💝', n: 'heart with ribbon gift love' },
    { e: '💟', n: 'heart decoration love' },
    { e: '❤️‍🔥', n: 'heart on fire burning love passion' },
    { e: '❤️‍🩹', n: 'mending heart healing' },
    { e: '💋', n: 'kiss mark lips' },
    { e: '💌', n: 'love letter envelope' },
    { e: '💐', n: 'bouquet flowers' },
    { e: '🌹', n: 'rose flower red' },
    { e: '💍', n: 'ring diamond engagement' },
    { e: '💎', n: 'gem diamond jewel' },
  ],
  'Celebrations & Objects': [
    { e: '🎉', n: 'party popper celebration tada' },
    { e: '🎊', n: 'confetti ball celebration' },
    { e: '🎈', n: 'balloon party' },
    { e: '🎁', n: 'gift present wrapped' },
    { e: '🎂', n: 'birthday cake' },
    { e: '🎀', n: 'ribbon bow' },
    { e: '🏆', n: 'trophy winner champion cup' },
    { e: '🥇', n: 'gold medal first place winner' },
    { e: '🥈', n: 'silver medal second place' },
    { e: '🥉', n: 'bronze medal third place' },
    { e: '🏅', n: 'medal sports' },
    { e: '🎖️', n: 'military medal' },
    { e: '🎯', n: 'bullseye target direct hit' },
    { e: '🎮', n: 'game controller joystick' },
    { e: '🎲', n: 'dice game' },
    { e: '🎵', n: 'music note' },
    { e: '🎶', n: 'music notes' },
    { e: '🎤', n: 'microphone singing karaoke' },
    { e: '🎧', n: 'headphones music' },
    { e: '🎬', n: 'clapper board movie film' },
    { e: '📷', n: 'camera photo' },
    { e: '📱', n: 'phone mobile' },
    { e: '💻', n: 'laptop computer' },
    { e: '⌨️', n: 'keyboard typing' },
    { e: '🖥️', n: 'desktop computer monitor' },
    { e: '📧', n: 'email e-mail' },
    { e: '📝', n: 'memo note writing' },
    { e: '📋', n: 'clipboard' },
    { e: '📁', n: 'folder file' },
    { e: '📂', n: 'open folder file' },
    { e: '📊', n: 'bar chart graph' },
    { e: '📈', n: 'chart increasing trending up' },
    { e: '📉', n: 'chart decreasing trending down' },
    { e: '📎', n: 'paperclip attachment' },
    { e: '🔗', n: 'link chain url' },
    { e: '📐', n: 'triangular ruler' },
    { e: '📏', n: 'ruler straight' },
    { e: '🔧', n: 'wrench tool fix' },
    { e: '🔨', n: 'hammer tool build' },
    { e: '⚙️', n: 'gear settings cog' },
    { e: '🔑', n: 'key lock password' },
    { e: '🔒', n: 'lock locked secure' },
    { e: '🔓', n: 'unlock unlocked open' },
    { e: '💡', n: 'light bulb idea' },
    { e: '🔋', n: 'battery power' },
    { e: '💰', n: 'money bag rich' },
    { e: '💵', n: 'dollar money cash' },
    { e: '💳', n: 'credit card payment' },
    { e: '🛒', n: 'shopping cart' },
    { e: '📦', n: 'package box delivery' },
  ],
  'Symbols & Signs': [
    { e: '⭐', n: 'star yellow' },
    { e: '🌟', n: 'glowing star bright' },
    { e: '✨', n: 'sparkles magic shine' },
    { e: '💫', n: 'dizzy star shooting' },
    { e: '🔥', n: 'fire hot flame lit' },
    { e: '💯', n: 'hundred points perfect score' },
    { e: '✅', n: 'check mark done complete yes' },
    { e: '❌', n: 'cross mark wrong no cancel' },
    { e: '❗', n: 'exclamation mark important red' },
    { e: '❓', n: 'question mark' },
    { e: '‼️', n: 'double exclamation' },
    { e: '⁉️', n: 'exclamation question' },
    { e: '⚠️', n: 'warning caution alert' },
    { e: '📌', n: 'pushpin pin' },
    { e: '📍', n: 'pin location round' },
    { e: '🔔', n: 'bell notification alert' },
    { e: '🔕', n: 'bell slash mute no notification' },
    { e: '💬', n: 'speech bubble message chat' },
    { e: '💭', n: 'thought bubble thinking' },
    { e: '🗨️', n: 'speech balloon left' },
    { e: '👁️‍🗨️', n: 'eye speech witness' },
    { e: '🔴', n: 'red circle' },
    { e: '🟠', n: 'orange circle' },
    { e: '🟡', n: 'yellow circle' },
    { e: '🟢', n: 'green circle' },
    { e: '🔵', n: 'blue circle' },
    { e: '🟣', n: 'purple circle' },
    { e: '⚫', n: 'black circle' },
    { e: '⚪', n: 'white circle' },
    { e: '🟤', n: 'brown circle' },
    { e: '🔺', n: 'red triangle up' },
    { e: '🔻', n: 'red triangle down' },
    { e: '🔶', n: 'orange diamond large' },
    { e: '🔷', n: 'blue diamond large' },
    { e: '▶️', n: 'play button right' },
    { e: '⏸️', n: 'pause button' },
    { e: '⏹️', n: 'stop button' },
    { e: '⏩', n: 'fast forward' },
    { e: '⏪', n: 'rewind fast back' },
    { e: '🔄', n: 'arrows refresh reload cycle' },
    { e: '➕', n: 'plus add' },
    { e: '➖', n: 'minus subtract' },
    { e: '➡️', n: 'right arrow' },
    { e: '⬅️', n: 'left arrow' },
    { e: '⬆️', n: 'up arrow' },
    { e: '⬇️', n: 'down arrow' },
    { e: '↗️', n: 'up right arrow northeast' },
    { e: '↘️', n: 'down right arrow southeast' },
    { e: '🆗', n: 'ok button' },
    { e: '🆕', n: 'new button' },
    { e: '🆙', n: 'up button' },
    { e: '🔤', n: 'abc letters alphabet' },
    { e: '🔢', n: 'numbers 1234' },
    { e: '#️⃣', n: 'hash number sign' },
    { e: '🏷️', n: 'label tag' },
    { e: '🚀', n: 'rocket launch ship' },
    { e: '🛸', n: 'ufo flying saucer' },
    { e: '✈️', n: 'airplane plane travel' },
    { e: '⏰', n: 'alarm clock time' },
    { e: '🕐', n: 'clock one oclock time' },
  ],
  'Nature & Food': [
    { e: '☀️', n: 'sun sunny bright' },
    { e: '🌙', n: 'moon crescent night' },
    { e: '⛅', n: 'cloud sun partly cloudy' },
    { e: '🌧️', n: 'rain cloud rainy' },
    { e: '⛈️', n: 'thunder storm lightning' },
    { e: '🌈', n: 'rainbow colorful' },
    { e: '❄️', n: 'snowflake cold winter' },
    { e: '🌊', n: 'wave ocean water sea' },
    { e: '🌸', n: 'cherry blossom flower pink' },
    { e: '🌺', n: 'hibiscus flower' },
    { e: '🌻', n: 'sunflower' },
    { e: '🌿', n: 'herb leaf green' },
    { e: '🍀', n: 'four leaf clover lucky' },
    { e: '🌲', n: 'evergreen tree pine' },
    { e: '🌳', n: 'deciduous tree' },
    { e: '🍎', n: 'red apple fruit' },
    { e: '🍕', n: 'pizza food' },
    { e: '🍔', n: 'hamburger burger food' },
    { e: '☕', n: 'coffee hot beverage tea' },
    { e: '🍺', n: 'beer mug drink' },
    { e: '🍷', n: 'wine glass drink' },
    { e: '🥂', n: 'clinking glasses cheers champagne toast' },
    { e: '🍰', n: 'cake shortcake dessert' },
    { e: '🍩', n: 'doughnut donut dessert' },
    { e: '🍫', n: 'chocolate bar candy' },
    { e: '🍿', n: 'popcorn movie snack' },
    { e: '🐶', n: 'dog puppy' },
    { e: '🐱', n: 'cat kitten' },
    { e: '🐻', n: 'bear' },
    { e: '🦁', n: 'lion' },
    { e: '🐼', n: 'panda bear' },
    { e: '🦊', n: 'fox' },
    { e: '🐸', n: 'frog' },
    { e: '🐝', n: 'bee honeybee' },
    { e: '🦋', n: 'butterfly' },
    { e: '🐳', n: 'whale spouting' },
    { e: '🦄', n: 'unicorn magic' },
    { e: '🐍', n: 'snake' },
    { e: '🦅', n: 'eagle bird' },
    { e: '🕊️', n: 'dove peace bird' },
  ],
};

// Flatten all emojis for search
const ALL_EMOJIS = Object.entries(EMOJI_DATA).flatMap(([cat, emojis]) =>
  emojis.map(item => ({ ...item, category: cat }))
);

const EmojiPicker = ({ onSelectEmoji, onClose }) => {
  const pickerRef = useRef(null);
  const searchRef = useRef(null);
  const [search, setSearch] = useState('');

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

  // Auto-focus search on mount
  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 50);
  }, []);

  // Filter emojis based on search
  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return EMOJI_DATA;

    const matches = ALL_EMOJIS.filter(item =>
      item.n.toLowerCase().includes(q) || item.e === q
    );

    if (matches.length === 0) return null;

    // Group results by category
    const grouped = {};
    for (const item of matches) {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    }
    return grouped;
  }, [search]);

  return (
    <div
      ref={pickerRef}
      className="w-80 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-xl p-3"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Search bar */}
      <div className="relative mb-2">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          ref={searchRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search emoji..."
          className="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              if (search) setSearch('');
              else onClose();
            }
          }}
        />
      </div>

      <div className="max-h-72 overflow-y-auto">
        {filteredData === null ? (
          <div className="text-center text-sm text-gray-400 dark:text-neutral-500 py-6">
            No emojis found
          </div>
        ) : (
          Object.entries(filteredData).map(([category, emojis]) => (
            <div key={category} className="mb-3 last:mb-0">
              <div className="text-[11px] font-semibold text-gray-500 dark:text-neutral-400 mb-1.5 px-0.5 uppercase tracking-wide">
                {category}
              </div>
              <div className="grid grid-cols-8 gap-0.5">
                {(Array.isArray(emojis) ? emojis : []).map((item) => {
                  const emoji = typeof item === 'string' ? item : item.e;
                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => onSelectEmoji(emoji)}
                      className="w-8 h-8 flex items-center justify-center text-xl hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EmojiPicker;
