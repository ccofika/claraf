import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { MoreVertical, Reply, Edit, Trash2, Pin, Bookmark, Smile, Download, Square, Circle, Type, ArrowRight, ClipboardList, Eye } from 'lucide-react';
import { File as FileIcon } from 'lucide-react';
import { Image as ImageIcon } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import ElementPreviewModal from './ElementPreviewModal';
import ImageViewer from './ImageViewer';
import { useNavigate } from 'react-router-dom';

const MessageBubble = ({ message, isGrouped, isInThread = false }) => {
  const { user } = useAuth();
  const { editMessage, deleteMessage, addReaction, removeReaction, pinMessage, setReplyingTo, setThreadMessage, messages } = useChat();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isHovered, setIsHovered] = useState(false);
  const [showElementPreview, setShowElementPreview] = useState(false);
  const [viewingImage, setViewingImage] = useState(null);

  const isOwnMessage = user?._id === message.sender._id;

  // Helper function to remove empty/whitespace-only HTML tags AGGRESSIVELY
  const cleanEmptyTags = (html) => {
    if (!html) return '';

    let cleaned = html;
    let previousLength;
    let iterations = 0;
    const maxIterations = 50; // Prevent infinite loops

    do {
      previousLength = cleaned.length;

      // Remove empty tags with any attributes
      cleaned = cleaned.replace(/<(\w+)(\s[^>]*)?>(\s|&nbsp;)*<\/\1>/gi, '');
      // Remove self-closing empty tags
      cleaned = cleaned.replace(/<(\w+)(\s[^>]*)?\/>/gi, '');
      // Remove tags with only whitespace/nbsp
      cleaned = cleaned.replace(/<(\w+)(\s[^>]*)?>(&nbsp;|\s)+<\/\1>/gi, '');
      // Remove multiple consecutive spaces/nbsp
      cleaned = cleaned.replace(/(&nbsp;\s*)+/g, ' ');
      cleaned = cleaned.replace(/\s{2,}/g, ' ');

      iterations++;
    } while (cleaned.length < previousLength && iterations < maxIterations);

    return cleaned.trim();
  };

  // Helper to get preview content with HTML preserved, limited to ~200 chars
  const getPreviewContent = (element) => {
    let content = '';

    switch (element.type) {
      case 'title':
        content = element.preview || element.title || '';
        break;
      case 'description':
        content = element.description || '';
        break;
      case 'macro':
        content = element.macro || '';
        break;
      case 'example':
        if (element.example && element.example.messages) {
          content = element.example.messages.map(m => m.text).join(' ');
        }
        break;
      default:
        content = element.preview || '';
    }

    if (!content) return '';

    // AGGRESSIVELY clean empty tags first - this is KEY
    content = cleanEmptyTags(content);

    // Get plain text to check length
    const tmp = document.createElement('DIV');
    tmp.innerHTML = content;
    const textContent = tmp.textContent || tmp.innerText || '';

    // If text is short enough, return the cleaned HTML
    if (textContent.length <= 200) {
      return content;
    }

    // Need to truncate - walk through HTML and count actual text characters
    let charCount = 0;
    let result = '';
    let inTag = false;
    let tagBuffer = '';

    for (let i = 0; i < content.length; i++) {
      const char = content[i];

      if (char === '<') {
        inTag = true;
        tagBuffer = '<';
      } else if (char === '>') {
        inTag = false;
        tagBuffer += '>';
        result += tagBuffer;
        tagBuffer = '';
      } else if (inTag) {
        tagBuffer += char;
      } else {
        // This is actual text content
        if (charCount < 200) {
          result += char;
          charCount++;
        } else {
          break;
        }
      }
    }

    // Close any unclosed tags
    const openTags = [];
    const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
    let match;

    while ((match = tagRegex.exec(result)) !== null) {
      if (match[0][1] !== '/') {
        // Opening tag
        if (!match[0].endsWith('/>')) {
          openTags.push(match[1]);
        }
      } else {
        // Closing tag
        const tagName = match[1];
        const idx = openTags.lastIndexOf(tagName);
        if (idx !== -1) {
          openTags.splice(idx, 1);
        }
      }
    }

    // Close remaining open tags in reverse order
    while (openTags.length > 0) {
      result += `</${openTags.pop()}>`;
    }

    return result + '...';
  };

  const getElementIcon = (type) => {
    switch (type) {
      case 'rectangle':
      case 'square':
        return <Square className="w-5 h-5" />;
      case 'circle':
      case 'ellipse':
        return <Circle className="w-5 h-5" />;
      case 'text':
        return <Type className="w-5 h-5" />;
      case 'arrow':
        return <ArrowRight className="w-5 h-5" />;
      default:
        return <Square className="w-5 h-5" />;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatRelativeTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleEdit = async () => {
    if (editContent.trim() && editContent !== message.content) {
      try {
        await editMessage(message._id, editContent);
        setIsEditing(false);
      } catch (error) {
        console.error('Failed to edit message:', error);
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await deleteMessage(message._id, message.channel);
      } catch (error) {
        console.error('Failed to delete message:', error);
      }
    }
    setShowMenu(false);
  };

  const handlePin = async () => {
    try {
      await pinMessage(message._id, message.channel);
      setShowMenu(false);
    } catch (error) {
      console.error('Failed to pin message:', error);
    }
  };

  const handleReply = () => {
    // Open thread panel instead of inline reply
    if (setThreadMessage) {
      // If this message has a threadParent (it's a "also send to channel" reply),
      // open the original thread instead
      if (message.metadata?.threadParent?.messageId) {
        // Create a minimal parent message object to open the thread
        const parentMessage = {
          _id: message.metadata.threadParent.messageId,
          content: message.metadata.threadParent.content,
          sender: message.metadata.threadParent.sender,
          channel: message.channel
        };
        setThreadMessage(parentMessage);
      } else {
        setThreadMessage(message);
      }
    } else if (setReplyingTo) {
      // Fallback to inline reply
      setReplyingTo(message);
    }
  };

  const handleReaction = async (emoji) => {
    const existingReaction = message.reactions?.find(r => r.emoji === emoji);
    const userReacted = existingReaction?.users?.some(u => u._id === user._id);

    if (userReacted) {
      await removeReaction(message._id, emoji);
    } else {
      await addReaction(message._id, emoji);
    }
    setShowEmojiPicker(false);
  };

  const quickReactions = ['❤️', '😂', '👍', '🎉', '😮', '😢'];

  // Generate soft avatar color based on user ID
  const getAvatarColor = (userId) => {
    const colors = [
      'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
      'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
      'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    ];
    const hash = userId?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    return colors[hash % colors.length];
  };

  // Keyboard shortcuts when message is hovered
  React.useEffect(() => {
    if (!isHovered || isEditing) return;

    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'e': // Edit (only own messages)
          if (isOwnMessage && message.type === 'text') {
            e.preventDefault();
            setIsEditing(true);
            setEditContent(message.content);
          }
          break;
        case 'r': // React
          e.preventDefault();
          setShowEmojiPicker(true);
          break;
        case 't': // Open thread
          e.preventDefault();
          handleReply();
          break;
        case 'p': // Pin/Unpin
          e.preventDefault();
          handlePin();
          break;
        case 'delete': // Delete (only own messages)
        case 'backspace': // Also support backspace for delete
          if (isOwnMessage && e.key.toLowerCase() === 'delete') {
            e.preventDefault();
            handleDelete();
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isHovered, isEditing, isOwnMessage, message]);

  return (
    <div
      className={`group relative px-4 ${isGrouped ? 'py-0.5' : 'py-2'} hover:bg-gray-50 dark:hover:bg-[#1A1D21] transition-colors duration-100`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowMenu(false);
        setShowEmojiPicker(false);
      }}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        {!isGrouped && (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0 shadow-md ${getAvatarColor(message.sender._id)}`}>
            {message.sender.name?.charAt(0).toUpperCase()}
          </div>
        )}
        {isGrouped && <div className="w-8 flex-shrink-0" />}

        <div className="flex-1 min-w-0">
          {/* Message Header */}
          {!isGrouped && (
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-[14px] text-gray-900 dark:text-neutral-50">
                {message.sender.name}
              </span>
              <span className="text-[11px] font-medium text-gray-400 dark:text-neutral-500">
                {formatTime(message.createdAt)}
              </span>
              {message.isEdited && (
                <span className="text-[12px] text-gray-400 dark:text-neutral-600 italic font-light">
                  (edited)
                </span>
              )}
              {message.isPinned && (
                <span className="flex items-center gap-1 text-[12px] text-blue-600 dark:text-blue-400">
                  <Pin className="w-3 h-3" />
                  Pinned
                </span>
              )}
            </div>
          )}

          {/* Message Content */}
          {isEditing ? (
            <div className="bg-gray-100 dark:bg-neutral-900 rounded-lg p-3 border border-gray-200 dark:border-neutral-800">
              <input
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEdit();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
                className="w-full bg-transparent border-none focus:outline-none text-sm text-gray-900 dark:text-neutral-50"
                autoFocus
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handleEdit}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-gray-600 dark:text-neutral-400 text-xs hover:bg-gray-200 dark:hover:bg-neutral-800 rounded-lg"
                >
                  Cancel
                </button>
                <span className="text-xs text-gray-500 dark:text-neutral-500">
                  escape to cancel • enter to save
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Message Content - NO BUBBLE (Slack style) */}
              <div className="max-w-full">
                <div className="transition-all duration-100">
                  {/* Thread Reply Indicator (for "also send to channel" messages) - hide when viewing in thread panel */}
                  {message.metadata?.threadParent && !isInThread && (() => {
                    // Find parent message to calculate newer replies
                    const parentMsg = messages.find(m => m._id === message.metadata.threadParent.messageId);
                    const myPosition = message.metadata.threadParent.replyPosition || 0;
                    const totalReplies = parentMsg?.replyCount || myPosition;
                    const newerReplies = totalReplies - myPosition;

                    return (
                      <div className="mb-2">
                        <button
                          onClick={handleReply}
                          className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 dark:bg-neutral-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors group/thread-link"
                        >
                          <div className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-gray-500 dark:text-neutral-400" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M2.5 2a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-1 0v-11a.5.5 0 0 1 .5-.5zm2 2a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zm11 .5a.5.5 0 0 0-1 0v7a.5.5 0 0 0 1 0v-7zm-10-2a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5zm0 11a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z"/>
                            </svg>
                            <span className="text-[12px] text-gray-600 dark:text-neutral-400">
                              Replied to a thread
                            </span>
                          </div>
                          <span className="text-[12px] text-[#1264A3] dark:text-blue-400 font-medium group-hover/thread-link:underline truncate max-w-[200px]">
                            {message.metadata.threadParent.content}
                          </span>
                        </button>

                        {/* View newer replies button */}
                        {newerReplies > 0 && (
                          <button
                            onClick={handleReply}
                            className="flex items-center gap-1.5 mt-1 px-2 py-1 text-[12px] text-[#1264A3] dark:text-blue-400 font-medium hover:underline"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                            View {newerReplies} newer {newerReplies === 1 ? 'reply' : 'replies'}
                          </button>
                        )}
                      </div>
                    );
                  })()}

                  {/* Reply Preview (if replying to another message - non-thread quote) */}
                  {message.metadata?.replyTo && !message.metadata?.threadParent && (
                    <div className={`pb-2.5 mb-2.5 border-l-2 pl-3 ${
                      isOwnMessage
                        ? 'border-blue-300 dark:border-blue-600'
                        : 'border-gray-300 dark:border-neutral-600'
                    }`}>
                      <div className={`text-[12px] font-medium ${
                        isOwnMessage
                          ? 'text-blue-700 dark:text-blue-400'
                          : 'text-gray-600 dark:text-neutral-400'
                      }`}>
                        Replying to {message.metadata.replyTo.sender?.name || 'Unknown'}
                      </div>
                      <div className={`text-[12px] opacity-70 truncate ${
                        isOwnMessage ? 'text-gray-700 dark:text-neutral-300' : 'text-gray-600 dark:text-neutral-400'
                      }`}>
                        {message.metadata.replyTo.content || 'Message'}
                      </div>
                    </div>
                  )}

                  {/* Message Content */}
                  <div
                    className="text-[15px] leading-[1.47] break-words text-gray-900 dark:text-[#D1D2D3] max-w-none chat-message-content"
                    dangerouslySetInnerHTML={{ __html: message.content }}
                  />

                  {/* File Attachments */}
                  {message.metadata?.files && message.metadata.files.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.metadata.files.map((file, index) => (
                        <div key={index}>
                          {file.type?.startsWith('image/') ? (
                            <button
                              onClick={() => setViewingImage({ url: file.url, name: file.name })}
                              className="block w-[200px] rounded border border-gray-200 dark:border-neutral-700 hover:border-[#1164A3] dark:hover:border-[#1164A3] transition-all overflow-hidden cursor-pointer group"
                            >
                              <div className="relative h-[120px] overflow-hidden">
                                <img
                                  src={file.url}
                                  alt={file.name}
                                  className="w-full h-full object-cover"
                                />
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                                    <span className="text-white text-[11px] font-medium flex items-center gap-1">
                                      <ImageIcon className="w-3 h-3" />
                                      View
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="px-2.5 py-1.5 bg-gray-50 dark:bg-neutral-900/50 border-t border-gray-200 dark:border-neutral-700">
                                <div className="text-[12px] text-gray-900 dark:text-neutral-300 truncate">
                                  {file.name}
                                </div>
                                <div className="text-[10px] text-gray-500 dark:text-neutral-500">
                                  {(file.size / 1024).toFixed(2)} KB
                                </div>
                              </div>
                            </button>
                          ) : (
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={file.name}
                              className="flex items-center gap-3 max-w-sm px-3 py-2 border border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-900/30 transition-colors"
                            >
                              <FileIcon className="w-8 h-8 text-gray-400 dark:text-neutral-500 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-[13px] text-gray-900 dark:text-neutral-300 truncate font-medium">
                                  {file.name}
                                </div>
                                <div className="text-[11px] text-gray-500 dark:text-neutral-500">
                                  {(file.size / 1024).toFixed(2)} KB
                                </div>
                              </div>
                              <Download className="w-4 h-4 text-gray-400 dark:text-neutral-500 flex-shrink-0" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Workspace Element */}
                  {message.metadata?.element && message.metadata.element.elementId && (
                    <div className="mt-2" style={{ maxWidth: '60%' }}>
                      <div className="w-full border-l-4 border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20 overflow-hidden rounded-lg">
                        <div className="flex items-start gap-3 px-4 py-3">
                          <div className="flex-shrink-0 p-2 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-lg">
                            {getElementIcon(message.metadata.element.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1">
                              {message.metadata.element.type} Element
                            </div>
                            <div
                              className="text-[15px] font-semibold text-gray-900 dark:text-neutral-50 mb-1"
                              dangerouslySetInnerHTML={{ __html: message.metadata.element.title || 'Untitled Element' }}
                            />
                            <div className="text-[13px] text-gray-600 dark:text-neutral-400 mb-2">
                              From: {message.metadata.element.workspaceName || 'Unknown Workspace'}
                            </div>
                            {getPreviewContent(message.metadata.element) && (
                              <div
                                className="text-[13px] text-gray-700 dark:text-neutral-300 mt-2 overflow-hidden break-words"
                                style={{
                                  maxHeight: '4.5em',
                                  lineHeight: '1.5em'
                                }}
                                dangerouslySetInnerHTML={{ __html: getPreviewContent(message.metadata.element) }}
                              />
                            )}
                          </div>
                        </div>
                        {/* Action buttons */}
                        <div className="flex items-center border-t border-purple-200 dark:border-purple-800/50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowElementPreview(true);
                            }}
                            className="flex-1 px-4 py-2.5 text-[13px] font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors flex items-center justify-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Preview
                          </button>
                          <div className="w-px h-8 bg-purple-200 dark:bg-purple-800/50" />
                          <button
                            onClick={() => {
                              const baseUrl = `/workspace/${message.metadata.element.workspaceId}?element=${message.metadata.element.elementId}`;
                              // Add exampleIndex to URL if this is an example element and index is available
                              const url = message.metadata.element.type === 'example' &&
                                          message.metadata.element.exampleIndex !== null &&
                                          message.metadata.element.exampleIndex !== undefined
                                ? `${baseUrl}&exampleIndex=${message.metadata.element.exampleIndex}`
                                : baseUrl;
                              navigate(url);
                            }}
                            className="flex-1 px-4 py-2.5 text-[13px] font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors flex items-center justify-center gap-2"
                          >
                            <ArrowRight className="w-4 h-4" />
                            Open in Workspace
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* QA Ticket */}
                  {message.metadata?.ticket && (
                    <div className="mt-2">
                      <button
                        onClick={() => navigate('/qa-manager')}
                        className="flex items-start gap-3 w-full max-w-md px-4 py-3 border-l-4 border-orange-500 dark:border-orange-400 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors text-left"
                      >
                        <div className="flex-shrink-0 p-2 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400">
                          <ClipboardList className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide mb-1">
                            QA Ticket
                          </div>
                          <div className="text-[15px] font-semibold text-gray-900 dark:text-neutral-50 mb-1">
                            {message.metadata.ticket.title || 'Untitled Ticket'}
                          </div>
                          <div className="flex items-center gap-2 text-[13px] text-gray-600 dark:text-neutral-400">
                            <span className={`px-2 py-0.5 text-[11px] font-medium ${
                              message.metadata.ticket.status === 'open' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              message.metadata.ticket.status === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                              'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                            }`}>
                              {message.metadata.ticket.status}
                            </span>
                            <span>•</span>
                            <span>{message.metadata.ticket.priority} priority</span>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 dark:text-neutral-500 flex-shrink-0 mt-1" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {message.reactions.map((reaction) => {
                const userReacted = reaction.users?.some(u => u._id === user._id);
                const count = reaction.users?.length || 0;

                return (
                  <button
                    key={reaction.emoji}
                    onClick={() => handleReaction(reaction.emoji)}
                    className={`px-2.5 py-1 rounded-full text-[13px] flex items-center gap-1.5 transition-all duration-150 hover:scale-105 ${
                      userReacted
                        ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 shadow-sm'
                        : 'bg-white dark:bg-neutral-900/50 border border-gray-200 dark:border-neutral-800/50 hover:bg-gray-50 dark:hover:bg-neutral-800/50 hover:shadow-sm'
                    }`}
                  >
                    <span className="text-base">{reaction.emoji}</span>
                    <span className={`font-medium text-[12px] ${
                      userReacted ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-neutral-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Thread Reply Count */}
          {message.replyCount > 0 && (
            <button
              onClick={handleReply}
              className="flex items-center gap-2 mt-2.5 px-2.5 py-2 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-all group/thread"
            >
              {/* Thread participants avatars */}
              <div className="flex -space-x-1.5">
                {(message.threadParticipants || []).slice(0, 3).map((participant, idx) => (
                  <div
                    key={participant._id || idx}
                    className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold border-2 border-white dark:border-[#1A1D21] ${getAvatarColor(participant._id)}`}
                  >
                    {participant.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                ))}
                {(message.threadParticipants?.length || 0) > 3 && (
                  <div className="w-6 h-6 rounded bg-gray-200 dark:bg-neutral-700 flex items-center justify-center text-[9px] font-bold text-gray-600 dark:text-neutral-400 border-2 border-white dark:border-[#1A1D21]">
                    +{message.threadParticipants.length - 3}
                  </div>
                )}
              </div>

              {/* Reply count and view thread */}
              <div className="flex flex-col items-start">
                <span className="text-[13px] font-semibold text-[#1264A3] dark:text-blue-400 group-hover/thread:underline">
                  {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
                </span>
                {message.lastReplyAt && (
                  <span className="text-[11px] text-gray-500 dark:text-neutral-500">
                    Last reply {formatRelativeTime(message.lastReplyAt)}
                  </span>
                )}
              </div>

              {/* View thread arrow */}
              <div className="ml-auto opacity-0 group-hover/thread:opacity-100 transition-opacity flex items-center gap-1 text-[12px] text-gray-500 dark:text-neutral-400">
                <span>View thread</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Hover Actions - Positioned to not shift content */}
      {isHovered && !isEditing && (
        <div className="absolute top-[-8px] right-4 bg-white dark:bg-[#2B2D31] border border-gray-200/70 dark:border-neutral-700/70 rounded-lg shadow-xl flex items-center gap-1 p-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {/* Quick Reactions */}
          <div className="flex items-center gap-0.5 px-1 border-r border-gray-200/50 dark:border-neutral-700/50">
            {quickReactions.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition-all duration-100 text-base hover:scale-110 active:scale-95"
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* More Emoji */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition-all duration-100 active:scale-95"
            title="More reactions"
          >
            <Smile className="w-[18px] h-[18px] text-gray-600 dark:text-neutral-300" />
          </button>

          {/* Reply */}
          <button
            onClick={handleReply}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition-all duration-100 active:scale-95"
            title="Reply"
          >
            <Reply className="w-[18px] h-[18px] text-gray-600 dark:text-neutral-300" />
          </button>

          {/* Edit (own messages only) */}
          {isOwnMessage && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition-all duration-100 active:scale-95"
              title="Edit message"
            >
              <Edit className="w-[18px] h-[18px] text-gray-600 dark:text-neutral-300" />
            </button>
          )}

          {/* More Options */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition-all duration-100 active:scale-95"
              title="More options"
            >
              <MoreVertical className="w-[18px] h-[18px] text-gray-600 dark:text-neutral-300" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-xl py-1 z-20">
                <button
                  onClick={handlePin}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                >
                  <Pin className="w-4 h-4" />
                  {message.isPinned ? 'Unpin message' : 'Pin message'}
                </button>
                <button className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 flex items-center gap-2">
                  <Bookmark className="w-4 h-4" />
                  Bookmark
                </button>
                {isOwnMessage && (
                  <button
                    onClick={handleDelete}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute top-0 right-0 z-20">
          <EmojiPicker onSelectEmoji={handleReaction} onClose={() => setShowEmojiPicker(false)} />
        </div>
      )}

      {/* Element Preview Modal */}
      {showElementPreview && message.metadata?.element && (
        <ElementPreviewModal
          isOpen={showElementPreview}
          onClose={() => setShowElementPreview(false)}
          element={message.metadata.element}
        />
      )}

      {/* Image Viewer Modal */}
      {viewingImage && (
        <ImageViewer
          imageUrl={viewingImage.url}
          imageName={viewingImage.name}
          onClose={() => setViewingImage(null)}
        />
      )}
    </div>
  );
};

export default MessageBubble;
