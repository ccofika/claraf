import React, { useState } from 'react';
import { Type, FileText, Wrench, BookOpen } from 'lucide-react';

const DockBar = ({ onItemClick }) => {
  const [hoveredItem, setHoveredItem] = useState(null);

  const dockItems = [
    { id: 'title', icon: <Type size={20} />, label: 'Title' },
    { id: 'description', icon: <FileText size={20} />, label: 'Description' },
    { id: 'macro', icon: <Wrench size={20} />, label: 'Macro' },
    { id: 'example', icon: <BookOpen size={20} />, label: 'Example' },
  ];

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50">
      <div className="relative">
        {/* Dock Container */}
        <div
          className={`
            flex flex-col items-center gap-3 px-4 py-6
            rounded-2xl
            bg-black/40 dark:bg-black/40 backdrop-blur-xl
            border border-white/10
            shadow-2xl
            transition-all duration-500 ease-out
            ${hoveredItem ? 'scale-105' : ''}
          `}
        >
          {dockItems.map((item) => (
            <div
              key={item.id}
              className="relative group"
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div
                className={`
                  relative flex items-center justify-center
                  w-11 h-11 rounded-lg
                  bg-white/5 backdrop-blur-[2px]
                  border border-white/10
                  transition-all duration-300 ease-out
                  cursor-pointer
                  shadow-none
                  ${hoveredItem === item.id
                    ? 'scale-110 bg-white/10 border-white/20 -translate-x-1 shadow-lg shadow-white/10'
                    : 'hover:scale-105 hover:bg-white/7 hover:-translate-x-0.5'
                  }
                `}
                onClick={() => onItemClick?.(item.id)}
                style={{
                  boxShadow: hoveredItem === item.id
                    ? '0 4px 24px 0 rgba(255,255,255,0.08)'
                    : undefined,
                  transitionProperty: 'box-shadow, transform, background, border-color'
                }}
              >
                <div
                  className={`
                    text-white transition-all duration-300
                    ${hoveredItem === item.id ? 'scale-105 drop-shadow-[0_1px_4px_rgba(255,255,255,0.10)]' : ''}
                  `}
                >
                  {item.icon}
                </div>
              </div>

              {/* Tooltip */}
              <div
                className={`
                  absolute right-full top-1/2 transform -translate-y-1/2 mr-3
                  px-2.5 py-1 rounded-md
                  bg-black/70 backdrop-blur
                  text-white text-xs font-normal
                  border border-white/5
                  transition-all duration-200
                  pointer-events-none
                  whitespace-nowrap
                  ${hoveredItem === item.id
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 translate-x-1'
                  }
                  shadow-sm
                `}
              >
                {item.label}
                <div className="absolute left-full top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-black/70 rotate-45 border-r border-b border-white/5"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reflection Effect */}
        <div className="absolute left-full top-0 bottom-0 w-16 overflow-hidden">
          <div
            className={`
              flex flex-col items-center gap-3 px-4 py-6
              rounded-2xl
              bg-black/20 backdrop-blur-xl
              border border-white/5
              opacity-30
              transform scale-x-[-1]
              transition-all duration-500 ease-out
              ${hoveredItem ? 'scale-105 scale-x-[-1.05]' : ''}
            `}
          >
            {dockItems.map((item) => (
              <div
                key={`reflection-${item.id}`}
                className={`
                  flex items-center justify-center
                  w-12 h-12 rounded-xl
                  bg-white/5
                  transition-all duration-300 ease-out
                  ${hoveredItem === item.id
                    ? 'scale-125 -translate-x-2'
                    : ''
                  }
                `}
              >
                <div className="text-white/50">
                  {item.icon}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DockBar;
