import React, { useState, useRef, useEffect } from 'react';
import { Edit3, Eye, Send } from 'lucide-react';

const ViewModeDropdown = ({ currentMode = 'view', onModeChange, canEditContent = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Define modes with icons
  const modes = [
    {
      id: 'edit',
      label: 'Edit',
      icon: Edit3,
      color: 'text-blue-600 dark:text-blue-400',
      requiresEdit: true
    },
    {
      id: 'view',
      label: 'View',
      icon: Eye,
      color: 'text-green-600 dark:text-green-400',
      requiresEdit: false
    },
    {
      id: 'post-view',
      label: 'Post View',
      icon: Send,
      color: 'text-purple-600 dark:text-purple-400',
      requiresEdit: false
    }
  ];

  // Filter modes based on permissions
  const availableModes = modes.filter(mode =>
    !mode.requiresEdit || (mode.requiresEdit && canEditContent)
  );

  // Get current mode details
  const currentModeDetails = modes.find(m => m.id === currentMode) || modes[1]; // Default to view
  const CurrentIcon = currentModeDetails.icon;

  const handleModeSelect = (modeId) => {
    onModeChange(modeId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Button - Increased size */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-gray-200 dark:border-neutral-800 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
      >
        <CurrentIcon
          size={14}
          className={`${currentModeDetails.color} transition-colors`}
        />
        <svg
          className={`w-3 h-3 text-gray-600 dark:text-neutral-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu - Compact and aligned with button */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-1.5 w-44 bg-white dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-lg shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {availableModes.map((mode) => {
            const Icon = mode.icon;
            const isActive = mode.id === currentMode;

            return (
              <button
                key={mode.id}
                onClick={() => handleModeSelect(mode.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 transition-all duration-150 ${
                  isActive
                    ? 'bg-gray-100 dark:bg-neutral-900'
                    : 'hover:bg-gray-50 dark:hover:bg-neutral-900/50'
                }`}
              >
                <Icon
                  size={14}
                  className={`${
                    isActive
                      ? mode.color
                      : 'text-gray-400 dark:text-neutral-600'
                  } transition-colors`}
                />
                <span
                  className={`text-xs font-medium ${
                    isActive
                      ? 'text-gray-900 dark:text-neutral-100'
                      : 'text-gray-600 dark:text-neutral-400'
                  }`}
                >
                  {mode.label}
                </span>
                {isActive && (
                  <svg
                    className="w-3.5 h-3.5 ml-auto text-blue-600 dark:text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ViewModeDropdown;
