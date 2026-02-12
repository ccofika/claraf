import React, { useState } from 'react';
import { Code, ExternalLink, AlertTriangle } from 'lucide-react';

const EmbedBlock = ({ block, content, isEditing, onUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Content structure: { url: string, height: number, caption: string }
  const embedData = typeof content === 'object' && content !== null
    ? content
    : { url: content || '', height: 400, caption: '' };

  // Check if URL is from a known safe embed source
  const getSafeEmbedUrl = (url) => {
    if (!url) return null;

    // Known embed-friendly services
    const embedPatterns = [
      // Figma
      { pattern: /figma\.com/, transform: (u) => u.replace('figma.com/file', 'figma.com/embed?embed_host=share&url=' + encodeURIComponent(u)) },
      // Google Docs/Sheets/Slides
      { pattern: /docs\.google\.com/, transform: (u) => u.includes('/pub') ? u : u.replace('/edit', '/preview') },
      // CodePen
      { pattern: /codepen\.io\/([^\/]+)\/pen\/([^\/]+)/, transform: (u) => u.replace('/pen/', '/embed/') },
      // CodeSandbox
      { pattern: /codesandbox\.io\/s\//, transform: (u) => u.replace('codesandbox.io/s/', 'codesandbox.io/embed/') },
      // Spotify
      { pattern: /open\.spotify\.com/, transform: (u) => u.replace('open.spotify.com', 'open.spotify.com/embed') },
      // Miro
      { pattern: /miro\.com\/app\/board/, transform: (u) => u.replace('/app/board/', '/app/embed/') },
      // Airtable
      { pattern: /airtable\.com/, transform: (u) => u.includes('/embed/') ? u : u + '?embed=true' },
      // Typeform
      { pattern: /typeform\.com/, transform: (u) => u },
      // Generic (keep as-is)
      { pattern: /.*/, transform: (u) => u }
    ];

    for (const { pattern, transform } of embedPatterns) {
      if (pattern.test(url)) {
        return transform(url);
      }
    }

    return url;
  };

  const embedUrl = getSafeEmbedUrl(embedData.url);

  if (isEditing) {
    return (
      <div className="space-y-4 p-5 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg">
        <div>
          <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            Embed URL
          </label>
          <input
            type="url"
            value={embedData.url || ''}
            onChange={(e) => {
              setError(false);
              setLoading(true);
              onUpdate?.({ ...embedData, url: e.target.value });
            }}
            className="w-full px-3 py-2 text-[14px] bg-white dark:bg-neutral-800
              border border-gray-200 dark:border-neutral-700 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://..."
          />
          <p className="mt-1.5 text-[12px] text-gray-400 dark:text-neutral-500">
            Supports Figma, Google Docs, CodePen, CodeSandbox, Spotify, Miro, Typeform, and more
          </p>
        </div>
        <div>
          <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            Height (px)
          </label>
          <input
            type="number"
            value={embedData.height || 400}
            onChange={(e) => onUpdate?.({ ...embedData, height: parseInt(e.target.value) || 400 })}
            className="w-32 px-3 py-2 text-[14px] bg-white dark:bg-neutral-800
              border border-gray-200 dark:border-neutral-700 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="100"
            max="1000"
          />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            Caption (optional)
          </label>
          <input
            type="text"
            value={embedData.caption || ''}
            onChange={(e) => onUpdate?.({ ...embedData, caption: e.target.value })}
            className="w-full px-3 py-2 text-[14px] bg-white dark:bg-neutral-800
              border border-gray-200 dark:border-neutral-700 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Embed caption"
          />
        </div>

        {embedData.url && (
          <div className="mt-3 p-3 bg-white dark:bg-neutral-800 rounded-lg">
            <p className="text-[12px] text-gray-500 dark:text-neutral-400 mb-2">Preview</p>
            <div
              className="rounded overflow-hidden border border-gray-200 dark:border-neutral-700"
              style={{ height: Math.min(embedData.height || 400, 300) }}
            >
              <iframe
                src={embedUrl}
                className="w-full h-full"
                onLoad={() => setLoading(false)}
                onError={() => setError(true)}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!embedData.url) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-100 dark:bg-neutral-800 rounded-lg">
        <div className="text-center">
          <Code size={40} className="mx-auto text-gray-300 dark:text-neutral-600 mb-2" />
          <span className="text-[14px] text-gray-400 dark:text-neutral-500">No embed URL</span>
        </div>
      </div>
    );
  }

  return (
    <figure>
      <div className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-neutral-700">
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-neutral-800">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-neutral-800">
            <div className="text-center">
              <AlertTriangle size={32} className="mx-auto text-amber-500 mb-2" />
              <span className="text-[14px] text-gray-500 dark:text-neutral-400">Failed to load embed</span>
            </div>
          </div>
        )}
        <iframe
          src={embedUrl}
          className="w-full"
          style={{ height: embedData.height || 400 }}
          onLoad={() => setLoading(false)}
          onError={() => setError(true)}
          allowFullScreen
        />
        <a
          href={embedData.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-lg
            opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
        >
          <ExternalLink size={16} />
        </a>
      </div>
      {embedData.caption && (
        <figcaption className="mt-2.5 text-center text-[13px] text-gray-400 dark:text-neutral-500">
          {embedData.caption}
        </figcaption>
      )}
    </figure>
  );
};

export default EmbedBlock;
