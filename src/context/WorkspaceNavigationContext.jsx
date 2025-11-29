import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const WorkspaceNavigationContext = createContext();

export const useWorkspaceNavigation = () => {
  const context = useContext(WorkspaceNavigationContext);
  if (!context) {
    throw new Error('useWorkspaceNavigation must be used within WorkspaceNavigationProvider');
  }
  return context;
};

export const WorkspaceNavigationProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const openNavigation = useCallback(() => {
    if (user) {
      setIsOpen(true);
    }
  }, [user]);

  const closeNavigation = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleNavigation = useCallback(() => {
    if (user) {
      setIsOpen(prev => !prev);
    }
  }, [user]);

  // Global keyboard shortcut: Alt+F
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Alt+F
      if (e.altKey && e.key.toLowerCase() === 'f') {
        // Don't trigger if user is typing in an input/textarea
        const activeElement = document.activeElement;
        const isTyping = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.isContentEditable
        );

        if (!isTyping) {
          e.preventDefault();
          toggleNavigation();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleNavigation]);

  const value = {
    isOpen,
    openNavigation,
    closeNavigation,
    toggleNavigation,
  };

  return (
    <WorkspaceNavigationContext.Provider value={value}>
      {children}
    </WorkspaceNavigationContext.Provider>
  );
};
