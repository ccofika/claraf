import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import { Send, Paperclip, Smile, X, Loader2, File } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import axios from 'axios';
import { toast } from 'sonner';

const ChatInput = () => {
  const { activeChannel, sendMessage, replyingTo, setReplyingTo } = useChat();
  const { socket, isConnected } = useSocket();
  const [content, setContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
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
      // Include reply metadata if replying
      const metadata = replyingTo ? { replyTo: replyingTo._id } : {};

      await sendMessage(activeChannel._id, content.trim(), 'text', metadata);
      setContent('');
      setIsTyping(false);
      setReplyingTo(null); // Clear reply after sending

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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const uploadFileToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    try {
      const response = await axios.post(
        `${API_URL}/api/chat/upload`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return response.data.file;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleSendWithFile = async () => {
    if (!selectedFile && !content.trim()) return;

    setUploadingFile(true);
    try {
      let fileData = null;

      // Upload file if selected
      if (selectedFile) {
        toast.loading('Uploading file...');
        fileData = await uploadFileToCloudinary(selectedFile);
        toast.dismiss();
        toast.success('File uploaded successfully');
      }

      // Send message with file or just text
      const messageContent = selectedFile
        ? fileData.originalName
        : content.trim();

      const metadata = {
        ...(replyingTo ? { replyTo: replyingTo._id } : {}),
        ...(fileData ? {
          files: [{
            url: fileData.url,
            name: fileData.originalName,
            type: fileData.mimeType,
            size: fileData.bytes
          }]
        } : {})
      };

      await sendMessage(
        activeChannel._id,
        messageContent,
        fileData ? 'file' : 'text',
        metadata
      );

      // Clear inputs
      setContent('');
      setSelectedFile(null);
      setReplyingTo(null);
      setIsTyping(false);

      if (socket && isConnected) {
        socket.emit('chat:typing:stop', { channelId: activeChannel._id });
      }

      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  if (!activeChannel) return null;

  return (
    <div className="border-t border-gray-200/60 dark:border-neutral-800/60 px-4 py-3">
      <div className="max-w-none">
        {/* Reply Preview */}
        {replyingTo && (
          <div className="mb-2 px-3 py-2 bg-gray-100 dark:bg-neutral-900/50 border-l-2 border-gray-400 dark:border-neutral-600 flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-gray-900 dark:text-white">
                Replying to {replyingTo.sender.name}
              </div>
              <div className="text-[13px] text-gray-600 dark:text-neutral-400 truncate">
                {replyingTo.content}
              </div>
            </div>
            <button
              onClick={handleCancelReply}
              className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
            </button>
          </div>
        )}

        {/* Selected File Preview */}
        {selectedFile && (
          <div className="mb-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border-l-2 border-[#1164A3] flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <File className="w-4 h-4 text-[#1164A3] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
                  {selectedFile.name}
                </div>
                <div className="text-[11px] text-gray-600 dark:text-neutral-400">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </div>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="ml-2 p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="relative flex items-end gap-2 border border-gray-300 dark:border-neutral-700 hover:border-gray-400 dark:hover:border-neutral-600 focus-within:border-gray-500 dark:focus-within:border-neutral-500 transition-colors">
          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${activeChannel.name || 'chat'}...`}
              rows={1}
              className="w-full px-3 py-2 bg-white dark:bg-[#1A1D21] text-[15px] text-gray-900 dark:text-neutral-50 placeholder-gray-500 dark:placeholder-neutral-500 focus:outline-none resize-none max-h-32 overflow-y-auto"
              style={{
                minHeight: '40px',
                height: 'auto'
              }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
          </div>

          {/* Actions Bar (right) */}
          <div className="flex items-center gap-0.5 px-1 pb-1.5">
            <button
              onClick={handleFileUpload}
              className="p-1.5 text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors"
              title="Attach file"
            >
              <Paperclip className="w-[18px] h-[18px]" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1.5 text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors"
                title="Add emoji"
              >
                <Smile className="w-[18px] h-[18px]" />
              </button>

              {showEmojiPicker && (
                <div className="absolute bottom-full right-0 mb-2">
                  <EmojiPicker
                    onSelectEmoji={handleEmojiSelect}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                </div>
              )}
            </div>

            <button
              onClick={selectedFile || uploadingFile ? handleSendWithFile : handleSend}
              disabled={(content.trim().length === 0 && !selectedFile) || uploadingFile}
              className="p-1.5 bg-[#007A5A] hover:bg-[#006644] text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Send message"
            >
              {uploadingFile ? (
                <Loader2 className="w-[18px] h-[18px] animate-spin" />
              ) : (
                <Send className="w-[18px] h-[18px]" />
              )}
            </button>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="*/*"
        />
      </div>
    </div>
  );
};

export default ChatInput;
