import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Smile, Paperclip, Plus, Loader2, FileText, Folder } from 'lucide-react';
import { File as FileIcon } from 'lucide-react';
import { Image as ImageIcon } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import MessageBubble from './MessageBubble';
import EmojiPicker from './EmojiPicker';
import FormattingToolbar from './FormattingToolbar';
import AddContentModal from './AddContentModal';
import ChatRichTextInput from './ChatRichTextInput';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ThreadPanel = ({ parentMessage, onClose }) => {
  const { user } = useAuth();
  const { sendMessage, socket } = useChat();
  const [threadReplies, setThreadReplies] = useState([]);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [alsoSendToChannel, setAlsoSendToChannel] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAddContentModal, setShowAddContentModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const repliesEndRef = useRef(null);

  // Fetch thread replies
  useEffect(() => {
    const fetchThreadReplies = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${API_URL}/api/chat/messages/${parentMessage._id}/thread`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setThreadReplies(response.data.replies || []);
      } catch (error) {
        console.error('Error fetching thread replies:', error);
      } finally {
        setLoading(false);
      }
    };

    if (parentMessage) {
      fetchThreadReplies();
    }
  }, [parentMessage]);

  // Listen for new thread replies via Socket.IO
  useEffect(() => {
    if (!socket || !parentMessage) return;

    const handleThreadReply = (data) => {
      if (data.parentMessageId === parentMessage._id) {
        setThreadReplies(prev => [...prev, data.message]);
        scrollToBottom();
      }
    };

    socket.on('thread:new_reply', handleThreadReply);

    return () => {
      socket.off('thread:new_reply', handleThreadReply);
    };
  }, [socket, parentMessage]);

  // Scroll to bottom on new replies
  const scrollToBottom = () => {
    setTimeout(() => {
      repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    if (threadReplies.length > 0) {
      scrollToBottom();
    }
  }, [threadReplies]);

  // Create preview URL for selected file (if it's an image)
  useEffect(() => {
    if (selectedFile) {
      if (selectedFile.type.startsWith('image/')) {
        const url = URL.createObjectURL(selectedFile);
        setFilePreviewUrl(url);
        return () => URL.revokeObjectURL(url);
      } else {
        setFilePreviewUrl(null);
      }
    } else {
      setFilePreviewUrl(null);
    }
  }, [selectedFile]);

  const uploadFileToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');

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

  const handleSendReply = async () => {
    if (!replyContent.trim() && !selectedFile && !selectedElement && !selectedTicket) return;

    setUploadingFile(true);
    try {
      const channelId = parentMessage.channel?._id || parentMessage.channel;
      let fileData = null;

      // Upload file if selected
      if (selectedFile) {
        toast.loading('Uploading file...');
        fileData = await uploadFileToCloudinary(selectedFile);
        toast.dismiss();
        toast.success('File uploaded successfully');
      }

      // Determine message content and type
      let messageContent = replyContent.trim() || '';
      let messageType = 'text';

      // Build metadata
      const metadata = {
        parentMessageId: parentMessage._id,
        isThreadReply: true,
        alsoSendToChannel,
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
        if (!messageContent) messageContent = ' ';
      } else if (selectedTicket) {
        messageType = 'ticket';
        if (!messageContent) messageContent = ' ';
      } else if (fileData) {
        messageType = 'file';
        if (!messageContent) messageContent = fileData.originalName;
      }

      await sendMessage(channelId, messageContent, messageType, metadata);

      // Clear inputs
      setReplyContent('');
      setAlsoSendToChannel(false);
      setSelectedFile(null);
      setSelectedElement(null);
      setSelectedTicket(null);
      inputRef.current?.focus();

      // Refresh thread replies after sending
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${API_URL}/api/chat/messages/${parentMessage._id}/thread`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setThreadReplies(response.data.replies || []);
      } catch (refreshError) {
        console.error('Error refreshing thread:', refreshError);
      }
    } catch (error) {
      console.error('Error sending thread reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleKeyDown = (e) => {
    // Send message on Enter (formatting shortcuts are handled by ChatRichTextInput)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const handleEmojiSelect = (emoji) => {
    setReplyContent(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSelectElement = (element) => {
    setSelectedElement(element);
    setSelectedTicket(null);
    setShowAddContentModal(false);
  };

  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket);
    setSelectedElement(null);
    setShowAddContentModal(false);
  };

  const stripHtml = (html) => {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getAvatarColor = (userId) => {
    const colors = [
      'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
      'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    ];
    const hash = userId?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    return colors[hash % colors.length];
  };

  return (
    <div className="w-96 h-full bg-white dark:bg-[#1A1D21] border-l border-gray-200/60 dark:border-neutral-800/60 flex flex-col">
      {/* Thread Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-gray-200/60 dark:border-neutral-800/60 flex-shrink-0">
        <h2 className="text-[15px] font-bold text-gray-900 dark:text-white">
          Thread
        </h2>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-900 rounded transition-colors"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-neutral-400" />
        </button>
      </div>

      {/* Parent Message */}
      <div className="flex-shrink-0 border-b border-gray-200/60 dark:border-neutral-800/60">
        <div className="px-4 py-3">
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0 ${getAvatarColor(parentMessage.sender._id)}`}>
              {parentMessage.sender.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-[14px] text-gray-900 dark:text-neutral-50">
                  {parentMessage.sender.name}
                </span>
                <span className="text-[11px] font-medium text-gray-400 dark:text-neutral-500">
                  {formatTime(parentMessage.createdAt)}
                </span>
              </div>
              <div
                className="text-[15px] text-gray-900 dark:text-[#D1D2D3] break-words chat-message-content"
                dangerouslySetInnerHTML={{ __html: parentMessage.content }}
              />
            </div>
          </div>
        </div>
        <div className="px-4 py-2 bg-gray-50 dark:bg-neutral-900/30 border-t border-gray-200/60 dark:border-neutral-800/60">
          <div className="text-[13px] text-gray-600 dark:text-neutral-400">
            {threadReplies.length} {threadReplies.length === 1 ? 'reply' : 'replies'}
          </div>
        </div>
      </div>

      {/* Thread Replies */}
      <div className="flex-1 overflow-y-auto px-0 py-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : threadReplies.length === 0 ? (
          <div className="flex items-center justify-center py-8 px-4">
            <div className="text-center">
              <p className="text-[13px] text-gray-500 dark:text-neutral-400">
                No replies yet. Start the conversation!
              </p>
            </div>
          </div>
        ) : (
          <>
            {threadReplies.map((reply) => (
              <MessageBubble
                key={reply._id}
                message={reply}
                isGrouped={false}
                isInThread={true}
              />
            ))}
            <div ref={repliesEndRef} />
          </>
        )}
      </div>

      {/* Reply Input */}
      <div className="flex-shrink-0 border-t border-gray-200/60 dark:border-neutral-800/60">
        <div className="p-3">
          {/* Selected File Preview */}
          {selectedFile && (
            <div className="mb-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border-l-2 border-[#1164A3] rounded flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                {filePreviewUrl ? (
                  <img src={filePreviewUrl} alt="Preview" className="w-12 h-12 object-cover rounded border border-[#1164A3]/20" />
                ) : (
                  <FileIcon className="w-4 h-4 text-[#1164A3] flex-shrink-0 mt-1" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{selectedFile.name}</div>
                  <div className="text-[11px] text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</div>
                </div>
              </div>
              <button onClick={() => setSelectedFile(null)} className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          )}

          {/* Selected Element Preview */}
          {selectedElement && (
            <div className="mb-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border-l-2 border-green-500 rounded flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileText className="w-4 h-4 text-green-500" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{stripHtml(selectedElement.title) || 'Untitled'}</div>
                  <div className="text-[11px] text-gray-500 capitalize">{selectedElement.type} • {selectedElement.workspaceName}</div>
                </div>
              </div>
              <button onClick={() => setSelectedElement(null)} className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          )}

          {/* Selected Ticket Preview */}
          {selectedTicket && (
            <div className="mb-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 border-l-2 border-purple-500 rounded flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Folder className="w-4 h-4 text-purple-500" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{selectedTicket.title || 'Untitled'}</div>
                  <div className="text-[11px] text-gray-500">{selectedTicket.status} • {selectedTicket.priority}</div>
                </div>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-1 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          )}

          <div className="bg-white dark:bg-neutral-900/50 border border-gray-300 dark:border-neutral-700 rounded-lg overflow-hidden">
            <ChatRichTextInput
              ref={inputRef}
              value={replyContent}
              onChange={setReplyContent}
              onKeyDown={handleKeyDown}
              placeholder="Reply to thread..."
              className="w-full px-3 py-2 bg-transparent border-none resize-none focus:outline-none text-[15px] text-gray-900 dark:text-neutral-50 placeholder-gray-500 dark:placeholder-neutral-500"
              rows={2}
            />

            {/* Formatting Toolbar */}
            <FormattingToolbar onFormat={setReplyContent} inputRef={inputRef} />

            <div className="px-3 py-2 flex items-center justify-between border-t border-gray-200 dark:border-neutral-800">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowAddContentModal(true)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
                  title="Add element or ticket"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
                  title="Attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
                    title="Add emoji"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-2">
                      <EmojiPicker onSelectEmoji={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
                    </div>
                  )}
                </div>
                <div className="mx-2 h-4 w-px bg-gray-200 dark:bg-neutral-700" />
                <label className="flex items-center gap-1.5 text-[12px] text-gray-500 dark:text-neutral-400 cursor-pointer hover:text-gray-700 dark:hover:text-neutral-200">
                  <input
                    type="checkbox"
                    checked={alsoSendToChannel}
                    onChange={(e) => setAlsoSendToChannel(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-300 dark:border-neutral-600 text-blue-600 focus:ring-blue-500"
                  />
                  Also send to channel
                </label>
              </div>
              <button
                onClick={handleSendReply}
                disabled={(!replyContent.trim() && !selectedFile && !selectedElement && !selectedTicket) || uploadingFile}
                className="p-1.5 bg-[#007A5A] hover:bg-[#006644] disabled:bg-gray-300 dark:disabled:bg-neutral-700 disabled:cursor-not-allowed text-white rounded transition-colors"
                title="Send reply"
              >
                {uploadingFile ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
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

      {/* Add Content Modal */}
      <AddContentModal
        isOpen={showAddContentModal}
        onClose={() => setShowAddContentModal(false)}
        onSelectElement={handleSelectElement}
        onSelectTicket={handleSelectTicket}
      />
    </div>
  );
};

export default ThreadPanel;
