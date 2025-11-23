import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import { Send, Paperclip, Smile, Mic, X } from 'lucide-react';
import EmojiPicker from './EmojiPicker';

const ChatInput = () => {
  const { activeChannel, sendMessage } = useChat();
  const { socket, isConnected } = useSocket();
  const [content, setContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Handle typing indicators
  useEffect(() => {
    if (!socket || !isConnected || !activeChannel) return;

    if (content.trim().length > 0 && !isTyping) {
      setIsTyping(true);
      socket.emit('chat:typing:start', { channelId: activeChannel._id });
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        socket.emit('chat:typing:stop', { channelId: activeChannel._id });
      }
    }, 3000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [content, socket, isConnected, activeChannel, isTyping]);

  // Stop typing when component unmounts or channel changes
  useEffect(() => {
    return () => {
      if (socket && isConnected && activeChannel && isTyping) {
        socket.emit('chat:typing:stop', { channelId: activeChannel._id });
      }
    };
  }, [socket, isConnected, activeChannel, isTyping]);

  const handleSend = async () => {
    if (!content.trim() || !activeChannel) return;

    try {
      await sendMessage(activeChannel._id, content.trim());
      setContent('');
      setIsTyping(false);

      if (socket && isConnected) {
        socket.emit('chat:typing:stop', { channelId: activeChannel._id });
      }

      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji) => {
    setContent(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleFileUpload = () => {
    // TODO: Implement file upload
    console.log('File upload clicked');
  };

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recording
    console.log('Voice recording:', !isRecording);
  };

  if (!activeChannel) return null;

  return (
    <div className="border-t border-gray-200 dark:border-neutral-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Recording Indicator */}
        {isRecording && (
          <div className="mb-3 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-red-700 dark:text-red-400">
                  Recording...
                </span>
              </div>
              <span className="text-sm text-red-600 dark:text-red-500">00:15</span>
            </div>
            <button
              onClick={handleVoiceRecord}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="relative flex items-end gap-2">
          {/* Actions Bar (left) */}
          <div className="flex items-center gap-1 pb-2">
            <button
              onClick={handleFileUpload}
              className="p-2 text-gray-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-900 rounded-lg transition-colors"
              title="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 text-gray-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-900 rounded-lg transition-colors"
                title="Add emoji"
              >
                <Smile className="w-5 h-5" />
              </button>

              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-2">
                  <EmojiPicker
                    onSelectEmoji={handleEmojiSelect}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${activeChannel.name || 'chat'}...`}
              rows={1}
              className="w-full px-4 py-2.5 bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg text-sm text-gray-900 dark:text-neutral-50 placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 resize-none max-h-32 overflow-y-auto"
              style={{
                minHeight: '42px',
                height: 'auto'
              }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
          </div>

          {/* Send/Voice Button */}
          {content.trim().length > 0 ? (
            <button
              onClick={handleSend}
              className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mb-0.5"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleVoiceRecord}
              className={`p-2.5 rounded-lg transition-colors mb-0.5 ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-100 dark:bg-neutral-900 hover:bg-gray-200 dark:hover:bg-neutral-800 text-gray-600 dark:text-neutral-400'
              }`}
              title={isRecording ? 'Stop recording' : 'Record voice message'}
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Helper Text */}
        <div className="mt-2 text-xs text-gray-500 dark:text-neutral-500">
          <span className="font-medium">Enter</span> to send • <span className="font-medium">Shift + Enter</span> for new line
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
