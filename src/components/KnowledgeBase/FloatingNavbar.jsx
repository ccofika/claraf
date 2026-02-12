import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { useKnowledgeBase } from '../../context/KnowledgeBaseContext';

const DropdownButton = ({ dropdown, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = dropdown.options.find(o => o.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-neutral-800
          border border-gray-200 dark:border-neutral-700 rounded-lg
          hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors text-sm"
      >
        {dropdown.icon && <span>{dropdown.icon}</span>}
        <span className="font-medium text-gray-900 dark:text-white max-w-32 truncate">
          {selectedOption?.label || dropdown.label}
        </span>
        <ChevronDown
          size={14}
          className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Menu */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-neutral-900
                border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg z-50
                max-h-64 overflow-y-auto"
            >
              <div className="p-1">
                {dropdown.options.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-md
                      ${value === option.value
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800'
                      }`}
                  >
                    {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                    <span className="truncate">{option.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const FloatingNavbar = () => {
  const {
    currentPage,
    selections,
    setSelection,
    resetSelections,
    showNavbar,
    setShowNavbar
  } = useKnowledgeBase();

  if (!currentPage?.dropdowns?.length) return null;

  return (
    <div className="fixed top-5 right-6 z-50">
      <AnimatePresence mode="wait">
        {showNavbar ? (
          <motion.div
            key="navbar"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 p-2 bg-white/95 dark:bg-neutral-900/95
              backdrop-blur-md rounded-xl shadow-md border border-gray-100 dark:border-neutral-800"
          >
            {currentPage.dropdowns.map(dropdown => (
              <DropdownButton
                key={dropdown.id}
                dropdown={dropdown}
                value={selections[dropdown.id]}
                onChange={(value) => setSelection(dropdown.id, value)}
              />
            ))}

            <div className="w-px h-6 bg-gray-200 dark:bg-neutral-700" />

            <button
              onClick={resetSelections}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-neutral-400
                dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg"
              title="Reset to defaults"
            >
              <RotateCcw size={14} />
            </button>

            <button
              onClick={() => setShowNavbar(false)}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-neutral-400
                dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg"
              title="Hide filters"
            >
              <EyeOff size={14} />
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="toggle"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setShowNavbar(true)}
            className="p-2 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md rounded-lg
              shadow-md border border-gray-100 dark:border-neutral-800
              text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            title="Show filters"
          >
            <Eye size={16} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FloatingNavbar;
