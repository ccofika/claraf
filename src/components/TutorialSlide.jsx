import React from 'react';
import { Play } from 'lucide-react';

const TutorialSlide = ({ title, description, videoPlaceholder, Icon, videoSrc }) => {
  return (
    <div className="flex w-full h-full items-center justify-center gap-12 px-20 animate-in fade-in duration-700">
      {/* Description Panel - Floating (40% width) */}
      <div className="w-[40%] flex flex-col justify-center animate-in slide-in-from-left duration-700 delay-100">
        {/* Centered Content Container - Floating */}
        <div className="space-y-6">
          {/* Icon - Floating with glow - Staggered animation */}
          {Icon && (
            <div className="inline-block animate-in fade-in slide-in-from-bottom duration-500 delay-200">
              <Icon
                className="w-14 h-14 text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.4)] transition-transform duration-300 hover:scale-110"
                strokeWidth={1.5}
              />
            </div>
          )}

          {/* Title - Floating - Staggered animation - 20% smaller */}
          <h2 className="text-4xl font-bold text-white leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)] animate-in fade-in slide-in-from-bottom duration-600 delay-300">
            {title}
          </h2>

          {/* Description - Floating - Staggered animation - 20% smaller - Enhanced animation */}
          <div className="text-sm leading-relaxed text-white/90 whitespace-pre-line drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] animate-in fade-in slide-in-from-bottom zoom-in-95 duration-700 delay-400">
            {description}
          </div>
        </div>
      </div>

      {/* Video Panel - Floating (60% width) - Square-ish aspect ratio */}
      <div className="w-[60%] h-full flex items-center justify-center animate-in slide-in-from-right duration-700 delay-100">
        <div className="w-full h-full flex items-center justify-center">
          {videoSrc ? (
            // Display actual video - autoplay, loop, muted
            <video
              src={videoSrc}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-contain"
            />
          ) : videoPlaceholder ? (
            <div className="text-center space-y-6 flex flex-col items-center animate-in fade-in zoom-in-50 duration-600 delay-500">
              <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 transition-all duration-300 hover:bg-white/20 hover:scale-110 group">
                <Play className="w-12 h-12 text-white/80 transition-all duration-300 group-hover:text-white group-hover:scale-110" fill="currentColor" />
              </div>
              <p className="text-base text-white/70 font-medium transition-colors duration-300">
                {videoPlaceholder}
              </p>
            </div>
          ) : (
            <div className="text-center space-y-6 flex flex-col items-center animate-in fade-in zoom-in-50 duration-600 delay-500">
              <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 transition-all duration-300 hover:bg-white/20 hover:scale-110 group">
                <Play className="w-12 h-12 text-white/80 transition-all duration-300 group-hover:text-white group-hover:scale-110" fill="currentColor" />
              </div>
              <p className="text-base text-white/70 font-medium transition-colors duration-300">
                Video demonstration
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorialSlide;
