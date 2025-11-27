import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const WheelNavigationContext = createContext();

export const useWheelNavigation = () => {
  const context = useContext(WheelNavigationContext);
  if (!context) {
    throw new Error('useWheelNavigation must be used within WheelNavigationProvider');
  }
  return context;
};

export const WheelNavigationProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const openWheel = useCallback(() => {
    if (user) {
      setIsOpen(true);
    }
  }, [user]);

  const closeWheel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleWheel = useCallback(() => {
    if (user) {
      if (isOpen) {
        // Let the component handle the close animation
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    }
  }, [user, isOpen]);

  // Global keyboard shortcut: Alt+N
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Alt+N
      if (e.altKey && e.key.toLowerCase() === 'n') {
        // Don't trigger if user is typing in an input/textarea
        const activeElement = document.activeElement;
        const isTyping = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.isContentEditable
        );

        if (!isTyping) {
          e.preventDefault();
          toggleWheel();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleWheel]);

  const value = {
    isOpen,
    openWheel,
    closeWheel,
    toggleWheel,
  };

  return (
    <WheelNavigationContext.Provider value={value}>
      {children}
    </WheelNavigationContext.Provider>
  );
};
