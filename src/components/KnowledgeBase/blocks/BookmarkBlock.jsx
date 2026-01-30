import React, { useState, useEffect } from 'react';
import { Link, ExternalLink, Globe, Image as ImageIcon } from 'lucide-react';

const BookmarkBlock = ({ block, content, isEditing, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Content structure: { url: string, title: string, description: string, image: string, favicon: string }
  const bookmarkData = typeof content === 'object' && content !== null
    ? content
    : { url: content || '', title: '', description: '', image: '', favicon: '' };

  // Function to extract domain from URL
  const getDomain = (url) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return '';
    }
  };

  // Get favicon URL
  const getFaviconUrl = (url) => {
    try {
      const domain = new URL(url).origin;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-4 p-5 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg">
        <div>
          <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            URL
          </label>
          <input
            type="url"
            value={bookmarkData.url || ''}
            onChange={(e) => {
              setError(false);
              onUpdate?.({ ...bookmarkData, url: e.target.value });
            }}
            className="w-full px-3 py-2 text-[14px] bg-white dark:bg-neutral-800
              border border-gray-200 dark:border-neutral-700 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/article"
          />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            Title
          </label>
          <input
            type="text"
            value={bookmarkData.title || ''}
            onChange={(e) => onUpdate?.({ ...bookmarkData, title: e.target.value })}
            className="w-full px-3 py-2 text-[14px] bg-white dark:bg-neutral-800
              border border-gray-200 dark:border-neutral-700 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Link title"
          />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            Description (optional)
          </label>
          <textarea
            value={bookmarkData.description || ''}
            onChange={(e) => onUpdate?.({ ...bookmarkData, description: e.target.value })}
            className="w-full px-3 py-2 text-[14px] bg-white dark:bg-neutral-800
              border border-gray-200 dark:border-neutral-700 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
            placeholder="Brief description of the link"
          />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            Image URL (optional)
          </label>
          <input
            type="url"
            value={bookmarkData.image || ''}
            onChange={(e) => onUpdate?.({ ...bookmarkData, image: e.target.value })}
            className="w-full px-3 py-2 text-[14px] bg-white dark:bg-neutral-800
              border border-gray-200 dark:border-neutral-700 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/preview-image.jpg"
          />
        </div>

        {bookmarkData.url && (
          <div className="mt-3 p-3 bg-white dark:bg-neutral-800 rounded-lg">
            <p className="text-[12px] text-gray-500 dark:text-neutral-400 mb-2">Preview</p>
            <BookmarkPreview data={bookmarkData} />
          </div>
        )}
      </div>
    );
  }

  if (!bookmarkData.url) {
    return (
      <div className="flex items-center justify-center h-24 bg-gray-100 dark:bg-neutral-800 rounded-lg">
        <div className="text-center">
          <Link size={32} className="mx-auto text-gray-300 dark:text-neutral-600 mb-2" />
          <span className="text-[14px] text-gray-400 dark:text-neutral-500">No bookmark URL</span>
        </div>
      </div>
    );
  }

  return <BookmarkPreview data={bookmarkData} />;
};

// Separate preview component for reuse
const BookmarkPreview = ({ data }) => {
  const [imageError, setImageError] = useState(false);

  const getDomain = (url) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return '';
    }
  };

  const getFaviconUrl = (url) => {
    try {
      const domain = new URL(url).origin;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex border border-gray-200 dark:border-neutral-700 rounded-lg overflow-hidden
        hover:border-gray-300 dark:hover:border-neutral-600 hover:shadow-md transition-all my-4"
    >
      {/* Content */}
      <div className="flex-1 p-4 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[15px] font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {data.title || getDomain(data.url) || 'Untitled'}
          </h3>
          <ExternalLink size={14} className="flex-shrink-0 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
        </div>
        {data.description && (
          <p className="mt-1 text-[13px] text-gray-500 dark:text-neutral-400 line-clamp-2">
            {data.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-3">
          {getFaviconUrl(data.url) && (
            <img
              src={getFaviconUrl(data.url)}
              alt=""
              className="w-4 h-4"
              onError={(e) => e.target.style.display = 'none'}
            />
          )}
          <span className="text-[12px] text-gray-400 dark:text-neutral-500 truncate">
            {getDomain(data.url)}
          </span>
        </div>
      </div>

      {/* Image */}
      {data.image && !imageError && (
        <div className="hidden sm:block w-48 flex-shrink-0 bg-gray-100 dark:bg-neutral-800">
          <img
            src={data.image}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      )}
    </a>
  );
};

export default BookmarkBlock;
