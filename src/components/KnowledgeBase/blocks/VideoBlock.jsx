import React, { useState, useMemo } from 'react';
import { Play, ExternalLink } from 'lucide-react';

const VideoBlock = ({ block, content, isEditing, onUpdate }) => {
  const [error, setError] = useState(false);

  // Content structure: { url: string, caption: string }
  const videoData = typeof content === 'object' && content !== null
    ? content
    : { url: content || '', caption: '' };

  // Parse video URL to get embed URL
  const embedData = useMemo(() => {
    const url = videoData.url || '';

    // YouTube
    const youtubeMatch = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (youtubeMatch) {
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
        videoId: youtubeMatch[1]
      };
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) {
      return {
        type: 'vimeo',
        embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
        videoId: vimeoMatch[1]
      };
    }

    // Direct video URL
    if (url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)) {
      return {
        type: 'direct',
        embedUrl: url
      };
    }

    // Loom
    const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
    if (loomMatch) {
      return {
        type: 'loom',
        embedUrl: `https://www.loom.com/embed/${loomMatch[1]}`,
        videoId: loomMatch[1]
      };
    }

    return { type: 'unknown', embedUrl: url };
  }, [videoData.url]);

  if (isEditing) {
    return (
      <div className="space-y-4 p-5 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg">
        <div>
          <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            Video URL
          </label>
          <input
            type="url"
            value={videoData.url || ''}
            onChange={(e) => {
              setError(false);
              onUpdate?.({ ...videoData, url: e.target.value });
            }}
            className="w-full px-3 py-2 text-[14px] bg-white dark:bg-neutral-800
              border border-gray-200 dark:border-neutral-700 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
          />
          <p className="mt-1.5 text-[12px] text-gray-400 dark:text-neutral-500">
            Supports YouTube, Vimeo, Loom, or direct video URLs (.mp4, .webm)
          </p>
        </div>
        <div>
          <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            Caption (optional)
          </label>
          <input
            type="text"
            value={videoData.caption || ''}
            onChange={(e) => onUpdate?.({ ...videoData, caption: e.target.value })}
            className="w-full px-3 py-2 text-[14px] bg-white dark:bg-neutral-800
              border border-gray-200 dark:border-neutral-700 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Video caption"
          />
        </div>

        {videoData.url && embedData.type !== 'unknown' && (
          <div className="mt-3 p-3 bg-white dark:bg-neutral-800 rounded-lg">
            <p className="text-[12px] text-gray-500 dark:text-neutral-400 mb-2">
              Preview ({embedData.type})
            </p>
            <div className="aspect-video rounded overflow-hidden bg-black">
              {embedData.type === 'direct' ? (
                <video
                  src={embedData.embedUrl}
                  className="w-full h-full object-contain"
                  controls
                  onError={() => setError(true)}
                />
              ) : (
                <iframe
                  src={embedData.embedUrl}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!videoData.url) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-100 dark:bg-neutral-800 rounded-lg">
        <div className="text-center">
          <Play size={40} className="mx-auto text-gray-300 dark:text-neutral-600 mb-2" />
          <span className="text-[14px] text-gray-400 dark:text-neutral-500">No video URL</span>
        </div>
      </div>
    );
  }

  if (embedData.type === 'unknown') {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-100 dark:bg-neutral-800 rounded-lg">
        <div className="text-center">
          <Play size={40} className="mx-auto text-gray-300 dark:text-neutral-600 mb-2" />
          <span className="text-[14px] text-gray-400 dark:text-neutral-500">Unsupported video URL</span>
        </div>
      </div>
    );
  }

  return (
    <figure>
      <div className="relative group aspect-video rounded-lg overflow-hidden bg-black">
        {embedData.type === 'direct' ? (
          <video
            src={embedData.embedUrl}
            className="w-full h-full object-contain"
            controls
            onError={() => setError(true)}
          />
        ) : (
          <iframe
            src={embedData.embedUrl}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        )}
        <a
          href={videoData.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-lg
            opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
        >
          <ExternalLink size={16} />
        </a>
      </div>
      {videoData.caption && (
        <figcaption className="mt-2.5 text-center text-[13px] text-gray-400 dark:text-neutral-500">
          {videoData.caption}
        </figcaption>
      )}
      {error && (
        <div className="flex items-center justify-center h-48 bg-gray-100 dark:bg-neutral-800 rounded-lg mt-2">
          <span className="text-[14px] text-gray-500 dark:text-neutral-400">Failed to load video</span>
        </div>
      )}
    </figure>
  );
};

export default VideoBlock;
