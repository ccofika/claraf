import React, { useState } from 'react';
import {
  FileText,
  AlignLeft,
  Box,
  Lightbulb,
  Type,
  CreditCard,
  StickyNote,
  Package,
  Image as ImageIcon,
  Link as LinkIcon,
  ExternalLink,
  Bookmark,
  BookmarkPlus,
  Copy,
  Share2,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const ResultCard = ({ result, isSelected, onClick, workspaceName, onBookmark }) => {
  const [copied, setCopied] = useState(false);

  // Get copyable content from element
  const getCopyableContent = (element) => {
    // For macro - copy only description, not title
    if (element.type === 'macro') {
      return stripHtml(element.content?.description || '');
    }

    // For title and description - copy the main content
    if (element.type === 'title' || element.type === 'description') {
      return stripHtml(element.content?.value || '');
    }

    // For example - copy the current example's text
    if (element.type === 'example') {
      const currentExample = element.content?.examples?.[element.content?.currentExampleIndex || 0];
      return stripHtml(currentExample?.text || '');
    }

    // For other types (text, subtext, card, sticky-note, etc.)
    return stripHtml(element.content?.text || element.content?.title || element.content?.value || '');
  };

  // Handle copy content
  const handleCopyContent = async (e) => {
    e.stopPropagation();

    const content = getCopyableContent(result);

    if (!content || content.trim().length === 0) {
      toast.info('No content to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Content copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy content');
      console.error('Copy failed:', error);
    }
  };

  // Handle share
  const handleShare = async (e) => {
    e.stopPropagation();
    const link = `${window.location.origin}/workspace/${result.workspaceId}?element=${result._id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Element: ${getElementTypeLabel(result.type)}`,
          url: link
        });
        toast.success('Shared successfully!');
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    } else {
      // Fallback to copy link
      try {
        await navigator.clipboard.writeText(link);
        toast.success('Link copied to clipboard!');
      } catch (error) {
        toast.error('Failed to copy link');
      }
    }
  };

  // Handle bookmark
  const handleBookmark = async (e) => {
    e.stopPropagation();

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/bookmarks`,
        {
          elementId: result._id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Bookmark saved!');

      // Call the callback to update bookmarks list
      if (onBookmark) {
        onBookmark(response.data);
      }
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error('Bookmark already exists');
      } else {
        toast.error('Failed to save bookmark');
      }
      console.error('Bookmark failed:', error);
    }
  };

  // Get icon for element type
  const getTypeIcon = (type) => {
    const icons = {
      title: FileText,
      description: AlignLeft,
      macro: Box,
      example: Lightbulb,
      text: Type,
      card: CreditCard,
      'sticky-note': StickyNote,
      wrapper: Package,
      image: ImageIcon,
      link: LinkIcon
    };
    return icons[type] || FileText;
  };

  const getElementTypeLabel = (type) => {
    const labels = {
      title: 'Title',
      description: 'Description',
      macro: 'Macro',
      example: 'Example',
      text: 'Text',
      card: 'Card',
      'sticky-note': 'Note',
      wrapper: 'Wrapper',
      image: 'Image',
      link: 'Link'
    };
    return labels[type] || type;
  };

  const getElementPreview = (element) => {
    if (element.type === 'title' || element.type === 'description') {
      return element.content?.value || 'No content';
    }
    if (element.type === 'macro') {
      return element.content?.title || element.content?.description || 'No content';
    }
    if (element.type === 'example') {
      const currentExample = element.content?.examples?.[element.content?.currentExampleIndex || 0];
      return currentExample?.title || 'No content';
    }
    return element.content?.text || element.content?.title || 'No content';
  };

  const stripHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Highlight matched text (basic implementation)
  const highlightMatch = (text, query) => {
    if (!query) return text;
    // This is a simple version - can be enhanced with proper text highlighting
    return text;
  };

  const TypeIcon = getTypeIcon(result.type);

  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-2 text-left transition-all duration-150 border-b border-gray-100 dark:border-neutral-800 last:border-b-0 group ${
        isSelected
          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
          : 'hover:bg-gray-50 dark:hover:bg-neutral-800/50 border-l-4 border-l-transparent'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${
          isSelected
            ? 'bg-blue-100 dark:bg-blue-900/40'
            : 'bg-gray-100 dark:bg-neutral-800 group-hover:bg-gray-200 dark:group-hover:bg-neutral-700'
        }`}>
          <TypeIcon size={16} className={`${
            isSelected
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-neutral-400'
          }`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header with Type & Workspace */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md ${
              isSelected
                ? 'bg-blue-200 dark:bg-blue-800/50 text-blue-800 dark:text-blue-200'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            }`}>
              {getElementTypeLabel(result.type)}
            </span>

            {workspaceName && (
              <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md ${
                isSelected
                  ? 'bg-purple-200 dark:bg-purple-800/50 text-purple-800 dark:text-purple-200'
                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
              }`}>
                {workspaceName}
              </span>
            )}
          </div>

          {/* Preview Text */}
          <div className="text-sm text-gray-900 dark:text-white font-medium line-clamp-2 mb-1">
            {stripHtml(getElementPreview(result))}
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-neutral-400">
            <span>
              {new Date(result.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>

            {result.updatedAt && result.updatedAt !== result.createdAt && (
              <>
                <span>•</span>
                <span>
                  Updated {new Date(result.updatedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Quick Actions (shown on hover/select) */}
        <div className={`flex items-center gap-1 shrink-0 transition-opacity ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          {/* Copy Content */}
          <button
            onClick={handleCopyContent}
            className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
            title="Copy content"
          >
            {copied ? (
              <Check size={14} className="text-green-600 dark:text-green-400" />
            ) : (
              <Copy size={14} className="text-gray-600 dark:text-neutral-400" />
            )}
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
            title="Share"
          >
            <Share2 size={14} className="text-gray-600 dark:text-neutral-400" />
          </button>

          {/* Bookmark */}
          {onBookmark && (
            <button
              onClick={handleBookmark}
              className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
              title="Add to bookmarks"
            >
              <BookmarkPlus size={14} className="text-gray-600 dark:text-neutral-400" />
            </button>
          )}

          {/* Relevance Score */}
          {result.score && (
            <div className="ml-1 text-xs font-medium text-blue-600 dark:text-blue-400">
              {Math.round(result.score * 100)}%
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

export default ResultCard;
