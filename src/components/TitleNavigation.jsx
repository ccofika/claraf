import React, { useMemo, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

const TitleNavigation = ({ elements = [], onTitleClick, isSidebarCollapsed = false }) => {
  const { theme } = useTheme();
  const scrollContainerRef = useRef(null);

  // Filter and sort title elements (newest to oldest)
  const titleElements = useMemo(() => {
    return elements
      .filter(el => el.type === 'title')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [elements]);

  // Calculate left margin based on sidebar state
  // IconNav (64px) + Sidebar (64px collapsed / 320px expanded) + spacing
  const leftMargin = isSidebarCollapsed ? 148 : 404; // in pixels (added 20px spacing)

  // Enable horizontal scrolling with mouse wheel
  const handleWheel = (e) => {
    if (scrollContainerRef.current && Math.abs(e.deltaY) > 0) {
      e.preventDefault();
      scrollContainerRef.current.scrollLeft += e.deltaY * 0.8;
    }
  };

  // Extract first 3 words from title
  const getPreviewText = (element) => {
    const value = element?.content?.value || 'Untitled';

    // Strip HTML tags
    const tmp = document.createElement('div');
    tmp.innerHTML = value;
    const text = tmp.textContent || tmp.innerText || 'Untitled';

    // Get first 3 words
    const words = text.trim().split(/\s+/).slice(0, 3);
    return words.join(' ');
  };

  const handleTitleClick = (element) => {
    onTitleClick?.(element);
  };

  if (titleElements.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 right-[150px] z-40"
      style={{
        left: `${leftMargin}px`,
      }}
    >
      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        onWheel={handleWheel}
        className="title-navigation-scroll flex gap-1 overflow-x-auto overflow-y-hidden cursor-default"
        style={{
          scrollbarWidth: 'thin',
          maxWidth: `calc(100vw - ${leftMargin}px - 150px - 32px)`, // viewport - left margin - minimap+margin - padding
          scrollBehavior: 'smooth',
          paddingBottom: '3px',
        }}
      >
        {titleElements.map((element) => (
          <button
            key={element._id}
            onClick={() => handleTitleClick(element)}
            className="
              flex-shrink-0
              px-1.5 py-1
              rounded-md
              text-[10px] font-medium
              text-white
              bg-white/25
              border border-white/30
              hover:bg-white/35
              hover:border-white/40
              transition-all duration-200
              whitespace-nowrap
              cursor-pointer
            "
            title={getPreviewText(element)}
          >
            {getPreviewText(element)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TitleNavigation;
