import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { Send, Paperclip, Smile, X, Loader2, Plus, FileText, Folder, Pencil } from 'lucide-react';
import { Image as ImageIcon } from 'lucide-react';
import { File as FileIcon } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import FormattingToolbar from './FormattingToolbar';
import MentionDropdown from './MentionDropdown';
import ChatRichTextInput from './ChatRichTextInput';
import axios from 'axios';
import { toast } from 'sonner';
import AddContentModal from './AddContentModal';

const ChatInput = () => {
  const { activeChannel, sendMessage, replyingTo, setReplyingTo, messages, editMessage } = useChat();
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  // Load draft messages from localStorage on mount
  const [draftMessages, setDraftMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('chatDrafts');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showAddContentModal, setShowAddContentModal] = useState(false);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearchQuery, setMentionSearchQuery] = useState('');
  const [mentionStartPos, setMentionStartPos] = useState(null);
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

  // Save draft message when content changes
  useEffect(() => {
    if (activeChannel?._id) {
      setDraftMessages(prev => ({
        ...prev,
        [activeChannel._id]: content
      }));
    }
  }, [content, activeChannel?._id]);

  // Load draft message when channel changes
  useEffect(() => {
    if (activeChannel?._id) {
      const draft = draftMessages[activeChannel._id] || '';
      setContent(draft);
    }
  }, [activeChannel?._id]);

  // Persist draft messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('chatDrafts', JSON.stringify(draftMessages));
    } catch (error) {
      console.error('Failed to save drafts to localStorage:', error);
    }
  }, [draftMessages]);

  // Handle clipboard paste (for screenshots)
  useEffect(() => {
    const handlePaste = (e) => {
      // Only handle paste when input area is focused or when textarea is focused
      if (!activeChannel) return;

      const isTextareaFocused = document.activeElement === inputRef.current;

      // Only process if textarea is focused
      if (!isTextareaFocused) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      // Look for image in clipboard
      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();

          const blob = item.getAsFile();
          if (!blob) continue;

          // Create a File object with a proper name
          const timestamp = new Date().getTime();
          const file = new File([blob], `screenshot-${timestamp}.png`, {
            type: blob.type,
            lastModified: timestamp
          });

          console.log('📋 Pasted image from clipboard:', file.name);
          setSelectedFile(file);
          toast.success('Screenshot pasted! Ready to send.');
          break;
        }
      }
    };

    // Add paste listener to document (captures all paste events)
    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [activeChannel]);

  // Create preview URL for selected file (if it's an image)
  useEffect(() => {
    if (selectedFile) {
      // Check if file is an image
      if (selectedFile.type.startsWith('image/')) {
        const url = URL.createObjectURL(selectedFile);
        setFilePreviewUrl(url);

        // Cleanup URL when component unmounts or file changes
        return () => URL.revokeObjectURL(url);
      } else {
        setFilePreviewUrl(null);
      }
    } else {
      setFilePreviewUrl(null);
    }
  }, [selectedFile]);

  // Helper to check if HTML content is empty
  const isContentEmpty = (html) => {
    if (!html) return true;
    // Remove HTML tags and check if remaining text is empty
    const text = html.replace(/<[^>]*>/g, '').trim();
    return text.length === 0;
  };

  // Helper to get plain text from HTML
  const getPlainText = (html) => {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  const handleSend = async () => {
    if (isContentEmpty(content) || !activeChannel) return;

    try {
      // Include reply metadata if replying
      const metadata = replyingTo ? { replyTo: replyingTo._id } : {};

      await sendMessage(activeChannel._id, content, 'text', metadata);
      setContent('');
      // Clear draft for this channel
      setDraftMessages(prev => ({
        ...prev,
        [activeChannel._id]: ''
      }));
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

  // Handle content change (receives HTML string from ChatRichTextInput)
  const handleContentChange = (newContent) => {
    // Handle both string (from ChatRichTextInput) and event object (fallback)
    const htmlContent = typeof newContent === 'string' ? newContent : newContent?.target?.value || '';
    setContent(htmlContent);

    // For mentions, we need to get plain text
    const plainText = getPlainText(htmlContent);
    const lastAtIndex = plainText.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = plainText.substring(lastAtIndex + 1);
      // Check if there's no space after @ (still typing mention)
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setShowMentionDropdown(true);
        setMentionSearchQuery(textAfterAt);
        setMentionStartPos(lastAtIndex);
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }
  };

  const handleMentionSelect = (member) => {
    if (!member || mentionStartPos === null) {
      setShowMentionDropdown(false);
      return;
    }

    const beforeMention = content.substring(0, mentionStartPos);
    const afterMention = content.substring(inputRef.current.selectionStart);

    // Wrap mention with invisible zero-width markers to identify exact boundaries
    // \u200B = zero-width space (invisible but detectable)
    const mentionText = `\u200B@${member.name}\u200B`;
    const newContent = `${beforeMention}${mentionText} ${afterMention}`;

    setContent(newContent);
    setShowMentionDropdown(false);
    setMentionSearchQuery('');
    setMentionStartPos(null);

    // Focus and position cursor after mention
    setTimeout(() => {
      inputRef.current?.focus();
      const newCursorPos = beforeMention.length + member.name.length + 2; // +2 for @ and space
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Handle saving edited message
  const handleSaveEdit = async () => {
    if (!editingMessage || isContentEmpty(content)) return;

    try {
      await editMessage(editingMessage._id, content);
      setEditingMessage(null);
      setContent('');
      toast.success('Message edited');
    } catch (error) {
      console.error('Failed to edit message:', error);
      toast.error('Failed to edit message');
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingMessage(null);
    setContent('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    // Send message or save edit
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (editingMessage) {
        handleSaveEdit();
      } else if (selectedFile || selectedElement || selectedTicket) {
        handleSendWithFile();
      } else {
        handleSend();
      }
      return;
    }

    // Cancel edit or close mention dropdown
    if (e.key === 'Escape') {
      e.preventDefault();
      if (editingMessage) {
        handleCancelEdit();
      } else if (showMentionDropdown) {
        setShowMentionDropdown(false);
      }
      return;
    }

    // Arrow Up - Edit last own message (when input is empty and cursor at start)
    if (e.key === 'ArrowUp' && isContentEmpty(content) && !editingMessage) {
      const cursorPos = inputRef.current?.selectionStart || 0;
      if (cursorPos === 0) {
        e.preventDefault();
        // Find the last message from current user
        const ownMessages = messages.filter(msg =>
          msg.sender?._id === user?._id &&
          msg.type === 'text' &&
          !msg.isDeleted
        );
        if (ownMessages.length > 0) {
          const lastOwnMessage = ownMessages[ownMessages.length - 1];
          setEditingMessage(lastOwnMessage);
          setContent(lastOwnMessage.content);
          // Position cursor at end of content
          setTimeout(() => {
            inputRef.current?.focus();
            const len = lastOwnMessage.content.length;
            inputRef.current?.setSelectionRange(len, len);
          }, 0);
        }
      }
      return;
    }
    // Note: Formatting shortcuts (Ctrl+B, Ctrl+I, etc.) are handled by ChatRichTextInput
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
    if (!selectedFile && isContentEmpty(content) && !selectedElement && !selectedTicket) return;

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

      // Determine message content and type
      let messageContent = isContentEmpty(content) ? '' : content;
      let messageType = 'text';

      // Build metadata
      const metadata = {
        ...(replyingTo ? { replyTo: replyingTo._id } : {}),
        ...(fileData ? {
          files: [{
            url: fileData.url,
            name: fileData.originalName,
            type: fileData.mimeType,
            size: fileData.bytes
          }]
        } : {}),
        ...(selectedElement ? {
          element: {
            elementId: selectedElement._id,
            workspaceId: selectedElement.workspaceId,
            workspaceName: selectedElement.workspaceName,
            type: selectedElement.type,
            title: selectedElement.title || 'Untitled',
            preview: selectedElement.content || '',
            description: selectedElement.description || '',
            macro: selectedElement.macro || '',
            example: selectedElement.example || null,
            exampleIndex: selectedElement.exampleIndex !== null && selectedElement.exampleIndex !== undefined ? selectedElement.exampleIndex : null,
            thumbnailUrl: selectedElement.thumbnailUrl || null
          }
        } : {}),
        ...(selectedTicket ? {
          ticket: {
            ticketId: selectedTicket._id,
            title: selectedTicket.title,
            description: selectedTicket.description?.substring(0, 100) || '',
            status: selectedTicket.status,
            priority: selectedTicket.priority?.toLowerCase() || 'medium',
            category: selectedTicket.category
          }
        } : {})
      };

      // Determine message type
      if (selectedElement) {
        messageType = 'element';
        // Only add default message if user didn't provide any text
        if (!messageContent) {
          messageContent = ' '; // Send empty space to avoid validation errors
        }
      } else if (selectedTicket) {
        messageType = 'ticket';
        if (!messageContent) {
          messageContent = ' '; // Send empty space to avoid validation errors
        }
      } else if (fileData) {
        messageType = 'file';
        if (!messageContent) {
          messageContent = fileData.originalName;
        }
      }

      await sendMessage(
        activeChannel._id,
        messageContent,
        messageType,
        metadata
      );

      // Clear inputs
      setContent('');
      // Clear draft for this channel
      setDraftMessages(prev => ({
        ...prev,
        [activeChannel._id]: ''
      }));
      setSelectedFile(null);
      setSelectedElement(null);
      setSelectedTicket(null);
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

  const handleRemoveElement = () => {
    setSelectedElement(null);
  };

  const handleRemoveTicket = () => {
    setSelectedTicket(null);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleSelectElement = (element) => {
    setSelectedElement(element);
    setSelectedTicket(null); // Clear ticket if selecting element
    setShowAddContentModal(false); // Close modal after selection
  };

  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket);
    setSelectedElement(null); // Clear element if selecting ticket
    setShowAddContentModal(false); // Close modal after selection
  };

  // Strip HTML tags for display
  const stripHtml = (html) => {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  if (!activeChannel) return null;

  return (
    <div className="border-t border-gray-200/60 dark:border-neutral-800/60 px-4 py-3">
      <div className="max-w-none">
        {/* Editing Preview */}
        {editingMessage && (
          <div className="mb-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-l-2 border-yellow-500 flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-[13px] font-semibold text-yellow-700 dark:text-yellow-400">
                <Pencil className="w-3.5 h-3.5" />
                Editing message
              </div>
              <div className="text-[12px] text-gray-500 dark:text-neutral-500 mt-0.5">
                Press Enter to save • Escape to cancel
              </div>
            </div>
            <button
              onClick={handleCancelEdit}
              className="ml-2 p-1 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
            </button>
          </div>
        )}

        {/* Reply Preview */}
        {replyingTo && !editingMessage && (
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
          <div className="mb-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border-l-2 border-[#1164A3] flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              {filePreviewUrl ? (
                // Image thumbnail preview
                <div className="flex-shrink-0">
                  <img
                    src={filePreviewUrl}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded border border-[#1164A3]/20"
                  />
                </div>
              ) : (
                // File icon for non-images
                <FileIcon className="w-4 h-4 text-[#1164A3] flex-shrink-0 mt-1" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {filePreviewUrl && <ImageIcon className="w-3.5 h-3.5 text-[#1164A3]" />}
                  <div className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
                    {selectedFile.name}
                  </div>
                </div>
                <div className="text-[11px] text-gray-600 dark:text-neutral-400">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                  {filePreviewUrl && ' • Image'}
                </div>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="flex-shrink-0 p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
            </button>
          </div>
        )}

        {/* Selected Element Preview */}
        {selectedElement && (
          <div className="mb-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border-l-2 border-green-500 flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <FileText className="w-4 h-4 text-green-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
                  {stripHtml(selectedElement.title) || 'Untitled Element'}
                </div>
                <div className="text-[11px] text-gray-600 dark:text-neutral-400 capitalize">
                  {selectedElement.type} • {selectedElement.workspaceName}
                </div>
              </div>
            </div>
            <button
              onClick={handleRemoveElement}
              className="ml-2 p-1 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
            </button>
          </div>
        )}

        {/* Selected Ticket Preview */}
        {selectedTicket && (
          <div className="mb-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 border-l-2 border-purple-500 flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Folder className="w-4 h-4 text-purple-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
                  {selectedTicket.title || 'Untitled Ticket'}
                </div>
                <div className="text-[11px] text-gray-600 dark:text-neutral-400">
                  {selectedTicket.status} • {selectedTicket.priority}
                </div>
              </div>
            </div>
            <button
              onClick={handleRemoveTicket}
              className="ml-2 p-1 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="relative border border-gray-300 dark:border-neutral-700 hover:border-gray-400 dark:hover:border-neutral-600 focus-within:border-gray-500 dark:focus-within:border-neutral-500 transition-colors">
          <div className="flex items-end gap-2">
            {/* Text Input */}
            <div className="flex-1 relative">
              <ChatRichTextInput
                ref={inputRef}
                value={content}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${activeChannel.name || 'chat'}...`}
                rows={1}
                className="w-full px-3 py-2 bg-white dark:bg-[#1A1D21] text-[15px] text-gray-900 dark:text-neutral-50 placeholder-gray-500 dark:placeholder-neutral-500 focus:outline-none resize-none max-h-32 overflow-y-auto"
              />

              {/* Mention Dropdown */}
              {showMentionDropdown && activeChannel?.members && (
                <MentionDropdown
                  members={activeChannel.members.map(m => m.userId || m).filter(u => u && u._id)}
                  onSelect={handleMentionSelect}
                  searchQuery={mentionSearchQuery}
                />
              )}
            </div>

          {/* Actions Bar (right) */}
          <div className="flex items-center gap-0.5 px-1 pb-1.5">
            <button
              onClick={() => setShowAddContentModal(true)}
              className="p-1.5 text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors"
              title="Add element or ticket"
            >
              <Plus className="w-[18px] h-[18px]" />
            </button>

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
              onClick={selectedFile || selectedElement || selectedTicket || uploadingFile ? handleSendWithFile : handleSend}
              disabled={(content.trim().length === 0 && !selectedFile && !selectedElement && !selectedTicket) || uploadingFile}
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

          {/* Formatting Toolbar */}
          <FormattingToolbar onFormat={setContent} inputRef={inputRef} />
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="*/*"
        />

        {/* Add Content Modal */}
        <AddContentModal
          isOpen={showAddContentModal}
          onClose={() => setShowAddContentModal(false)}
          onSelectElement={handleSelectElement}
          onSelectTicket={handleSelectTicket}
        />
      </div>
    </div>
  );
};

export default ChatInput;
