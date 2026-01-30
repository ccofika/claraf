import React, { useState, useRef } from 'react';
import { Music, Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';

const AudioBlock = ({ block, content, isEditing, onUpdate }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);
  const audioRef = useRef(null);

  const audioData = typeof content === 'object' && content !== null
    ? content
    : { url: content || '', title: '', caption: '' };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    audioRef.current.currentTime = percentage * duration;
  };

  if (isEditing) {
    return (
      <div className="space-y-4 p-5 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg">
        <div>
          <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            Audio URL
          </label>
          <input
            type="url"
            value={audioData.url || ''}
            onChange={(e) => {
              setError(false);
              onUpdate?.({ ...audioData, url: e.target.value });
            }}
            className="w-full px-3 py-2 text-[14px] bg-white dark:bg-neutral-800
              border border-gray-200 dark:border-neutral-700 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/audio.mp3"
          />
          <p className="mt-1.5 text-[12px] text-gray-400 dark:text-neutral-500">
            Supports .mp3, .wav, .ogg, .flac, .m4a
          </p>
        </div>
        <div>
          <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            Title (optional)
          </label>
          <input
            type="text"
            value={audioData.title || ''}
            onChange={(e) => onUpdate?.({ ...audioData, title: e.target.value })}
            className="w-full px-3 py-2 text-[14px] bg-white dark:bg-neutral-800
              border border-gray-200 dark:border-neutral-700 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Audio title"
          />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            Caption (optional)
          </label>
          <input
            type="text"
            value={audioData.caption || ''}
            onChange={(e) => onUpdate?.({ ...audioData, caption: e.target.value })}
            className="w-full px-3 py-2 text-[14px] bg-white dark:bg-neutral-800
              border border-gray-200 dark:border-neutral-700 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Audio caption"
          />
        </div>
      </div>
    );
  }

  if (!audioData.url) {
    return (
      <div className="flex items-center justify-center h-24 bg-gray-100 dark:bg-neutral-800 rounded-lg">
        <div className="text-center">
          <Music size={32} className="mx-auto text-gray-300 dark:text-neutral-600 mb-1" />
          <span className="text-[13px] text-gray-400 dark:text-neutral-500">Add an audio file</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-24 bg-gray-100 dark:bg-neutral-800 rounded-lg">
        <div className="text-center">
          <Music size={32} className="mx-auto text-red-300 dark:text-red-600 mb-1" />
          <span className="text-[13px] text-red-500 dark:text-red-400">Failed to load audio</span>
        </div>
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <figure className="my-4">
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-neutral-900 dark:to-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl p-4">
        <audio
          ref={audioRef}
          src={audioData.url}
          onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
          onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
          onEnded={() => setIsPlaying(false)}
          onError={() => setError(true)}
        />

        {audioData.title && (
          <p className="text-[14px] font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Music size={16} className="text-purple-500" />
            {audioData.title}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10); }}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors"
          >
            <SkipBack size={16} />
          </button>

          <button
            onClick={togglePlay}
            className="w-10 h-10 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors shadow-md"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>

          <button
            onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10); }}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors"
          >
            <SkipForward size={16} />
          </button>

          <div className="flex-1 flex items-center gap-2">
            <span className="text-[12px] text-gray-500 dark:text-neutral-400 font-mono w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <div
              className="flex-1 h-1.5 bg-gray-200 dark:bg-neutral-700 rounded-full cursor-pointer relative group"
              onClick={handleSeek}
            >
              <div
                className="h-full bg-blue-500 rounded-full relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow" />
              </div>
            </div>
            <span className="text-[12px] text-gray-500 dark:text-neutral-400 font-mono w-10">
              {formatTime(duration)}
            </span>
          </div>

          <button
            onClick={() => {
              setIsMuted(!isMuted);
              if (audioRef.current) audioRef.current.muted = !isMuted;
            }}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </div>
      {audioData.caption && (
        <figcaption className="mt-2 text-center text-[13px] text-gray-500 dark:text-neutral-400">
          {audioData.caption}
        </figcaption>
      )}
    </figure>
  );
};

export default AudioBlock;
