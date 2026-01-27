import React, { useState } from 'react';
import { Image as ImageIcon, ExternalLink } from 'lucide-react';

const ImageBlock = ({ block, content, isEditing, onUpdate }) => {
  const [error, setError] = useState(false);

  // Content structure: { url: string, alt: string, caption: string } or just string (url)
  const imageData = typeof content === 'object' && content !== null
    ? content
    : { url: content || '', alt: '', caption: '' };

  if (isEditing) {
    return (
      <div className="space-y-4 p-5 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg">
        <div>
          <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            Image URL
          </label>
          <input
            type="url"
            value={imageData.url || ''}
            onChange={(e) => {
              setError(false);
              onUpdate?.({ ...imageData, url: e.target.value });
            }}
            className="w-full px-3 py-2 text-[14px] bg-white dark:bg-neutral-800
              border border-gray-200 dark:border-neutral-700 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/image.jpg"
          />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            Alt Text
          </label>
          <input
            type="text"
            value={imageData.alt || ''}
            onChange={(e) => onUpdate?.({ ...imageData, alt: e.target.value })}
            className="w-full px-3 py-2 text-[14px] bg-white dark:bg-neutral-800
              border border-gray-200 dark:border-neutral-700 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Image description for accessibility"
          />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            Caption (optional)
          </label>
          <input
            type="text"
            value={imageData.caption || ''}
            onChange={(e) => onUpdate?.({ ...imageData, caption: e.target.value })}
            className="w-full px-3 py-2 text-[14px] bg-white dark:bg-neutral-800
              border border-gray-200 dark:border-neutral-700 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Image caption"
          />
        </div>

        {imageData.url && !error && (
          <div className="mt-3 p-3 bg-white dark:bg-neutral-800 rounded-lg">
            <img
              src={imageData.url}
              alt={imageData.alt || 'Preview'}
              className="max-h-48 rounded object-contain mx-auto"
              onError={() => setError(true)}
            />
          </div>
        )}
      </div>
    );
  }

  if (!imageData.url) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-100 dark:bg-neutral-800 rounded-lg">
        <ImageIcon size={40} className="text-gray-300 dark:text-neutral-600" />
      </div>
    );
  }

  return (
    <figure className="my-8">
      <div className="relative group">
        <img
          src={imageData.url}
          alt={imageData.alt || ''}
          className="max-w-full rounded-lg mx-auto"
          onError={() => setError(true)}
        />
        {!error && (
          <a
            href={imageData.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-lg
              opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
          >
            <ExternalLink size={16} />
          </a>
        )}
      </div>
      {imageData.caption && (
        <figcaption className="mt-3 text-center text-[14px] text-gray-500 dark:text-neutral-400">
          {imageData.caption}
        </figcaption>
      )}
      {error && (
        <div className="flex items-center justify-center h-40 bg-gray-100 dark:bg-neutral-800 rounded-lg">
          <span className="text-[14px] text-gray-500 dark:text-neutral-400">Failed to load image</span>
        </div>
      )}
    </figure>
  );
};

export default ImageBlock;
